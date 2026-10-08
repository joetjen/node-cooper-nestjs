import { createRequire } from 'node:module';
import { expect } from 'chai';
import * as esm from '../src/cooper-nestjs.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

/**
 * The package is an ES module, because NestJS 12 is one. A CommonJS
 * application -- a NestJS 11 app compiled from TypeScript, typically --
 * reaches it through `require()`, which loads an ES module from Node.js
 * 20.19 and 22.12 on.
 */

describe('public API: entry points', () => {
  const NAMES = ['CooperConfigModule', 'CooperConfig', 'InjectCooper', 'getCooperToken', 'version'];

  it('exports exactly the public API', () => {
    expect(Object.keys(esm).sort()).to.deep.equal([...NAMES].sort());
  });

  it('require() gives a CommonJS application the same objects', () => {
    const cjs = require('../src/cooper-nestjs.js');
    for (const name of NAMES) expect(cjs[name], name).to.equal(/** @type {any} */ (esm)[name]);
  });

  it('version is the one in package.json', () => {
    expect(esm.version).to.equal(pkg.version);
  });
});
