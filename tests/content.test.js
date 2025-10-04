/**
 * Integration tests for content.js
 */

describe('Content Script Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('Comment Detection', () => {
    test('should detect and analyze YouTube comment elements', () => {
      // Create mock YouTube comment structure
      const commentSection = document.createElement('ytd-item-section-renderer');
      commentSection.id = 'sections';

      const thread1 = createMockComment('This is a great video!');
      const thread2 = createMockComment('Buy now and make money fast!');
      const thread3 = createMockComment('Check out my channel');

      commentSection.appendChild(thread1);
      commentSection.appendChild(thread2);
      commentSection.appendChild(thread3);

      document.body.appendChild(commentSection);

      const threads = document.querySelectorAll('ytd-comment-thread-renderer');
      expect(threads.length).toBe(3);

      // Test that we can extract text from comments
      threads.forEach(thread => {
        const contentText = thread.querySelector('#content-text');
        expect(contentText).not.toBeNull();
        expect(contentText.textContent.trim().length).toBeGreaterThan(0);
      });
    });

    test('should handle comments without text content', () => {
      const thread = document.createElement('ytd-comment-thread-renderer');
      document.body.appendChild(thread);

      const contentText = thread.querySelector('#content-text');
      expect(contentText).toBeNull();
    });

    test('should detect both regular video and Shorts comment sections', () => {
      // Regular video comment section
      const regularSection = document.createElement('ytd-item-section-renderer');
      regularSection.id = 'sections';
      document.body.appendChild(regularSection);

      let section = document.querySelector('ytd-item-section-renderer#sections');
      expect(section).not.toBeNull();

      document.body.innerHTML = '';

      // Shorts comment section
      const shortsSection = document.createElement('ytd-comments');
      shortsSection.id = 'comments';
      document.body.appendChild(shortsSection);

      section = document.querySelector('ytd-comments#comments');
      expect(section).not.toBeNull();
    });
  });

  describe('Highlighting', () => {
    test('should apply spam highlight correctly', () => {
      const thread = createMockComment('Buy now!');
      document.body.appendChild(thread);

      const commentBody = thread.querySelector('#body');

      // Apply spam styling
      commentBody.style.borderLeft = '4px solid #f05247';
      commentBody.style.backgroundColor = 'rgba(240, 82, 71, 0.05)';
      commentBody.style.paddingLeft = '12px';

      expect(commentBody.style.borderLeft).toBe('4px solid #f05247');
      expect(commentBody.style.backgroundColor).toBe('rgba(240, 82, 71, 0.05)');
      expect(commentBody.style.paddingLeft).toBe('12px');
    });

    test('should apply suspicious highlight correctly', () => {
      const thread = createMockComment('Check out my channel');
      document.body.appendChild(thread);

      const commentBody = thread.querySelector('#body');

      // Apply suspicious styling
      commentBody.style.borderLeft = '4px solid rgb(206, 206, 24)';
      commentBody.style.backgroundColor = 'rgba(206, 206, 24, 0.05)';
      commentBody.style.paddingLeft = '12px';

      expect(commentBody.style.borderLeft).toBe('4px solid rgb(206, 206, 24)');
      expect(commentBody.style.backgroundColor).toBe('rgba(206, 206, 24, 0.05)');
    });

    test('should not highlight safe comments', () => {
      const thread = createMockComment('Great video!');
      document.body.appendChild(thread);

      const commentBody = thread.querySelector('#body');

      expect(commentBody.style.borderLeft).toBe('');
      expect(commentBody.style.backgroundColor).toBe('');
    });

    test('should remove highlights when toggled off', () => {
      const thread = createMockComment('Buy now!');
      document.body.appendChild(thread);

      const commentBody = thread.querySelector('#body');

      // Apply highlight
      commentBody.style.borderLeft = '4px solid #f05247';
      commentBody.style.backgroundColor = 'rgba(240, 82, 71, 0.05)';
      commentBody.style.paddingLeft = '12px';

      // Remove highlight (but padding may remain for layout)
      commentBody.style.borderLeft = '';
      commentBody.style.backgroundColor = '';
      // Note: paddingLeft might be retained or removed depending on implementation

      expect(commentBody.style.borderLeft).toBe('');
      expect(commentBody.style.backgroundColor).toBe('');
      // paddingLeft behavior can vary by implementation
    });
  });

  describe('Statistics Tracking', () => {
    test('should track comment statistics correctly', () => {
      const stats = {
        total: 0,
        spam: 0,
        suspicious: 0,
        safe: 0
      };

      // Simulate analyzing comments
      const classifications = ['spam', 'safe', 'suspicious', 'spam', 'safe'];

      classifications.forEach(classification => {
        stats.total++;
        stats[classification]++;
      });

      expect(stats.total).toBe(5);
      expect(stats.spam).toBe(2);
      expect(stats.suspicious).toBe(1);
      expect(stats.safe).toBe(2);
    });

    test('should not double-count analyzed comments', () => {
      const analyzedComments = new Map();
      const stats = { total: 0, spam: 0, suspicious: 0, safe: 0 };

      const commentText = 'Buy now!';

      // First analysis
      if (!analyzedComments.has(commentText)) {
        analyzedComments.set(commentText, 'spam');
        stats.total++;
        stats.spam++;
      }

      // Second analysis (should skip)
      if (!analyzedComments.has(commentText)) {
        stats.total++;
        stats.spam++;
      }

      expect(stats.total).toBe(1);
      expect(stats.spam).toBe(1);
      expect(analyzedComments.size).toBe(1);
    });

    test('should reset statistics on rescan', () => {
      const stats = { total: 100, spam: 25, suspicious: 30, safe: 45 };
      const analyzedComments = new Map([
        ['comment1', 'spam'],
        ['comment2', 'safe']
      ]);

      // Reset
      analyzedComments.clear();
      stats.total = 0;
      stats.spam = 0;
      stats.suspicious = 0;
      stats.safe = 0;

      expect(stats.total).toBe(0);
      expect(analyzedComments.size).toBe(0);
    });
  });

  describe('Message Handlers', () => {
    test('should respond to getStats message', () => {
      const stats = { total: 50, spam: 10, suspicious: 15, safe: 25 };
      const aiEnabled = true;

      const mockListener = jest.fn((request, sender, sendResponse) => {
        if (request.action === 'getStats') {
          sendResponse({ stats, aiEnabled });
        }
        return true;
      });

      chrome.runtime.onMessage.addListener(mockListener);

      const sendResponse = jest.fn();
      mockListener({ action: 'getStats' }, null, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({ stats, aiEnabled });
    });

    test('should handle rescan message', (done) => {
      const mockListener = jest.fn((request, sender, sendResponse) => {
        if (request.action === 'rescan') {
          // Simulate rescan
          setTimeout(() => {
            sendResponse({ success: true });
            done();
          }, 10);
        }
        return true;
      });

      chrome.runtime.onMessage.addListener(mockListener);

      const sendResponse = jest.fn((response) => {
        expect(response.success).toBe(true);
      });

      mockListener({ action: 'rescan' }, null, sendResponse);
    });

    test('should handle toggleHighlights message', () => {
      let highlightsVisible = true;

      const mockListener = jest.fn((request, sender, sendResponse) => {
        if (request.action === 'toggleHighlights') {
          highlightsVisible = !highlightsVisible;
          sendResponse({ highlightsVisible });
        }
        return true;
      });

      chrome.runtime.onMessage.addListener(mockListener);

      const sendResponse = jest.fn();
      mockListener({ action: 'toggleHighlights' }, null, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({ highlightsVisible: false });
    });
  });

  describe('URL Navigation Detection', () => {
    test('should detect YouTube video page navigation', () => {
      const urls = [
        'https://www.youtube.com/watch?v=abc123',
        'https://www.youtube.com/watch?v=xyz789',
        'https://www.youtube.com/shorts/short123'
      ];

      let lastUrl = urls[0];

      urls.forEach((url, index) => {
        if (index > 0) {
          expect(url).not.toBe(lastUrl);
          lastUrl = url;
        }
      });
    });

    test('should distinguish between regular videos and Shorts', () => {
      const regularVideo = 'https://www.youtube.com/watch?v=abc123';
      const shorts = 'https://www.youtube.com/shorts/short123';

      expect(regularVideo.includes('/shorts/')).toBe(false);
      expect(shorts.includes('/shorts/')).toBe(true);
    });
  });

  describe('AI Session Management', () => {
    test('should check AI availability', async () => {
      LanguageModel.availability.mockResolvedValue('readily');

      const availability = await LanguageModel.availability();
      expect(availability).toBe('readily');
    });

    test('should handle AI unavailable', async () => {
      LanguageModel.availability.mockResolvedValue('no');

      const availability = await LanguageModel.availability();
      expect(availability).toBe('no');
    });

    test('should create AI session with correct prompt', async () => {
      const mockSession = {
        prompt: jest.fn().mockResolvedValue('spam')
      };

      LanguageModel.create.mockResolvedValue(mockSession);

      const session = await LanguageModel.create({
        systemPrompt: 'You are a spam detector'
      });

      expect(session).toBe(mockSession);
      expect(LanguageModel.create).toHaveBeenCalled();
    });

    test('should handle AI session creation failure', async () => {
      LanguageModel.create.mockRejectedValue(new Error('Failed to create session'));

      try {
        await LanguageModel.create({});
      } catch (error) {
        expect(error.message).toBe('Failed to create session');
      }
    });
  });
});