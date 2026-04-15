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
              if (/^(f\d+|yb\d+|mt\d+)$/.test(k) && typeof v === 'string') cleaned[k] = v;
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

/**
 * 开发时把工作区快照（所有本机增删改数据）写入对应 JSON 种子文件。
 * POST /__dev/api/save-workspace-snapshot
 * Body: { iterationRecords, productStaff, sectGuild, rewardManagement,
 *         projectManagement, customerService, youboomTeam,
 *         academyCategories, academyContents }
 */
function saveWorkspaceSnapshotPlugin(): Plugin {
  const apiPath = '/__dev/api/save-workspace-snapshot';
  return {
    name: 'save-workspace-snapshot',
    configureServer(server) {
      const mockDir = path.resolve(__dirname, 'src/mock');
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (req.method !== 'POST' || url !== apiPath) { next(); return; }
        let body = '';
        req.on('data', (chunk: Buffer | string) => { body += typeof chunk === 'string' ? chunk : chunk.toString(); });
        req.on('end', () => {
          try {
            const data = JSON.parse(body || '{}') as Record<string, unknown>;
            const written: string[] = [];
            const fileMap: Record<string, string> = {
              iterationRecords: 'iteration-records-seed.json',
              productStaff: 'product-staff-seed.json',
              sectGuild: 'sect-guild-seed.json',
              rewardManagement: 'reward-management-seed.json',
              projectManagement: 'project-management-seed.json',
              customerService: 'customer-service-seed.json',
              youboomTeam: 'youboom-team-seed.json',
              academyCategories: 'academy-categories-seed.json',
              academyContents: 'academy-contents-seed.json',
            };
            for (const [key, filename] of Object.entries(fileMap)) {
              if (!Array.isArray(data[key])) continue;
              const outPath = path.join(mockDir, filename);
              fs.writeFileSync(outPath, `${JSON.stringify(data[key], null, 2)}\n`, 'utf8');
              written.push(key);
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, written }));
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

/** 开发时把规则说明覆盖写入 src/page-rule-description-overrides.json */
function savePageRuleOverridesPlugin(): Plugin {
  const apiPath = '/__dev/api/save-page-rule-overrides';
  return {
    name: 'save-page-rule-overrides',
    configureServer(server) {
      const outPath = path.resolve(__dirname, 'src/page-rule-description-overrides.json');
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
            const cleaned: Record<string, { menuTitle?: string; paragraphs?: unknown }> = {};
            for (const [k, v] of Object.entries(overrides as Record<string, unknown>)) {
              if (typeof k !== 'string' || !k.trim()) continue;
              if (typeof v !== 'object' || v === null || Array.isArray(v)) continue;
              const o = v as Record<string, unknown>;
              const entry: { menuTitle?: string; paragraphs?: { subheading: string; body: string }[] } = {};
              if (typeof o.menuTitle === 'string') entry.menuTitle = o.menuTitle;
              if (Array.isArray(o.paragraphs)) {
                const paras: { subheading: string; body: string }[] = [];
                for (const p of o.paragraphs) {
                  if (typeof p !== 'object' || p === null) continue;
                  const po = p as Record<string, unknown>;
                  if (typeof po.subheading !== 'string' || typeof po.body !== 'string') continue;
                  paras.push({ subheading: po.subheading, body: po.body });
                }
                if (paras.length) entry.paragraphs = paras;
              }
              if (entry.menuTitle !== undefined || entry.paragraphs !== undefined) cleaned[k] = entry;
            }
            fs.writeFileSync(outPath, `${JSON.stringify(cleaned, null, 2)}\n`, 'utf8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, keys: Object.keys(cleaned) }));
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
    plugins: [react(), tailwindcss(), saveFieldConfigDescriptionsPlugin(), savePageRuleOverridesPlugin(), saveWorkspaceSnapshotPlugin()],
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
