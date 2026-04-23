import { useState, useRef, useMemo, type ChangeEvent, type KeyboardEvent } from 'react';
import { Pagination } from './Pagination';
import { useResizableTableColumns, ColumnTipHeader } from './resizableTableColumns';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Edit2, ImagePlus, Plus, Search, Trash2, X } from 'lucide-react';
import type { SectGuildFormState, SectGuildProjectItem, SectGuildRow, SectGuildStatus, SectIntroBlock, SectIntroTabKey } from './sectGuildModel';
import { SECT_GUILD_STATUS_LABEL, SECT_INTRO_TAB_KEYS, SECT_INTRO_TAB_LABEL } from './sectGuildModel';
import { RichTextEditor } from './RichTextEditor';

const SECT_GUILD_COL_DEFAULTS = [160, 120, 100, 160, 100, 100, 100, 120, 100, 160, 120];

/** 门派管理字段说明 */
const MT_FIELD_TIPS: Record<string, string> = {
  name: '门派在列表与详情页中的对外展示名称',
  leader: '门派负责人或对外展示的掌门昵称',
  tags: '用于筛选和分类的标签，最多添加 1 个',
  status: '门派启用/停用状态，停用后前台不可访问该门派',
  totalEarnings: '演示用汇总指标，实际口径以后台数仓为准（元）',
};

const tableHeadClass =
  'px-3 py-3.5 text-left text-[14px] font-bold text-gray-900 dark:text-white/85 font-sans tracking-tight align-middle whitespace-nowrap sm:px-4';
const tableHeadRight = `${tableHeadClass} text-right`;
const tableHeadAction =
  'sticky right-0 z-30 border-l border-line bg-gray-50/95 dark:bg-[#181c28]/95 px-3 py-3.5 text-right text-[14px] font-bold text-gray-900 dark:text-white/85 font-sans tracking-tight align-middle whitespace-nowrap shadow-[-10px_0_20px_-8px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:px-4 relative';
const tableCellActionBase =
  'sticky right-0 z-20 border-l border-line bg-white dark:bg-[#1e2232] px-3 py-4 text-right shadow-[-10px_0_20px_-8px_rgba(0,0,0,0.08)] group-hover:bg-gray-50 dark:group-hover:bg-[#252a3a] sm:px-4';
const tableCellAction = `${tableCellActionBase} align-middle`;

const inputClass =
  'w-full rounded-lg border border-line px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20';

function formatLocal(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return iso;
  }
}

function formatMoney(n: number) {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function statusBadgeClass(s: SectGuildStatus) {
  if (s === 'active') return 'bg-green-50 text-green-700';
  return 'bg-gray-100 text-gray-600';
}


function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-20 text-gray-400">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
        <Search className="h-8 w-8 opacity-20" />
      </div>
      <p className="text-sm font-medium">暂无匹配数据</p>
      <p className="mt-1 text-xs">请尝试调整搜索关键词</p>
    </div>
  );
}

type ProjectSortField = 'earnings7d' | 'earnings30d' | 'earningsTotal' | 'dataUpdatedAt';
type SortOrder = 'asc' | 'desc';

function SortIcon({ field, current, order }: { field: ProjectSortField; current: ProjectSortField | null; order: SortOrder }) {
  if (current !== field) return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 text-gray-300" />;
  if (order === 'asc') return <ArrowUp className="ml-1 inline h-3.5 w-3.5 text-accent" />;
  return <ArrowDown className="ml-1 inline h-3.5 w-3.5 text-accent" />;
}

