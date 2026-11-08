// src/rules/no-hardcoded-api-key.js
//
// Version 2: the rule looks at VALUES, not names.
//
// It reports a hardcoded API key or secret in three situations:
//   1. The text matches a known key format (Stripe, OpenAI, Anthropic, GitHub, AWS, Slack, SendGrid, private key block).
//   2. A secret-looking NAME is set to a random-looking string value
//      (apiKey, client_secret, authToken, "x-api-key", Authorization ...).
//   3. A secret is written inside a URL query string (?api_key=...).
//
// It does NOT report: values read from process.env / import.meta.env,
// placeholders ("your-api-key-here"), short values, public keys (publishableKey,
// anonKey, NEXT_PUBLIC_...), Google "AIza" keys (Firebase web keys are public by design),
// and paths or URLs.

const KNOWN_FORMATS = [
  { type: "Stripe secret key", re: /(?<![A-Za-z0-9])[sr]k_(?:live|test)_[A-Za-z0-9]{16,}/ },
  { type: "Anthropic API key", re: /(?<![A-Za-z0-9])sk-ant-[A-Za-z0-9_-]{20,}/ },
  { type: "OpenAI API key", re: /(?<![A-Za-z0-9])sk-(?:proj-)?[A-Za-z0-9_-]{32,}/ },
  { type: "GitHub token", re: /(?<![A-Za-z0-9])gh[pousr]_[A-Za-z0-9]{36,}/ },
  { type: "AWS access key ID", re: /(?<![A-Za-z0-9])AKIA[0-9A-Z]{16}(?![A-Za-z0-9])/ },
  { type: "Slack token", re: /(?<![A-Za-z0-9])xox[abprs]-[A-Za-z0-9-]{10,}/ },
  { type: "SendGrid API key", re: /(?<![A-Za-z0-9])SG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}/ },
  { type: "private key", re: /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/ }
];

// Names that usually hold a secret.
const SECRET_NAME =
  /(?:api|secret|private|access|auth|client|service|signing|encryption)[_-]?(?:key|token|secret)|secret|passw(?:or)?d|token|credential|authorization|apikey/i;
// Names that are public by design, or are not the secret itself.
const PUBLIC_NAME = /public|publishable|anon/i;
const NOT_A_SECRET_NAME = /(?:url|uri|path|endpoint|name|type|label|header|prefix|field|regex|pattern)$/i;

const PLACEHOLDER =
  /^(?:your|my|example|sample|dummy|fake|replace|insert|todo|changeme|change[_-]me)|<[^>]*>|\$\{|\{\{|\*{3,}|x{4,}|placeholder|example/i;

const URL_SECRET_PARAM =
  /[?&;](api[_-]?key|apikey|access[_-]?token|auth[_-]?token|client[_-]?secret|secret|token|key)=([^&#\s"']+)/gi;

function entropy(text) {
  const counts = {};
  for (const ch of text) counts[ch] = (counts[ch] || 0) + 1;
  let h = 0;
  for (const ch in counts) {
    const p = counts[ch] / text.length;
    h -= p * Math.log2(p);
  }
  return h;
}

function looksLikeSecret(value, minLength) {
  if (value.length < minLength) return false;
  if (/^(?:\/|\.\/|\.\.\/|#)/.test(value)) return false;
  if (/\.(?:js|ts|tsx|jsx|json|css|png|svg|html|md)$/i.test(value)) return false;
  if (!/^[A-Za-z0-9_\-+/=.~]+$/.test(value)) return false;
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return false;
  if (PLACEHOLDER.test(value)) return false;
  if (/^AIza/.test(value)) return false;
  return entropy(value) >= 3.0;
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

// Nodes that can end up as the stored value, for example both sides of  process.env.KEY || "abc..."
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
      description: "Disallow hardcoded API keys and secrets (checks the value, not just the name).",
      recommended: false
    },
    messages: {
      knownKey:
        "Hardcoded {{type}}. Anyone who can read this code can use it. Move it to an environment variable or a secret manager, and rotate the key.",
      namedSecret:
        "'{{name}}' is set to a hardcoded value that looks like a secret. Read it from an environment variable or a secret manager instead.",
      urlSecret:
        "The '{{param}}' value in this URL looks like a hardcoded secret. Move it out of the code, and send it in a header from the server."
    },
    schema: [
      {
        type: "object",
        properties: {
          minLength: { type: "integer", minimum: 8 },
          allowNames: { type: "array", items: { type: "string" } },
          additionalPatterns: { type: "array", items: { type: "string" } }
        },
        additionalProperties: false
      }
    ]
  },

  create(context) {
    const options = context.options[0] || {};
    const minLength = options.minLength || 16;
    const allowNames = new Set((options.allowNames || []).map((n) => n.toLowerCase()));
    const extraFormats = (options.additionalPatterns || []).map((p) => ({
      type: "secret matching your pattern",
      re: new RegExp(p)
    }));
    const formats = [...KNOWN_FORMATS, ...extraFormats];
    const reported = new WeakSet();

    function report(node, messageId, data) {
      if (reported.has(node)) return;
      reported.add(node);
      context.report({ node, messageId, data });
    }

    // Known key formats and secrets inside URLs. Works on any string.
    function checkValue(node, value) {
      if (reported.has(node)) return true;
      for (const format of formats) {
        if (format.re.test(value)) {
          report(node, "knownKey", { type: format.type });
          return true;
        }
      }
      URL_SECRET_PARAM.lastIndex = 0;
      let match;
      while ((match = URL_SECRET_PARAM.exec(value)) !== null) {
        if (looksLikeSecret(match[2], 12)) {
          report(node, "urlSecret", { param: match[1] });
          return true;
        }
      }
      return false;
    }

    // A secret-looking name that is set to a hardcoded value.
    function checkNamed(name, valueNode) {
      if (!name) return;
      for (const node of valueNodes(valueNode)) {
        const value = staticString(node);
        if (checkValue(node, value)) continue;
        if (allowNames.has(name.toLowerCase())) continue;
        if (!SECRET_NAME.test(name) || PUBLIC_NAME.test(name) || NOT_A_SECRET_NAME.test(name)) continue;
        const stripped = value.replace(/^(?:Bearer|Basic|Token)\s+/i, "");
        if (looksLikeSecret(stripped, minLength)) {
          report(node, "namedSecret", { name });
        }
      }
    }

    return {
      // name = value
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
      TSEnumMember(node) {
        const name = node.id.type === "Identifier" ? node.id.name : node.id.value;
        checkNamed(name, node.initializer);
      },

      // any string, no matter where it is written
      Literal(node) {
        if (typeof node.value === "string") checkValue(node, node.value);
      },
      TemplateElement(node) {
        const target = node.parent && node.parent.expressions.length === 0 ? node.parent : node;
        checkValue(target, node.value.cooked ?? node.value.raw);
      },
      // "sk_" + "live_..." (a key split into pieces)
      BinaryExpression(node) {
        if (node.operator !== "+") return;
        if (node.parent && node.parent.type === "BinaryExpression" && node.parent.operator === "+") return;
        const value = staticString(node);
        if (value !== null) checkValue(node, value);
      }
    };
  }
};
