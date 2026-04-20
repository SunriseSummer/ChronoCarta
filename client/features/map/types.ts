import type { Place } from '../../types';

export interface MapLocation {
  lng: number;
  lat: number;
  title: string;
  address: string;
}

export interface MapSearchCandidate extends MapLocation {
  type: 'place' | 'poi';
  id: string;
  place?: Place;
}