/**
 * Normalizes a string by converting it to lowercase, removing all non-alphanumeric characters, and trimming.
 * Useful for comparing strings like titles and company names.
 * @param {string} str 
 * @returns {string} Normalized string
 */
function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '')
    .trim();
}

/**
 * Normalizes a URL by parsing it, stripping search queries/hashes, and lowering case.
 * @param {string} url 
 * @returns {string} Normalized URL path
 */
function normalizeUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return (parsed.hostname + parsed.pathname).toLowerCase().replace(/\/$/, '');
  } catch (e) {
    return url.toLowerCase().trim().replace(/\/$/, '');
  }
}

module.exports = {
  normalizeString,
  normalizeUrl
};
