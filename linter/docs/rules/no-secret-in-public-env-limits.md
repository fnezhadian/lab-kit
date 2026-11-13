# no-secret-in-public-env: what it can not catch

Added with Episode 6 (`kit-linter-episode6`). Every case below is checked by `tests/no-secret-in-public-env.limits.test.js`: the rule stays quiet on all of them today.

A rule is one layer of defense. It mitigates the risk, it does not remove it.

| Limit | Example | Why | What to use too |
| --- | --- | --- | --- |
| A secret in a file that ESLint does not read | `VITE_API_SECRET=...` in `.env` | The rule only reads the code files that ESLint checks. | A secrets scanner (planned for Lab Kit), GitHub push protection, `.gitignore` for `.env` |
| An innocent name | `NEXT_PUBLIC_ANALYTICS_ID` holding a secret | The rule starts from the name. Without a secret word, it has no reason to look twice. | Better names, code review |
| A name built at run time | `import.meta.env[name]` | The name is only known when the code runs. | Code review |
| A copy under another name | `const env = import.meta.env; env.VITE_API_SECRET` | The rule follows the direct reads of `process.env` and `import.meta.env`, not copies. | Code review |
| A custom public prefix | `envPrefix: "MYAPP_"` in the Vite config | The rule knows the common prefixes only. | Check your build config, a bundle scan |
| A secret added by the build config | `define: { "process.env.API_SECRET": ... }` | The secret goes into the bundle from the config, not from a variable name in the code. | Check your build config, a bundle scan |
| A secret set at run time | `window.__ENV__.API_SECRET` | This is not an environment variable the rule knows. | Code review |

## Other layers

- Keep secrets on the server: the browser calls your backend, the backend calls the service.
- Search the built bundle for secrets before you deploy.
- Rotate any secret that was ever in a public variable: it is in your bundle already.
- Use a secrets scanner and push protection.

Together, that is defense in depth: each layer covers what the one before it can miss.
