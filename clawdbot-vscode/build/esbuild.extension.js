/**
 * esbuild configuration for VS Code extension host
 */

import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

const watch = process.argv.includes('--watch');

const config = {
  entryPoints: [resolve(rootDir, 'src/extension.ts')],
  bundle: true,
  outfile: resolve(rootDir, 'out/extension.cjs'),
  external: [
    'vscode',
    'playwright',
    'playwright-core',
  ],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: true,
  minify: !watch,
  logLevel: 'info',
  inject: [resolve(rootDir, 'build/import-meta-url-shim.cjs')],
};

async function build() {
  try {
    if (watch) {
      const context = await esbuild.context(config);
      await context.watch();
      console.log('👀 Watching extension for changes... - esbuild.extension.js:40');
    } else {
      await esbuild.build(config);
      console.log('✅ Extension built successfully! - esbuild.extension.js:43');
    }
  } catch (error) {
    console.error('❌ Build failed: - esbuild.extension.js:46', error);
    process.exit(1);
  }
}

build();
