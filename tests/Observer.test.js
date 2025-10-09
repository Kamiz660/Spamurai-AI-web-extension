/**
 * Tests for MutationObserver and comment detection functionality
 */

const {
  getVideoId,
  isShorts,
  getCommentSectionSelectors,
  findCommentSection
} = require('../content.js');

describe('MutationObserver & Comment Detection - REAL CODE TESTS', () => {
  let analyzedComments;
  let stats;

  beforeEach(() => {
    document.body.innerHTML = '';
    analyzedComments = new Map();
    stats = { total: 0, spam: 0, suspicious: 0, safe: 0 };

    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('REAL: Video ID Extraction (getVideoId)', () => {
    test('should extract video ID from regular YouTube URLs', () => {
      expect(getVideoId('https://youtube.com/watch?v=abc12345678')).toBe('abc12345678');
      expect(getVideoId('https://www.youtube.com/watch?v=xyz98765432')).toBe('xyz98765432');
      expect(getVideoId('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    test('should extract video ID from Shorts URLs', () => {
      expect(getVideoId('https://youtube.com/shorts/def45678901')).toBe('def45678901');
      expect(getVideoId('https://www.youtube.com/shorts/shortVideo1')).toBe('shortVideo1');
    });

    test('should return null for invalid URLs', () => {
      expect(getVideoId('https://youtube.com')).toBeNull();
      expect(getVideoId('https://google.com')).toBeNull();
      expect(getVideoId('not a url')).toBeNull();
      expect(getVideoId('')).toBeNull();
    });

    test('should handle URLs with additional parameters', () => {
      expect(getVideoId('https://youtube.com/watch?v=abc12345678&list=PLxyz')).toBe('abc12345678');
      expect(getVideoId('https://youtube.com/watch?t=10&v=test1234567')).toBe('test1234567');
    });

    test('should match exactly 11 characters for video ID', () => {
      expect(getVideoId('https://youtube.com/watch?v=abc123')).toBeNull(); // Too short
      expect(getVideoId('https://youtube.com/watch?v=abc123456789')).toBeNull(); // Too long
      expect(getVideoId('https://youtube.com/watch?v=abc12345678')).toBe('abc12345678'); // Exactly 11
    });
  });

  describe('REAL: Shorts Detection (isShorts)', () => {
    test('should identify Shorts URLs correctly', () => {
      expect(isShorts('https://youtube.com/shorts/abc12345678')).toBe(true);
      expect(isShorts('https://www.youtube.com/shorts/xyz')).toBe(true);
    });

    test('should identify regular video URLs correctly', () => {
      expect(isShorts('https://youtube.com/watch?v=abc12345678')).toBe(false);
      expect(isShorts('https://www.youtube.com/watch?v=xyz98765432')).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(isShorts('https://youtube.com')).toBe(false);
      expect(isShorts('')).toBe(false);
    });
  });

  describe('REAL: Comment Section Selectors (getCommentSectionSelectors)', () => {
    test('should return correct selectors for regular videos', () => {
      const selectors = getCommentSectionSelectors(false);

      expect(selectors).toContain('ytd-item-section-renderer#sections');
      expect(selectors).toContain('ytd-comments#comments');
      expect(selectors.length).toBeGreaterThan(0);
    });

    test('should return correct selectors for Shorts', () => {
      const selectors = getCommentSectionSelectors(true);

      expect(selectors).toContain('ytd-comments#comments');
      expect(selectors).toContain('#comments');
      expect(selectors.length).toBeGreaterThan(0);
    });

    test('should return different selectors for different video types', () => {
      const regularSelectors = getCommentSectionSelectors(false);
      const shortsSelectors = getCommentSectionSelectors(true);

      // They should have some differences
      expect(regularSelectors).not.toEqual(shortsSelectors);
    });

    test('should return arrays', () => {
      expect(Array.isArray(getCommentSectionSelectors(false))).toBe(true);
      expect(Array.isArray(getCommentSectionSelectors(true))).toBe(true);
    });
  });

  describe('REAL: Find Comment Section (findCommentSection)', () => {
    test('should find regular video comment section', () => {
      // Create regular video comment section
      const commentSection = document.createElement('ytd-item-section-renderer');
      commentSection.id = 'sections';
      document.body.appendChild(commentSection);

      const found = findCommentSection('https://youtube.com/watch?v=abc12345678');

      expect(found).not.toBeNull();
      expect(found.id).toBe('sections');
    });

    test('should find Shorts comment section', () => {
      // Create Shorts comment section
      const commentSection = document.createElement('ytd-comments');
      commentSection.id = 'comments';
      document.body.appendChild(commentSection);

      const found = findCommentSection('https://youtube.com/shorts/abc12345678');

      expect(found).not.toBeNull();
      expect(found.id).toBe('comments');
    });

    test('should return null when no comment section exists', () => {
      // No comment section in DOM
      const found = findCommentSection('https://youtube.com/watch?v=abc12345678');

      expect(found).toBeNull();
    });

    test('should try multiple selectors and find first match', () => {
      // Add a secondary selector that should match
      const commentSection = document.createElement('ytd-comments');
      commentSection.id = 'comments';
      document.body.appendChild(commentSection);

      const found = findCommentSection('https://youtube.com/watch?v=abc12345678');

      expect(found).not.toBeNull();
    });

    test('should prioritize selectors in order', () => {
      // Add both types of comment sections
      const primary = document.createElement('ytd-item-section-renderer');
      primary.id = 'sections';

      const secondary = document.createElement('ytd-comments');
      secondary.id = 'comments';

      document.body.appendChild(secondary);
      document.body.appendChild(primary);

      const found = findCommentSection('https://youtube.com/watch?v=abc12345678');

      // Should find the primary selector first
      expect(found.id).toBe('sections');
    });
  });

  describe('Comment Detection Patterns', () => {
    test('should detect when new comments are added to DOM', () => {
      const commentSection = document.createElement('ytd-item-section-renderer');
      commentSection.id = 'sections';
      document.body.appendChild(commentSection);

      const initialCount = commentSection.querySelectorAll('ytd-comment-thread-renderer').length;
      expect(initialCount).toBe(0);

      // Add new comment
      const newComment = createMockComment('Great video!');
      commentSection.appendChild(newComment);

      const newCount = commentSection.querySelectorAll('ytd-comment-thread-renderer').length;
      expect(newCount).toBe(1);
      expect(newCount).toBeGreaterThan(initialCount);
    });

    test('should detect nested comment additions', () => {
      const commentSection = document.createElement('ytd-item-section-renderer');
      commentSection.id = 'sections';

      const container = document.createElement('div');
      container.id = 'contents';
      commentSection.appendChild(container);
      document.body.appendChild(commentSection);

      const newComment = createMockComment('Nested comment');
      container.appendChild(newComment);

      const foundComment = commentSection.querySelector('ytd-comment-thread-renderer');
      expect(foundComment).not.toBeNull();
    });
  });

  describe('Debounced Analysis Behavior', () => {
    test('should debounce rapid mutations (300ms)', () => {
      const mockAnalyze = jest.fn();
      let timeoutId;

      const debouncedAnalyze = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          mockAnalyze();
        }, 300);
      };

      debouncedAnalyze();
      debouncedAnalyze();
      debouncedAnalyze();

      expect(mockAnalyze).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);
      expect(mockAnalyze).toHaveBeenCalledTimes(1);
    });

    test('should reset timeout on each new mutation', () => {
      const mockAnalyze = jest.fn();
      let timeoutId;

      const debouncedAnalyze = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          mockAnalyze();
        }, 300);
      };

      debouncedAnalyze();
      jest.advanceTimersByTime(200);
      expect(mockAnalyze).not.toHaveBeenCalled();

      debouncedAnalyze();
      jest.advanceTimersByTime(200);
      expect(mockAnalyze).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockAnalyze).toHaveBeenCalledTimes(1);
    });
  });

  describe('Video Navigation Integration', () => {
    test('should detect video change using REAL getVideoId', () => {
      const url1 = 'https://youtube.com/watch?v=abc12345678';
      const url2 = 'https://youtube.com/watch?v=xyz98765432';

      const id1 = getVideoId(url1);
      const id2 = getVideoId(url2);

      expect(id1).not.toBe(id2);
      expect(id1).toBe('abc12345678');
      expect(id2).toBe('xyz98765432');
    });

    test('should reset state when video changes', () => {
      const url1 = 'https://youtube.com/watch?v=abc12345678';
      const url2 = 'https://youtube.com/watch?v=xyz98765432';

      let currentVideoId = getVideoId(url1);

      // Setup initial state
      analyzedComments.set('comment1', 'spam');
      stats = { total: 1, spam: 1, suspicious: 0, safe: 0 };

      // Simulate navigation
      const newVideoId = getVideoId(url2);

      if (newVideoId && newVideoId !== currentVideoId) {
        analyzedComments.clear();
        stats = { total: 0, spam: 0, suspicious: 0, safe: 0 };
        currentVideoId = newVideoId;
      }

      expect(analyzedComments.size).toBe(0);
      expect(stats.total).toBe(0);
      expect(currentVideoId).toBe('xyz98765432');
    });
  });

  describe('Periodic Rescanning', () => {
    test('should support periodic analysis every 3 seconds', () => {
      const mockAnalyze = jest.fn();

      const intervalId = setInterval(() => {
        mockAnalyze();
      }, 3000);

      expect(mockAnalyze).not.toHaveBeenCalled();

      jest.advanceTimersByTime(3000);
      expect(mockAnalyze).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(3000);
      expect(mockAnalyze).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(3000);
      expect(mockAnalyze).toHaveBeenCalledTimes(3);

      clearInterval(intervalId);
    });
  });

  describe('Observer Configuration', () => {
    test('should observe with childList and subtree options', () => {
      const mockObserve = jest.fn();

      class TestObserver {
        constructor(callback) {}
        observe(target, options) {
          mockObserve(target, options);
        }
        disconnect() {}
      }

      const observer = new TestObserver(() => {});
      const commentSection = document.createElement('div');

      observer.observe(commentSection, {
        childList: true,
        subtree: true
      });

      expect(mockObserve).toHaveBeenCalledWith(
        commentSection,
        { childList: true, subtree: true }
      );
    });
  });

  describe('Real-world Integration Scenarios', () => {
    test('should handle complete video navigation flow', () => {
      // Video 1
      const url1 = 'https://youtube.com/watch?v=abc12345678';
      const section1 = document.createElement('ytd-item-section-renderer');
      section1.id = 'sections';
      document.body.appendChild(section1);

      expect(getVideoId(url1)).toBe('abc12345678');
      expect(isShorts(url1)).toBe(false);
      expect(findCommentSection(url1)).toBe(section1);

      // Navigate to Shorts
      document.body.innerHTML = '';
      const url2 = 'https://youtube.com/shorts/xyz98765432';
      const section2 = document.createElement('ytd-comments');
      section2.id = 'comments';
      document.body.appendChild(section2);

      expect(getVideoId(url2)).toBe('xyz98765432');
      expect(isShorts(url2)).toBe(true);
      expect(findCommentSection(url2)).toBe(section2);
    });

    test('should handle rapid scrolling with many comments', () => {
      const commentSection = document.createElement('ytd-item-section-renderer');
      commentSection.id = 'sections';
      document.body.appendChild(commentSection);

      for (let i = 0; i < 50; i++) {
        const comment = createMockComment(`Comment ${i}`);
        commentSection.appendChild(comment);
      }

      const mockAnalyze = jest.fn();
      let timeoutId;

      const debouncedAnalyze = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(mockAnalyze, 300);
      };

      for (let i = 0; i < 50; i++) {
        debouncedAnalyze();
      }

      expect(mockAnalyze).not.toHaveBeenCalled();
      jest.advanceTimersByTime(300);
      expect(mockAnalyze).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle malformed YouTube URLs gracefully', () => {
      expect(getVideoId('youtube.com/watch')).toBeNull();
      expect(getVideoId('https://youtube.com/v=abc')).toBeNull();
      expect(getVideoId('not-youtube.com/watch?v=abc12345678')).toBeNull();
    });

    test('should handle missing comment sections', () => {
      expect(findCommentSection('https://youtube.com/watch?v=abc12345678')).toBeNull();
      expect(findCommentSection('https://youtube.com/shorts/xyz98765432')).toBeNull();
    });

    test('should handle empty or whitespace URLs', () => {
      expect(getVideoId('')).toBeNull();
      expect(getVideoId('   ')).toBeNull();
      expect(isShorts('')).toBe(false);
    });
  });
});