function exportProjectsCsv(rows: SectGuildProjectItem[], sectName: string) {
  const headers = ['项目ID', '项目名称', '项目类型', '近7日收益(元)', '近30日收益(元)', '总收益(元)', '数据更新时间'];
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.projectId,
        `"${r.projectName}"`,
        r.projectType,
        r.earnings7d,
        r.earnings30d,
        r.earningsTotal,
        `"${formatLocal(r.dataUpdatedAt)}"`,
      ].join(',')
    ),
  ];
  const csv = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `门派项目明细_${sectName}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function SectGuildProjectsModal({
  sectName,
  projects,
  onClose,
}: {
  sectName: string;
  projects: SectGuildProjectItem[];
  onClose: () => void;
}) {
  const [keyword, setKeyword] = useState('');
  const [sortField, setSortField] = useState<ProjectSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: ProjectSortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    let list = q ? projects.filter((p) => p.projectName.toLowerCase().includes(q)) : projects;
    if (sortField) {
      list = [...list].sort((a, b) => {
        const av = sortField === 'dataUpdatedAt' ? new Date(a[sortField]).getTime() : (a[sortField] as number);
        const bv = sortField === 'dataUpdatedAt' ? new Date(b[sortField]).getTime() : (b[sortField] as number);
        return sortOrder === 'desc' ? bv - av : av - bv;
      });
    }
    return list;
  }, [projects, keyword, sortField, sortOrder]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-[#1e2232]">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white/90">{sectName} — 项目明细</h2>
            <p className="mt-0.5 text-xs text-gray-400">共 {projects.length} 个项目，当前显示 {filtered.length} 条</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 工具栏 */}
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索项目名称"
              className="w-full rounded-lg border border-line py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <button
            type="button"
            onClick={() => exportProjectsCsv(filtered, sectName)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:bg-[#252a3a] dark:text-white/80 dark:hover:bg-[#2d3348]"
          >
            <Download className="h-4 w-4" />
            导出数据表
          </button>
        </div>

        {/* 表格 */}
        <div className="min-h-0 flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Search className="mb-3 h-8 w-8 opacity-20" />
              <p className="text-sm">暂无匹配项目</p>
            </div>
          ) : (
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-line bg-gray-50/95 backdrop-blur-sm dark:bg-[#252a3a]/95">
                <tr>
                  <th className="px-4 py-3 font-bold text-gray-700 dark:text-white/80">项目ID</th>
                  <th className="px-4 py-3 font-bold text-gray-700 dark:text-white/80">项目Icon</th>
                  <th className="px-4 py-3 font-bold text-gray-700 dark:text-white/80">项目名称</th>
                  <th className="px-4 py-3 font-bold text-gray-700 dark:text-white/80">项目类型</th>
                  <th
                    className="cursor-pointer select-none px-4 py-3 text-right font-bold text-gray-700 dark:text-white/80 hover:text-accent"
                    onClick={() => handleSort('earnings7d')}
                  >
                    近7日收益
                    <SortIcon field="earnings7d" current={sortField} order={sortOrder} />
                  </th>
                  <th
                    className="cursor-pointer select-none px-4 py-3 text-right font-bold text-gray-700 dark:text-white/80 hover:text-accent"
                    onClick={() => handleSort('earnings30d')}
                  >
                    近30日收益
                    <SortIcon field="earnings30d" current={sortField} order={sortOrder} />
                  </th>
                  <th
                    className="cursor-pointer select-none px-4 py-3 text-right font-bold text-gray-700 dark:text-white/80 hover:text-accent"
                    onClick={() => handleSort('earningsTotal')}
                  >
                    总收益
                    <SortIcon field="earningsTotal" current={sortField} order={sortOrder} />
                  </th>
                  <th
                    className="cursor-pointer select-none px-4 py-3 text-right font-bold text-gray-700 dark:text-white/80 hover:text-accent"
                    onClick={() => handleSort('dataUpdatedAt')}
                  >
                    数据更新时间
                    <SortIcon field="dataUpdatedAt" current={sortField} order={sortOrder} />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((item) => (
                  <tr key={item.projectId} className="group transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.projectId}</td>
                    <td className="px-4 py-3">
                      {item.projectIcon ? (
                        <img src={item.projectIcon} alt="" className="h-9 w-9 rounded-lg border border-line object-cover" />
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="max-w-[180px] px-4 py-3 font-medium text-gray-800 dark:text-white/85">
                      <span className="line-clamp-2">{item.projectName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                        {item.projectType}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700 dark:text-white/70">
                      ¥{formatMoney(item.earnings7d)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700 dark:text-white/70">
                      ¥{formatMoney(item.earnings30d)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-800 dark:text-white/85">
                      ¥{formatMoney(item.earningsTotal)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-gray-500">
                      {formatLocal(item.dataUpdatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 底部统计 */}
        <div className="flex items-center justify-between border-t border-line px-6 py-3 text-xs text-gray-400">
          <span>
            近7日合计：<span className="font-medium text-gray-700 dark:text-white/70">¥{formatMoney(filtered.reduce((s, r) => s + r.earnings7d, 0))}</span>
            <span className="mx-3">·</span>
            近30日合计：<span className="font-medium text-gray-700 dark:text-white/70">¥{formatMoney(filtered.reduce((s, r) => s + r.earnings30d, 0))}</span>
            <span className="mx-3">·</span>
            总收益合计：<span className="font-semibold text-accent">¥{formatMoney(filtered.reduce((s, r) => s + r.earningsTotal, 0))}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function SectGuildTable({
  data,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  projectsMap,
}: {
  data: SectGuildRow[];
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (row: SectGuildRow) => void;
  onDelete: (row: SectGuildRow) => void;
  projectsMap?: Record<string, import('./sectGuildModel').SectGuildProjectItem[]>;
}) {
  const [projectsModal, setProjectsModal] = useState<{ sectName: string; projects: import('./sectGuildModel').SectGuildProjectItem[] } | null>(null);
  const rtc = useResizableTableColumns('sect-guild', SECT_GUILD_COL_DEFAULTS);
  if (data.length === 0) return <EmptyState />;
  const paginated = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
    {projectsModal && (
      <SectGuildProjectsModal
        sectName={projectsModal.sectName}
        projects={projectsModal.projects}
        onClose={() => setProjectsModal(null)}
      />
    )}
    <div className="overflow-x-auto overflow-y-visible">
      <table
        className="app-data-table app-data-table--resizable w-full min-w-0 border-collapse text-left"
        style={{ minWidth: rtc.tableMinWidth }}
      >
        {rtc.colGroup}
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <ColumnTipHeader label="门派名称" tip={MT_FIELD_TIPS.name} className={`${tableHeadClass} relative`} resizeHandle={rtc.renderResizeHandle(0)} />
            <ColumnTipHeader label="负责人" tip={MT_FIELD_TIPS.leader} className={`${tableHeadClass} relative`} resizeHandle={rtc.renderResizeHandle(1)} />
            <th className={`${tableHeadClass} relative`}>
              门派 icon
              {rtc.renderResizeHandle(2)}
            </th>
            <ColumnTipHeader label="标签" tip={MT_FIELD_TIPS.tags} className={`${tableHeadClass} relative`} resizeHandle={rtc.renderResizeHandle(3)} />
            <th className={`${tableHeadRight} relative`}>
              门派项目数
              {rtc.renderResizeHandle(4)}
            </th>
            <th className={`${tableHeadRight} relative`}>
              导师数量
              {rtc.renderResizeHandle(5)}
            </th>
            <th className={`${tableHeadRight} relative`}>
              学员总数
              {rtc.renderResizeHandle(6)}
            </th>
            <ColumnTipHeader label="学员总收益" tip={MT_FIELD_TIPS.totalEarnings} align="right" className={`${tableHeadRight} relative`} resizeHandle={rtc.renderResizeHandle(7)} />
            <ColumnTipHeader label="状态" tip={MT_FIELD_TIPS.status} className={`${tableHeadClass} relative`} resizeHandle={rtc.renderResizeHandle(8)} />
            <th className={`${tableHeadClass} relative`}>
              创建时间
              {rtc.renderResizeHandle(9)}
            </th>
            <th className={tableHeadAction}>
              操作
              {rtc.renderResizeHandle(9)}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {paginated.map((row) => (
            <tr key={row.id} className="group transition-colors hover:bg-gray-50">
              <td className="min-w-0 break-words px-3 py-4 text-sm font-medium text-ink sm:px-4">{row.name}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700 sm:px-4">{row.leaderName || '—'}</td>
              <td className="px-3 py-4 sm:px-4">
                {row.iconUrl ? (
                  <img
                    src={row.iconUrl}
                    alt=""
                    className="h-10 w-10 rounded-lg border border-line object-cover"
                  />
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </td>
              <td className="px-3 py-4 text-sm text-gray-700 sm:px-4">
                {row.tags ? (
                  <span className="inline-block max-w-[140px] truncate" title={row.tags}>
                    {row.tags}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-right text-sm sm:px-4">
                {projectsMap && projectsMap[row.id] ? (
                  <button
                    type="button"
                    onClick={() => setProjectsModal({ sectName: row.name, projects: projectsMap[row.id] })}
                    className="font-medium text-accent underline-offset-2 hover:underline"
                  >
                    {row.projectCount}
                  </button>
                ) : (
                  <span className="text-gray-700">{row.projectCount}</span>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-700 sm:px-4">
                {row.mentorCount}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-700 sm:px-4">
                {row.studentCount}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-700 sm:px-4">
                ¥{formatMoney(row.totalStudentEarnings)}
              </td>
              <td className="px-3 py-4 sm:px-4">
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(row.status)}`}>
                  {SECT_GUILD_STATUS_LABEL[row.status]}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600 sm:px-4">
                {formatLocal(row.createdAt)}
              </td>
              <td className={tableCellAction}>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(row)}
                    className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(row)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50/80 px-2.5 py-1.5 text-xs font-medium text-red-700 shadow-sm transition-colors hover:bg-red-100/80"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    删除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        total={data.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
    </>
  );
}

