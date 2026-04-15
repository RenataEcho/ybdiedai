import { useCallback, useMemo, useState } from 'react';
import { Info, X } from 'lucide-react';
import { PAGE_RULE_CATALOG, type PageRuleParagraph, type ProductLine } from './pageRuleCatalog';
import {
  loadPageRuleLocalOverrides,
  persistPageRuleOverridesToWorkspaceFile,
  resolvePageRuleRow,
  type LocalOverrides,
  type ResolvedPageRule,
} from './pageRuleResolve';
import { PAGE_RULE_OVERRIDES_STORAGE_KEY, writeLocalJson } from './localWorkspacePersistence';
import { useResizableTableColumns } from './resizableTableColumns';

export { PAGE_RULE_OVERRIDES_STORAGE_KEY };

const RULE_DESC_COL_DEFAULTS: number[] = [180, 200, 320, 140, 200];

function saveLocalOverrides(next: LocalOverrides) {
  writeLocalJson(PAGE_RULE_OVERRIDES_STORAGE_KEY, next);
}

export type RuleDescriptionPageProps = {
  productLine: ProductLine;
  /** 与主内容区工具栏「搜索」联动，等同其它模块的全局筛选 applied 值 */
  filterKeyword: string;
};

type ResolvedRow = ResolvedPageRule;

type ModalMode = 'view' | 'edit' | null;

const MAX_TITLE = 80;
const MAX_SUB = 120;
const MAX_BODY = 8000;

