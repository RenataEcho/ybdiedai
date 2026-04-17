/** youboom 迭代 — 奖励管理：类型与演示数据 */
import * as XLSX from 'xlsx';
import _rewardManagementSeedJson from './mock/reward-management-seed.json';

export type RewardBusinessType = 'brand' | 'overseas';
export type RewardAuditStatus = 'pending_review' | 'reviewed' | 'rejected';
export type RewardPaymentStatus = 'pending_payment' | 'paid';
export type RewardWechatNotifyStatus = 'pending' | 'sent';

export const REWARD_BUSINESS_LABEL: Record<RewardBusinessType, string> = {
  brand: '品牌',
  overseas: '海外',
};

export const REWARD_AUDIT_LABEL: Record<RewardAuditStatus, string> = {
  pending_review: '待审核',
  reviewed: '已审核',
  rejected: '已驳回',
};

export const REWARD_PAYMENT_LABEL: Record<RewardPaymentStatus, string> = {
  pending_payment: '待打款',
  paid: '已打款',
};

export const REWARD_WECHAT_LABEL: Record<RewardWechatNotifyStatus, string> = {
  pending: '待发送',
  sent: '已发送',
};

/**
 * Seed 版本号 — 每次修改 reward-management-seed.json 内容后递增此值，
 * localWorkspacePersistence 会检测到版本变化并自动用新 seed 覆盖 localStorage。
 */
export const REWARD_SEED_VERSION = 2;

/** 演示：项目 ID → 名称 */
export const REWARD_DEMO_PROJECT_NAMES: Record<string, string> = {
  YB_P_001: '春季品牌种草计划',
  YB_P_002: '海外拉新活动 A',
  YB_P_003: '口令裂变任务',
  YB_P_004: '夏季新品推广',
  YB_P_005: '东南亚市场拓展',
  YB_P_006: '618大促预热',
  YB_P_007: '欧洲市场激励计划',
};

/** 演示：项目 ID → 允许的关键词/口令列表（空数组表示该项目无关键词限制） */
export const REWARD_DEMO_PROJECT_KEYWORDS: Record<string, string[]> = {
  YB_P_001: ['春种2026', '品牌种草', 'YB_BRAND_001'],
  YB_P_002: ['invite-me', 'YB_OVERSEAS', 'haiwai2026'],
  YB_P_003: ['YBD2026', '裂变口令', 'VIRAL2026'],
  YB_P_004: ['夏推2026'],
  YB_P_005: ['SEA2026'],
  YB_P_006: ['618预热'],
  YB_P_007: ['EU2026'],
};

/** 演示：已知用户 ID 集合（导入时校验用户是否存在） */
export const REWARD_DEMO_USER_IDS = new Set([
  'U10001', 'U10002', 'U10003', 'U10004', 'U10005',
  'U10006', 'U10007', 'U10008', 'U10009', 'U10010',
  'U10011', 'U10012', 'U10013', 'U10014', 'U10015',
  'U10016', 'U10017', 'U10018', 'U10019', 'U10020',
  'U10021', 'U10022', 'U10023', 'U10024', 'U10025',
]);

