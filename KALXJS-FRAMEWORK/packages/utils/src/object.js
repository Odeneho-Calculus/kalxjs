// packages/utils/src/object.js

/**
 * Creates a deep clone of an object
 * 
 * @param {Object} obj The object to clone
 * @returns {Object} The cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle Date
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  // Handle Array
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  // Handle Object
  if (obj instanceof Object) {
    const copy = {};
    Object.keys(obj).forEach(key => {
      copy[key] = deepClone(obj[key]);
    });
    return copy;
  }
  
  throw new Error(`Unable to copy object: ${obj}`);
}

/**
 * Deep merges objects
 * 
 * @param {Object} target The target object
 * @param {...Object} sources The source objects
 * @returns {Object} The merged object
 */
export function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();
  
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  
  return deepMerge(target, ...sources);
}

/**
 * Creates an object with the picked object properties
 * 
 * @param {Object} obj The source object
 * @param {Array} keys The property names to pick
 * @returns {Object} The new object
 */
export function pick(obj, keys) {
  return keys.reduce((acc, key) => {
    if (obj.hasOwnProperty(key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
}

/**
 * Creates an object with properties omitted
 * 
 * @param {Object} obj The source object
 * @param {Array} keys The property names to omit
 * @returns {Object} The new object
 */
export function omit(obj, keys) {
  return Object.keys(obj)
    .filter(key => !keys.includes(key))
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
}

/**
 * Checks if value is an object
 * 
 * @param {*} value The value to check
 * @returns {boolean} Returns true if value is an object
 */
function isObject(value) {
  return value !== null && typeof value === 'object';
}

/**
 * Gets the value at path of object
 * 
 * @param {Object} obj The object to query
 * @param {string|Array} path The path to get
 * @param {*} defaultValue The value returned for undefined resolved values
 * @returns {*} The resolved value
 */
export function get(obj, path, defaultValue) {
  const keys = Array.isArray(path) ? path : path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === undefined || result === null) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result === undefined ? defaultValue : result;
}

/**
 * Sets the value at path of object
 * 
 * @param {Object} obj The object to modify
 * @param {string|Array} path The path to set
 * @param {*} value The value to set
 * @returns {Object} The modified object
 */
export function set(obj, path, value) {
  if (!isObject(obj)) return obj;
  
  const keys = Array.isArray(path) ? path : path.split('.');
  const lastKey = keys.pop();
  const lastObj = keys.reduce((acc, key) => {
    if (acc[key] === undefined) {
      acc[key] = {};
    }
    return acc[key];
  }, obj);
  
  lastObj[lastKey] = value;
  return obj;
}