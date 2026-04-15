/** 录入审核工作台 — Mock 数据 */

export type EntryAuditDocTab = 'pending' | 'passed' | 'rejected' | 'archived' | 'all';

export type EntryAuditDocStatus = 'pending_audit' | 'processing';

export type EntrySource = 'qr' | 'import';

export interface EntryAuditOperationLog {
  at: string;
  operator: string;
  opType: string;
  content: string;
}

export interface EntryAuditRow {
  id: string;
  agentName: string;
  youbaoCode: string;
  youbaoId: string;
  /** 近10天关键词数 */
  last10dKeywords: number;
  /** 近10天作品数 */
  last10dWorks: number;
  /** 近10天订单数 */
  last10dOrders: number;
  /** 近10天收益（元） */
  last10dEarnings: number;
  /** 近10天数据更新时间 */
  last10dUpdatedAt: string;
  codeThumbUrl: string;
  idThumbUrl: string;
  appliedAt: string;
  entrySource: EntrySource;
  /** 飞书绑定手机号（详情可编辑） */
  feishuPhone: string;
  /** 飞书用户 ID（详情可编辑） */
  feishuId: string;
  docStatus: EntryAuditDocStatus;
  processor: string;
  operationLogs: EntryAuditOperationLog[];
}

export const ENTRY_AUDIT_TAB_LABEL: Record<EntryAuditDocTab, string> = {
  pending: '待审核',
  passed: '已通过',
  rejected: '已拒绝',
  archived: '已归档',
  all: '全部',
};

export const ENTRY_SOURCE_LABEL: Record<EntrySource, string> = {
  qr: '二维码录入',
  import: '后台导入',
};

export const ENTRY_DOC_STATUS_LABEL: Record<EntryAuditDocStatus, string> = {
  pending_audit: '待审核',
  processing: '处理中',
};

const thumb =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="28" viewBox="0 0 40 28"><rect fill="#e5e7eb" width="40" height="28" rx="4"/><rect fill="#cbd5e1" x="6" y="6" width="28" height="16" rx="2"/></svg>`
  );

function defaultLogs(appliedAt: string, source: EntrySource): EntryAuditOperationLog[] {
  const src =
    source === 'qr'
      ? '用户通过专属二维码提交录入申请 (Mock)'
      : '后台批量导入录入申请 (Mock)';
  return [
    {
      at: appliedAt,
      operator: '系统',
      opType: '创建',
      content: src,
    },
  ];
}

export function entryAuditSeedRows(): EntryAuditRow[] {
  const base: Omit<EntryAuditRow, 'id'>[] = [
    {
      agentName: '王小明',
      youbaoCode: 'RB020008',
      youbaoId: 'ylu-10010',
      last10dKeywords: 128,
      last10dWorks: 34,
      last10dOrders: 87,
      last10dEarnings: 3260,
      last10dUpdatedAt: '2026-04-13T06:00:00',
      codeThumbUrl: thumb,
      idThumbUrl: thumb,
      appliedAt: '2026-04-13T12:02:00',
      entrySource: 'qr',
      feishuPhone: '13800138000',
      feishuId: 'ou_8a7b9c0d1e2f',
      docStatus: 'pending_audit',
      processor: '—',
      operationLogs: defaultLogs('2026-04-13T12:02:00', 'qr'),
    },
    {
      agentName: '张大伟',
      youbaoCode: 'RB020015',
      youbaoId: 'ylu-10022',
      last10dKeywords: 56,
      last10dWorks: 12,
      last10dOrders: 23,
      last10dEarnings: 810,
      last10dUpdatedAt: '2026-04-12T06:00:00',
      codeThumbUrl: thumb,
      idThumbUrl: thumb,
      appliedAt: '2026-04-12T09:30:00',
      entrySource: 'import',
      feishuPhone: '',
      feishuId: '',
      docStatus: 'pending_audit',
      processor: '—',
      operationLogs: defaultLogs('2026-04-12T09:30:00', 'import'),
    },
    {
      agentName: '李晓红',
      youbaoCode: 'RB019992',
      youbaoId: 'ylu-09981',
      last10dKeywords: 204,
      last10dWorks: 61,
      last10dOrders: 152,
      last10dEarnings: 5940,
      last10dUpdatedAt: '2026-04-11T06:00:00',
      codeThumbUrl: thumb,
      idThumbUrl: thumb,
      appliedAt: '2026-04-11T16:00:00',
      entrySource: 'qr',
      feishuPhone: '13900001111',
      feishuId: 'ou_import_demo',
      docStatus: 'processing',
      processor: '—',
      operationLogs: defaultLogs('2026-04-11T16:00:00', 'qr'),
    },
    {
      agentName: '王小明',
      youbaoCode: 'RB020001',
      youbaoId: 'ylu-10002',
      last10dKeywords: 0,
      last10dWorks: 3,
      last10dOrders: 0,
      last10dEarnings: 0,
      last10dUpdatedAt: '2026-04-10T06:00:00',
      codeThumbUrl: thumb,
      idThumbUrl: thumb,
      appliedAt: '2026-04-10T10:00:00',
      entrySource: 'qr',
      feishuPhone: '',
      feishuId: 'ou_pending_only',
      docStatus: 'pending_audit',
      processor: '—',
      operationLogs: defaultLogs('2026-04-10T10:00:00', 'qr'),
    },
    {
      agentName: '李晓红',
      youbaoCode: 'RB020030',
      youbaoId: 'ylu-10040',
      last10dKeywords: 77,
      last10dWorks: 18,
      last10dOrders: 44,
      last10dEarnings: 1720,
      last10dUpdatedAt: '2026-04-09T06:00:00',
      codeThumbUrl: thumb,
      idThumbUrl: thumb,
      appliedAt: '2026-04-09T08:15:00',
      entrySource: 'import',
      feishuPhone: '13712345678',
      feishuId: '',
      docStatus: 'processing',
      processor: '—',
      operationLogs: defaultLogs('2026-04-09T08:15:00', 'import'),
    },
    {
      agentName: '张大伟',
      youbaoCode: 'RB020031',
      youbaoId: 'ylu-10041',
      last10dKeywords: 31,
      last10dWorks: 8,
      last10dOrders: 15,
      last10dEarnings: 490,
      last10dUpdatedAt: '2026-04-08T06:00:00',
      codeThumbUrl: thumb,
      idThumbUrl: thumb,
      appliedAt: '2026-04-08T14:20:00',
      entrySource: 'qr',
      feishuPhone: '13600000000',
      feishuId: 'ou_qr_last',
      docStatus: 'pending_audit',
      processor: '—',
      operationLogs: defaultLogs('2026-04-08T14:20:00', 'qr'),
    },
  ];
  return base.map((r, i) => ({ ...r, id: `ea-${i + 1}` }));
}

export function tabCountsForRows(rows: EntryAuditRow[]): Record<EntryAuditDocTab, number> {
  const pending = rows.filter((r) => r.docStatus === 'pending_audit' || r.docStatus === 'processing').length;
  return {
    pending,
    passed: 12,
    rejected: 3,
    archived: 8,
    all: rows.length + 20,
  };
}

export function formatEntryAuditApplied(iso: string, source: EntrySource) {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return {
      datetime: `${y}-${m}-${day} ${h}:${min}`,
      sourceTag: ENTRY_SOURCE_LABEL[source],
    };
  } catch {
    return { datetime: iso, sourceTag: ENTRY_SOURCE_LABEL[source] };
  }
}

export function formatLast10dUpdatedAt(iso: string) {
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

export function formatOperationLogTime(iso: string) {
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
