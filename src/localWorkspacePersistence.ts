/**
 * 本地工作台数据：统一用 localStorage 立即持久化（与规则说明页一致）。
 * 字段说明另可在 dev 下尝试写入仓库 json（见 persistFieldConfigDescriptions）。
 */

import type {
  IterationNavScope,
  IterationRecordRow,
  IterationStatus,
  IterationSubRequirementRow,
} from './iterationRecordModel';
import {
  iterationRecordSeedData,
  ITERATION_SCOPE_LABEL,
  ITERATION_STATUS_LABEL,
  migrateLegacyIterationRow,
  parseIterationPriority,
} from './iterationRecordModel';
import type { ProductStaffRow } from './productStaffModel';
import { productStaffSeedData } from './productStaffModel';
import type { SectGuildRow } from './sectGuildModel';
import { sectGuildSeedData } from './sectGuildModel';
import type { RewardManagementRow } from './rewardManagementModel';
import { rewardManagementSeedData, REWARD_SEED_VERSION } from './rewardManagementModel';
import type { ProjectManagementRow } from './projectManagementModel';
import { projectManagementSeedData, normalizeProjectManagementDetail } from './projectManagementModel';
import type { CustomerServiceRow } from './customerServiceModel';
import { customerServiceSeedData } from './customerServiceModel';
import type { YouboomTeamRow } from './youboomTeamModel';
import { youboomTeamSeedData } from './youboomTeamModel';
import type { AcademyCategory, AcademyContent } from './mockData';
import { academyCategoryInitialData, academyContentInitialData } from './mockData';

export const STORAGE_KEYS = {
  fieldConfigDescriptionOverrides: 'ybdiedai-field-config-description-overrides',
  fieldConfigLegacyFull: 'ybdiedai-field-configurations',
  pageRuleOverrides: 'ybdiedai-page-rule-overrides-v1',
  iterationRecords: 'ybdiedai-iteration-records-v1',
  productStaff: 'ybdiedai-product-staff-v2',
  sectGuild: 'ybdiedai-sect-guild-v2',
  rewardManagement: 'ybdiedai-reward-management-v1',
  rewardManagementSeedVersion: 'ybdiedai-reward-management-seed-version',
  projectManagement: 'ybdiedai-project-management-v1',
  customerService: 'ybdiedai-customer-service-v1',
  youboomTeam: 'ybdiedai-youboom-team-v1',
  academyCategories: 'ybdiedai-academy-categories-v1',
  academyContents: 'ybdiedai-academy-contents-v2',
} as const;

/** 与历史代码、控制台同步 snippet 兼容 */
export const PAGE_RULE_OVERRIDES_STORAGE_KEY = STORAGE_KEYS.pageRuleOverrides;

export function writeLocalJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[localWorkspace] 写入失败', key, e);
  }
}

export function readLocalJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

const SCOPES = new Set(Object.keys(ITERATION_SCOPE_LABEL) as IterationNavScope[]);
const STATUSES = new Set(Object.keys(ITERATION_STATUS_LABEL) as IterationStatus[]);

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((i) => typeof i === 'string');
}

function parseSubRequirement(x: unknown): IterationSubRequirementRow | null {
  if (typeof x !== 'object' || x === null) return null;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== 'string' || !o.id) return null;
  if (typeof o.title !== 'string') return null;
  // dateStart/dateEnd 缺失时兼容为空字符串
  const dateStart = typeof o.dateStart === 'string' ? o.dateStart : '';
  const dateEnd = typeof o.dateEnd === 'string' ? o.dateEnd : '';
  // status 缺失或非法时兼容为 pending
  const status: IterationStatus = (typeof o.status === 'string' && STATUSES.has(o.status as IterationStatus))
    ? (o.status as IterationStatus)
    : 'pending';
  return {
    id: o.id,
    title: o.title,
    // descriptionHtml 是后加字段，旧数据中可能缺失，兼容处理为空字符串
    descriptionHtml: typeof o.descriptionHtml === 'string' ? o.descriptionHtml : '',
    priority: parseIterationPriority(o.priority) ?? '',
    // productOwnerIds 是新增字段，旧数据中可能缺失，兼容回退为空数组
    productOwnerIds: isStringArray(o.productOwnerIds) ? o.productOwnerIds : [],
    // assigneeIds 缺失或格式异常时兼容为空数组，不再让整条记录解析失败
    assigneeIds: isStringArray(o.assigneeIds) ? o.assigneeIds : [],
    dateStart,
    dateEnd,
    status,
  };
}

