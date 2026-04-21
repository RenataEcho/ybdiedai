import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, ChevronDown, ChevronRight, Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import type {
  IterationRecordFormState,
  IterationRecordRow,
  IterationPriority,
  IterationStatus,
  IterationSubRequirementRow,
} from './iterationRecordModel';
import {
  ITERATION_PRIORITY_LABEL,
  ITERATION_STATUS_LABEL,
  newSubRequirementFormItem,
} from './iterationRecordModel';
import { RichTextEditor } from './RichTextEditor';
import { useResizableTableColumns } from './resizableTableColumns';
import { Pagination } from './Pagination';

/** 列默认宽度（px），与表头列数一致；勿在 render 内联新建数组 */
const ITERATION_RECORD_COL_DEFAULTS = [200, 88, 104, 160, 120, 140, 130, 100, 100, 132, 180, 128];

const tableHeadClass =
  'px-3 py-3.5 text-left text-[14px] font-bold text-gray-900 dark:text-white/85 font-sans tracking-tight align-top break-words sm:px-4';
const tableHeadAction =
  'sticky right-0 z-30 border-l border-line bg-gray-50/95 dark:bg-[#181c28]/95 px-3 py-3.5 text-right text-[14px] font-bold text-gray-900 dark:text-white/85 font-sans tracking-tight align-top whitespace-nowrap shadow-[-10px_0_20px_-8px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:px-4 relative';
const tableCellActionBase =
  'sticky right-0 z-20 border-l border-line bg-white dark:bg-[#1e2232] px-3 py-4 text-right shadow-[-10px_0_20px_-8px_rgba(0,0,0,0.08)] group-hover/iter:bg-gray-50 dark:group-hover/iter:bg-[#252a3a] sm:px-4';
const tableCellAction = `${tableCellActionBase} align-top`;

const inputClass =
  'w-full rounded-lg border border-line px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20';

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatLocal(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return iso;
  }
}

function formatDateRange(start: string, end: string) {
  if (!start && !end) return '—';
  if (start && end) return `${start} ~ ${end}`;
  return start || end || '—';
}

function statusBadgeClass(s: IterationStatus) {
  if (s === 'released') return 'bg-green-50 text-green-700';
  if (s === 'testing') return 'bg-amber-50 text-amber-800';
  if (s === 'in_progress') return 'bg-blue-50 text-blue-700';
  return 'bg-gray-100 text-gray-600';
}

function priorityBadgeClass(p: IterationPriority | '') {
  if (p === 'SSS') return 'bg-red-50 text-red-800 ring-1 ring-red-100';
  if (p === 'SS') return 'bg-orange-50 text-orange-900 ring-1 ring-orange-100';
  if (p === 'S') return 'bg-amber-50 text-amber-900 ring-1 ring-amber-100';
  if (p === 'A') return 'bg-sky-50 text-sky-800 ring-1 ring-sky-100';
  if (p === 'B') return 'bg-blue-50 text-blue-700 ring-1 ring-blue-100';
  if (p === 'C') return 'bg-gray-100 text-gray-600 ring-1 ring-line';
  return 'bg-gray-50 text-gray-400 ring-1 ring-line';
}

