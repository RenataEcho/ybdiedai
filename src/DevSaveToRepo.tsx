/**
 * 开发工具：将当前 localStorage 中所有工作区数据一键写回仓库 JSON 种子文件。
 * 仅在 Vite 开发模式（import.meta.env.DEV）下渲染。
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { readLocalJson, STORAGE_KEYS } from './localWorkspacePersistence';

const API_URL = '/__dev/api/save-workspace-snapshot';
const LOAD_SEED_URL = '/__dev/api/load-seed';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

const STORAGE_KEY_MAP: Record<string, string> = {
  iterationRecords: 'ybdiedai-iteration-records-v1',
  productStaff: 'ybdiedai-product-staff-v2',
  sectGuild: 'ybdiedai-sect-guild-v2',
  rewardManagement: 'ybdiedai-reward-management-v1',
  projectManagement: 'ybdiedai-project-management-v1',
  customerService: 'ybdiedai-customer-service-v1',
  youboomTeam: 'ybdiedai-youboom-team-v1',
  academyCategories: 'ybdiedai-academy-categories-v1',
  academyContents: 'ybdiedai-academy-contents-v1',
};

const KEY_LABEL: Record<string, string> = {
  iterationRecords: '迭代记录',
  productStaff: '产研人员',
  sectGuild: '门派管理',
  rewardManagement: '奖励管理',
  projectManagement: '项目管理',
  customerService: '客服管理',
  youboomTeam: '团队数据',
  academyCategories: '商学院分类',
  academyContents: '商学院内容',
};

function collectPayload() {
  return {
    iterationRecords: readLocalJson(STORAGE_KEYS.iterationRecords) ?? [],
    productStaff: readLocalJson(STORAGE_KEYS.productStaff) ?? [],
    sectGuild: readLocalJson(STORAGE_KEYS.sectGuild) ?? [],
    rewardManagement: readLocalJson(STORAGE_KEYS.rewardManagement) ?? [],
    projectManagement: readLocalJson(STORAGE_KEYS.projectManagement) ?? [],
    customerService: readLocalJson(STORAGE_KEYS.customerService) ?? [],
    youboomTeam: readLocalJson(STORAGE_KEYS.youboomTeam) ?? [],
    academyCategories: readLocalJson(STORAGE_KEYS.academyCategories) ?? [],
    academyContents: readLocalJson(STORAGE_KEYS.academyContents) ?? [],
  };
}

type RestoreStatus = 'idle' | 'restoring' | 'success' | 'error';

export function DevSaveToRepo() {
  if (!(import.meta as { env?: { DEV?: boolean } }).env?.DEV) return null;

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [written, setWritten] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [restoreStatus, setRestoreStatus] = useState<RestoreStatus>('idle');
  const [restoreMsg, setRestoreMsg] = useState('');

  // 拖拽状态
  const [pos, setPos] = useState<{ right: number; bottom: number }>({ right: 24, bottom: 24 });
  const dragging = useRef(false);
  const dragStart = useRef<{ mouseX: number; mouseY: number; right: number; bottom: number } | null>(null);
  const hasDragged = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    hasDragged.current = false;
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      right: pos.right,
      bottom: pos.bottom,
    };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current || !dragStart.current) return;
      const dx = e.clientX - dragStart.current.mouseX;
      const dy = e.clientY - dragStart.current.mouseY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true;
      const newRight = Math.max(8, dragStart.current.right - dx);
      const newBottom = Math.max(8, dragStart.current.bottom - dy);
      setPos({ right: newRight, bottom: newBottom });
    }
    function onMouseUp() {
      dragging.current = false;
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const payload = collectPayload();

  async function handleRestoreFromSeed() {
    setRestoreStatus('restoring');
    setRestoreMsg('');
    try {
      const keys = Object.keys(STORAGE_KEY_MAP);
      let addedTotal = 0;
      for (const key of keys) {
        const res = await fetch(`${LOAD_SEED_URL}?key=${key}`);
        if (!res.ok) continue;
        const seedData = await res.json() as unknown[];
        if (!Array.isArray(seedData)) continue;
        const storageKey = STORAGE_KEY_MAP[key];
        const localRaw = localStorage.getItem(storageKey);
        const localData: unknown[] = localRaw ? (JSON.parse(localRaw) as unknown[]) : [];
        const existIds = new Set((localData as Array<{ id?: string }>).map((r) => r.id).filter(Boolean));
        const toAdd = (seedData as Array<{ id?: string }>).filter((r) => r.id && !existIds.has(r.id));
        if (toAdd.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify([...localData, ...toAdd]));
          addedTotal += toAdd.length;
        }
      }
      setRestoreMsg(`已从仓库补入 ${addedTotal} 条新数据，即将刷新…`);
      setRestoreStatus('success');
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      setRestoreMsg(String(e));
      setRestoreStatus('error');
    }
  }

  async function handleSave() {
    setStatus('saving');
    setWritten([]);
    setErrorMsg('');
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { ok: boolean; written?: string[]; error?: string };
      if (json.ok) {
        setWritten(json.written ?? []);
        setStatus('success');
      } else {
        setErrorMsg(json.error ?? '未知错误');
        setStatus('error');
      }
    } catch (e) {
      setErrorMsg(String(e));
      setStatus('error');
    }
  }

  const counts: Record<string, number> = {};
  for (const [k, v] of Object.entries(payload)) {
    counts[k] = Array.isArray(v) ? v.length : 0;
  }

  return (
    <>
      {/* 触发按钮（可拖拽） */}
      <button
        onMouseDown={onMouseDown}
        onClick={() => {
          if (hasDragged.current) return;
          setOpen(true); setStatus('idle'); setWritten([]); setErrorMsg('');
        }}
        title="保存到仓库（开发工具）· 可拖拽调整位置"
        style={{
          position: 'fixed',
          bottom: pos.bottom,
          right: pos.right,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          borderRadius: 20,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: '#fff',
          fontWeight: 700,
          fontSize: 13,
          border: 'none',
          cursor: dragging.current ? 'grabbing' : 'grab',
          boxShadow: '0 4px 16px rgba(99,102,241,0.45)',
          letterSpacing: 0.2,
          userSelect: 'none',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        保存到仓库
      </button>

      {/* 弹层 */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.45)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1e2232',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: 28,
              width: 420,
              maxWidth: '90vw',
              boxShadow: '0 16px 64px rgba(0,0,0,0.5)',
              color: '#e5e7eb',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>保存到仓库</span>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20, lineHeight: 1 }}
              >×</button>
            </div>

            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12, lineHeight: 1.6 }}>
              将当前 localStorage 中所有数据写回仓库 JSON 种子文件，下次冷启动（或其他人拉取代码后）也将使用这份数据作为初始值。
            </p>

            {/* 从仓库恢复按钮 */}
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => { void handleRestoreFromSeed(); }}
                disabled={restoreStatus === 'restoring'}
                style={{
                  width: '100%',
                  padding: '8px 0',
                  borderRadius: 8,
                  background: restoreStatus === 'restoring'
                    ? 'rgba(52,211,153,0.2)'
                    : 'rgba(52,211,153,0.15)',
                  color: '#34d399',
                  fontWeight: 600,
                  fontSize: 13,
                  border: '1px solid rgba(52,211,153,0.3)',
                  cursor: restoreStatus === 'restoring' ? 'not-allowed' : 'pointer',
                }}
              >
                {restoreStatus === 'restoring' ? '同步中…' : '↓ 从仓库补入本地缺失数据'}
              </button>
              {restoreMsg && (
                <p style={{
                  marginTop: 6, fontSize: 11, textAlign: 'center',
                  color: restoreStatus === 'error' ? '#fca5a5' : '#6ee7b7',
                }}>
                  {restoreMsg}
                </p>
              )}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }} />

            {/* 数据预览 */}
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
              {Object.entries(KEY_LABEL).map(([key, label]) => {
                const count = counts[key] ?? 0;
                const isWritten = written.includes(key);
                return (
                  <div key={key} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '4px 0', fontSize: 12,
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <span style={{ color: '#d1d5db' }}>{label}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: count > 0 ? '#a5b4fc' : '#6b7280' }}>{count} 条</span>
                      {isWritten && <span style={{ color: '#34d399', fontSize: 11 }}>✓ 已写入</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            {status === 'error' && (
              <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: '#fca5a5' }}>
                保存失败：{errorMsg}
              </div>
            )}

            {status === 'success' && (
              <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: '#6ee7b7' }}>
                已成功写入 {written.length} 个文件到 src/mock/ 目录，可直接 git commit 提交。
              </div>
            )}

            <button
              onClick={() => { void handleSave(); }}
              disabled={status === 'saving'}
              style={{
                width: '100%',
                padding: '10px 0',
                borderRadius: 10,
                background: status === 'saving'
                  ? 'rgba(99,102,241,0.4)'
                  : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                border: 'none',
                cursor: status === 'saving' ? 'not-allowed' : 'pointer',
                letterSpacing: 0.3,
              }}
            >
              {status === 'saving' ? '保存中…' : status === 'success' ? '再次保存' : '确认保存到仓库'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
