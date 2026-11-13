# lab-kit/no-secret-in-public-env

Finds secrets placed in public front-end variables.

## Why

Front-end tools copy some variables into the browser bundle, so the user can read them in the browser. These are the "public" variables: `NEXT_PUBLIC_...`, `REACT_APP_...`, `VITE_...` and others. A secret in one of them is not a secret anymore. The rule does not look at the value, it looks at the **name**: a public prefix, plus a word like `SECRET`, `TOKEN` or `PASSWORD`.

## What it reports

A public variable with a secret-looking name, in three situations:

1. **Dot access**: `process.env.NEXT_PUBLIC_API_SECRET`, `import.meta.env.VITE_API_KEY`
2. **Bracket access**: `process.env["REACT_APP_DB_PASSWORD"]`
3. **Destructuring**: `const { VITE_CLIENT_SECRET } = import.meta.env;`

Public prefixes: `NEXT_PUBLIC_`, `NUXT_PUBLIC_`, `EXPO_PUBLIC_`, `REACT_APP_`, `VUE_APP_`, `VITE_`, `GATSBY_`, `STORYBOOK_`, `PUBLIC_`.

Secret words: `secret`, `private`, `password`, `passwd`, `pwd`, `token`, `credential`, `api_key`, `access_key`, `auth_key`, `signing_key`, `service_role`.

## What it leaves alone

- Names without a public prefix: `process.env.DB_PASSWORD` and `process.env.STRIPE_SECRET_KEY` stay on the server.
- Public names without a secret word: `NEXT_PUBLIC_API_URL`, `VITE_APP_NAME`.
- Names made to be public: `publishable`, `anon`, `site key`, `public key`, `client id` (for example `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `VITE_SUPABASE_ANON_KEY`).
- Names that are not known when you write the code: `process.env[name]`.
- Names you allow with `allowNames`.

## Options

```js
"lab-kit/no-secret-in-public-env": ["warn", {
  allowNames: ["NEXT_PUBLIC_MAPBOX_TOKEN"] // public by design, for example a restricted map token
}]
```

## Use it with the other rules

The API key and password rules check values written in the code. This rule checks names read from the environment. They work on different problems, so they usually do not warn on the same line.

## How to fix a warning

Move the secret to the server: call your own backend, and let the backend use the secret. If you only need a public identifier, use a public key made for the browser. If the secret was ever put in a public variable, rotate it: it is already in your bundle.
