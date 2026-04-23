import { useMemo, useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { IterationPriority, IterationRecordRow } from './iterationRecordModel';
import { ITERATION_PRIORITY_LABEL } from './iterationRecordModel';
import type { ProductLine } from './pageRuleCatalog';
import { PRODUCT_LINE_NAV_ORDER } from './pageRuleCatalog';

function fixUploadPaths(html: string): string {
  const base = import.meta.env.BASE_URL ?? '/';
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return html.replace(/src="\/uploads\//g, `src="${prefix}uploads/`);
}

const GANTT_TAB_LABEL: Record<ProductLine, string> = {
  youbao: '右豹迭代',
  youboom: 'youboom迭代',
  mentor: '导师系统迭代',
};

const PRIORITY_BAR_BG: Record<IterationPriority, string> = {
  SSS: '#ef4444',
  SS:  '#f97316',
  S:   '#eab308',
  A:   '#6366f1',
  B:   '#22c55e',
  C:   '#6b7280',
};

const PRIORITY_BAR_TEXT: Record<IterationPriority, string> = {
  SSS: '#ffffff',
  SS:  '#ffffff',
  S:   '#ffffff',
  A:   '#ffffff',
  B:   '#ffffff',
  C:   '#ffffff',
};

/** 无法测量列宽时的回退值（用于拖动按天取整） */
const DAY_COL_FALLBACK_PX = 26;

function timelineGridStyle(dayCount: number): CSSProperties {
  return {
    display: 'grid',
    width: '100%',
    gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))`,
  };
}

export type GanttBarRef = { type: 'sub'; subId: string } | { type: 'parent' };

export type GanttBarRow = {
  key: string;
  recordId: string;
  ref: GanttBarRef;
  subLabel: string;
  start: Date;
  end: Date;
  /** 研发测试人员 id 列表（日历条显示） */
  assigneeIds: string[];
  /** 本条 bar 实际使用的优先级：子需求有则用子，否则继承父需求 */
  barPriority: IterationPriority;
  /** 收起态汇总行，不可拖动 */
  dragDisabled?: boolean;
};

export type GanttGroup = {
  recordId: string;
  parentLabel: string;
  priority: IterationPriority;
  /** 父需求级产品负责人 id 列表（收起态展示用） */
  parentProductOwnerIds: string[];
  bars: GanttBarRow[];
};

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseYmdLocal(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((s || '').trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

function inclusiveDays(start: Date, end: Date): number {
  const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const b = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

function startOfMonth(y: number, m0: number): Date {
  return new Date(y, m0, 1);
}

function endOfMonth(y: number, m0: number): Date {
  return new Date(y, m0 + 1, 0);
}

function daysInMonth(y: number, m0: number): number {
  return endOfMonth(y, m0).getDate();
}

function eachDayInMonth(y: number, m0: number): Date[] {
  const out: Date[] = [];
  const end = endOfMonth(y, m0);
  const cur = startOfMonth(y, m0);
  while (cur <= end) {
    out.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function startOfWeekMon(d: Date): Date {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const wd = c.getDay();
  const delta = wd === 0 ? -6 : 1 - wd;
  c.setDate(c.getDate() + delta);
  return c;
}

function eachDayWeekFrom(weekStart: Date): Date[] {
  const out: Date[] = [];
  const cur = new Date(weekStart);
  for (let i = 0; i < 7; i++) {
    out.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

function isWeekend(d: Date): boolean {
  const w = d.getDay();
  return w === 0 || w === 6;
}

const WEEKDAY_SHORT = ['日', '一', '二', '三', '四', '五', '六'];

function priorityCircleToken(p: IterationPriority): { letter: string; className: string } {
  if (p === 'SSS') return { letter: 'SSS', className: 'bg-red-600 text-white ring-2 ring-red-200' };
  if (p === 'SS') return { letter: 'SS', className: 'bg-orange-500 text-white ring-2 ring-orange-200' };
  if (p === 'S') return { letter: 'S', className: 'bg-amber-500 text-white ring-2 ring-amber-200' };
  if (p === 'A') return { letter: 'A', className: 'bg-sky-500 text-white ring-2 ring-sky-200' };
  if (p === 'B') return { letter: 'B', className: 'bg-blue-400 text-white ring-2 ring-blue-100' };
  return { letter: 'C', className: 'bg-gray-400 text-white ring-2 ring-gray-200' };
}

function normalizeRange(a: string, b: string): { start: Date; end: Date } | null {
  const da = parseYmdLocal(a);
  const db = parseYmdLocal(b);
  if (da && db) {
    return da <= db ? { start: da, end: db } : { start: db, end: da };
  }
  if (da && !db) return { start: da, end: da };
  if (!da && db) return { start: db, end: db };
  return null;
}

function buildGanttGroups(rows: IterationRecordRow[], scope: ProductLine): GanttGroup[] {
  const groups: GanttGroup[] = [];
  for (const row of rows) {
    if (row.scope !== scope) continue;
    const parentLabel = [row.parentRequirement.trim(), row.version?.trim() ? row.version.trim() : '']
      .filter(Boolean)
      .join(' · ');
    const base = parentLabel || '（未命名父需求）';
    const bars: GanttBarRow[] = [];

    if (row.subRequirements.length > 0) {
      for (const sub of row.subRequirements) {
        const range = normalizeRange(sub.dateStart, sub.dateEnd);
        if (!range) continue;
        // 研发测试人员：子需求优先，回退父需求
        const devIds = sub.assigneeIds.filter(Boolean);
        bars.push({
          key: `${row.id}:${sub.id}`,
          recordId: row.id,
          ref: { type: 'sub', subId: sub.id },
          subLabel: sub.title.trim() || '（未命名子需求）',
          start: range.start,
          end: range.end,
          assigneeIds: devIds.length ? devIds : row.parentAssigneeIds.filter(Boolean),
          barPriority: sub.priority || row.priority,
        });
      }
      if (bars.length === 0) {
        const range = normalizeRange(row.parentDateStart, row.parentDateEnd);
        if (range) {
          bars.push({
            key: `${row.id}:parent-fallback`,
            recordId: row.id,
            ref: { type: 'parent' },
            subLabel: '（父需求周期）',
            start: range.start,
            end: range.end,
            assigneeIds: row.parentAssigneeIds.filter(Boolean),
            barPriority: row.priority,
          });
        }
      }
    } else {
      const range = normalizeRange(row.parentDateStart, row.parentDateEnd);
      if (range) {
        bars.push({
          key: `${row.id}:parent`,
          recordId: row.id,
          ref: { type: 'parent' },
          subLabel: '（父需求周期）',
          start: range.start,
          end: range.end,
          assigneeIds: row.parentAssigneeIds.filter(Boolean),
          barPriority: row.priority,
        });
      }
    }

    if (bars.length === 0) continue;
    groups.push({
      recordId: row.id,
      parentLabel: base,
      priority: row.priority,
      parentProductOwnerIds: (row.parentProductOwnerIds ?? []).filter(Boolean),
      bars,
    });
  }
  groups.sort((a, b) => {
    const amin = Math.min(...a.bars.map((x) => x.start.getTime()));
    const bmin = Math.min(...b.bars.map((x) => x.start.getTime()));
    return amin - bmin || a.parentLabel.localeCompare(b.parentLabel);
  });
  return groups;
}

function collapsedSummaryBar(g: GanttGroup): GanttBarRow {
  const starts = g.bars.map((b) => b.start.getTime());
  const ends = g.bars.map((b) => b.end.getTime());
  const start = new Date(Math.min(...starts));
  const end = new Date(Math.max(...ends));
  return {
    key: `${g.recordId}:collapsed`,
    recordId: g.recordId,
    ref: g.bars[0].ref,
    subLabel: `已收起 · ${g.bars.length} 条`,
    start,
    end,
    assigneeIds: [],
    barPriority: g.priority,
    dragDisabled: true,
  };
}

function barSegmentInViewport(
  barStart: Date,
  barEnd: Date,
  viewDays: Date[]
): { leftPct: number; widthPct: number } | null {
  if (!viewDays.length) return null;
  const vf = viewDays[0];
  const vl = viewDays[viewDays.length - 1];
  const visStart = barStart > vf ? barStart : vf;
  const visEnd = barEnd < vl ? barEnd : vl;
  if (visStart > visEnd) return null;
  const y0 = ymd(visStart);
  const y1 = ymd(visEnd);
  const i0 = viewDays.findIndex((d) => ymd(d) === y0);
  const i1 = viewDays.findIndex((d) => ymd(d) === y1);
  if (i0 < 0 || i1 < 0) return null;
  const L = viewDays.length;
  return { leftPct: (i0 / L) * 100, widthPct: ((i1 - i0 + 1) / L) * 100 };
}

function yearOptions(center: number): number[] {
  const out: number[] = [];
  for (let y = center - 3; y <= center + 5; y++) out.push(y);
  return out;
}

type DragMode = 'move' | 'resize-start' | 'resize-end';

type DragState = {
  pointerId: number;
  key: string;
  recordId: string;
  ref: GanttBarRef;
  origStart: Date;
  origEnd: Date;
  anchorClientX: number;
  dayWidthPx: number;
  mode: DragMode;
};

function PriorityCell({ priority }: { priority: IterationPriority }) {
  const pri = priorityCircleToken(priority);
  return (
    <span
      className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${pri.className}`}
      title={ITERATION_PRIORITY_LABEL[priority]}
    >
      {pri.letter}
    </span>
  );
}

function TimelineBar({
  bar,
  names,
  viewDays,
  previewStart,
  previewEnd,
  onDragStart,
}: {
  bar: GanttBarRow;
  names: string;
  viewDays: Date[];
  previewStart: Date | null;
  previewEnd: Date | null;
  onDragStart: (e: React.PointerEvent, bar: GanttBarRow, mode: DragMode) => void;
}) {
  const s = previewStart ?? bar.start;
  const eEnd = previewEnd ?? bar.end;
  const seg = barSegmentInViewport(s, eEnd, viewDays);
  const days = inclusiveDays(s, eEnd);
  const priShort = ITERATION_PRIORITY_LABEL[bar.barPriority].split('·')[0]?.trim() ?? bar.barPriority;
  const barBg = PRIORITY_BAR_BG[bar.barPriority];
  const barText = PRIORITY_BAR_TEXT[bar.barPriority];

  const grid = timelineGridStyle(viewDays.length);

  const handlePointerDown = (ev: React.PointerEvent, mode: DragMode) => {
    if (bar.dragDisabled) return;
    ev.stopPropagation();
    onDragStart(ev, bar, mode);
  };

  return (
    <div className="relative h-[52px] w-full min-w-0 overflow-hidden bg-white">
      <div className="absolute inset-0 min-w-0" style={grid}>
        {viewDays.map((d) => (
          <div
            key={`bg-${bar.key}-${ymd(d)}`}
            className={`min-w-0 border-r border-gray-100 ${isWeekend(d) ? 'bg-gray-100/70' : ''}`}
          />
        ))}
      </div>
      {seg ? (
        <div
          className={`group absolute top-1/2 h-7 -translate-y-1/2 rounded-md text-[10px] font-medium shadow-sm select-none ${
            bar.dragDisabled ? 'opacity-75' : 'hover:brightness-110'
          }`}
          style={{
            left: `${seg.leftPct}%`,
            width: `${seg.widthPct}%`,
            minWidth: 8,
            touchAction: 'none',
            backgroundColor: barBg,
            color: barText,
          }}
          title={
            bar.dragDisabled
              ? `${ymd(bar.start)} ~ ${ymd(bar.end)}`
              : `拖动中间移动 · 拖动两端调整日期\n${ymd(bar.start)} ~ ${ymd(bar.end)}`
          }
        >
          {/* 左侧拉伸手柄 */}
          {!bar.dragDisabled && (
            <div
              onPointerDown={(ev) => handlePointerDown(ev, 'resize-start')}
              className="absolute left-0 top-0 h-full w-2 cursor-ew-resize rounded-l-md opacity-0 transition-opacity group-hover:opacity-100"
              style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
              title={`拖动调整开始日期（当前：${ymd(bar.start)}）`}
            />
          )}

          {/* 中间移动区域 */}
          <div
            tabIndex={bar.dragDisabled ? -1 : 0}
            onPointerDown={(ev) => handlePointerDown(ev, 'move')}
            className={`flex h-full items-center justify-center gap-1 truncate px-3 ${
              bar.dragDisabled ? '' : 'cursor-grab active:cursor-grabbing'
            }`}
          >
            <span className="truncate">{names}</span>
            <span className="shrink-0 opacity-90">{days}天</span>
            <span
              className="shrink-0 rounded px-0.5 text-[9px]"
              style={{ backgroundColor: 'rgba(0,0,0,0.15)', color: barText }}
            >
              {priShort}
            </span>
          </div>

          {/* 右侧拉伸手柄 */}
          {!bar.dragDisabled && (
            <div
              onPointerDown={(ev) => handlePointerDown(ev, 'resize-end')}
              className="absolute right-0 top-0 h-full w-2 cursor-ew-resize rounded-r-md opacity-0 transition-opacity group-hover:opacity-100"
              style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
              title={`拖动调整结束日期（当前：${ymd(bar.end)}）`}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}


export function GanttMapPage({
  iterationRows,
  staffNameById,
  productLine,
  onProductLineChange,
  onBarRangeCommit,
}: {
  iterationRows: IterationRecordRow[];
  staffNameById: Map<string, string>;
  productLine: ProductLine;
  onProductLineChange: (line: ProductLine) => void;
  onBarRangeCommit: (recordId: string, ref: GanttBarRef, startYmd: string, endYmd: string) => void;
}) {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  /** 锚定当前所看的年、月、日（用于月历整月与周视图；默认自然日「今天」所在月） */
  const [cursor, setCursor] = useState(() => new Date());
  const [collapsed, setCollapsed] = useState<Record<string, true>>({});

  const [drag, setDrag] = useState<DragState | null>(null);
  const [dragPreview, setDragPreview] = useState<{ key: string; start: Date; end: Date } | null>(null);

  /** all-subs 模式当前激活的子需求 tab 下标 */
  const [allSubsActiveIdx, setAllSubsActiveIdx] = useState(0);

  /** 抽屉数据：点击父需求或子需求列时弹出 */
  type DetailModal =
    | { kind: 'parent'; parentTitle: string; detailHtml: string }
    | { kind: 'sub'; parentTitle: string; subTitle: string; detailHtml: string }
    /** 折叠态点子需求 → 显示所有子需求的多 tab 抽屉，defaultSubIdx 为默认激活 tab */
    | { kind: 'all-subs'; parentTitle: string; subs: { id: string; title: string; descriptionHtml: string }[]; defaultSubIdx: number };
  const [detailModal, setDetailModal] = useState<DetailModal | null>(null);
  /** 灯箱：放大查看图片 */
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  /** 富文本内容区 ref，用于绑定图片点击事件 */
  const richContentRef = useRef<HTMLDivElement>(null);
  /** 抽屉宽度（px），默认 420，可拖拽调整 */
  const DRAWER_MIN = 280;
  const DRAWER_MAX = 860;
  const DRAWER_DEFAULT = 420;
  const [drawerWidth, setDrawerWidth] = useState(DRAWER_DEFAULT);
  const drawerResizing = useRef(false);
  const drawerResizeStartX = useRef(0);
  const drawerResizeStartW = useRef(0);

  const onDrawerResizeStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    drawerResizing.current = true;
    drawerResizeStartX.current = e.clientX;
    drawerResizeStartW.current = drawerWidth;
  }, [drawerWidth]);

  const onDrawerResizeMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawerResizing.current) return;
    // 抽屉从右侧滑出，向左拖动手柄 = 加宽
    const delta = drawerResizeStartX.current - e.clientX;
    const newW = Math.max(DRAWER_MIN, Math.min(DRAWER_MAX, drawerResizeStartW.current + delta));
    setDrawerWidth(Math.round(newW));
  }, []);

  const onDrawerResizeEnd = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    drawerResizing.current = false;
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
  }, []);

  /** 以 recordId 快速查找行数据 */
  const rowById = useMemo(() => {
    const map = new Map<string, IterationRecordRow>();
    for (const row of iterationRows) map.set(row.id, row);
    return map;
  }, [iterationRows]);

  /** 弹窗内容渲染完成后，给所有图片绑定点击放大 */
  useEffect(() => {
    if (!detailModal) return;
    // 等 DOM 渲染完毕再绑定
    const timer = setTimeout(() => {
      const container = richContentRef.current;
      if (!container) return;
      const imgs = container.querySelectorAll<HTMLImageElement>('img');
      imgs.forEach((img) => {
        img.style.cursor = 'zoom-in';
        img.title = '点击放大查看';
      });
      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG') {
          const src = (target as HTMLImageElement).src;
          if (src) setLightboxSrc(src);
        }
      };
      container.addEventListener('click', handleClick);
      return () => container.removeEventListener('click', handleClick);
    }, 50);
    return () => clearTimeout(timer);
  }, [detailModal, allSubsActiveIdx]);

  const openDetailModal = useCallback((recordId: string, subId?: string, isCollapsed?: boolean) => {
    const row = rowById.get(recordId);
    if (!row) return;
    if (subId) {
      const subIdx = row.subRequirements.findIndex((s) => s.id === subId);
      if (isCollapsed && row.subRequirements.length > 0) {
        const defaultIdx = Math.max(0, subIdx);
        setAllSubsActiveIdx(defaultIdx);
        setDetailModal({
          kind: 'all-subs',
          parentTitle: row.parentRequirement,
          subs: row.subRequirements.map((s) => ({
            id: s.id,
            title: s.title.trim() || '（未命名子需求）',
            descriptionHtml: s.descriptionHtml || '<p><br></p>',
          })),
          defaultSubIdx: defaultIdx,
        });
      } else {
        const sub = row.subRequirements[Math.max(0, subIdx)];
        setDetailModal({
          kind: 'sub',
          parentTitle: row.parentRequirement,
          subTitle: sub?.title.trim() || '（未命名子需求）',
          detailHtml: sub?.descriptionHtml || '<p><br></p>',
        });
      }
    } else {
      setDetailModal({
        kind: 'parent',
        parentTitle: row.parentRequirement,
        detailHtml: row.detailRulesHtml,
      });
    }
  }, [rowById]);

  const groups = useMemo(() => buildGanttGroups(iterationRows, productLine), [iterationRows, productLine]);

  const viewDays = useMemo(() => {
    if (viewMode === 'month') {
      return eachDayInMonth(cursor.getFullYear(), cursor.getMonth());
    }
    return eachDayWeekFrom(startOfWeekMon(cursor));
  }, [viewMode, cursor]);

  const headerTitle =
    viewMode === 'month'
      ? `${cursor.getFullYear()}年${cursor.getMonth() + 1}月`
      : `${ymd(viewDays[0])} ~ ${ymd(viewDays[6])}`;

  const goToday = () => setCursor(new Date());

  const shiftPrev = () => {
    setCursor((c) => {
      const n = new Date(c);
      if (viewMode === 'month') n.setMonth(n.getMonth() - 1);
      else n.setDate(n.getDate() - 7);
      return n;
    });
  };

  const shiftNext = () => {
    setCursor((c) => {
      const n = new Date(c);
      if (viewMode === 'month') n.setMonth(n.getMonth() + 1);
      else n.setDate(n.getDate() + 7);
      return n;
    });
  };

  const setYear = (y: number) => {
    setCursor((c) => {
      const dim = daysInMonth(y, c.getMonth());
      const d = Math.min(c.getDate(), dim);
      return new Date(y, c.getMonth(), d);
    });
  };

  const setMonth = (m1: number) => {
    setCursor((c) => {
      const dim = daysInMonth(c.getFullYear(), m1 - 1);
      const d = Math.min(c.getDate(), dim);
      return new Date(c.getFullYear(), m1 - 1, d);
    });
  };

  const setDay = (day: number) => {
    setCursor((c) => {
      const dim = daysInMonth(c.getFullYear(), c.getMonth());
      const d = Math.min(Math.max(1, day), dim);
      return new Date(c.getFullYear(), c.getMonth(), d);
    });
  };

  const onDragStart = useCallback(
    (e: React.PointerEvent, row: GanttBarRow, mode: DragMode) => {
      if (e.button !== 0 || row.dragDisabled) return;
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      const cell = (e.currentTarget as HTMLElement).closest('td');
      const cw = cell?.getBoundingClientRect().width ?? DAY_COL_FALLBACK_PX * viewDays.length;
      const dayWidthPx = Math.max(6, cw / Math.max(1, viewDays.length));
      setDrag({
        pointerId: e.pointerId,
        key: row.key,
        recordId: row.recordId,
        ref: row.ref,
        origStart: new Date(row.start),
        origEnd: new Date(row.end),
        anchorClientX: e.clientX,
        dayWidthPx,
        mode,
      });
      setDragPreview({ key: row.key, start: row.start, end: row.end });
    },
    [viewDays.length]
  );

  useEffect(() => {
    if (!drag) return;

    const computeRange = (clientX: number): { ns: Date; ne: Date } => {
      const delta = Math.round((clientX - drag.anchorClientX) / drag.dayWidthPx);
      if (drag.mode === 'move') {
        return { ns: addDays(drag.origStart, delta), ne: addDays(drag.origEnd, delta) };
      }
      if (drag.mode === 'resize-start') {
        const ns = addDays(drag.origStart, delta);
        // 开始日期最多推到结束日期同一天
        return { ns: ns <= drag.origEnd ? ns : drag.origEnd, ne: drag.origEnd };
      }
      // resize-end
      const ne = addDays(drag.origEnd, delta);
      // 结束日期最多回退到开始日期同一天
      return { ns: drag.origStart, ne: ne >= drag.origStart ? ne : drag.origStart };
    };

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== drag.pointerId) return;
      const { ns, ne } = computeRange(ev.clientX);
      setDragPreview({ key: drag.key, start: ns, end: ne });
    };
    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== drag.pointerId) return;
      const { ns, ne } = computeRange(ev.clientX);
      const changed = ymd(ns) !== ymd(drag.origStart) || ymd(ne) !== ymd(drag.origEnd);
      if (changed) {
        onBarRangeCommit(drag.recordId, drag.ref, ymd(ns), ymd(ne));
      }
      setDrag(null);
      setDragPreview(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [drag, onBarRangeCommit]);

  const toggleCollapsed = (recordId: string) => {
    setCollapsed((s) => {
      const next = { ...s };
      if (next[recordId]) delete next[recordId];
      else next[recordId] = true;
      return next;
    });
  };

  const monthDaySelectOptions = useMemo(() => {
    const dim = daysInMonth(cursor.getFullYear(), cursor.getMonth());
    return Array.from({ length: dim }, (_, i) => i + 1);
  }, [cursor]);

  return (
    <div className="w-full min-w-0 max-w-full p-4 sm:p-5">
      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl bg-gray-200/50 p-1 w-fit">
        {PRODUCT_LINE_NAV_ORDER.map((lineId) => {
          const isActive = productLine === lineId;
          return (
            <button
              key={lineId}
              type="button"
              onClick={() => onProductLineChange(lineId)}
              className={`
                relative flex cursor-pointer items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all
                ${isActive ? 'text-accent' : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="ganttProductLineTab"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{GANTT_TAB_LABEL[lineId]}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-xs font-medium text-gray-600">定位日历</span>
        <select
          className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm shadow-sm"
          value={cursor.getFullYear()}
          onChange={(e) => setYear(Number(e.target.value))}
          aria-label="年"
        >
          {yearOptions(cursor.getFullYear()).map((y) => (
            <option key={y} value={y}>
              {y}年
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm shadow-sm"
          value={cursor.getMonth() + 1}
          onChange={(e) => setMonth(Number(e.target.value))}
          aria-label="月"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {m}月
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm shadow-sm"
          value={cursor.getDate()}
          onChange={(e) => setDay(Number(e.target.value))}
          aria-label="日"
        >
          {monthDaySelectOptions.map((d) => (
            <option key={d} value={d}>
              {d}日
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-500">月视图展示该月全部日期；周视图展示含所选日的自然周。</span>
      </div>

      <div className="min-w-0 overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
        <table className="w-full min-w-0 border-collapse text-sm" style={{ tableLayout: 'auto' }}>
          <colgroup>
            <col style={{ width: 36 }} />
            <col style={{ width: '15%', minWidth: 80 }} />
            <col style={{ width: '17%', minWidth: 80 }} />
            <col style={{ minWidth: 56 }} />
            <col style={{ width: 56 }} />
            <col />
          </colgroup>
          <thead>
            <tr className="border-b border-line bg-gray-50/90">
              <th colSpan={6} className="px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-ink">{headerTitle}</span>
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    <div className="mr-1 flex rounded-lg bg-gray-200/60 p-0.5">
                      <button
                        type="button"
                        onClick={() => setViewMode('week')}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium ${viewMode === 'week' ? 'bg-white text-accent shadow-sm' : 'text-gray-600'}`}
                      >
                        周
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('month')}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium ${viewMode === 'month' ? 'bg-white text-accent shadow-sm' : 'text-gray-600'}`}
                      >
                        月
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={shiftPrev}
                      className="rounded-lg p-1.5 text-gray-600 hover:bg-white"
                      aria-label="上一段"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={goToday}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-accent hover:bg-white"
                    >
                      今天
                    </button>
                    <button
                      type="button"
                      onClick={shiftNext}
                      className="rounded-lg p-1.5 text-gray-600 hover:bg-white"
                      aria-label="下一段"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </th>
            </tr>
            <tr className="border-b border-line bg-gray-50/50 text-xs text-gray-500">
              <th className="w-9 border-r border-line px-1 py-2 font-medium text-gray-700">#</th>
              <th className="min-w-[80px] border-r border-line px-2 py-2 text-left font-medium text-gray-700">
                父需求
              </th>
              <th className="min-w-[80px] border-r border-line px-2 py-2 text-left font-medium text-gray-700">
                子需求
              </th>
              <th className="min-w-[60px] border-r border-line px-2 py-2 text-left font-medium text-gray-700">
                产品
              </th>
              <th className="w-14 border-r border-line px-1 py-2 font-medium text-gray-700">优先级</th>
              <th className="min-w-0 p-0 text-left font-medium text-gray-700">
                <div className="border-b border-line" style={timelineGridStyle(viewDays.length)}>
                  {viewDays.map((d) => {
                    const weekend = isWeekend(d);
                    return (
                      <div
                        key={ymd(d)}
                        className={`min-w-0 border-r border-line py-1.5 text-center leading-tight ${
                          weekend ? 'bg-gray-100/80' : ''
                        }`}
                      >
                        <div className={`text-[11px] font-medium ${weekend ? 'text-gray-400' : 'text-gray-600'}`}>
                          {d.getDate()}
                        </div>
                        <div className={`text-[9px] ${weekend ? 'text-gray-400 font-semibold' : 'text-gray-400'}`}>
                          {WEEKDAY_SHORT[d.getDay()]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-sm text-gray-500">
                  当前板块暂无带时间线的迭代记录；请在对应「迭代记录」中为子需求或父需求填写起止日期。
                </td>
              </tr>
            ) : (
              groups.map((g, groupIdx) => {
                const isCollapsed = !!collapsed[g.recordId];
                const displayBars = isCollapsed ? [collapsedSummaryBar(g)] : g.bars;
                const rowSpan = displayBars.length;
                const showToggle = g.bars.length > 1;

                // 父需求产品人员（收起态使用父需求级，展开态各行显示各自）
                const parentProductNames = g.parentProductOwnerIds.length > 0
                  ? g.parentProductOwnerIds.map((id) => staffNameById.get(id) ?? id).join('、')
                  : '—';

                return displayBars.map((bar, ri) => {
                  // 日历条显示研发测试人员
                  const names =
                    bar.assigneeIds.length > 0
                      ? bar.assigneeIds.map((id) => staffNameById.get(id) ?? id).join('、')
                      : '未指定';
                  const preview =
                    dragPreview && dragPreview.key === bar.key
                      ? { start: dragPreview.start, end: dragPreview.end }
                      : { start: null as Date | null, end: null as Date | null };

                  return (
                    <tr
                      key={`${g.recordId}-${bar.key}-${ri}`}
                      className="border-b border-line last:border-b-0 hover:bg-gray-50/40"
                    >
                      {ri === 0 ? (
                        <td
                          rowSpan={rowSpan}
                          className="border-r border-line px-1 py-3 text-center align-top text-xs text-gray-500"
                        >
                          {groupIdx + 1}
                        </td>
                      ) : null}
                      {ri === 0 ? (
                        <td
                          rowSpan={rowSpan}
                          className="border-r border-line px-2 py-3 align-top text-ink [overflow-wrap:anywhere]"
                        >
                          <div className="flex items-start gap-1">
                            {showToggle ? (
                              <button
                                type="button"
                                onClick={() => toggleCollapsed(g.recordId)}
                                className="mt-0.5 shrink-0 rounded p-0.5 text-gray-500 hover:bg-gray-100 hover:text-accent"
                                title={isCollapsed ? '展开' : '收起'}
                                aria-expanded={!isCollapsed}
                              >
                                {isCollapsed ? (
                                  <ChevronRight className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                            ) : (
                              <span className="mt-0.5 w-5 shrink-0" />
                            )}
                            <button
                              type="button"
                              onClick={() => openDetailModal(g.recordId)}
                              className="group/parent relative min-w-0 text-left text-ink [overflow-wrap:anywhere] hover:text-accent"
                              title="点击可查看需求详情"
                            >
                              <span className="underline-offset-2 group-hover/parent:underline">
                                {g.parentLabel}
                              </span>
                              <span className="pointer-events-none absolute -top-7 left-0 z-30 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity group-hover/parent:opacity-100">
                                点击可查看需求详情
                              </span>
                            </button>
                          </div>
                        </td>
                      ) : null}
                      <td className="border-r border-line px-2 py-3 align-top text-gray-800 [overflow-wrap:anywhere]">
                        {bar.ref.type === 'sub' ? (() => {
                          const subRef = bar.ref as { type: 'sub'; subId: string };
                          return (
                            <button
                              type="button"
                              onClick={() => openDetailModal(bar.recordId, subRef.subId, isCollapsed)}
                              className="group/sub relative min-w-0 text-left text-gray-800 [overflow-wrap:anywhere] hover:text-accent"
                              title={isCollapsed ? '点击查看所有子需求详情' : '点击可查看需求详情'}
                            >
                              <span className="underline-offset-2 group-hover/sub:underline">
                                {bar.subLabel}
                              </span>
                              <span className="pointer-events-none absolute -top-7 left-0 z-30 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity group-hover/sub:opacity-100">
                                {isCollapsed ? '点击查看所有子需求详情' : '点击可查看需求详情'}
                              </span>
                            </button>
                          );
                        })() : (
                          <span className="text-gray-400">{bar.subLabel}</span>
                        )}
                      </td>
                      {/* 产品列：整组共用父需求产品人员，宽度随内容自适应 */}
                      {ri === 0 ? (
                        <td
                          rowSpan={rowSpan}
                          className="border-r border-line px-2 py-3 align-top text-xs text-gray-700 break-words"
                          style={{ width: 1, whiteSpace: 'nowrap' }}
                        >
                          {parentProductNames !== '—' ? (
                            <span className="inline-flex flex-wrap gap-x-1 gap-y-0.5">
                              {parentProductNames.split('、').map((name, ni) => (
                                <span key={ni} className="inline-block rounded bg-purple-50 px-1.5 py-0.5 text-purple-700 ring-1 ring-purple-100">
                                  {name}
                                </span>
                              ))}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      ) : null}
                      {ri === 0 ? (
                        <td
                          rowSpan={rowSpan}
                          className="border-r border-line px-1 py-2 align-top"
                        >
                          <div className="flex justify-center">
                            <PriorityCell priority={g.priority} />
                          </div>
                        </td>
                      ) : null}
                      <td className="min-w-0 p-0 align-top">
                        <TimelineBar
                          bar={bar}
                          names={names}
                          viewDays={viewDays}
                          previewStart={preview.start}
                          previewEnd={preview.end}
                          onDragStart={onDragStart}
                        />
                      </td>
                    </tr>
                  );
                });
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 需求详情抽屉 */}
      <AnimatePresence>
        {detailModal && (
          <>
            {/* 半透明遮罩，点击关闭 */}
            <motion.div
              key="gantt-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-50 bg-black/25"
              onClick={() => setDetailModal(null)}
            />

            {/* 抽屉面板 */}
            <motion.div
              key="gantt-drawer-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.9 }}
              className="fixed right-0 top-0 z-50 flex h-full flex-col border-l border-line bg-white shadow-2xl"
              style={{ width: drawerWidth }}
            >
              {/* 左侧拖拽调宽手柄 */}
              <div
                onPointerDown={onDrawerResizeStart}
                onPointerMove={onDrawerResizeMove}
                onPointerUp={onDrawerResizeEnd}
                onPointerCancel={onDrawerResizeEnd}
                className="group absolute left-0 top-0 h-full w-1 cursor-ew-resize touch-none select-none hover:w-1.5 hover:bg-accent/30 active:bg-accent/50"
                title="拖动调整抽屉宽度"
              >
                {/* 中央拖拽指示点 */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-1 w-1 rounded-full bg-accent/60" />
                  ))}
                </div>
              </div>

              {/* 抽屉头部 */}
              <div className="shrink-0 border-b border-line px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {detailModal.kind === 'sub' ? (
                      <>
                        <p className="flex flex-wrap items-center gap-1 text-[11px] text-gray-400">
                          <span className="font-medium">子需求详情</span>
                          <span className="text-gray-300">/</span>
                          <span className="truncate">{detailModal.parentTitle}</span>
                        </p>
                        <h3 className="mt-1 break-words text-base font-semibold text-ink [overflow-wrap:anywhere]">
                          {detailModal.subTitle}
                        </h3>
                      </>
                    ) : detailModal.kind === 'all-subs' ? (
                      <>
                        <p className="text-[11px] font-medium text-gray-400">子需求详情</p>
                        <h3 className="mt-1 break-words text-base font-semibold text-ink [overflow-wrap:anywhere]">
                          {detailModal.parentTitle || '（无标题）'}
                        </h3>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] font-medium text-gray-400">父需求详情</p>
                        <h3 className="mt-1 break-words text-base font-semibold text-ink [overflow-wrap:anywhere]">
                          {detailModal.parentTitle || '（无标题）'}
                        </h3>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailModal(null)}
                    className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    aria-label="关闭抽屉"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* all-subs 模式的 Tab 栏 */}
                {detailModal.kind === 'all-subs' && detailModal.subs.length > 1 && (
                  <div className="mt-3 flex gap-0.5 overflow-x-auto">
                    {detailModal.subs.map((sub, i) => {
                      const isActive = i === allSubsActiveIdx;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setAllSubsActiveIdx(i)}
                          className={`shrink-0 rounded-t-md border border-b-0 px-3 py-1.5 text-xs font-medium transition-colors ${
                            isActive
                              ? 'border-line bg-white text-accent shadow-[0_1px_0_0_white]'
                              : 'border-transparent text-gray-500 hover:border-line/60 hover:bg-gray-50'
                          }`}
                          title={sub.title}
                        >
                          子需求{i + 1}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 抽屉内容区（所有模式共用） */}
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                {detailModal.kind === 'all-subs' ? (() => {
                  const sub = detailModal.subs[allSubsActiveIdx];
                  const html = sub?.descriptionHtml ?? '';
                  const hasContent = html.replace(/<[^>]+>/g, '').trim();
                  return (
                    <>
                      {sub?.title && (
                        <p className="mb-3 text-xs font-medium text-gray-500">{sub.title}</p>
                      )}
                      {hasContent ? (
                        <div
                          ref={richContentRef}
                          className="prose prose-sm max-w-none text-gray-700 [&_p]:my-1.5 [&_ul]:my-1 [&_ul]:pl-6 [&_ol]:my-1 [&_ol]:pl-6 [&_li]:my-0.5 [&_ul>li]:list-disc [&_ol>li]:list-decimal [&_img]:cursor-zoom-in [&_img]:rounded-md"
                          dangerouslySetInnerHTML={{ __html: fixUploadPaths(html) }}
                        />
                      ) : (
                        <p className="text-sm text-gray-400">该子需求暂无详细描述。</p>
                      )}
                    </>
                  );
                })() : (
                  detailModal.detailHtml && detailModal.detailHtml.replace(/<[^>]+>/g, '').trim() ? (
                    <div
                      ref={richContentRef}
                      className="prose prose-sm max-w-none text-gray-700 [&_p]:my-1.5 [&_ul]:my-1 [&_ul]:pl-6 [&_ol]:my-1 [&_ol]:pl-6 [&_li]:my-0.5 [&_ul>li]:list-disc [&_ol>li]:list-decimal [&_img]:cursor-zoom-in [&_img]:rounded-md"
                          dangerouslySetInnerHTML={{ __html: fixUploadPaths(detailModal.detailHtml) }}
                    />
                  ) : (
                    <p className="text-sm text-gray-400">
                      {detailModal.kind === 'sub' ? '该子需求暂无详细描述。' : '暂无详细规则说明。'}
                    </p>
                  )
                )}
              </div>

              {/* 底部宽度提示 */}
              <div className="shrink-0 border-t border-line px-5 py-2.5 text-right">
                <span className="text-[11px] text-gray-300">← 拖动左侧边缘调整宽度 · {drawerWidth}px</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 图片灯箱 */}
      <AnimatePresence>
        {lightboxSrc && (
          <>
            <motion.div
              key="lightbox-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-black/85 backdrop-blur-sm"
              onClick={() => setLightboxSrc(null)}
            >
              <motion.img
                key="lightbox-img"
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
                className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                aria-label="关闭图片预览"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
