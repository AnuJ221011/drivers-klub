import api from './axios';

export type MapAutocompleteItem = {
  description: string;
  place_id: string;
};

export type MapGeocodeResult = {
  lat: number;
  lng: number;
  formattedAddress: string;
};

export async function getMapAutocomplete(query: string): Promise<MapAutocompleteItem[]> {
  const q = (query || '').trim();
  if (!q) return [];
  const res = await api.get<MapAutocompleteItem[]>('/maps/autocomplete', { params: { query: q } });
  return res.data || [];
}

export async function geocodeAddress(address: string): Promise<MapGeocodeResult> {
  const a = (address || '').trim();
  const res = await api.get<MapGeocodeResult>('/maps/geocode', { params: { address: a } });
  return res.data;
}

