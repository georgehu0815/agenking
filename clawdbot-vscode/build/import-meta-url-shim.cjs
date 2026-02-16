// Shim for import.meta.url in CommonJS
// This file is injected by esbuild to provide import.meta.url support

// In CommonJS, __filename is already available
// We just need to convert it to a file:// URL
const { pathToFileURL } = require('url');

// Create a getter that returns the current file's URL
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      get url() {
        // __filename is provided by CommonJS
        return pathToFileURL(__filename).href;
      }
    }
  },
  configurable: true
});
