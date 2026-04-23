import { useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronUp,
  ChevronDown,
  Plus,
  Upload,
  X,
  Trash2,
  Search,
  HelpCircle,
} from 'lucide-react';
import { useResizableTableColumns, ColumnTipHeader } from './resizableTableColumns';
import { MenuRuleDescriptionModal } from './MenuRuleDescriptionModal';

// ─── 数据类型 ─────────────────────────────────────────────────────────────────

export type ProjectCustomizationStatus = 'enable' | 'disable';
export type BrandType = '国内' | '国外';
export type BizType = '推文' | '短剧' | '应用' | '游戏';

export interface ProjectCustomizationRow {
  id: string;
  userId: number;
  userNick: string;
  userRole: string;
  customProjectCount: number;
  totalSettlementDiff: number;
  status: ProjectCustomizationStatus;
  remark: string;
  creator: string;
  createdAt: string;
}

export interface CustomProjectItem {
  projectId: string;
  projectName: string;
  brandType: BrandType;
  bizType: BizType;
  ratio: number;
  totalDiff: number;
  status: ProjectCustomizationStatus;
  createdAt: string;
}

// ─── 字段说明 ─────────────────────────────────────────────────────────────────

const MAIN_FIELD_TIPS: Record<string, string> = {
  userId: '用户的系统唯一ID，精确标识一个用户',
  userNick: '用户在平台上的昵称',
  userRole: '用户当前所属身份组：普通会员、高级会员、核心高级会员、核心导师、商学院导师、合伙人、机构',
  customProjectCount: '该用户已配置定制结算的项目总数；点击可查看项目明细',
  totalSettlementDiff: '累计定制结算与普通结算之间的差额总和（实际多结算给用户的金额）',
  status: '启用时定制结算生效；禁用后恢复普通结算规则',
  remark: '内部备注信息，不展示给用户',
  creator: '配置该定制规则的操作人',
  createdAt: '记录创建时间',
};

const PROJ_FIELD_TIPS: Record<string, string> = {
  projectId: '项目系统ID',
  projectName: '项目名称',
  brandType: '项目所属品牌类型：国内或国外',
  bizType: '项目业务类型：推文、短剧、应用、游戏',
  ratio: '定制结算加成比例；用户实际单价 = 普通单价 × (1 + 比例%)',
  totalDiff: '该项目累计为该用户多结算的金额差额',
  status: '启用时该项目走定制结算；禁用后走普通结算',
  createdAt: '该定制规则的创建时间',
};

// ─── Mock 数据 ────────────────────────────────────────────────────────────────

const MOCK_ROWS: ProjectCustomizationRow[] = [
  { id: 'pc-1', userId: 100234, userNick: '张小明', userRole: '高级会员', customProjectCount: 5, totalSettlementDiff: 1280.5, status: 'enable', remark: '头部推文用户，定制优惠', creator: '管理员A', createdAt: '2026-03-01 10:00' },
  { id: 'pc-2', userId: 100456, userNick: '李晓红', userRole: '核心高级会员', customProjectCount: 3, totalSettlementDiff: 680.0, status: 'enable', remark: '', creator: '管理员B', createdAt: '2026-03-05 14:30' },
  { id: 'pc-3', userId: 100789, userNick: '赵明远', userRole: '核心导师', customProjectCount: 8, totalSettlementDiff: 3240.0, status: 'enable', remark: '签约KOL', creator: '管理员A', createdAt: '2026-03-10 09:15' },
  { id: 'pc-4', userId: 101010, userNick: '孙文静', userRole: '普通会员', customProjectCount: 2, totalSettlementDiff: 420.0, status: 'disable', remark: '暂停合作', creator: '管理员C', createdAt: '2026-03-12 16:00' },
  { id: 'pc-5', userId: 101234, userNick: '周建国', userRole: '合伙人', customProjectCount: 6, totalSettlementDiff: 2100.0, status: 'enable', remark: '', creator: '管理员A', createdAt: '2026-03-15 11:30' },
  { id: 'pc-6', userId: 101456, userNick: '吴丽华', userRole: '商学院导师', customProjectCount: 4, totalSettlementDiff: 890.5, status: 'enable', remark: '', creator: '管理员B', createdAt: '2026-03-20 08:45' },
  { id: 'pc-7', userId: 101678, userNick: '郑小刚', userRole: '机构', customProjectCount: 1, totalSettlementDiff: 150.0, status: 'disable', remark: '测试账号', creator: '管理员C', createdAt: '2026-03-25 13:00' },
  { id: 'pc-8', userId: 101890, userNick: '林美玲', userRole: '核心高级会员', customProjectCount: 7, totalSettlementDiff: 4560.0, status: 'enable', remark: '超级大V', creator: '管理员A', createdAt: '2026-04-01 17:20' },
];

const PROJECT_POOL = [
  { id: 'P001', name: '番茄小说', brand: '国内' as BrandType, biz: '推文' as BizType },
  { id: 'P002', name: '知乎故事', brand: '国内' as BrandType, biz: '推文' as BizType },
  { id: 'P003', name: '红果短剧', brand: '国内' as BrandType, biz: '短剧' as BizType },
  { id: 'P004', name: '番茄漫剧', brand: '国内' as BrandType, biz: '短剧' as BizType },
  { id: 'P005', name: '漫次元', brand: '国内' as BrandType, biz: '应用' as BizType },
  { id: 'P006', name: '知乎社区', brand: '国内' as BrandType, biz: '应用' as BizType },
  { id: 'P007', name: '即梦出境', brand: '国外' as BrandType, biz: '短剧' as BizType },
  { id: 'P008', name: 'TIKTOK', brand: '国外' as BrandType, biz: '推文' as BizType },
];

