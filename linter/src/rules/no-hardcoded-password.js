// src/rules/no-hardcoded-password.js
//
// A password has no shape, so this rule starts from the NAME and then checks the VALUE.
//
// It reports a hardcoded password in three situations:
//   1. A password-like NAME (password, passwd, pwd, dbPassword, user_pass ...)
//      is set to a plain string that looks like a password.
//   2. A connection string contains  Password=...  or  Pwd=...  with a value.
//   3. A URL contains credentials:  scheme://user:password@host
//
// It does NOT report: values read from process.env / import.meta.env, empty values,
// text with spaces (labels and messages), placeholders ("********", "<your-password>"),
// the word itself ("password"), paths, keys such as "auth.password", and names like
// passwordLabel, passwordHash or passwordUrl.

// Words that make a name password-like. "pass" counts only as a whole word,
// so bypass, compass and passport are not reported.
const PASSWORD_WORD = /passw(?:or)?d|passphrase|pwd/;
// Last words that show the name is not the password itself.
const NOT_THE_PASSWORD = new Set([
  "hash", "salt", "label", "placeholder", "text", "title", "message", "msg", "error",
  "hint", "type", "field", "name", "regex", "pattern", "policy", "rule", "rules",
  "strength", "length", "url", "uri", "path", "route", "key", "id", "input", "prompt"
]);

