import { useCallback, useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { X, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  loadPageRuleLocalOverrides,
  persistPageRuleOverridesToWorkspaceFile,
  resolveRulesForRouteKeys,
  type LocalOverrides,
  type ResolvedPageRule,
} from './pageRuleResolve';
import { PAGE_RULE_OVERRIDES_STORAGE_KEY, writeLocalJson } from './localWorkspacePersistence';
import type { PageRuleParagraph } from './pageRuleCatalog';

const MAX_TITLE = 80;
const MAX_SUB = 120;
const MAX_BODY = 8000;

function saveLocalOverrides(next: LocalOverrides) {
  writeLocalJson(PAGE_RULE_OVERRIDES_STORAGE_KEY, next);
}

export type MenuRuleDescriptionModalProps = {
  open: boolean;
  navTitle: string;
  routeKeys: readonly string[];
  onClose: () => void;
};

type ModalView = 'view' | 'edit';

export function MenuRuleDescriptionModal({ open, navTitle, routeKeys, onClose }: MenuRuleDescriptionModalProps) {
  const [localOverrides, setLocalOverrides] = useState<LocalOverrides>({});
  const [rows, setRows] = useState<ResolvedPageRule[]>([]);
  const [view, setView] = useState<ModalView>('view');

  // 编辑态：仅支持单一 routeKey（弹窗通常对应当前菜单，取第一个）
  const editRouteKey = routeKeys[0] ?? '';
  const [editMenuTitle, setEditMenuTitle] = useState('');
  const [editParagraphs, setEditParagraphs] = useState<PageRuleParagraph[]>([]);

  useEffect(() => {
    if (!open) {
      setView('view');
      return;
    }
    const local = loadPageRuleLocalOverrides();
    setLocalOverrides(local);
    setRows(resolveRulesForRouteKeys(routeKeys, local));
  }, [open, routeKeys]);

  const sourceHint = useMemo(() => {
    if (rows.some((r) => r.source === 'local')) return '本机覆盖';
    if (rows.some((r) => r.source === 'repo')) return '仓库 / 工作区 JSON';
    return '代码内置';
  }, [rows]);

  const enterEdit = () => {
    const row = rows.find((r) => r.routeKey === editRouteKey) ?? rows[0];
    if (!row) return;
    setEditMenuTitle(row.effectiveMenuTitle);
    setEditParagraphs(
      row.effectiveParagraphs.length > 0
        ? row.effectiveParagraphs.map((p) => ({ ...p }))
        : [{ subheading: '', body: '' }]
    );
    setView('edit');
  };

  const persistAndClose = useCallback(() => {
    const title = editMenuTitle.trim();
    const paras = editParagraphs
      .map((p) => ({ subheading: p.subheading.trim(), body: p.body.trim() }))
      .filter((p) => p.subheading || p.body);

    if (!title) {
      alert('请填写菜单标题');
      return;
    }
    for (let i = 0; i < paras.length; i++) {
      if (!paras[i].subheading) {
        alert(`段落 ${i + 1}：请填写小标题`);
        return;
      }
      if (!paras[i].body) {
        alert(`段落 ${i + 1}：请填写正文`);
        return;
      }
    }

    setLocalOverrides((prev) => {
      const next: LocalOverrides = {
        ...prev,
        [editRouteKey]: { menuTitle: title, paragraphs: paras.length ? paras : undefined },
      };
      saveLocalOverrides(next);
      persistPageRuleOverridesToWorkspaceFile(next);
      // 刷新查看态内容
      setRows(resolveRulesForRouteKeys(routeKeys, next));
      return next;
    });
    setView('view');
  }, [editMenuTitle, editParagraphs, editRouteKey, routeKeys]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 dark:bg-black/60">
      <div className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-xl bg-white dark:bg-[#1e2232] shadow-xl border border-line">

        {/* ── 查看态 ───────────────────────────────────────── */}
        {view === 'view' && (
          <>
            <div className="flex items-center justify-between border-b border-line px-5 py-4 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-ink">规则说明 · {navTitle}</h2>
                <p className="mt-1 text-xs text-gray-500">当前优先级：{sourceHint}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={enterEdit}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  编辑
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-white/8 cursor-pointer"
                  aria-label="关闭"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-5 space-y-8">
              {rows.map((row) => (
                <section key={row.routeKey} className="space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line/80 pb-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white/85">{row.effectiveMenuTitle}</h3>
                    <span className="font-mono text-[10px] text-gray-400">{row.routeKey}</span>
                  </div>
                  <div className="space-y-3">
                    {row.effectiveParagraphs.map((p, i) => (
                      <div key={i} className="rounded-lg border border-line bg-gray-50/50 dark:bg-white/4 p-3 space-y-2">
                        <div className="text-xs text-gray-500">段落 {i + 1}</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white/85">{p.subheading}</div>
                        <p className="text-sm text-gray-700 dark:text-white/60 whitespace-pre-wrap leading-relaxed">{p.body}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <div className="flex justify-end gap-2 border-t border-line px-5 py-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-line bg-white dark:bg-white/6 px-4 py-2 text-sm font-medium text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10 cursor-pointer"
              >
                关闭
              </button>
            </div>
          </>
        )}

        {/* ── 编辑态 ───────────────────────────────────────── */}
        {view === 'edit' && (
          <>
            <div className="flex items-center justify-between border-b border-line px-5 py-4 shrink-0">
              <h2 className="text-lg font-bold text-ink">编辑规则 · {navTitle}</h2>
              <button
                type="button"
                onClick={() => setView('view')}
                className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-white/8 cursor-pointer"
                aria-label="返回查看"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-5 flex-1">
              {/* 菜单标题 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-white/70">
                  菜单标题（展示用）<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={MAX_TITLE}
                    value={editMenuTitle}
                    onChange={(e) => setEditMenuTitle(e.target.value)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20 bg-white dark:bg-white/5 text-gray-900 dark:text-white/85"
                  />
                  <span className="absolute right-2 top-2 text-[10px] text-gray-400">
                    {editMenuTitle.length} / {MAX_TITLE}
                  </span>
                </div>
              </div>

              {/* 段落列表 */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-800 dark:text-white/75">规则段落</div>
                {editParagraphs.map((p, idx) => (
                  <div key={idx} className="rounded-lg border border-line p-4 space-y-3 bg-white dark:bg-white/3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">段落 {idx + 1}</span>
                      {editParagraphs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEditParagraphs((list) => list.filter((_, j) => j !== idx))}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          删除
                        </button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600 dark:text-white/55">
                        小标题<span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={MAX_SUB}
                          value={p.subheading}
                          onChange={(e) =>
                            setEditParagraphs((list) =>
                              list.map((x, j) => (j === idx ? { ...x, subheading: e.target.value } : x))
                            )
                          }
                          className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20 bg-white dark:bg-white/5 text-gray-900 dark:text-white/85"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-gray-400">
                          {p.subheading.length} / {MAX_SUB}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600 dark:text-white/55">
                        正文<span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <textarea
                          maxLength={MAX_BODY}
                          rows={5}
                          value={p.body}
                          onChange={(e) =>
                            setEditParagraphs((list) =>
                              list.map((x, j) => (j === idx ? { ...x, body: e.target.value } : x))
                            )
                          }
                          className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20 resize-y min-h-[100px] bg-white dark:bg-white/5 text-gray-900 dark:text-white/85"
                        />
                        <span className="absolute right-2 bottom-2 text-[10px] text-gray-400">
                          {p.body.length} / {MAX_BODY}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setEditParagraphs((list) => [...list, { subheading: '', body: '' }])}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-line py-3 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  新增段落
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-line px-5 py-3 shrink-0">
              <button
                type="button"
                onClick={() => setView('view')}
                className="rounded-lg border border-line bg-white dark:bg-white/6 px-4 py-2 text-sm font-medium text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10 cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={persistAndClose}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 cursor-pointer"
              >
                保存
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

function ruleHintButtonClass(on: boolean, variant: 'sidebar' | 'title') {
  if (variant === 'title') {
    return on
      ? 'shrink-0 text-sm font-semibold text-accent hover:underline cursor-pointer select-none'
      : 'shrink-0 text-sm font-semibold text-gray-500 hover:text-accent hover:underline cursor-pointer select-none';
  }
  return on
    ? 'shrink-0 text-[10px] font-medium text-accent hover:underline px-0 py-0'
    : 'shrink-0 text-[10px] font-medium text-gray-400 hover:text-accent hover:underline px-0 py-0';
}

export function NavRuleHintButton({
  active,
  variant = 'sidebar',
  onClick,
}: {
  active?: boolean;
  /** `title`：与页面主标题并排展示 */
  variant?: 'sidebar' | 'title';
  onClick: (e: SyntheticEvent) => void;
}) {
  const fire = (e: SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(e);
  };
  return (
    <span
      role="button"
      tabIndex={0}
      className={ruleHintButtonClass(!!active, variant)}
      onClick={fire}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') fire(e);
      }}
    >
      规则说明
    </span>
  );
}
