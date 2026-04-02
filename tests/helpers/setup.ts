import { setJsonMode } from '../../src/utils/outputFormatter.js';

// Signal to production code that we're in a test environment
process.env.__TRELLOCLI_TEST = '1';

// Default to JSON mode in tests for consistent parsing
setJsonMode(true);