function parseNewIterationRow(o: Record<string, unknown>): IterationRecordRow | null {
  // 只有 id、scope 是真正不可缺少的核心字段，其余均兼容处理
  if (typeof o.id !== 'string' || !o.id) return null;
  if (typeof o.scope !== 'string' || !SCOPES.has(o.scope as IterationNavScope)) return null;
  const priority = parseIterationPriority(o.priority) ?? 'B';
  const version = typeof o.version === 'string' ? o.version : '';
  const rawSubs = Array.isArray(o.subRequirements) ? o.subRequirements : [];
  const subs = rawSubs.map(parseSubRequirement).filter(Boolean) as IterationSubRequirementRow[];
  const status: IterationStatus = (typeof o.status === 'string' && STATUSES.has(o.status as IterationStatus))
    ? (o.status as IterationStatus)
    : 'pending';
  return {
    id: o.id,
    scope: o.scope as IterationNavScope,
    parentRequirement: typeof o.parentRequirement === 'string' ? o.parentRequirement : '',
    priority,
    version,
    subRequirements: subs,
    parentProductOwnerIds: isStringArray(o.parentProductOwnerIds) ? o.parentProductOwnerIds : [],
    parentAssigneeIds: isStringArray(o.parentAssigneeIds) ? o.parentAssigneeIds : [],
    parentDateStart: typeof o.parentDateStart === 'string' ? o.parentDateStart : '',
    parentDateEnd: typeof o.parentDateEnd === 'string' ? o.parentDateEnd : '',
    detailRulesHtml: typeof o.detailRulesHtml === 'string' ? o.detailRulesHtml : '<p><br></p>',
    status,
    releaseTime: typeof o.releaseTime === 'string' ? o.releaseTime : '',
    notesHtml: typeof o.notesHtml === 'string' ? o.notesHtml : '<p><br></p>',
    createdAt: typeof o.createdAt === 'string' && o.createdAt ? o.createdAt : new Date().toISOString(),
  };
}

function isLegacyIterationRow(o: Record<string, unknown>): boolean {
  return typeof o.title === 'string' && typeof o.parentRequirement !== 'string';
}

function parseLegacyIterationRow(o: unknown): IterationRecordRow | null {
  if (typeof o !== 'object' || o === null) return null;
  const r = o as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id) return null;
  if (typeof r.scope !== 'string' || !SCOPES.has(r.scope as IterationNavScope)) return null;
  // 兼容缺失字段，回退空字符串，不整条丢弃
  const normalized = {
    ...r,
    title: typeof r.title === 'string' ? r.title : '',
    sections: typeof r.sections === 'string' ? r.sections : '',
    content: typeof r.content === 'string' ? r.content : '',
    developers: typeof r.developers === 'string' ? r.developers : '',
    status: (typeof r.status === 'string' && STATUSES.has(r.status as IterationStatus)) ? r.status : 'pending',
    releaseTime: typeof r.releaseTime === 'string' ? r.releaseTime : '',
    notesHtml: typeof r.notesHtml === 'string' ? r.notesHtml : '<p><br></p>',
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
  };
  return migrateLegacyIterationRow(normalized as Parameters<typeof migrateLegacyIterationRow>[0]);
}

function normalizeIterationEntry(x: unknown): IterationRecordRow | null {
  if (typeof x !== 'object' || x === null) return null;
  const o = x as Record<string, unknown>;
  if (isLegacyIterationRow(o)) return parseLegacyIterationRow(o);
  return parseNewIterationRow(o);
}

/**
 * 未写入过 key 时用种子数据；已写入（含空数组）则按本机数据为准。
 * 单条解析失败时跳过该条并打印警告，保留其余数据，不再整批回退种子。
 * 支持旧版「标题 / 涉及板块」结构自动迁移为新父需求 + 详细规则结构。
 *
 * 种子合并策略：种子文件中存在、但 localStorage 里没有的 id，会被追加到末尾。
 * 这样「保存到仓库」写入新条目后，刷新页面即可自动同步，无需手动清空 localStorage。
 */
