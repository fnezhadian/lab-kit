// tests/no-hardcoded-password.test.js
import { RuleTester } from "eslint";
import rule from "../src/rules/no-hardcoded-password.js";

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } }
  }
});

tester.run("lab-kit/no-hardcoded-password", rule, {
  valid: [
    // reading from the environment is the right way
    "const password = process.env.DB_PASSWORD;",
    "const password = import.meta.env.VITE_DB_PASSWORD;",
    // empty, short and placeholder values
    "const password = '';",
    "const password = 'ab';",
    "const password = '********';",
    "const password = '<your-password>';",
    "const password = 'your-password-here';",
    // the word itself, text with spaces, keys and paths
    "const passwordLabel = 'Password';",
    "const label = 'Password';",
    "const password = 'password';",
    "const message = 'Enter your password';",
    "const hint = 'Use at least 8 characters';",
    "const password = 'auth.password.required';",
    "const forgotPasswordUrl = '/forgot-password';",
    "const route = 'reset-password';",
    // names that are not a password
    "const passwordHash = 'a8Fk29dLq0Zx83MvB1nQ7wYt';",
    "const bypass = 'hunter2';",
    "const passport = 'hunter2';",
    "const x = 'hunter2';",
    // comparisons and form fields
    "if (field === 'password') {}",
    "const el = <input type='password' name='password' />;",
    // connection strings with no real value
    "const c = 'Server=db;User Id=sa;Password={0};';",
    "const c = 'Server=db;Password=${DB_PASSWORD};';",
    "const c = 'https://x.com/login?password=';",
    "const c = 'postgres://user:password@localhost/app';",
    "const c = `postgres://user:${pwd}@localhost/app`;",
    // the option lets you allow a name
    { code: "const password = 'hunter2';", options: [{ allowNames: ["password"] }] }
  ],

  invalid: [
    // 1. password-like name with a hardcoded value
    { code: "const password = 'hunter2';", errors: [{ messageId: "namedPassword" }] },
    { code: "const dbPassword = 'Sup3rS3cret!';", errors: [{ messageId: "namedPassword" }] },
    { code: "const user_password = 'letmein';", errors: [{ messageId: "namedPassword" }] },
    { code: "const pwd = 'root1234';", errors: [{ messageId: "namedPassword" }] },
    { code: "const wifiPass = 'welcome2024';", errors: [{ messageId: "namedPassword" }] },
    { code: "const user = { name: 'admin', password: 'admin123' };", errors: [{ messageId: "namedPassword" }] },
    { code: "class Db { password = 'letmein'; }", errors: [{ messageId: "namedPassword" }] },
    { code: "config.adminPassword = 'changeme';", errors: [{ messageId: "namedPassword" }] },
    { code: "function connect(pwd = 'root') {}", errors: [{ messageId: "namedPassword" }] },
    { code: "const el = <Login password='demo1234' />;", errors: [{ messageId: "namedPassword" }] },
    { code: "const password = 1 ? 'hunter2' : null;", errors: [{ messageId: "namedPassword" }] },
    // environment fallback: the real password hides behind the "or"
    { code: "const password = process.env.DB_PASSWORD || 'admin123';", errors: [{ messageId: "namedPassword" }] },
    // password split in pieces
    { code: "const password = 'hunter' + '2024';", errors: [{ messageId: "namedPassword" }] },

    // 2. connection strings
    { code: "const c = 'Server=db.local;User Id=sa;Password=P@ssw0rd1;';", errors: [{ messageId: "connectionString" }] },
    { code: "const c = 'Host=db;Username=app;Pwd=abc12345';", errors: [{ messageId: "connectionString" }] },
    { code: "const c = 'Server=db;' + 'Password=abc12345;';", errors: [{ messageId: "connectionString" }] },
    // 3. URL with credentials
    { code: "const url = 'postgres://admin:s3cr3t@db.local:5432/app';", errors: [{ messageId: "urlPassword" }] },
    { code: "const url = `mongodb://app:s3cr3t@db.local/app`;", errors: [{ messageId: "urlPassword" }] }
  ]
});

console.log("no-hardcoded-password: all tests passed");
