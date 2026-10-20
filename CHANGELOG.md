# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **The README opens with a warning**: under heavy development, not for
  production use before `1.0.0`. Things can and will break, and the
  specification can and will change, between any two releases until
  then. The package description says so too.

## [0.2.0] - 2026-10-19

### Changed

- Requires `@joetjen/cooper-config` 0.2 (`^0.2.0`), and through it
  `@joetjen/cooper` 0.2. Nothing this package uses changed: cooper 0.2
  adds its `cooper` executable with the conformance adapter and the
  CASC.md §9.5 error categories, and removes its old conformance corpus,
  which this package never read.

## [0.1.0] - 2026-10-08

Published as **`@joetjen/cooper-nestjs`**, beside `@joetjen/cooper`.

### Added

- Project scaffold after `node-cooper-config`: `package.json` (Node.js
  20.19+, `@nestjs/common` 11 or 12 and an optional `@nestjs/config` 4 or
  12 as peer dependencies, `@joetjen/cooper-config` ^0.1.0 as the runtime
  dependency),
  Mocha/Chai tests against a real NestJS testing module, `tsc --checkJs`
  type-checking, TypeDoc API docs, GitHub Actions for CI (NestJS 11
  tested too), docs and a monthly dependency audit, and the Apache
  License 2.0. Written as an ES module, because NestJS 12 is one.
- `CooperConfigModule.forRoot(options?)`, global: it loads the
  configuration with `cooper-config` and feeds the whole document to
  `@nestjs/config`'s `ConfigService`, with `ignoreEnvFile` so `.env`
  files are cooper's alone. Given options, it loads with them; given
  none, it reads a configuration already loaded, and loads the defaults
  only when there is none. A document that does not load rejects, so
  `NestFactory.create()` does. An unknown option is a `TypeError`.
- Each top-level block provided under `getCooperToken(name)` and
  injected with `@InjectCooper(name)`.
- `CooperConfig`, an injectable with `cooper-config`'s readers: `get`,
  `require`, `has` and `all`.
- Without `@nestjs/config` installed, `CooperConfig` and the blocks are
  still provided.
- TypeScript declarations.
