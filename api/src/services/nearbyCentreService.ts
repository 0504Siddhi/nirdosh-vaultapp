/**
 * Nearby Assistance Centre Service
 *
 * - Simulated fallback with hardcoded centres for major Indian cities
 * - Accepts city name or PIN code
 * - Returns nearest centres sorted by relevance using Haversine distance
 */

export interface AssistanceCentre {
  id: string;
  name: string;
  type: 'aadhaar_seva_kendra' | 'pan_centre' | 'sdm_office' | 'csc_centre';
  typeLabel: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  lat: number;
  lng: number;
  phone?: string;
  timing?: string;
  mapsUrl: string;
  rating?: number;
  reviewCount?: number;
  distance?: string;
}

// ─── Hardcoded Centres (Simulated Fallback) ──────────────────────
const hardcodedCentres: AssistanceCentre[] = [
  // Delhi
  {
    id: 'ask-delhi-1',
    name: 'Aadhaar Seva Kendra — Pragati Maidan',
    type: 'aadhaar_seva_kendra',
    typeLabel: 'Aadhaar Seva Kendra',
    address: 'Hall No. 5, Pragati Maidan, New Delhi',
    city: 'Delhi',
    state: 'Delhi',
    pinCode: '110001',
    lat: 28.6185,
    lng: 77.2466,
    phone: '1947',
    timing: 'Mon–Sat, 9:30 AM – 5:30 PM',
    mapsUrl: 'https://www.google.com/maps/search/Aadhaar+Seva+Kendra+Pragati+Maidan+Delhi',
    rating: 4.8,
    reviewCount: 921,
  },
  {
    id: 'pan-delhi-1',
    name: 'UTIITSL PAN Centre — Connaught Place',
    type: 'pan_centre',
    typeLabel: 'PAN Application Centre',
    address: 'K-Block, Connaught Place, New Delhi',
    city: 'Delhi',
    state: 'Delhi',
    pinCode: '110001',
    lat: 28.6315,
    lng: 77.2167,
    phone: '011-2341-0000',
    timing: 'Mon–Fri, 9:30 AM – 5:00 PM',
    mapsUrl: 'https://www.google.com/maps/search/UTIITSL+PAN+Centre+Connaught+Place+Delhi',
    rating: 4.5,
    reviewCount: 312,
  },
  {
    id: 'sdm-delhi-1',
    name: 'SDM Office — Chanakyapuri',
    type: 'sdm_office',
    typeLabel: 'Sub-Divisional Magistrate Office',
    address: 'SDM Office, Chanakyapuri, New Delhi',
    city: 'Delhi',
    state: 'Delhi',
    pinCode: '110021',
    lat: 28.5976,
    lng: 77.1857,
    timing: 'Mon–Fri, 9:00 AM – 5:00 PM',
    mapsUrl: 'https://www.google.com/maps/search/SDM+Office+Chanakyapuri+Delhi',
    rating: 4.2,
    reviewCount: 154,
  },
  // Mumbai
  {
    id: 'ask-mumbai-1',
    name: 'Aadhaar Seva Kendra — Andheri',
    type: 'aadhaar_seva_kendra',
    typeLabel: 'Aadhaar Seva Kendra',
    address: 'MIDC, Andheri East, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    pinCode: '400093',
    lat: 19.1196,
    lng: 72.8680,
    phone: '1947',
    timing: 'Mon–Sat, 9:30 AM – 5:30 PM',
    mapsUrl: 'https://www.google.com/maps/search/Aadhaar+Seva+Kendra+Andheri+Mumbai',
    rating: 4.7,
    reviewCount: 840,
  },
  {
    id: 'pan-mumbai-1',
    name: 'NSDL PAN Centre — Lower Parel',
    type: 'pan_centre',
    typeLabel: 'PAN Application Centre',
    address: 'Times Tower, Kamala Mills, Lower Parel, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    pinCode: '400013',
    lat: 18.9947,
    lng: 72.8362,
    phone: '020-2721-8080',
    timing: 'Mon–Fri, 10:00 AM – 5:00 PM',
    mapsUrl: 'https://www.google.com/maps/search/NSDL+PAN+Centre+Fort+Mumbai',
    rating: 4.6,
    reviewCount: 512,
  },
  {
    id: 'csc-mumbai-1',
    name: 'Common Service Centre — Bandra',
    type: 'csc_centre',
    typeLabel: 'Common Service Centre (CSC)',
    address: 'CSC Centre, Hill Road, Bandra West, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    pinCode: '400050',
    lat: 19.0544,
    lng: 72.8367,
    timing: 'Mon–Sat, 9:00 AM – 6:00 PM',
    mapsUrl: 'https://www.google.com/maps/search/Common+Service+Centre+Bandra+Mumbai',
    rating: 4.9,
    reviewCount: 1250,
  },
  // Bangalore
  {
    id: 'ask-bangalore-1',
    name: 'Aadhaar Seva Kendra — Indiranagar',
    type: 'aadhaar_seva_kendra',
    typeLabel: 'Aadhaar Seva Kendra',
    address: '100 Feet Road, Indiranagar, Bangalore',
    city: 'Bangalore',
    state: 'Karnataka',
    pinCode: '560038',
    lat: 12.9784,
    lng: 77.6408,
    phone: '1947',
    timing: 'Mon–Sat, 9:30 AM – 5:30 PM',
    mapsUrl: 'https://www.google.com/maps/search/Aadhaar+Seva+Kendra+Indiranagar+Bangalore',
    rating: 4.8,
    reviewCount: 670,
  },
  // Pune
  {
    id: 'ask-pune-1',
    name: 'Aadhaar Seva Kendra — Shivajinagar',
    type: 'aadhaar_seva_kendra',
    typeLabel: 'Aadhaar Seva Kendra',
    address: 'FC Road, Shivajinagar, Pune',
    city: 'Pune',
    state: 'Maharashtra',
    pinCode: '411004',
    lat: 18.5314,
    lng: 73.8446,
    phone: '1947',
    timing: 'Mon–Sat, 9:30 AM – 5:30 PM',
    mapsUrl: 'https://www.google.com/maps/search/Aadhaar+Seva+Kendra+Shivajinagar+Pune',
    rating: 4.9,
    reviewCount: 1120,
  },
  // Hyderabad
  {
    id: 'ask-hyderabad-1',
    name: 'Aadhaar Seva Kendra — Ameerpet',
    type: 'aadhaar_seva_kendra',
    typeLabel: 'Aadhaar Seva Kendra',
    address: 'SR Nagar, Ameerpet, Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    pinCode: '500038',
    lat: 17.4375,
    lng: 78.4483,
    phone: '1947',
    timing: 'Mon–Sat, 9:30 AM – 5:30 PM',
    mapsUrl: 'https://www.google.com/maps/search/Aadhaar+Seva+Kendra+Ameerpet+Hyderabad',
    rating: 4.7,
    reviewCount: 530,
  },
  // Chennai
  {
    id: 'ask-chennai-1',
    name: 'Aadhaar Seva Kendra — T. Nagar',
    type: 'aadhaar_seva_kendra',
    typeLabel: 'Aadhaar Seva Kendra',
    address: 'Usman Road, T. Nagar, Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pinCode: '600017',
    lat: 13.0359,
    lng: 80.2340,
    phone: '1947',
    timing: 'Mon–Sat, 9:30 AM – 5:30 PM',
    mapsUrl: 'https://www.google.com/maps/search/Aadhaar+Seva+Kendra+T+Nagar+Chennai',
    rating: 4.8,
    reviewCount: 780,
  },
];

