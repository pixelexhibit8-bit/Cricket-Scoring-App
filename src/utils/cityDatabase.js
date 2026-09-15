/**
 * Comprehensive Indian Districts, Major Cities, and Global Cricket Hubs Database
 * Pre-indexed for high-speed offline fuzzy matching during tournament & team setup.
 */
export const POPULAR_CITIES = [
  // Rajasthan
  'Nagaur, Rajasthan',
  'Jaipur, Rajasthan',
  'Jodhpur, Rajasthan',
  'Bikaner, Rajasthan',
  'Ajmer, Rajasthan',
  'Udaipur, Rajasthan',
  'Sikar, Rajasthan',
  'Kota, Rajasthan',
  'Alwar, Rajasthan',
  'Bhilwara, Rajasthan',
  'Pali, Rajasthan',
  'Ganganagar, Rajasthan',
  'Bharatpur, Rajasthan',
  'Churu, Rajasthan',
  'Jhunjhunu, Rajasthan',
  'Barmer, Rajasthan',
  'Jalore, Rajasthan',
  'Hanumangarh, Rajasthan',
  'Didwana-Kuchaman, Rajasthan',
  'Beawar, Rajasthan',
  'Balotra, Rajasthan',
  'Phalodi, Rajasthan',

  // Metro & Major Indian Cities
  'Delhi, NCR',
  'New Delhi, Delhi',
  'Gurgaon (Gurugram), Haryana',
  'Noida, Uttar Pradesh',
  'Faridabad, Haryana',
  'Ghaziabad, Uttar Pradesh',
  'Mumbai, Maharashtra',
  'Pune, Maharashtra',
  'Thane, Maharashtra',
  'Nagpur, Maharashtra',
  'Nashik, Maharashtra',
  'Ahmedabad, Gujarat',
  'Surat, Gujarat',
  'Vadodara, Gujarat',
  'Rajkot, Gujarat',
  'Gandhinagar, Gujarat',
  'Bhavnagar, Gujarat',
  'Bangalore (Bengaluru), Karnataka',
  'Mysore, Karnataka',
  'Hubli, Karnataka',
  'Mangalore, Karnataka',
  'Hyderabad, Telangana',
  'Warangal, Telangana',
  'Secunderabad, Telangana',
  'Chennai, Tamil Nadu',
  'Coimbatore, Tamil Nadu',
  'Madurai, Tamil Nadu',
  'Kolkata, West Bengal',
  'Howrah, West Bengal',
  'Siliguri, West Bengal',
  'Indore, Madhya Pradesh',
  'Bhopal, Madhya Pradesh',
  'Gwalior, Madhya Pradesh',
  'Jabalpur, Madhya Pradesh',
  'Ujjain, Madhya Pradesh',
  'Chandigarh, Punjab',
  'Ludhiana, Punjab',
  'Amritsar, Punjab',
  'Jalandhar, Punjab',
  'Patiala, Punjab',
  'Lucknow, Uttar Pradesh',
  'Kanpur, Uttar Pradesh',
  'Varanasi, Uttar Pradesh',
  'Agra, Uttar Pradesh',
  'Prayagraj (Allahabad), Uttar Pradesh',
  'Meerut, Uttar Pradesh',
  'Patna, Bihar',
  'Gaya, Bihar',
  'Muzaffarpur, Bihar',
  'Bhagalpur, Bihar',
  'Ranchi, Jharkhand',
  'Jamshedpur, Jharkhand',
  'Dhanbad, Jharkhand',
  'Bhubaneswar, Odisha',
  'Cuttack, Odisha',
  'Rourkela, Odisha',
  'Raipur, Chhattisgarh',
  'Bilaspur, Chhattisgarh',
  'Guwahati, Assam',
  'Dehradun, Uttarakhand',
  'Haridwar, Uttarakhand',
  'Shimla, Himachal Pradesh',
  'Dharamshala, Himachal Pradesh',
  'Jammu, Jammu & Kashmir',
  'Srinagar, Jammu & Kashmir',
  'Panaji, Goa',

  // Global Cricket Cities
  'Dubai, United Arab Emirates',
  'Sharjah, United Arab Emirates',
  'Abu Dhabi, United Arab Emirates',
  'London, United Kingdom',
  'Birmingham, United Kingdom',
  'Manchester, United Kingdom',
  'Melbourne, Australia',
  'Sydney, Australia',
  'Brisbane, Australia',
  'Perth, Australia',
  'Adelaide, Australia',
  'Auckland, New Zealand',
  'Wellington, New Zealand',
  'Christchurch, New Zealand',
  'Johannesburg, South Africa',
  'Cape Town, South Africa',
  'Durban, South Africa',
  'Colombo, Sri Lanka',
  'Kandy, Sri Lanka',
  'Galle, Sri Lanka',
  'Dhaka, Bangladesh',
  'Chittagong, Bangladesh',
  'Toronto, Canada',
  'New York, United States',
  'Dallas, United States',
  'Houston, United States',
  'Los Angeles, United States',
  'San Francisco, United States',
  'Kathmandu, Nepal',
  'Singapore, Singapore'
];

/**
 * Filter and search cities with priority matching (prefix matches first, then contains)
 */
export function searchCities(query = '', limit = 8) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return POPULAR_CITIES.slice(0, limit);
  }

  const clean = query.toLowerCase().trim();
  const startsWithMatches = [];
  const containsMatches = [];

  for (const city of POPULAR_CITIES) {
    const lower = city.toLowerCase();
    if (lower.startsWith(clean)) {
      startsWithMatches.push(city);
    } else if (lower.includes(clean)) {
      containsMatches.push(city);
    }
    if (startsWithMatches.length + containsMatches.length >= limit * 2) break;
  }

  const combined = [...startsWithMatches, ...containsMatches];
  return combined.slice(0, limit);
}
