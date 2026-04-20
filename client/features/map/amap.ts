export interface AMapMouseEvent {
  lnglat: {
    getLng(): number;
    getLat(): number;
  };
}

export interface AMapPoiTip {
  id?: string;
  name: string;
  district?: string;
  address?: string;
  location?: {
    lng: number;
    lat: number;
  };
}

export interface AMapAutoCompleteResult {
  info: string;
  tips?: AMapPoiTip[];
}

export interface AMapGeocodeResult {
  info: string;
  regeocode: {
    formattedAddress?: string;
    pois?: Array<{ name?: string }>;
    addressComponent?: {
      province?: string;
      city?: string;
      district?: string;
      township?: string;
      building?: string;
      neighborhood?: string;
    };
  };
}

export interface AMapMarkerInstance {
  on(event: 'click', handler: () => void): void;
}

export interface AMapMapInstance {
  add(target: AMapMarkerInstance): void;
  addControl(control: unknown): void;
  destroy(): void;
  on(event: 'click', handler: (event: AMapMouseEvent) => void | Promise<void>): void;
  remove(target: AMapMarkerInstance | AMapMarkerInstance[]): void;
  setCenter(position: [number, number]): void;
  setFitView(markers: AMapMarkerInstance[], immediately?: boolean, padding?: [number, number, number, number]): void;
  setZoom(level: number): void;
}

export interface AMapApi {
  AutoComplete: new (options: { datatype: string }) => {
    search(keyword: string, callback: (status: string, result: AMapAutoCompleteResult) => void): void;
  };
  Geocoder: new () => {
    getAddress(
      location: [number, number],
      callback: (status: string, result: AMapGeocodeResult) => void,
    ): void;
  };
  Map: new (
    container: HTMLDivElement,
    options: {
      center: [number, number];
      mapStyle: string;
      pitch: number;
      viewMode: '3D';
      zoom: number;
    },
  ) => AMapMapInstance;
  Marker: new (options: {
    content: string;
    extData?: unknown;
    offset: unknown;
    position: [number, number];
  }) => AMapMarkerInstance;
  Pixel: new (x: number, y: number) => unknown;
  Scale: new () => unknown;
}

export function getWindowAMap(): AMapApi | null {
  return (window as Window & { AMap?: AMapApi }).AMap ?? null;
}