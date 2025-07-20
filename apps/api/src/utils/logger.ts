// Wrapper for CommonJS logger to work with ESM
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { log } = require('@tnyoffice/logger');

export { log };