// Background service worker for Spamurai
// Handles message passing between content script and popup

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Currently just passing messages through
  // Can add background tasks here if needed in the future
  return true;
});

console.log('Spamurai background service worker loaded');