function SingleTagField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [input, setInput] = useState('');
  const hasTag = value.trim() !== '';

  const addTag = () => {
    const tag = input.trim();
    if (!tag || hasTag) return;
    onChange(tag);
    setInput('');
  };

  const removeTag = () => {
    onChange('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">标签</label>
      <div className="flex flex-wrap items-center gap-2 min-h-[38px] rounded-lg border border-line px-3 py-1.5 bg-white focus-within:ring-2 focus-within:ring-accent/20">
        {hasTag && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
            {value}
            <button
              type="button"
              onClick={removeTag}
              className="ml-0.5 rounded-full p-0.5 hover:bg-accent/20 transition-colors"
              aria-label="移除标签"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
        {!hasTag && (
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入标签后回车添加"
            className="min-w-[140px] flex-1 bg-transparent text-sm outline-none"
          />
        )}
        {!hasTag && (
          <button
            type="button"
            onClick={addTag}
            disabled={!input.trim()}
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-accent hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            添加
          </button>
        )}
      </div>
      <p className="text-[10px] text-gray-400">最多添加 1 个标签</p>
    </div>
  );
}

function SectIconUploadField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (value.startsWith('blob:')) URL.revokeObjectURL(value);
    onChange(URL.createObjectURL(file));
  };
  const clear = () => {
    if (value.startsWith('blob:')) URL.revokeObjectURL(value);
    onChange('');
  };
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">门派 icon</label>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={pick} />
      <div className="flex flex-wrap items-start gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-gray-50">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">未上传</div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <ImagePlus className="h-4 w-4 text-accent" />
            上传图片
          </button>
          {value ? (
            <button type="button" onClick={clear} className="text-left text-xs text-red-600 hover:underline">
              清除
            </button>
          ) : null}
        </div>
      </div>
      <p className="text-[10px] text-gray-400">支持 jpg / png / webp，建议尺寸 96×96</p>
    </div>
  );
}

