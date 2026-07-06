import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';
import {viteSingleFile} from 'vite-plugin-singlefile';

// Custom Vite plugin to handle case-insensitive file resolution on case-sensitive systems (like GitHub Actions runners)
const caseInsensitiveResolver = () => ({
  name: 'case-insensitive-resolver',
  resolveId(source: string, importer: string | undefined) {
    if (source.startsWith('.') || source.startsWith('/') || source.startsWith('@/')) {
      let targetPath = '';
      if (source.startsWith('@/')) {
        targetPath = path.resolve(__dirname, source.slice(2));
      } else if (source.startsWith('/')) {
        targetPath = path.resolve(__dirname, source.slice(1));
      } else if (importer) {
        targetPath = path.resolve(path.dirname(importer), source);
      } else {
        targetPath = path.resolve(__dirname, source);
      }

      // If the file exists with the requested casing, let Vite handle it natively
      if (fs.existsSync(targetPath)) {
        return null;
      }

      // Otherwise, scan the directory for a case-insensitive match
      const extensions = ['', '.tsx', '.ts', '.css', '.js', '.jsx'];
      for (const ext of extensions) {
        const testPath = targetPath + ext;
        const dir = path.dirname(testPath);
        const fileLower = path.basename(testPath).toLowerCase();
        
        if (fs.existsSync(dir)) {
          try {
            const files = fs.readdirSync(dir);
            const matchedFile = files.find(f => f.toLowerCase() === fileLower);
            if (matchedFile) {
              const resolved = path.join(dir, matchedFile);
              return resolved;
            }
          } catch (e) {
            // Ignore directory read errors
          }
        }
      }
    }
    return null;
  }
});

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), viteSingleFile(), caseInsensitiveResolver()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