export function loadIterationRecordsFromStorage(): IterationRecordRow[] {
  const parsed = readLocalJson<unknown>(STORAGE_KEYS.iterationRecords);
  if (parsed === null) return [...iterationRecordSeedData];
  if (!Array.isArray(parsed)) return [...iterationRecordSeedData];
  const rows: IterationRecordRow[] = [];
  let skipped = 0;
  for (const x of parsed) {
    const row = normalizeIterationEntry(x);
    if (!row) { skipped++; continue; }
    rows.push(row);
  }
  if (skipped > 0) {
    console.warn(`[localWorkspace] 迭代记录：${skipped} 条数据因字段不兼容已跳过（其余 ${rows.length} 条已保留）`);
  }
  // 全部条目都解析失败时才回退种子，保护用户数据
  if (rows.length === 0 && parsed.length > 0) return [...iterationRecordSeedData];

  // 将种子文件中有、但 localStorage 中没有的条目追加进来（按 id 去重）
  // 解决「保存到仓库后刷新数据消失」的问题：新写入 seed.json 的条目会被自动补入
  const existingIds = new Set(rows.map((r) => r.id));
  let merged = false;
  for (const seedRow of iterationRecordSeedData) {
    if (!existingIds.has(seedRow.id)) {
      rows.push(seedRow);
      merged = true;
    }
  }

  // 对已有条目：如果 localStorage 里某子需求的 descriptionHtml 为空，
  // 而 seed 里同 id 的子需求有内容，则用 seed 内容回填（修复历史旧数据缺图问题）
  const seedById = new Map(iterationRecordSeedData.map((r) => [r.id, r]));
  for (const row of rows) {
    const seedRow = seedById.get(row.id);
    if (!seedRow) continue;
    const seedSubMap = new Map(seedRow.subRequirements.map((s) => [s.id, s]));
    let rowPatched = false;
    for (const sub of row.subRequirements) {
      if (!sub.descriptionHtml) {
        const seedSub = seedSubMap.get(sub.id);
        if (seedSub?.descriptionHtml) {
          sub.descriptionHtml = seedSub.descriptionHtml;
          rowPatched = true;
        }
      }
    }
    if (rowPatched) merged = true;
  }

  // 有新条目补入或字段回填时立即写回 localStorage，确保下次刷新也能读到
  if (merged) {
    writeLocalJson(STORAGE_KEYS.iterationRecords, rows);
  }

  return rows;
}

export function saveIterationRecordsToStorage(rows: IterationRecordRow[]): void {
  writeLocalJson(STORAGE_KEYS.iterationRecords, rows);
}

function isProductStaffRow(x: unknown): x is ProductStaffRow {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== 'string' || !o.id) return false;
  if (typeof o.name !== 'string') return false;
  if (typeof o.title !== 'string') return false;
  if (typeof o.createdAt !== 'string') return false;
  return true;
}

export function loadProductStaffFromStorage(): ProductStaffRow[] {
  const parsed = readLocalJson<unknown>(STORAGE_KEYS.productStaff);
  if (parsed === null) return [...productStaffSeedData];
  if (!Array.isArray(parsed)) return [...productStaffSeedData];
  const rows = parsed.filter(isProductStaffRow);
  const skipped = parsed.length - rows.length;
  if (skipped > 0) {
    console.warn(`[localWorkspace] 产研人员：${skipped} 条数据因字段不兼容已跳过`);
  }
  if (rows.length === 0 && parsed.length > 0) return [...productStaffSeedData];
  // 种子中有但 localStorage 没有的条目，自动追加
  const existingIds = new Set(rows.map((r) => r.id));
  for (const seedRow of productStaffSeedData) {
    if (!existingIds.has(seedRow.id)) rows.push(seedRow);
  }
  return rows;
}

export function saveProductStaffToStorage(rows: ProductStaffRow[]): void {
  writeLocalJson(STORAGE_KEYS.productStaff, rows);
}

/** 仅写 localStorage（字段说明覆盖表） */
export function writeFieldConfigDescriptionOverridesToStorage(overrides: Record<string, string>): void {
  writeLocalJson(STORAGE_KEYS.fieldConfigDescriptionOverrides, overrides);
}

// ─── 门派管理 ────────────────────────────────────────────────────────────────

export function loadSectGuildFromStorage(): SectGuildRow[] {
  const parsed = readLocalJson<unknown>(STORAGE_KEYS.sectGuild);
  if (parsed === null) return [...sectGuildSeedData];
  if (!Array.isArray(parsed)) return [...sectGuildSeedData];
  const rows = parsed as SectGuildRow[];
  // 种子中有但 localStorage 没有的条目，自动追加
  const existingIds = new Set(rows.map((r) => r.id));
  for (const seedRow of sectGuildSeedData) {
    if (!existingIds.has(seedRow.id)) rows.push(seedRow);
  }
  return rows;
}

export function saveSectGuildToStorage(rows: SectGuildRow[]): void {
  writeLocalJson(STORAGE_KEYS.sectGuild, rows);
}

// ─── 奖励管理 ────────────────────────────────────────────────────────────────

/**
 * 加载奖励管理数据。
 * 用户已有本机数据时始终优先保留，版本号变更只更新版本记录，不覆盖用户数据。
 * 仅在 localStorage 中完全没有数据（首次访问）时才写入种子数据。
 */
