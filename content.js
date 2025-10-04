// Spam detection keywords
const SPAM_KEYWORDS = {
  high: [
    'buy now', 'click here', 'free money', 'make money fast', 'earn cash',
    'bitcoin', 'crypto', 'investment opportunity', 'get rich', 'prize winner',
    'congratulations you won', 'claim your prize', 'limited time offer',
    'act now', 'subscribe to my channel', 'check out my channel', 'sub4sub',
    'onlyfans', 'telegram', 'whatsapp me', 'dm me', 'text me at'
  ],
  medium: [
    'check out', 'visit my', 'link in bio', 'click link', 'follow me',
    'thanks for sharing', 'great info', 'nice video', 'awesome content',
    'check my channel', 'new video', 'subscribe', 'sub back'
  ]
};

// Track analyzed comments
const analyzedComments = new Map(); // commentText -> classification
let stats = { total: 0, spam: 0, suspicious: 0, safe: 0 };
let highlightsVisible = true;

// Classify comment based on keywords
function classifyComment(text) {
  const lowerText = text.toLowerCase();

  // Check high-risk keywords
  for (const keyword of SPAM_KEYWORDS.high) {
    if (lowerText.includes(keyword)) {
      return 'spam';
    }
  }

  // Check medium-risk keywords
  for (const keyword of SPAM_KEYWORDS.medium) {
    if (lowerText.includes(keyword)) {
      return 'suspicious';
    }
  }

  return 'safe';
}

// Highlight comment based on classification
function highlightComment(threadElement, classification) {
  if (!highlightsVisible) return;

  const commentContent = threadElement.querySelector('#content-text');
  if (!commentContent) return;

  // Remove existing highlights
  commentContent.style.border = '';
  commentContent.style.backgroundColor = '';
  commentContent.style.padding = '';
  commentContent.style.borderRadius = '';

  // Apply new highlight
  switch (classification) {
    case 'spam':
      commentContent.style.border = '2px solid #f05247';
      commentContent.style.backgroundColor = 'rgba(240, 82, 71, 0.1)';
      commentContent.style.padding = '8px';
      commentContent.style.borderRadius = '4px';
      break;
    case 'suspicious':
      commentContent.style.border = '2px solid rgb(206, 206, 24)';
      commentContent.style.backgroundColor = 'rgba(206, 206, 24, 0.1)';
      commentContent.style.padding = '8px';
      commentContent.style.borderRadius = '4px';
      break;
    case 'safe':
      // No highlight for safe comments
      break;
  }
}

// Remove all highlights
function removeAllHighlights() {
  const threads = document.querySelectorAll('ytd-comment-thread-renderer');
  threads.forEach(thread => {
    const commentContent = thread.querySelector('#content-text');
    if (commentContent) {
      commentContent.style.border = '';
      commentContent.style.backgroundColor = '';
      commentContent.style.padding = '';
      commentContent.style.borderRadius = '';
    }
  });
}

// Analyze all visible comments
function analyzeComments() {
  const threads = document.querySelectorAll('ytd-comment-thread-renderer');

  threads.forEach(thread => {
    const commentEl = thread.querySelector('#content-text');
    const text = commentEl ? commentEl.textContent.trim() : null;

    if (!text) return;

    // Skip if already analyzed
    if (analyzedComments.has(text)) {
      // Re-apply highlight if needed
      highlightComment(thread, analyzedComments.get(text));
      return;
    }

    // Classify new comment
    const classification = classifyComment(text);
    analyzedComments.set(text, classification);

    // Update stats
    stats.total++;
    stats[classification]++;

    // Highlight comment
    highlightComment(thread, classification);
  });

  // Send stats to popup
  updatePopupStats();
}

// Update popup with current stats
function updatePopupStats() {
  chrome.runtime.sendMessage({
    action: 'updateStats',
    stats: stats
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStats') {
    sendResponse({ stats: stats });
  } else if (request.action === 'rescan') {
    // Reset everything
    analyzedComments.clear();
    stats = { total: 0, spam: 0, suspicious: 0, safe: 0 };
    removeAllHighlights();
    analyzeComments();
    sendResponse({ success: true });
  } else if (request.action === 'toggleHighlights') {
    highlightsVisible = !highlightsVisible;
    if (highlightsVisible) {
      analyzeComments(); // Re-apply highlights
    } else {
      removeAllHighlights();
    }
    sendResponse({ highlightsVisible: highlightsVisible });
  }
});

// Watch for new comments with MutationObserver
function observeComments() {
  const commentSection = document.querySelector('ytd-item-section-renderer#sections');

  if (!commentSection) {
    console.log('Comment section not loaded yet, retrying...');
    setTimeout(observeComments, 3000);
    return;
  }

  // Initial scan
  analyzeComments();

  // Watch for changes
  const observer = new MutationObserver(() => {
    analyzeComments();
  });

  observer.observe(commentSection, { childList: true, subtree: true });
  console.log('Spamurai: Continuous spam detection active');
}

// Start observing
observeComments();

// Periodic re-scan every 5 seconds to catch any missed comments
setInterval(() => {
  analyzeComments();
}, 5000);