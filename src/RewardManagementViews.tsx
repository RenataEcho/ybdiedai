import { useRef, useState } from 'react';
import { useResizableTableColumns, ColumnTipHeader } from './resizableTableColumns';
import { Pagination } from './Pagination';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, Download, ListOrdered, Search, Upload, X } from 'lucide-react';
import type { RewardImportFailRow, RewardManagementRow, PaymentQueueItem } from './rewardManagementModel';
import {
  REWARD_AUDIT_LABEL,
  REWARD_BUSINESS_LABEL,
  REWARD_IMPORT_TEMPLATE_HEADERS,
  REWARD_PAYMENT_LABEL,
  REWARD_WECHAT_LABEL,
  downloadRewardImportExcelTemplate,
  exportFailRowsToExcel,
  exportRewardMgmtExcel,
  parseRewardImportExcel,
  parsedRowsToRewardRows,
  MOCK_PAYMENT_QUEUE,
} from './rewardManagementModel';

// col defaults: checkbox, orderId, 业务类型, 项目ID, 项目名称, 关键词/口令, 用户ID, 奖励金额, 奖励标题, 奖励事由, 导入信息, 审核信息, 打款信息, [sticky] 审核状态, 打款状态, 微信通知
const REWARD_MGMT_COL_DEFAULTS = [40, 164, 96, 96, 168, 160, 128, 108, 168, 168, 148, 148, 148, 108, 108, 108];

const tableHeadClass =
  'px-2 py-3 text-left text-[12px] font-bold text-gray-900 dark:text-white/85 font-sans tracking-tight align-middle whitespace-nowrap sm:px-3';
const tableCell =
  'px-2 py-3 text-xs text-gray-700 sm:px-3 align-top min-w-0 break-words [overflow-wrap:anywhere]';

// sticky-right 列的通用样式
const stickyHeadClass =
  'sticky z-30 border-l border-line bg-gray-50/95 px-2 py-3 text-[12px] font-bold text-gray-900 tracking-tight align-middle whitespace-nowrap backdrop-blur-sm shadow-[-8px_0_16px_-6px_rgba(0,0,0,0.08)]';
const stickyCellClass =
  'sticky z-20 border-l border-line bg-white px-2 py-3 align-top text-xs text-gray-700 group-hover:bg-gray-50 shadow-[-8px_0_16px_-6px_rgba(0,0,0,0.06)]';

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

function badgeClass(kind: 'audit' | 'pay' | 'wx', v: string) {
  if (kind === 'audit') {
    if (v === 'pending_review') return 'bg-amber-50 text-amber-800';
    if (v === 'rejected') return 'bg-red-50 text-red-700';
    return 'bg-emerald-50 text-emerald-800';
  }
  if (kind === 'pay') {
    if (v === 'pending_payment') return 'bg-orange-50 text-orange-800';
    return 'bg-emerald-50 text-emerald-800';
  }
  if (v === 'pending') return 'bg-gray-100 text-gray-600';
  return 'bg-sky-50 text-sky-800';
}

