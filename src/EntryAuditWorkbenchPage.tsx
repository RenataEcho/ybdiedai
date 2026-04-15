import { useMemo, useState } from 'react';
import { useResizableTableColumns, ColumnTipHeader } from './resizableTableColumns';
import { Check, Info, X } from 'lucide-react';
import { EntryAuditDetailPage } from './EntryAuditDetailPage';
import { MenuRuleDescriptionModal } from './MenuRuleDescriptionModal';
import {
  ENTRY_AUDIT_TAB_LABEL,
  ENTRY_DOC_STATUS_LABEL,
  ENTRY_SOURCE_LABEL,
  type EntryAuditDocTab,
  type EntryAuditRow,
  entryAuditSeedRows,
  formatEntryAuditApplied,
  formatLast10dUpdatedAt,
  tabCountsForRows,
} from './entryAuditModel';

const RULE_ROUTE_KEYS = ['audit-entry-workbench'] as const;

// 列顺序：checkbox | 所属客服 | 右豹编码 | 右豹ID | 编码截图 | ID截图 | 飞书信息 | 近10天数据 | 数据更新时间 | 申请时间 | 单据状态 | 处理人
const ENTRY_AUDIT_COL_DEFAULTS: number[] = [36, 120, 120, 120, 88, 88, 200, 190, 148, 180, 120, 120];

/** 录入审核工作台字段说明 */
const EA_FIELD_TIPS: Record<string, string> = {
  agentName: '该录入单所归属的客服名称',
  youbaoCode: '用户的右豹编码，录入标识唯一键',
  youbaoId: '用户的右豹平台账号 ID',
  last10dData: '用户近10天的关键词数、作品数、订单数及累计收益，聚合展示',
  last10dUpdatedAt: '近10天数据的最近一次同步/更新时间',
  feishu: '用户绑定的飞书手机号与飞书用户ID，审核时用于核验身份',
  appliedAt: '用户提交录入申请的时间，同时展示录入来源标识',
  docStatus: '当前录入单的处理状态：待审核或处理中',
  processor: '当前单据的审核或处理操作员',
};

const thBase =
  'relative whitespace-nowrap px-2 py-3 text-left text-xs font-bold text-gray-900 sm:px-3';
const thCheck = 'relative w-9 px-2 py-3 text-center text-xs font-bold text-gray-900 sm:px-2';

function feishuSummary(r: EntryAuditRow) {
  const p = r.feishuPhone.trim() || '—';
  const id = r.feishuId.trim() || '—';
  return { p, id };
}

