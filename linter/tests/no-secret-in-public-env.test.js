// tests/no-secret-in-public-env.test.js
import { RuleTester } from "eslint";
import rule from "../src/rules/no-secret-in-public-env.js";

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" }
});

tester.run("lab-kit/no-secret-in-public-env", rule, {
  valid: [
    "const url = process.env.NEXT_PUBLIC_API_URL;",
    "const name = import.meta.env.VITE_APP_NAME;",
    "const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;",
    "const a = import.meta.env.VITE_SUPABASE_ANON_KEY;",
    "const s = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;",
    "const db = process.env.DB_PASSWORD;",
    "const k = process.env.STRIPE_SECRET_KEY;",
    "const a = import.meta.env.MODE;",
    "const x = other.env.VITE_API_SECRET;",
    "const k = process.env[name];",
    {
      code: "const t = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;",
      options: [{ allowNames: ["NEXT_PUBLIC_MAPBOX_TOKEN"] }]
    }
  ],
  invalid: [
    { code: "const s = process.env.NEXT_PUBLIC_API_SECRET;", errors: [{ messageId: "publicSecret" }] },
    { code: "const s = process.env.REACT_APP_DB_PASSWORD;", errors: [{ messageId: "publicSecret" }] },
    { code: "const s = import.meta.env.VITE_API_KEY;", errors: [{ messageId: "publicSecret" }] },
    { code: "const s = import.meta.env['VITE_AUTH_TOKEN'];", errors: [{ messageId: "publicSecret" }] },
    { code: "const s = process.env['NEXT_PUBLIC_PRIVATE_KEY'];", errors: [{ messageId: "publicSecret" }] },
    { code: "const { VITE_CLIENT_SECRET } = import.meta.env;", errors: [{ messageId: "publicSecret" }] },
    { code: "const { REACT_APP_JWT_SECRET: s } = process.env;", errors: [{ messageId: "publicSecret" }] },
    { code: "const s = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;", errors: [{ messageId: "publicSecret" }] }
  ]
});

console.log("no-secret-in-public-env: all tests passed");
