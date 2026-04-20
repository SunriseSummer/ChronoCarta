import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlaces } from '../store/usePlaces';
import AppToast from '../components/AppToast';
import MapSearchPanel from '../components/map/MapSearchPanel';
import MapQuickNav from '../components/map/MapQuickNav';
import SelectedLocationPanel from '../components/map/SelectedLocationPanel';
import { useAmapPlaceMap } from '../features/map/useAmapPlaceMap';
import { useMapSearch } from '../features/map/useMapSearch';
import type { MapSearchCandidate } from '../features/map/types';
import type { Place } from '../types';

export default function MapView() {
  const { places, user } = usePlaces();
  const navigate = useNavigate();
  const [showLoginToast, setShowLoginToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onPlaceSelect = useCallback(
    (point: Place) => navigate(`/view/${point.routePath || point.id}`),
    [navigate],
  );

  const {
    centerOnLocation,
    clearTempMarker,
    containerRef,
    locateUser,
    mapClickCount,
    placeTempMarker,
    resetMarkers,
    selectedLocation,
    setSelectedLocation,
  } = useAmapPlaceMap({
    places,
    onPlaceSelect,
  });

  const {
    candidates,
    hasMore,
    handleClearSearch,
    handleSearchTextChange,
    hideDropdown,
    searchText,
    searching,
    setExpanded,
    setShowDropdown,
    showDropdown,
    visibleCandidates,
  } = useMapSearch({ places, onResetMarkers: resetMarkers });

  function showToast() {
    setShowLoginToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShowLoginToast(false), 2500);
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    hideDropdown();
  }, [hideDropdown, mapClickCount]);

  function handleSelectCandidate(item: MapSearchCandidate) {
    hideDropdown();
    centerOnLocation(item.lng, item.lat);

    if (item.type === 'place') {
      clearTempMarker();
      setSelectedLocation(null);
      navigate(`/view/${item.id}`);
      return;
    }

    placeTempMarker(item.lng, item.lat);
    setSelectedLocation({
      lng: item.lng,
      lat: item.lat,
      title: item.title,
      address: item.address,
    });
  }

  function closeSelectedLocation() {
    setSelectedLocation(null);
    clearTempMarker();
  }

  function handleStartPlace() {
    if (!selectedLocation) return;
    if (!user) {
      showToast();
      return;
    }

    navigate('/place', { state: selectedLocation });
    closeSelectedLocation();
  }

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div ref={containerRef} className="w-full h-full" />
      </div>

      <AppToast visible={showLoginToast} icon="solar:lock-keyhole-bold" message="请登录后操作" />

      <MapSearchPanel
        candidates={candidates}
        hasMore={hasMore}
        onChange={handleSearchTextChange}
        onClear={handleClearSearch}
        onExpand={() => setExpanded(true)}
        onLocate={locateUser}
        onSelect={handleSelectCandidate}
        onShowDropdown={() => {
          if (candidates.length > 0) {
            setShowDropdown(true);
          }
        }}
        searchText={searchText}
        searching={searching}
        showDropdown={showDropdown}
        visibleCandidates={visibleCandidates}
      />

      {selectedLocation && (
        <SelectedLocationPanel location={selectedLocation} onClose={closeSelectedLocation} onConfirm={handleStartPlace} />
      )}

      {!selectedLocation && <MapQuickNav />}
    </div>
  );
}
