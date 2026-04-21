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
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = 'ybdiedai-saved-prototypes-v1';

export function loadPrototypes(): SavedPrototype[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePrototypes(list: SavedPrototype[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
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
    createdAt: now,
    updatedAt: now,
  };
}

export const PRODUCT_LINE_LABEL: Record<PrototypeProductLine, string> = {
  youbao: '右豹迭代',
  youboom: 'youboom迭代',
  mentor: '导师迭代',
};
