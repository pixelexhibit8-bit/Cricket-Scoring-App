import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getCurrentGpsLocation,
  searchGlobalLocations,
  normalizeLocation
} from '../services/locationService.js';

/**
 * Custom Hook for global location search and GPS detection
 * @param {Object} [initialLocation] - Optional default location
 * @param {Function} [onLocationSelected] - Callback when user confirms location
 */
export function useLocation(initialLocation = null, onLocationSelected = null) {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatusText, setGpsStatusText] = useState('');
  const [gpsError, setGpsError] = useState(null);

  const debounceTimerRef = useRef(null);

  // Debounced live search
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const results = await searchGlobalLocations(q, 8);
        setSearchResults(results);
      } catch (err) {
        setSearchError(err.message || 'Error searching locations');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // GPS Detection Action
  const detectGps = useCallback(async () => {
    setGpsLoading(true);
    setGpsError(null);
    setGpsStatusText('Requesting GPS permission...');

    try {
      setGpsStatusText('Fetching pinpoint coordinates...');
      const res = await getCurrentGpsLocation();

      if (res.success && res.location) {
        setSelectedLocation(res.location);
        if (onLocationSelected) {
          onLocationSelected(res.location);
        }
        return res.location;
      } else {
        const errorMsg = res.message || 'Unable to detect GPS location.';
        setGpsError(errorMsg);
        return null;
      }
    } catch (err) {
      const errorMsg = err.message || 'GPS location error.';
      setGpsError(errorMsg);
      return null;
    } finally {
      setGpsLoading(false);
      setGpsStatusText('');
    }
  }, [onLocationSelected]);

  // Select a result from autocomplete list
  const selectResult = useCallback((location) => {
    if (!location) return;
    const normalized = normalizeLocation(location);
    setSelectedLocation(normalized);
    if (onLocationSelected) {
      onLocationSelected(normalized);
    }
    return normalized;
  }, [onLocationSelected]);

  // Apply custom manual entry (e.g. unmapped village or local turf)
  const applyCustomManual = useCallback((text) => {
    const clean = String(text || '').trim();
    if (!clean) return null;

    const customLoc = normalizeLocation({
      city: clean,
      formattedAddress: clean
    }, 'custom');

    setSelectedLocation(customLoc);
    if (onLocationSelected) {
      onLocationSelected(customLoc);
    }
    return customLoc;
  }, [onLocationSelected]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
  }, []);

  return {
    selectedLocation,
    setSelectedLocation,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchError,
    gpsLoading,
    gpsStatusText,
    gpsError,
    detectGps,
    selectResult,
    applyCustomManual,
    clearSearch
  };
}
