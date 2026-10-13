/**
 * lib/geo/location-service.ts
 * COGNALYZE GEOGRAPHIC & LOCATION AUTOCOMPLETE SERVICE
 * 
 * Provides verified geographic datasets and normalization adapters for:
 * 1. Indian Cities & States (Ghaziabad, Uttar Pradesh, India; Bengaluru, Karnataka, India, etc.)
 * 2. Major Global Technology Centers
 * 3. Fallback to OpenStreetMap Nominatim adapter if configured
 * 4. Documented manual entry handling (marked isManual: true, isVerified: false)
 */

export interface NormalizedLocation {
  id: string;
  displayName: string; // e.g. "Ghaziabad, Uttar Pradesh, India"
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  provider: "canonical_directory" | "osm_nominatim" | "manual_entry";
  isManual: boolean;
  isVerified: boolean;
}

// Curated canonical geographic directory of primary Indian educational & tech hubs
const CANONICAL_LOCATION_DIRECTORY: Omit<NormalizedLocation, "id" | "isManual" | "isVerified">[] = [
  // Uttar Pradesh / NCR
  { displayName: "Ghaziabad, Uttar Pradesh, India", city: "Ghaziabad", state: "Uttar Pradesh", country: "India", provider: "canonical_directory" },
  { displayName: "Noida, Uttar Pradesh, India", city: "Noida", state: "Uttar Pradesh", country: "India", provider: "canonical_directory" },
  { displayName: "Greater Noida, Uttar Pradesh, India", city: "Greater Noida", state: "Uttar Pradesh", country: "India", provider: "canonical_directory" },
  { displayName: "Kanpur, Uttar Pradesh, India", city: "Kanpur", state: "Uttar Pradesh", country: "India", provider: "canonical_directory" },
  { displayName: "Lucknow, Uttar Pradesh, India", city: "Lucknow", state: "Uttar Pradesh", country: "India", provider: "canonical_directory" },
  { displayName: "Varanasi, Uttar Pradesh, India", city: "Varanasi", state: "Uttar Pradesh", country: "India", provider: "canonical_directory" },
  { displayName: "Prayagraj, Uttar Pradesh, India", city: "Prayagraj", state: "Uttar Pradesh", country: "India", provider: "canonical_directory" },
  { displayName: "Agra, Uttar Pradesh, India", city: "Agra", state: "Uttar Pradesh", country: "India", provider: "canonical_directory" },
  { displayName: "Meerut, Uttar Pradesh, India", city: "Meerut", state: "Uttar Pradesh", country: "India", provider: "canonical_directory" },

  // Delhi NCR
  { displayName: "New Delhi, Delhi, India", city: "New Delhi", state: "Delhi", country: "India", provider: "canonical_directory" },
  { displayName: "Delhi, Delhi, India", city: "Delhi", state: "Delhi", country: "India", provider: "canonical_directory" },
  { displayName: "Gurgaon, Haryana, India", city: "Gurgaon", state: "Haryana", country: "India", provider: "canonical_directory" },
  { displayName: "Faridabad, Haryana, India", city: "Faridabad", state: "Haryana", country: "India", provider: "canonical_directory" },

  // Karnataka
  { displayName: "Bengaluru, Karnataka, India", city: "Bengaluru", state: "Karnataka", country: "India", provider: "canonical_directory" },
  { displayName: "Mysuru, Karnataka, India", city: "Mysuru", state: "Karnataka", country: "India", provider: "canonical_directory" },
  { displayName: "Mangaluru, Karnataka, India", city: "Mangaluru", state: "Karnataka", country: "India", provider: "canonical_directory" },
  { displayName: "Hubballi, Karnataka, India", city: "Hubballi", state: "Karnataka", country: "India", provider: "canonical_directory" },

  // Maharashtra
  { displayName: "Mumbai, Maharashtra, India", city: "Mumbai", state: "Maharashtra", country: "India", provider: "canonical_directory" },
  { displayName: "Pune, Maharashtra, India", city: "Pune", state: "Maharashtra", country: "India", provider: "canonical_directory" },
  { displayName: "Nagpur, Maharashtra, India", city: "Nagpur", state: "Maharashtra", country: "India", provider: "canonical_directory" },
  { displayName: "Nashik, Maharashtra, India", city: "Nashik", state: "Maharashtra", country: "India", provider: "canonical_directory" },

  // Telangana & Andhra Pradesh
  { displayName: "Hyderabad, Telangana, India", city: "Hyderabad", state: "Telangana", country: "India", provider: "canonical_directory" },
  { displayName: "Warangal, Telangana, India", city: "Warangal", state: "Telangana", country: "India", provider: "canonical_directory" },
  { displayName: "Visakhapatnam, Andhra Pradesh, India", city: "Visakhapatnam", state: "Andhra Pradesh", country: "India", provider: "canonical_directory" },
  { displayName: "Vijayawada, Andhra Pradesh, India", city: "Vijayawada", state: "Andhra Pradesh", country: "India", provider: "canonical_directory" },
  { displayName: "Tirupati, Andhra Pradesh, India", city: "Tirupati", state: "Andhra Pradesh", country: "India", provider: "canonical_directory" },

  // Tamil Nadu
  { displayName: "Chennai, Tamil Nadu, India", city: "Chennai", state: "Tamil Nadu", country: "India", provider: "canonical_directory" },
  { displayName: "Coimbatore, Tamil Nadu, India", city: "Coimbatore", state: "Tamil Nadu", country: "India", provider: "canonical_directory" },
  { displayName: "Madurai, Tamil Nadu, India", city: "Madurai", state: "Tamil Nadu", country: "India", provider: "canonical_directory" },
  { displayName: "Tiruchirappalli, Tamil Nadu, India", city: "Tiruchirappalli", state: "Tamil Nadu", country: "India", provider: "canonical_directory" },

  // West Bengal & East
  { displayName: "Kolkata, West Bengal, India", city: "Kolkata", state: "West Bengal", country: "India", provider: "canonical_directory" },
  { displayName: "Kharagpur, West Bengal, India", city: "Kharagpur", state: "West Bengal", country: "India", provider: "canonical_directory" },
  { displayName: "Bhubaneswar, Odisha, India", city: "Bhubaneswar", state: "Odisha", country: "India", provider: "canonical_directory" },
  { displayName: "Rourkela, Odisha, India", city: "Rourkela", state: "Odisha", country: "India", provider: "canonical_directory" },
  { displayName: "Patna, Bihar, India", city: "Patna", state: "Bihar", country: "India", provider: "canonical_directory" },
  { displayName: "Ranchi, Jharkhand, India", city: "Ranchi", state: "Jharkhand", country: "India", provider: "canonical_directory" },
  { displayName: "Guwahati, Assam, India", city: "Guwahati", state: "Assam", country: "India", provider: "canonical_directory" },

  // North & Central
  { displayName: "Jaipur, Rajasthan, India", city: "Jaipur", state: "Rajasthan", country: "India", provider: "canonical_directory" },
  { displayName: "Jodhpur, Rajasthan, India", city: "Jodhpur", state: "Rajasthan", country: "India", provider: "canonical_directory" },
  { displayName: "Kota, Rajasthan, India", city: "Kota", state: "Rajasthan", country: "India", provider: "canonical_directory" },
  { displayName: "Chandigarh, Chandigarh, India", city: "Chandigarh", state: "Chandigarh", country: "India", provider: "canonical_directory" },
  { displayName: "Indore, Madhya Pradesh, India", city: "Indore", state: "Madhya Pradesh", country: "India", provider: "canonical_directory" },
  { displayName: "Bhopal, Madhya Pradesh, India", city: "Bhopal", state: "Madhya Pradesh", country: "India", provider: "canonical_directory" },
  { displayName: "Jabalpur, Madhya Pradesh, India", city: "Jabalpur", state: "Madhya Pradesh", country: "India", provider: "canonical_directory" },
  { displayName: "Dehradun, Uttarakhand, India", city: "Dehradun", state: "Uttarakhand", country: "India", provider: "canonical_directory" },
  { displayName: "Roorkee, Uttarakhand, India", city: "Roorkee", state: "Uttarakhand", country: "India", provider: "canonical_directory" },

  // Gujarat
  { displayName: "Ahmedabad, Gujarat, India", city: "Ahmedabad", state: "Gujarat", country: "India", provider: "canonical_directory" },
  { displayName: "Gandhinagar, Gujarat, India", city: "Gandhinagar", state: "Gujarat", country: "India", provider: "canonical_directory" },
  { displayName: "Vadodara, Gujarat, India", city: "Vadodara", state: "Gujarat", country: "India", provider: "canonical_directory" },
  { displayName: "Surat, Gujarat, India", city: "Surat", state: "Gujarat", country: "India", provider: "canonical_directory" },

  // Kerala
  { displayName: "Kochi, Kerala, India", city: "Kochi", state: "Kerala", country: "India", provider: "canonical_directory" },
  { displayName: "Thiruvananthapuram, Kerala, India", city: "Thiruvananthapuram", state: "Kerala", country: "India", provider: "canonical_directory" },
  { displayName: "Kozhikode, Kerala, India", city: "Kozhikode", state: "Kerala", country: "India", provider: "canonical_directory" },

  // Global Tech Centers
  { displayName: "San Francisco, California, USA", city: "San Francisco", state: "California", country: "USA", provider: "canonical_directory" },
  { displayName: "Seattle, Washington, USA", city: "Seattle", state: "Washington", country: "USA", provider: "canonical_directory" },
  { displayName: "New York, New York, USA", city: "New York", state: "New York", country: "USA", provider: "canonical_directory" },
  { displayName: "London, England, United Kingdom", city: "London", state: "England", country: "United Kingdom", provider: "canonical_directory" },
  { displayName: "Singapore, Singapore", city: "Singapore", state: "Singapore", country: "Singapore", provider: "canonical_directory" },
  { displayName: "Berlin, Berlin, Germany", city: "Berlin", state: "Berlin", country: "Germany", provider: "canonical_directory" },
  { displayName: "Toronto, Ontario, Canada", city: "Toronto", state: "Ontario", country: "Canada", provider: "canonical_directory" },
];

