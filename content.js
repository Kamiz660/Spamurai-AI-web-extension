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
let aiSession = null;
let aiAvailable = false;

// Initialize AI session
async function initAI() {
  try {
    // Check if the API exists
    if (typeof LanguageModel === 'undefined') {
      console.log('Spamurai: LanguageModel API not available');
      return false;
    }

    // Check availability
    const availability = await LanguageModel.availability();
    console.log('Spamurai: AI availability:', availability);

    if (availability === 'no') {
      console.log('Spamurai: Gemini Nano not available on this device');
      return false;
    }

    if (availability === 'after-download') {
      console.log('Spamurai: Gemini Nano model needs to be downloaded');
      console.log('Visit chrome://components/ and update "Optimization Guide On Device Model"');
      return false;
    }

    // Create AI session with spam detection prompt
    aiSession = await LanguageModel.create({
      systemPrompt: `You are a spam detector for YouTube comments. 
      Analyze if a comment is spam or legitimate.
      Spam includes: self-promotion, scams, bots, fake engagement, phishing.
      Legitimate includes: genuine opinions, questions, discussions.
      Reply with ONLY one word: "spam" or "safe".`,
      // Specify expected inputs and outputs to avoid warnings
      expectedInputs: [
        { type: "text", languages: ["en"] }
      ],
      expectedOutputs: [
        { type: "text", languages: ["en"] }
      ]
    });

    aiAvailable = true;
    console.log('Spamurai: AI classification enabled!');
    return true;

  } catch (error) {
    console.log('Spamurai: AI initialization failed:', error.message);
    return false;
  }
}

// Classify comment using AI (for suspicious cases only)
async function classifyWithAI(text) {
  if (!aiSession || !aiAvailable) {
    return 'suspicious'; // Fallback if AI unavailable
  }

  try {
    const result = await aiSession.prompt(
      `Is this YouTube comment spam?\n\nComment: "${text}"\n\nAnswer:`
    );

    const response = result.toLowerCase().trim();

    // Parse AI response
    if (response.includes('spam')) {
      return 'spam';
    } else if (response.includes('safe')) {
      return 'safe';
    } else {
      return 'suspicious'; // Unclear response
    }

  } catch (error) {
    console.log('Spamurai: AI classification error:', error);
    return 'suspicious'; // Fallback on error
  }
}

// Classify comment based on keywords (TIER 1: Fast pre-filter)
function classifyByKeywords(text) {
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

// Hybrid classification: Keywords + AI
async function classifyComment(text) {
  // TIER 1: Fast keyword check
  const keywordResult = classifyByKeywords(text);

  // If obviously spam or safe, return immediately
  if (keywordResult === 'spam' || keywordResult === 'safe') {
    return { classification: keywordResult, usedAI: false };
  }

  // TIER 2: Use AI for ambiguous "suspicious" cases
  if (keywordResult === 'suspicious' && aiAvailable) {
    const aiResult = await classifyWithAI(text);
    return { classification: aiResult, usedAI: true };
  }

  // Fallback: No AI available
  return { classification: 'suspicious', usedAI: false };
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
async function analyzeComments() {
  const threads = document.querySelectorAll('ytd-comment-thread-renderer');

  for (const thread of threads) {
    const commentEl = thread.querySelector('#content-text');
    const text = commentEl ? commentEl.textContent.trim() : null;

    if (!text) continue;

    // Skip if already analyzed
    if (analyzedComments.has(text)) {
      // Re-apply highlight if needed
      highlightComment(thread, analyzedComments.get(text));
      continue;
    }

    // Classify new comment (hybrid approach)
    const { classification, usedAI } = await classifyComment(text);
    analyzedComments.set(text, classification);

    // Update stats
    stats.total++;
    stats[classification]++;

    // Highlight comment
    highlightComment(thread, classification);

    // Log AI usage for debugging (only for new comments)
    if (usedAI) {
      console.log(`Spamurai AI: "${text.substring(0, 50)}..." → ${classification}`);
    }
  }

  // Send stats to popup
  updatePopupStats();
}

// Update popup with current stats
function updatePopupStats() {
  try {
    chrome.runtime.sendMessage({
      action: 'updateStats',
      stats: stats,
      aiEnabled: aiAvailable
    });
  } catch (error) {
    // Extension context invalidated - happens when extension reloads
    // Silently ignore, will reinitialize on page refresh
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStats') {
    sendResponse({ stats: stats, aiEnabled: aiAvailable });
  } else if (request.action === 'rescan') {
    // Reset everything
    analyzedComments.clear();
    stats = { total: 0, spam: 0, suspicious: 0, safe: 0 };
    removeAllHighlights();
    analyzeComments().then(() => {
      sendResponse({ success: true });
    });
    return true; // Keep channel open for async response
  } else if (request.action === 'toggleHighlights') {
    highlightsVisible = !highlightsVisible;
    if (highlightsVisible) {
      analyzeComments(); // Re-apply highlights
    } else {
      removeAllHighlights();
    }
    sendResponse({ highlightsVisible: highlightsVisible });
  }
  return true;
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

// Initialize AI, then start observing
initAI().then(() => {
  observeComments();
});

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