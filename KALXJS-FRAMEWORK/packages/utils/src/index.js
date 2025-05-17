// packages/utils/src/index.js

// Import all utility modules
import * as functionUtils from './function';
import * as objectUtils from './object';
import * as arrayUtils from './array';
import * as stringUtils from './string';
import * as domUtils from './dom';

// Export package version
export const version = '1.0.0';

// Export all utilities
export * from './function';
export * from './object';
export * from './array';
export * from './string';
export * from './dom';

// Export grouped utilities
export const fn = functionUtils;
export const obj = objectUtils;
export const arr = arrayUtils;
export const str = stringUtils;
export const dom = domUtils;