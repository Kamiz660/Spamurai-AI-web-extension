# Spamurai Test Suite Documentation

## Overview
This test suite provides comprehensive unit, integration, and end-to-end testing for the Spamurai Chrome extension.

## Test Structure

```
tests/
├── setup.js              # Test environment setup and mocks
├── classification.test.js # Spam classification logic tests
├── popup.test.js          # Popup UI and interaction tests
├── content.test.js        # Content script integration tests
└── e2e.test.js           # End-to-end user flow tests
```

## Installation

Install test dependencies:

```bash
npm install
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (for development)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

### Run specific test suites
```bash
npm run test:classification  # Classification logic only
npm run test:popup          # Popup UI only
npm run test:content        # Content script only
npm run test:e2e           # E2E scenarios only
```

### Run tests verbosely
```bash
npm run test:verbose
```

## Test Coverage

### Classification Tests (`classification.test.js`)
Tests the core spam detection logic:
- ✅ High-risk keyword detection (spam)
- ✅ Medium-risk keyword detection (suspicious)
- ✅ Safe comment classification
- ✅ Case-insensitive matching
- ✅ Keyword detection in longer text
- ✅ Edge cases (empty text, special characters, long comments)
- ✅ Real-world comment examples
- ✅ AI classification mock behavior

**Total: 20+ test cases**

### Popup Tests (`popup.test.js`)
Tests the extension popup functionality:
- ✅ Statistics display updates
- ✅ AI enabled/disabled status display
- ✅ Button interactions (rescan, toggle highlights)
- ✅ Settings and feedback links
- ✅ Message handling from content script
- ✅ YouTube page detection
- ✅ Non-YouTube page handling

**Total: 15+ test cases**

### Content Script Tests (`content.test.js`)
Tests the content script integration:
- ✅ YouTube comment detection
- ✅ Comment text extraction
- ✅ Regular video vs Shorts detection
- ✅ Highlight application (spam, suspicious, safe)
- ✅ Highlight removal
- ✅ Statistics tracking
- ✅ Duplicate comment handling
- ✅ Message handlers (getStats, rescan, toggleHighlights)
- ✅ URL navigation detection
- ✅ AI session management

**Total: 25+ test cases**

### E2E Tests (`e2e.test.js`)
Tests complete user flows:
- ✅ Opening YouTube video and detecting spam
- ✅ Rescanning after scrolling
- ✅ Toggling highlight visibility
- ✅ Navigating between videos
- ✅ AI classification workflow
- ✅ Fallback to keyword classification
- ✅ Non-YouTube page handling
- ✅ High-volume comment sections

**Total: 10+ test cases**

## Mock Objects

### Chrome API Mocks
The test suite includes comprehensive Chrome extension API mocks:
- `chrome.runtime` - Message passing and extension info
- `chrome.tabs` - Tab queries and messaging
- `chrome.storage` - Local storage operations

### LanguageModel API Mock
Mock implementation of the Gemini Nano AI API:
- `LanguageModel.availability()` - Check AI availability
- `LanguageModel.create()` - Create AI session

### DOM Helpers
- `createMockComment(text)` - Creates mock YouTube comment elements

## Test Results Interpretation

### Test Output
```
PASS tests/classification.test.js
  Spam Classification
    ✓ should classify high-risk spam keywords as spam (3 ms)
    ✓ should classify medium-risk keywords as suspicious (2 ms)
    ...

Test Suites: 4 passed, 4 total
Tests:       70 passed, 70 total
```

### Coverage Report
```
File                | % Stmts | % Branch | % Funcs | % Lines
--------------------|---------|----------|---------|--------
All files           |   85.23 |    78.45 |   82.11 |   85.67
 content.js         |   82.50 |    75.30 |   80.00 |   83.20
 popup/popup.js     |   90.25 |    85.40 |   88.50 |   91.00
 background.js      |   100   |    100   |   100   |   100
```

## Writing New Tests

### Example Test Structure

```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup code
  });

  test('should do something specific', () => {
    // Arrange
    const input = 'test input';
    
    // Act
    const result = functionToTest(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
```

### Best Practices

1. **Descriptive test names**: Use clear, action-oriented descriptions
2. **AAA Pattern**: Arrange, Act, Assert
3. **Single responsibility**: Each test should verify one behavior
4. **Independent tests**: Tests should not depend on each other
5. **Mock external dependencies**: Use mocks for Chrome APIs and AI

## Common Issues

### Issue: Tests timing out
**Solution**: Make sure async tests use `async/await` or return promises

### Issue: Chrome API undefined
**Solution**: Check that `tests/setup.js` is properly configured in `jest.config.js`

### Issue: DOM elements not found
**Solution**: Ensure `document.body.innerHTML` is set up correctly in `beforeEach()`

## Continuous Integration

To integrate with CI/CD:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Future Improvements

- [ ] Add performance benchmarks
- [ ] Add visual regression testing
- [ ] Add accessibility testing
- [ ] Increase coverage to 90%+
- [ ] Add mutation testing
- [ ] Add load/stress testing for high-volume scenarios

## Contributing

When adding new features to Spamurai:
1. Write tests first (TDD approach)
2. Ensure all existing tests pass
3. Add tests for edge cases
4. Update this documentation

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Chrome Extension Testing](https://developer.chrome.com/docs/extensions/mv3/tut_testing/)
- [Testing Best Practices](https://testingjavascript.com/)