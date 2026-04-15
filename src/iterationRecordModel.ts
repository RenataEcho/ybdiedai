/** 各一级菜单下的「迭代记录」演示数据 */
import _iterationRecordsSeedJson from './mock/iteration-records-seed.json';

export type IterationNavScope = 'youbao' | 'youboom' | 'system' | 'mentor';

export type IterationStatus = 'pending' | 'in_progress' | 'testing' | 'released';

/** 迭代优先级（整需求维度，必填） */
export type IterationPriority = 'SSS' | 'SS' | 'S' | 'A' | 'B' | 'C';

export const ITERATION_PRIORITY_LABEL: Record<IterationPriority, string> = {
  SSS: 'SSS',
  SS: 'SS',
  S: 'S',
  A: 'A',
  B: 'B',
  C: 'C',
};

export function parseIterationPriority(value: unknown): IterationPriority | null {
  if (value === 'SSS' || value === 'SS' || value === 'S' || value === 'A' || value === 'B' || value === 'C') return value;
  return null;
}

export const ITERATION_STATUS_LABEL: Record<IterationStatus, string> = {
  pending: '待开始',
  in_progress: '进行中',
  testing: '测试中',
  released: '已发布',
};

export const ITERATION_SCOPE_LABEL: Record<IterationNavScope, string> = {
  youbao: '右豹迭代',
  youboom: 'youboom迭代',
  system: '系统配置',
  mentor: '导师迭代',
};

export interface IterationSubRequirementRow {
  id: string;
  /** 子需求描述 */
  title: string;
  /** 子需求优先级，可空（继承父需求） */
  priority: IterationPriority | '';
  /** 产研人员 id */
  assigneeIds: string[];
  /** YYYY-MM-DD，可空 */
  dateStart: string;
  dateEnd: string;
  status: IterationStatus;
}

export interface IterationRecordRow {
  id: string;
  scope: IterationNavScope;
  /** 父需求（纯文本） */
  parentRequirement: string;
  /** 必填 */
  priority: IterationPriority;
  /** 选填，如 v1.2.0 */
  version: string;
  /** 按数组顺序为序号 1、2、… */
  subRequirements: IterationSubRequirementRow[];
  /** 无子需求或需在父需求上配置负责人时使用 */
  parentAssigneeIds: string[];
  parentDateStart: string;
  parentDateEnd: string;
  /** 详细规则（富文本 HTML） */
  detailRulesHtml: string;
  /** 整条迭代状态（与发布时间联动） */
  status: IterationStatus;
  /** ISO 8601；仅「已发布」时有值 */
  releaseTime: string;
  notesHtml: string;
  /** ISO 8601 */
  createdAt: string;
}

export type IterationSubRequirementFormItem = {
  id: string;
  title: string;
  priority: IterationPriority | '';
  assigneeIds: string[];
  dateStart: string;
  dateEnd: string;
  status: IterationStatus;
};

export type IterationRecordFormState = {
  parentRequirement: string;
  /** 必填；空串表示未选择（仅新建/校验前） */
  priority: IterationPriority | '';
  /** 选填 */
  version: string;
  subRequirements: IterationSubRequirementFormItem[];
  parentAssigneeIds: string[];
  parentDateStart: string;
  parentDateEnd: string;
  detailRulesHtml: string;
  status: IterationStatus;
  notesHtml: string;
};

