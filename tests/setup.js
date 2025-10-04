// Mock Chrome APIs
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn(),
    openOptionsPage: jest.fn(),
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
};

// Mock LanguageModel API (Gemini Nano)
global.LanguageModel = {
  availability: jest.fn(),
  create: jest.fn(),
};

// Mock DOM methods
global.MutationObserver = class MutationObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  disconnect() {}
};

// Helper to create mock YouTube comment elements
global.createMockComment = (text, id = 'comment-1') => {
  const thread = document.createElement('ytd-comment-thread-renderer');
  const body = document.createElement('div');
  body.id = 'body';

  const contentText = document.createElement('div');
  contentText.id = 'content-text';
  contentText.textContent = text;

  body.appendChild(contentText);
  thread.appendChild(body);

  return thread;
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  document.body.innerHTML = '';
});