export function RuleDescriptionPage({ productLine, filterKeyword }: RuleDescriptionPageProps) {
  const rtc = useResizableTableColumns(`rule-description-${productLine}`, RULE_DESC_COL_DEFAULTS);
  const [localOverrides, setLocalOverrides] = useState<LocalOverrides>(() => loadPageRuleLocalOverrides());
  const [modal, setModal] = useState<{ mode: ModalMode; row: ResolvedRow | null }>({
    mode: null,
    row: null,
  });
  const [editMenuTitle, setEditMenuTitle] = useState('');
  const [editParagraphs, setEditParagraphs] = useState<PageRuleParagraph[]>([]);

  const rows = useMemo(() => {
    const list = PAGE_RULE_CATALOG.filter((c) => c.productLine === productLine).map((c) =>
      resolvePageRuleRow(c, localOverrides)
    );
    const q = filterKeyword.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        r.effectiveMenuTitle.toLowerCase().includes(q) ||
        r.routeKey.toLowerCase().includes(q) ||
        r.summaryDisplay.toLowerCase().includes(q)
    );
  }, [localOverrides, filterKeyword, productLine]);

  const openView = (row: ResolvedRow) => {
    setModal({ mode: 'view', row });
  };

  const openEdit = (row: ResolvedRow) => {
    setEditMenuTitle(row.effectiveMenuTitle);
    setEditParagraphs(
      row.effectiveParagraphs.length > 0
        ? row.effectiveParagraphs.map((p) => ({ ...p }))
        : [{ subheading: '', body: '' }]
    );
    setModal({ mode: 'edit', row });
  };

  const persistAndClose = useCallback(() => {
    if (modal.mode !== 'edit' || !modal.row) return;
    const routeKey = modal.row.routeKey;
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
      const next = {
        ...prev,
        [routeKey]: { menuTitle: title, paragraphs: paras.length ? paras : undefined },
      };
      saveLocalOverrides(next);
      persistPageRuleOverridesToWorkspaceFile(next);
      return next;
    });
    setModal({ mode: null, row: null });
  }, [modal, editMenuTitle, editParagraphs]);

  const clearLocal = (routeKey: string) => {
    if (!window.confirm('确定清除该菜单在本机的规则覆盖？')) return;
    setLocalOverrides((prev) => {
      const next = { ...prev };
      delete next[routeKey];
      saveLocalOverrides(next);
      persistPageRuleOverridesToWorkspaceFile(next);
      return next;
    });
  };

  const syncSnippet = `copy(JSON.parse(localStorage.getItem('${PAGE_RULE_OVERRIDES_STORAGE_KEY}') || '{}'))`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink tracking-tight">规则配置说明</h1>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          通过表格维护各菜单规则说明。优先级：
          <span className="text-gray-700">本机编辑（localStorage）</span>
          {' > '}
          <code className="text-xs bg-gray-100 px-1 rounded">src/page-rule-description-overrides.json</code>
          {' / '}
          <code className="text-xs bg-gray-100 px-1 rounded">src/mock/pageRuleOverridesCommitted.ts</code>
          {' > '}
          <code className="text-xs bg-gray-100 px-1 rounded">src/pageRuleCatalog.ts</code>
          内置内容。
        </p>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-900">
        <div className="font-semibold mb-1 flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          同步到仓库
        </div>
        <p className="text-blue-900/90 leading-relaxed">
          保存编辑时会写入本机并尝试同步到{' '}
          <code className="rounded bg-white/80 px-1 py-0.5 text-xs">src/page-rule-description-overrides.json</code>
          （需本地 <code className="rounded bg-white/80 px-1 py-0.5 text-xs">npm run dev</code>
          ）。亦可控制台执行{' '}
          <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs text-blue-950">{syncSnippet}</code>
          ，将 JSON 合并进{' '}
          <code className="rounded bg-white/80 px-1 py-0.5 text-xs">PAGE_RULE_COMMITTED_OVERRIDES</code> 后提交。
        </p>
      </div>

      <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <div className="overflow-x-auto rounded-lg border border-line">
          <table
            className="app-data-table app-data-table--resizable w-full min-w-0 text-sm"
            style={{ minWidth: rtc.tableMinWidth }}
          >
            {rtc.colGroup}
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="relative px-4 py-3 font-medium">
                  菜单标题
                  {rtc.renderResizeHandle(0)}
                </th>
                <th className="relative px-4 py-3 font-medium">
                  路由键
                  {rtc.renderResizeHandle(1)}
                </th>
                <th className="relative px-4 py-3 font-medium">
                  内容摘要
                  {rtc.renderResizeHandle(2)}
                </th>
                <th className="relative px-4 py-3 font-medium">
                  当前来源
                  {rtc.renderResizeHandle(3)}
                </th>
                <th className="relative px-4 py-3 font-medium">
                  操作
                  {rtc.renderResizeHandle(4)}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr
                  key={r.routeKey}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}
                >
                  <td className="px-4 py-3 text-gray-900 font-medium">{r.effectiveMenuTitle}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.routeKey}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-md">{r.summaryDisplay}</td>
                  <td className="px-4 py-3">
                    {r.source === 'local' && (
                      <span className="inline-flex rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        本机覆盖
                      </span>
                    )}
                    {r.source === 'repo' && (
                      <span className="inline-flex rounded-md bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
                        仓库默认
                      </span>
                    )}
                    {r.source === 'builtin' && (
                      <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        代码内置
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openView(r)}
                        className="text-accent text-sm font-medium hover:underline cursor-pointer"
                      >
                        查看
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent/90 cursor-pointer"
                      >
                        编辑
                      </button>
                      {r.source === 'local' && (
                        <button
                          type="button"
                          onClick={() => clearLocal(r.routeKey)}
                          className="text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
                        >
                          清本机
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal.mode && modal.row && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-xl bg-white shadow-xl border border-line">
            {modal.mode === 'view' && (
              <>
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                  <h2 className="text-lg font-bold text-ink">查看规则 · {modal.row.routeKey}</h2>
                  <button
                    type="button"
                    onClick={() => setModal({ mode: null, row: null })}
                    className="rounded-full p-2 hover:bg-gray-100 cursor-pointer"
                    aria-label="关闭"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="overflow-y-auto p-5 space-y-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">菜单标题</div>
                    <div className="text-sm font-medium text-gray-900">{modal.row.effectiveMenuTitle}</div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-gray-600">规则段落</div>
                    {modal.row.effectiveParagraphs.map((p, i) => (
                      <div key={i} className="rounded-lg border border-line bg-gray-50/50 p-3 space-y-2">
                        <div className="text-xs text-gray-500">段落 {i + 1}</div>
                        <div className="text-sm font-medium text-gray-900">{p.subheading}</div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{p.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
                  <button
                    type="button"
                    onClick={() => setModal({ mode: null, row: null })}
                    className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    关闭
                  </button>
                </div>
              </>
            )}

            {modal.mode === 'edit' && (
              <>
                <div className="flex items-center justify-between border-b border-line px-5 py-4 shrink-0">
                  <h2 className="text-lg font-bold text-ink">编辑规则 · {modal.row.routeKey}</h2>
                  <button
                    type="button"
                    onClick={() => setModal({ mode: null, row: null })}
                    className="rounded-full p-2 hover:bg-gray-100 cursor-pointer"
                    aria-label="关闭"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="overflow-y-auto p-5 space-y-5 flex-1">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      菜单标题（展示用）<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={MAX_TITLE}
                        value={editMenuTitle}
                        onChange={(e) => setEditMenuTitle(e.target.value)}
                        className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20"
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-gray-400">
                        {editMenuTitle.length} / {MAX_TITLE}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-800">规则段落</div>
                    {editParagraphs.map((p, idx) => (
                      <div key={idx} className="rounded-lg border border-line p-4 space-y-3 bg-white">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">段落 {idx + 1}</span>
                          {editParagraphs.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditParagraphs((list) => list.filter((_, j) => j !== idx))
                              }
                              className="text-xs text-red-600 hover:underline cursor-pointer"
                            >
                              删除
                            </button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            小标题<span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              maxLength={MAX_SUB}
                              value={p.subheading}
                              onChange={(e) =>
                                setEditParagraphs((list) =>
                                  list.map((x, j) =>
                                    j === idx ? { ...x, subheading: e.target.value } : x
                                  )
                                )
                              }
                              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20"
                            />
                            <span className="absolute right-2 top-2 text-[10px] text-gray-400">
                              {p.subheading.length} / {MAX_SUB}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">正文</label>
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
                              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20 resize-y min-h-[100px]"
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
                      onClick={() =>
                        setEditParagraphs((list) => [...list, { subheading: '', body: '' }])
                      }
                      className="w-full rounded-lg border border-dashed border-line py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                      新增段落
                    </button>
                  </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-line px-5 py-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setModal({ mode: null, row: null })}
                    className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
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
      )}
    </div>
  );
}
