import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect } from 'chai';
import { project, cleanup, HEADER, PACKAGE_ROOT } from './support/project.js';

/**
 * `@nestjs/config` is an optional peer: an application without it gets
 * `CooperConfig` and the blocks, and no `ConfigService`. Run in a fresh
 * process whose module resolution cannot find the package.
 */

describe('without @nestjs/config installed', () => {
  afterEach(cleanup);

  it('still provides CooperConfig and every block, and no ConfigService', () => {
    const at = (/** @type {string} */ file) => JSON.stringify(pathToFileURL(path.join(PACKAGE_ROOT, file)).href);
    const root = project({
      'package.json': '{}',
      'config/config.casc': HEADER + 'db { host = "db.internal" }',
      // A resolve hook that answers @nestjs/config as not installed.
      'hide.mjs':
        "import { register } from 'node:module';\n" +
        "register('data:text/javascript,' + encodeURIComponent(" +
        '`export async function resolve(specifier, context, next) {\n' +
        "  if (specifier === '@nestjs/config') { const e = new Error(\"Cannot find package '@nestjs/config' imported from \" + context.parentURL); e.code = 'ERR_MODULE_NOT_FOUND'; throw e; }\n" +
        '  return next(specifier, context);\n' +
        '}`));\n',
      'app.mjs':
        `await import(${at('node_modules/reflect-metadata/Reflect.js')});\n` +
        `const { Test } = await import(${at('node_modules/@nestjs/testing/index.js')});\n` +
        `const { CooperConfigModule, CooperConfig, getCooperToken } = await import(${at('src/cooper-nestjs.js')});\n` +
        'const dynamic = await CooperConfigModule.forRoot();\n' +
        'const ref = await Test.createTestingModule({ imports: [dynamic] }).compile();\n' +
        "const service = dynamic.imports.length === 0 ? 'absent' : 'present';\n" +
        "console.log(JSON.stringify([ref.get(CooperConfig).get('db.host'), ref.get(getCooperToken('db')).host, service]));\n" +
        'await ref.close();\n',
    });
    const result = spawnSync(process.execPath, ['--import', path.join(root, 'hide.mjs'), path.join(root, 'app.mjs')], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, COOPER_ENV: 'test' },
    });
    expect(result.stderr).to.equal('');
    expect(JSON.parse(result.stdout)).to.deep.equal(['db.internal', 'db.internal', 'absent']);
  });
});
