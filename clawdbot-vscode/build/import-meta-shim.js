// Shim for import.meta in CommonJS environment
// In CommonJS, __filename and __dirname are automatically available
// This shim makes import.meta.url work by mapping it to the file:// URL

if (typeof import.meta === 'undefined') {
  globalThis.import = {
    meta: {
      get url() {
        // __filename is available in CommonJS
        return 'file://' + __filename;
      }
    }
  };
}
