// src/rules/no-secret-in-public-env.js
//
// Front-end tools copy "public" variables into the browser bundle, so anyone can read them.
// A secret in one of those variables is not a secret anymore. This rule starts from the NAME.
//
// It reports a secret-looking name in a public front-end variable, in three situations:
//   1. Dot access:      process.env.NEXT_PUBLIC_API_SECRET   import.meta.env.VITE_API_KEY
//   2. Bracket access:  process.env["REACT_APP_DB_PASSWORD"]
//   3. Destructuring:   const { VITE_CLIENT_SECRET } = import.meta.env;
//
// It does NOT report: names without a public prefix (process.env.DB_PASSWORD stays on the server),
// public names without a secret word (NEXT_PUBLIC_API_URL), names made to be public
// (publishable, anon, site key, public key, client id), dynamic names (process.env[name]),
// and names you allow with the allowNames option.

// Prefixes that tell the build tool to copy the variable into the browser bundle.
const PUBLIC_PREFIX =
  /^(?:next_public_|nuxt_public_|expo_public_|react_app_|vue_app_|gatsby_|storybook_|public_|vite_)/;
// Words that make a name secret-looking.
const SECRET_WORD =
  /secret|private|passw(?:or)?d|pwd|token|credential|api_?key|access_?key|auth_?key|signing_?key|service_?role/;
// Words that show the value is made to be public.
const MEANT_TO_BE_PUBLIC = /publishable|anon|site_?key|public_?key|client_?id/;

// The name without the public prefix, or null when the name is not public.
function afterPrefix(name) {
  const match = PUBLIC_PREFIX.exec(name.toLowerCase());
  return match ? name.toLowerCase().slice(match[0].length) : null;
}

function isPublicSecretName(name) {
  const rest = afterPrefix(name);
  return rest !== null && SECRET_WORD.test(rest) && !MEANT_TO_BE_PUBLIC.test(rest);
}

// process.env  or  import.meta.env
function isEnvObject(node) {
  if (!node || node.type !== "MemberExpression") return false;
  if (node.computed || node.property.type !== "Identifier" || node.property.name !== "env") return false;
  const object = node.object;
  if (object.type === "Identifier") return object.name === "process";
  return object.type === "MetaProperty" && object.meta.name === "import" && object.property.name === "meta";
}

// The variable name in  env.NAME  or  env["NAME"], otherwise null (a dynamic name).
function accessName(node) {
  if (!node.computed && node.property.type === "Identifier") return node.property.name;
  if (node.computed && node.property.type === "Literal" && typeof node.property.value === "string") {
    return node.property.value;
  }
  return null;
}

// The variable name of a destructured property, otherwise null.
function keyName(property) {
  if (property.type !== "Property") return null;
  if (!property.computed && property.key.type === "Identifier") return property.key.name;
  if (property.key.type === "Literal" && typeof property.key.value === "string") return property.key.value;
  return null;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow secrets in public front-end environment variables.",
      recommended: false
    },
    messages: {
      publicSecret:
        "'{{name}}' is a public front-end variable. It is copied into the browser bundle, so anyone can read it. Keep the secret on the server."
    },
    schema: [
      {
        type: "object",
        properties: {
          allowNames: { type: "array", items: { type: "string" } }
        },
        additionalProperties: false
      }
    ]
  },

  create(context) {
    const options = context.options[0] || {};
    const allowNames = new Set((options.allowNames || []).map((n) => n.toLowerCase()));

    function report(node, name) {
      if (!name || allowNames.has(name.toLowerCase())) return;
      if (!isPublicSecretName(name)) return;
      context.report({ node, messageId: "publicSecret", data: { name } });
    }

    return {
      // Situations 1 and 2: process.env.NAME, import.meta.env["NAME"]
      MemberExpression(node) {
        if (isEnvObject(node.object)) report(node, accessName(node));
      },

      // Situation 3: const { NAME } = import.meta.env;
      VariableDeclarator(node) {
        if (node.id.type !== "ObjectPattern" || !isEnvObject(node.init)) return;
        for (const property of node.id.properties) report(property, keyName(property));
      }
    };
  }
};