const PLACEHOLDER =
  /^(?:your|my|example|sample|dummy|fake|replace|insert|todo|enter|type)|<[^>]*>|\$\{|\{\{|\{\d*\}|%[A-Za-z_]+%|\*{3,}|•{3,}|x{4,}|placeholder|\.{3}/i;
const THE_WORD = /^(?:passw(?:or)?d|passphrase|pwd|pass)$/i;

// Connection string:  Password=abc;  Pwd=abc;
const CONNECTION_PASSWORD = /(?:^|[;\s])(?:password|pwd)\s*=\s*([^;'"\s]+)/i;
// URL with credentials:  scheme://user:password@host
const URL_CREDENTIALS = /[a-z][a-z0-9+.-]*:\/\/[^\s:@/?#'"]+:([^\s@/?#'"]+)@/i;

function words(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

function isPasswordName(name) {
  const parts = words(name);
  if (parts.length === 0) return false;
  if (!parts.some((w) => PASSWORD_WORD.test(w) || w === "pass")) return false;
  return !NOT_THE_PASSWORD.has(parts[parts.length - 1]);
}

function looksLikePassword(value, minLength) {
  if (value.length < minLength || value.length > 100) return false;
  if (/\s/.test(value)) return false;
  if (THE_WORD.test(value)) return false;
  if (PLACEHOLDER.test(value)) return false;
  if (/^(?:\/|\.\/|\.\.\/|#|https?:\/\/)/.test(value)) return false;
  if (/\.(?:js|ts|tsx|jsx|json|css|png|svg|html|md)$/i.test(value)) return false;
  // keys and ids such as "auth.password" or "forgot-password"
  if (/^[A-Za-z]+(?:[._-][A-Za-z]+)+$/.test(value)) return false;
  return true;
}

// Returns the string when the node is a plain string known at write time, otherwise null.
function staticString(node) {
  if (!node) return null;
  switch (node.type) {
    case "Literal":
      return typeof node.value === "string" ? node.value : null;
    case "TemplateLiteral":
      return node.expressions.length === 0 ? node.quasis[0].value.cooked : null;
    case "BinaryExpression": {
      if (node.operator !== "+") return null;
      const left = staticString(node.left);
      const right = staticString(node.right);
      return left !== null && right !== null ? left + right : null;
    }
    case "TSAsExpression":
    case "TSNonNullExpression":
    case "TSSatisfiesExpression":
    case "TSTypeAssertion":
      return staticString(node.expression);
    default:
      return null;
  }
}

// Nodes that can end up as the stored value, for example both sides of  process.env.X || "abc"
function valueNodes(node) {
  if (!node) return [];
  switch (node.type) {
    case "LogicalExpression":
      return [...valueNodes(node.left), ...valueNodes(node.right)];
    case "ConditionalExpression":
      return [...valueNodes(node.consequent), ...valueNodes(node.alternate)];
    case "TSAsExpression":
    case "TSNonNullExpression":
    case "TSSatisfiesExpression":
    case "TSTypeAssertion":
    case "JSXExpressionContainer":
      return valueNodes(node.expression);
    default:
      return staticString(node) !== null ? [node] : [];
  }
}

function keyName(node) {
  if (node.computed) {
    return node.key.type === "Literal" && typeof node.key.value === "string" ? node.key.value : null;
  }
  if (node.key.type === "Identifier" || node.key.type === "PrivateIdentifier") return node.key.name;
  if (node.key.type === "Literal") return String(node.key.value);
  return null;
}

function targetName(node) {
  if (node.type === "Identifier") return node.name;
  if (node.type === "MemberExpression") {
    if (!node.computed && node.property.type === "Identifier") return node.property.name;
    if (node.computed && node.property.type === "Literal" && typeof node.property.value === "string") {
      return node.property.value;
    }
  }
  return null;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow hardcoded passwords (checks the name and the value).",
      recommended: false
    },
    messages: {
      namedPassword:
        "'{{name}}' is set to a hardcoded password. Read it from an environment variable or a secret manager instead, and change any password that was ever committed.",
      connectionString:
        "This connection string contains a hardcoded password. Move it to an environment variable or a secret manager, and build the string when the app starts.",
      urlPassword:
        "This URL contains a hardcoded password. Move it out of the code, and build the URL when the app starts."
    },
    schema: [
      {
        type: "object",
        properties: {
          minLength: { type: "integer", minimum: 3 },
          allowNames: { type: "array", items: { type: "string" } }
        },
        additionalProperties: false
      }
    ]
  },

  create(context) {
    const options = context.options[0] || {};
    const minLength = options.minLength || 4;
    const allowNames = new Set((options.allowNames || []).map((n) => n.toLowerCase()));
    const reported = new WeakSet();

    function report(node, messageId, data) {
      if (reported.has(node)) return;
      reported.add(node);
      context.report({ node, messageId, data });
    }

    // Connection strings and URLs with credentials. Works on any string.
    function checkText(node, value) {
      if (reported.has(node)) return true;
      const conn = CONNECTION_PASSWORD.exec(value);
      if (conn && looksLikePassword(conn[1], 1)) {
        report(node, "connectionString");
        return true;
      }
      const url = URL_CREDENTIALS.exec(value);
      if (url && looksLikePassword(url[1], 1)) {
        report(node, "urlPassword");
        return true;
      }
      return false;
    }

    // A password-like name that is set to a hardcoded value.
    function checkNamed(name, valueNode) {
      if (!name) return;
      for (const node of valueNodes(valueNode)) {
        const value = staticString(node);
        if (checkText(node, value)) continue;
        if (allowNames.has(name.toLowerCase())) continue;
        if (!isPasswordName(name)) continue;
        if (looksLikePassword(value, minLength)) report(node, "namedPassword", { name });
      }
    }

    return {
      VariableDeclarator(node) {
        if (node.id.type === "Identifier") checkNamed(node.id.name, node.init);
      },
      Property(node) {
        checkNamed(keyName(node), node.value);
      },
      PropertyDefinition(node) {
        checkNamed(keyName(node), node.value);
      },
      AssignmentExpression(node) {
        checkNamed(targetName(node.left), node.right);
      },
      AssignmentPattern(node) {
        if (node.left.type === "Identifier") checkNamed(node.left.name, node.right);
      },
      JSXAttribute(node) {
        if (node.name.type === "JSXIdentifier" && node.value) checkNamed(node.name.name, node.value);
      },

      // any string, no matter where it is written
      Literal(node) {
        if (typeof node.value !== "string") return;
        // a piece of "a" + "b" is checked once, as the joined string
        if (node.parent && node.parent.type === "BinaryExpression" && staticString(node.parent) !== null) return;
        checkText(node, node.value);
      },
      TemplateElement(node) {
        const target = node.parent && node.parent.expressions.length === 0 ? node.parent : node;
        checkText(target, node.value.cooked ?? node.value.raw);
      },
      // "Server=db;" + "Password=abc;"  (a string split into pieces)
      BinaryExpression(node) {
        if (node.operator !== "+") return;
        if (node.parent && node.parent.type === "BinaryExpression" && node.parent.operator === "+") return;
        const value = staticString(node);
        if (value !== null) checkText(node, value);
      }
    };
  }
};
