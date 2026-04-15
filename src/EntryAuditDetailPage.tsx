import { useEffect, useState } from 'react';
import { useResizableTableColumns } from './resizableTableColumns';
import { Check, ChevronDown, ChevronLeft, Info, X } from 'lucide-react';
import {
  ENTRY_DOC_STATUS_LABEL,
  type EntryAuditRow,
  formatEntryAuditApplied,
  formatLast10dUpdatedAt,
  formatOperationLogTime,
} from './entryAuditModel';

const ENTRY_DETAIL_LOG_COL_DEFAULTS: number[] = [168, 120, 120, 320];

function ThHint({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {children}
      <Info className="h-3 w-3 shrink-0 text-gray-400" title="说明（演示）" />
    </span>
  );
}

export function EntryAuditDetailPage({
  row,
  onBack,
  onSaveFeishu,
  onApprove,
  onReject,
}: {
  row: EntryAuditRow;
  onBack: () => void;
  onSaveFeishu: (phone: string, id: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const rtc = useResizableTableColumns('entry-audit-detail-logs', ENTRY_DETAIL_LOG_COL_DEFAULTS);
  const [phone, setPhone] = useState(row.feishuPhone);
  const [feishuUserId, setFeishuUserId] = useState(row.feishuId);
  const [logOpen, setLogOpen] = useState(true);

  useEffect(() => {
    setPhone(row.feishuPhone);
    setFeishuUserId(row.feishuId);
  }, [row.id, row.feishuPhone, row.feishuId]);

  const { datetime, sourceTag } = formatEntryAuditApplied(row.appliedAt, row.entrySource);
  const last10dUpdatedAt = formatLast10dUpdatedAt(row.last10dUpdatedAt);

  const saveFeishu = () => {
    const p = phone.trim();
    const id = feishuUserId.trim();
    if (p && !/^1\d{10}$/.test(p)) {
      alert('飞书手机号需为 11 位大陆手机号或留空');
      return;
    }
    onSaveFeishu(p, id);
    alert('飞书信息已保存');
  };

  const pending = row.docStatus === 'pending_audit';

  return (
    <div className="space-y-5 bg-gray-50/80 p-4 sm:p-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-accent"
      >
        <ChevronLeft className="h-4 w-4" />
        返回列表
      </button>

      <h2 className="text-xl font-bold text-ink">录入审核详情</h2>

      <section className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
        <h3 className="mb-4 text-sm font-bold text-gray-900">申请信息</h3>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-gray-500">所属客服</dt>
            <dd className="mt-1 font-medium text-gray-900">{row.agentName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">右豹编码</dt>
            <dd className="mt-1 font-mono text-gray-800">{row.youbaoCode}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">右豹 ID</dt>
            <dd className="mt-1 font-mono text-gray-800">{row.youbaoId}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-gray-500">飞书信息（手机号、ID）</dt>
            <dd className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="min-w-0 flex-1 space-y-1">
                <span className="text-[11px] text-gray-400">手机号</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="选填，11 位大陆手机号"
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="min-w-0 flex-1 space-y-1">
                <span className="text-[11px] text-gray-400">飞书用户 ID</span>
                <input
                  value={feishuUserId}
                  onChange={(e) => setFeishuUserId(e.target.value)}
                  placeholder="选填"
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <button
                type="button"
                onClick={saveFeishu}
                className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
              >
                保存
              </button>
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-gray-500">申请时间</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-gray-900">{datetime}</span>
              <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                {sourceTag}
              </span>
            </dd>
          </div>
        </dl>

        <div className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">右豹编码截图</p>
            <div className="overflow-hidden rounded-lg border border-line bg-gray-200">
              <img src={row.codeThumbUrl} alt="编码截图" className="h-28 w-full object-cover" />
            </div>
            <p className="mt-1 text-center text-[11px] text-gray-500">编码截图</p>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">右豹 ID 截图</p>
            <div className="overflow-hidden rounded-lg border border-line bg-gray-200">
              <img src={row.idThumbUrl} alt="ID 截图" className="h-28 w-full object-cover" />
            </div>
            <p className="mt-1 text-center text-[11px] text-gray-500">ID 截图</p>
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <div className="mb-3 flex flex-wrap items-baseline gap-2">
            <h4 className="text-sm font-bold text-gray-900">近10天数据</h4>
            <span className="text-[11px] text-gray-400">更新时间：{last10dUpdatedAt}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: '关键词', value: String(row.last10dKeywords), accent: false },
              { label: '作品', value: String(row.last10dWorks), accent: false },
              { label: '订单', value: String(row.last10dOrders), accent: false },
              {
                label: '收益（元）',
                value: row.last10dEarnings > 0 ? `¥${row.last10dEarnings.toLocaleString()}` : '—',
                accent: row.last10dEarnings > 0,
              },
            ].map(({ label, value, accent }) => (
              <div key={label} className="rounded-lg border border-line bg-gray-50 px-4 py-3">
                <p className="text-[11px] text-gray-400">{label}</p>
                <p className={`mt-1 text-lg font-semibold tabular-nums ${accent ? 'text-emerald-700' : 'text-gray-800'}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-gray-900">审核状态</h3>
        <span
          className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${
            row.docStatus === 'pending_audit' ? 'bg-orange-50 text-orange-800' : 'bg-blue-50 text-blue-800'
          }`}
        >
          {ENTRY_DOC_STATUS_LABEL[row.docStatus]}
        </span>
      </section>

      <section className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
        <h3 className="mb-4 text-sm font-bold text-gray-900">操作区</h3>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!pending}
            onClick={onApprove}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            通过
          </button>
          <button
            type="button"
            disabled={!pending}
            onClick={onReject}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/80 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            拒绝
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setLogOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-gray-900 hover:bg-gray-50/80 sm:px-5"
        >
          <span>操作日志</span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${logOpen ? '' : '-rotate-90'}`} />
        </button>
        {logOpen && (
          <div className="border-t border-line px-2 pb-4 pt-2 sm:px-4">
            <div className="overflow-x-auto rounded-lg border border-line">
              <table
                className="app-data-table app-data-table--resizable w-full min-w-0 divide-y divide-line text-xs sm:text-sm"
                style={{ minWidth: rtc.tableMinWidth }}
              >
                {rtc.colGroup}
                <thead className="bg-sky-50/90">
                  <tr>
                    <th className="relative whitespace-nowrap px-2 py-2.5 text-left font-bold text-gray-900 sm:px-3">
                      <ThHint>操作时间</ThHint>
                      {rtc.renderResizeHandle(0)}
                    </th>
                    <th className="relative whitespace-nowrap px-2 py-2.5 text-left font-bold text-gray-900 sm:px-3">
                      <ThHint>操作人</ThHint>
                      {rtc.renderResizeHandle(1)}
                    </th>
                    <th className="relative whitespace-nowrap px-2 py-2.5 text-left font-bold text-gray-900 sm:px-3">
                      <ThHint>操作类型</ThHint>
                      {rtc.renderResizeHandle(2)}
                    </th>
                    <th className="relative px-2 py-2.5 text-left font-bold text-gray-900 sm:px-3">
                      <ThHint>操作内容</ThHint>
                      {rtc.renderResizeHandle(3)}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-white">
                  {row.operationLogs.map((log, i) => (
                    <tr key={`${log.at}-${i}`}>
                      <td className="whitespace-nowrap px-2 py-2 text-gray-700 sm:px-3">
                        {formatOperationLogTime(log.at)}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-gray-700 sm:px-3">{log.operator}</td>
                      <td className="whitespace-nowrap px-2 py-2 text-gray-700 sm:px-3">{log.opType}</td>
                      <td className="px-2 py-2 text-gray-600 sm:px-3">{log.content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
