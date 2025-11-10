# E2E Tests

End-to-end tests for the VRC Character Updater Electron application.

## Current Status

The E2E test structure is in place, but tests need to be implemented with a proper Electron testing framework.

## Setup Options

### Option 1: Playwright (Recommended for modern Electron)
```bash
npm install --save-dev playwright @playwright/test
```

### Option 2: Spectron (Traditional Electron testing)
```bash
npm install --save-dev spectron
```

### Option 3: Custom Test Harness
Create a custom test harness using Electron's built-in capabilities.

## Running E2E Tests

Once implemented:
```bash
npm run test:e2e
```

## Test Structure

- `app.test.js` - Main application E2E tests (placeholder structure)
  - Application launch tests
  - UI element visibility tests
  - User interaction tests
  - JSON validation tests
  - File operation tests

## Implementation Notes

- E2E tests require the Electron app to be runnable
- Tests may need API mocking for full isolation
- File dialog interactions are difficult to test automatically
- API calls should be mocked for reliable testing

## Test Coverage Goals

- [ ] Application launch and window creation
- [ ] UI element visibility and interaction
- [ ] JSON fetch on startup
- [ ] JSON editing functionality
- [ ] JSON validation
- [ ] Error handling and status messages
- [ ] File load/save operations (with mocked dialogs)
- [ ] Upload functionality (with mocked API)

## Future Improvements

- Implement full E2E test suite
- Add API mocking for JSONBin calls
- Add visual regression tests
- Add accessibility tests
- Add performance tests

