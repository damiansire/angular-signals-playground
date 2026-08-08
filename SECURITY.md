# Security Policy

## Scope

This is a static, client-side teaching playground published to GitHub Pages. It
has no backend, no accounts, no authentication and no user data: everything runs
in your browser, and the only thing it persists is a cart demo's quantities in
`localStorage`. That keeps the realistic attack surface small, and worth being
explicit about rather than implying more than there is.

What is still worth reporting:

- A dependency vulnerability that reaches the shipped bundle.
- Anything that lets page content execute code it should not (for example, a
  demo that renders user-controlled input as markup).
- A supply-chain problem in the build or release workflows.

## Supported versions

Only the current `master`, which is what the published site serves. There are no
released versions to back-port to.

## Reporting

Please report privately through GitHub's
[security advisories](https://github.com/damiansire/angular-signals-playground/security/advisories/new)
rather than opening a public issue.

Expect an acknowledgement within a few days. This is a personal project
maintained in spare time, so please size your expectations accordingly: there is
no on-call rotation behind it.
