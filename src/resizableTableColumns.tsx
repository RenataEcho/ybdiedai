import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

const LS_PREFIX = 'ybdiedai-table-col-widths-';

function normalizeParsedWidths(parsed: unknown, defaults: number[], minW: number): number[] | null {
  if (!Array.isArray(parsed) || parsed.length !== defaults.length) return null;
  return parsed.map((x, i) => {
    const n = typeof x === 'number' && Number.isFinite(x) ? Math.round(x) : defaults[i];
    return Math.max(minW, n);
  });
}

function loadWidths(storageKey: string, defaults: number[], minW: number): number[] {
  if (typeof window === 'undefined') return [...defaults];
  try {
    const raw = localStorage.getItem(LS_PREFIX + storageKey);
    if (!raw) return [...defaults];
    const n = normalizeParsedWidths(JSON.parse(raw) as unknown, defaults, minW);
    return n ?? [...defaults];
  } catch {
    return [...defaults];
  }
}

/**
 * 数据表列宽拖动（localStorage 按 storageKey 持久化）。
 * 在 <table> 内首行子元素放置 colGroup，每个表头 th 加 `relative`，并渲染 `renderResizeHandle(i)`。
 * `defaultWidths` 须为稳定引用（模块级常量或 useMemo），避免每次 render 新建数组。
 */
export function useResizableTableColumns(
  storageKey: string,
  defaultWidths: number[],
  options?: { minWidth?: number }
) {
  const minW = options?.minWidth ?? 44;

  const [widths, setWidths] = useState<number[]>(() => loadWidths(storageKey, defaultWidths, minW));
  const latestWidthsRef = useRef(widths);
  latestWidthsRef.current = widths;

  const dragRef = useRef<{ index: number; startX: number; startW: number } | null>(null);

  const persist = useCallback(
    (w: number[]) => {
      try {
        localStorage.setItem(LS_PREFIX + storageKey, JSON.stringify(w));
      } catch {
        /* ignore */
      }
    },
    [storageKey]
  );

  const onResizePointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const el = e.currentTarget;
      const colIndex = Number(el.dataset.colResize);
      if (!Number.isFinite(colIndex) || colIndex < 0 || colIndex >= latestWidthsRef.current.length) return;
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = {
        index: colIndex,
        startX: e.clientX,
        startW: latestWidthsRef.current[colIndex] ?? minW,
      };
      el.setPointerCapture(e.pointerId);
    },
    [minW]
  );

  const onResizePointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const d = dragRef.current;
      if (!d) return;
      const nw = Math.max(minW, Math.round(d.startW + (e.clientX - d.startX)));
      setWidths((prev) => {
        if (prev[d.index] === nw) return prev;
        const next = [...prev];
        next[d.index] = nw;
        latestWidthsRef.current = next;
        return next;
      });
    },
    [minW]
  );

  const onResizePointerUp = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (dragRef.current) {
        dragRef.current = null;
        persist([...latestWidthsRef.current]);
      }
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [persist]
  );

  const colGroup = (
    <colgroup>
      {widths.map((w, i) => (
        <col key={i} style={{ width: w }} />
      ))}
    </colgroup>
  );

  const tableMinWidth = widths.reduce((a, b) => a + b, 0);

  const renderResizeHandle = useCallback(
    (colIndex: number) => (
      <div
        key={`col-resize-${colIndex}`}
        role="separator"
        aria-orientation="vertical"
        aria-label="拖动调整列宽"
        title="拖动调整列宽"
        data-col-resize={colIndex}
        className="absolute right-0 top-0 z-[35] h-full w-2 cursor-col-resize touch-none select-none border-r border-transparent hover:border-accent/35 hover:bg-accent/10"
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
        onPointerCancel={onResizePointerUp}
      />
    ),
    [onResizePointerDown, onResizePointerMove, onResizePointerUp]
  );

  return { colGroup, renderResizeHandle, tableMinWidth, widths };
}

// ---------------------------------------------------------------------------
// ColumnTipHeader – 带悬浮字段说明的表头单元格
// ---------------------------------------------------------------------------

