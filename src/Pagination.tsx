import { ChevronLeft, ChevronRight } from 'lucide-react';

const DEFAULT_PAGE_SIZES = [15, 50, 100];

/**
 * 通用分页组件
 * - pageSizes: 可选页码尺寸列表，默认 [15, 50, 100]
 * - 超过 7 个页码时智能截断，只展示首尾和当前页周边页码
 */
export function Pagination({
  total,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange,
  pageSizes = DEFAULT_PAGE_SIZES,
}: {
  total: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizes?: number[];
}) {
  const totalPages = Math.ceil(total / pageSize);

  /** 生成带省略号的页码序列 */
  function buildPageItems(): (number | 'ellipsis')[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const items: (number | 'ellipsis')[] = [];
    const addPage = (p: number) => {
      if (!items.length || items[items.length - 1] !== p) items.push(p);
    };

    // 始终显示第 1 页
    addPage(1);

    // 当前页前 2 页之前需要省略号
    if (currentPage > 4) items.push('ellipsis');

    // 当前页 ±2 范围
    for (let p = Math.max(2, currentPage - 2); p <= Math.min(totalPages - 1, currentPage + 2); p++) {
      addPage(p);
    }

    // 当前页后 2 页之后需要省略号
    if (currentPage < totalPages - 3) items.push('ellipsis');

    // 始终显示最后一页
    addPage(totalPages);

    return items;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-gray-50/30 px-3 py-3 sm:px-4">
      {/* 统计信息 + 每页选择 */}
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-sm text-gray-600">
          显示 {total === 0 ? 0 : (currentPage - 1) * pageSize + 1} 到{' '}
          {Math.min(currentPage * pageSize, total)} 条，共 {total} 条
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">每页</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="cursor-pointer rounded border border-line bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent/30"
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size} 条
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 页码导航 */}
      {totalPages >= 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="rounded border border-line bg-white p-1.5 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="上一页"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {buildPageItems().map((item, idx) =>
            item === 'ellipsis' ? (
              <span
                key={`ellipsis-${idx}`}
                className="flex h-8 w-6 items-end justify-center pb-1 text-sm text-gray-400 select-none"
              >
                …
              </span>
            ) : (
              <button
                type="button"
                key={item}
                onClick={() => onPageChange(item)}
                className={`h-8 min-w-[2rem] rounded px-1.5 text-sm font-medium transition-all ${
                  currentPage === item
                    ? 'bg-accent text-white shadow-sm'
                    : 'border border-line bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {item}
              </button>
            )
          )}

          <button
            type="button"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => onPageChange(currentPage + 1)}
            className="rounded border border-line bg-white p-1.5 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="下一页"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