/** 用于列表检索 */
export function iterationContentPlainText(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function iterationRecordSearchBlob(row: IterationRecordRow): string {
  const parts = [
    row.parentRequirement,
    ITERATION_PRIORITY_LABEL[row.priority],
    row.version,
    ...row.subRequirements.map((s) => s.title),
    iterationContentPlainText(row.detailRulesHtml),
    iterationContentPlainText(row.notesHtml),
  ];
  return parts.join(' ').toLowerCase();
}

export function newSubRequirementFormItem(): IterationSubRequirementFormItem {
  return {
    id: `isr-new-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title: '',
    priority: '',
    assigneeIds: [],
    dateStart: '',
    dateEnd: '',
    status: 'pending',
  };
}

export function emptyIterationRecordForm(): IterationRecordFormState {
  return {
    parentRequirement: '',
    priority: '',
    version: '',
    subRequirements: [],
    parentAssigneeIds: [],
    parentDateStart: '',
    parentDateEnd: '',
    detailRulesHtml: '<p><br></p>',
    status: 'pending',
    notesHtml: '<p><br></p>',
  };
}

function legacyPlainContentToHtml(s: string): string {
  const t = s.trim();
  if (!t) return '<p><br></p>';
  if (/<[a-z][\s\S]*>/i.test(t)) return t;
  return `<p>${t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
}

export function rowToIterationForm(row: IterationRecordRow): IterationRecordFormState {
  return {
    parentRequirement: row.parentRequirement,
    priority: row.priority ?? 'B',
    version: row.version ?? '',
    subRequirements: row.subRequirements.map((s) => ({
      id: s.id,
      title: s.title,
      priority: s.priority ?? '',
      assigneeIds: [...s.assigneeIds],
      dateStart: s.dateStart,
      dateEnd: s.dateEnd,
      status: s.status,
    })),
    parentAssigneeIds: [...row.parentAssigneeIds],
    parentDateStart: row.parentDateStart,
    parentDateEnd: row.parentDateEnd,
    detailRulesHtml: legacyPlainContentToHtml(row.detailRulesHtml),
    status: row.status,
    notesHtml: row.notesHtml || '<p><br></p>',
  };
}

function nowIso() {
  return new Date().toISOString();
}

function stableSubId(formId: string, index: number) {
  if (formId && !formId.startsWith('isr-new-')) return formId;
  return `isr-${Date.now()}-${index}-${Math.random().toString(16).slice(2, 6)}`;
}

export function createIterationRowFromForm(
  form: IterationRecordFormState,
  scope: IterationNavScope,
  id: string,
  prev: IterationRecordRow | null
): IterationRecordRow {
  const createdAt = prev?.createdAt ?? nowIso();
  let releaseTime = '';
  if (form.status === 'released') {
    if (prev?.status === 'released' && prev.releaseTime) {
      releaseTime = prev.releaseTime;
    } else {
      releaseTime = nowIso();
    }
  }
  const detailStored = form.detailRulesHtml.trim() || '<p><br></p>';
  const subs = form.subRequirements.map((s, i) => ({
    id: stableSubId(s.id, i),
    title: s.title.trim(),
    priority: parseIterationPriority(s.priority) ?? ('' as const),
    assigneeIds: [...new Set(s.assigneeIds.filter(Boolean))],
    dateStart: (s.dateStart || '').trim(),
    dateEnd: (s.dateEnd || '').trim(),
    status: s.status,
  }));
  const p = parseIterationPriority(form.priority);
  if (!p) throw new Error('createIterationRowFromForm: priority is required');
  return {
    id,
    scope,
    parentRequirement: form.parentRequirement.trim(),
    priority: p,
    version: (form.version ?? '').trim(),
    subRequirements: subs,
    parentAssigneeIds: [...new Set(form.parentAssigneeIds.filter(Boolean))],
    parentDateStart: (form.parentDateStart || '').trim(),
    parentDateEnd: (form.parentDateEnd || '').trim(),
    detailRulesHtml: detailStored,
    status: form.status,
    releaseTime,
    notesHtml: form.notesHtml.trim() || '<p><br></p>',
    createdAt,
  };
}

/** 从 localStorage 读到的旧版行（含 title / content 等） */
type LegacyIterationRecordRow = {
  id: string;
  scope: IterationNavScope;
  title: string;
  sections: string;
  content: string;
  developers: string;
  status: IterationStatus;
  releaseTime: string;
  notesHtml: string;
  createdAt: string;
};

export function migrateLegacyIterationRow(legacy: LegacyIterationRecordRow): IterationRecordRow {
  let parent = legacy.title.trim();
  if (legacy.sections.trim()) {
    parent += (parent ? '\n' : '') + `【涉及板块】${legacy.sections.trim()}`;
  }
  if (legacy.developers.trim()) {
    parent += (parent ? '\n' : '') + `【原记录开发人员】${legacy.developers.trim()}`;
  }
  const content = legacy.content.trim();
  const detailRulesHtml = content ? legacyPlainContentToHtml(legacy.content) : '<p><br></p>';
  return {
    id: legacy.id,
    scope: legacy.scope,
    parentRequirement: parent || legacy.title,
    priority: 'B',
    version: '',
    subRequirements: [],
    parentAssigneeIds: [],
    parentDateStart: '',
    parentDateEnd: '',
    detailRulesHtml,
    status: legacy.status,
    releaseTime: legacy.releaseTime,
    notesHtml: legacy.notesHtml || '<p><br></p>',
    createdAt: legacy.createdAt,
  };
}

const _iterationRecordsFromFile = _iterationRecordsSeedJson as unknown as IterationRecordRow[];

export const iterationRecordSeedData: IterationRecordRow[] = _iterationRecordsFromFile.length > 0
  ? _iterationRecordsFromFile
  : /* TS 硬编码兜底 */ [
  {
    id: 'ir-yb-1',
    scope: 'youbao',
    parentRequirement: '榜单导出字段调整',
    priority: 'SSS',
    version: 'v1.4.2',
    subRequirements: [
      {
        id: 'isr-yb-1a',
        title: '导出模板增加列',
        priority: '',
        assigneeIds: ['ps-1'],
        dateStart: '2026-03-25',
        dateEnd: '2026-03-30',
        status: 'released',
      },
    ],
    parentAssigneeIds: [],
    parentDateStart: '',
    parentDateEnd: '',
    detailRulesHtml: '<p>导出增加近30日收益列，与前台口径对齐。</p>',
    status: 'released',
    releaseTime: '2026-04-01T10:00:00.000Z',
    notesHtml: '<p>已通知运营核对历史导出文件。</p>',
    createdAt: '2026-03-28T08:00:00.000Z',
  },
  {
    id: 'ir-yb-2',
    scope: 'youbao',
    parentRequirement: '学院视频批量上传',
    priority: 'SS',
    version: '',
    subRequirements: [
      {
        id: 'isr-yb-2a',
        title: '多文件选择与队列 UI',
        priority: '',
        assigneeIds: ['ps-1', 'ps-2'],
        dateStart: '2026-04-05',
        dateEnd: '2026-04-12',
        status: 'testing',
      },
      {
        id: 'isr-yb-2b',
        title: '上传进度与失败重试',
        priority: '',
        assigneeIds: ['ps-2'],
        dateStart: '2026-04-08',
        dateEnd: '2026-04-15',
        status: 'in_progress',
      },
    ],
    parentAssigneeIds: [],
    parentDateStart: '',
    parentDateEnd: '',
    detailRulesHtml: '<p>支持一次选择多个视频，队列展示上传进度。</p>',
    status: 'testing',
    releaseTime: '',
    notesHtml: '<p><br></p>',
    createdAt: '2026-04-10T12:00:00.000Z',
  },
  {
    id: 'ir-yboom-1',
    scope: 'youboom',
    parentRequirement: '看板指标卡片',
    priority: 'A',
    version: 'v0.9.0',
    subRequirements: [],
    parentAssigneeIds: ['ps-4'],
    parentDateStart: '2026-04-10',
    parentDateEnd: '2026-04-20',
    detailRulesHtml: '<p>新增 DAU、留存卡片占位，待接入真实数据源。</p>',
    status: 'in_progress',
    releaseTime: '',
    notesHtml: '<p>设计稿：<strong>v2</strong></p>',
    createdAt: '2026-04-12T09:30:00.000Z',
  },
  {
    id: 'ir-sys-1',
    scope: 'system',
    parentRequirement: '规则说明搜索优化',
    priority: 'C',
    version: '',
    subRequirements: [
      {
        id: 'isr-sys-1a',
        title: '菜单与路由联合筛选',
        priority: '',
        assigneeIds: ['ps-1'],
        dateStart: '2026-04-12',
        dateEnd: '2026-04-18',
        status: 'pending',
      },
    ],
    parentAssigneeIds: ['ps-3'],
    parentDateStart: '',
    parentDateEnd: '',
    detailRulesHtml: '<p>菜单标题与路由键联合筛选，支持回车触发搜索。</p>',
    status: 'pending',
    releaseTime: '',
    notesHtml: '<p><br></p>',
    createdAt: '2026-04-13T15:00:00.000Z',
  },
  {
    id: 'ir-mentor-1',
    scope: 'mentor',
    parentRequirement: '门派管理列表上线',
    priority: 'SS',
    version: 'v2.0.0-beta',
    subRequirements: [
      {
        id: 'isr-m-1a',
        title: '门派介绍多 Tab',
        priority: '',
        assigneeIds: ['ps-4', 'ps-1'],
        dateStart: '2026-04-01',
        dateEnd: '2026-04-14',
        status: 'testing',
      },
    ],
    parentAssigneeIds: [],
    parentDateStart: '',
    parentDateEnd: '',
    detailRulesHtml: '<p>支持门派介绍多 Tab 配置与图文/视频文案。</p>',
    status: 'testing',
    releaseTime: '',
    notesHtml: '<p>联调中。</p>',
    createdAt: '2026-04-14T09:00:00.000Z',
  },
];