/**
 * Haversine distance (km) between two lat/lng points
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Search centres by city name (case-insensitive partial match)
 */
export function searchCentresByCity(city: string): AssistanceCentre[] {
  const q = city.toLowerCase().trim();
  const matched = hardcodedCentres.filter(
    (c) => c.city.toLowerCase().includes(q) || c.state.toLowerCase().includes(q)
  );
  return matched.map((c) => ({ ...c, distance: undefined }));
}

/**
 * Search centres by PIN code prefix
 */
export function searchCentresByPin(pin: string): AssistanceCentre[] {
  const q = pin.trim();
  return hardcodedCentres
    .filter((c) => c.pinCode.startsWith(q.substring(0, 3)))
    .map((c) => ({ ...c, distance: undefined }));
}

/**
 * Search centres by lat/lng, sorted by distance (Haversine)
 */
export function searchCentresByLocation(lat: number, lng: number): AssistanceCentre[] {
  return hardcodedCentres
    .map((c) => {
      const dist = haversineDistance(lat, lng, c.lat, c.lng);
      return {
        ...c,
        distanceKm: dist,
        distance: `${dist.toFixed(1)} km`,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 10)
    .map(({ distanceKm, ...rest }) => rest);
}

/**
 * Get all unique cities for manual dropdowns
 */
export function getAvailableCities(): string[] {
  return [...new Set(hardcodedCentres.map((c) => c.city))].sort();
}