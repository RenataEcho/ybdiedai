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

/**
 * 原型设计队列：浏览器提交需求 → 写入 prototype-queue.json → Cursor 读取并实现 → 写回结果
 * POST /__dev/api/prototype-queue/push   — 新增一条请求
 * POST /__dev/api/prototype-queue/result — Cursor 写回 HTML 结果
 * GET  /__dev/api/prototype-queue        — 读取当前队列
 */
function prototypeQueuePlugin(): Plugin {
  const queuePath = path.resolve(__dirname, 'tmp/prototype-queue.json');

  function readQueue(): unknown[] {
    try {
      const raw = fs.readFileSync(queuePath, 'utf8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }

  function writeQueue(data: unknown[]): void {
    fs.writeFileSync(queuePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  }

  return {
    name: 'prototype-queue',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        res.setHeader('Content-Type', 'application/json');

        // GET — 读取队列
        if (req.method === 'GET' && url === '/__dev/api/prototype-queue') {
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, queue: readQueue() }));
          return;
        }

        // POST push — 新增需求
        if (req.method === 'POST' && url === '/__dev/api/prototype-queue/push') {
          let body = '';
          req.on('data', (c: Buffer | string) => { body += typeof c === 'string' ? c : c.toString(); });
          req.on('end', () => {
            try {
              const item = JSON.parse(body || '{}') as Record<string, unknown>;
              if (!item.id || !item.requirement) {
                res.statusCode = 400;
                res.end(JSON.stringify({ ok: false, error: 'missing id or requirement' }));
                return;
              }
              const queue = readQueue();
              queue.push({ ...item, status: 'pending', html: null, createdAt: Date.now(), updatedAt: Date.now() });
              writeQueue(queue);
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true }));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ ok: false, error: String(e) }));
            }
          });
          return;
        }

        // POST result — 写回实现结果（Cursor 调用）
        // 新功能需求（new-menu）：必须传 html，内容为与项目同风格的暗色主题预览页面
        // 已有功能需求（existing-feature）：直接修改源文件，html 可省略，仅标记 done
        if (req.method === 'POST' && url === '/__dev/api/prototype-queue/result') {
          let body = '';
          req.on('data', (c: Buffer | string) => { body += typeof c === 'string' ? c : c.toString(); });
          req.on('end', () => {
            try {
              const { id, html } = JSON.parse(body || '{}') as { id?: string; html?: string };
              if (!id) {
                res.statusCode = 400;
                res.end(JSON.stringify({ ok: false, error: 'missing id' }));
                return;
              }
              const queue = readQueue() as Array<Record<string, unknown>>;
              const idx = queue.findIndex((q) => q.id === id);
              if (idx === -1) {
                res.statusCode = 404;
                res.end(JSON.stringify({ ok: false, error: 'request not found' }));
                return;
              }
              const isExistingFeature = queue[idx].requirementType === 'existing-feature';
              // 新功能需求必须有 html 预览；已有功能需求 html 可省略
              if (!isExistingFeature && !html) {
                res.statusCode = 400;
                res.end(JSON.stringify({ ok: false, error: 'missing html for new-menu requirement' }));
                return;
              }
              queue[idx] = { ...queue[idx], status: 'done', html: html ?? null, updatedAt: Date.now() };
              writeQueue(queue);
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true }));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ ok: false, error: String(e) }));
            }
          });
          return;
        }

        // POST revert — 用户请求撤销已有功能的源文件改动
        // 将任务状态标记为 reverted，Cursor AI 轮询到该状态后执行 git checkout / 代码还原
        if (req.method === 'POST' && url === '/__dev/api/prototype-queue/revert') {
          let body = '';
          req.on('data', (c: Buffer | string) => { body += typeof c === 'string' ? c : c.toString(); });
          req.on('end', () => {
            try {
              const { id } = JSON.parse(body || '{}') as { id?: string };
              if (!id) { res.statusCode = 400; res.end(JSON.stringify({ ok: false, error: 'missing id' })); return; }
              const queue = readQueue() as Array<Record<string, unknown>>;
              const idx = queue.findIndex((q) => q.id === id);
              if (idx === -1) { res.statusCode = 404; res.end(JSON.stringify({ ok: false, error: 'not found' })); return; }
              queue[idx] = { ...queue[idx], status: 'reverted', updatedAt: Date.now() };
              writeQueue(queue);
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true }));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ ok: false, error: String(e) }));
            }
          });
          return;
        }

        // POST delete — 删除一条
        if (req.method === 'POST' && url === '/__dev/api/prototype-queue/delete') {
          let body = '';
          req.on('data', (c: Buffer | string) => { body += typeof c === 'string' ? c : c.toString(); });
          req.on('end', () => {
            try {
              const { id } = JSON.parse(body || '{}') as { id?: string };
              if (!id) { res.statusCode = 400; res.end(JSON.stringify({ ok: false })); return; }
              writeQueue((readQueue() as Array<Record<string, unknown>>).filter((q) => q.id !== id));
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true }));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ ok: false, error: String(e) }));
            }
          });
          return;
        }

        next();
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
    plugins: [react(), tailwindcss(), saveFieldConfigDescriptionsPlugin(), savePageRuleOverridesPlugin(), saveWorkspaceSnapshotPlugin(), prototypeQueuePlugin()],
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
      watch: {
        ignored: ['**/tmp/prototype-queue.json'],
      },
    },
  };
});
