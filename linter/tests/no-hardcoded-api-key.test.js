// tests/no-hardcoded-api-key.test.js
// Test keys are built from pieces (join) so GitHub push protection does not block the commit.
import { RuleTester } from "eslint";
import rule from "../src/rules/no-hardcoded-api-key.js";

const join = (...parts) => parts.join("");
const STRIPE = join("sk_", "live_51HxYz1234567890abcdEFGH");
const OPENAI = join("sk-", "proj-abcdEFGH1234567890abcdEFGH1234567890");
const GITHUB = join("gh", "p_abcdefghijklmnopqrstuvwxyz0123456789");
const AWS = join("AK", "IAIOSFODNN7EXAMPLE");
const RANDOM = "a8Fk29dLq0Zx83MvB1nQ7wYt"; // random-looking value, not a real format

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } }
  }
});

tester.run("fn-securecode/no-hardcoded-api-key", rule, {
  valid: [
    // reading from the environment is the right way
    "const apiKey = process.env.API_KEY;",
    "const apiKey = import.meta.env.VITE_API_KEY;",
    "const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);",
    // names alone are not a problem
    "function setKey(apiKey) { return apiKey; }",
    "const API_KEY_NAME = 'API_KEY';",
    // placeholders and short values
    "const apiKey = 'your-api-key-here';",
    "const apiKey = '';",
    "const token = 'abc123';",
    // public keys and public-by-design keys
    `const publishableKey = '${join("pk_", "live_51HxYz1234567890abcdEFGH")}';`,
    "const supabaseAnonKey = 'a8Fk29dLq0Zx83MvB1nQ7wYt';",
    "const firebaseConfig = { apiKey: 'AIzaSyA1b2C3d4E5f6G7h8I9j0KlMnOpQrStUv' };",
    // paths, text, headers built from variables
    "const tokenUrl = '/api/v1/auth/token-refresh2024';",
    "const message = 'Enter your API key in the settings page 123';",
    "fetch(url, { headers: { Authorization: 'Bearer ' + token } });",
    "fetch(`${base}/data?api_key=${key}`);",
    // the option lets you allow a name
    { code: `const apiKey = '${RANDOM}';`, options: [{ allowNames: ["apiKey"] }] }
  ],

  invalid: [
    // 1. known key formats, anywhere
    { code: `const stripe = new Stripe('${STRIPE}');`, errors: [{ messageId: "knownKey" }] },
    { code: `const client = new OpenAI({ apiKey: '${OPENAI}' });`, errors: [{ messageId: "knownKey" }] },
    { code: `const t = '${GITHUB}';`, errors: [{ messageId: "knownKey" }] },
    { code: `const id = '${AWS}';`, errors: [{ messageId: "knownKey" }] },
    { code: "const pem = '-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBg';", errors: [{ messageId: "knownKey" }] },
    // key split into pieces
    { code: "const k = 'sk_' + 'live_51HxYz1234567890abcdEFGH';", errors: [{ messageId: "knownKey" }] },

    // 2. secret-looking name set to a random-looking value
    { code: `const apiKey = '${RANDOM}';`, errors: [{ messageId: "namedSecret" }] },
    { code: `const client_secret = \`${RANDOM}\`;`, errors: [{ messageId: "namedSecret" }] },
    { code: `config.apiKey = '${RANDOM}';`, errors: [{ messageId: "namedSecret" }] },
    { code: `const settings = { 'x-api-key': '${RANDOM}' };`, errors: [{ messageId: "namedSecret" }] },
    { code: `fetch(url, { headers: { Authorization: 'Bearer ${RANDOM}' } });`, errors: [{ messageId: "namedSecret" }] },
    { code: `class Api { apiKey = '${RANDOM}'; }`, errors: [{ messageId: "namedSecret" }] },
    { code: `function connect(apiKey = '${RANDOM}') {}`, errors: [{ messageId: "namedSecret" }] },
    { code: `const { apiKey = '${RANDOM}' } = config;`, errors: [{ messageId: "namedSecret" }] },
    { code: `const map = <Map apiKey="${RANDOM}" />;`, errors: [{ messageId: "namedSecret" }] },
    // fallback value after the environment variable
    { code: `const apiKey = process.env.API_KEY || '${RANDOM}';`, errors: [{ messageId: "namedSecret" }] },
    // one warning where it is written, not on every use
    {
      code: `const apiKey = '${RANDOM}'; use(apiKey); use(apiKey);`,
      errors: [{ messageId: "namedSecret" }]
    },

    // 3. secret in a URL
    { code: `fetch('https://api.example.com/data?api_key=${RANDOM}');`, errors: [{ messageId: "urlSecret" }] },

    // options
    {
      code: "const k = 'corp_abcdefghijklmnop1234';",
      options: [{ additionalPatterns: ["corp_[a-z0-9]{20}"] }],
      errors: [{ messageId: "knownKey" }]
    }
  ]
});

console.log("no-hardcoded-api-key: all tests passed");
