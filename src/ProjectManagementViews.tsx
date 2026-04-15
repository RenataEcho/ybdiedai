import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Edit2, HelpCircle, Search } from 'lucide-react';
import { Pagination } from './Pagination';
import { createPortal } from 'react-dom';
import type { ProjectManagementRow } from './projectManagementModel';
import { PROJECT_CATEGORY_LABEL } from './projectManagementModel';
import { useResizableTableColumns } from './resizableTableColumns';

const PM_COL_DEFAULTS = [88, 112, 72, 96, 200, 200, 88, 160, 96, 80, 80, 80, 132, 150, 108];

const tableHeadClass =
  'px-3 py-3.5 text-left text-[14px] font-bold text-gray-900 dark:text-white/85 font-sans tracking-tight align-middle whitespace-nowrap sm:px-4';
const tableHeadClassRight = `${tableHeadClass} text-right`;
const tableHeadAction =
  'sticky right-0 z-30 border-l border-line bg-gray-50/95 dark:bg-[#181c28]/95 px-3 py-3.5 text-right text-[14px] font-bold text-gray-900 dark:text-white/85 font-sans tracking-tight align-middle whitespace-nowrap shadow-[-10px_0_20px_-8px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:px-4 relative';
const tableCellActionBase =
  'sticky right-0 z-20 border-l border-line bg-white dark:bg-[#1e2232] px-3 py-4 text-right shadow-[-10px_0_20px_-8px_rgba(0,0,0,0.08)] group-hover:bg-gray-50 dark:group-hover:bg-[#252a3a] sm:px-4';
const tableCellAction = `${tableCellActionBase} align-middle`;

const TOOLTIP_MAX_PX = 448;

function bindScrollableAncestors(start: HTMLElement | null, handler: () => void) {
  const nodes: HTMLElement[] = [];
  let el: HTMLElement | null = start;
  while (el) {
    const st = window.getComputedStyle(el);
    const oy = st.overflowY;
    const ox = st.overflowX;
    if (/(auto|scroll|overlay)/.test(oy) || /(auto|scroll|overlay)/.test(ox)) nodes.push(el);
    el = el.parentElement;
  }
  const opts: AddEventListenerOptions = { capture: true, passive: true };
  nodes.forEach((n) => n.addEventListener('scroll', handler as EventListener, opts));
  return () => {
    nodes.forEach((n) => n.removeEventListener('scroll', handler as EventListener, opts));
  };
}

function TableHeader({
  label,
  rule,
  align = 'left',
  resizeHandle,
}: {
  label: string;
  rule: string;
  align?: 'left' | 'right';
  resizeHandle?: ReactNode;
}) {
  const alignRight = align === 'right';
  const iconRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [tipStyle, setTipStyle] = useState<CSSProperties>({});

  const updateTipPosition = useCallback(() => {
    const el = iconRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margin = 8;
    const maxWidth = Math.min(TOOLTIP_MAX_PX, window.innerWidth - 2 * margin);
    let left: number;
    if (alignRight) {
      left = r.right - maxWidth;
      if (left < margin) left = margin;
      if (left + maxWidth > window.innerWidth - margin) {
        left = Math.max(margin, window.innerWidth - margin - maxWidth);
      }
    } else {
      left = r.left;
      if (left + maxWidth > window.innerWidth - margin) {
        left = Math.max(margin, window.innerWidth - margin - maxWidth);
      }
      if (left < margin) left = margin;
    }
    const top = r.bottom + margin;
    setTipStyle({
      top,
      left,
      maxWidth,
      width: 'max-content',
    });
  }, [alignRight]);

  useLayoutEffect(() => {
    if (!open) return;
    updateTipPosition();
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(updateTipPosition);
    });
    return () => cancelAnimationFrame(id);
  }, [open, updateTipPosition]);

  useEffect(() => {
    if (!open) return;
    const onScrollResize = () => updateTipPosition();
    const unbindScrollers = bindScrollableAncestors(iconRef.current, onScrollResize);
    window.addEventListener('resize', onScrollResize);
    return () => {
      unbindScrollers();
      window.removeEventListener('resize', onScrollResize);
    };
  }, [open, updateTipPosition]);

  const tipPortal =
    open &&
    createPortal(
      <div
        className="pointer-events-none fixed z-[10000] max-h-[60vh] overflow-y-auto rounded bg-gray-900 px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed text-white shadow-xl"
        style={tipStyle}
        aria-hidden
      >
        <div className="mb-1 border-b border-white/10 pb-1 text-[11px] font-semibold text-blue-300">字段规则</div>
        <div className="whitespace-normal break-words">{rule}</div>
      </div>,
      document.body
    );

  return (
    <th className={`${alignRight ? tableHeadClassRight : tableHeadClass} relative`}>
      <div className={`flex flex-nowrap items-center gap-1.5 ${alignRight ? 'justify-end' : 'justify-start'}`}>
        <span>{label}</span>
        <div
          ref={iconRef}
          className="inline-flex shrink-0"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <HelpCircle className="h-3.5 w-3.5 cursor-help text-gray-400 opacity-70 transition-opacity hover:opacity-100" />
        </div>
      </div>
      {tipPortal}
      {resizeHandle}
    </th>
  );
}