function PriorityBadge({ priority }: { priority: IterationPriority | '' }) {
  if (!priority) return <span className="text-gray-400">—</span>;
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold ${priorityBadgeClass(priority)}`}
    >
      {ITERATION_PRIORITY_LABEL[priority]}
    </span>
  );
}

function RichOrPlainBlock({ value }: { value: string }) {
  const plain = stripHtml(value);
  if (!plain) return <span className="text-gray-400">—</span>;
  if (/<[a-z][\s\S]*>/i.test(value.trim())) {
    return (
      <div
        className="prose prose-sm min-w-0 max-w-none break-words text-gray-700 [overflow-wrap:anywhere] [&_p]:my-1 [&_ul]:my-1 [&_ul]:pl-6 [&_ol]:my-1 [&_ol]:pl-6 [&_ul>li]:list-disc [&_ol>li]:list-decimal [&_li]:my-0.5"
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  }
  return <div className="min-w-0 whitespace-pre-wrap break-words text-gray-700 [overflow-wrap:anywhere]">{value}</div>;
}

const wrapCell =
  'min-w-0 max-w-none px-3 py-3 align-top text-sm break-words [overflow-wrap:anywhere] sm:px-4';
const wrapCellTitle = `${wrapCell} font-medium text-ink`;
const wrapCellNote = `${wrapCell} text-xs text-gray-600`;
/** 子需求多行时与序号行对齐的单元格 */
const subRowCell = `${wrapCell} align-top`;

function staffName(ids: string[], parentIds: string[], nameById: Map<string, string>): string {
  const pick = (arr: string[]) =>
    arr.length ? arr.map((id) => nameById.get(id) ?? `（未知 id:${id}）`).join('、') : '';
  return pick(ids) || pick(parentIds) || '—';
}

function staffNameSimple(ids: string[], nameById: Map<string, string>): string {
  if (!ids.length) return '—';
  return ids.map((id) => nameById.get(id) ?? `（未知 id:${id}）`).join('、');
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

/* ═══════════════════════════════════════════════════
   规则详情抽屉（父需求 detailRulesHtml + 各子需求 descriptionHtml）
   数据结构：
     - parentTitle: 父需求标题
     - detailRulesHtml: 父需求详细规则
     - subs: 子需求列表（title + descriptionHtml）
   抽屉支持左边缘拖拽调宽
═══════════════════════════════════════════════════ */
type RuleDrawerData = {
  parentTitle: string;
  detailRulesHtml: string;
  subs: Pick<IterationSubRequirementRow, 'id' | 'title' | 'descriptionHtml'>[];
};

const RULE_DRAWER_MIN = 300;
const RULE_DRAWER_MAX = 900;
const RULE_DRAWER_DEFAULT = 480;

function RuleDetailDrawer({
  data,
  onClose,
}: {
  data: RuleDrawerData;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'parent' | number>('parent');
  const [width, setWidth] = useState(RULE_DRAWER_DEFAULT);
  const resizing = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);
  const richRef = useRef<HTMLDivElement>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  /* 图片点击放大 */
  useEffect(() => {
    const timer = setTimeout(() => {
      const el = richRef.current;
      if (!el) return;
      el.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
        img.style.cursor = 'zoom-in';
        img.title = '点击放大查看';
      });
      const onClick = (e: MouseEvent) => {
        if ((e.target as HTMLElement).tagName === 'IMG') {
          setLightboxSrc(((e.target as HTMLImageElement).src));
        }
      };
      el.addEventListener('click', onClick);
      return () => el.removeEventListener('click', onClick);
    }, 60);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const onResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    resizing.current = true;
    startX.current = e.clientX;
    startW.current = width;
  };
  const onResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizing.current) return;
    const delta = startX.current - e.clientX;
    setWidth(Math.round(Math.max(RULE_DRAWER_MIN, Math.min(RULE_DRAWER_MAX, startW.current + delta))));
  };
  const onResizeEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    resizing.current = false;
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
  };

  const tabs = [
    { key: 'parent' as const, label: '详细规则' },
    ...data.subs.map((s, i) => ({ key: i as number, label: `子需求${i + 1}` })),
  ];

  const currentHtml =
    activeTab === 'parent'
      ? data.detailRulesHtml
      : data.subs[activeTab as number]?.descriptionHtml ?? '';

  const hasContent = currentHtml && stripHtml(currentHtml).trim();
  const subTitle = activeTab !== 'parent' ? (data.subs[activeTab as number]?.title?.trim() || null) : null;

  return (
    <>
      {/* 遮罩 */}
      <motion.div
        key="rule-drawer-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 bg-black/25"
        onClick={onClose}
      />

      {/* 抽屉 */}
      <motion.div
        key="rule-drawer-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.9 }}
        className="fixed right-0 top-0 z-50 flex h-full flex-col border-l border-line bg-white shadow-2xl"
        style={{ width }}
      >
        {/* 左边缘拖拽手柄 */}
        <div
          onPointerDown={onResizeStart}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeEnd}
          onPointerCancel={onResizeEnd}
          className="group absolute left-0 top-0 h-full w-1 cursor-ew-resize touch-none select-none hover:w-1.5 hover:bg-accent/30 active:bg-accent/50"
          title="拖动调整抽屉宽度"
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-1 w-1 rounded-full bg-accent/60" />
            ))}
          </div>
        </div>

        {/* 头部 */}
        <div className="shrink-0 border-b border-line px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-gray-400">规则详情</p>
              <h3 className="mt-0.5 break-words text-sm font-semibold text-ink [overflow-wrap:anywhere]">
                {data.parentTitle || '（无标题）'}
              </h3>
              {subTitle && (
                <p className="mt-0.5 text-xs text-gray-500 [overflow-wrap:anywhere]">
                  {subTitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tab 栏 */}
          {tabs.length > 1 && (
            <div className="mt-3 flex gap-0.5 overflow-x-auto border-b border-line pb-0">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={String(tab.key)}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`shrink-0 rounded-t-md border border-b-0 px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? 'border-line bg-white text-accent shadow-[0_1px_0_0_white]'
                        : 'border-transparent text-gray-500 hover:border-line/60 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 内容区 */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {hasContent ? (
            <div
              ref={richRef}
              className="prose prose-sm max-w-none text-gray-700 [&_p]:my-1.5 [&_ul]:my-1 [&_ul]:pl-6 [&_ol]:my-1 [&_ol]:pl-6 [&_li]:my-0.5 [&_ul>li]:list-disc [&_ol>li]:list-decimal [&_img]:cursor-zoom-in [&_img]:rounded-md"
              dangerouslySetInnerHTML={{ __html: currentHtml }}
            />
          ) : (
            <p className="text-sm text-gray-400">
              {activeTab === 'parent' ? '暂无详细规则说明。' : '该子需求暂无详细描述。'}
            </p>
          )}
        </div>

        {/* 底部提示 */}
        <div className="shrink-0 border-t border-line px-5 py-2 text-right">
          <span className="text-[11px] text-gray-300">← 拖动左侧边缘调整宽度 · {width}px</span>
        </div>
      </motion.div>

      {/* 灯箱 */}
      <AnimatePresence>
        {lightboxSrc && (
          <motion.div
            key="rule-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[70] flex cursor-zoom-out items-center justify-center bg-black/85 backdrop-blur-sm"
            onClick={() => setLightboxSrc(null)}
          >
            <motion.img
              src={lightboxSrc}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.18, type: 'spring', bounce: 0.1 }}
              className="max-h-[90vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              alt="图片预览"
            />
            <button
              type="button"
              onClick={() => setLightboxSrc(null)}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm hover:bg-white/20"
              aria-label="关闭"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function IterationRecordTable({
  data,
  staffNameById,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}: {
  data: IterationRecordRow[];
  staffNameById: Map<string, string>;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (row: IterationRecordRow) => void;
  onDelete: (row: IterationRecordRow) => void;
}) {
  const rtc = useResizableTableColumns('iteration-record', ITERATION_RECORD_COL_DEFAULTS);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [ruleDrawer, setRuleDrawer] = useState<RuleDrawerData | null>(null);

  const toggleRowCollapsed = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openRuleDrawer = useCallback((row: IterationRecordRow) => {
    setRuleDrawer({
      parentTitle: row.parentRequirement,
      detailRulesHtml: row.detailRulesHtml,
      subs: row.subRequirements.map((s) => ({
        id: s.id,
        title: s.title,
        descriptionHtml: s.descriptionHtml,
      })),
    });
  }, []);

  if (data.length === 0) return <EmptyState />;
  const paginated = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      <div className="overflow-x-auto overflow-y-visible">
        <table
          className="app-data-table app-data-table--resizable w-full min-w-0 border-collapse text-left"
          style={{ minWidth: rtc.tableMinWidth }}
        >
          {rtc.colGroup}
          <thead>
            <tr className="border-b border-line bg-gray-50/50">
              <th className={`${tableHeadClass} relative`}>
                父需求
                {rtc.renderResizeHandle(0)}
              </th>
              <th className={`${tableHeadClass} relative whitespace-nowrap`}>
                版本号
                {rtc.renderResizeHandle(1)}
              </th>
              <th className={`${tableHeadClass} relative whitespace-nowrap`}>
                优先级
                {rtc.renderResizeHandle(2)}
              </th>
              <th className={`${tableHeadClass} relative`}>
                子需求
                {rtc.renderResizeHandle(3)}
              </th>
              <th className={`${tableHeadClass} relative`}>
                产品
                {rtc.renderResizeHandle(4)}
              </th>
              <th className={`${tableHeadClass} relative`}>
                研发测试
                {rtc.renderResizeHandle(5)}
              </th>
              <th className={`${tableHeadClass} relative`}>
                开始~结束
                {rtc.renderResizeHandle(6)}
              </th>
              <th className={`${tableHeadClass} relative whitespace-nowrap`}>
                状态
                {rtc.renderResizeHandle(7)}
              </th>
              <th className={`${tableHeadClass} relative whitespace-nowrap`}>
                详细规则
                {rtc.renderResizeHandle(8)}
              </th>
              <th className={`${tableHeadClass} relative whitespace-nowrap`}>
                发布时间
                {rtc.renderResizeHandle(9)}
              </th>
              <th className={`${tableHeadClass} relative`}>
                其他说明
                {rtc.renderResizeHandle(10)}
              </th>
              <th className={tableHeadAction}>
                操作
                {rtc.renderResizeHandle(11)}
              </th>
            </tr>
          </thead>
          {paginated.map((row) => {
            const hasSubs = row.subRequirements.length > 0;
            const n = hasSubs ? row.subRequirements.length : 1;
            const isCollapsed = !expandedIds.has(row.id);

            /* 「查看规则详情」按钮 */
            const ruleBtn = (
              <button
                type="button"
                onClick={() => openRuleDrawer(row)}
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                查看规则详情
              </button>
            );

            const versionBlock = row.version.trim() ? (
              <span className="font-mono text-[13px] text-gray-800">{row.version.trim()}</span>
            ) : (
              <span className="text-gray-400">—</span>
            );
            const priorityBlock = <PriorityBadge priority={row.priority} />;
            const releaseBlock =
              row.status === 'released' ? (
                <span className="text-sm text-gray-600">{formatLocal(row.releaseTime)}</span>
              ) : (
                <span className="text-gray-400">—</span>
              );
            const notesBlock = <RichOrPlainBlock value={row.notesHtml} />;
            const notesBlockCollapsed = (
              <div className="line-clamp-2 min-w-0 max-w-none text-xs [&_.prose]:line-clamp-2">{notesBlock}</div>
            );
            const actionsBlock = (
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
            );

            const expandBtn = (
              <button
                type="button"
                className="mt-0.5 shrink-0 rounded p-0.5 text-gray-500 outline-none hover:bg-gray-100 hover:text-gray-800"
                aria-expanded={!isCollapsed}
                aria-controls={`iter-tbody-${row.id}`}
                id={`iter-expand-${row.id}`}
                title={isCollapsed ? '展开整条记录' : '收起整条记录'}
                onClick={() => toggleRowCollapsed(row.id)}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" aria-hidden />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden />
                )}
              </button>
            );

            const parentBlock = row.parentRequirement ? (
              <div className="min-w-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                {row.parentRequirement}
              </div>
            ) : (
              <span className="text-gray-400">—</span>
            );

            const parentWithToggle = (lineClamp: boolean) => (
              <div className="flex items-start gap-1.5">
                {expandBtn}
                <div className={`min-w-0 flex-1 ${lineClamp ? 'line-clamp-2' : ''}`}>{parentBlock}</div>
              </div>
            );

            if (isCollapsed) {
              const subSummary = hasSubs ? (
                <span className="text-sm text-gray-700">
                  共 <span className="font-semibold tabular-nums">{n}</span> 条子需求
                  <span className="ml-1 text-xs text-gray-400">（已收起）</span>
                </span>
              ) : (
                <span className="text-gray-400">—</span>
              );
              return (
                <tbody
                  key={row.id}
                  id={`iter-tbody-${row.id}`}
                  className="group/iter border-b border-line last:border-b-0"
                >
                  <tr className="transition-colors group-hover/iter:bg-gray-50">
                    <td className={wrapCellTitle}>{parentWithToggle(true)}</td>
                    <td className={wrapCell}>{versionBlock}</td>
                    <td className={wrapCell}>{priorityBlock}</td>
                    <td className={wrapCell}>{subSummary}</td>
                    <td className={wrapCell}>
                      <div className="text-gray-700 [overflow-wrap:anywhere]">
                        {staffNameSimple(row.parentProductOwnerIds ?? [], staffNameById)}
                      </div>
                    </td>
                    <td className={wrapCell}>
                      <div className="text-gray-700 [overflow-wrap:anywhere]">
                        {staffNameSimple(row.parentAssigneeIds, staffNameById)}
                      </div>
                    </td>
                    <td className={wrapCell}>
                      <div className="text-gray-700">{formatDateRange(row.parentDateStart, row.parentDateEnd)}</div>
                    </td>
                    <td className="px-3 py-3 align-top sm:px-4">
                      <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(row.status)}`}>
                        {ITERATION_STATUS_LABEL[row.status]}
                      </span>
                    </td>
                    <td className={wrapCell}>{ruleBtn}</td>
                    <td className="whitespace-nowrap px-3 py-3 align-top sm:px-4">{releaseBlock}</td>
                    <td className={wrapCellNote}>{notesBlockCollapsed}</td>
                    <td className={tableCellAction}>{actionsBlock}</td>
                  </tr>
                </tbody>
              );
            }

            if (!hasSubs) {
              return (
                <tbody
                  key={row.id}
                  id={`iter-tbody-${row.id}`}
                  className="group/iter border-b border-line last:border-b-0"
                >
                  <tr className="transition-colors group-hover/iter:bg-gray-50">
                    <td className={wrapCellTitle}>{parentWithToggle(false)}</td>
                    <td className={wrapCell}>{versionBlock}</td>
                    <td className={wrapCell}>{priorityBlock}</td>
                    <td className={wrapCell}>
                      <span className="text-gray-400">—</span>
                    </td>
                    <td className={wrapCell}>
                      <div className="text-gray-700 [overflow-wrap:anywhere]">
                        {staffNameSimple(row.parentProductOwnerIds ?? [], staffNameById)}
                      </div>
                    </td>
                    <td className={wrapCell}>
                      <div className="text-gray-700 [overflow-wrap:anywhere]">
                        {staffNameSimple(row.parentAssigneeIds, staffNameById)}
                      </div>
                    </td>
                    <td className={wrapCell}>
                      <div className="text-gray-700">{formatDateRange(row.parentDateStart, row.parentDateEnd)}</div>
                    </td>
                    <td className="px-3 py-3 align-top sm:px-4">
                      <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(row.status)}`}>
                        {ITERATION_STATUS_LABEL[row.status]}
                      </span>
                    </td>
                    <td className={wrapCell}>{ruleBtn}</td>
                    <td className="whitespace-nowrap px-3 py-3 align-top sm:px-4">{releaseBlock}</td>
                    <td className={wrapCellNote}>{notesBlock}</td>
                    <td className={tableCellAction}>{actionsBlock}</td>
                  </tr>
                </tbody>
              );
            }

            return (
              <tbody
                key={row.id}
                id={`iter-tbody-${row.id}`}
                className="group/iter border-b border-line last:border-b-0"
              >
                {row.subRequirements.map((s, i) => (
                  <tr
                    key={s.id}
                    className={`transition-colors group-hover/iter:bg-gray-50 ${i > 0 ? 'border-t border-line' : ''}`}
                  >
                    {i === 0 && (
                      <td className={wrapCellTitle} rowSpan={n}>
                        {parentWithToggle(false)}
                      </td>
                    )}
                    {i === 0 && (
                      <td className={wrapCell} rowSpan={n}>
                        {versionBlock}
                      </td>
                    )}
                    {i === 0 && (
                      <td className={wrapCell} rowSpan={n}>
                        {priorityBlock}
                      </td>
                    )}
                    {/* 子需求列：只显示标题 + 优先级 badge */}
                    <td className={subRowCell}>
                      <div className="flex gap-1.5 [overflow-wrap:anywhere]">
                        <span className="shrink-0 tabular-nums font-semibold text-gray-500">{i + 1}.</span>
                        <div className="min-w-0 space-y-1">
                          <span className="text-gray-800">
                            {s.title.trim() ? s.title : (
                              <span className="font-normal text-gray-400">（未填写）</span>
                            )}
                          </span>
                          {s.priority && (
                            <div>
                              <PriorityBadge priority={s.priority} />
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* 产品列 */}
                    <td className={subRowCell}>
                      <div className="text-gray-700 [overflow-wrap:anywhere]">
                        {staffNameSimple(s.productOwnerIds ?? [], staffNameById)}
                      </div>
                    </td>
                    {/* 研发测试列 */}
                    <td className={subRowCell}>
                      <div className="text-gray-700 [overflow-wrap:anywhere]">
                        {staffName(s.assigneeIds, row.parentAssigneeIds, staffNameById)}
                      </div>
                    </td>
                    <td className={subRowCell}>
                      <div className="text-gray-700">{formatDateRange(s.dateStart, s.dateEnd)}</div>
                    </td>
                    <td className={`${subRowCell} whitespace-nowrap`}>
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(s.status)}`}
                        title={s.title.trim() || `子需求 ${i + 1}`}
                      >
                        {ITERATION_STATUS_LABEL[s.status]}
                      </span>
                    </td>
                    {i === 0 && (
                      <td className={wrapCell} rowSpan={n}>
                        {ruleBtn}
                      </td>
                    )}
                    {i === 0 && (
                      <td className="whitespace-nowrap px-3 py-3 align-top sm:px-4" rowSpan={n}>
                        {releaseBlock}
                      </td>
                    )}
                    {i === 0 && (
                      <td className={wrapCellNote} rowSpan={n}>
                        {notesBlock}
                      </td>
                    )}
                    {i === 0 && (
                      <td className={tableCellAction} rowSpan={n}>
                        {actionsBlock}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            );
          })}
        </table>
        <Pagination
          total={data.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>

      {/* 规则详情抽屉 */}
      <AnimatePresence>
        {ruleDrawer && (
          <RuleDetailDrawer data={ruleDrawer} onClose={() => setRuleDrawer(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

export type IterationStaffOption = { id: string; name: string; title: string };

function StaffMultiSelect({
  value,
  onChange,
  options,
  placeholder = '请选择产研人员（可多选）',
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  options: IterationStaffOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const labelFor = (id: string) => {
    const o = options.find((x) => x.id === id);
    if (!o) return id;
    return o.title ? `${o.name}（${o.title}）` : o.name;
  };
  const summary = value.length ? value.map(labelFor).join('、') : '';

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else onChange([...value, id]);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 py-2 text-left text-sm text-gray-800 outline-none focus:ring-2 focus:ring-accent/20 ${!summary ? 'text-gray-400' : ''}`}
      >
        <span className="min-w-0 flex-1 truncate">{summary || placeholder}</span>
        <span className="shrink-0 text-xs text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-52 overflow-auto rounded-lg border border-line bg-white py-1 shadow-lg">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-500">请先在「系统配置 → 产研人员管理」中添加人员。</p>
          ) : (
            options.map((o) => (
              <label
                key={o.id}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  className="accent-accent"
                  checked={value.includes(o.id)}
                  onChange={() => toggle(o.id)}
                />
                <span className="min-w-0 break-words">
                  {o.name}
                  {o.title && <span className="text-gray-400"> · {o.title}</span>}
                </span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function IterationRecordDrawerFields({
  form,
  onPatch,
  staffOptions,
}: {
  form: IterationRecordFormState;
  onPatch: (p: Partial<IterationRecordFormState>) => void;
  staffOptions: IterationStaffOption[];
}) {
  const [activeSubIndex, setActiveSubIndex] = useState(0);

  useEffect(() => {
    if (form.subRequirements.length === 0) {
      setActiveSubIndex(0);
      return;
    }
    setActiveSubIndex((ix) => Math.min(Math.max(0, ix), form.subRequirements.length - 1));
  }, [form.subRequirements.length]);

  const patchSub = (index: number, patch: Partial<(typeof form.subRequirements)[0]>) => {
    const next = form.subRequirements.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onPatch({ subRequirements: next });
  };

  const removeSub = (index: number) => {
    const next = form.subRequirements.filter((_, i) => i !== index);
    onPatch({ subRequirements: next });
    setActiveSubIndex((ix) => {
      if (next.length === 0) return 0;
      if (index < ix) return ix - 1;
      return Math.min(ix, next.length - 1);
    });
  };

  const addSubRequirement = () => {
    const next = [...form.subRequirements, newSubRequirementFormItem()];
    onPatch({ subRequirements: next });
    setActiveSubIndex(next.length - 1);
  };

  const activeSub = form.subRequirements[activeSubIndex];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
          父需求
          <span className="text-red-500">*</span>
        </label>
        <textarea
          className={`${inputClass} min-h-[100px] resize-y`}
          value={form.parentRequirement}
          onChange={(e) => onPatch({ parentRequirement: e.target.value })}
          placeholder="请输入父需求描述"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          版本号<span className="ml-1 font-normal text-gray-400">（选填）</span>
        </label>
        <input
          type="text"
          className={inputClass}
          value={form.version}
          onChange={(e) => onPatch({ version: e.target.value })}
          placeholder="如 v1.2.0"
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
          优先级
          <span className="text-red-500">*</span>
        </span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(ITERATION_PRIORITY_LABEL) as IterationPriority[]).map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-line p-2.5 text-xs transition-colors hover:bg-gray-50"
            >
              <input
                type="radio"
                name="iteration-record-priority"
                className="accent-accent"
                checked={form.priority === key}
                onChange={() => onPatch({ priority: key })}
              />
              <span>{ITERATION_PRIORITY_LABEL[key]}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-line bg-gray-50/40 p-4 space-y-3">
        <p className="text-sm font-medium text-gray-800">父需求级（无子需求或作补充）</p>
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">产品</label>
          <StaffMultiSelect
            value={form.parentProductOwnerIds}
            onChange={(ids) => onPatch({ parentProductOwnerIds: ids })}
            options={staffOptions}
            placeholder="请选择产品负责人（可多选）"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">研发测试</label>
          <StaffMultiSelect
            value={form.parentAssigneeIds}
            onChange={(ids) => onPatch({ parentAssigneeIds: ids })}
            options={staffOptions}
            placeholder="请选择研发测试人员（可多选）"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">开始结束</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              className={`${inputClass} flex-1`}
              value={form.parentDateStart}
              onChange={(e) => onPatch({ parentDateStart: e.target.value })}
            />
            <span className="shrink-0 text-xs text-gray-400">~</span>
            <input
              type="date"
              className={`${inputClass} flex-1`}
              value={form.parentDateEnd}
              onChange={(e) => onPatch({ parentDateEnd: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium text-gray-700">子需求（选填，横向切换）</span>
          <button
            type="button"
            onClick={addSubRequirement}
            className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <Plus className="h-3.5 w-3.5" />
            添加子需求
          </button>
        </div>
        {form.subRequirements.length === 0 ? (
          <p className="text-xs text-gray-500">暂无子需求；可直接使用上方「父需求级」负责人与日期。</p>
        ) : (
          <div className="rounded-xl border border-line bg-white shadow-sm">
            <div className="flex items-stretch gap-1 border-b border-line bg-gray-50/80 px-2 pt-2">
              <div className="flex min-h-[40px] min-w-0 flex-1 gap-0.5 overflow-x-auto pb-0">
                {form.subRequirements.map((sub, index) => {
                  const active = index === activeSubIndex;
                  const seq = `${index + 1}.`;
                  const rest = sub.title.trim()
                    ? sub.title.trim().length > 12
                      ? `${sub.title.trim().slice(0, 12)}…`
                      : sub.title.trim()
                    : '未填写';
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setActiveSubIndex(index)}
                      className={`relative shrink-0 rounded-t-md border border-b-0 px-3 py-2 text-left text-xs font-medium transition-colors ${
                        active
                          ? 'z-10 border-line bg-white text-gray-900 shadow-[0_1px_0_0_white]'
                          : 'border-transparent text-gray-600 hover:border-line/60 hover:bg-white/70'
                      }`}
                      title={sub.title.trim() ? `${seq} ${sub.title.trim()}` : `子需求 ${index + 1}`}
                    >
                      <span className="tabular-nums text-gray-500">{seq}</span> {rest}
                    </button>
                  );
                })}
              </div>
            </div>
            {activeSub && (
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-gray-500">
                    子需求 {activeSubIndex + 1}
                    <span className="ml-2 font-normal text-gray-400">
                      {ITERATION_STATUS_LABEL[activeSub.status]}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSub(activeSubIndex)}
                    className="inline-flex items-center gap-1 rounded-lg p-1.5 text-xs text-red-600 hover:bg-red-50"
                    aria-label="删除当前子需求"
                  >
                    <X className="h-3.5 w-3.5" />
                    删除
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">标题</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={activeSub.title}
                    onChange={(e) => patchSub(activeSubIndex, { title: e.target.value })}
                    placeholder="子需求简短标题"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">详细描述</label>
                  <RichTextEditor
                    value={activeSub.descriptionHtml}
                    onChange={(html) => patchSub(activeSubIndex, { descriptionHtml: html })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">
                    需求优先级
                    <span className="ml-1 font-normal text-gray-400">（选填，留空则继承父需求优先级）</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(['', ...Object.keys(ITERATION_PRIORITY_LABEL)] as Array<IterationPriority | ''>).map((key) => (
                      <label
                        key={key === '' ? '__none__' : key}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                          activeSub.priority === key
                            ? 'border-accent bg-accent/5 font-semibold text-accent'
                            : 'border-line hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`sub-priority-${activeSub.id}`}
                          className="sr-only"
                          checked={activeSub.priority === key}
                          onChange={() => patchSub(activeSubIndex, { priority: key })}
                        />
                        {key === '' ? '继承' : key}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">产品</label>
                  <StaffMultiSelect
                    value={activeSub.productOwnerIds}
                    onChange={(ids) => patchSub(activeSubIndex, { productOwnerIds: ids })}
                    options={staffOptions}
                    placeholder="请选择产品负责人（可多选）"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">研发测试</label>
                  <StaffMultiSelect
                    value={activeSub.assigneeIds}
                    onChange={(ids) => patchSub(activeSubIndex, { assigneeIds: ids })}
                    options={staffOptions}
                    placeholder="请选择研发测试人员（可多选）"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">开始结束</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className={`${inputClass} flex-1`}
                      value={activeSub.dateStart}
                      onChange={(e) => patchSub(activeSubIndex, { dateStart: e.target.value })}
                    />
                    <span className="shrink-0 text-xs text-gray-400">~</span>
                    <input
                      type="date"
                      className={`${inputClass} flex-1`}
                      value={activeSub.dateEnd}
                      onChange={(e) => patchSub(activeSubIndex, { dateEnd: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium text-gray-600">子需求状态</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(ITERATION_STATUS_LABEL) as IterationStatus[]).map((key) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-2 py-1.5 text-xs hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          name={`sub-status-${activeSub.id}`}
                          className="accent-accent"
                          checked={activeSub.status === key}
                          onChange={() => patchSub(activeSubIndex, { status: key })}
                        />
                        <span>{ITERATION_STATUS_LABEL[key]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">详细规则</label>
        <RichTextEditor value={form.detailRulesHtml} onChange={(html) => onPatch({ detailRulesHtml: html })} />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700">整体状态</span>
        <p className="text-[11px] text-gray-500">与列表「状态」「发布时间」一致；设为已发布时写入发布时间。</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(ITERATION_STATUS_LABEL) as IterationStatus[]).map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-line p-3 transition-colors hover:bg-gray-50"
            >
              <input
                type="radio"
                name="iteration-overall-status"
                className="accent-accent"
                checked={form.status === key}
                onChange={() => onPatch({ status: key })}
              />
              <span className="text-sm">{ITERATION_STATUS_LABEL[key]}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">其他说明</label>
        <RichTextEditor value={form.notesHtml} onChange={(html) => onPatch({ notesHtml: html })} />
      </div>
    </div>
  );
}
