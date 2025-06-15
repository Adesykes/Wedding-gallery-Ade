// Profanity filter utility for wedding gallery application
// This uses a simple array-based approach for checking profanity

// List of common profanities and offensive words to filter
// This list can be expanded as needed
const profanityList = [
  'ass',
  'asshole',
  'bastard',
  'bitch',
  'bollocks',
  'bullshit',
  'cock',
  'crap',
  'cunt',
  'damn',
  'dick',
  'dickhead',
  'fuck',
  'fucking',
  'motherfucker',
  'nigger',
  'piss',
  'prick',
  'pussy',
  'shit',
  'slut',
  'twat',
  'wanker',
  'whore'
];

// Regular expressions to catch variations and attempts to bypass the filter
const evasionPatterns = [
  /f+u+c+k+/i,
  /s+h+[i1l!]+t+/i,
  /b+[i1l!]+t+c+h+/i,
  /c+u+n+t+/i,
  /d+[i1l!]+c+k+/i,
  /a+s+s+h+o+l+e+/i,
  /w+h+o+r+e+/i,
  /n+[i1l!]+g+g+[e3]+r+/i
];

/**
 * Check if text contains profanity
 * @param {string} text - The text to check for profanity
 * @returns {boolean} - True if profanity is found, false otherwise
 */
function containsProfanity(text) {
  if (!text) return false;
  
  // Convert to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase();
  
  // Check against the word list
  for (const word of profanityList) {
    // Check for whole words using word boundaries
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lowerText)) {
      return true;
    }
  }
  
  // Check against evasion patterns
  for (const pattern of evasionPatterns) {
    if (pattern.test(lowerText)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get a clean version of text with profanities replaced
 * @param {string} text - The text to clean
 * @param {string} replacement - The string to replace profanities with (default: '****')
 * @returns {string} - Clean text with profanities replaced
 */
function cleanProfanity(text, replacement = '****') {
  if (!text) return text;
  
  let cleanText = text;
  
  // Replace words from the profanity list
  for (const word of profanityList) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    cleanText = cleanText.replace(regex, replacement);
  }
  
  // Replace evasion patterns
  for (const pattern of evasionPatterns) {
    cleanText = cleanText.replace(pattern, replacement);
  }
  
  return cleanText;
}

module.exports = {
  containsProfanity,
  cleanProfanity
};
