/** 系统配置 — 产研人员（迭代记录「开发人员」多选数据源） */
import _productStaffSeedJson from './mock/product-staff-seed.json';

export interface ProductStaffRow {
  id: string;
  name: string;
  /** 自定义职称文本 */
  title: string;
  /** ISO 8601 */
  createdAt: string;
}

export type ProductStaffFormState = {
  name: string;
  title: string;
};

export function emptyProductStaffForm(): ProductStaffFormState {
  return { name: '', title: '' };
}

export function rowToProductStaffForm(row: ProductStaffRow): ProductStaffFormState {
  return { name: row.name, title: row.title };
}

function nowIso() {
  return new Date().toISOString();
}

export function createProductStaffRow(
  form: ProductStaffFormState,
  id: string,
  prev: ProductStaffRow | null
): ProductStaffRow {
  return {
    id,
    name: form.name.trim(),
    title: form.title.trim(),
    createdAt: prev?.createdAt ?? nowIso(),
  };
}

const _productStaffFromFile = _productStaffSeedJson as unknown as ProductStaffRow[];

export const productStaffSeedData: ProductStaffRow[] = _productStaffFromFile.length > 0
  ? _productStaffFromFile
  : [
  { id: 'ps-1',  name: 'Echo', title: '产品负责人', createdAt: '2026-04-15T08:00:00.000Z' },
  { id: 'ps-2',  name: '小宇', title: '产品经理',   createdAt: '2026-04-15T08:00:00.000Z' },
  { id: 'ps-3',  name: '威林', title: '测试总监',   createdAt: '2026-04-15T08:00:00.000Z' },
  { id: 'ps-4',  name: '欣华', title: '开发负责人', createdAt: '2026-04-15T08:00:00.000Z' },
  { id: 'ps-5',  name: '国维', title: '后端开发',   createdAt: '2026-04-15T08:00:00.000Z' },
  { id: 'ps-6',  name: '老胡', title: '后端开发',   createdAt: '2026-04-15T08:00:00.000Z' },
  { id: 'ps-7',  name: '梦梦', title: '后端开发',   createdAt: '2026-04-15T08:00:00.000Z' },
  { id: 'ps-8',  name: '秋瑾', title: '前端开发',   createdAt: '2026-04-15T08:00:00.000Z' },
  { id: 'ps-9',  name: '治国', title: '后端开发',   createdAt: '2026-04-15T08:00:00.000Z' },
  { id: 'ps-10', name: '才金', title: '前端开发',   createdAt: '2026-04-15T08:00:00.000Z' },
  { id: 'ps-11', name: '郭鑫', title: '前端开发',   createdAt: '2026-04-15T08:00:00.000Z' },
  { id: 'ps-12', name: '自伟', title: '安卓原生',   createdAt: '2026-04-15T08:00:00.000Z' },
  { id: 'ps-13', name: '火辉', title: 'IOS原生',    createdAt: '2026-04-15T08:00:00.000Z' },
  { id: 'ps-14', name: '永伟', title: '后端开发',   createdAt: '2026-04-15T08:00:00.000Z' },
  { id: 'ps-15', name: '泽杰', title: '后端开发',   createdAt: '2026-04-15T08:00:00.000Z' },
];
