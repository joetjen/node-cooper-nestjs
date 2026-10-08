// Types for TypeScript applications. The implementation is JavaScript,
// checked by `tsc --checkJs`; these say what it gives a TypeScript caller.

import type { DynamicModule } from '@nestjs/common';

/** A path into the configuration: `'db.pool.size'`, or segments for a key holding a dot. */
export type KeyPath = string | readonly string[];

/** cooper-config's load options. */
export interface CooperNestOptions {
  /** The CASC file; a relative one against the project root (default `config/config.casc`). */
  path?: string;
  /** The project root (default: the directory of the nearest `package.json`). */
  root?: string;
  env?: Record<string, string>;
  dotenv?: boolean;
  dotenvEnv?: string | null;
  dotenvFiles?: string[];
  dotenvDir?: string;
  dotenvOverride?: boolean;
  resolvers?: Record<string, (...args: any[]) => unknown> | Map<string, (...args: any[]) => unknown>;
  tags?: Record<string, (argument: any) => unknown> | Map<string, (argument: any) => unknown>;
  importSchemes?: Record<string, (...args: any[]) => unknown>;
  /** What each `!module("Name")` -- and each `cooper-secrets` module name -- means. */
  modules?: Record<string, unknown> | Map<string, unknown>;
  cache?: boolean;
  watchEnv?: boolean;
}

/** The module `forRoot()` configures. */
export declare class CooperConfigModule {
  /**
   * Loads the configuration and provides it globally: to `ConfigService`,
   * as `CooperConfig`, and each top-level block under `getCooperToken(name)`.
   */
  static forRoot(options?: CooperNestOptions): Promise<DynamicModule>;
}

/** cooper-config's readers, as an injectable provider. */
export declare class CooperConfig {
  /** The value at `path`, or `fallback` when there is none. */
  get<T = any>(path: KeyPath, fallback?: T): T;
  /** The value at `path`, which must be there. */
  require<T = any>(path: KeyPath): T;
  /** Whether anything, `null` included, is at `path`. */
  has(path: KeyPath): boolean;
  /** The whole configuration, deep-frozen. */
  all(): Readonly<Record<string, any>>;
}

/** Injects one top-level block: `constructor(@InjectCooper('db') db: DbConfig) {}`. */
export declare function InjectCooper(block: string): PropertyDecorator & ParameterDecorator;

/** The injection token a top-level block is provided under. */
export declare function getCooperToken(block: string): string;

/** The installed package version. */
export declare const version: string;
