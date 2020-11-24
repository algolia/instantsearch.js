/**
 * This implementation is taken from Lodash implementation.
 * See: https://github.com/lodash/lodash/blob/4.17.11-npm/unescape.js
 */

// Used to map HTML entities to characters.
const htmlEscapes = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

// Used to match HTML entities and HTML characters.
const regexEscapedHtml = /&(nbsp|amp|quot|lt|gt);/g;
const regexHasEscapedHtml = RegExp(regexEscapedHtml.source);

/**
 * Converts the HTML entities "&", "<", ">", '"', and "'" in `string` to their
 * characters.
 */
function unescape(value: string): string {
  return value && regexHasEscapedHtml.test(value)
    ? value.replace(regexEscapedHtml, character => htmlEscapes[character])
    : value;
}

export default unescape;
