import { useCallback, useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { AMAP_KEY, AMAP_VERSION, ensureAMapSecurity, getAMapStyle } from '../../lib/constants';
import type { Place } from '../../types';
import type { AMapApi, AMapMapInstance, AMapMarkerInstance, AMapMouseEvent } from './amap';
import { getWindowAMap } from './amap';
import { renderPlaceMarkers, reverseGeocodeLocation } from './utils';
import type { MapLocation } from './types';

interface UseAmapPlaceMapOptions {
  places: Place[];
  onPlaceSelect: (point: Place) => void;
}

const TEMP_MARKER_HTML
  = '<div style="width:32px;height:32px;border-radius:50%;background:#d4b373;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 4px 16px rgba(0,0,0,0.4);cursor:pointer;">'
  + '<span style="font-size:16px;">📌</span></div>';

export function useAmapPlaceMap({ places, onPlaceSelect }: UseAmapPlaceMapOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AMapMapInstance | null>(null);
  const markersRef = useRef<AMapMarkerInstance[]>([]);
  const tempMarkerRef = useRef<AMapMarkerInstance | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapClickCount, setMapClickCount] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);

  const clearTempMarker = useCallback(() => {
    if (tempMarkerRef.current && mapRef.current) {
      mapRef.current.remove(tempMarkerRef.current);
      tempMarkerRef.current = null;
    }
  }, []);

  const placeTempMarker = useCallback((lng: number, lat: number) => {
    const AMap = getWindowAMap();
    if (!AMap || !mapRef.current) return;

    clearTempMarker();
    const marker = new AMap.Marker({
      position: [lng, lat],
      content: TEMP_MARKER_HTML,
      offset: new AMap.Pixel(-16, -16),
    });

    mapRef.current.add(marker);
    tempMarkerRef.current = marker;
  }, [clearTempMarker]);

  const resetMarkers = useCallback(() => {
    const AMap = getWindowAMap();
    if (!AMap || !mapRef.current) return;

    renderPlaceMarkers({
      AMap,
      map: mapRef.current,
      points: places,
      markersRef,
      onMarkerClick: onPlaceSelect,
    });
  }, [places, onPlaceSelect]);

  const centerOnLocation = useCallback((lng: number, lat: number, zoom = 15) => {
    mapRef.current?.setCenter([lng, lat]);
    mapRef.current?.setZoom(zoom);
  }, []);

  const locateUser = useCallback(() => {
    if (!navigator.geolocation || !mapRef.current) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        centerOnLocation(lng, lat, 14);
        placeTempMarker(lng, lat);

        const AMap = getWindowAMap();
        if (AMap) {
          const location = await reverseGeocodeLocation(AMap, lng, lat);
          setSelectedLocation(location);
        }
      },
      (err) => {
        console.warn('[useAmapPlaceMap] 定位失败:', err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [centerOnLocation, placeTempMarker]);

  useEffect(() => {
    let disposed = false;

    ensureAMapSecurity();

    AMapLoader.load({
      key: AMAP_KEY,
      version: AMAP_VERSION,
      plugins: ['AMap.Geocoder', 'AMap.AutoComplete', 'AMap.PlaceSearch'],
    })
      .then((AMap) => {
        if (disposed || !containerRef.current) return;

        const amapApi = AMap as AMapApi;

        const map = new amapApi.Map(containerRef.current, {
          viewMode: '3D',
          zoom: 5,
          center: [104.0, 35.0],
          mapStyle: getAMapStyle(),
          pitch: 30,
        });

        mapRef.current = map;
        setMapReady(true);

        map.on('click', async (event: AMapMouseEvent) => {
          const lng = parseFloat(event.lnglat.getLng().toFixed(6));
          const lat = parseFloat(event.lnglat.getLat().toFixed(6));

          setMapClickCount((count) => count + 1);
          placeTempMarker(lng, lat);
          const location = await reverseGeocodeLocation(amapApi, lng, lat);
          if (!disposed) {
            setSelectedLocation(location);
          }
        });
      })
      .catch((err) => {
        console.error('[useAmapPlaceMap] 地图初始化失败:', err);
      });

    return () => {
      disposed = true;
      mapRef.current?.destroy();
      mapRef.current = null;
      tempMarkerRef.current = null;
      markersRef.current = [];
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    resetMarkers();
  }, [mapReady, resetMarkers]);

  return {
    centerOnLocation,
    clearTempMarker,
    containerRef,
    locateUser,
    mapClickCount,
    placeTempMarker,
    resetMarkers,
    selectedLocation,
    setSelectedLocation,
  };
}