/** 生成 16 位订单 ID：时间戳(13) + 随机(3) */
export function generateOrderId(): string {
  const ts = Date.now().toString();
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${ts}${rand}`;
}

export interface RewardManagementRow {
  id: string;
  orderId: string;
  importedAt: string;
  businessType: RewardBusinessType;
  projectId: string;
  projectName: string;
  keyword: string;
  userId: string;
  amount: number;
  rewardTitle: string;
  rewardReason: string;
  importOperator: string;
  reviewer: string;
  reviewedAt: string | null;
  rejectReason: string;
  payer: string;
  paidAt: string | null;
  auditStatus: RewardAuditStatus;
  paymentStatus: RewardPaymentStatus;
  wechatNotify: RewardWechatNotifyStatus;
}

export type RewardMgmtSearchForm = {
  businessType: 'all' | RewardBusinessType;
  projectName: string;
  userId: string;
  keyword: string;
  auditStatus: 'all' | RewardAuditStatus;
  paymentStatus: 'all' | RewardPaymentStatus;
  importDateStart: string;
  importDateEnd: string;
};

export function emptyRewardMgmtSearch(): RewardMgmtSearchForm {
  return {
    businessType: 'all',
    projectName: '',
    userId: '',
    keyword: '',
    auditStatus: 'all',
    paymentStatus: 'all',
    importDateStart: '',
    importDateEnd: '',
  };
}

const _rewardManagementFromFile = _rewardManagementSeedJson as unknown as RewardManagementRow[];

export const rewardManagementSeedData: RewardManagementRow[] = _rewardManagementFromFile.length > 0
  ? _rewardManagementFromFile
  : [
  {
    id: 'rw-001',
    orderId: '1744531200000001',
    businessType: 'brand',
    projectId: 'YB_P_001',
    projectName: '春季品牌种草计划',
    keyword: '春种2026',
    userId: 'U10001',
    amount: 128.5,
    rewardTitle: '任务达标奖励',
    rewardReason: '完成指定发布条数',
    importOperator: '张三',
    importedAt: '2026-04-10T09:30:00+08:00',
    reviewer: '李四',
    reviewedAt: '2026-04-10T14:00:00+08:00',
    rejectReason: '',
    payer: '王五',
    paidAt: '2026-04-11T10:15:00+08:00',
    auditStatus: 'reviewed',
    paymentStatus: 'paid',
    wechatNotify: 'sent',
  },
  {
    id: 'rw-002',
    orderId: '1744617600000002',
    businessType: 'overseas',
    projectId: 'YB_P_002',
    projectName: '海外拉新活动 A',
    keyword: '',
    userId: 'U10002',
    amount: 300,
    rewardTitle: '拉新阶梯奖',
    rewardReason: '有效邀请满 10 人',
    importOperator: '张三',
    importedAt: '2026-04-11T11:20:00+08:00',
    reviewer: '',
    reviewedAt: null,
    rejectReason: '',
    payer: '',
    paidAt: null,
    auditStatus: 'pending_review',
    paymentStatus: 'pending_payment',
    wechatNotify: 'pending',
  },
  {
    id: 'rw-003',
    orderId: '1744704000000003',
    businessType: 'brand',
    projectId: 'YB_P_003',
    projectName: '口令裂变任务',
    keyword: 'YBD2026',
    userId: 'U10003',
    amount: 50,
    rewardTitle: '',
    rewardReason: '口令兑换成功',
    importOperator: '赵六',
    importedAt: '2026-04-12T08:00:00+08:00',
    reviewer: '李四',
    reviewedAt: '2026-04-12T09:30:00+08:00',
    rejectReason: '',
    payer: '',
    paidAt: null,
    auditStatus: 'reviewed',
    paymentStatus: 'pending_payment',
    wechatNotify: 'pending',
  },
  {
    id: 'rw-004',
    orderId: '1744704000000004',
    businessType: 'overseas',
    projectId: 'YB_P_002',
    projectName: '海外拉新活动 A',
    keyword: 'invite-me',
    userId: 'U10004',
    amount: 88.88,
    rewardTitle: '首单奖励',
    rewardReason: '首笔有效订单',
    importOperator: '赵六',
    importedAt: '2026-04-12T16:45:00+08:00',
    reviewer: '李四',
    reviewedAt: '2026-04-12T17:00:00+08:00',
    rejectReason: '',
    payer: '王五',
    paidAt: '2026-04-13T09:00:00+08:00',
    auditStatus: 'reviewed',
    paymentStatus: 'paid',
    wechatNotify: 'sent',
  },
  {
    id: 'rw-005',
    orderId: '1744790400000005',
    businessType: 'brand',
    projectId: 'YB_P_001',
    projectName: '春季品牌种草计划',
    keyword: '',
    userId: 'U10005',
    amount: 200,
    rewardTitle: '周榜奖励',
    rewardReason: '周互动量排名前 20',
    importOperator: '张三',
    importedAt: '2026-04-13T10:00:00+08:00',
    reviewer: '李四',
    reviewedAt: '2026-04-13T11:00:00+08:00',
    rejectReason: '材料不完整，请重新提交',
    payer: '',
    paidAt: null,
    auditStatus: 'rejected',
    paymentStatus: 'pending_payment',
    wechatNotify: 'pending',
  },
];

export const REWARD_IMPORT_TEMPLATE_HEADERS = [
  '业务类型',
  '项目ID',
  '项目名称',
  '关键词/口令',
  '用户ID',
  '奖励金额',
  '奖励标题',
  '奖励事由',
] as const;

export type RewardImportParsedRow = {
  businessType: RewardBusinessType;
  projectId: string;
  projectName: string;
  keyword: string;
  userId: string;
  amount: number;
  rewardTitle: string;
  rewardReason: string;
};

export type RewardImportFailRow = RewardImportParsedRow & {
  rowNo: number;
  failReason: string;
};

export type RewardImportResult = {
  successRows: RewardImportParsedRow[];
  failRows: RewardImportFailRow[];
};

function normalizeCell(h: string) {
  return h.replace(/\ufeff/g, '').trim();
}

function mapBusinessType(raw: string): RewardBusinessType | null {
  const s = raw.trim();
  if (s === '品牌' || s.toLowerCase() === 'brand') return 'brand';
  if (s === '海外' || s.toLowerCase() === 'overseas') return 'overseas';
  return null;
}

/** 校验导入行数据 */
function validateImportRow(
  row: Omit<RewardImportParsedRow, 'businessType'> & { businessType: RewardBusinessType | null },
  rowNo: number
): { valid: true; data: RewardImportParsedRow } | { valid: false; reason: string } {
  if (!row.businessType) {
    return { valid: false, reason: `第 ${rowNo} 行：业务类型须为「品牌」或「海外」` };
  }
  if (!Number.isFinite(row.amount) || row.amount <= 0) {
    return { valid: false, reason: `第 ${rowNo} 行：奖励金额须为正数` };
  }
  if (!row.userId) {
    return { valid: false, reason: `第 ${rowNo} 行：用户ID必填` };
  }
  if (!row.rewardReason) {
    return { valid: false, reason: `第 ${rowNo} 行：奖励事由必填` };
  }

  // 校验项目ID与项目名称是否匹配
  if (row.projectId && row.projectName) {
    const expectedName = REWARD_DEMO_PROJECT_NAMES[row.projectId];
    if (expectedName && expectedName !== row.projectName.trim()) {
      return {
        valid: false,
        reason: `第 ${rowNo} 行：项目ID「${row.projectId}」对应名称为「${expectedName}」，与填写的「${row.projectName}」不匹配`,
      };
    }
  }

  // 校验关键词/口令是否属于该项目
  if (row.keyword && row.projectId) {
    const allowedKeywords = REWARD_DEMO_PROJECT_KEYWORDS[row.projectId];
    if (allowedKeywords && allowedKeywords.length > 0 && !allowedKeywords.includes(row.keyword)) {
      return {
        valid: false,
        reason: `第 ${rowNo} 行：关键词「${row.keyword}」不属于项目「${row.projectId}」`,
      };
    }
  }

  // 校验用户ID是否存在
  if (!REWARD_DEMO_USER_IDS.has(row.userId)) {
    return {
      valid: false,
      reason: `第 ${rowNo} 行：用户ID「${row.userId}」未找到对应用户`,
    };
  }

  return {
    valid: true,
    data: {
      businessType: row.businessType,
      projectId: row.projectId,
      projectName: row.projectName,
      keyword: row.keyword,
      userId: row.userId,
      amount: row.amount,
      rewardTitle: row.rewardTitle,
      rewardReason: row.rewardReason,
    },
  };
}

/** 解析 Excel 文件（.xlsx / .xls） */
export function parseRewardImportExcel(buffer: ArrayBuffer): RewardImportResult {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
    defval: '',
    raw: false,
  });

  const successRows: RewardImportParsedRow[] = [];
  const failRows: RewardImportFailRow[] = [];

  rawRows.forEach((raw, idx) => {
    const rowNo = idx + 2; // 1 = header row
    const get = (keys: string[]) => {
      for (const k of keys) {
        if (raw[k] !== undefined && String(raw[k]).trim() !== '') return String(raw[k]).trim();
      }
      return '';
    };

    const bizRaw = get(['业务类型']);
    const businessType = mapBusinessType(bizRaw);
    const amountStr = get(['奖励金额']).replace(/,/g, '');
    const amount = Number(amountStr);
    const userId = get(['用户ID', '用户id']);
    const projectId = get(['项目ID', '项目id']);
    const projectName = get(['项目名称']);
    const keyword = get(['关键词/口令', '关键词口令', '口令']);
    const rewardTitle = get(['奖励标题']);
    const rewardReason = get(['奖励事由']);

    const result = validateImportRow(
      { businessType, projectId, projectName, keyword, userId, amount, rewardTitle, rewardReason },
      rowNo
    );

    if (result.valid) {
      successRows.push(result.data);
    } else {
      const failResult = result as { valid: false; reason: string };
      failRows.push({
        businessType: businessType ?? 'brand',
        projectId,
        projectName,
        keyword,
        userId,
        amount,
        rewardTitle,
        rewardReason,
        rowNo,
        failReason: failResult.reason,
      });
    }
  });

  return { successRows, failRows };
}

/** 下载 Excel 导入模板 */
export function downloadRewardImportExcelTemplate() {
  const data: string[][] = [
    [...REWARD_IMPORT_TEMPLATE_HEADERS],
    ['品牌', 'YB_P_001', '春季品牌种草计划', '春种2026', 'U10001', '99.00', '示例标题', '示例奖励事由'],
    ['海外', 'YB_P_002', '海外拉新活动 A', 'invite-me', 'U10002', '200.00', '', '拉新奖励'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 16 },
    { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 20 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '奖励导入模板');
  XLSX.writeFile(wb, '奖励导入模板.xlsx');
}

/** 导出失败数据到 Excel */
export function exportFailRowsToExcel(failRows: RewardImportFailRow[]) {
  const header = [...REWARD_IMPORT_TEMPLATE_HEADERS, '失败原因'];
  const rows = failRows.map((r) => [
    r.businessType === 'brand' ? '品牌' : '海外',
    r.projectId,
    r.projectName,
    r.keyword,
    r.userId,
    r.amount || '',
    r.rewardTitle,
    r.rewardReason,
    r.failReason,
  ]);
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws['!cols'] = [
    { wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 16 },
    { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 20 }, { wch: 40 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '失败数据');
  XLSX.writeFile(wb, `奖励导入失败数据_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '')}.xlsx`);
}

export function parsedRowsToRewardRows(parsed: RewardImportParsedRow[], importOperator: string): RewardManagementRow[] {
  const now = new Date().toISOString();
  return parsed.map((p) => {
    const projectName =
      p.projectName ||
      (p.projectId ? REWARD_DEMO_PROJECT_NAMES[p.projectId] ?? `项目 ${p.projectId}` : '—');
    return {
      id: `rw-import-${generateOrderId()}`,
      orderId: generateOrderId(),
      businessType: p.businessType,
      projectId: p.projectId || '—',
      projectName,
      keyword: p.keyword || '—',
      userId: p.userId,
      amount: p.amount,
      rewardTitle: p.rewardTitle || '—',
      rewardReason: p.rewardReason,
      importOperator,
      importedAt: now,
      reviewer: '',
      reviewedAt: null,
      rejectReason: '',
      payer: '',
      paidAt: null,
      auditStatus: 'pending_review',
      paymentStatus: 'pending_payment',
      wechatNotify: 'pending',
    };
  });
}

export function exportRewardMgmtExcel(rows: RewardManagementRow[], filename = '奖励数据导出.xlsx') {
  const headers = [
    '订单ID', '导入时间', '业务类型', '项目ID', '项目名称',
    '关键词/口令', '用户ID', '奖励金额', '奖励标题', '奖励事由',
    '导入操作人', '审核人', '审核时间', '驳回原因', '打款人', '打款时间',
    '审核状态', '打款状态', '微信通知',
  ];
  const data = rows.map((r) => [
    r.orderId,
    r.importedAt,
    REWARD_BUSINESS_LABEL[r.businessType],
    r.projectId,
    r.projectName,
    r.keyword,
    r.userId,
    r.amount,
    r.rewardTitle,
    r.rewardReason,
    r.importOperator,
    r.reviewer || '—',
    r.reviewedAt || '—',
    r.rejectReason || '—',
    r.payer || '—',
    r.paidAt || '—',
    REWARD_AUDIT_LABEL[r.auditStatus],
    REWARD_PAYMENT_LABEL[r.paymentStatus],
    REWARD_WECHAT_LABEL[r.wechatNotify],
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '奖励数据');
  XLSX.writeFile(wb, filename);
}

/** 打款任务队列 Mock 数据 */
export type PaymentQueueItem = {
  id: string;
  paymentId: string;
  title: string;
  successCount: number;
  failCount: number;
  successAmount: number;
  failAmount: number;
  paidAt: string;
  status: '排队中' | '处理中' | '已完成' | '部分失败';
};

export const MOCK_PAYMENT_QUEUE: PaymentQueueItem[] = [
  {
    id: 'pq-1',
    paymentId: 'PAY20260413001',
    title: '批次 20260413-A',
    successCount: 10,
    failCount: 2,
    successAmount: 5280.4,
    failAmount: 400.0,
    paidAt: '2026-04-13T10:30:00+08:00',
    status: '部分失败',
  },
  {
    id: 'pq-2',
    paymentId: 'PAY20260412001',
    title: '批次 20260412-B',
    successCount: 0,
    failCount: 0,
    successAmount: 0,
    failAmount: 0,
    paidAt: '2026-04-12T15:00:00+08:00',
    status: '处理中',
  },
  {
    id: 'pq-3',
    paymentId: 'PAY20260411001',
    title: '批次 20260411-C',
    successCount: 8,
    failCount: 0,
    successAmount: 3200.0,
    failAmount: 0,
    paidAt: '2026-04-11T09:15:00+08:00',
    status: '已完成',
  },
  {
    id: 'pq-4',
    paymentId: 'PAY20260410001',
    title: '批次 20260410-D',
    successCount: 15,
    failCount: 3,
    successAmount: 7850.5,
    failAmount: 1200.0,
    paidAt: '2026-04-10T14:20:00+08:00',
    status: '部分失败',
  },
];
