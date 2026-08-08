/**
 * Pure data helpers shared by pages to normalize backend responses, search,
 * group/index records, paginate results, and validate or parse image URLs.
 */
// Convert the different response formats used by Spring Boot into one array.
export function toArray(response, key) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (key && Array.isArray(response?.[key])) return response[key];
  if (key && Array.isArray(response?.data?.[key])) return response.data[key];
  return [];
}

// Create an object such as { 1: hotelOne, 2: hotelTwo } for quick lookup.
export function indexBy(items, key) {
  return Object.fromEntries(items.map((item) => [item[key], item]));
}

// Group records by a field, for example booking-room records by bookingId.
export function groupBy(items, key) {
  return items.reduce((groups, item) => {
    const groupName = item[key];
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(item);
    return groups;
  }, {});
}

// Return only one page while leaving the complete source array unchanged.
export function paginate(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

// Search several fields with one case-insensitive query.
export function containsText(search, fields) {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  return fields
    .filter((field) => field !== null && field !== undefined)
    .some((field) => String(field).toLowerCase().includes(query));
}

// Accept comma/newline input, remove whitespace, duplicates, and empty entries.
export function parseImageUrls(value) {
  return [
    ...new Set(
      value
        .split(/\r?\n|,/)
        .map((url) => url.trim())
        .filter(Boolean),
    ),
  ];
}

// Reject malformed URLs and protocols that cannot safely display remote images.
export function isValidHttpUrl(value) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
