/** 客服管理 — 前端演示数据 */
import _customerServiceSeedJson from './mock/customer-service-seed.json';

export type CustomerServiceType = 'regular' | 'paid';
export type CustomerServiceStatus = 'enabled' | 'disabled';

export interface CustomerServiceRow {
  id: string;
  agentId: string;
  name: string;
  type: CustomerServiceType;
  feishuPhone: string;
  /** 演示：占位图或 data URL */
  wecomQrUrl: string;
  entryLink: string;
  userCount: number;
  status: CustomerServiceStatus;
  createdAt: string;
}

export const CS_TYPE_LABEL: Record<CustomerServiceType, string> = {
  regular: '普通客服',
  paid: '付费客服',
};

export const CS_STATUS_LABEL: Record<CustomerServiceStatus, string> = {
  enabled: '启用',
  disabled: '禁用',
};

const PLACEHOLDER_QR =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect fill="#f3f4f6" width="48" height="48"/><path fill="#9ca3af" d="M8 8h12v12H8V8zm20 0h12v12H28V8zM8 28h12v12H8V28zm16 0h4v4h-4v-4zm8 0h12v12H28V28z"/></svg>`
  );

const names = [
  '王小明',
  '李晓红',
  '张大伟',
  '陈静',
  '刘洋',
  '赵敏',
  '周杰',
  '吴芳',
  '郑强',
  '孙丽',
  '马超',
  '黄磊',
  '林雪',
  '何勇',
  '罗丹',
  '高强',
  '梁爽',
  '谢婷',
  '韩梅',
  '唐宁',
  '冯军',
  '于娜',
  '邓凯',
];

const _customerServiceFromFile = _customerServiceSeedJson as unknown as CustomerServiceRow[];

export function customerServiceSeedData(): CustomerServiceRow[] {
  if (_customerServiceFromFile.length > 0) return [..._customerServiceFromFile];
  return names.map((name, i) => {
    const id = `cs-${String(i + 1).padStart(3, '0')}`;
    const agentId = `agent-${1000 + i}`;
    const type: CustomerServiceType = i % 5 === 0 ? 'paid' : 'regular';
    const status: CustomerServiceStatus = i % 7 === 5 ? 'disabled' : 'enabled';
    const phone = type === 'paid' && i % 3 === 0 ? '' : `138${String(10000000 + i * 10001).slice(0, 8)}`;
    return {
      id,
      agentId,
      name,
      type,
      feishuPhone: phone,
      wecomQrUrl: PLACEHOLDER_QR,
      entryLink: `https://example.com/entry?agentId=${encodeURIComponent(agentId)}`,
      userCount: i % 4 === 0 ? 0 : (i * 3) % 20,
      status,
      createdAt: new Date(2026, 2, 1 + (i % 28), 9 + (i % 8), (i * 7) % 60).toISOString(),
    };
  });
}

export type CustomerServiceFormState = {
  name: string;
  type: CustomerServiceType;
  feishuPhone: string;
  wecomQrFileName: string;
  wecomQrPreviewUrl: string;
};

export function emptyCustomerServiceForm(): CustomerServiceFormState {
  return {
    name: '',
    type: 'regular',
    feishuPhone: '',
    wecomQrFileName: '',
    wecomQrPreviewUrl: '',
  };
}
