# Contributing

This is a personal teaching playground for Angular Signals. It is not a library,
and the scope is deliberately narrow, so it helps to know what fits before you
spend time on a change.

## What is welcome

- **Bug fixes.** Anything that makes a lesson teach the wrong thing is the
  highest-value contribution here: a demo that behaves differently from what its
  text claims is worse than a missing demo.
- **New lessons or sub-levels** covering the signals API surface.
- **Documentation improvements**, including fixing anything in this repo that
  says something the code no longer does.

## What is not

- **Stack changes.** Angular, signals-first, standalone components, `OnPush`
  everywhere, Tailwind for styling and Karma for tests are settled decisions.
- **Large rewrites.** Changes should read as diffs. If a change touches many
  areas at once, it is easier to review as several smaller ones.
- **Broadening the scope beyond signals.** This does not aim to cover all of
  Angular. See the non-goals in the [README](./README.md).

## Working on a change

Small, reviewable steps. Domain logic (parsers, helpers, anything under
`src/app/libs/`) is validated as a pure function over fixtures, without
`TestBed` or a browser; the screen is tested separately. If you touch domain
logic, leave a test that covers it.

Before opening a pull request, run the same gates CI runs:

```bash
npm run lint && npm run format:check && npm run gate:prosa && npm run test:scripts && npm test -- --watch=false --browsers=ChromeHeadless && npm run build
```

A couple of these are less obvious than the rest:

- **`gate:prosa`** is a ratchet on how many explanatory words each screen shows.
  The premise of the project is that the demo explains and the paragraph does
  not, so a screen is allowed to get shorter but never wordier. If your change
  adds words to an existing screen, the gate fails on purpose.
- **`test:scripts`** covers the gate scripts themselves, so the ratchet cannot
  quietly stop measuring.

Commits are conventional and in Spanish (`feat(scope): …`), with the scope taken
from the directory table in [AGENTS.md](./AGENTS.md).

## Reporting a bug

The most useful report names the screen (the URL is deep-linkable, for example
`/?nivel=8&sub-nivel=2`), what you expected the demo to show, and what it showed
instead.
