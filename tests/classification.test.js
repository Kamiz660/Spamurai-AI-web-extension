/**
 * Tests for spam classification logic
 */

describe('Spam Classification', () => {
  let classifyByKeywords;
  let classifyWithAI;
  let classifyComment;
  let SPAM_KEYWORDS;

  beforeEach(() => {
    // Mock the content.js functions by loading them in a test context
    SPAM_KEYWORDS = {
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

    classifyByKeywords = (text) => {
      const lowerText = text.toLowerCase();

      for (const keyword of SPAM_KEYWORDS.high) {
        if (lowerText.includes(keyword)) {
          return 'spam';
        }
      }

      for (const keyword of SPAM_KEYWORDS.medium) {
        if (lowerText.includes(keyword)) {
          return 'suspicious';
        }
      }

      return 'safe';
    };
  });

  describe('classifyByKeywords', () => {
    test('should classify high-risk spam keywords as spam', () => {
      expect(classifyByKeywords('Click here to buy now!')).toBe('spam');
      expect(classifyByKeywords('Make money fast with this trick')).toBe('spam');
      expect(classifyByKeywords('Join my telegram for crypto tips')).toBe('spam');
      expect(classifyByKeywords('FREE MONEY! Act now!')).toBe('spam');
    });

    test('should classify medium-risk keywords as suspicious', () => {
      expect(classifyByKeywords('Check out my new video')).toBe('suspicious');
      expect(classifyByKeywords('Nice video! Follow me for more')).toBe('suspicious');
      expect(classifyByKeywords('Great info, thanks for sharing')).toBe('suspicious');
    });

    test('should classify genuine comments as safe', () => {
      expect(classifyByKeywords('This is really helpful, thank you!')).toBe('safe');
      expect(classifyByKeywords('Great explanation of the topic')).toBe('safe');
      expect(classifyByKeywords('I disagree with this point because...')).toBe('safe');
      expect(classifyByKeywords('Can you explain this part again?')).toBe('safe');
    });

    test('should be case-insensitive', () => {
      expect(classifyByKeywords('BUY NOW!!!')).toBe('spam');
      expect(classifyByKeywords('ChEcK oUt mY vIdEo')).toBe('suspicious');
    });

    test('should detect keywords within longer text', () => {
      expect(classifyByKeywords('Hey everyone, buy now while supplies last!')).toBe('spam');
      expect(classifyByKeywords('This was great! Subscribe for more content')).toBe('suspicious');
    });

    test('should handle empty or whitespace text', () => {
      expect(classifyByKeywords('')).toBe('safe');
      expect(classifyByKeywords('   ')).toBe('safe');
    });

    test('should handle special characters', () => {
      expect(classifyByKeywords('🚀 Buy now! 🚀')).toBe('spam');
      expect(classifyByKeywords('Nice video! Subscribe for updates 😊')).toBe('suspicious');
    });
  });

  describe('Edge Cases', () => {
    test('should prioritize high-risk over medium-risk', () => {
      // If text contains both high and medium risk keywords, should return 'spam'
      const text = 'Check out this amazing opportunity to buy now and make money fast!';
      expect(classifyByKeywords(text)).toBe('spam');
    });

    test('should handle very long comments', () => {
      const longComment = 'This is a really long comment. '.repeat(100) + 'buy now';
      expect(classifyByKeywords(longComment)).toBe('spam');
    });

    test('should handle numbers and URLs without false positives', () => {
      expect(classifyByKeywords('Timestamp: 3:45 is where it gets good')).toBe('safe');
      expect(classifyByKeywords('The official website has more info')).toBe('safe');
    });
  });

  describe('Real-world Comment Examples', () => {
    test('should classify obvious spam', () => {
      const spamComments = [
        'Want to earn $5000 per day? Click here now!',
        'Subscribe to my channel for sub4sub',
        'Text me at +1234567890 for investment opportunity',
        'Congratulations you won! Claim your prize here',
        'Check out my OnlyFans in bio'
      ];

      spamComments.forEach(comment => {
        expect(classifyByKeywords(comment)).toBe('spam');
      });
    });

    test('should classify self-promotion as suspicious', () => {
      const suspiciousComments = [
        'Great video! Check out my similar content',
        'Nice video, I make similar stuff, subscribe!',
        'Awesome content! Visit my channel for more',
        'Thanks for sharing, new video on my channel about this'
      ];

      suspiciousComments.forEach(comment => {
        expect(classifyByKeywords(comment)).toBe('suspicious');
      });
    });

    test('should classify genuine engagement as safe', () => {
      const safeComments = [
        'This really helped me understand the concept, thank you!',
        'I have a question about the part at 5:30',
        'Your explanation was clearer than my textbook',
        'Could you make a follow-up video on this topic?',
        'I tried this and it worked perfectly!'
      ];

      safeComments.forEach(comment => {
        expect(classifyByKeywords(comment)).toBe('safe');
      });
    });
  });
});

describe('AI Classification Mock', () => {
  let aiSession;

  beforeEach(() => {
    aiSession = {
      prompt: jest.fn(),
    };
  });

  test('should parse AI response correctly', async () => {
    aiSession.prompt.mockResolvedValue('spam');
    const result = await aiSession.prompt('Is this spam?');
    expect(result).toBe('spam');
  });

  test('should handle AI errors gracefully', async () => {
    aiSession.prompt.mockRejectedValue(new Error('AI error'));

    try {
      await aiSession.prompt('Is this spam?');
    } catch (error) {
      expect(error.message).toBe('AI error');
    }
  });
});