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
  const loadSeedPath = '/__dev/api/load-seed';
  return {
    name: 'save-workspace-snapshot',
    configureServer(server) {
      const mockDir = path.resolve(__dirname, 'src/mock');
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];

        // GET /__dev/fix-localstorage — 返回 HTML 页面，自动把 seed 数据补入 localStorage 后跳回应用
        if (req.method === 'GET' && url === '/__dev/fix-localstorage') {
          const fileMap: Record<string, { storageKey: string; file: string }> = {
            iterationRecords: { storageKey: 'ybdiedai-iteration-records-v1', file: 'iteration-records-seed.json' },
            productStaff: { storageKey: 'ybdiedai-product-staff-v2', file: 'product-staff-seed.json' },
            sectGuild: { storageKey: 'ybdiedai-sect-guild-v2', file: 'sect-guild-seed.json' },
            rewardManagement: { storageKey: 'ybdiedai-reward-management-v1', file: 'reward-management-seed.json' },
            projectManagement: { storageKey: 'ybdiedai-project-management-v1', file: 'project-management-seed.json' },
            customerService: { storageKey: 'ybdiedai-customer-service-v1', file: 'customer-service-seed.json' },
            youboomTeam: { storageKey: 'ybdiedai-youboom-team-v1', file: 'youboom-team-seed.json' },
            academyCategories: { storageKey: 'ybdiedai-academy-categories-v1', file: 'academy-categories-seed.json' },
            academyContents: { storageKey: 'ybdiedai-academy-contents-v1', file: 'academy-contents-seed.json' },
          };
          // 读取所有 seed 数据内嵌进 HTML
          const seedPayload: Record<string, unknown> = {};
          for (const [key, { file }] of Object.entries(fileMap)) {
            try {
              seedPayload[key] = JSON.parse(fs.readFileSync(path.join(mockDir, file), 'utf8'));
            } catch { seedPayload[key] = []; }
          }
          const storageMap: Record<string, string> = {};
          for (const [key, { storageKey }] of Object.entries(fileMap)) {
            storageMap[key] = storageKey;
          }
          const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>修复本地数据</title>
<style>body{font-family:monospace;background:#1e2232;color:#e5e7eb;padding:32px;}</style>
</head><body>
<h2 style="color:#a5b4fc">正在从仓库补入缺失数据…</h2>
<pre id="log"></pre>
<script>
const seed = ${JSON.stringify(seedPayload)};
const map = ${JSON.stringify(storageMap)};
let log = '';
let totalAdded = 0;
for (const [key, storageKey] of Object.entries(map)) {
  const seedArr = seed[key] || [];
  const local = JSON.parse(localStorage.getItem(storageKey) || '[]');
  const existIds = new Set(local.map(r => r.id).filter(Boolean));
  const toAdd = seedArr.filter(r => r.id && !existIds.has(r.id));
  if (toAdd.length > 0) {
    localStorage.setItem(storageKey, JSON.stringify([...local, ...toAdd]));
    log += key + ': 补入 ' + toAdd.length + ' 条 (' + toAdd.map(r=>r.id).join(', ') + ')\\n';
    totalAdded += toAdd.length;
  } else {
    log += key + ': 已是最新，无需补入\\n';
  }
}
log += '\\n共补入 ' + totalAdded + ' 条，2秒后跳回应用…';
document.getElementById('log').textContent = log;
setTimeout(() => { window.location.href = '/'; }, 2000);
<\/script>
</body></html>`;
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(html);
          return;
        }

        // GET /__dev/api/load-seed?key=iterationRecords — 直接从文件读 seed 返回给浏览器
        if (req.method === 'GET' && url === loadSeedPath) {
          const params = new URLSearchParams(req.url?.split('?')[1] ?? '');
          const key = params.get('key') ?? '';
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
          const filename = fileMap[key];
          if (!filename) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: `unknown key: ${key}` }));
            return;
          }
          try {
            const raw = fs.readFileSync(path.join(mockDir, filename), 'utf8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(raw);
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: String(e) }));
          }
          return;
        }

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
 * 原型设计队列：浏览器提交需求 → 写入 prototype-queue.json → 自动调用 Gemini API 生成 HTML → 写回结果
 * POST /__dev/api/prototype-queue/push   — 新增一条请求（自动触发 AI 生成）
 * POST /__dev/api/prototype-queue/result — 写回 HTML 结果
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

  /** 调用 Gemini API 生成原型 HTML，完成后直接写回队列 */
  async function generatePrototypeWithGemini(item: Record<string, unknown>, apiKey: string): Promise<void> {
    const id = item.id as string;
    const requirement = item.requirement as string;
    const designMode = item.designMode as string | undefined;
    const isMobile = designMode === 'mobile';

    const mobileNote = isMobile ? `
【移动端 H5 特别规范】
- body 直接是页面内容，不要有外层演示包装结构（如 .phone、.switcher-bar 等）
- body 不要设置 display:flex + align-items:center（避免内容居中像 PC 页面）
- 整个页面宽度适配 390px（iPhone 16 Pro 宽度）
- 不要在 HTML 里渲染手机外壳（由外层系统组件负责）
- 如需展示多个审核状态，用页面内 position:fixed 浮动按钮组，而不是 body 外层的控制栏` : '';

    const prompt = `你是一个专业的前端 UI 设计师，请根据以下需求描述，生成一个完整的、可直接预览的 HTML 原型页面。

【需求描述】
${requirement}

【技术要求】
1. 使用 Tailwind CSS（通过 CDN 引入：<script src="https://cdn.tailwindcss.com"></script>）
2. 样式风格：玻璃拟态风格，半透明卡片 + backdrop-blur + 微边框，科技感设计
3. 主色调：蓝紫渐变（#6366f1 → #8b5cf6）
4. 主题自适应：通过 CSS prefers-color-scheme 自动跟随用户系统亮/暗色主题，使用 CSS 变量：
   - :root { --bg: #f8fafc; --bg-card: rgba(255,255,255,0.8); --text: #1e293b; --text-sub: #64748b; --border: rgba(0,0,0,0.08); }
   - @media (prefers-color-scheme: dark) { :root { --bg: #0f1117; --bg-card: rgba(255,255,255,0.05); --text: rgba(255,255,255,0.85); --text-sub: rgba(255,255,255,0.45); --border: rgba(255,255,255,0.08); } }
5. 使用 Mock 数据填充页面，数据要真实合理
6. 页面要有完整的交互（按钮点击、表单提交、弹窗、搜索过滤等用 JavaScript 实现）
7. 代码精简，CSS/JS 内联在 HTML 里（不引入外部 JS 库，只用 Tailwind CDN）${mobileNote}

【输出要求】
只输出完整的 HTML 代码，不要任何解释文字，不要 markdown 代码块标记，直接从 <!DOCTYPE html> 开始。`;

    if (!apiKey || apiKey === 'YOUR_KEY_HERE' || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      console.error('[prototype-queue] ❌ 未配置有效的 VITE_GEMINI_API_KEY，无法生成原型。请在 .env 中配置。');
      // 标记为失败状态，前端会看到错误提示
      const queueErr = readQueue() as Array<Record<string, unknown>>;
      const errIdx = queueErr.findIndex((q) => q.id === id);
      if (errIdx !== -1) {
        queueErr[errIdx] = { ...queueErr[errIdx], status: 'error', html: null, updatedAt: Date.now() };
        writeQueue(queueErr);
      }
      return;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[prototype-queue] Gemini API error for ${id}:`, response.status, errText);
        const qe = readQueue() as Array<Record<string, unknown>>;
        const ei = qe.findIndex((q) => q.id === id);
        if (ei !== -1) { qe[ei] = { ...qe[ei], status: 'error', updatedAt: Date.now() }; writeQueue(qe); }
        return;
      }

      const data = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      let html = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      // 清理可能的 markdown 代码块包装
      html = html.trim();
      if (html.startsWith('```html')) html = html.slice(7);
      else if (html.startsWith('```')) html = html.slice(3);
      if (html.endsWith('```')) html = html.slice(0, -3);
      html = html.trim();

      if (!html || !html.includes('<!DOCTYPE')) {
        console.error(`[prototype-queue] Gemini returned invalid HTML for ${id}`);
        const qe2 = readQueue() as Array<Record<string, unknown>>;
        const ei2 = qe2.findIndex((q) => q.id === id);
        if (ei2 !== -1) { qe2[ei2] = { ...qe2[ei2], status: 'error', updatedAt: Date.now() }; writeQueue(qe2); }
        return;
      }

      // 写回队列
      const queue = readQueue() as Array<Record<string, unknown>>;
      const idx = queue.findIndex((q) => q.id === id);
      if (idx !== -1) {
        queue[idx] = { ...queue[idx], status: 'done', html, updatedAt: Date.now() };
        writeQueue(queue);
        console.log(`[prototype-queue] ✅ AI 已生成原型: ${id}`);
      }
    } catch (e) {
      console.error(`[prototype-queue] 调用 Gemini API 失败 (${id}):`, e);
      const qe3 = readQueue() as Array<Record<string, unknown>>;
      const ei3 = qe3.findIndex((q) => q.id === id);
      if (ei3 !== -1) { qe3[ei3] = { ...qe3[ei3], status: 'error', updatedAt: Date.now() }; writeQueue(qe3); }
    }
  }

  return {
    name: 'prototype-queue',
    configureServer(server) {
      // 读取 .env 中的 Gemini API Key
      const envPath = path.resolve(__dirname, '.env');
      let geminiApiKey = '';
      try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/VITE_GEMINI_API_KEY\s*=\s*(.+)/);
        if (match) geminiApiKey = match[1].trim().replace(/^["']|["']$/g, '');
      } catch { /* .env 不存在时忽略 */ }

      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        res.setHeader('Content-Type', 'application/json');

        // GET — 读取队列
        if (req.method === 'GET' && url === '/__dev/api/prototype-queue') {
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, queue: readQueue() }));
          return;
        }

        // POST push — 新增需求，自动触发 AI 生成
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

              // 异步触发 AI 生成（不阻塞响应）
              const isExisting = item.requirementType === 'existing-feature';
              if (!isExisting) {
                // 新功能菜单需求：调用 Gemini API 生成 HTML 原型
                generatePrototypeWithGemini(item, geminiApiKey).catch((e) => {
                  console.error('[prototype-queue] generatePrototypeWithGemini error:', e);
                });
              }
              // existing-feature 类型：不在此处处理，由 Cursor AI 修改源文件后手动调用 /result 接口
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

/**
 * 开发时图片上传：把文件保存到 public/uploads/，返回可访问的静态 URL。
 * POST /__dev/api/upload-image  multipart/form-data, field: file
 * 线上 GitHub Pages 静态部署时图片随 public/ 一起发布，URL 同样有效。
 */
function uploadImagePlugin(): Plugin {
  const apiPath = '/__dev/api/upload-image';
  return {
    name: 'upload-image',
    configureServer(server) {
      const uploadsDir = path.resolve(__dirname, 'public/uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      // GET /uploads/* — 直接提供静态图片文件，优先于 SPA fallback
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (req.method !== 'GET' || !url.startsWith('/uploads/')) { next(); return; }
        const filename = path.basename(url);
        const filePath = path.join(uploadsDir, filename);
        if (!fs.existsSync(filePath)) { next(); return; }
        const ext = path.extname(filename).toLowerCase();
        const mimeMap: Record<string, string> = {
          '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
          '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
        };
        res.setHeader('Content-Type', mimeMap[ext] ?? 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.statusCode = 200;
        fs.createReadStream(filePath).pipe(res);
      });

      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (req.method !== 'POST' || url !== apiPath) { next(); return; }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          try {
            const body = Buffer.concat(chunks);
            // 解析 multipart/form-data
            const contentType = req.headers['content-type'] ?? '';
            const boundaryMatch = contentType.match(/boundary=([^\s;]+)/);
            if (!boundaryMatch) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'missing boundary' }));
              return;
            }
            const boundary = Buffer.from(`--${boundaryMatch[1]}`);
            const parts: Buffer[] = [];
            let start = 0;
            while (start < body.length) {
              const idx = body.indexOf(boundary, start);
              if (idx === -1) break;
              const partStart = idx + boundary.length;
              if (partStart >= body.length) break;
              // skip \r\n after boundary
              const contentStart = partStart + 2;
              const nextBoundary = body.indexOf(boundary, contentStart);
              if (nextBoundary === -1) break;
              parts.push(body.slice(contentStart, nextBoundary - 2)); // trim \r\n before next boundary
              start = nextBoundary;
            }
            let fileBuffer: Buffer | null = null;
            let filename = '';
            let mimeType = 'image/png';
            for (const part of parts) {
              const headerEnd = part.indexOf('\r\n\r\n');
              if (headerEnd === -1) continue;
              const headerStr = part.slice(0, headerEnd).toString();
              if (!headerStr.includes('name="file"')) continue;
              const fnMatch = headerStr.match(/filename="([^"]+)"/);
              filename = fnMatch ? fnMatch[1] : `img-${Date.now()}.png`;
              const mimeMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);
              if (mimeMatch) mimeType = mimeMatch[1].trim();
              fileBuffer = part.slice(headerEnd + 4);
              break;
            }
            if (!fileBuffer || fileBuffer.length === 0) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'no file found in request' }));
              return;
            }
            // 用时间戳避免文件名冲突
            const ext = path.extname(filename) || (mimeType.includes('png') ? '.png' : mimeType.includes('gif') ? '.gif' : mimeType.includes('webp') ? '.webp' : '.jpg');
            const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
            const outPath = path.join(uploadsDir, safeName);
            fs.writeFileSync(outPath, fileBuffer);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, url: `/uploads/${safeName}` }));
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
            // 读取文件现有内容，与新数据深度合并（保留文件中已有但本次未传入的条目）
            let existing: Record<string, unknown> = {};
            try {
              if (fs.existsSync(outPath)) {
                existing = JSON.parse(fs.readFileSync(outPath, 'utf8') || '{}');
              }
            } catch {
              existing = {};
            }
            const merged = { ...existing, ...cleaned };
            fs.writeFileSync(outPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, keys: Object.keys(merged) }));
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

