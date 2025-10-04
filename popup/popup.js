function updateUI(stats, aiEnabled) {
  document.getElementById('total-scanned').textContent = stats.total;
  document.getElementById('count-red').textContent = `${stats.spam} Spam`;
  document.getElementById('count-yellow').textContent = `${stats.suspicious} Suspicious`;
  document.getElementById('count-green').textContent = `${stats.safe} Safe`;

  // Update AI status indicator
  const poweredBy = document.getElementById('powered-by');
  if (aiEnabled) {
    poweredBy.innerHTML = 'powered by <span style="color: #69ff6e;">AI + keywords</span> 🤖';
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

// Report feedback link
document.getElementById('report-feedback-link').addEventListener('click', (e) => {
  e.preventDefault();
  alert('Feedback feature coming soon!');
});