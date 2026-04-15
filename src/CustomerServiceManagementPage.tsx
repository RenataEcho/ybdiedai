import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useResizableTableColumns, ColumnTipHeader } from './resizableTableColumns';
import { createPortal } from 'react-dom';
import { ImagePlus, Plus, Search, Trash2, X, HelpCircle, Copy, QrCode } from 'lucide-react';
import { MenuRuleDescriptionModal } from './MenuRuleDescriptionModal';
import {
  CS_STATUS_LABEL,
  CS_TYPE_LABEL,
  type CustomerServiceRow,
  type CustomerServiceStatus,
  type CustomerServiceType,
  emptyCustomerServiceForm,
  type CustomerServiceFormState,
} from './customerServiceModel';
import {
  loadCustomerServiceFromStorage,
  saveCustomerServiceToStorage,
} from './localWorkspacePersistence';

const RULE_ROUTE_KEYS = ['customer-service-management'] as const;

const CS_MGMT_COL_DEFAULTS: number[] = [120, 100, 140, 88, 200, 88, 100, 160, 200];

/** 客服管理表格字段说明（悬浮提示） */
const CS_FIELD_TIPS: Record<string, string> = {
  name: '客服的展示姓名',
  type: '客服类型：普通客服或付费客服，影响用户归属与权限',
  feishuPhone: '客服绑定的飞书账号手机号，用于消息通知触达',
  wecomQr: '客服的企业微信二维码图片地址，用于投放与物料绑定',
  entryLink: '含 agentId 的专属录入 URL，用户扫码后即归属该客服',
  userCount: '当前归属该客服的已注册用户数（演示字段，实际以接口为准）',
  status: '启用时出现在用户归属选择中；禁用后不再对新用户展示',
  createdAt: '客服账号的创建时间',
};

const thBase =
  'relative whitespace-nowrap px-3 py-3 text-left text-xs font-bold text-gray-900 sm:px-4';
const thAction =
  'sticky right-0 z-30 border-l border-line bg-gray-50/95 px-3 py-3 text-right text-xs font-bold text-gray-900 tracking-tight whitespace-nowrap shadow-[-8px_0_16px_-6px_rgba(0,0,0,0.10)] backdrop-blur-sm sm:px-4';
const tdAction =
  'sticky right-0 z-20 border-l border-line bg-white px-3 py-3 text-right shadow-[-8px_0_16px_-6px_rgba(0,0,0,0.06)] group-hover:bg-gray-50/50 sm:px-4 whitespace-nowrap align-middle';