/** 开发时把已保存原型写入 src/mock/saved-prototypes-seed.json，防止 localStorage 清空丢失数据 */
function savePrototypeSeedsPlugin(): Plugin {
  const apiPath = '/__dev/api/save-prototype-seeds';
  return {
    name: 'save-prototype-seeds',
    configureServer(server) {
      const outPath = path.resolve(__dirname, 'src/mock/saved-prototypes-seed.json');
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
            const parsed = JSON.parse(body || '{}') as { prototypes?: unknown };
            const prototypes = parsed?.prototypes;
            if (!Array.isArray(prototypes)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'invalid prototypes' }));
              return;
            }
            // 只持久化 mobile 设计模式且有 menuPath 的条目（即「用户端原型」）
            const toSave = (prototypes as Record<string, unknown>[]).filter(
              (p) => p.menuPath && (p.designMode === 'mobile' || p.designMode == null)
            );
            fs.writeFileSync(outPath, `${JSON.stringify(toSave, null, 2)}\n`, 'utf8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, count: toSave.length }));
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
    plugins: [react(), tailwindcss(), saveFieldConfigDescriptionsPlugin(), savePageRuleOverridesPlugin(), saveWorkspaceSnapshotPlugin(), prototypeQueuePlugin(), uploadImagePlugin(), savePrototypeSeedsPlugin()],
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
