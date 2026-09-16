import * as Location from 'expo-location';

/**
 * CricFlow Unified Location Model
 * @typedef {Object} CricFlowLocation
 * @property {string} city - e.g. "Jaipur", "Lahore", "Dubai"
 * @property {string} [district] - e.g. "Jaipur District"
 * @property {string} state - e.g. "Rajasthan", "Punjab"
 * @property {string} country - e.g. "India", "Pakistan", "United Arab Emirates"
 * @property {string} countryCode - e.g. "IN", "PK", "AE", "US"
 * @property {number|null} latitude - e.g. 26.9124
 * @property {number|null} longitude - e.g. 75.7873
 * @property {string} formattedAddress - e.g. "Jaipur, Rajasthan, India"
 */

// In-memory cache for search queries to avoid redundant network requests
const searchCache = new Map();

/**
 * Detect user's country code from device timezone / locale
 * @returns {string} e.g. 'IN', 'PK', 'AE', 'US'
 */
export function getDeviceCountryCode() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Kolkata') || tz.includes('Calcutta')) return 'IN';
    if (tz.includes('Karachi')) return 'PK';
    if (tz.includes('Dubai')) return 'AE';
    if (tz.includes('Kathmandu')) return 'NP';
    if (tz.includes('Dhaka')) return 'BD';
    if (tz.includes('Colombo')) return 'LK';
    if (tz.includes('London')) return 'GB';
    if (tz.includes('Sydney') || tz.includes('Melbourne')) return 'AU';
    if (tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Los_Angeles')) return 'US';
  } catch (e) {}
  return 'IN';
}

/**
 * Request device foreground location permission
 * @returns {Promise<{granted: boolean, status: string, canAskAgain: boolean}>}
 */
export async function requestLocationPermission() {
  try {
    const { status, canAskAgain, granted } = await Location.requestForegroundPermissionsAsync();
    return {
      granted: granted || status === 'granted',
      status,
      canAskAgain
    };
  } catch (err) {
    console.warn('[LocationService] Permission error:', err);
    return { granted: false, status: 'error', canAskAgain: true };
  }
}

/**
 * Format a unified location string e.g. "Jaipur, Rajasthan, India"
 */
export function formatLocationString(city, state, country) {
  const parts = [];
  if (city) parts.push(city);
  if (state && state !== city) parts.push(state);
  if (country) parts.push(country);
  return parts.join(', ');
}

/**
 * Normalize raw geocoder / provider response into standard CricFlowLocation model
 */
export function normalizeLocation(raw, provider = 'photon') {
  if (!raw) return null;

  if (provider === 'photon') {
    const props = raw.properties || {};
    const coords = raw.geometry?.coordinates || [];
    const longitude = typeof coords[0] === 'number' ? coords[0] : null;
    const latitude = typeof coords[1] === 'number' ? coords[1] : null;

    const city = props.city || props.town || props.village || props.district || props.name || 'Unknown City';
    const district = props.district || props.county || '';
    const state = props.state || props.region || '';
    const country = props.country || '';
    const countryCode = (props.countrycode || '').toUpperCase();
    const formattedAddress = formatLocationString(city, state, country) || props.name || city;

    return {
      city,
      district,
      state,
      country,
      countryCode,
      latitude,
      longitude,
      formattedAddress
    };
  }

  if (provider === 'nominatim') {
    const addr = raw.address || {};
    const city = addr.city || addr.town || addr.village || addr.suburb || addr.hamlet || addr.county || raw.name || 'Unknown City';
    const district = addr.state_district || addr.district || addr.county || '';
    const state = addr.state || addr.region || '';
    const country = addr.country || '';
    const countryCode = (addr.country_code || '').toUpperCase();
    const latitude = raw.lat ? parseFloat(raw.lat) : null;
    const longitude = raw.lon ? parseFloat(raw.lon) : null;
    const formattedAddress = formatLocationString(city, state, country) || raw.display_name || city;

    return {
      city,
      district,
      state,
      country,
      countryCode,
      latitude,
      longitude,
      formattedAddress
    };
  }

  if (provider === 'expo') {
    const city = raw.city || raw.subregion || raw.district || raw.name || 'Current Location';
    const district = raw.district || raw.subregion || '';
    const state = raw.region || raw.state || '';
    const country = raw.country || '';
    const countryCode = (raw.isoCountryCode || '').toUpperCase();
    const latitude = raw.latitude ?? null;
    const longitude = raw.longitude ?? null;
    const formattedAddress = formatLocationString(city, state, country);

    return {
      city,
      district,
      state,
      country,
      countryCode,
      latitude,
      longitude,
      formattedAddress
    };
  }

  // Fallback for direct custom object
  return {
    city: raw.city || raw.name || 'Custom Location',
    district: raw.district || '',
    state: raw.state || '',
    country: raw.country || '',
    countryCode: raw.countryCode || '',
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    formattedAddress: raw.formattedAddress || raw.formatted || raw.city || 'Custom Location'
  };
}