function queueStatusBadge(status: PaymentQueueItem['status']) {
  if (status === '已完成') return 'bg-emerald-50 text-emerald-800';
  if (status === '处理中') return 'bg-blue-50 text-blue-700';
  if (status === '部分失败') return 'bg-amber-50 text-amber-800';
  return 'bg-gray-100 text-gray-600';
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

export function RewardManagementTable({
  data,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  selectedIds,
  onSelectionChange,
  getRule = () => '暂无说明',
}: {
  data: RewardManagementRow[];
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  getRule?: (field: string) => string;
}) {
  const rtc = useResizableTableColumns('reward-management', REWARD_MGMT_COL_DEFAULTS);
  if (data.length === 0) return <EmptyState />;
  const paginated = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageIds = paginated.map((r) => r.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const toggleRow = (id: string) => {
    if (selectedIds.includes(id)) onSelectionChange(selectedIds.filter((x) => x !== id));
    else onSelectionChange([...selectedIds, id]);
  };

  const togglePage = () => {
    if (allPageSelected) onSelectionChange(selectedIds.filter((id) => !pageIds.includes(id)));
    else onSelectionChange([...new Set([...selectedIds, ...pageIds])]);
  };

  // 计算 sticky-right 列的偏移量（基于当前列宽）
  const w = rtc.widths;
  // 列顺序最后3列：13=审核状态, 14=打款状态, 15=微信通知
  const rightWechat = 0;
  const rightPay = w[15] ?? REWARD_MGMT_COL_DEFAULTS[15];
  const rightAudit = rightPay + (w[14] ?? REWARD_MGMT_COL_DEFAULTS[14]);

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table
        className="app-data-table app-data-table--resizable w-full min-w-0 border-collapse text-left"
        style={{ minWidth: rtc.tableMinWidth }}
      >
        {rtc.colGroup}
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <th className={`${tableHeadClass} relative w-10`}>
              <input
                type="checkbox"
                className="accent-accent"
                checked={allPageSelected}
                onChange={togglePage}
                aria-label="全选本页"
              />
              {rtc.renderResizeHandle(0)}
            </th>
            <ColumnTipHeader label="订单ID" tip={getRule('orderId')} className={tableHeadClass} resizeHandle={rtc.renderResizeHandle(1)} />
            <ColumnTipHeader label="业务类型" tip={getRule('businessType')} className={tableHeadClass} resizeHandle={rtc.renderResizeHandle(2)} />
            <ColumnTipHeader label="项目ID" tip={getRule('projectId')} className={tableHeadClass} resizeHandle={rtc.renderResizeHandle(3)} />
            <ColumnTipHeader label="项目名称" tip={getRule('projectName')} className={tableHeadClass} resizeHandle={rtc.renderResizeHandle(4)} />
            <ColumnTipHeader label="关键词/口令" tip={getRule('keyword')} className={tableHeadClass} resizeHandle={rtc.renderResizeHandle(5)} />
            <ColumnTipHeader label="用户ID" tip={getRule('userId')} className={tableHeadClass} resizeHandle={rtc.renderResizeHandle(6)} />
            <ColumnTipHeader label="奖励金额" tip={getRule('amount')} align="right" className={tableHeadClass} resizeHandle={rtc.renderResizeHandle(7)} />
            <ColumnTipHeader label="奖励标题" tip={getRule('rewardTitle')} className={tableHeadClass} resizeHandle={rtc.renderResizeHandle(8)} />
            <ColumnTipHeader label="奖励事由" tip={getRule('rewardReason')} className={tableHeadClass} resizeHandle={rtc.renderResizeHandle(9)} />
            <ColumnTipHeader label="导入信息" tip={getRule('importOperator')} className={tableHeadClass} resizeHandle={rtc.renderResizeHandle(10)} />
            <ColumnTipHeader label="审核信息" tip={getRule('reviewer')} className={tableHeadClass} resizeHandle={rtc.renderResizeHandle(11)} />
            <ColumnTipHeader label="打款信息" tip={getRule('payer')} className={tableHeadClass} resizeHandle={rtc.renderResizeHandle(12)} />
            {/* sticky right 3 columns */}
            <ColumnTipHeader label="审核状态" tip={getRule('auditStatus')} className={stickyHeadClass} resizeHandle={rtc.renderResizeHandle(13)} style={{ right: rightAudit }} />
            <ColumnTipHeader label="打款状态" tip={getRule('paymentStatus')} className={stickyHeadClass} resizeHandle={rtc.renderResizeHandle(14)} style={{ right: rightPay }} />
            <ColumnTipHeader label="微信通知" tip={getRule('wechatNotify')} className={stickyHeadClass} style={{ right: rightWechat }} />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {paginated.map((row) => (
            <tr key={row.id} className="group transition-colors hover:bg-gray-50">
              <td className={`${tableCell} w-10`}>
                <input
                  type="checkbox"
                  className="accent-accent"
                  checked={selectedIds.includes(row.id)}
                  onChange={() => toggleRow(row.id)}
                  aria-label={`选择 ${row.orderId}`}
                />
              </td>
              <td className={tableCell}>
                <div className="font-mono text-[11px] text-gray-800">{row.orderId}</div>
                <div className="mt-0.5 text-[10px] text-gray-400">{formatLocal(row.importedAt)}</div>
              </td>
              <td className={tableCell}>{REWARD_BUSINESS_LABEL[row.businessType]}</td>
              <td className={`${tableCell} font-mono text-[11px]`}>{row.projectId}</td>
              <td className={tableCell}>{row.projectName}</td>
              <td className={tableCell}>{row.keyword}</td>
              <td className={`${tableCell} font-mono text-[11px]`}>{row.userId}</td>
              <td className={`${tableCell} whitespace-nowrap text-right`}>¥{formatMoney(row.amount)}</td>
              <td className={tableCell}>{row.rewardTitle}</td>
              <td className={tableCell}>{row.rewardReason}</td>
              <td className={`${tableCell} text-[11px] leading-relaxed`}>
                <div>{row.importOperator}</div>
                <div className="text-gray-500">{formatLocal(row.importedAt)}</div>
              </td>
              <td className={`${tableCell} text-[11px] leading-relaxed`}>
                <div>{row.reviewer || '—'}</div>
                <div className="text-gray-500">{row.reviewedAt ? formatLocal(row.reviewedAt) : '—'}</div>
                {row.rejectReason && (
                  <div className="mt-0.5 text-[10px] text-red-600" title={row.rejectReason}>
                    驳回：{row.rejectReason.length > 20 ? row.rejectReason.slice(0, 20) + '…' : row.rejectReason}
                  </div>
                )}
              </td>
              <td className={`${tableCell} text-[11px] leading-relaxed`}>
                <div>{row.payer || '—'}</div>
                <div className="text-gray-500">{row.paidAt ? formatLocal(row.paidAt) : '—'}</div>
              </td>
              {/* sticky right 3 columns */}
              <td className={stickyCellClass} style={{ right: rightAudit }}>
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${badgeClass('audit', row.auditStatus)}`}>
                  {REWARD_AUDIT_LABEL[row.auditStatus]}
                </span>
              </td>
              <td className={stickyCellClass} style={{ right: rightPay }}>
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${badgeClass('pay', row.paymentStatus)}`}>
                  {REWARD_PAYMENT_LABEL[row.paymentStatus]}
                </span>
              </td>
              <td className={stickyCellClass} style={{ right: rightWechat }}>
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${badgeClass('wx', row.wechatNotify)}`}>
                  {REWARD_WECHAT_LABEL[row.wechatNotify]}
                </span>
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

const TEMPLATE_FIELD_HINT: Record<(typeof REWARD_IMPORT_TEMPLATE_HEADERS)[number], string> = {
  业务类型: '必填，填「品牌」或「海外」',
  项目ID: '选填，须与项目名称匹配',
  项目名称: '选填，须与项目ID匹配',
  '关键词/口令': '选填，须属于对应项目',
  用户ID: '必填，系统中须存在该用户',
  奖励金额: '必填，正数',
  奖励标题: '选填',
  奖励事由: '必填',
};

const TEMPLATE_REQUIRED = new Set([0, 4, 5, 7]);

type ImportResultState = {
  successCount: number;
  failCount: number;
  failRows: RewardImportFailRow[];
} | null;

export function RewardBatchImportDrawer({
  open,
  onClose,
  onImported,
  importOperator,
}: {
  open: boolean;
  onClose: () => void;
  onImported: (rows: RewardManagementRow[]) => void;
  importOperator: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [parseMsg, setParseMsg] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResultState>(null);

  const handleClose = () => {
    setFileName('');
    setParseMsg(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
    onClose();
  };

  const handleFile = (file: File | null) => {
    setParseMsg(null);
    setResult(null);
    if (!file) {
      setFileName('');
      return;
    }
    setFileName(file.name);
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.xlsx') && !lower.endsWith('.xls')) {
      setParseMsg('请上传 .xlsx 或 .xls Excel 文件');
      return;
    }
    setImporting(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const buffer = reader.result as ArrayBuffer;
        const { successRows, failRows } = parseRewardImportExcel(buffer);
        setResult({ successCount: successRows.length, failCount: failRows.length, failRows });
        if (successRows.length > 0) {
          onImported(parsedRowsToRewardRows(successRows, importOperator));
        }
      } catch (e) {
        setParseMsg(`解析失败：${e instanceof Error ? e.message : '未知错误'}`);
      } finally {
        setImporting(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setParseMsg('文件读取失败，请重试');
      setImporting(false);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[46] bg-black/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed top-0 right-0 z-[47] flex h-full w-[min(100vw,580px)] flex-col bg-white shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-4">
              <div>
                <h2 className="text-lg font-bold text-ink">批量导入</h2>
                <p className="mt-1 text-xs text-gray-500">上传 Excel（.xlsx/.xls），字段须与模板一致</p>
              </div>
              <button type="button" onClick={handleClose} className="rounded-full p-2 transition-colors hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {/* 模板字段说明 */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Excel 模板字段</p>
                <div className="overflow-x-auto rounded-xl border border-line">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 font-bold text-gray-800">列名</th>
                        <th className="px-3 py-2 font-bold text-gray-800">说明</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {REWARD_IMPORT_TEMPLATE_HEADERS.map((h, i) => (
                        <tr key={h}>
                          <td className="px-3 py-2 font-medium text-gray-900">
                            {h}
                            {TEMPLATE_REQUIRED.has(i) ? (
                              <span className="ml-1 text-red-500">*</span>
                            ) : (
                              <span className="ml-1 text-gray-400">（选填）</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{TEMPLATE_FIELD_HINT[h]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 下载模板 */}
              <button
                type="button"
                onClick={() => downloadRewardImportExcelTemplate()}
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <Download className="h-3.5 w-3.5" />
                下载 Excel 模板
              </button>

              {/* 文件选择 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">选择 Excel 文件</label>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  disabled={importing}
                  onClick={() => inputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-gray-50/80 py-8 text-sm font-medium text-gray-600 transition-colors hover:border-accent/40 hover:bg-accent/5 disabled:opacity-50"
                >
                  <Upload className="h-5 w-5 text-accent" />
                  {importing ? '解析中…' : fileName ? fileName : '点击选择 .xlsx / .xls 文件'}
                </button>
                {parseMsg && <p className="text-xs text-red-600">{parseMsg}</p>}
              </div>

              {/* 导入结果 */}
              {result && (
                <div className="space-y-3 rounded-xl border border-line p-4">
                  <p className="text-sm font-semibold text-gray-800">导入结果</p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-gray-700">
                        成功 <span className="font-bold text-emerald-700">{result.successCount}</span> 条
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-gray-700">
                        失败 <span className="font-bold text-red-600">{result.failCount}</span> 条
                      </span>
                    </div>
                  </div>

                  {result.failCount > 0 && (
                    <div className="space-y-2">
                      <div className="max-h-40 overflow-y-auto rounded-lg border border-red-100 bg-red-50/60">
                        {result.failRows.map((r) => (
                          <div key={r.rowNo} className="border-b border-red-100 px-3 py-2 text-[11px] text-red-700 last:border-b-0">
                            {r.failReason}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => exportFailRowsToExcel(result.failRows)}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        <Download className="h-3.5 w-3.5" />
                        导出失败数据（Excel）
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex shrink-0 gap-3 border-t border-line px-4 py-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-lg border border-line py-2 text-sm font-medium transition-colors hover:bg-gray-50"
              >
                关闭
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function RewardPaymentQueueDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[46] bg-black/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed top-0 right-0 z-[47] flex h-full w-[min(100vw,440px)] flex-col bg-white shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-4">
              <div className="flex items-center gap-2">
                <ListOrdered className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-bold text-ink">打款任务队列</h2>
              </div>
              <button type="button" onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              <p className="text-xs text-gray-500">以下为演示队列数据；接入后端后将展示真实打款任务与状态。</p>
              {MOCK_PAYMENT_QUEUE.map((q) => (
                <div key={q.id} className="rounded-xl border border-line bg-gray-50/50 p-4 space-y-3">
                  {/* 头部：批次标题 + 状态 */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-900">{q.title}</span>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${queueStatusBadge(q.status)}`}>
                      {q.status}
                    </span>
                  </div>

                  {/* 打款ID */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 w-14 shrink-0">打款ID</span>
                    <span className="font-mono text-[11px] text-gray-800">{q.paymentId}</span>
                  </div>

                  {/* 打款笔数 */}
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] text-gray-500 w-14 shrink-0 pt-0.5">打款笔数</span>
                    <div className="space-y-0.5">
                      {q.status !== '排队中' && q.status !== '处理中' ? (
                        <>
                          <div className="text-[11px] text-emerald-700">
                            成功 <span className="font-bold">{q.successCount}</span> 笔
                          </div>
                          <div className="text-[11px] text-red-600">
                            失败 <span className="font-bold">{q.failCount}</span> 笔
                          </div>
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-400">处理中…</span>
                      )}
                    </div>
                  </div>

                  {/* 打款金额 */}
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] text-gray-500 w-14 shrink-0 pt-0.5">打款金额</span>
                    <div className="space-y-0.5">
                      {q.status !== '排队中' && q.status !== '处理中' ? (
                        <>
                          <div className="text-[11px] text-emerald-700">
                            成功 ¥<span className="font-bold">{formatMoney(q.successAmount)}</span>
                          </div>
                          <div className="text-[11px] text-red-600">
                            失败 ¥<span className="font-bold">{formatMoney(q.failAmount)}</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-400">—</span>
                      )}
                    </div>
                  </div>

                  {/* 打款时间 */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 w-14 shrink-0">打款时间</span>
                    <span className="text-[11px] text-gray-700">{formatLocal(q.paidAt)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-line p-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg border border-line py-2 text-sm font-medium hover:bg-gray-50"
              >
                关闭
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** 批量审核驳回弹窗 */
export function RewardRejectModal({
  open,
  count,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  count: number;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason('');
  };

  const handleCancel = () => {
    setReason('');
    onCancel();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="fixed inset-0 z-[50] bg-black/30 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-[51] w-[min(90vw,440px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h3 className="text-base font-bold text-ink">批量审核驳回</h3>
            <p className="mt-1 text-sm text-gray-500">
              将对 <span className="font-semibold text-red-600">{count}</span> 条已审核记录进行驳回，驳回后需重新提交审核。
            </p>
            <div className="mt-4 space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                驳回原因<span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20 min-h-[80px] resize-none"
                placeholder="请填写驳回原因（必填）"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                autoFocus
              />
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 rounded-lg border border-line py-2 text-sm font-medium hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                disabled={!reason.trim()}
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
              >
                确认驳回
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

