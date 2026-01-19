declare module '@vis.gl/react-google-maps' {
  import * as React from 'react';

  export interface APIProviderProps {
    apiKey: string;
    /** Google Maps JS API libraries (e.g. ['places']) */
    libraries?: string[];
    onLoad?: () => void;
    onError?: (error: Error) => void;
    children?: React.ReactNode;
  }
  export const APIProvider: React.FC<APIProviderProps>;

  export interface MapProps {
    defaultZoom?: number;
    defaultCenter?: google.maps.LatLngLiteral;
    onClick?: (e: { detail?: { latLng?: { lat: number; lng: number } | { lat: () => number; lng: () => number } } }) => void;
    children?: React.ReactNode;
  }
  export const Map: React.FC<MapProps>;

  export interface AdvancedMarkerProps {
    position: google.maps.LatLngLiteral;
    children?: React.ReactNode;
  }
  export const AdvancedMarker: React.FC<AdvancedMarkerProps>;

  export interface PinProps {
    background?: string;
    children?: React.ReactNode;
  }
  export const Pin: React.FC<PinProps>;

  export function useMap(): google.maps.Map | undefined;

  export default {} as any;
}
