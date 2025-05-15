/**
 * KALXJS Version Helper
 * This file provides utilities for checking and managing package versions
 */

/**
 * Get version information for a KALXJS package
 * @param {string} packageName - The name of the package (e.g., '@kalxjs/core')
 * @returns {Promise<string>} - A promise that resolves to the package version
 */
export async function getPackageVersion(packageName) {
  try {
    // Try to dynamically import the package to get its version
    try {
      const module = await import(packageName);
      if (module.version) {
        return module.version;
      }
    } catch (importErr) {
      console.debug('Could not import ' + packageName + ' directly');
    }
    
    // If direct import fails, try to fetch from package.json
    try {
      // This works in development environments where node_modules is accessible
      const response = await fetch('/node_modules/' + packageName + '/package.json');
      if (response.ok) {
        const packageInfo = await response.json();
        return packageInfo.version;
      }
    } catch (fetchErr) {
      console.debug('Could not fetch package.json for ' + packageName);
    }
    
    // If all else fails, try to get from window.__KALXJS_VERSIONS__ if available
    if (window.__KALXJS_VERSIONS__ && window.__KALXJS_VERSIONS__[packageName]) {
      return window.__KALXJS_VERSIONS__[packageName];
    }
    
    // Last resort: use a fallback version
    return '1.0.0';
  } catch (err) {
    console.warn('Error getting version for ' + packageName + ':', err);
    return '1.0.0';
  }
}

/**
 * Get versions for all KALXJS packages
 * @returns {Promise<Object>} - A promise that resolves to an object with package versions
 */
export async function getAllVersions() {
  const versions = {};
  
  // Get versions for all packages
  versions['@kalxjs/core'] = await getPackageVersion('@kalxjs/core');
  versions['@kalxjs/router'] = await getPackageVersion('@kalxjs/router');
  versions['@kalxjs/state'] = await getPackageVersion('@kalxjs/state');
  versions['@kalxjs/utils'] = await getPackageVersion('@kalxjs/utils');
  versions['@kalxjs/devtools'] = await getPackageVersion('@kalxjs/devtools');
  
  // Store versions globally for debugging
  window.__KALXJS_VERSIONS__ = versions;
  
  return versions;
}

/**
 * Check if all package versions are compatible
 * @param {Object} versions - An object with package versions
 * @returns {boolean} - True if all versions are compatible
 */
export function checkVersionCompatibility(versions) {
  try {
    // Extract major versions
    const majorVersions = Object.entries(versions).map(([pkg, ver]) => {
      if (!ver) {
        console.warn('⚠️ Warning: No version found for ' + pkg + ' package');
        return { package: pkg, major: 0 };
      }
      
      try {
        const major = parseInt(ver.split('.')[0]);
        return { package: pkg, major };
      } catch (err) {
        console.warn('⚠️ Warning: Invalid version format for ' + pkg + ': ' + ver);
        return { package: pkg, major: 0 };
      }
    });
    
    // Check if all major versions are the same
    const validVersions = majorVersions.filter(v => v.major > 0);
    
    if (validVersions.length === 0) {
      console.warn('⚠️ Warning: No valid versions found');
      return true; // Continue anyway
    }
    
    const firstMajor = validVersions[0].major;
    const compatible = validVersions.every(v => v.major === firstMajor);
    
    if (!compatible) {
      console.warn('⚠️ Warning: Package version mismatch detected. This may cause compatibility issues.');
      console.warn('   Consider updating all packages to compatible versions.');
      
      // Show detailed version information for debugging
      console.warn('   Version details:');
      majorVersions.forEach(v => {
        console.warn('   • ' + v.package + ': v' + versions[v.package] + ' (major: ' + v.major + ')');
      });
    } else {
      console.log('✅ All package versions are compatible');
    }
    
    return compatible;
  } catch (err) {
    console.warn('⚠️ Warning: Version compatibility check failed', err);
    console.error(err);
    return true; // Continue anyway
  }
}

/**
 * Initialize version checking
 * This function checks all package versions and logs compatibility information
 */
export async function initVersionCheck() {
  console.log('📦 Checking KALXJS package versions...');
  
  try {
    // Get all package versions
    const versions = await getAllVersions();
    
    // Log versions
    console.log('📦 Package versions:');
    Object.entries(versions).forEach(([pkg, ver]) => {
      console.log('  • ' + pkg.replace('@kalxjs/', '') + ': ' + ver);
    });
    
    // Check compatibility
    checkVersionCompatibility(versions);
    
    return versions;
  } catch (err) {
    console.warn('⚠️ Version check failed:', err);
    return {};
  }
}