export function EntryAuditWorkbenchPage() {
  const rtc = useResizableTableColumns('entry-audit-workbench', ENTRY_AUDIT_COL_DEFAULTS);
  const [rows, setRows] = useState<EntryAuditRow[]>(() => entryAuditSeedRows());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [tab, setTab] = useState<EntryAuditDocTab>('pending');
  const [ruleOpen, setRuleOpen] = useState(false);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [agentKw, setAgentKw] = useState('');
  const [codeExact, setCodeExact] = useState('');
  const [idKw, setIdKw] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | EntryAuditRow['entrySource']>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const counts = useMemo(() => tabCountsForRows(rows), [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (tab === 'pending') {
        if (!(r.docStatus === 'pending_audit' || r.docStatus === 'processing')) return false;
      } else if (tab === 'all') {
        /* 全部：不按单据状态 Tab 过滤 */
      } else {
        /* 已通过 / 已拒绝 / 已归档：演示数据未填充，列表为空 */
        return false;
      }
      if (sourceFilter !== 'all' && r.entrySource !== sourceFilter) return false;
      const aq = agentKw.trim().toLowerCase();
      if (aq && !r.agentName.toLowerCase().includes(aq)) return false;
      const cq = codeExact.trim();
      if (cq && r.youbaoCode !== cq) return false;
      const iq = idKw.trim().toLowerCase();
      if (iq && !r.youbaoId.toLowerCase().includes(iq)) return false;
      if (dateStart) {
        const t = new Date(r.appliedAt).getTime();
        if (t < new Date(dateStart).getTime()) return false;
      }
      if (dateEnd) {
        const t = new Date(r.appliedAt).getTime();
        const end = new Date(dateEnd);
        end.setHours(23, 59, 59, 999);
        if (t > end.getTime()) return false;
      }
      return true;
    });
  }, [rows, tab, sourceFilter, agentKw, codeExact, idKw, dateStart, dateEnd]);

  const filteredIds = useMemo(() => filtered.map((r) => r.id), [filtered]);
  const allChecked = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const someChecked = !allChecked && filteredIds.some((id) => selectedIds.has(id));
  const selectedCount = filteredIds.filter((id) => selectedIds.has(id)).length;

  function toggleAll() {
    if (allChecked) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => new Set([...prev, ...filteredIds]));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const detailRow = detailId ? rows.find((r) => r.id === detailId) : undefined;

  if (detailRow) {
    return (
      <EntryAuditDetailPage
        row={detailRow}
        onBack={() => setDetailId(null)}
        onSaveFeishu={(phone, feishuUserId) => {
          setRows((prev) =>
            prev.map((r) =>
              r.id === detailRow.id
                ? {
                    ...r,
                    feishuPhone: phone,
                    feishuId: feishuUserId,
                    operationLogs: [
                      {
                        at: new Date().toISOString(),
                        operator: '审核员（演示）',
                        opType: '修改',
                        content: `更新飞书信息：手机号 ${phone || '（空）'}，飞书 ID ${feishuUserId || '（空）'}`,
                      },
                      ...r.operationLogs,
                    ],
                  }
                : r
            )
          );
        }}
        onApprove={() => alert('演示：已通过')}
        onReject={() => alert('演示：已拒绝')}
      />
    );
  }

  return (
    <div className="space-y-5 p-4 sm:p-5">
      <div>
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="text-xl font-bold text-ink">录入审核工作台</h2>
          <button type="button" onClick={() => setRuleOpen(true)} className="text-sm font-medium text-accent hover:underline">
            查看规则说明
          </button>
        </div>
        <p className="mt-1 flex items-start gap-2 text-sm text-gray-500">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          用户主档录入来源：后台导入与用户扫码；处理规则与入群审核对齐 (Mock)
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-line pb-1">
        {(Object.keys(ENTRY_AUDIT_TAB_LABEL) as EntryAuditDocTab[]).map((k) => {
          const isActive = tab === k;
          const badge = k === 'pending' ? counts.pending : undefined;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`relative rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-violet-50 text-violet-800' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {ENTRY_AUDIT_TAB_LABEL[k]}
              {badge != null && k === 'pending' ? (
                <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-line bg-gray-50/80 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            申请时间
            <div className="flex flex-wrap items-center gap-1">
              <input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-line bg-white px-2 py-2 text-sm"
              />
              <span className="text-gray-400">→</span>
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-line bg-white px-2 py-2 text-sm"
              />
            </div>
            <span className="text-[10px] font-normal text-gray-400">开始日期 → 结束日期</span>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            所属客服
            <input
              value={agentKw}
              onChange={(e) => setAgentKw(e.target.value)}
              placeholder="模糊匹配"
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            右豹编码
            <input
              value={codeExact}
              onChange={(e) => setCodeExact(e.target.value)}
              placeholder="精确匹配"
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            右豹 ID
            <input
              value={idKw}
              onChange={(e) => setIdKw(e.target.value)}
              placeholder="模糊匹配"
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            录入来源
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
              className="cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">全部</option>
              <option value="qr">{ENTRY_SOURCE_LABEL.qr}</option>
              <option value="import">{ENTRY_SOURCE_LABEL.import}</option>
            </select>
          </label>
        </div>
      </div>

      {/* 工具栏：与搜索条件栏同级，记录统计 + 批量操作 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          共 <span className="font-semibold text-gray-900">{filtered.length}</span> 条记录
          {selectedCount > 0 && (
            <span className="ml-2 text-gray-500">
              已选 <span className="font-semibold text-gray-900">{selectedCount}</span> 条
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={() => alert(`演示：批量通过 ${selectedCount} 条`)}
            className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5" />
            批量通过
          </button>
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={() => alert(`演示：批量拒绝 ${selectedCount} 条`)}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-3.5 w-3.5" />
            批量拒绝
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table
          className="app-data-table app-data-table--resizable w-full min-w-0 divide-y divide-line text-xs sm:text-sm"
          style={{ minWidth: rtc.tableMinWidth }}
        >
          {rtc.colGroup}
          <thead className="bg-gray-50/90">
            <tr>
              {/* 全选 checkbox */}
              <th className={thCheck}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => { if (el) el.indeterminate = someChecked; }}
                  onChange={toggleAll}
                  className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-accent"
                  aria-label="全选"
                />
              </th>
              <ColumnTipHeader label="所属客服" tip={EA_FIELD_TIPS.agentName} className={thBase} resizeHandle={rtc.renderResizeHandle(1)} />
              <ColumnTipHeader label="右豹编码" tip={EA_FIELD_TIPS.youbaoCode} className={thBase} resizeHandle={rtc.renderResizeHandle(2)} />
              <ColumnTipHeader label="右豹 ID" tip={EA_FIELD_TIPS.youbaoId} className={thBase} resizeHandle={rtc.renderResizeHandle(3)} />
              <th className={thBase}>
                编码截图
                {rtc.renderResizeHandle(4)}
              </th>
              <th className={thBase}>
                ID 截图
                {rtc.renderResizeHandle(5)}
              </th>
              <ColumnTipHeader label="飞书信息（手机号、ID）" tip={EA_FIELD_TIPS.feishu} className={thBase} resizeHandle={rtc.renderResizeHandle(6)} />
              <ColumnTipHeader label="近10天数据" tip={EA_FIELD_TIPS.last10dData} className={thBase} resizeHandle={rtc.renderResizeHandle(7)} />
              <ColumnTipHeader label="数据更新时间" tip={EA_FIELD_TIPS.last10dUpdatedAt} className={thBase} resizeHandle={rtc.renderResizeHandle(8)} />
              <ColumnTipHeader label="申请时间" tip={EA_FIELD_TIPS.appliedAt} className={thBase} resizeHandle={rtc.renderResizeHandle(9)} />
              <ColumnTipHeader label="单据状态" tip={EA_FIELD_TIPS.docStatus} className={thBase} resizeHandle={rtc.renderResizeHandle(10)} />
              <ColumnTipHeader label="处理人" tip={EA_FIELD_TIPS.processor} className={thBase} resizeHandle={rtc.renderResizeHandle(11)} />
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {filtered.map((r) => {
              const { datetime, sourceTag } = formatEntryAuditApplied(r.appliedAt, r.entrySource);
              const fs = feishuSummary(r);
              const updatedAt = formatLast10dUpdatedAt(r.last10dUpdatedAt);
              const checked = selectedIds.has(r.id);
              return (
                <tr
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailId(r.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDetailId(r.id);
                    }
                  }}
                  className={`group cursor-pointer hover:bg-gray-50/80 ${checked ? 'bg-violet-50/40' : ''}`}
                >
                  {/* 行勾选 */}
                  <td
                    className="w-9 px-2 py-2.5 text-center sm:px-2"
                    onClick={(e) => { e.stopPropagation(); toggleOne(r.id); }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOne(r.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-accent"
                    />
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 sm:px-3">{r.agentName}</td>
                  <td className="whitespace-nowrap px-2 py-2.5 font-mono text-gray-700 sm:px-3">{r.youbaoCode}</td>
                  <td className="whitespace-nowrap px-2 py-2.5 font-mono text-gray-600 sm:px-3">{r.youbaoId}</td>
                  <td className="px-2 py-2 sm:px-3">
                    <img src={r.codeThumbUrl} alt="" className="h-8 w-11 rounded border border-line object-cover" />
                  </td>
                  <td className="px-2 py-2 sm:px-3">
                    <img src={r.idThumbUrl} alt="" className="h-8 w-11 rounded border border-line object-cover" />
                  </td>
                  <td className="min-w-[140px] px-2 py-2.5 text-gray-700 sm:px-3">
                    <div className="text-[11px] leading-snug sm:text-xs">
                      <div>
                        <span className="text-gray-400">手机</span> {fs.p}
                      </div>
                      <div className="mt-0.5 font-mono">
                        <span className="text-gray-400">ID</span> {fs.id}
                      </div>
                    </div>
                  </td>
                  {/* 近10天数据聚合列 */}
                  <td className="px-2 py-2 sm:px-3">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] tabular-nums sm:text-xs">
                      <span className="text-gray-400">关键词</span>
                      <span className="text-right font-medium text-gray-700">{r.last10dKeywords}</span>
                      <span className="text-gray-400">作品</span>
                      <span className="text-right font-medium text-gray-700">{r.last10dWorks}</span>
                      <span className="text-gray-400">订单</span>
                      <span className="text-right font-medium text-gray-700">{r.last10dOrders}</span>
                      <span className="text-gray-400">收益</span>
                      <span className={`text-right font-semibold ${r.last10dEarnings > 0 ? 'text-emerald-700' : 'text-gray-400'}`}>
                        {r.last10dEarnings > 0 ? `¥${r.last10dEarnings.toLocaleString()}` : '—'}
                      </span>
                    </div>
                  </td>
                  {/* 数据更新时间列 */}
                  <td className="whitespace-nowrap px-2 py-2.5 text-[11px] text-gray-500 sm:px-3 sm:text-xs">{updatedAt}</td>
                  <td className="min-w-[160px] px-2 py-2.5 text-gray-700 sm:px-3">
                    <span className="block">{datetime}</span>
                    <span className="mt-0.5 inline-block rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">
                      {sourceTag}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 sm:px-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                        r.docStatus === 'pending_audit' ? 'bg-orange-50 text-orange-800' : 'bg-blue-50 text-blue-800'
                      }`}
                    >
                      {ENTRY_DOC_STATUS_LABEL[r.docStatus]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-gray-400 sm:px-3">{r.processor}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-12 text-center text-sm text-gray-500">暂无记录</div>}
      </div>

      <MenuRuleDescriptionModal
        open={ruleOpen}
        navTitle="录入审核工作台"
        routeKeys={RULE_ROUTE_KEYS}
        onClose={() => setRuleOpen(false)}
      />
    </div>
  );
}