function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-20 text-gray-400">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
        <Search className="h-8 w-8 opacity-20" />
      </div>
      <p className="text-sm font-medium">暂无匹配数据</p>
      <p className="mt-1 text-xs">请尝试调整搜索关键词或筛选条件</p>
    </div>
  );
}

export { ProjectManagementDrawerFields } from './ProjectManagementDrawerForm';

export function ProjectManagementTable({
  data,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  getRule,
  onEdit,
}: {
  data: ProjectManagementRow[];
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  getRule: (field: string) => string;
  onEdit: (row: ProjectManagementRow) => void;
}) {
  const rtc = useResizableTableColumns('project-management', PM_COL_DEFAULTS);
  if (data.length === 0) return <EmptyState />;
  const paginated = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table
        className="app-data-table app-data-table--resizable w-full min-w-0 border-collapse text-left"
        style={{ minWidth: rtc.tableMinWidth }}
      >
        {rtc.colGroup}
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <TableHeader label="项目ID" rule={getRule('projectId')} resizeHandle={rtc.renderResizeHandle(0)} />
            <TableHeader label="所属分类" rule={getRule('category')} resizeHandle={rtc.renderResizeHandle(1)} />
            <TableHeader label="排序" rule={getRule('sort')} align="right" resizeHandle={rtc.renderResizeHandle(2)} />
            <TableHeader
              label="虚拟收益"
              rule={getRule('virtualIncome')}
              align="right"
              resizeHandle={rtc.renderResizeHandle(3)}
            />
            <TableHeader label="前端标题" rule={getRule('frontTitle')} resizeHandle={rtc.renderResizeHandle(4)} />
            <TableHeader label="后台标题" rule={getRule('backTitle')} resizeHandle={rtc.renderResizeHandle(5)} />
            <TableHeader label="爆单排序" rule={getRule('boomSort')} resizeHandle={rtc.renderResizeHandle(6)} />
            <TableHeader label="项目标签" rule={getRule('projectTags')} resizeHandle={rtc.renderResizeHandle(7)} />
            <TableHeader label="项目状态" rule={getRule('projectStatus')} resizeHandle={rtc.renderResizeHandle(8)} />
            <TableHeader label="热门项目" rule={getRule('hotProject')} resizeHandle={rtc.renderResizeHandle(9)} />
            <TableHeader label="是否新品" rule={getRule('isNewProduct')} resizeHandle={rtc.renderResizeHandle(10)} />
            <TableHeader label="是否下线" rule={getRule('onlineState')} resizeHandle={rtc.renderResizeHandle(11)} />
            <TableHeader label="会员类型" rule={getRule('memberType')} resizeHandle={rtc.renderResizeHandle(12)} />
            <TableHeader label="更新时间" rule={getRule('updateTime')} resizeHandle={rtc.renderResizeHandle(13)} />
            <th className={tableHeadAction}>
              操作
              {rtc.renderResizeHandle(14)}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {paginated.map((row) => (
            <tr key={row.id} className="group transition-colors hover:bg-gray-50">
              <td className="px-3 py-4 font-mono text-sm text-gray-500 sm:px-4">{row.id}</td>
              <td className="px-3 py-4 sm:px-4">
                <span className="rounded bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600">
                  {PROJECT_CATEGORY_LABEL[row.category]}
                </span>
              </td>
              <td className="px-3 py-4 text-right font-mono text-sm sm:px-4">{row.sort}</td>
              <td className="px-3 py-4 text-right font-mono text-sm text-gray-700 sm:px-4">{row.virtualIncome}</td>
              <td className="max-w-[200px] truncate px-3 py-4 text-sm font-medium text-ink sm:px-4" title={row.frontTitle}>
                {row.frontTitle}
              </td>
              <td className="max-w-[200px] truncate px-3 py-4 text-sm text-gray-700 sm:px-4" title={row.backTitle}>
                {row.backTitle}
              </td>
              <td className="px-3 py-4 font-mono text-sm text-gray-600 sm:px-4">{row.boomSort || '—'}</td>
              <td className="max-w-[160px] truncate px-3 py-4 text-xs text-gray-600 sm:px-4" title={row.projectTags}>
                {row.projectTags || '—'}
              </td>
              <td className="px-3 py-4 sm:px-4">
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    row.projectStatus === 'show' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {row.projectStatus === 'show' ? '显示' : '隐藏'}
                </span>
              </td>
              <td className="px-3 py-4 sm:px-4">{row.hotProject === 'yes' ? '是' : '否'}</td>
              <td className="px-3 py-4 sm:px-4">{row.isNewProduct === 'yes' ? '是' : '否'}</td>
              <td className="px-3 py-4 sm:px-4">
                <span className={row.onlineState === 'online' ? 'text-green-600' : 'text-orange-600'}>
                  {row.onlineState === 'online' ? '上线' : '下线'}
                </span>
              </td>
              <td className="px-3 py-4 text-sm text-gray-700 sm:px-4">{row.memberType}</td>
              <td className="px-3 py-4 text-sm text-gray-400 sm:px-4">{row.updateTime}</td>
              <td className={tableCellAction}>
                <button
                  type="button"
                  onClick={() => onEdit(row)}
                  className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  编辑
                </button>
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
        pageSizes={[15, 50, 100, 500, 1000]}
      />
    </div>
  );
}
