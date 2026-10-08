import 'reflect-metadata';
import { expect } from 'chai';
import { Injectable, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as cooperConfig from '@joetjen/cooper-config';
import { CooperConfigModule, CooperConfig, InjectCooper, getCooperToken } from '../src/cooper-nestjs.js';
import { project, cleanup, hermetic, HEADER } from './support/project.js';

/**
 * `CooperConfigModule.forRoot()`: the configuration loaded once, read
 * through `ConfigService`, `CooperConfig`, or a block injected on its own.
 */

describe('CooperConfigModule.forRoot()', () => {
  /** @type {import('@nestjs/testing').TestingModule | undefined} */
  let moduleRef;

  afterEach(async () => {
    await moduleRef?.close();
    moduleRef = undefined;
    cleanup();
  });

  /**
   * A compiled testing module importing `forRoot()` for a project holding
   * `document`, plus whatever `metadata` adds.
   * @param {string} document
   * @param {{providers?: any[], imports?: any[]}} [metadata]
   * @param {object} [options]
   */
  async function compiled(document, metadata = {}, options = {}) {
    const root = project({ 'config/config.casc': HEADER + document });
    moduleRef = await Test.createTestingModule({
      imports: [CooperConfigModule.forRoot(hermetic({ root, ...options })), ...(metadata.imports ?? [])],
      providers: metadata.providers ?? [],
    }).compile();
    return moduleRef;
  }

  /**
   * What compiling a module importing `forRoot(options)` rejects with.
   * @param {object} options
   */
  async function failureOf(options) {
    try {
      moduleRef = await Test.createTestingModule({ imports: [CooperConfigModule.forRoot(options)] }).compile();
    } catch (err) {
      return err;
    }
    return undefined;
  }

  it('loads the project configuration, and ConfigService reads it by path', async () => {
    const ref = await compiled('db { host = "db.internal", pool { size = 10 } }');
    const config = ref.get(ConfigService);
    expect(config.get('db.host')).to.equal('db.internal');
    expect(config.get('db.pool.size')).to.equal(10);
    expect(config.get('db')).to.deep.equal({ host: 'db.internal', pool: { size: 10 } });
  });

  it('is what ConfigService answers getOrThrow and a fallback from', async () => {
    const config = (await compiled('db { host = "db.internal" }')).get(ConfigService);
    expect(config.getOrThrow('db.host')).to.equal('db.internal');
    expect(config.get('db.port', 5432)).to.equal(5432);
    expect(() => config.getOrThrow('db.port')).to.throw('db.port');
  });

  it('hands values over converted: byte sizes in bytes, durations in milliseconds', async () => {
    const config = (await compiled('http { body_limit = 1MiB, timeout = 30s }')).get(ConfigService);
    expect(config.get('http')).to.deep.equal({ body_limit: 1048576, timeout: 30000 });
  });

  it('injects one top-level block on its own with @InjectCooper()', async () => {
    class Repository {
      /** @param {any} db */
      constructor(db) {
        this.db = db;
      }
    }
    Injectable()(Repository);
    InjectCooper('db')(Repository, undefined, 0);
    const ref = await compiled('db { host = "db.internal" }', { providers: [Repository] });
    expect(ref.get(Repository).db).to.deep.equal({ host: 'db.internal' });
  });

  it('provides each block under getCooperToken(name)', async () => {
    const ref = await compiled('db { host = "db.internal" }\nmail { from = "noreply@example.com" }');
    expect(ref.get(getCooperToken('db'))).to.deep.equal({ host: 'db.internal' });
    expect(ref.get(getCooperToken('mail'))).to.deep.equal({ from: 'noreply@example.com' });
  });

  it('provides CooperConfig, which reads the way cooper-config does', async () => {
    const reader = (await compiled('db { host = "db.internal", replica = nil }')).get(CooperConfig);
    expect(reader.get('db.host')).to.equal('db.internal');
    expect(reader.get('db.port', 5432)).to.equal(5432);
    expect(reader.require('db.host')).to.equal('db.internal');
    expect(() => reader.require('db.port')).to.throw(cooperConfig.CooperConfigError, 'db.port');
    expect(reader.has('db.replica')).to.equal(true);
    expect(Object.isFrozen(reader.all())).to.equal(true);
  });

  it('is global: a module that never imports it still gets all three', async () => {
    class Consumer {
      /**
       * @param {ConfigService} config
       * @param {CooperConfig} reader
       * @param {any} db
       */
      constructor(config, reader, db) {
        this.seen = [config.get('db.host'), reader.get('db.host'), db.host];
      }
    }
    Injectable()(Consumer);
    Reflect.defineMetadata('design:paramtypes', [ConfigService, CooperConfig, Object], Consumer);
    InjectCooper('db')(Consumer, undefined, 2);
    class FeatureModule {}
    Module({ providers: [Consumer] })(FeatureModule);
    const ref = await compiled('db { host = "db.internal" }', { imports: [FeatureModule] });
    expect(ref.get(Consumer).seen).to.deep.equal(['db.internal', 'db.internal', 'db.internal']);
  });

  it('leaves .env to cooper: @nestjs/config reads no .env file and sets no environment variable', async () => {
    const root = project({ 'config/config.casc': HEADER + 'app { from_dotenv = ${FROM_DOTENV:none} }', '.env': 'FROM_DOTENV=yes\n' });
    process.chdir(root);
    moduleRef = await Test.createTestingModule({
      imports: [CooperConfigModule.forRoot({ root, env: { COOPER_ENV: 'test' } })],
    }).compile();
    const config = moduleRef.get(ConfigService);
    expect(config.get('app.from_dotenv')).to.equal('yes');
    expect(config.get('FROM_DOTENV')).to.equal(undefined);
    expect(process.env.FROM_DOTENV).to.equal(undefined);
  });

  it('rejects compile() with cooper-config\'s error when the document does not load', async () => {
    const root = project({ 'config/config.casc': HEADER + 'db { host = }' });
    const failure = await failureOf(hermetic({ root }));
    expect(failure).to.be.an.instanceOf(cooperConfig.CooperConfigError);
    expect(/** @type {Error} */ (failure).message).to.contain('config.casc');
  });

  it('refuses an option cooper-config does not know', async () => {
    const root = project({ 'config/config.casc': HEADER + 'db {}' });
    const failure = await failureOf(hermetic({ root, isGlobal: true }));
    expect(failure).to.be.an.instanceOf(TypeError);
    expect(/** @type {Error} */ (failure).message).to.contain('isGlobal');
  });

  it('given no options, reads a configuration already loaded instead of loading again', async () => {
    const root = project({ 'config/config.casc': HEADER + 'db { host = "loaded before" }' });
    cooperConfig.load(hermetic({ root }));
    moduleRef = await Test.createTestingModule({ imports: [CooperConfigModule.forRoot()] }).compile();
    expect(moduleRef.get(ConfigService).get('db.host')).to.equal('loaded before');
  });

  it('given options, loads with them even when a configuration is already loaded', async () => {
    const before = project({ 'config/config.casc': HEADER + 'db { host = "before" }' });
    cooperConfig.load(hermetic({ root: before }));
    const ref = await compiled('db { host = "after" }');
    expect(ref.get(ConfigService).get('db.host')).to.equal('after');
  });
});