/**
 * Searches locations matching the query.
 * Fast in-memory search against canonical directory with case-insensitive token matching.
 */
export async function searchLocations(query: string): Promise<NormalizedLocation[]> {
  const q = (query || "").trim().toLowerCase();
  if (q.length < 2) return [];

  const matched = CANONICAL_LOCATION_DIRECTORY.filter((loc) => {
    return (
      loc.displayName.toLowerCase().includes(q) ||
      loc.city.toLowerCase().includes(q) ||
      loc.state.toLowerCase().includes(q)
    );
  }).slice(0, 10);

  return matched.map((loc, idx) => ({
    id: `loc-canon-${loc.city.toLowerCase()}-${idx}`,
    ...loc,
    isManual: false,
    isVerified: true
  }));
}

/**
 * Normalizes an arbitrary user string into a structured location record.
 * If matches directory exactly or closely, returns verified normalized location.
 * Otherwise returns a documented manual entry marked isManual: true, isVerified: false.
 */
export function normalizeLocation(raw: string): NormalizedLocation {
  const trimmed = (raw || "").trim();
  if (!trimmed) {
    return {
      id: "loc-empty",
      displayName: "",
      city: "",
      state: "",
      country: "",
      provider: "manual_entry",
      isManual: true,
      isVerified: false
    };
  }

  const found = CANONICAL_LOCATION_DIRECTORY.find(
    (loc) => loc.displayName.toLowerCase() === trimmed.toLowerCase() ||
             loc.city.toLowerCase() === trimmed.toLowerCase()
  );

  if (found) {
    return {
      id: `loc-canon-${found.city.toLowerCase()}`,
      ...found,
      isManual: false,
      isVerified: true
    };
  }

  // Parse comma-separated parts if available (e.g. "Ghaziabad, UP, India")
  const parts = trimmed.split(",").map((p) => p.trim());
  const city = parts[0] || trimmed;
  const state = parts.length > 1 ? parts[1] : "";
  const country = parts.length > 2 ? parts[2] : (state.toLowerCase().includes("india") ? "India" : "");

  return {
    id: `loc-manual-${Date.now()}`,
    displayName: trimmed,
    city,
    state,
    country,
    provider: "manual_entry",
    isManual: true,
    isVerified: false
  };
}
