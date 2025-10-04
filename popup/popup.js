function updateUI(stats, aiEnabled) {
  document.getElementById('total-scanned').textContent = stats.total;
  document.getElementById('count-red').textContent = `${stats.spam} Spam`;
  document.getElementById('count-yellow').textContent = `${stats.suspicious} Suspicious`;
  document.getElementById('count-green').textContent = `${stats.safe} Safe`;

  // Update AI status indicator
  const poweredBy = document.getElementById('powered-by');
  if (aiEnabled) {
    poweredBy.innerHTML = 'powered by <span style="color: #69ff6e;">AI + keywords</span>';
  } else {
    poweredBy.textContent = 'powered by keyword filtering';
  }
}

// Get initial stats when popup opens
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]?.url?.includes('youtube.com/watch')) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getStats' }, (response) => {
      if (response && response.stats) {
        updateUI(response.stats, response.aiEnabled);
      }
    });
  } else {
    // Not on a YouTube video page
    document.getElementById('total-scanned').textContent = '0';
  }
});

// Listen for stat updates from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStats') {
    updateUI(request.stats, request.aiEnabled);
  }
});

// Rescan button
document.getElementById('rescan-button').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'rescan' }, (response) => {
      if (response && response.success) {
        console.log('Rescan completed');
      }
    });
  });
});

// Toggle highlights button
let highlightsVisible = true;
document.getElementById('highlight-toggle-button').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleHighlights' }, (response) => {
      if (response) {
        highlightsVisible = response.highlightsVisible;
        document.getElementById('highlight-toggle-button').textContent = 
          highlightsVisible ? 'Hide Highlights' : 'Show Highlights';
      }
    });
  });
});

// Settings link
document.getElementById('settings-link').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Report feedback link with better UX
document.getElementById('report-feedback-link').addEventListener('click', (e) => {
  e.preventDefault();

  // Create a temporary toast message
  const toast = document.createElement('div');
  toast.textContent = 'Feedback feature coming soon!';
  toast.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #946f6f;
    color: white;
    padding: 15px 25px;
    border-radius: 5px;
    font-size: 0.9rem;
    z-index: 1000;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    animation: fadeIn 0.3s ease;
  `;

  document.body.appendChild(toast);

  // Auto-remove after 2 seconds with fade out
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
});