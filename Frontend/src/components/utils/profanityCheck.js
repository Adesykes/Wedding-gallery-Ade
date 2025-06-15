// Frontend profanity detection for immediate user feedback
// This is a simplified version of the backend filter
// We still rely on the backend for final validation

const commonProfanities = [
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

// Simple check for common profanities
export function checkForProfanity(text) {
  if (!text) return false;
  
  const words = text.toLowerCase().split(/\s+/);
  
  for (const word of words) {
    // Remove common punctuation
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    
    if (commonProfanities.some(profanity => 
      cleanWord === profanity || 
      cleanWord.includes(profanity)
    )) {
      return true;
    }
  }
  
  return false;
}

export default {
  checkForProfanity
};
