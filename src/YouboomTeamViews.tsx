import { Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useResizableTableColumns, ColumnTipHeader } from './resizableTableColumns';
import { Pagination } from './Pagination';
import type { YouboomTeamRow, YouboomTeamSortField, SortOrder } from './youboomTeamModel';

// 列宽：团长ID, 团长昵称, 团队成员数, 团队收益, 团队奖励, 更新时间
const YOUBOOM_TEAM_COL_DEFAULTS = [140, 200, 130, 160, 160, 200];

const tableHeadClass =
  'px-2 py-3 text-left text-[12px] font-bold text-gray-900 dark:text-white/85 font-sans tracking-tight align-middle whitespace-nowrap sm:px-3';
const tableCell =
  'px-2 py-3 text-xs text-gray-700 sm:px-3 align-middle min-w-0 break-words [overflow-wrap:anywhere]';

function formatLocal(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return iso;
  }
}

function formatMoney(n: number) {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-20 text-gray-400">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
        <Search className="h-8 w-8 opacity-20" />
      </div>
      <p className="text-sm font-medium">暂无匹配数据</p>
      <p className="mt-1 text-xs">请尝试调整筛选条件后重新搜索</p>
    </div>
  );
}

function SortIcon({
  field,
  sortField,
  sortOrder,
}: {
  field: YouboomTeamSortField;
  sortField: YouboomTeamSortField | null;
  sortOrder: SortOrder;
}) {
  if (sortField !== field || sortOrder === null) {
    return <ArrowUpDown className="inline h-3 w-3 shrink-0 text-gray-300" />;
  }
  if (sortOrder === 'desc') {
    return <ArrowDown className="inline h-3 w-3 shrink-0 text-accent" />;
  }
  return <ArrowUp className="inline h-3 w-3 shrink-0 text-accent" />;
}

export function YouboomTeamTable({
  data,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortField,
  sortOrder,
  onSort,
  getRule = () => '暂无说明',
}: {
  data: YouboomTeamRow[];
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sortField: YouboomTeamSortField | null;
  sortOrder: SortOrder;
  onSort: (field: YouboomTeamSortField) => void;
  getRule?: (field: string) => string;
}) {
  const rtc = useResizableTableColumns('youboom-team', YOUBOOM_TEAM_COL_DEFAULTS);
  if (data.length === 0) return <EmptyState />;

  const paginated = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const sortHeadClass = (field: YouboomTeamSortField) =>
    `${tableHeadClass} cursor-pointer select-none hover:bg-gray-100/60 transition-colors${
      sortField === field ? ' text-accent' : ''
    }`;

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table
        className="app-data-table app-data-table--resizable w-full min-w-0 border-collapse text-left"
        style={{ minWidth: rtc.tableMinWidth }}
      >
        {rtc.colGroup}
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <ColumnTipHeader
              label="团长ID"
              tip={getRule('leaderId')}
              className={tableHeadClass}
              resizeHandle={rtc.renderResizeHandle(0)}
            />
            <ColumnTipHeader
              label="团长昵称"
              tip={getRule('leaderNickname')}
              className={tableHeadClass}
              resizeHandle={rtc.renderResizeHandle(1)}
            />
            <ColumnTipHeader
              label="团队成员数"
              tip={getRule('memberCount')}
              className={sortHeadClass('memberCount')}
              resizeHandle={rtc.renderResizeHandle(2)}
              suffix={<SortIcon field="memberCount" sortField={sortField} sortOrder={sortOrder} />}
              onClick={() => onSort('memberCount')}
            />
            <ColumnTipHeader
              label="团队收益"
              tip={getRule('teamRevenue')}
              className={sortHeadClass('teamRevenue')}
              resizeHandle={rtc.renderResizeHandle(3)}
              suffix={<SortIcon field="teamRevenue" sortField={sortField} sortOrder={sortOrder} />}
              onClick={() => onSort('teamRevenue')}
            />
            <ColumnTipHeader
              label="团队奖励"
              tip={getRule('teamReward')}
              className={sortHeadClass('teamReward')}
              resizeHandle={rtc.renderResizeHandle(4)}
              suffix={<SortIcon field="teamReward" sortField={sortField} sortOrder={sortOrder} />}
              onClick={() => onSort('teamReward')}
            />
            <ColumnTipHeader
              label="更新时间"
              tip={getRule('updatedAt')}
              className={tableHeadClass}
              resizeHandle={rtc.renderResizeHandle(5)}
            />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {paginated.map((row) => (
            <tr key={row.id} className="group transition-colors hover:bg-gray-50">
              <td className={`${tableCell} font-mono text-[11px]`}>{row.leaderId}</td>
              <td className={tableCell}>{row.leaderNickname}</td>
              <td className={tableCell}>{row.memberCount.toLocaleString('zh-CN')}</td>
              <td className={tableCell}>¥{formatMoney(row.teamRevenue)}</td>
              <td className={tableCell}>¥{formatMoney(row.teamReward)}</td>
              <td className={`${tableCell} text-[11px] text-gray-500`}>{formatLocal(row.updatedAt)}</td>
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
  );
}