const MOCK_CUSTOM_PROJECTS: Record<string, CustomProjectItem[]> = {
  'pc-1': [
    { projectId: 'P001', projectName: '番茄小说', brandType: '国内', bizType: '推文', ratio: 20, totalDiff: 480.5, status: 'enable', createdAt: '2026-03-01' },
    { projectId: 'P002', projectName: '知乎故事', brandType: '国内', bizType: '推文', ratio: 15, totalDiff: 320.0, status: 'enable', createdAt: '2026-03-01' },
    { projectId: 'P003', projectName: '红果短剧', brandType: '国内', bizType: '短剧', ratio: 25, totalDiff: 280.0, status: 'enable', createdAt: '2026-03-02' },
    { projectId: 'P007', projectName: '即梦出境', brandType: '国外', bizType: '短剧', ratio: 10, totalDiff: 150.0, status: 'disable', createdAt: '2026-03-10' },
    { projectId: 'P008', projectName: 'TIKTOK', brandType: '国外', bizType: '推文', ratio: 18, totalDiff: 50.0, status: 'enable', createdAt: '2026-03-15' },
  ],
  'pc-8': [
    { projectId: 'P001', projectName: '番茄小说', brandType: '国内', bizType: '推文', ratio: 30, totalDiff: 1200.0, status: 'enable', createdAt: '2026-04-01' },
    { projectId: 'P003', projectName: '红果短剧', brandType: '国内', bizType: '短剧', ratio: 20, totalDiff: 800.0, status: 'enable', createdAt: '2026-04-01' },
    { projectId: 'P004', projectName: '番茄漫剧', brandType: '国内', bizType: '短剧', ratio: 15, totalDiff: 560.0, status: 'enable', createdAt: '2026-04-02' },
    { projectId: 'P005', projectName: '漫次元', brandType: '国内', bizType: '应用', ratio: 25, totalDiff: 640.0, status: 'enable', createdAt: '2026-04-05' },
    { projectId: 'P007', projectName: '即梦出境', brandType: '国外', bizType: '短剧', ratio: 20, totalDiff: 480.0, status: 'enable', createdAt: '2026-04-08' },
    { projectId: 'P008', projectName: 'TIKTOK', brandType: '国外', bizType: '推文', ratio: 18, totalDiff: 500.0, status: 'disable', createdAt: '2026-04-10' },
    { projectId: 'P006', projectName: '知乎社区', brandType: '国内', bizType: '应用', ratio: 22, totalDiff: 380.0, status: 'enable', createdAt: '2026-04-12' },
  ],
};

type LogEntry = { time: string; operator: string; action: string; detail: string };

const INITIAL_LOGS: Record<string, LogEntry[]> = {
  'pc-1': [
    { time: '2026-04-20 14:30', operator: '管理员A', action: '新增定制用户', detail: '' },
    { time: '2026-04-18 10:15', operator: '管理员A', action: '分配项目', detail: '番茄小说 结算比例 +20%' },
    { time: '2026-04-15 09:00', operator: '管理员B', action: '修改状态', detail: '启用 → 禁用' },
    { time: '2026-04-10 16:45', operator: '管理员A', action: '分配项目', detail: '知乎故事 结算比例 +15%' },
    { time: '2026-04-05 11:20', operator: '管理员C', action: '修改备注', detail: '备注内容已更新' },
  ],
};

