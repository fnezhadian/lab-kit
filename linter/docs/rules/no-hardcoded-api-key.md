# lab-kit/no-hardcoded-api-key

Finds hardcoded API keys and secrets in your code. It checks the **value**, not only the name.

## Why

A key written in the code goes everywhere the code goes: Git, every copy of the repository, every build. In a front-end app, it is inside the JavaScript that every visitor downloads. The safest key is the key that is never in the code. This rule finds the mistake early, in the editor.

## What it checks

1. **Known key formats**, in any string: Stripe secret keys (`sk_` and `rk_`, live or test), Anthropic, OpenAI, GitHub tokens, AWS access key IDs, Slack tokens, SendGrid keys and private key blocks. A key split with `+` is joined first, so it is found too.
2. **A secret-looking name with a random-looking value.** Names such as `apiKey`, `client_secret`, `authToken`, `x-api-key` or `Authorization`. It looks at variables, object properties, class fields, assignments, default parameters, destructuring defaults, JSX props and TypeScript enum members. It also looks at both sides of `||` and `??`, and both branches of `? :`, so a fallback value after an environment variable is found.
3. **Secrets in a URL query string**: `api_key`, `apikey`, `access_token`, `auth_token`, `client_secret`, `secret`, `token` and `key`.

A value "looks random" when it is long enough (16 characters by default), has letters and digits, uses only key-like characters, is not a placeholder and has enough variety (entropy). A `Bearer`, `Basic` or `Token` prefix is removed before the check.

## What it ignores

- Values read from the environment (`process.env.X`, `import.meta.env.X`): these are not a string written in the code.
- Placeholders (`"your-api-key-here"`, `"changeme"`, `"<token>"`), short values and paths.
- Public names (`public`, `publishable`, `anon`) and names that are not the secret itself (ending in `url`, `path`, `name`, `type`, `header` and similar).
- Google `AIza...` keys. Firebase web keys are public by design.

## Options

```js
"lab-kit/no-hardcoded-api-key": ["warn", {
  minLength: 16,                       // minimum length of a value that looks like a secret (at least 8)
  allowNames: ["apiKey"],              // names that are allowed (not case sensitive)
  additionalPatterns: ["corp_[a-z0-9]{20}"]  // your own key formats (regular expressions)
}]
```

## Examples

Incorrect:

```js
const apiKey = "a8Fk29dLq0Zx83MvB1nQ7wYt";
const clientSecret = process.env.CLIENT_SECRET || "a8Fk29dLq0Zx83MvB1nQ7wYt";
fetch("/api/orders", { headers: { "x-api-key": "a8Fk29dLq0Zx83MvB1nQ7wYt" } });
fetch("https://api.example.com/data?api_key=a8Fk29dLq0Zx83MvB1nQ7wYt");
const stripe = new Stripe("sk_live_…"); // any real Stripe key format
const Page = () => <Map apiKey="a8Fk29dLq0Zx83MvB1nQ7wYt" />;
```

Correct:

```js
const apiKey = process.env.API_KEY;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const exampleKey = "your-api-key-here";
const publishableKey = "pk_live_…";
fetch("/api/orders", { headers: { Authorization: "Bearer " + userToken } });
```

## How to fix a warning

1. Move the key to an environment variable or a secret manager.
2. If the key was ever committed, **rotate it**. Git remembers.
3. In a front-end app, anything in the bundle is public, even an environment variable. Keep the secret on a server and call that server.

## Messages

- `knownKey`: Hardcoded {{type}}. Anyone who can read this code can use it. Move it to an environment variable or a secret manager, and rotate the key.
- `namedSecret`: '{{name}}' is set to a hardcoded value that looks like a secret. Read it from an environment variable or a secret manager instead.
- `urlSecret`: The '{{param}}' value in this URL looks like a hardcoded secret. Move it out of the code, and send it in a header from the server.
