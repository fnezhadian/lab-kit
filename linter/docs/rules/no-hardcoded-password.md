# lab-kit/no-hardcoded-password

Finds passwords written directly in the code.

## Why

A password in the code is readable by everyone who can read the code, and Git remembers it forever. A key has a shape (`sk_live_...`), so a rule can check the value. A password has no shape. So this rule looks at the **name** first, then at the **value**.

## What it reports

1. **A password-like name with a hardcoded value.** Names: `password`, `passwd`, `pwd`, `passphrase`, `pass` (as a whole word), and names that contain them, such as `dbPassword` or `user_password`. It works for variables, object properties, class fields, default parameters, assignments and React props.
2. **A connection string with a password**: `Server=db;User Id=sa;Password=abc123;`
3. **A URL with credentials**: `postgres://admin:abc123@db.local/app`

It also looks behind an "or" (`process.env.DB_PASSWORD || "admin123"`) and joins pieces written with `+`.

## What it leaves alone

- Values read from the environment: `process.env.DB_PASSWORD`, `import.meta.env.VITE_...`
- Empty values and very short ones (under 4 characters, see `minLength`)
- Text with spaces, such as labels and messages: `"Enter your password"`
- Placeholders: `"********"`, `"<your-password>"`, `"your-password-here"`, `"{0}"`, `"${DB_PASSWORD}"`
- The word itself (`"password"`), keys such as `"auth.password"`, and paths such as `"/forgot-password"`
- Names that are not the password: `passwordLabel`, `passwordHash`, `passwordUrl`, `bypass`, `passport`
- `<input type="password" />` and comparisons such as `field === "password"`

## Options

```js
"lab-kit/no-hardcoded-password": ["warn", {
  minLength: 4,            // shortest value to report (default 4, minimum 3)
  allowNames: ["password"] // names to allow, for example in a demo file
}]
```

## Use it with the API key rule

Both rules can warn on the same line, for example `password = "a8Fk29dLq0Zx83MvB1nQ7wYt"`. This is fine: each rule works alone, and you can turn either one off.

## Test files

Test code often has fake passwords. Turn the rule off for those files in your config:

```js
{ files: ["**/*.test.*"], rules: { "lab-kit/no-hardcoded-password": "off" } }
```

## How to fix a warning

Read the password from an environment variable or a secret manager, never from the code. If a password was ever committed, change it: Git remembers.
