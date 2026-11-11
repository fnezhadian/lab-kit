# no-hardcoded-password: what it can not catch

Added with Episode 4 (`kit-linter-episode4`). Every case below is checked by `tests/no-hardcoded-password.limits.test.js`: the rule stays quiet on all of them today.

A rule is one layer of defense. It mitigates the risk, it does not remove it.

| Limit | Example | Why | What to use too |
| --- | --- | --- | --- |
| A password in a file that ESLint does not read | `.env`, `.json`, `.yml` committed to Git | The rule only reads the code files that ESLint checks. | A secrets scanner (planned for Lab Kit), GitHub secret scanning and push protection, `.gitignore` for `.env` |
| An innocent name | `const x = "hunter2"` | A password has no shape, so without a password-like name the rule has no reason to look twice. | Better names, a secrets scanner |
| A passphrase with spaces | `const password = "correct horse battery staple"` | Text with spaces looks like a label, and the rule stays quiet on labels to avoid false alarms. | Code review, a secrets scanner |
| A password built with a variable | `"hunter" + year` | The value is only known when the code runs. | Code review |
| An encoded password | `atob("aHVudGVyMg==")` | The string is decoded when the code runs, and a function call is not a plain string. | A secrets scanner |
| A password built with `join()` | `["hun", "ter2"].join("")` | The rule joins pieces written with `+`. It does not run `join()` or other calls. | A secrets scanner |
| A password in a comment | `// password = hunter2` | ESLint does not give comments to a rule as strings. | Code review, a secrets scanner |

## Other layers

- Do not put the password in the code: use environment variables or a secret manager.
- Rotate a password that was ever committed. Git remembers.
- Prefer no password at all: managed identities, tokens that expire, passkeys.
- Use a secrets scanner and push protection, so a leaked password is stopped before it goes live.

Together, that is defense in depth: each layer covers what the one before it can miss.
