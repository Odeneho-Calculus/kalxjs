// Suppress specific Node.js deprecation warnings
const originalEmit = process.emit;

// Override process.emit to filter out specific deprecation warnings
process.emit = function(event, ...args) {
  // Check if it's a warning about punycode
  if (
    event === 'warning' && 
    args[0] && 
    args[0].name === 'DeprecationWarning' && 
    args[0].message.includes('punycode')
  ) {
    // Suppress this specific warning
    return false;
  }
  
  // Call the original emit for all other events
  return originalEmit.apply(process, [event, ...args]);
};

// Export a dummy function to make this a valid ES module
export default function suppressWarnings() {
  // This function is just a placeholder
  return true;
}