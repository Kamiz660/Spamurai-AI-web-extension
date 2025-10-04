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

  // Target the main comment body container
  const commentBody = threadElement.querySelector('#body') ||
                      threadElement.querySelector('#comment') ||
                      threadElement;

  if (!commentBody) return;

  // Remove existing highlights
  commentBody.style.borderLeft = '';
  commentBody.style.backgroundColor = '';
  commentBody.style.paddingLeft = '';

  // Apply new highlight - using left border
  switch (classification) {
    case 'spam':
      commentBody.style.borderLeft = '4px solid #f05247';
      commentBody.style.backgroundColor = 'rgba(240, 82, 71, 0.05)';
      commentBody.style.paddingLeft = '12px';
      break;
    case 'suspicious':
      commentBody.style.borderLeft = '4px solid rgb(206, 206, 24)';
      commentBody.style.backgroundColor = 'rgba(206, 206, 24, 0.05)';
      commentBody.style.paddingLeft = '12px';
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
    const commentBody = thread.querySelector('#body') ||
                        thread.querySelector('#comment') ||
                        thread;
    if (commentBody) {
      commentBody.style.borderLeft = '';
      commentBody.style.backgroundColor = '';
      commentBody.style.paddingLeft = '';
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
  // Detect if Shorts or regular video
  const isShorts = window.location.pathname.includes('/shorts/');

  // Try multiple selectors based on page type
  let commentSection;
  if (isShorts) {
    // Shorts comment selectors
    commentSection = document.querySelector('ytd-comments#comments') ||
                     document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-comments-section"]') ||
                     document.querySelector('#comments');
  } else {
    // Regular video comment selectors
    commentSection = document.querySelector('ytd-item-section-renderer#sections') ||
                     document.querySelector('ytd-comments#comments');
  }

  if (!commentSection) {
    console.log(`Spamurai: Comment section not loaded yet (${isShorts ? 'Shorts' : 'Video'}), retrying...`);
    setTimeout(observeComments, 3000);
    return;
  }

  console.log(`Spamurai: Found comment section for ${isShorts ? 'Shorts' : 'Video'}`);

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

// Re-initialize observer when navigating between videos
let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    console.log('Spamurai: Page navigation detected, reinitializing...');
    // Reset stats for new video
    analyzedComments.clear();
    stats = { total: 0, spam: 0, suspicious: 0, safe: 0 };
    // Restart observation
    observeComments();
  }
}).observe(document, { subtree: true, childList: true });

// Periodic re-scan every 5 seconds to catch any missed comments
setInterval(() => {
  analyzeComments();
}, 5000);