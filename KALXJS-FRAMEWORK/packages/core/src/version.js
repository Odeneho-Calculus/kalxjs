/**
 * KALXJS Version Utility
 * This file provides version information for the KALXJS framework
 * and its related packages.
 */

// Export the current version of the core package
export const version = '2.2.1';

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
            console.debug(`Could not import ${packageName} directly`);
        }

        // If direct import fails, try to fetch from package.json
        try {
            // This works in development environments where node_modules is accessible
            const response = await fetch(`/node_modules/${packageName}/package.json`);
            if (response.ok) {
                const packageInfo = await response.json();
                return packageInfo.version;
            }
        } catch (fetchErr) {
            console.debug(`Could not fetch package.json for ${packageName}`);
        }

        // If all else fails, use a fallback version
        const fallbacks = {
            '@kalxjs/core': '2.2.1',
            '@kalxjs/router': '2.0.0',
            '@kalxjs/state': '1.2.0',
            '@kalxjs/utils': '1.1.0',
            '@kalxjs/devtools': '1.0.0'
        };

        return fallbacks[packageName] || '1.0.0';
    } catch (err) {
        console.warn(`Error getting version for ${packageName}:`, err);
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
                console.warn(`⚠️ Warning: No version found for ${pkg} package`);
                return { package: pkg, major: 0 };
            }

            try {
                const major = parseInt(ver.split('.')[0]);
                return { package: pkg, major };
            } catch (err) {
                console.warn(`⚠️ Warning: Invalid version format for ${pkg}: ${ver}`);
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
                console.warn(`   • ${v.package}: v${versions[v.package]} (major: ${v.major})`);
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

// Export a simple version object for easy access
export const versions = {
    core: version,
    router: '2.0.0',
    state: '1.2.0',
    utils: '1.1.0',
    devtools: '1.0.0'
};