import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Place } from '../../types';
import { getWindowAMap } from './amap';
import { buildPlaceCandidates, DEFAULT_SHOW_COUNT, searchPoiCandidates } from './utils';
import type { MapSearchCandidate } from './types';

interface UseMapSearchOptions {
  places: Place[];
  onResetMarkers: () => void;
}

export function useMapSearch({ places, onResetMarkers }: UseMapSearchOptions) {
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchText, setSearchText] = useState('');
  const [poiCandidates, setPoiCandidates] = useState<MapSearchCandidate[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);

  const localCandidates = useMemo(() => {
    const keyword = searchText.trim();
    return keyword ? buildPlaceCandidates(places, keyword) : [];
  }, [places, searchText]);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    const keyword = searchText.trim();
    if (!keyword) {
      onResetMarkers();
      return;
    }

    let cancelled = false;

    searchTimerRef.current = setTimeout(async () => {
      const AMap = getWindowAMap();
      if (!AMap) return;

      setSearching(true);
      const remoteCandidates = await searchPoiCandidates(AMap, keyword);
      if (!cancelled) {
        setPoiCandidates(remoteCandidates);
        setSearching(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [onResetMarkers, searchText]);

  const candidates = useMemo(
    () => (searchText.trim() ? [...localCandidates, ...poiCandidates] : []),
    [localCandidates, poiCandidates, searchText],
  );

  const visibleCandidates = useMemo(
    () => (expanded ? candidates : candidates.slice(0, DEFAULT_SHOW_COUNT)),
    [candidates, expanded],
  );

  return {
    candidates,
    hasMore: candidates.length > DEFAULT_SHOW_COUNT && !expanded,
    handleClearSearch: () => {
      setSearchText('');
      setPoiCandidates([]);
      setExpanded(false);
      setShowDropdown(false);
      setSearching(false);
    },
    handleSearchTextChange: (value: string) => {
      setSearchText(value);
      setPoiCandidates([]);
      setExpanded(false);
      setSearching(false);
      setShowDropdown(Boolean(value.trim()));
    },
    hideDropdown: useCallback(() => setShowDropdown(false), []),
    searchText,
    searching,
    setExpanded,
    setShowDropdown,
    showDropdown,
    visibleCandidates,
  };
}