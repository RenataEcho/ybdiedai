import fs from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import {defineConfig, loadEnv} from 'vite';

/** 开发时把字段说明覆盖写入 src/field-configuration-description-overrides.json */
function saveFieldConfigDescriptionsPlugin(): Plugin {
  const apiPath = '/__dev/api/save-field-config-descriptions';
  return {
    name: 'save-field-config-descriptions',
    configureServer(server) {
      const outPath = path.resolve(__dirname, 'src/field-configuration-description-overrides.json');
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (req.method !== 'POST' || url !== apiPath) {
          next();
          return;
        }
        let body = '';
        req.on('data', (chunk: Buffer | string) => {
          body += typeof chunk === 'string' ? chunk : chunk.toString();
        });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body || '{}') as { overrides?: unknown };
            const overrides = parsed?.overrides;
            if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'invalid overrides' }));
              return;
            }
            const cleaned: Record<string, string> = {};
            for (const [k, v] of Object.entries(overrides as Record<string, unknown>)) {
              if (/^f\d+$/.test(k) && typeof v === 'string') cleaned[k] = v;
            }
            fs.writeFileSync(outPath, `${JSON.stringify(cleaned, null, 2)}\n`, 'utf8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, overrides: cleaned }));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: String(e) }));
          }
        });
      });
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  /** GitHub Pages 项目页为 /<仓库名>/，CI 中设置 VITE_BASE_PATH=/ybdiedai/ */
  const rawBase = env.VITE_BASE_PATH?.trim();
  const base =
    rawBase && rawBase !== '/'
      ? rawBase.endsWith('/')
        ? rawBase
        : `${rawBase}/`
      : '/';
  return {
    base,
    plugins: [react(), tailwindcss(), saveFieldConfigDescriptionsPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
