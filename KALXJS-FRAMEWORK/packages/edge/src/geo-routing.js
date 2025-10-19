/**
 * Geo-Distributed Routing
 * Route requests based on geographic location
 */

/**
 * Geographic regions
 */
export const GeoRegion = {
    NORTH_AMERICA: 'na',
    SOUTH_AMERICA: 'sa',
    EUROPE: 'eu',
    ASIA: 'asia',
    AFRICA: 'af',
    OCEANIA: 'oc',
    UNKNOWN: 'unknown'
};

/**
 * Get geographic information from request
 * @param {Request} request - Request object
 * @returns {Object} Geographic info
 */
export function getGeoInfo(request) {
    const headers = request.headers;

    // Try Cloudflare Workers headers
    const cfCountry = headers.get('CF-IPCountry');
    const cfRegion = headers.get('CF-Region');
    const cfCity = headers.get('CF-City');
    const cfTimezone = headers.get('CF-Timezone');
    const cfLatLong = headers.get('CF-LatLong');

    if (cfCountry) {
        return {
            country: cfCountry,
            region: cfRegion || '',
            city: cfCity || '',
            timezone: cfTimezone || '',
            coordinates: cfLatLong ? cfLatLong.split(',').map(Number) : null,
            continent: getContinent(cfCountry)
        };
    }

    // Try Vercel/Netlify headers
    const vercelCountry = headers.get('x-vercel-ip-country');
    const vercelRegion = headers.get('x-vercel-ip-country-region');
    const vercelCity = headers.get('x-vercel-ip-city');

    if (vercelCountry) {
        return {
            country: vercelCountry,
            region: vercelRegion || '',
            city: vercelCity || '',
            timezone: '',
            coordinates: null,
            continent: getContinent(vercelCountry)
        };
    }

    // Fallback
    return {
        country: 'UNKNOWN',
        region: '',
        city: '',
        timezone: '',
        coordinates: null,
        continent: GeoRegion.UNKNOWN
    };
}

/**
 * Get continent from country code
 * @param {string} countryCode - ISO country code
 * @returns {string} Continent code
 */
function getContinent(countryCode) {
    const continents = {
        // North America
        'US': GeoRegion.NORTH_AMERICA, 'CA': GeoRegion.NORTH_AMERICA, 'MX': GeoRegion.NORTH_AMERICA,
        // Europe
        'GB': GeoRegion.EUROPE, 'DE': GeoRegion.EUROPE, 'FR': GeoRegion.EUROPE, 'IT': GeoRegion.EUROPE,
        'ES': GeoRegion.EUROPE, 'PL': GeoRegion.EUROPE, 'NL': GeoRegion.EUROPE,
        // Asia
        'CN': GeoRegion.ASIA, 'JP': GeoRegion.ASIA, 'IN': GeoRegion.ASIA, 'KR': GeoRegion.ASIA,
        'SG': GeoRegion.ASIA, 'TH': GeoRegion.ASIA, 'VN': GeoRegion.ASIA,
        // Oceania
        'AU': GeoRegion.OCEANIA, 'NZ': GeoRegion.OCEANIA,
        // Africa
        'ZA': GeoRegion.AFRICA, 'EG': GeoRegion.AFRICA, 'NG': GeoRegion.AFRICA,
        // South America
        'BR': GeoRegion.SOUTH_AMERICA, 'AR': GeoRegion.SOUTH_AMERICA, 'CL': GeoRegion.SOUTH_AMERICA
    };

    return continents[countryCode] || GeoRegion.UNKNOWN;
}

/**
 * Geo-routing middleware
 * @param {Object} routes - Region-based routes
 * @returns {Function} Middleware function
 */
export function geoRoute(routes) {
    return async (request, context, next) => {
        const geoInfo = getGeoInfo(request);
        const continent = geoInfo.continent;

        // Store geo info in context
        context.geo = geoInfo;

        // Find route for continent
        if (routes[continent]) {
            const handler = routes[continent];
            if (typeof handler === 'function') {
                return await handler(request, context, next);
            } else if (typeof handler === 'string') {
                // Redirect to region-specific URL
                return Response.redirect(handler, 302);
            }
        }

        // Fallback to default route
        if (routes.default) {
            const handler = routes.default;
            if (typeof handler === 'function') {
                return await handler(request, context, next);
            }
        }

        return await next();
    };
}

/**
 * Get closest edge location
 * @param {Request} request - Request object
 * @param {Array} locations - Available locations
 * @returns {Object} Closest location
 */
export function getClosestLocation(request, locations) {
    const geoInfo = getGeoInfo(request);

    if (!geoInfo.coordinates) {
        // Fallback to continent matching
        return locations.find(loc => loc.continent === geoInfo.continent) || locations[0];
    }

    const [userLat, userLon] = geoInfo.coordinates;

    let closest = locations[0];
    let minDistance = Infinity;

    for (const location of locations) {
        const distance = calculateDistance(
            userLat, userLon,
            location.lat, location.lon
        );

        if (distance < minDistance) {
            minDistance = distance;
            closest = location;
        }
    }

    return closest;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in km
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Create region-specific cache key
 * @param {string} baseKey - Base cache key
 * @param {Object} geoInfo - Geographic info
 * @returns {string} Region-specific cache key
 */
export function createRegionCacheKey(baseKey, geoInfo) {
    return `${baseKey}:${geoInfo.continent}:${geoInfo.country}`;
}

/**
 * Language detection from request
 * @param {Request} request - Request object
 * @returns {string} Language code
 */
export function detectLanguage(request) {
    const acceptLanguage = request.headers.get('Accept-Language');

    if (!acceptLanguage) {
        return 'en';
    }

    // Parse Accept-Language header
    const languages = acceptLanguage
        .split(',')
        .map(lang => {
            const [code, qStr] = lang.trim().split(';');
            const q = qStr ? parseFloat(qStr.split('=')[1]) : 1;
            return { code: code.split('-')[0], q };
        })
        .sort((a, b) => b.q - a.q);

    return languages[0]?.code || 'en';
}

export default {
    GeoRegion,
    getGeoInfo,
    geoRoute,
    getClosestLocation,
    createRegionCacheKey,
    detectLanguage
};