export function SectGuildDrawerFields({
  form,
  onPatch,
}: {
  form: SectGuildFormState;
  onPatch: (p: Partial<SectGuildFormState>) => void;
}) {
  const [introTab, setIntroTab] = useState<SectIntroTabKey>('communityIntro');
  const block: SectIntroBlock = form.intro[introTab];

  const patchIntro = (tab: SectIntroTabKey, partial: Partial<SectIntroBlock>) => {
    onPatch({
      intro: {
        ...form.intro,
        [tab]: { ...form.intro[tab], ...partial },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
          门派名称
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className={inputClass}
          value={form.name}
          onChange={(e) => onPatch({ name: e.target.value })}
          placeholder="请输入门派名称"
        />
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
          门派负责人
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className={inputClass}
          value={form.leaderName}
          onChange={(e) => onPatch({ leaderName: e.target.value })}
          placeholder="负责人姓名"
        />
      </div>
      <SectIconUploadField
        value={form.iconUrl}
        onChange={(url) => onPatch({ iconUrl: url })}
      />
      <SingleTagField value={form.tags} onChange={(v) => onPatch({ tags: v })} />

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">公告</label>
        <textarea
          className={`${inputClass} min-h-[80px] resize-y`}
          value={form.announcement}
          onChange={(e) => onPatch({ announcement: e.target.value })}
          placeholder="请输入门派公告内容（选填）"
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-800">门派介绍</p>
        <div className="flex flex-wrap gap-1 rounded-xl bg-gray-200/50 p-1">
          {SECT_INTRO_TAB_KEYS.map((key) => {
            const active = introTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setIntroTab(key)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  active ? 'bg-white text-accent shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {SECT_INTRO_TAB_LABEL[key]}
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-line bg-gray-50/40 p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">标题</label>
            <input
              type="text"
              className={inputClass}
              value={block.title}
              onChange={(e) => patchIntro(introTab, { title: e.target.value })}
              placeholder="板块标题"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">描述</label>
            <textarea
              className={`${inputClass} min-h-[72px] resize-y`}
              value={block.description}
              onChange={(e) => patchIntro(introTab, { description: e.target.value })}
              placeholder="板块描述"
            />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700">是否显示</span>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  className="accent-accent"
                  checked={block.visible}
                  onChange={() => patchIntro(introTab, { visible: true })}
                />
                显示
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  className="accent-accent"
                  checked={!block.visible}
                  onChange={() => patchIntro(introTab, { visible: false })}
                />
                隐藏
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700">文案内容</span>
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name={`sect-content-${introTab}`}
                  className="accent-accent"
                  checked={block.contentKind === 'richText'}
                  onChange={() => patchIntro(introTab, { contentKind: 'richText' })}
                />
                图文（富文本）
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name={`sect-content-${introTab}`}
                  className="accent-accent"
                  checked={block.contentKind === 'video'}
                  onChange={() => patchIntro(introTab, { contentKind: 'video' })}
                />
                视频
              </label>
            </div>
            {block.contentKind === 'richText' ? (
              <RichTextEditor
                value={block.richTextHtml}
                onChange={(html) => patchIntro(introTab, { richTextHtml: html })}
              />
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  className={inputClass}
                  value={block.videoUrl}
                  onChange={(e) => patchIntro(introTab, { videoUrl: e.target.value })}
                  placeholder="视频地址（mp4 等）"
                />
                {block.videoUrl ? (
                  <video
                    controls
                    className="mt-2 max-h-48 w-full rounded-lg border border-line bg-black"
                    src={block.videoUrl}
                  >
                    您的浏览器不支持视频播放
                  </video>
                ) : (
                  <p className="text-xs text-gray-400">填写地址后下方预览</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
