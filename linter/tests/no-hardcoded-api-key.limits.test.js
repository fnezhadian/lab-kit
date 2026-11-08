// tests/no-hardcoded-api-key.limits.test.js
// Episode 2: known limits. The rule stays QUIET on every case below, today.
// These tests document what the rule can not catch (see docs/rules/no-hardcoded-api-key-limits.md).
// If the rule gets better and starts to warn on one of them, move that case to the main test file.
import { RuleTester } from "eslint";
import rule from "../src/rules/no-hardcoded-api-key.js";

const join = (...parts) => parts.join("");
const STRIPE = join("sk_", "live_51HxYz1234567890abcdEFGH");
const ENCODED = Buffer.from(STRIPE).toString("base64");
const TAIL = join("live_", "51HxYz1234567890abcdEFGH");

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" }
});

tester.run("lab-kit/no-hardcoded-api-key (known limits)", rule, {
  valid: [
    // 1. encoded key, decoded only when the code runs
    `const apiKey = atob('${ENCODED}');`,
    // 2. innocent name, value in a format the rule does not know
    "const x = 'a8Fk29dLq0Zx83MvB1nQ7wYt';",
    // 3. key built with join(), not with "+"
    `const joined = ['sk_', '${TAIL}'].join('');`
  ],
  invalid: []
});

console.log("no-hardcoded-api-key limits: documented, the rule stays quiet on all of them");
