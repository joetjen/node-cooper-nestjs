# Contributing to cooper-nestjs

Thanks for considering a contribution. This document covers what you
need to know before opening an issue or a pull request.

## Getting started

`cooper` and `cooper-config` are not published yet, so check out
[`node-cooper`](https://github.com/joetjen/node-cooper) and
[`node-cooper-config`](https://github.com/joetjen/node-cooper-config)
next to this repository first. `package.json` depends on
`cooper-config` as `file:../node-cooper-config`.

```sh
git clone <node-cooper repository> node-cooper
git clone <node-cooper-config repository> node-cooper-config
git clone <this repository> node-cooper-nestjs
cd node-cooper-config && npm install && cd ..
cd node-cooper-nestjs
npm install
npm test
```

That should complete with no failures on a clean checkout. If it
doesn't, please open an issue before doing anything else; that's a bug
in its own right.

## Project layout

- `src/cooper-nestjs.js`: the public API (`CooperConfigModule`,
  `CooperConfig`, `InjectCooper`, `getCooperToken`, `version`).
- `src/load.js`: when the configuration is loaded, and with what.
- `types/cooper-nestjs.d.ts`: the TypeScript declarations;
  `test/types/usage.ts` is compiled against them.
- `test/`: one spec per concern, plus `test/support/project.js` for
  throwaway projects.

## Making a change

1. **Tests first.** Write a failing test whose name reads as a sentence,
   then make it pass.
2. **Keep the boundary.** Loading, converting and reading belong to
   `cooper-config`; if a change needs one of them to behave
   differently, it goes there.
3. **Check NestJS 11 too:**

   ```sh
   npm install --no-save @nestjs/common@^11 @nestjs/core@^11 @nestjs/testing@^11 @nestjs/config@^4
   npm test
   npm ci
   ```

4. **Run the full verification pass before opening a PR:**

   ```sh
   npm run precommit
   npm run docs
   ```

## Commits and branches

This project uses [git flow](https://nvie.com/posts/a-successful-git-branching-model/)
(`feature/*` branches off `develop`) and
[Conventional Commits](https://www.conventionalcommits.org/). Add a line
under `[Unreleased]` in `CHANGELOG.md` for any user-facing change.

## Reporting bugs

Please include the smallest CASC document and module setup that
reproduce the problem, the options you passed, the NestJS and
`@nestjs/config` versions, what you expected, and what happened. If the
problem is in how the document itself loads, it probably belongs to
`node-cooper` or `node-cooper-config`.
