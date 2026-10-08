# AGENTS.md

Instructions for AI agents working in this Node.js codebase.

`cooper-nestjs` is a NestJS module that loads an application's CASC
configuration once, at startup, with
[`cooper-config`](../node-cooper-config) (`node-cooper-config`), and
feeds it to `@nestjs/config`'s `ConfigService`. It is the NestJS
counterpart of the PHP framework adapters, `php-cooper-symfony` and
`php-cooper-laravel`, and the sibling of `node-cooper-fastify`.

## Communication

- Every response starts with the user's first name. Determine it from
  `git config user.name` (take the first name); if that's unavailable
  or ambiguous, ask once. Remember the answer for the rest of the
  session rather than re-deriving or re-asking.

## Before every commit

- Run `npm run precommit` (type-check via `tsc --checkJs --noEmit` and
  the declarations through `test/types`, then the full test suite) and
  make sure it passes. No exceptions.

## Design rules that are not up for convenience

- **Feed `@nestjs/config`, never replace it.** `ConfigService` is how a
  NestJS application, and every third-party module configured through
  it, reads configuration. CASC replaces where the values come from:
  `.env` loading (`ignoreEnvFile`) and configuration factories.
- **Eager only.** The configuration is loaded once, at startup. Never
  add lazy loading on first access, reloading, or file watching. A
  configuration error must stop the application before it does any
  work.
- **No loading or reading of its own.** Finding the file, converting
  values and the secrets policy are `cooper-config`'s; parsing is
  `cooper`'s.
- **One load rule** (`src/load.js`), the same as `cooper-fastify`'s:
  options given, load with them; none, read what is loaded; none and
  nothing loaded, load the defaults.
- **`@nestjs/config` is optional.** Only *its* absence is tolerated;
  anything else failing to load is thrown.

## Language: plain JS + JSDoc, not TypeScript -- and ES modules

- Source is plain `.js`. No `.ts` files in `src/` and no build step.
  Type safety comes from JSDoc annotations checked by
  `tsc --checkJs --noEmit`. Decorators are applied as calls
  (`Module({...})(Class)`).
- **Unlike the other Node Coopers, `src/` is ES modules, not `.cjs`
  with ESM wrappers.** NestJS 12 is ESM-only; a CommonJS implementation
  could reach it only through `require()` of an ES module, which fails
  as soon as anything in Nest's graph awaits at the top level. An ES
  module imports NestJS 11's CommonJS as well, and a CommonJS
  application `require()`s this package from Node.js 20.19/22.12 on --
  which `test/entry-points.spec.js` checks.
- `types/cooper-nestjs.d.ts` is what a TypeScript application sees, and
  `test/types/usage.ts` is compiled against it, decorators included.
  Change both with the API.

## Tests

- Tests are written first: red, then implement, then green. Test names
  read as sentences.
- Tests must stay current with behavior. A change to what code does
  needs its tests updated in the same commit.
- Tests live in `test/` and run via Mocha/Chai against a real
  `@nestjs/testing` module. Every test loads from a throwaway project
  (`test/support/project.js`) with `dotenv: false` and an explicit
  `COOPER_ENV`, so the developer's own files and environment cannot
  leak in.
- The store is process-wide. Anything that needs a fresh process -- an
  application without `@nestjs/config` -- runs a real `node` child.
- The lockfile installs NestJS 12; CI also runs the suite against
  NestJS 11 and `@nestjs/config` 4. Both majors stay supported until
  the peer range says otherwise.

## Documentation

- Every documentation surface touched by a change is part of that
  change: JSDoc, README, `guides/CHEATSHEET.md`, `CHANGELOG.md`, the
  declarations, and comments explaining non-obvious behavior.
- Every exported function and class needs a JSDoc block.
- Update `CHANGELOG.md` under `[Unreleased]` for every user-facing
  change, following [Keep a Changelog](https://keepachangelog.com/).

## Dependency boundaries

- `cooper-config` is the only runtime dependency; `@nestjs/common` and
  an optional `@nestjs/config` are peers. `cooper-config` is
  unpublished, so `package.json` depends on it as
  `file:../node-cooper-config`. CI checks it out, and `node-cooper`,
  next to this repository.

## Git workflow, commits, versioning

- [git flow](https://nvie.com/posts/a-successful-git-branching-model/):
  no direct commits to `main` or `develop`; work on `feature/*`,
  `release/*`, `hotfix/*` or `support/*`.
- [Conventional Commits](https://www.conventionalcommits.org/).
- [Semantic Versioning](https://semver.org/), bumped with
  `npm version <major|minor|patch>`.

## License

Apache-2.0. Never MIT.
