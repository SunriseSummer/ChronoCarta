import type { RefObject } from 'react';
import { getCoverPhoto } from '../../lib/utils';
import type { Place } from '../../types';
import type { AMapApi, AMapAutoCompleteResult, AMapGeocodeResult, AMapMapInstance, AMapMarkerInstance, AMapPoiTip } from './amap';
import type { MapLocation, MapSearchCandidate } from './types';

export const DEFAULT_SHOW_COUNT = 10;

function hasLocation(tip: AMapPoiTip): tip is AMapPoiTip & { location: { lng: number; lat: number } } {
  return Boolean(tip.location);
}

export function buildPlaceCandidates(places: Place[], keyword: string): MapSearchCandidate[] {
  return places
    .filter(
      (place) =>
        place.title.includes(keyword)
        || place.address?.includes(keyword)
        || place.tags.some((tag) => tag.includes(keyword)),
    )
    .map((place) => ({
      type: 'place' as const,
      id: place.routePath || place.id,
      title: place.title,
      address: place.address || '',
      lng: place.lng,
      lat: place.lat,
      place,
    }));
}

export function searchPoiCandidates(AMap: AMapApi, keyword: string): Promise<MapSearchCandidate[]> {
  return new Promise((resolve) => {
    const autoComplete = new AMap.AutoComplete({ datatype: 'all' });
    autoComplete.search(keyword, (_status: string, result: AMapAutoCompleteResult) => {
      if (result.info !== 'OK' || !result.tips) {
        resolve([]);
        return;
      }

      resolve(
        result.tips
          .filter(hasLocation)
          .map((tip) => ({
            type: 'poi' as const,
            id: tip.id || `${tip.location.lng}-${tip.location.lat}`,
            title: tip.name,
            address: `${tip.district || ''}${tip.address || ''}`,
            lng: parseFloat(tip.location.lng.toFixed(6)),
            lat: parseFloat(tip.location.lat.toFixed(6)),
          })),
      );
    });
  });
}

export function reverseGeocodeLocation(AMap: AMapApi, lng: number, lat: number): Promise<MapLocation> {
  return new Promise((resolve) => {
    const geocoder = new AMap.Geocoder();
    geocoder.getAddress([lng, lat], (_status: string, res: AMapGeocodeResult) => {
      if (res.info === 'OK') {
        const address = res.regeocode.formattedAddress || '';
        const comp = res.regeocode.addressComponent;

        // 从完整地址中去掉省、市、区前缀，保留乡镇及以下的具体地名
        let shortAddress = address;
        if (comp) {
          const prefixes = [comp.province, comp.city, comp.district].filter(Boolean) as string[];
          for (const p of prefixes) {
            if (shortAddress.startsWith(p)) {
              shortAddress = shortAddress.slice(p.length);
            }
          }
        }

        const title = res.regeocode.pois?.[0]?.name
          || comp?.building
          || comp?.neighborhood
          || shortAddress
          || address;

        resolve({ lng, lat, title: title || address, address });
        return;
      }

      resolve({
        lng,
        lat,
        title: '',
        address: '',
      });
    });
  });
}

export function renderPlaceMarkers({
  AMap,
  map,
  points,
  markersRef,
  onMarkerClick,
}: {
  AMap: AMapApi;
  map: AMapMapInstance;
  points: Place[];
  markersRef: RefObject<AMapMarkerInstance[]>;
  onMarkerClick: (point: Place) => void;
}) {
  markersRef.current.forEach((marker) => map.remove(marker));
  markersRef.current = [];

  const validPoints = points.filter(
    (point) => Number.isFinite(point.lng) && Number.isFinite(point.lat) && (point.lng !== 0 || point.lat !== 0),
  );

  validPoints.forEach((point) => {
    const cover = getCoverPhoto(point.photos, point.coverIndex);
    const thumb = cover?.thumb_sm || '';
    const content = thumb
      ? `<div style="cursor:pointer;" class="place-bubble">
          <div style="width:56px;height:56px;border-radius:50%;border:3px solid #e3e8e5;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.5);">
            <img src="${thumb}" width="56" height="56" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;" />
          </div>
          <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #e3e8e5;margin:-1px auto 0;"></div>
        </div>`
      : `<div style="cursor:pointer;width:40px;height:40px;border-radius:50%;background:#d4b373;display:flex;align-items:center;justify-content:center;border:3px solid #e3e8e5;box-shadow:0 4px 16px rgba(0,0,0,0.5);">
          <span style="font-size:18px;">📍</span>
        </div>`;

    const marker = new AMap.Marker({
      position: [point.lng, point.lat],
      content,
      offset: new AMap.Pixel(-28, -60),
      extData: point,
    });

    marker.on('click', () => onMarkerClick(point));
    map.add(marker);
    markersRef.current.push(marker);
  });

  if (validPoints.length > 1) {
    map.setFitView(markersRef.current, false, [50, 50, 120, 50]);
  } else if (validPoints.length === 1) {
    map.setCenter([validPoints[0].lng, validPoints[0].lat]);
    map.setZoom(14);
  }
}