export function loadRewardManagementFromStorage(): RewardManagementRow[] {
  const parsed = readLocalJson<unknown>(STORAGE_KEYS.rewardManagement);
  // 首次访问：写入种子数据并记录版本
  if (parsed === null || !Array.isArray(parsed)) {
    writeLocalJson(STORAGE_KEYS.rewardManagementSeedVersion, REWARD_SEED_VERSION);
    writeLocalJson(STORAGE_KEYS.rewardManagement, rewardManagementSeedData);
    return [...rewardManagementSeedData];
  }
  // 有用户数据：始终保留，仅同步版本号（不覆盖数据）
  writeLocalJson(STORAGE_KEYS.rewardManagementSeedVersion, REWARD_SEED_VERSION);
  return parsed as RewardManagementRow[];
}

export function saveRewardManagementToStorage(rows: RewardManagementRow[]): void {
  writeLocalJson(STORAGE_KEYS.rewardManagement, rows);
}

// ─── 项目管理 ────────────────────────────────────────────────────────────────

function normalizeProjectRow(x: unknown): ProjectManagementRow | null {
  if (typeof x !== 'object' || x === null) return null;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== 'string' || !o.id) return null;
  return {
    ...(o as unknown as ProjectManagementRow),
    detail: normalizeProjectManagementDetail(o.detail),
  };
}

export function loadProjectManagementFromStorage(): ProjectManagementRow[] {
  const parsed = readLocalJson<unknown>(STORAGE_KEYS.projectManagement);
  if (parsed === null) return [...projectManagementSeedData];
  if (!Array.isArray(parsed)) return [...projectManagementSeedData];
  const rows: ProjectManagementRow[] = [];
  let skipped = 0;
  for (const x of parsed) {
    const row = normalizeProjectRow(x);
    if (!row) { skipped++; continue; }
    rows.push(row);
  }
  if (skipped > 0) {
    console.warn(`[localWorkspace] 项目管理：${skipped} 条数据因字段不兼容已跳过`);
  }
  if (rows.length === 0 && parsed.length > 0) return [...projectManagementSeedData];
  // 种子中有但 localStorage 没有的条目，自动追加
  const existingIds = new Set(rows.map((r) => r.id));
  for (const seedRow of projectManagementSeedData) {
    if (!existingIds.has(seedRow.id)) rows.push(seedRow);
  }
  return rows;
}

export function saveProjectManagementToStorage(rows: ProjectManagementRow[]): void {
  writeLocalJson(STORAGE_KEYS.projectManagement, rows);
}

// ─── 客服管理 ────────────────────────────────────────────────────────────────

export function loadCustomerServiceFromStorage(): CustomerServiceRow[] {
  const parsed = readLocalJson<unknown>(STORAGE_KEYS.customerService);
  if (parsed === null) return customerServiceSeedData();
  if (!Array.isArray(parsed)) return customerServiceSeedData();
  return parsed as CustomerServiceRow[];
}

export function saveCustomerServiceToStorage(rows: CustomerServiceRow[]): void {
  writeLocalJson(STORAGE_KEYS.customerService, rows);
}

// ─── youboom 团队 ────────────────────────────────────────────────────────────

export function loadYouboomTeamFromStorage(): YouboomTeamRow[] {
  const parsed = readLocalJson<unknown>(STORAGE_KEYS.youboomTeam);
  if (parsed === null) return [...youboomTeamSeedData];
  if (!Array.isArray(parsed)) return [...youboomTeamSeedData];
  const rows = parsed as YouboomTeamRow[];
  // 种子中有但 localStorage 没有的条目，自动追加
  const existingIds = new Set(rows.map((r) => r.id));
  for (const seedRow of youboomTeamSeedData) {
    if (!existingIds.has(seedRow.id)) rows.push(seedRow);
  }
  return rows;
}

export function saveYouboomTeamToStorage(rows: YouboomTeamRow[]): void {
  writeLocalJson(STORAGE_KEYS.youboomTeam, rows);
}

// ─── 商学院分类 ──────────────────────────────────────────────────────────────

export function loadAcademyCategoriesFromStorage(): AcademyCategory[] {
  const parsed = readLocalJson<unknown>(STORAGE_KEYS.academyCategories);
  if (parsed === null) return [...academyCategoryInitialData];
  if (!Array.isArray(parsed)) return [...academyCategoryInitialData];
  return parsed as AcademyCategory[];
}

export function saveAcademyCategoriesToStorage(rows: AcademyCategory[]): void {
  writeLocalJson(STORAGE_KEYS.academyCategories, rows);
}

// ─── 商学院内容 ──────────────────────────────────────────────────────────────

export function loadAcademyContentsFromStorage(): AcademyContent[] {
  const parsed = readLocalJson<unknown>(STORAGE_KEYS.academyContents);
  if (parsed === null) return [...academyContentInitialData];
  if (!Array.isArray(parsed)) return [...academyContentInitialData];
  return parsed as AcademyContent[];
}

export function saveAcademyContentsToStorage(rows: AcademyContent[]): void {
  writeLocalJson(STORAGE_KEYS.academyContents, rows);
}