function nowStr() {
  return new Date().toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).replace(/\//g, '-');
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function fmtMoney(n: number) {
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── 列宽默认值 ───────────────────────────────────────────────────────────────

const MAIN_COL_DEFAULTS = [100, 110, 90, 100, 130, 80, 160, 90, 140, 200];
const PROJ_COL_DEFAULTS = [80, 130, 80, 80, 90, 130, 80, 110, 120];

// ─── 系统表格样式常量 ─────────────────────────────────────────────────────────

const thBase = 'relative whitespace-nowrap px-3 py-3 text-left text-xs font-bold text-gray-900 dark:text-white/75 sm:px-4';
const thAction = 'sticky right-0 z-30 border-l border-line bg-gray-50/95 dark:bg-[#1a1d27]/95 px-3 py-3 text-right text-xs font-bold text-gray-900 dark:text-white/75 tracking-tight whitespace-nowrap shadow-[-8px_0_16px_-6px_rgba(0,0,0,0.10)] backdrop-blur-sm sm:px-4';
const tdBase = 'whitespace-nowrap px-3 py-3 text-sm text-gray-700 dark:text-white/65 sm:px-4 align-middle';
const tdAction = 'sticky right-0 z-20 border-l border-line bg-white dark:bg-[#1a1d27] px-3 py-3 text-right shadow-[-8px_0_16px_-6px_rgba(0,0,0,0.06)] group-hover:bg-gray-50/50 dark:group-hover:bg-white/4 sm:px-4 whitespace-nowrap align-middle';

// ─── 主页面 ───────────────────────────────────────────────────────────────────

export function ProjectCustomizationPage() {
  const rtc = useResizableTableColumns('project-customization-main', MAIN_COL_DEFAULTS);

  const [rows, setRows] = useState<ProjectCustomizationRow[]>(MOCK_ROWS);
  const [logs, setLogs] = useState<Record<string, LogEntry[]>>(INITIAL_LOGS);
  const [ruleOpen, setRuleOpen] = useState(false);

  function addLog(rowId: string, entry: Omit<LogEntry, 'time'>) {
    setLogs((prev) => ({
      ...prev,
      [rowId]: [{ ...entry, time: nowStr() }, ...(prev[rowId] ?? [])],
    }));
  }

  // 搜索
  const [searchUserIdDraft, setSearchUserIdDraft] = useState('');
  const [searchRoleDraft, setSearchRoleDraft] = useState('');
  const [searchApplied, setSearchApplied] = useState({ userId: '', role: '' });

  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 弹窗/抽屉状态
  type ModalMode = { open: true; editId: string | null; form: { userId: string; status: ProjectCustomizationStatus; remark: string } } | { open: false };
  const [modal, setModal] = useState<ModalMode>({ open: false });

  const [detailDrawer, setDetailDrawer] = useState<{ open: boolean; rowId: string | null }>({ open: false, rowId: null });
  const [assignModal, setAssignModal] = useState<{ open: boolean; rowId: string | null }>({ open: false, rowId: null });
  const [logModal, setLogModal] = useState<{ open: boolean; rowId: string | null }>({ open: false, rowId: null });

  // ── 过滤 & 分页 ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (searchApplied.userId && String(r.userId) !== searchApplied.userId.trim()) return false;
      if (searchApplied.role && r.userRole !== searchApplied.role) return false;
      return true;
    });
  }, [rows, searchApplied]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ── 新增/编辑 ────────────────────────────────────────────────────────────────

  function openAdd() {
    setModal({ open: true, editId: null, form: { userId: '', status: 'enable', remark: '' } });
  }

  function openEdit(row: ProjectCustomizationRow) {
    setModal({ open: true, editId: row.id, form: { userId: String(row.userId), status: row.status, remark: row.remark } });
  }

  function saveModal() {
    if (!modal.open) return;
    const { editId, form } = modal;
    if (!form.userId.trim()) { alert('请输入用户ID'); return; }
    if (editId) {
      setRows((prev) => prev.map((r) => r.id === editId ? { ...r, status: form.status, remark: form.remark } : r));
    } else {
      const newRow: ProjectCustomizationRow = {
        id: `pc-${Date.now()}`,
        userId: parseInt(form.userId, 10),
        userNick: `用户${form.userId}`,
        userRole: '普通会员',
        customProjectCount: 0,
        totalSettlementDiff: 0,
        status: form.status,
        remark: form.remark,
        creator: '当前用户',
        createdAt: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-'),
      };
      setRows((prev) => [newRow, ...prev]);
    }
    setModal({ open: false });
  }

  function deleteRow(id: string, nick: string) {
    if (!window.confirm(`确认删除定制用户「${nick}」？此操作不可撤销。`)) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function toggleStatus(row: ProjectCustomizationRow) {
    setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, status: r.status === 'enable' ? 'disable' : 'enable' } : r));
  }

  // ── 渲染 ─────────────────────────────────────────────────────────────────────

  const detailRow = rows.find((r) => r.id === detailDrawer.rowId) ?? null;
  const assignRow = rows.find((r) => r.id === assignModal.rowId) ?? null;
  const logRow = rows.find((r) => r.id === logModal.rowId) ?? null;

  return (
    <div className="space-y-5">
      {/* 标题 + 规则说明 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="text-xl font-bold text-ink">项目定制</h2>
            <button
              type="button"
              onClick={() => setRuleOpen(true)}
              className="text-sm font-medium text-accent hover:underline"
            >
              查看规则说明
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/40">
            对特定用户配置差异化结算比例；定制结算单价 = 普通单价 × (1 + 定制比例%)
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => alert('导入功能开发中')}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-white/6 dark:text-white/70 dark:hover:bg-white/10"
          >
            <Upload className="h-4 w-4" />
            导入
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" />
            新增
          </button>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="rounded-xl border border-line bg-gray-50/80 dark:bg-white/4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-white/50" style={{ minWidth: 180 }}>
            用户ID
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchUserIdDraft}
                onChange={(e) => setSearchUserIdDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (setSearchApplied({ userId: searchUserIdDraft, role: searchRoleDraft }), setCurrentPage(1))}
                placeholder="精确搜索用户ID"
                className="w-full rounded-lg border border-line bg-white dark:bg-white/6 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-accent/20"
              />
            </span>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-white/50">
            当前身份
            <select
              value={searchRoleDraft}
              onChange={(e) => setSearchRoleDraft(e.target.value)}
              className="min-w-[130px] cursor-pointer rounded-lg border border-line bg-white dark:bg-white/6 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="">全部</option>
              <option value="普通会员">普通会员</option>
              <option value="高级会员">高级会员</option>
              <option value="核心高级会员">核心高级会员</option>
              <option value="核心导师">核心导师</option>
              <option value="商学院导师">商学院导师</option>
              <option value="合伙人">合伙人</option>
              <option value="机构">机构</option>
            </select>
          </label>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => { setSearchUserIdDraft(''); setSearchRoleDraft(''); setSearchApplied({ userId: '', role: '' }); setCurrentPage(1); }}
              className="rounded-lg border border-line bg-white dark:bg-white/6 px-4 py-2 text-sm text-gray-600 dark:text-white/55 hover:bg-gray-50 dark:hover:bg-white/10"
            >
              重置
            </button>
            <button
              type="button"
              onClick={() => { setSearchApplied({ userId: searchUserIdDraft, role: searchRoleDraft }); setCurrentPage(1); }}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
            >
              查询
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-white/45">
        共 <span className="font-semibold text-gray-900 dark:text-white/85">{filtered.length}</span> 条记录
      </p>

      {/* 主数据表 */}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table
          className="app-data-table app-data-table--resizable w-full min-w-0 divide-y divide-line text-sm"
          style={{ minWidth: rtc.tableMinWidth }}
        >
          {rtc.colGroup}
          <thead className="bg-gray-50/90 dark:bg-white/4">
            <tr>
              <ColumnTipHeader label="用户ID" tip={MAIN_FIELD_TIPS.userId} className={thBase} resizeHandle={rtc.renderResizeHandle(0)} />
              <ColumnTipHeader label="用户昵称" tip={MAIN_FIELD_TIPS.userNick} className={thBase} resizeHandle={rtc.renderResizeHandle(1)} />
              <ColumnTipHeader label="当前身份" tip={MAIN_FIELD_TIPS.userRole} className={thBase} resizeHandle={rtc.renderResizeHandle(2)} />
              <ColumnTipHeader label="定制项目数" tip={MAIN_FIELD_TIPS.customProjectCount} className={thBase} resizeHandle={rtc.renderResizeHandle(3)} />
              <ColumnTipHeader label="累计结算差额" tip={MAIN_FIELD_TIPS.totalSettlementDiff} className={thBase} resizeHandle={rtc.renderResizeHandle(4)} />
              <ColumnTipHeader label="状态" tip={MAIN_FIELD_TIPS.status} className={thBase} resizeHandle={rtc.renderResizeHandle(5)} />
              <ColumnTipHeader label="备注" tip={MAIN_FIELD_TIPS.remark} className={thBase} resizeHandle={rtc.renderResizeHandle(6)} />
              <ColumnTipHeader label="创建人" tip={MAIN_FIELD_TIPS.creator} className={thBase} resizeHandle={rtc.renderResizeHandle(7)} />
              <ColumnTipHeader label="创建时间" tip={MAIN_FIELD_TIPS.createdAt} className={thBase} resizeHandle={rtc.renderResizeHandle(8)} />
              <th className={thAction}>
                操作
                {rtc.renderResizeHandle(9)}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white dark:bg-transparent">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-16 text-center text-sm text-gray-400">暂无数据</td>
              </tr>
            ) : (
              paged.map((row) => (
                <tr key={row.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/4 transition-colors">
                  <td className={tdBase}>
                    <span className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-mono font-semibold text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                      {row.userId}
                    </span>
                  </td>
                  <td className={tdBase + ' font-medium text-gray-900 dark:text-white/85'}>{row.userNick}</td>
                  <td className={tdBase}>
                    <RoleBadge role={row.userRole} />
                  </td>
                  <td className={tdBase}>
                    <button
                      type="button"
                      onClick={() => setDetailDrawer({ open: true, rowId: row.id })}
                      className="font-semibold text-accent underline underline-offset-2 hover:opacity-80 transition-opacity bg-transparent border-none cursor-pointer text-sm"
                    >
                      {row.customProjectCount} 个项目
                    </button>
                  </td>
                  <td className={tdBase + ' font-semibold text-emerald-600 dark:text-emerald-400'}>
                    {fmtMoney(row.totalSettlementDiff)}
                  </td>
                  <td className={tdBase}>
                    <StatusBadge status={row.status} />
                  </td>
                  <td className={tdBase + ' max-w-[180px] truncate text-gray-500 dark:text-white/40'}>
                    {row.remark || <span className="text-gray-300 dark:text-white/20">—</span>}
                  </td>
                  <td className={tdBase + ' text-gray-500 dark:text-white/40'}>{row.creator}</td>
                  <td className={tdBase + ' text-gray-500 dark:text-white/40'}>{row.createdAt}</td>
                  <td className={tdAction}>
                    <button type="button" onClick={() => openEdit(row)} className="text-accent text-xs hover:underline">编辑</button>
                    <span className="mx-2 text-gray-200 dark:text-white/15">|</span>
                    <button type="button" onClick={() => setAssignModal({ open: true, rowId: row.id })} className="text-accent text-xs hover:underline">定制项目</button>
                    <span className="mx-2 text-gray-200 dark:text-white/15">|</span>
                    <button type="button" onClick={() => toggleStatus(row)} className="text-accent text-xs hover:underline">
                      {row.status === 'enable' ? '禁用' : '启用'}
                    </button>
                    <span className="mx-2 text-gray-200 dark:text-white/15">|</span>
                    <button type="button" onClick={() => setLogModal({ open: true, rowId: row.id })} className="text-accent text-xs hover:underline">操作日志</button>
                    <span className="mx-2 text-gray-200 dark:text-white/15">|</span>
                    <button
                      type="button"
                      onClick={() => deleteRow(row.id, row.userNick)}
                      className="inline-flex items-center gap-0.5 text-xs text-red-600 hover:underline"
                    >
                      <Trash2 className="h-3 w-3" />
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-white/35">
            共 {filtered.length} 条，第 {currentPage}/{totalPages} 页
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-line px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-white/6 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ‹ 上一页
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                  p === currentPage ? 'bg-accent text-white' : 'border border-line text-gray-500 hover:bg-gray-50 dark:hover:bg-white/6'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-line px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-white/6 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              下一页 ›
            </button>
          </div>
        </div>
      )}

      {/* 规则说明弹窗 */}
      <MenuRuleDescriptionModal
        open={ruleOpen}
        navTitle="项目定制"
        routeKeys={['project-customization']}
        onClose={() => setRuleOpen(false)}
      />

      {/* ── 新增/编辑弹窗 ────────────────────────────────────────────────────── */}
      {modal.open &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-line bg-white dark:bg-[#1a1d27] shadow-xl">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h3 className="text-base font-bold text-ink">{modal.editId ? '编辑定制用户' : '新增定制用户'}</h3>
                <button type="button" onClick={() => setModal({ open: false })} className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-white/8">
                  <X className="h-4 w-4 text-gray-500 dark:text-white/45" />
                </button>
              </div>
              <div className="space-y-5 px-5 py-5">
                <FieldLine label="用户ID" required hint="用户系统ID，新增后不可修改">
                  <input
                    type="number"
                    placeholder="请输入用户ID（数字）"
                    value={modal.form.userId}
                    disabled={!!modal.editId}
                    onChange={(e) => setModal({ ...modal, form: { ...modal.form, userId: e.target.value } })}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/4"
                  />
                </FieldLine>
                <FieldLine label="状态" hint="启用时定制结算生效">
                  <div className="flex gap-2">
                    {(['enable', 'disable'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setModal({ ...modal, form: { ...modal.form, status: s } })}
                        className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all border ${
                          modal.form.status === s
                            ? 'bg-accent text-white border-accent'
                            : 'border-line text-gray-600 hover:border-accent hover:text-accent dark:text-white/55'
                        }`}
                      >
                        {s === 'enable' ? '启用' : '禁用'}
                      </button>
                    ))}
                  </div>
                </FieldLine>
                <FieldLine label="备注" hint="内部备注，不展示给用户">
                  <textarea
                    rows={3}
                    placeholder="选填，最多 100 字"
                    value={modal.form.remark}
                    onChange={(e) => setModal({ ...modal, form: { ...modal.form, remark: e.target.value } })}
                    className="w-full resize-none rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20 dark:bg-white/4"
                  />
                </FieldLine>
              </div>
              <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
                <button type="button" onClick={() => setModal({ open: false })} className="rounded-lg border border-line bg-white dark:bg-white/6 px-4 py-2 text-sm font-medium text-gray-700 dark:text-white/60 hover:bg-gray-50">
                  取消
                </button>
                <button type="button" onClick={saveModal} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90">
                  保存
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── 定制项目数详情 抽屉 ──────────────────────────────────────────────── */}
      {detailDrawer.open && detailRow &&
        createPortal(
          <DetailDrawer
            row={detailRow}
            onClose={() => setDetailDrawer({ open: false, rowId: null })}
            onAddLog={(entry) => addLog(detailRow.id, entry)}
          />,
          document.body
        )}

      {/* ── 分配项目弹窗 ─────────────────────────────────────────────────────── */}
      {assignModal.open &&
        createPortal(
          <AssignProjectModal row={assignRow} onClose={() => setAssignModal({ open: false, rowId: null })} />,
          document.body
        )}

      {/* ── 操作日志弹窗 ─────────────────────────────────────────────────────── */}
      {logModal.open && logRow &&
        createPortal(
          <LogModal
            row={logRow}
            logs={logs[logRow.id] ?? []}
            onClose={() => setLogModal({ open: false, rowId: null })}
          />,
          document.body
        )}
    </div>
  );
}

// ─── 身份徽标 ─────────────────────────────────────────────────────────────────

const ROLE_STYLE: Record<string, string> = {
  '普通会员':    'bg-gray-100 text-gray-600 dark:bg-white/8 dark:text-white/55',
  '高级会员':    'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  '核心高级会员': 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
  '核心导师':    'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  '商学院导师':  'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
  '合伙人':      'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  '机构':        'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
};

function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_STYLE[role] ?? 'bg-gray-100 text-gray-600 dark:bg-white/8 dark:text-white/55';
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${cls}`}>
      {role}
    </span>
  );
}

// ─── 状态徽标 ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProjectCustomizationStatus }) {
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
      status === 'enable'
        ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
        : 'bg-gray-100 text-gray-600 dark:bg-white/8 dark:text-white/40'
    }`}>
      {status === 'enable' ? '启用' : '禁用'}
    </span>
  );
}

// ─── 表单字段行 ───────────────────────────────────────────────────────────────

function FieldLine({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-white/65">
        <HelpCircle className="h-3.5 w-3.5 text-gray-400" title={hint} />
        {label}
        {required ? <span className="text-red-500">*</span> : null}
      </span>
      <div className="relative">{children}</div>
    </label>
  );
}

// ─── 定制项目详情抽屉 ─────────────────────────────────────────────────────────

function DetailDrawer({
  row,
  onClose,
  onAddLog,
}: {
  row: ProjectCustomizationRow;
  onClose: () => void;
  onAddLog: (entry: Omit<LogEntry, 'time'>) => void;
}) {
  const rtc = useResizableTableColumns('project-customization-detail', PROJ_COL_DEFAULTS);

  const [filterBrand, setFilterBrand] = useState('');
  const [filterBiz, setFilterBiz] = useState('');
  const [filterName, setFilterName] = useState('');
  const [diffSort, setDiffSort] = useState<'asc' | 'desc' | null>(null);
  const [localProjects, setLocalProjects] = useState<CustomProjectItem[]>(
    MOCK_CUSTOM_PROJECTS[row.id] ?? []
  );

  // 项目编辑弹窗状态
  const [editProj, setEditProj] = useState<{
    open: boolean;
    projectId: string;
    ratio: string;
    status: ProjectCustomizationStatus;
  } | null>(null);

  const filtered = useMemo(() => {
    let list = [...localProjects];
    if (filterBrand) list = list.filter((p) => p.brandType === filterBrand);
    if (filterBiz) list = list.filter((p) => p.bizType === filterBiz);
    if (filterName) list = list.filter((p) => p.projectName.includes(filterName));
    if (diffSort) list.sort((a, b) => diffSort === 'desc' ? b.totalDiff - a.totalDiff : a.totalDiff - b.totalDiff);
    return list;
  }, [localProjects, filterBrand, filterBiz, filterName, diffSort]);

  function openProjEdit(p: CustomProjectItem) {
    setEditProj({ open: true, projectId: p.projectId, ratio: String(p.ratio), status: p.status });
  }

  function saveProjEdit() {
    if (!editProj) return;
    const ratioNum = parseFloat(editProj.ratio);
    if (isNaN(ratioNum)) { alert('请输入有效的结算比例'); return; }
    const proj = localProjects.find((p) => p.projectId === editProj.projectId);
    if (!proj) return;

    const changes: string[] = [];
    if (ratioNum !== proj.ratio) changes.push(`结算比例 ${proj.ratio}% → ${ratioNum}%`);
    if (editProj.status !== proj.status) changes.push(`状态 ${proj.status === 'enable' ? '启用' : '禁用'} → ${editProj.status === 'enable' ? '启用' : '禁用'}`);

    setLocalProjects((prev) =>
      prev.map((p) =>
        p.projectId === editProj.projectId
          ? { ...p, ratio: ratioNum, status: editProj.status }
          : p
      )
    );

    if (changes.length > 0) {
      onAddLog({
        operator: '当前用户',
        action: '编辑项目结算规则',
        detail: `${proj.projectName}：${changes.join('；')}`,
      });
    }

    setEditProj(null);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-[900px] max-w-[95vw] flex-col border-l border-line bg-white dark:bg-[#1a1d27] shadow-2xl">
        {/* 抽屉头部 */}
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h3 className="text-base font-bold text-ink">{row.userNick} · 定制项目详情</h3>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-white/35">用户ID: {row.userId} · 共 {row.customProjectCount} 个定制项目</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-white/8">
            <X className="h-4 w-4 text-gray-500 dark:text-white/45" />
          </button>
        </div>

        {/* 筛选栏 */}
        <div className="flex flex-wrap items-end gap-3 border-b border-line bg-gray-50/80 dark:bg-white/4 px-6 py-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-white/50">
            品牌
            <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}
              className="rounded-lg border border-line bg-white dark:bg-white/6 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              style={{ minWidth: 120 }}
            >
              <option value="">全部品牌</option>
              <option value="国内">国内</option>
              <option value="国外">国外</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-white/50">
            业务类型
            <select value={filterBiz} onChange={(e) => setFilterBiz(e.target.value)}
              className="rounded-lg border border-line bg-white dark:bg-white/6 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              style={{ minWidth: 120 }}
            >
              <option value="">全部类型</option>
              <option value="推文">推文</option>
              <option value="短剧">短剧</option>
              <option value="应用">应用</option>
              <option value="游戏">游戏</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-white/50">
            项目名称
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="text" value={filterName} onChange={(e) => setFilterName(e.target.value)}
                placeholder="搜索项目名称"
                className="rounded-lg border border-line bg-white dark:bg-white/6 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-accent/20"
                style={{ width: 180 }}
              />
            </span>
          </label>
          <button type="button" onClick={() => { setFilterBrand(''); setFilterBiz(''); setFilterName(''); }}
            className="self-end rounded-lg border border-line bg-white dark:bg-white/6 px-4 py-2 text-sm text-gray-600 dark:text-white/55 hover:bg-gray-50 dark:hover:bg-white/10"
          >
            重置
          </button>
        </div>

        {/* 项目表格 */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="overflow-x-auto rounded-xl border border-line">
            <table
              className="app-data-table app-data-table--resizable w-full min-w-0 divide-y divide-line text-sm"
              style={{ minWidth: rtc.tableMinWidth }}
            >
              {rtc.colGroup}
              <thead className="bg-gray-50/90 dark:bg-white/4">
                <tr>
                  <ColumnTipHeader label="项目ID" tip={PROJ_FIELD_TIPS.projectId} className={thBase} resizeHandle={rtc.renderResizeHandle(0)} />
                  <ColumnTipHeader label="项目名称" tip={PROJ_FIELD_TIPS.projectName} className={thBase} resizeHandle={rtc.renderResizeHandle(1)} />
                  <ColumnTipHeader label="品牌类型" tip={PROJ_FIELD_TIPS.brandType} className={thBase} resizeHandle={rtc.renderResizeHandle(2)} />
                  <ColumnTipHeader label="业务类型" tip={PROJ_FIELD_TIPS.bizType} className={thBase} resizeHandle={rtc.renderResizeHandle(3)} />
                  <ColumnTipHeader label="结算比例" tip={PROJ_FIELD_TIPS.ratio} className={thBase} resizeHandle={rtc.renderResizeHandle(4)} />
                  <th
                    className={thBase + ' cursor-pointer select-none hover:text-accent transition-colors'}
                    onClick={() => setDiffSort((s) => (s === 'desc' ? 'asc' : 'desc'))}
                    style={{ position: 'relative' }}
                  >
                    <span className="flex items-center gap-1">
                      累计结算差额
                      <span className="flex flex-col">
                        <ChevronUp className={`h-3 w-3 ${diffSort === 'asc' ? 'text-accent' : 'text-gray-300'}`} />
                        <ChevronDown className={`h-3 w-3 -mt-1 ${diffSort === 'desc' ? 'text-accent' : 'text-gray-300'}`} />
                      </span>
                    </span>
                    {rtc.renderResizeHandle(5)}
                  </th>
                  <ColumnTipHeader label="状态" tip={PROJ_FIELD_TIPS.status} className={thBase} resizeHandle={rtc.renderResizeHandle(6)} />
                  <ColumnTipHeader label="创建时间" tip={PROJ_FIELD_TIPS.createdAt} className={thBase} resizeHandle={rtc.renderResizeHandle(7)} />
                  <th className={thAction}>操作{rtc.renderResizeHandle(8)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white dark:bg-transparent">
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="py-12 text-center text-sm text-gray-400">暂无符合条件的定制项目</td></tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.projectId} className="group hover:bg-gray-50/50 dark:hover:bg-white/4 transition-colors">
                      <td className={tdBase + ' font-mono text-xs text-gray-400 dark:text-white/30'}>{p.projectId}</td>
                      <td className={tdBase + ' font-medium text-gray-900 dark:text-white/85'}>{p.projectName}</td>
                      <td className={tdBase}>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          p.brandType === '国内'
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                            : 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'
                        }`}>{p.brandType}</span>
                      </td>
                      <td className={tdBase + ' text-gray-500 dark:text-white/55'}>{p.bizType}</td>
                      <td className={tdBase}>
                        <span className="font-semibold text-violet-600 dark:text-violet-400">+{p.ratio}%</span>
                      </td>
                      <td className={tdBase + ' font-semibold text-emerald-600 dark:text-emerald-400'}>
                        {fmtMoney(p.totalDiff)}
                      </td>
                      <td className={tdBase}><StatusBadge status={p.status} /></td>
                      <td className={tdBase + ' text-gray-400 dark:text-white/30'}>{p.createdAt}</td>
                      <td className={tdAction}>
                        <button type="button" onClick={() => openProjEdit(p)} className="text-accent text-xs hover:underline">
                          编辑
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 项目编辑弹窗（z-index 高于抽屉） */}
      {editProj?.open && (() => {
        const proj = localProjects.find((p) => p.projectId === editProj.projectId);
        if (!proj) return null;
        const ratioNum = editProj.ratio ? parseFloat(editProj.ratio) : null;
        return createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl border border-line bg-white dark:bg-[#1a1d27] shadow-xl">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div>
                  <h3 className="text-base font-bold text-ink">编辑项目结算规则</h3>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-white/35">{proj.projectName}</p>
                </div>
                <button type="button" onClick={() => setEditProj(null)} className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-white/8">
                  <X className="h-4 w-4 text-gray-500 dark:text-white/45" />
                </button>
              </div>
              <div className="space-y-5 px-5 py-5">
                <FieldLine label="结算比例" required hint="用户实际单价 = 普通单价 × (1 + 比例%)">
                  <div className="relative">
                    <input
                      type="number" min={0} max={500} step={0.1} placeholder="如：20"
                      value={editProj.ratio}
                      onChange={(e) => setEditProj({ ...editProj, ratio: e.target.value })}
                      className="w-full rounded-lg border border-line px-3 py-2 pr-8 text-sm outline-none focus:ring-2 focus:ring-accent/20 dark:bg-white/4"
                    />
                    <span className="absolute right-3 top-2.5 text-sm font-medium text-gray-400">%</span>
                  </div>
                  {ratioNum !== null && !isNaN(ratioNum) && (
                    <p className="mt-1.5 text-xs text-gray-400 dark:text-white/35">
                      示例：单价5元 × (1 + {ratioNum}%) = <span className="font-semibold text-accent">{(5 * (1 + ratioNum / 100)).toFixed(2)} 元</span>
                    </p>
                  )}
                </FieldLine>
                <FieldLine label="状态" hint="启用时该项目走定制结算">
                  <div className="flex gap-2">
                    {(['enable', 'disable'] as const).map((s) => (
                      <button key={s} type="button"
                        onClick={() => setEditProj({ ...editProj, status: s })}
                        className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all border ${
                          editProj.status === s ? 'bg-accent text-white border-accent' : 'border-line text-gray-600 hover:border-accent hover:text-accent dark:text-white/55'
                        }`}
                      >{s === 'enable' ? '启用' : '禁用'}</button>
                    ))}
                  </div>
                </FieldLine>
              </div>
              <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
                <button type="button" onClick={() => setEditProj(null)} className="rounded-lg border border-line bg-white dark:bg-white/6 px-4 py-2 text-sm font-medium text-gray-700 dark:text-white/60 hover:bg-gray-50">
                  取消
                </button>
                <button type="button" onClick={saveProjEdit} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90">
                  保存
                </button>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </>
  );
}

// ─── 分配项目弹窗 ─────────────────────────────────────────────────────────────

function AssignProjectModal({ row, onClose }: { row: ProjectCustomizationRow | null; onClose: () => void }) {
  const [brand, setBrand] = useState<BrandType>('国内');
  const [bizTypes, setBizTypes] = useState<Set<BizType>>(new Set(['推文']));
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [projSearch, setProjSearch] = useState('');
  const [status, setStatus] = useState<ProjectCustomizationStatus>('enable');
  const [ratio, setRatio] = useState('');

  const availableProjects = useMemo(() => {
    return PROJECT_POOL.filter(
      (p) => p.brand === brand && bizTypes.has(p.biz) && (!projSearch || p.name.includes(projSearch))
    );
  }, [brand, bizTypes, projSearch]);

  function toggleBiz(biz: BizType) {
    setBizTypes((prev) => { const next = new Set(prev); if (next.has(biz)) next.delete(biz); else next.add(biz); return next; });
    setSelectedProjects([]);
  }

  function toggleProject(id: string) {
    setSelectedProjects((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function handleSave() {
    if (!ratio || isNaN(parseFloat(ratio))) { alert('请填写结算比例'); return; }
    onClose();
  }

  if (!row) return null;

  const selectedNames = selectedProjects.map((id) => PROJECT_POOL.find((p) => p.id === id)?.name).filter(Boolean) as string[];
  const ratioNum = ratio ? parseFloat(ratio) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-line bg-white dark:bg-[#1a1d27] shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-ink">分配项目</h3>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-white/35">用户：{row.userNick}（ID: {row.userId}）</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-white/8">
            <X className="h-4 w-4 text-gray-500 dark:text-white/45" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          {/* 品牌类型 */}
          <FieldLine label="品牌类型" required hint="国内或国外品牌">
            <div className="flex gap-2">
              {(['国内', '国外'] as BrandType[]).map((b) => (
                <button key={b} type="button"
                  onClick={() => { setBrand(b); setSelectedProjects([]); }}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all border ${
                    brand === b ? 'bg-accent text-white border-accent' : 'border-line text-gray-600 hover:border-accent hover:text-accent dark:text-white/55'
                  }`}
                >{b}</button>
              ))}
            </div>
          </FieldLine>

          {/* 业务类型 */}
          <FieldLine label="业务类型" required hint="可多选，选择后项目列表会自动过滤">
            <div className="grid grid-cols-4 gap-2">
              {(['推文', '短剧', '应用', '游戏'] as BizType[]).map((biz) => (
                <button key={biz} type="button" onClick={() => toggleBiz(biz)}
                  className={`rounded-lg py-2 text-sm font-medium transition-all border ${
                    bizTypes.has(biz) ? 'bg-accent text-white border-accent' : 'border-line text-gray-600 hover:border-accent hover:text-accent dark:text-white/55'
                  }`}
                >{biz}</button>
              ))}
            </div>
          </FieldLine>

          {/* 选择项目 */}
          <FieldLine label="选择项目" hint="不选则对该业务类型下全部项目生效">
            <div className="overflow-hidden rounded-lg border border-line">
              <div className="flex items-center gap-2 border-b border-line px-3 py-2 bg-gray-50/60 dark:bg-white/4">
                <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="搜索项目名称…"
                  value={projSearch}
                  onChange={(e) => setProjSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 dark:text-white/70 placeholder:text-gray-400"
                />
              </div>
              <div className="max-h-[140px] overflow-y-auto p-1.5">
                {availableProjects.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-400">暂无符合条件的项目</p>
                ) : (
                  availableProjects.map((p) => (
                    <label key={p.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/4 transition-colors">
                      <input type="checkbox" checked={selectedProjects.includes(p.id)} onChange={() => toggleProject(p.id)} className="accent-accent h-3.5 w-3.5 cursor-pointer" />
                      <span className="text-gray-700 dark:text-white/70">{p.name}</span>
                      <span className="ml-auto text-xs text-gray-400">{p.biz}</span>
                    </label>
                  ))
                )}
              </div>
              <div className="border-t border-line px-3 py-2 min-h-[36px] bg-gray-50/30 dark:bg-white/2">
                {selectedNames.length === 0 ? (
                  <p className="text-xs text-gray-400">未选择项目，将对该业务类型全部项目生效</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs font-medium text-accent">已选 {selectedNames.length} 个：</span>
                    {selectedNames.map((name) => (
                      <span key={name} className="inline-block rounded bg-accent/10 px-1.5 py-0.5 text-xs text-accent">{name}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="mt-1.5 text-xs text-gray-400 dark:text-white/35">若不选择项目，则该业务类型下的所有项目均走定制结算</p>
          </FieldLine>

          {/* 结算比例 */}
          <FieldLine label="结算比例" required hint="用户实际单价 = 普通单价 × (1 + 比例%)">
            <div className="relative">
              <input
                type="number" min={0} max={500} step={0.1} placeholder="如：20"
                value={ratio}
                onChange={(e) => setRatio(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 pr-8 text-sm outline-none focus:ring-2 focus:ring-accent/20 dark:bg-white/4"
              />
              <span className="absolute right-3 top-2.5 text-sm font-medium text-gray-400">%</span>
            </div>
            {ratioNum !== null && !isNaN(ratioNum) && (
              <p className="mt-1.5 text-xs text-gray-400 dark:text-white/35">
                示例：单价5元 × (1 + {ratioNum}%) = <span className="font-semibold text-accent">{(5 * (1 + ratioNum / 100)).toFixed(2)} 元</span>
              </p>
            )}
          </FieldLine>

          {/* 状态 */}
          <FieldLine label="状态" hint="启用时结算规则立即生效">
            <div className="flex gap-2">
              {(['enable', 'disable'] as const).map((s) => (
                <button key={s} type="button" onClick={() => setStatus(s)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all border ${
                    status === s ? 'bg-accent text-white border-accent' : 'border-line text-gray-600 hover:border-accent hover:text-accent dark:text-white/55'
                  }`}
                >{s === 'enable' ? '启用' : '禁用'}</button>
              ))}
            </div>
          </FieldLine>
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-line bg-white dark:bg-white/6 px-4 py-2 text-sm font-medium text-gray-700 dark:text-white/60 hover:bg-gray-50">
            取消
          </button>
          <button type="button" onClick={handleSave} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90">
            保存分配
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 操作日志弹窗（数据表样式）────────────────────────────────────────────────

function LogModal({
  row,
  logs,
  onClose,
}: {
  row: ProjectCustomizationRow;
  logs: LogEntry[];
  onClose: () => void;
}) {

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-xl border border-line bg-white dark:bg-[#1a1d27] shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-ink">操作日志</h3>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-white/35">用户：{row.userNick}（ID: {row.userId}）</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-white/8">
            <X className="h-4 w-4 text-gray-500 dark:text-white/45" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-line text-sm">
            <thead className="bg-gray-50/90 dark:bg-white/4">
              <tr>
                <th className={thBase}>操作时间</th>
                <th className={thBase}>操作人</th>
                <th className={thBase}>操作类型</th>
                <th className={thBase}>操作详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white dark:bg-transparent">
              {logs.map((log, idx) => (
                <tr key={idx} className="group hover:bg-gray-50/50 dark:hover:bg-white/4 transition-colors">
                  <td className={tdBase + ' text-gray-500 dark:text-white/40 whitespace-nowrap'}>{log.time}</td>
                  <td className={tdBase + ' font-medium text-gray-800 dark:text-white/75'}>{log.operator}</td>
                  <td className={tdBase}>
                    <span className="rounded-md bg-accent/8 px-2 py-0.5 text-xs font-medium text-accent">{log.action}</span>
                  </td>
                  <td className={tdBase + ' text-gray-500 dark:text-white/40'}>
                    {log.detail || <span className="text-gray-300 dark:text-white/20">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end border-t border-line px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-line bg-white dark:bg-white/6 px-4 py-2 text-sm font-medium text-gray-700 dark:text-white/60 hover:bg-gray-50">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
