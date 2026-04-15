import { Edit2, Trash2 } from 'lucide-react';
import type { ProductStaffFormState, ProductStaffRow } from './productStaffModel';
import { useResizableTableColumns } from './resizableTableColumns';
import { Pagination } from './Pagination';

const PRODUCT_STAFF_COL_DEFAULTS = [180, 160, 200, 128];

const tableHeadClass =
  'px-3 py-3.5 text-left text-[14px] font-bold text-gray-900 dark:text-white/85 font-sans tracking-tight align-top break-words sm:px-4';
const tableHeadRight =
  'px-3 py-3.5 text-right text-[14px] font-bold text-gray-900 dark:text-white/85 font-sans tracking-tight align-top break-words sm:px-4';
const tableHeadAction =
  'sticky right-0 z-30 border-l border-line bg-gray-50/95 dark:bg-[#181c28]/95 px-3 py-3.5 text-right text-[14px] font-bold text-gray-900 dark:text-white/85 font-sans tracking-tight align-top whitespace-nowrap shadow-[-10px_0_20px_-8px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:px-4 relative';
const tableCellActionBase =
  'sticky right-0 z-20 border-l border-line bg-white dark:bg-[#1e2232] px-3 py-4 text-right shadow-[-10px_0_20px_-8px_rgba(0,0,0,0.08)] group-hover:bg-gray-50 dark:group-hover:bg-[#252a3a] sm:px-4';
const tableCellAction = `${tableCellActionBase} align-top`;
const wrapCell = 'min-w-0 px-3 py-3 align-top text-sm break-words [overflow-wrap:anywhere] sm:px-4';

function formatLocal(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return iso;
  }
}


export function ProductStaffTable({
  data,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}: {
  data: ProductStaffRow[];
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (row: ProductStaffRow) => void;
  onDelete: (row: ProductStaffRow) => void;
}) {
  const rtc = useResizableTableColumns('product-staff', PRODUCT_STAFF_COL_DEFAULTS);
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
            <th className={`${tableHeadClass} relative`}>
              名字
              {rtc.renderResizeHandle(0)}
            </th>
            <th className={`${tableHeadClass} relative`}>
              职称
              {rtc.renderResizeHandle(1)}
            </th>
            <th className={`${tableHeadRight} relative whitespace-nowrap`}>
              创建时间
              {rtc.renderResizeHandle(2)}
            </th>
            <th className={tableHeadAction}>
              操作
              {rtc.renderResizeHandle(3)}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {paginated.map((row) => (
            <tr key={row.id} className="group transition-colors hover:bg-gray-50">
              <td className={`${wrapCell} font-medium text-ink`}>{row.name || '—'}</td>
              <td className={`${wrapCell} text-gray-700`}>{row.title || '—'}</td>
              <td className="whitespace-nowrap px-3 py-3 align-top text-right text-sm text-gray-600 sm:px-4">
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
  );
}

const inputClass =
  'w-full rounded-lg border border-line px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20';

export function ProductStaffDrawerFields({
  form,
  onPatch,
}: {
  form: ProductStaffFormState;
  onPatch: (p: Partial<ProductStaffFormState>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
          名字
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className={inputClass}
          value={form.name}
          onChange={(e) => onPatch({ name: e.target.value })}
          placeholder="请输入姓名"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">职称</label>
        <input
          type="text"
          className={inputClass}
          value={form.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          placeholder="请输入职称"
        />
      </div>
    </div>
  );
}
