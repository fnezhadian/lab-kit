# Lab Kit

A free box of small security tools by [Flor's Lab](https://www.youtube.com/@flordevlab). Built-in security: find the mistake early, inside your editor and your build.

Each rule comes in two episodes: one to meet it, one to challenge it. Every episode is one tag in this repository.

## How it is built

![Lab Kit architecture: the repo, the linter folder, and how a warning is produced](docs/labkit-architecture.png)

## What you need

Node.js 18+ and VS Code with the ESLint extension. Full steps are in the [linter README](linter/README.md#what-you-need). Just watching? You need nothing.

## Tools

| Tool | Folder | Status |
| --- | --- | --- |
| Linter (React and TypeScript) | [`linter/`](linter/) | Available: `eslint-plugin-lab-kit` |
| Analyzer (C#) | `analyzer/` | Planned |
| Scanner (finds secrets) | `scanner/` | Planned |

## Episodes

Tags use the pattern `kit-<tool>-episode<N>`.

| Tag | Episode |
| --- | --- |
| `kit-linter-episode1` | Hardcoded API keys: meet the rule |
| `kit-linter-episode2` | Hardcoded API keys: challenge the rule |
| `kit-linter-episode3` | Hardcoded passwords: meet the rule |
| `kit-linter-episode4` | Hardcoded passwords: challenge the rule |
| `kit-linter-episode5` | Secrets in front-end variables: meet the rule |
| `kit-linter-episode6` | Secrets in front-end variables: challenge the rule |

## License

[MIT](LICENSE)
