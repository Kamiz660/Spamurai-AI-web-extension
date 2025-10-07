// popup.js - Fixed version with proper error handling

function updateUI(stats, aiEnabled) {
  document.getElementById('total-scanned').textContent = stats.total;
  document.getElementById('count-red').textContent = `${stats.spam} Spam`;
  document.getElementById('count-yellow').textContent = `${stats.suspicious} Suspicious`;
  document.getElementById('count-green').textContent = `${stats.safe} Safe`;

  const poweredBy = document.getElementById('powered-by');
  if (aiEnabled) {
    poweredBy.innerHTML = 'powered by <span style="color: #69ff6e;">AI + keywords</span>';
  } else {
    poweredBy.textContent = 'powered by keyword filtering';
  }
}

function showError(message) {
  const statusElement = document.getElementById('status-message');
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.style.display = 'block';
  }
}

function hideError() {
  const statusElement = document.getElementById('status-message');
  if (statusElement) {
    statusElement.style.display = 'none';
  }
}

// Safe message sending with error handling
function sendMessageToContentScript(message, callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      showError('No active tab found');
      return;
    }

    const tab = tabs[0];
    
    // Check if it's a YouTube page
    if (!tab.url || !tab.url.includes('youtube.com/watch')) {
      showError('Please open a YouTube video page');
      updateUI({ total: 0, spam: 0, suspicious: 0, safe: 0 }, false);
      return;
    }

    chrome.tabs.sendMessage(tab.id, message, (response) => {
      // Check for runtime errors
      if (chrome.runtime.lastError) {
        console.log('Connection error:', chrome.runtime.lastError.message);
        showError('Spamurai not loaded on this page. Try refreshing.');
        updateUI({ total: 0, spam: 0, suspicious: 0, safe: 0 }, false);
        return;
      }

      hideError();
      
      if (callback && response) {
        callback(response);
      }
    });
  });
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  // Request stats from content script
  sendMessageToContentScript({ action: 'getStats' }, (response) => {
    if (response && response.stats) {
      updateUI(response.stats, response.aiEnabled);
    }
  });

  // Rescan button
  document.getElementById('rescan-button')?.addEventListener('click', () => {
    const button = document.getElementById('rescan-button');
    button.disabled = true;
    button.textContent = 'Scanning...';

    sendMessageToContentScript({ action: 'rescan' }, (response) => {
      button.disabled = false;
      button.textContent = 'Rescan';
      
      if (response && response.success) {
        // Stats will be updated via message from content script
        showError('Scan complete!');
        setTimeout(hideError, 2000);
      }
    });
  });

  // Toggle highlights button
  document.getElementById('highlight-toggle-button')?.addEventListener('click', () => {
    sendMessageToContentScript({ action: 'toggleHighlights' }, (response) => {
      if (response) {
        const button = document.getElementById('highlight-toggle-button');
        button.textContent = response.highlightsVisible ? 'Hide Highlights' : 'Show Highlights';
      }
    });
  });

  // Settings link
  document.getElementById('settings-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  // Feedback link
  document.getElementById('report-feedback-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ 
      url: 'https://github.com/yourusername/spamurai/issues' 
    });
  });
});

// Listen for stats updates from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStats') {
    updateUI(request.stats, request.aiEnabled);
    hideError();
  }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { updateUI };
}