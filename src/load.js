/**
 * @fileoverview When the configuration is loaded, and with what -- the
 * same rule `cooper-fastify` follows:
 *
 * - **Options given: load with them**, whatever was loaded before. They
 *   are a request for that configuration.
 * - **No options: read what is loaded**, so a load the application made
 *   with `cooper-config` itself, or through `@joetjen/cooper-config/register`, is
 *   the one Nest reads.
 * - **No options and nothing loaded: load the defaults.**
 */

import * as cooperConfig from '@joetjen/cooper-config';

/**
 * Loads the configuration by the rule above.
 * @param {import('../types/cooper-nestjs.js').CooperNestOptions} [options]
 * @returns {void}
 * @throws {TypeError} for an option cooper-config does not know
 * @throws {import('@joetjen/cooper-config').CooperConfigError} when the document does not load
 */
export function ensureLoaded(options) {
  const given = options ?? {};
  if (Object.keys(given).length === 0 && isLoaded()) return;
  cooperConfig.load(/** @type {any} */ (given));
}

/**
 * Whether a configuration has been loaded in this process. `cooper-config`
 * answers that only by refusing to read before a load.
 * @returns {boolean}
 */
function isLoaded() {
  try {
    cooperConfig.all();
    return true;
  } catch (err) {
    if (err instanceof cooperConfig.CooperConfigError) return false;
    throw err;
  }
}
