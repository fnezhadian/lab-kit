# no-hardcoded-api-key: what it can not catch

Added with Episode 2 (`kit-linter-episode2`). Every case below is checked by `tests/no-hardcoded-api-key.limits.test.js`: the rule stays quiet on all of them today.

A rule is one layer of defense. It mitigates the risk, it does not remove it.

| Limit | Example | Why | What to use too |
| --- | --- | --- | --- |
| A key in a file that ESLint does not read | `.env`, `.json`, `.yml` committed to Git | The rule only reads the code files that ESLint checks. | A secrets scanner (planned for Lab Kit), GitHub secret scanning and push protection, `.gitignore` for `.env` |
| A key hidden in an encoded string | `const apiKey = atob("c2tf…")` | The string is decoded only when the code runs. The rule reads the text as it is written, so the call is not a plain string. | A secrets scanner that also looks at runtime and history, code review |
| An innocent name with a value in an unknown format | `const x = "a8Fk29dLq0Zx83MvB1nQ7wYt"` | The name does not look like a secret and the format is not known, so the rule has no reason to look twice. | `additionalPatterns` if your keys have a prefix, better names, a secrets scanner |
| A key built in a way the rule does not join | `["sk_", "live_…"].join("")` | The rule joins pieces written with `+`. It does not run `join()` or other calls. | A secrets scanner |
| A key in a comment | `// apiKey = a8Fk…` | ESLint does not give comments to a rule as strings. | Code review, a secrets scanner |

## Other layers

- Do not put the key in the code: use environment variables or a secret manager.
- Rotate a key that was ever committed. Git remembers.
- Use a secrets scanner and push protection, so a leaked key is stopped before it goes live.

Together, that is defense in depth: each layer covers what the one before it can miss.