function formatTime(iso: string) {
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

export function CustomerServiceManagementPage() {
  const rtc = useResizableTableColumns('customer-service-management', CS_MGMT_COL_DEFAULTS);
  const [rows, setRows] = useState<CustomerServiceRow[]>(() => loadCustomerServiceFromStorage());

  useEffect(() => {
    saveCustomerServiceToStorage(rows);
  }, [rows]);
  const [keywordDraft, setKeywordDraft] = useState('');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerServiceStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | CustomerServiceType>('all');
  const [ruleOpen, setRuleOpen] = useState(false);
  const [modal, setModal] = useState<
    | { mode: 'create'; form: CustomerServiceFormState }
    | { mode: 'edit'; id: string; form: CustomerServiceFormState }
    | null
  >(null);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return rows.filter((r) => {
      const okName = !q || r.name.toLowerCase().includes(q);
      const okStatus = statusFilter === 'all' || r.status === statusFilter;
      const okType = typeFilter === 'all' || r.type === typeFilter;
      return okName && okStatus && okType;
    });
  }, [rows, keyword, statusFilter, typeFilter]);

  const openCreate = () => setModal({ mode: 'create', form: emptyCustomerServiceForm() });

  const openEdit = (row: CustomerServiceRow) =>
    setModal({
      mode: 'edit',
      id: row.id,
      form: {
        name: row.name,
        type: row.type,
        feishuPhone: row.feishuPhone,
        wecomQrFileName: row.wecomQrUrl.startsWith('data:') ? '' : '已上传',
        wecomQrPreviewUrl: row.wecomQrUrl,
      },
    });

  const saveModal = () => {
    if (!modal) return;
    const { form } = modal;
    const name = form.name.trim();
    if (!name) {
      alert('请输入客服名称');
      return;
    }
    if (name.length > 50) {
      alert('名称最多 50 字');
      return;
    }
    const phone = form.feishuPhone.trim();
    if (phone && !/^1\d{10}$/.test(phone)) {
      alert('飞书手机号需为 11 位大陆手机号或留空');
      return;
    }
    const qr = form.wecomQrPreviewUrl || rows[0]?.wecomQrUrl || '';

    if (modal.mode === 'create') {
      const agentId = `agent-${Date.now()}`;
      const id = `cs-${String(rows.length + 1).padStart(3, '0')}`;
      setRows((prev) => [
        {
          id,
          agentId,
          name,
          type: form.type,
          feishuPhone: phone,
          wecomQrUrl: qr,
          entryLink: `https://example.com/entry?agentId=${encodeURIComponent(agentId)}`,
          userCount: 0,
          status: 'enabled',
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } else {
      setRows((prev) =>
        prev.map((r) =>
          r.id === modal.id
            ? {
                ...r,
                name,
                type: form.type,
                feishuPhone: phone,
                wecomQrUrl: qr,
              }
            : r
        )
      );
    }
    setModal(null);
  };

  const toggleStatus = (row: CustomerServiceRow) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id ? { ...r, status: r.status === 'enabled' ? 'disabled' : 'enabled' } : r
      )
    );
  };

  const remove = (row: CustomerServiceRow) => {
    if (!window.confirm(`确定删除客服「${row.name}」？`)) return;
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  };

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      window.prompt('复制链接', link);
      return;
    }
    alert('已复制到剪贴板');
  };

  return (
    <div className="p-4 sm:p-5 space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="text-xl font-bold text-ink">客服管理</h2>
            <button
              type="button"
              onClick={() => setRuleOpen(true)}
              className="text-sm font-medium text-accent hover:underline"
            >
              查看规则说明
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            维护客服档案与企微二维码，供用户主档归属选择
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          新增客服
        </button>
      </div>

      <div className="rounded-xl border border-line bg-gray-50/80 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-medium text-gray-600">
            关键词
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={keywordDraft}
                onChange={(e) => setKeywordDraft(e.target.value)}
                placeholder="搜索客服名称"
                className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-accent/20"
              />
            </span>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            状态
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="min-w-[120px] cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">全部</option>
              <option value="enabled">{CS_STATUS_LABEL.enabled}</option>
              <option value="disabled">{CS_STATUS_LABEL.disabled}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            客服类型
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="min-w-[120px] cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">全部</option>
              <option value="regular">{CS_TYPE_LABEL.regular}</option>
              <option value="paid">{CS_TYPE_LABEL.paid}</option>
            </select>
          </label>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => {
                setKeywordDraft('');
                setKeyword('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className="rounded-lg border border-line bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              重置
            </button>
            <button
              type="button"
              onClick={() => setKeyword(keywordDraft)}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
            >
              查询
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        共 <span className="font-semibold text-gray-900">{filtered.length}</span> 名客服
      </p>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table
          className="app-data-table app-data-table--resizable w-full min-w-0 divide-y divide-line text-sm"
          style={{ minWidth: rtc.tableMinWidth }}
        >
          {rtc.colGroup}
          <thead className="bg-gray-50/90">
            <tr>
              <ColumnTipHeader label="客服名称" tip={CS_FIELD_TIPS.name} className={thBase} resizeHandle={rtc.renderResizeHandle(0)} />
              <ColumnTipHeader label="客服类型" tip={CS_FIELD_TIPS.type} className={thBase} resizeHandle={rtc.renderResizeHandle(1)} />
              <ColumnTipHeader label="飞书手机号" tip={CS_FIELD_TIPS.feishuPhone} className={thBase} resizeHandle={rtc.renderResizeHandle(2)} />
              <ColumnTipHeader label="企微二维码" tip={CS_FIELD_TIPS.wecomQr} className={thBase} resizeHandle={rtc.renderResizeHandle(3)} />
              <ColumnTipHeader label="信息录入专属码" tip={CS_FIELD_TIPS.entryLink} className={thBase} resizeHandle={rtc.renderResizeHandle(4)} />
              <ColumnTipHeader label="关联用户数" tip={CS_FIELD_TIPS.userCount} className={thBase} resizeHandle={rtc.renderResizeHandle(5)} />
              <ColumnTipHeader label="状态" tip={CS_FIELD_TIPS.status} className={thBase} resizeHandle={rtc.renderResizeHandle(6)} />
              <ColumnTipHeader label="创建时间" tip={CS_FIELD_TIPS.createdAt} className={thBase} resizeHandle={rtc.renderResizeHandle(7)} />
              <th className={thAction}>
                操作
                {rtc.renderResizeHandle(8)}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {filtered.map((row) => (
              <tr key={row.id} className="group hover:bg-gray-50/50">
                <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-900 sm:px-4">{row.name}</td>
                <td className="whitespace-nowrap px-3 py-3 text-gray-700 sm:px-4">{CS_TYPE_LABEL[row.type]}</td>
                <td className="whitespace-nowrap px-3 py-3 text-gray-600 sm:px-4">
                  {row.feishuPhone || '—'}
                </td>
                <td className="px-3 py-3 sm:px-4">
                  <img src={row.wecomQrUrl} alt="" className="h-10 w-10 rounded border border-line object-cover" />
                </td>
                <td className="px-3 py-3 sm:px-4">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => copyLink(row.entryLink)}
                      className="text-accent text-xs font-medium hover:underline"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Copy className="h-3 w-3" />
                        复制链接
                      </span>
                    </button>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-gray-700 sm:px-4">{row.userCount}</td>
                <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                      row.status === 'enabled' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {CS_STATUS_LABEL[row.status]}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-gray-600 sm:px-4">{formatTime(row.createdAt)}</td>
                <td className={tdAction}>
                  <button type="button" onClick={() => openEdit(row)} className="text-accent text-xs hover:underline">
                    编辑
                  </button>
                  <span className="mx-2 text-gray-200">|</span>
                  <button
                    type="button"
                    onClick={() => toggleStatus(row)}
                    className="text-accent text-xs hover:underline"
                  >
                    {row.status === 'enabled' ? '禁用' : '启用'}
                  </button>
                  <span className="mx-2 text-gray-200">|</span>
                  <button
                    type="button"
                    onClick={() => remove(row)}
                    className="inline-flex items-center gap-0.5 text-xs text-red-600 hover:underline"
                  >
                    <Trash2 className="h-3 w-3" />
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-gray-500">暂无数据</div>
        )}
      </div>

      <MenuRuleDescriptionModal
        open={ruleOpen}
        navTitle="客服管理"
        routeKeys={RULE_ROUTE_KEYS}
        onClose={() => setRuleOpen(false)}
      />

      {modal &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-line bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h3 className="text-lg font-bold text-ink">{modal.mode === 'create' ? '新增客服' : '编辑客服'}</h3>
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="rounded-full p-2 hover:bg-gray-100"
                  aria-label="关闭"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-5 px-5 py-5">
                <FieldLine label="客服名称" required hint="展示名称" counter={`${modal.form.name.length} / 50`}>
                  <input
                    type="text"
                    maxLength={50}
                    value={modal.form.name}
                    onChange={(e) => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })}
                    placeholder="请输入客服名称"
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </FieldLine>
                <FieldLine label="客服类型" required hint="影响归属与权限策略（演示）">
                  <select
                    value={modal.form.type}
                    onChange={(e) =>
                      setModal({
                        ...modal,
                        form: { ...modal.form, type: e.target.value as CustomerServiceType },
                      })
                    }
                    className="w-full cursor-pointer rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="regular">{CS_TYPE_LABEL.regular}</option>
                    <option value="paid">{CS_TYPE_LABEL.paid}</option>
                  </select>
                </FieldLine>
                <FieldLine label="飞书手机号" hint="选填">
                  <input
                    type="text"
                    value={modal.form.feishuPhone}
                    onChange={(e) =>
                      setModal({ ...modal, form: { ...modal.form, feishuPhone: e.target.value } })
                    }
                    placeholder="选填，11 位大陆手机号"
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </FieldLine>
                <div className="border-t border-line pt-4">
                  <p className="text-xs leading-relaxed text-gray-500">
                    保存后系统将分配信息录入专属链接（URL 含 agentId，与客服绑定）。
                  </p>
                  <div className="mt-4">
                    <FieldLine label="企微二维码" hint="jpg/png，最大 5MB（演示）">
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-line bg-gray-50/50 px-4 py-8 hover:bg-gray-50">
                        <ImagePlus className="mb-2 h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-600">点击上传</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            (e.target as HTMLInputElement).value = '';
                            if (!f) return;
                            if (f.size > 5 * 1024 * 1024) {
                              alert('文件需小于 5MB');
                              return;
                            }
                            const url = URL.createObjectURL(f);
                            setModal({
                              ...modal,
                              form: {
                                ...modal.form,
                                wecomQrFileName: f.name,
                                wecomQrPreviewUrl: url,
                              },
                            });
                          }}
                        />
                      </label>
                      {modal.form.wecomQrFileName ? (
                        <p className="mt-2 text-xs text-gray-500">已选：{modal.form.wecomQrFileName}</p>
                      ) : (
                        <p className="mt-2 text-xs text-gray-500">仅支持 jpg/png，最大 5MB</p>
                      )}
                    </FieldLine>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={saveModal}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
                >
                  保存
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function FieldLine({
  label,
  required,
  hint,
  counter,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  counter?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-1 text-xs font-medium text-gray-700">
        <HelpCircle className="h-3.5 w-3.5 text-gray-400" title={hint} />
        {label}
        {required ? <span className="text-red-500">*</span> : null}
      </span>
      <div className="relative">{children}</div>
      {counter ? <span className="block text-right text-[10px] text-gray-400">{counter}</span> : null}
    </label>
  );
}
