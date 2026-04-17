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
  academyContents: 'ybdiedai-academy-contents-v1',
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
  if (!isStringArray(o.assigneeIds)) return null;
  if (typeof o.dateStart !== 'string' || typeof o.dateEnd !== 'string') return null;
  if (typeof o.status !== 'string' || !STATUSES.has(o.status as IterationStatus)) return null;
  return {
    id: o.id,
    title: o.title,
    priority: parseIterationPriority(o.priority) ?? '',
    assigneeIds: o.assigneeIds,
    dateStart: o.dateStart,
    dateEnd: o.dateEnd,
    status: o.status as IterationStatus,
  };
}

function parseNewIterationRow(o: Record<string, unknown>): IterationRecordRow | null {
  if (typeof o.id !== 'string' || !o.id) return null;
  if (typeof o.scope !== 'string' || !SCOPES.has(o.scope as IterationNavScope)) return null;
  if (typeof o.parentRequirement !== 'string') return null;
  const priority = parseIterationPriority(o.priority) ?? 'B';
  const version = typeof o.version === 'string' ? o.version : '';
  if (!Array.isArray(o.subRequirements)) return null;
  const subs = o.subRequirements.map(parseSubRequirement).filter(Boolean) as IterationSubRequirementRow[];
  if (subs.length !== o.subRequirements.length) return null;
  if (!isStringArray(o.parentAssigneeIds)) return null;
  if (typeof o.parentDateStart !== 'string' || typeof o.parentDateEnd !== 'string') return null;
  if (typeof o.detailRulesHtml !== 'string') return null;
  if (typeof o.status !== 'string' || !STATUSES.has(o.status as IterationStatus)) return null;
  if (typeof o.releaseTime !== 'string') return null;
  if (typeof o.notesHtml !== 'string') return null;
  if (typeof o.createdAt !== 'string' || !o.createdAt) return null;
  return {
    id: o.id,
    scope: o.scope as IterationNavScope,
    parentRequirement: o.parentRequirement,
    priority,
    version,
    subRequirements: subs,
    parentAssigneeIds: o.parentAssigneeIds,
    parentDateStart: o.parentDateStart,
    parentDateEnd: o.parentDateEnd,
    detailRulesHtml: o.detailRulesHtml,
    status: o.status as IterationStatus,
    releaseTime: o.releaseTime,
    notesHtml: o.notesHtml,
    createdAt: o.createdAt,
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
  if (typeof r.title !== 'string') return null;
  if (typeof r.sections !== 'string') return null;
  if (typeof r.content !== 'string') return null;
  if (typeof r.developers !== 'string') return null;
  if (typeof r.status !== 'string' || !STATUSES.has(r.status as IterationStatus)) return null;
  if (typeof r.releaseTime !== 'string') return null;
  if (typeof r.notesHtml !== 'string') return null;
  if (typeof r.createdAt !== 'string') return null;
  return migrateLegacyIterationRow(r as Parameters<typeof migrateLegacyIterationRow>[0]);
}

function normalizeIterationEntry(x: unknown): IterationRecordRow | null {
  if (typeof x !== 'object' || x === null) return null;
  const o = x as Record<string, unknown>;
  if (isLegacyIterationRow(o)) return parseLegacyIterationRow(o);
  return parseNewIterationRow(o);
}

/**
 * 未写入过 key 时用种子数据；已写入（含空数组）则按本机数据为准。
 * 若 JSON 结构损坏（条目无法通过校验）则回退种子，避免白屏。
 * 支持旧版「标题 / 涉及板块」结构自动迁移为新父需求 + 详细规则结构。
 */
export function loadIterationRecordsFromStorage(): IterationRecordRow[] {
  const parsed = readLocalJson<unknown>(STORAGE_KEYS.iterationRecords);
  if (parsed === null) return [...iterationRecordSeedData];
  if (!Array.isArray(parsed)) return [...iterationRecordSeedData];
  const rows: IterationRecordRow[] = [];
  for (const x of parsed) {
    const row = normalizeIterationEntry(x);
    if (!row) return [...iterationRecordSeedData];
    rows.push(row);
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
  if (rows.length !== parsed.length) return [...productStaffSeedData];
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
  return parsed as SectGuildRow[];
}

export function saveSectGuildToStorage(rows: SectGuildRow[]): void {
  writeLocalJson(STORAGE_KEYS.sectGuild, rows);
}

// ─── 奖励管理 ────────────────────────────────────────────────────────────────

/**
 * 加载奖励管理数据。
 * 若 localStorage 中的 seed 版本号与当前 REWARD_SEED_VERSION 不一致，
 * 说明 seed 文件已更新，自动用最新 seed 覆盖本地缓存并更新版本号。
 */
export function loadRewardManagementFromStorage(): RewardManagementRow[] {
  const storedVersion = readLocalJson<number>(STORAGE_KEYS.rewardManagementSeedVersion);
  const seedOutdated = storedVersion !== REWARD_SEED_VERSION;

  const parsed = readLocalJson<unknown>(STORAGE_KEYS.rewardManagement);
  if (parsed === null || !Array.isArray(parsed) || seedOutdated) {
    writeLocalJson(STORAGE_KEYS.rewardManagementSeedVersion, REWARD_SEED_VERSION);
    writeLocalJson(STORAGE_KEYS.rewardManagement, rewardManagementSeedData);
    return [...rewardManagementSeedData];
  }
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
  for (const x of parsed) {
    const row = normalizeProjectRow(x);
    if (!row) return [...projectManagementSeedData];
    rows.push(row);
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
  return parsed as YouboomTeamRow[];
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
