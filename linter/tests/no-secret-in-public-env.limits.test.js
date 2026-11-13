// tests/no-secret-in-public-env.limits.test.js
// Ep 6: what the rule can not catch. Every case below is a secret the rule stays quiet on today.
import { RuleTester } from "eslint";
import rule from "../src/rules/no-secret-in-public-env.js";

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" }
});

tester.run("lab-kit/no-secret-in-public-env (limits)", rule, {
  valid: [
    // an innocent name
    "const a = process.env.NEXT_PUBLIC_ANALYTICS_ID;",
    // a name that is only known when the code runs
    "const name = 'VITE_API_SECRET'; const b = import.meta.env[name];",
    // the variable is copied to another name first
    "const env = import.meta.env; const c = env.VITE_API_SECRET;",
    // a custom public prefix
    "const d = import.meta.env.MYAPP_API_SECRET;",
    // a secret pushed into the bundle by the build config
    "const define = { 'process.env.API_SECRET': JSON.stringify(process.env.API_SECRET) };",
    // a secret set at runtime on the page
    "const e = window.__ENV__.API_SECRET;"
  ],
  invalid: []
});

console.log("no-secret-in-public-env limits: documented, the rule stays quiet on all of them");
