import seedData from './mock/saved-prototypes-seed.json';

export type PrototypeProductLine = 'youbao' | 'youboom' | 'mentor';

export type RequirementType = 'new-menu' | 'existing-feature';

/** 原型设计模式：管理后台 or 移动端（H5） */
export type DesignMode = 'admin' | 'mobile';

export type SavedPrototype = {
  id: string;
  queueId?: string;
  name: string;
  productLine: PrototypeProductLine;
  html: string;
  description: string;
  menuPath?: string;
  requirementType?: RequirementType;
  /** 设计模式：admin = 管理后台，mobile = 移动端 H5 */
  designMode?: DesignMode;
  /**
   * 审核状态切换标签列表，格式：[{ key: 'idle', label: '待提交' }, ...]
   * 对应原型 HTML 中 switchState() 函数的参数
   */
  stateLabels?: { key: string; label: string }[];
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = 'ybdiedai-saved-prototypes-v1';
const SEED_PROTOTYPES = seedData as SavedPrototype[];

/**
 * 种子文件中需要强制用 seed.html 覆盖 localStorage 版本的条目 id 集合。
 * 用于在不改变条目 id 的前提下更新原型 HTML 样式。
 */
const SEED_HTML_FORCE_OVERRIDE_IDS = new Set([
  'proto-seed-1776765797857-bind-mentor',
  'proto-seed-1776842596641-entry-audit',
]);

/**
 * 加载已保存原型：以 localStorage 为主，种子文件补漏。
 * 种子文件中的条目若已在 localStorage 中存在（按 id 或 queueId 匹配），则以 localStorage 为准。
 * 这样即使 localStorage 被清空，种子文件也能保底恢复数据。
 */
export function loadPrototypes(): SavedPrototype[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const local: SavedPrototype[] = raw
      ? Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : []
      : [];

    const localById = new Map(local.map((p) => [p.id, p]));
    const localByQueueId = new Map(
      local.filter((p) => p.queueId).map((p) => [p.queueId!, p])
    );

    let changed = false;
    const merged = [...local];

    for (const seed of SEED_PROTOTYPES) {
      const existing = localById.get(seed.id) ?? (seed.queueId ? localByQueueId.get(seed.queueId) : undefined);
      if (!existing) {
        // 种子中有但 localStorage 中没有的条目，补充进来
        merged.push(seed);
        changed = true;
      } else if (seed.updatedAt > existing.updatedAt) {
        // 种子版本比 localStorage 版本更新，用种子覆盖（保留 localStorage 中用户未改动的字段）
        const idx = merged.findIndex((p) => p.id === existing.id);
        if (idx !== -1) {
          merged[idx] = { ...existing, ...seed };
          changed = true;
        }
      } else if (SEED_HTML_FORCE_OVERRIDE_IDS.has(seed.id) && existing.html !== seed.html) {
        // 强制用种子 html 覆盖（颜色/样式更新），保留其他字段不变
        const idx = merged.findIndex((p) => p.id === existing.id);
        if (idx !== -1) {
          merged[idx] = { ...existing, html: seed.html };
          changed = true;
        }
      }
    }

    if (!changed) return local;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // localStorage 写入失败时静默忽略，不影响读取
    }
    return merged;
  } catch {
    return SEED_PROTOTYPES;
  }
}

export function savePrototypes(list: SavedPrototype[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  // 同步写入种子文件（dev 环境），防止 localStorage 清空后数据丢失
  void fetch('/__dev/api/save-prototype-seeds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prototypes: list }),
  }).catch(() => {
    // 非 dev 环境或网络失败时静默忽略
  });
}

export function createPrototype(
  name: string,
  productLine: PrototypeProductLine,
  html: string,
  description: string,
  queueId?: string,
  menuPath?: string,
  requirementType?: RequirementType,
  designMode?: DesignMode,
  stateLabels?: { key: string; label: string }[],
): SavedPrototype {
  const now = Date.now();
  return {
    id: `proto-${now}-${Math.random().toString(36).slice(2, 7)}`,
    queueId,
    name,
    productLine,
    html,
    description,
    menuPath,
    requirementType,
    designMode,
    stateLabels,
    createdAt: now,
    updatedAt: now,
  };
}

export const PRODUCT_LINE_LABEL: Record<PrototypeProductLine, string> = {
  youbao: '右豹迭代',
  youboom: 'youboom迭代',
  mentor: '导师迭代',
};