const COLUMN_TIP_MAX_PX = 400;

/** 遍历所有可滚动祖先，统一监听 scroll 以便实时校准 tooltip 位置 */
function bindScrollableAncestors(anchor: HTMLElement | null, handler: () => void): () => void {
  if (!anchor) return () => {};
  const nodes = new Set<EventTarget>([window]);
  let el: HTMLElement | null = anchor.parentElement;
  while (el) {
    const { overflow, overflowX, overflowY } = window.getComputedStyle(el);
    if (/(auto|scroll|overlay)/.test(`${overflow}${overflowX}${overflowY}`)) nodes.add(el);
    el = el.parentElement;
  }
  const opts: AddEventListenerOptions = { capture: true, passive: true };
  nodes.forEach((n) => n.addEventListener('scroll', handler as EventListener, opts));
  return () => nodes.forEach((n) => n.removeEventListener('scroll', handler as EventListener, opts));
}

/**
 * 表头 `<th>` 包装组件，当传入 `tip` 时在列名旁显示 HelpCircle 图标，
 * 鼠标悬停即弹出字段说明层（portal 渲染，fixed 定位，不受表格滚动影响）。
 */
export function ColumnTipHeader({
  label,
  tip,
  align = 'left',
  className = '',
  style,
  resizeHandle,
  suffix,
  onClick,
}: {
  label: string;
  tip?: string;
  align?: 'left' | 'right';
  className?: string;
  style?: CSSProperties;
  resizeHandle?: ReactNode;
  /** 标签右侧的额外内容（如排序图标），渲染在 tip 图标之后 */
  suffix?: ReactNode;
  onClick?: () => void;
}) {
  const iconRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [tipStyle, setTipStyle] = useState<CSSProperties>({});
  const alignRight = align === 'right';

  const updateTipPosition = useCallback(() => {
    const el = iconRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margin = 8;
    const maxWidth = Math.min(COLUMN_TIP_MAX_PX, window.innerWidth - 2 * margin);
    let left: number;
    if (alignRight) {
      left = r.right - maxWidth;
      if (left < margin) left = margin;
      if (left + maxWidth > window.innerWidth - margin)
        left = Math.max(margin, window.innerWidth - margin - maxWidth);
    } else {
      left = r.left;
      if (left + maxWidth > window.innerWidth - margin)
        left = Math.max(margin, window.innerWidth - margin - maxWidth);
      if (left < margin) left = margin;
    }
    setTipStyle({ top: r.bottom + margin, left, maxWidth, width: 'max-content' });
  }, [alignRight]);

  useLayoutEffect(() => {
    if (!open) return;
    updateTipPosition();
    const id = requestAnimationFrame(() => requestAnimationFrame(updateTipPosition));
    return () => cancelAnimationFrame(id);
  }, [open, updateTipPosition]);

  useEffect(() => {
    if (!open) return;
    const unbind = bindScrollableAncestors(iconRef.current, updateTipPosition);
    window.addEventListener('resize', updateTipPosition);
    return () => {
      unbind();
      window.removeEventListener('resize', updateTipPosition);
    };
  }, [open, updateTipPosition]);

  const tipPortal =
    open && tip
      ? createPortal(
          <div
            className="pointer-events-none fixed z-[10000] rounded bg-gray-900 px-3 py-2 text-left text-xs font-normal leading-relaxed text-white shadow-xl"
            style={tipStyle}
            aria-hidden
          >
            <div className="whitespace-normal break-words">{tip}</div>
          </div>,
          document.body
        )
      : null;

  return (
    <th className={`${className} relative`} style={style} onClick={onClick}>
      <div className={`flex flex-nowrap items-center gap-1 ${alignRight ? 'justify-end' : 'justify-start'}`}>
        <span>{label}</span>
        {tip && (
          <div
            ref={iconRef}
            className="inline-flex shrink-0"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            <HelpCircle className="h-3.5 w-3.5 cursor-help text-gray-400 opacity-60 transition-opacity hover:opacity-100" />
          </div>
        )}
        {suffix}
      </div>
      {tipPortal}
      {resizeHandle}
    </th>
  );
}