/**
 * Get current device GPS location and reverse-geocode to a structured CricFlowLocation
 * @returns {Promise<{success: boolean, location?: CricFlowLocation, error?: string}>}
 */
export async function getCurrentGpsLocation() {
  try {
    const perm = await requestLocationPermission();
    if (!perm.granted) {
      return {
        success: false,
        error: 'PERMISSION_DENIED',
        message: 'Location permission was denied. Please enable it to detect your ground automatically.'
      };
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });

    const { latitude, longitude } = pos.coords;

    // Step 1: Try Native Expo Reverse Geocoder (Free & Built into OS)
    try {
      const nativeResults = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (Array.isArray(nativeResults) && nativeResults.length > 0) {
        const best = nativeResults[0];
        const normalized = normalizeLocation({
          ...best,
          latitude,
          longitude
        }, 'expo');
        if (normalized && normalized.city) {
          return { success: true, location: normalized };
        }
      }
    } catch (nativeErr) {
      console.warn('[LocationService] Native reverse geocode failed, trying fallback:', nativeErr);
    }

    // Step 2: Fallback to OpenStreetMap Nominatim Reverse API
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
        {
          headers: { 'User-Agent': 'CricFlowMobileApp/1.0' }
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const normalized = normalizeLocation(data, 'nominatim');
          if (normalized) {
            return { success: true, location: normalized };
          }
        }
      }
    } catch (nomErr) {
      console.warn('[LocationService] Nominatim reverse geocode failed:', nomErr);
    }

    // Basic coordinate fallback if reverse geocoding names fail
    return {
      success: true,
      location: {
        city: 'Ground Location',
        district: '',
        state: '',
        country: '',
        countryCode: getDeviceCountryCode(),
        latitude,
        longitude,
        formattedAddress: `Ground (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
      }
    };
  } catch (err) {
    console.warn('[LocationService] getCurrentGpsLocation error:', err);
    return {
      success: false,
      error: err.code || 'GPS_ERROR',
      message: err.message || 'Unable to fetch current GPS coordinates.'
    };
  }
}

/**
 * Search global places/cities using Photon API (OpenStreetMap & Komoot)
 * @param {string} query - Search text e.g. "Jaipur", "Lahore", "Dubai"
 * @param {number} [limit=8] - Max results to return
 * @returns {Promise<Array<CricFlowLocation>>}
 */
export async function searchGlobalLocations(query = '', limit = 8) {
  const q = String(query || '').trim();
  if (q.length < 2) return [];

  const cacheKey = `${q.toLowerCase()}_${limit}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  // Primary Provider: Photon API
  try {
    const endpoint = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=${limit}&lang=en`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.features) && data.features.length > 0) {
        const results = [];
        const seenNames = new Set();

        for (const feat of data.features) {
          const normalized = normalizeLocation(feat, 'photon');
          if (normalized && normalized.formattedAddress) {
            const key = normalized.formattedAddress.toLowerCase();
            if (!seenNames.has(key)) {
              seenNames.add(key);
              results.push(normalized);
            }
          }
        }

        if (results.length > 0) {
          searchCache.set(cacheKey, results);
          return results;
        }
      }
    }
  } catch (photonErr) {
    console.warn('[LocationService] Photon search failed, trying Nominatim fallback:', photonErr.message);
  }

  // Secondary Provider Fallback: OpenStreetMap Nominatim
  try {
    const nomEndpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=${limit}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(nomEndpoint, {
      signal: controller.signal,
      headers: { 'User-Agent': 'CricFlowMobileApp/1.0' }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const results = data.map(item => normalizeLocation(item, 'nominatim')).filter(Boolean);
        if (results.length > 0) {
          searchCache.set(cacheKey, results);
          return results;
        }
      }
    }
  } catch (nomErr) {
    console.warn('[LocationService] Nominatim fallback search failed:', nomErr.message);
  }

  return [];
}
