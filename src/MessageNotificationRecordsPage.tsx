import { useMemo, useState } from 'react';
import { useResizableTableColumns, ColumnTipHeader } from './resizableTableColumns';
import { Info } from 'lucide-react';
import { MenuRuleDescriptionModal } from './MenuRuleDescriptionModal';
import {
  PUSH_STATUS_LABEL,
  type MessageNotificationRow,
  type PushStatus,
  messageNotificationSeedData,
} from './messageNotificationModel';

const RULE_ROUTE_KEYS = ['audit-message-notification'] as const;

const MSG_NOTIFY_COL_DEFAULTS: number[] = [168, 120, 120, 200];

/** 消息通知记录字段说明 */
const MN_FIELD_TIPS: Record<string, string> = {
  notifyAt: '消息推送触发的时间',
  youbaoCode: '关联用户的右豹编码，用于定位推送对象',
  status: '推送状态：待发送 / 已推送 / 推送失败',
  failReason: '推送失败时的错误原因，如未绑定 OpenID、推送超时等',
};

const thBase =
  'relative whitespace-nowrap px-2 py-3 text-left text-xs font-bold text-gray-900 sm:px-3';

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${h}:${min}`;
  } catch {
    return iso;
  }
}

export function MessageNotificationRecordsPage() {
  const rtc = useResizableTableColumns('message-notification-records', MSG_NOTIFY_COL_DEFAULTS);
  const [rows] = useState<MessageNotificationRow[]>(() => messageNotificationSeedData());
  const [ruleOpen, setRuleOpen] = useState(false);
  const [code, setCode] = useState('');
  const [pushStatus, setPushStatus] = useState<'all' | PushStatus>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const cq = code.trim();
    return rows.filter((r) => {
      if (cq && r.youbaoCode !== cq) return false;
      if (pushStatus !== 'all' && r.status !== pushStatus) return false;
      return true;
    });
  }, [rows, code, pushStatus]);

  const allFilteredIds = useMemo(() => filtered.map((r) => r.id), [filtered]);
  const allChecked = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.has(id));
  const someChecked = allFilteredIds.some((id) => selectedIds.has(id));

  function toggleAll() {
    if (allChecked) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => new Set([...prev, ...allFilteredIds]));
    }
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const selectedRows = useMemo(
    () => filtered.filter((r) => selectedIds.has(r.id)),
    [filtered, selectedIds],
  );
  const canPushNow = selectedRows.some((r) => r.status === 'pending');
  const canRepush = selectedRows.some((r) => r.status === 'pending' || r.status === 'failed');

  return (
    <div className="space-y-5 p-4 sm:p-5">
      <div>
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="text-xl font-bold text-ink">消息通知记录</h2>
          <button type="button" onClick={() => setRuleOpen(true)} className="text-sm font-medium text-accent hover:underline">
            查看规则说明
          </button>
        </div>
        <p className="mt-1 flex items-start gap-2 text-sm text-gray-500">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          支持筛选与待推送/失败重推 (Mock)
        </p>
      </div>

      <div className="rounded-xl border border-line bg-gray-50/80 p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            右豹编码
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="精确匹配"
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            推送状态
            <select
              value={pushStatus}
              onChange={(e) => setPushStatus(e.target.value as typeof pushStatus)}
              className="cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">全部</option>
              <option value="pending">{PUSH_STATUS_LABEL.pending}</option>
              <option value="pushed">{PUSH_STATUS_LABEL.pushed}</option>
              <option value="failed">{PUSH_STATUS_LABEL.failed}</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <span className="text-xs text-gray-500">
            批量操作
            {selectedRows.length > 0 && (
              <>（已选 <span className="font-semibold text-gray-800">{selectedRows.length}</span> 条）</>
            )}
            {selectedRows.length === 0 && <span className="text-gray-400">（请先勾选记录）</span>}
          </span>
          <button
            type="button"
            disabled={!canPushNow}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => alert(`演示：批量立即推送 ${selectedRows.filter((r) => r.status === 'pending').length} 条`)}
          >
            批量立即推送
          </button>
          <button
            type="button"
            disabled={!canRepush}
            className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => alert(`演示：批量重新推送 ${selectedRows.filter((r) => r.status === 'pending' || r.status === 'failed').length} 条`)}
          >
            批量重新推送
          </button>
          {selectedRows.length > 0 && (
            <button
              type="button"
              className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
              onClick={() => setSelectedIds(new Set())}
            >
              取消选择
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600">
        共 <span className="font-semibold text-gray-900">{filtered.length}</span> 条记录
      </p>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table
          className="app-data-table app-data-table--resizable w-full min-w-0 divide-y divide-line text-xs sm:text-sm"
          style={{ minWidth: 40 + rtc.tableMinWidth }}
        >
          <colgroup>
            <col style={{ width: 40 }} />
            {rtc.widths.map((w, i) => (
              <col key={i} style={{ width: w }} />
            ))}
          </colgroup>
          <thead className="bg-gray-50/90">
            <tr>
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                  onChange={toggleAll}
                  className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-accent"
                />
              </th>
              <ColumnTipHeader label="通知时间" tip={MN_FIELD_TIPS.notifyAt} className={thBase} resizeHandle={rtc.renderResizeHandle(0)} />
              <ColumnTipHeader label="右豹编码" tip={MN_FIELD_TIPS.youbaoCode} className={thBase} resizeHandle={rtc.renderResizeHandle(1)} />
              <ColumnTipHeader label="推送状态" tip={MN_FIELD_TIPS.status} className={thBase} resizeHandle={rtc.renderResizeHandle(2)} />
              <ColumnTipHeader label="失败原因" tip={MN_FIELD_TIPS.failReason} className={thBase} resizeHandle={rtc.renderResizeHandle(3)} />
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {filtered.map((r) => (
              <tr
                key={r.id}
                className={`group cursor-pointer hover:bg-gray-50/50 ${selectedIds.has(r.id) ? 'bg-accent/5' : ''}`}
                onClick={() => toggleRow(r.id)}
              >
                <td className="w-10 px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(r.id)}
                    onChange={() => toggleRow(r.id)}
                    className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-accent"
                  />
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 text-gray-700 sm:px-3">{formatTime(r.notifyAt)}</td>
                <td className="whitespace-nowrap px-2 py-2.5 font-mono text-gray-700 sm:px-3">{r.youbaoCode}</td>
                <td className="whitespace-nowrap px-2 py-2.5 sm:px-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                      r.status === 'pushed'
                        ? 'bg-green-50 text-green-700'
                        : r.status === 'failed'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {PUSH_STATUS_LABEL[r.status]}
                  </span>
                </td>
                <td className="max-w-[200px] px-2 py-2.5 text-gray-600 sm:px-3">{r.failReason || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-12 text-center text-sm text-gray-500">暂无记录</div>}
      </div>

      <MenuRuleDescriptionModal
        open={ruleOpen}
        navTitle="消息通知记录"
        routeKeys={RULE_ROUTE_KEYS}
        onClose={() => setRuleOpen(false)}
      />
    </div>
  );
}
