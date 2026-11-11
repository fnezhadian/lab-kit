// tests/no-hardcoded-password.limits.test.js
// Ep 4: what the rule can not catch. Every case below is a password the rule stays quiet on today.
import { RuleTester } from "eslint";
import rule from "../src/rules/no-hardcoded-password.js";

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" }
});

tester.run("lab-kit/no-hardcoded-password (limits)", rule, {
  valid: [
    // an innocent name
    "const x = 'hunter2';",
    // a passphrase with spaces looks like text
    "const password = 'correct horse battery staple';",
    // a value built with a variable
    "const year = '2024'; const secretWord = 'hunter' + year;",
    // an encoded value, decoded when the code runs
    "const pwd = atob('aHVudGVyMg==');",
    // join() is not a plain string
    "const dbPassword = ['hun', 'ter2'].join('');",
    // a comment
    "// password = hunter2\nconst a = 1;"
  ],
  invalid: []
});

console.log("no-hardcoded-password limits: documented, the rule stays quiet on all of them");
