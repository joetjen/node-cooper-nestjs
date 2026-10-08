/**
 * @fileoverview The module: `CooperConfigModule.forRoot()` loads the
 * application's CASC configuration and feeds it to `@nestjs/config`.
 *
 * ```js
 * @Module({ imports: [CooperConfigModule.forRoot()] })
 * export class AppModule {}
 * ```
 *
 * **It feeds NestJS's configuration system rather than replacing it.**
 * `ConfigService` stays the way an application -- and every third-party
 * module configured through `forRootAsync({ inject: [ConfigService] })`
 * -- reads its configuration. What CASC replaces is where the values come
 * from: `.env` loading and the configuration factories. The configuration
 * itself is `cooper-config`'s, loaded once and process-wide.
 *
 * **An ES module, unlike the other Node Coopers**, because NestJS 12 is
 * one: implemented in CommonJS, this package could reach it only through
 * `require()` of an ES module, which fails the moment anything in Nest's
 * graph awaits at the top level. As an ES module it imports NestJS 11's
 * CommonJS just as well, and a CommonJS application still `require()`s it
 * from Node.js 20.19 and 22.12 on.
 */

import { createRequire } from 'node:module';
import { Inject, Module } from '@nestjs/common';
import * as cooperConfig from 'cooper-config';
import { ensureLoaded } from './load.js';

/** The installed `cooper-nestjs` package version, read from `package.json`. */
export const version = /** @type {string} */ (createRequire(import.meta.url)('../package.json').version);

/**
 * cooper-config's four readers, as a provider: for an application that
 * reads without `@nestjs/config`, or wants `require` and `has`, which
 * `ConfigService` does not have.
 */
export class CooperConfig {
  /**
   * The value at `path`, or `fallback` when there is none.
   * @param {import('../types/cooper-nestjs.js').KeyPath} path
   * @param {unknown} [fallback]
   * @returns {any} the value, deep-frozen
   */
  get(path, fallback) {
    return cooperConfig.get(/** @type {any} */ (path), fallback);
  }

  /**
   * The value at `path`, which must be there.
   * @param {import('../types/cooper-nestjs.js').KeyPath} path
   * @returns {any} the value, deep-frozen
   * @throws {import('cooper-config').CooperConfigError} naming `path` when nothing is there
   */
  require(path) {
    return cooperConfig.require(/** @type {any} */ (path));
  }

  /**
   * Whether anything -- `null` included -- is at `path`.
   * @param {import('../types/cooper-nestjs.js').KeyPath} path
   * @returns {boolean}
   */
  has(path) {
    return cooperConfig.has(/** @type {any} */ (path));
  }

  /**
   * The whole configuration, deep-frozen.
   * @returns {Readonly<Record<string, any>>}
   */
  all() {
    return cooperConfig.all();
  }
}

/**
 * The injection token a top-level block is provided under, named the way
 * NestJS names its own (`getConfigToken`, `getRepositoryToken`).
 * @param {string} block -- a top-level key of the document
 * @returns {string}
 * @throws {TypeError} for a block name that is not a non-empty string
 */
export function getCooperToken(block) {
  if (typeof block !== 'string' || block === '') {
    throw new TypeError(`a cooper block is named by a non-empty string, not ${JSON.stringify(block) ?? String(block)}`);
  }
  return `COOPER_CONFIG(${block})`;
}

/**
 * Injects one top-level block of the configuration:
 * `constructor(@InjectCooper('db') db) {}`.
 * @param {string} block
 * @returns {PropertyDecorator & ParameterDecorator}
 */
export function InjectCooper(block) {
  return Inject(getCooperToken(block));
}

/** The module `forRoot()` configures. */
export class CooperConfigModule {
  /**
   * Loads the configuration and provides it, globally: to `ConfigService`
   * when `@nestjs/config` is installed, as `CooperConfig`, and each
   * top-level block under `getCooperToken(name)`.
   *
   * Its options are cooper-config's load options. Given none, it reads a
   * configuration already loaded, and loads the defaults only when there
   * is none. **A document that does not load rejects**, as
   * `@nestjs/config`'s own `forRoot()` does, so `NestFactory.create()`
   * does and the application never starts.
   *
   * `@nestjs/config` is given the configuration with `ignoreEnvFile`, so
   * `.env` files are cooper's alone -- read for `${...}`, never copied
   * into `process.env`.
   *
   * @param {import('../types/cooper-nestjs.js').CooperNestOptions} [options]
   * @returns {Promise<import('@nestjs/common').DynamicModule>}
   */
  static async forRoot(options) {
    ensureLoaded(options);
    const config = cooperConfig.all();
    const blocks = Object.keys(config).map((name) => ({ provide: getCooperToken(name), useValue: config[name] }));
    const nestConfig = await optionalNestConfig();
    return {
      module: CooperConfigModule,
      global: true,
      imports: nestConfig === null ? [] : [nestConfig.ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => ({ ...config })] })],
      providers: [{ provide: CooperConfig, useValue: new CooperConfig() }, ...blocks],
      exports: [CooperConfig, ...blocks.map((block) => block.provide)],
    };
  }
}
Module({})(CooperConfigModule);

/**
 * `@nestjs/config`, or `null` when it is not installed. It is an optional
 * peer: only *its* absence is answered with `null`; anything else failing
 * to load -- a dependency of it missing, an error inside it -- is thrown.
 * @returns {Promise<typeof import('@nestjs/config') | null>}
 */
async function optionalNestConfig() {
  try {
    return await import('@nestjs/config');
  } catch (err) {
    const error = /** @type {NodeJS.ErrnoException} */ (err);
    if (error?.code === 'ERR_MODULE_NOT_FOUND' && String(error.message).includes("'@nestjs/config'")) return null;
    throw err;
  }
}
