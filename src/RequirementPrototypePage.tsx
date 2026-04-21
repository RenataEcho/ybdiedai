/**
 * 需求原型设计 — 对话模式
 *
 * 工作流：
 * 1. 着陆页选择产品线 + 需求类型
 * 2. 新功能菜单：对话框输入需求描述 → 进入队列 → Cursor AI 生成 HTML → 预览 → 加入菜单
 *    已有功能调整：对话框顶部内联多选目标菜单 → 输入调整描述 → 进入队列 →
 *                 Cursor AI 直接修改对应源文件 → 完成后标记 done → 加入菜单
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send, Wand2, Loader2, CheckCircle2, Code2,
  Plus, Trash2, Copy, ArrowLeft, BookOpen,
  Layers, ExternalLink, Sparkles, Monitor, ChevronRight, User,
  FolderTree, Zap, X, Check, Edit3, FileEdit,
  Bot, Cpu, Globe, Rocket, TrendingUp, Users, GraduationCap,
  Smartphone, LayoutDashboard,
} from 'lucide-react';
import {
  type SavedPrototype,
  type PrototypeProductLine,
  type RequirementType,
  type DesignMode,
  loadPrototypes,
  savePrototypes,
  createPrototype,
  PRODUCT_LINE_LABEL,
} from './savedPrototypesModel';

// ─── Types ────────────────────────────────────────────────────────────────────

type QueueItem = {
  id: string;
  productLine: PrototypeProductLine;
  name: string;
  requirement: string;
  requirementType?: RequirementType;
  /** 设计模式：admin = 管理后台，mobile = 移动端 */
  designMode?: DesignMode;
  /** 已有功能需求：选中的菜单 key 列表 */
  targetMenuKeys?: string[];
  /** 已有功能需求：对应的实际源文件路径列表（供 Cursor AI 直接修改） */
  sourceFiles?: string[];
  status: 'pending' | 'done' | 'reverted';
  html: string | null;
  createdAt: number;
  updatedAt: number;
};

type MsgStatus = 'sending' | 'pending' | 'done' | 'reverted' | 'error';

type ChatMsg = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  queueId?: string;
  status?: MsgStatus;
  html?: string;
  productLine?: PrototypeProductLine;
  name?: string;
  requirementType?: RequirementType;
  designMode?: DesignMode;
  targetMenuKeys?: string[];
  sourceFiles?: string[];
};

type View = 'landing' | 'designing';
type ActiveTab = 'chat' | 'preview' | 'library';

// 对话步骤：当前仅保留聊天态，需求类型前置到 landing 内完成
type ChatStep = 'chatting';

type NavigableModule =
  | 'leaderboard' | 'recommendation' | 'academy'
  | 'rewardManagement' | 'youboomTeam' | 'projectManagement'
  | 'sectManagement' | 'customerServiceManagement'
  | 'auditEntryWorkbench' | 'auditMessageNotification';

type Props = {
  onPrototypeSaved: (proto: SavedPrototype) => void;
  onNavigateToModule?: (module: NavigableModule, subKey?: string) => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS: Record<PrototypeProductLine, string> = {
  youbao: '#6366f1', youboom: '#0ea5e9', mentor: '#22c55e',
};

const PL_DESC: Record<PrototypeProductLine, string> = {
  youbao: '面向右豹核心业务：榜单数据、首页推荐、学院管理、项目管理等',
  youboom: '面向 youboom 业务：奖励管理、团队数据、增长运营等',
  mentor: '面向导师系统：门派管理、客服管理、审核工作台、消息通知等',
};

const QUICK: Record<PrototypeProductLine, string[]> = {
  youbao: ['设计一个用户积分榜单页面', '设计一个内容推荐位管理页面', '设计一个项目进度追踪看板'],
  youboom: ['设计一个奖励发放审核页面', '设计一个团队业绩数据大屏', '设计一个达人激励排行榜'],
  mentor: ['设计一个付费记录管理页面', '设计一个导师认证审核页面', '设计一个客服工单管理系统'],
};

/** 业务线 Landing 卡片的视觉配置（支持未来扩展，只需在此追加） */
const PL_CARD_CONFIG: Record<PrototypeProductLine, {
  gradient: string;        // 卡片渐变背景
  glowColor: string;       // hover 光晕颜色
  icon: React.ElementType; // 主图标
  tags: string[];          // 功能标签
}> = {
  youbao: {
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
    glowColor: 'rgba(99,102,241,0.35)',
    icon: TrendingUp,
    tags: ['榜单数据', '内容推荐', '学院管理', '项目看板'],
  },
  youboom: {
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #22d3ee 100%)',
    glowColor: 'rgba(14,165,233,0.35)',
    icon: Rocket,
    tags: ['奖励管理', '团队数据', '增长运营', '达人激励'],
  },
  mentor: {
    gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #4ade80 100%)',
    glowColor: 'rgba(34,197,94,0.35)',
    icon: GraduationCap,
    tags: ['门派管理', '客服管理', '审核工台', '消息通知'],
  },
};

const WORKFLOW_STEPS = ['描述需求', '进入队列', 'AI 生成', '预览结果', '加入菜单'];

const DESIGN_PROGRESS = [
  '正在解析需求，理解页面目标…',
  '正在规划整体布局与导航结构…',
  '正在设计核心功能模块与字段…',
  '正在生成表格、表单、操作按钮…',
  '正在完善响应式样式与交互细节…',
  '最后润色中，原型即将就绪…',
];

// 各产品线的已有菜单列表（用于「已有功能需求」内联多选）
const EXISTING_MENUS: Record<PrototypeProductLine, { key: string; label: string; desc: string }[]> = {
  youbao: [
    { key: 'leaderboard', label: '榜单数据', desc: '个人/团队/社群收益排名榜单' },
    { key: 'community', label: '品牌社群', desc: '品牌社群列表与关联数据' },
    { key: 'brand', label: '品牌推荐', desc: '品牌推广项目推荐位管理' },
    { key: 'drama', label: '剧作推荐', desc: '剧作推广任务推荐位管理' },
    { key: 'category', label: '剧作分类', desc: '剧作题材分类配置' },
    { key: 'academy-category', label: '分类管理', desc: '商学院栏目分类配置' },
    { key: 'academy-content', label: '内容配置', desc: '商学院内容上传与配置' },
  ],
  youboom: [
    { key: 'reward-management', label: '奖励管理', desc: '奖励发放审批与记录' },
    { key: 'youboom-team', label: '团队数据', desc: '团队成员与业绩数据' },
    { key: 'project-management', label: '项目管理', desc: '增长项目进度追踪' },
  ],
  mentor: [
    { key: 'sect-guild', label: '门派管理', desc: '门派/公会信息与成员管理' },
    { key: 'customer-service-management', label: '客服管理', desc: '客服账号与归属配置' },
    { key: 'audit-entry-workbench', label: '录入审核工作台', desc: '用户录入单审核操作' },
    { key: 'audit-message-notification', label: '消息通知记录', desc: '飞书推送日志与状态' },
  ],
};

/**
 * 已有菜单 → 对应前端实现源文件
 * 已有功能需求提交时携带此信息，Cursor AI 直接修改源文件，而非重新生成 HTML
 */
const MENU_SOURCE_FILES: Record<string, string[]> = {
  // 右豹
  leaderboard:          ['src/App.tsx'],
  community:            ['src/App.tsx'],
  brand:                ['src/App.tsx'],
  drama:                ['src/App.tsx'],
  category:             ['src/App.tsx'],
  'academy-category':   ['src/App.tsx'],
  'academy-content':    ['src/App.tsx'],
  // youboom
  'reward-management':  ['src/RewardManagementViews.tsx', 'src/App.tsx'],
  'youboom-team':       ['src/YouboomTeamViews.tsx', 'src/App.tsx'],
  'project-management': ['src/ProjectManagementViews.tsx', 'src/App.tsx'],
  // mentor
  'sect-guild':                    ['src/SectGuildViews.tsx', 'src/sectGuildModel.ts', 'src/App.tsx'],
  'customer-service-management':   ['src/CustomerServiceManagementPage.tsx'],
  'audit-entry-workbench':         ['src/EntryAuditWorkbenchPage.tsx', 'src/EntryAuditDetailPage.tsx'],
  'audit-message-notification':    ['src/MessageNotificationRecordsPage.tsx'],
};

/**
 * 已有菜单 key → App 的 ModuleType（供完成后跳转使用）
 * subKey 用于有二级 Tab 的模块（如 leaderboard 下的 community、recommendation 下的 brand/drama/category）
 */
const MENU_NAV_TARGET: Record<string, { module: NavigableModule; subKey?: string; label: string }> = {
  leaderboard:                    { module: 'leaderboard',                  label: '榜单数据' },
  community:                      { module: 'leaderboard',  subKey: 'community', label: '品牌社群' },
  brand:                          { module: 'recommendation', subKey: 'brand',   label: '品牌推荐' },
  drama:                          { module: 'recommendation', subKey: 'drama',   label: '剧作推荐' },
  category:                       { module: 'recommendation', subKey: 'category',label: '剧作分类' },
  'academy-category':             { module: 'academy', subKey: 'academy-category', label: '分类管理' },
  'academy-content':              { module: 'academy', subKey: 'academy-content',  label: '内容配置' },
  'reward-management':            { module: 'rewardManagement',             label: '奖励管理' },
  'youboom-team':                 { module: 'youboomTeam',                  label: '团队数据' },
  'project-management':           { module: 'projectManagement',            label: '项目管理' },
  'sect-guild':                   { module: 'sectManagement',               label: '门派管理' },
  'customer-service-management':  { module: 'customerServiceManagement',    label: '客服管理' },
  'audit-entry-workbench':        { module: 'auditEntryWorkbench',          label: '录入审核工作台' },
  'audit-message-notification':   { module: 'auditMessageNotification',     label: '消息通知记录' },
};

// ─── API ──────────────────────────────────────────────────────────────────────

async function pushQueue(item: Omit<QueueItem, 'status' | 'html' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
  try {
    const r = await fetch('/__dev/api/prototype-queue/push', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item),
    });
    return r.ok;
  } catch { return false; }
}

async function fetchQueue(): Promise<QueueItem[]> {
  try {
    const r = await fetch('/__dev/api/prototype-queue');
    if (!r.ok) return [];
    const d = await r.json() as { ok: boolean; queue: QueueItem[] };
    return d.queue ?? [];
  } catch { return []; }
}

async function deleteQueueItem(id: string) {
  try {
    await fetch('/__dev/api/prototype-queue/delete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    });
  } catch { /* ignore */ }
}

async function revertQueueItem(id: string): Promise<boolean> {
  try {
    const r = await fetch('/__dev/api/prototype-queue/revert', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    });
    return r.ok;
  } catch { return false; }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeWorkflowStep(messages: ChatMsg[]): number {
  if (messages.length === 0) return 0;
  const aiMsgs = messages.filter((m) => m.role === 'ai');
  if (aiMsgs.some((m) => m.status === 'error')) return 0;
  if (aiMsgs.some((m) => m.status === 'pending')) return 2;
  if (aiMsgs.some((m) => m.status === 'done' && m.html)) return 3;
  return 1;
}

// ─── 加入菜单弹窗 ──────────────────────────────────────────────────────────────

function AddToMenuModal({
  msg,
  color,
  productLine,
  onConfirm,
  onCancel,
}: {
  msg: ChatMsg;
  color: string;
  productLine: PrototypeProductLine;
  onConfirm: (menuPath: string) => void;
  onCancel: () => void;
}) {
  // 用菜单 label（而非 key）作为默认路径
  const defaultPath = msg.targetMenuKeys?.length
    ? msg.targetMenuKeys
        .map((k) => EXISTING_MENUS[productLine].find((m) => m.key === k)?.label ?? k)
        .join(' / ')
    : '';
  const [menuPath, setMenuPath] = useState(defaultPath);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-md mx-4 rounded-2xl border border-line bg-white dark:bg-[#1a1d27] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${color}18` }}
            >
              <FolderTree className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">
                {msg.requirementType === 'existing-feature' ? '确认使用' : '加入菜单'}
              </p>
              <p className="text-xs text-gray-400 dark:text-white/30">
                {msg.requirementType === 'existing-feature'
                  ? '确认后修改将保留，并记录到菜单'
                  : '确认后 AI 将原型转为 TSX 代码集成到对应菜单'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white/70 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* 原型名称预览 */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/4">
            <Monitor className="w-3.5 h-3.5 text-gray-400 dark:text-white/30 shrink-0" />
            <span className="text-xs text-gray-600 dark:text-white/50 truncate">{msg.name ?? '未命名原型'}</span>
          </div>

          {/* 菜单路径输入 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-white/50 mb-1.5">
              菜单路径
              <span className="text-red-400 ml-0.5">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={menuPath}
              onChange={(e) => setMenuPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && menuPath.trim()) onConfirm(menuPath.trim());
                if (e.key === 'Escape') onCancel();
              }}
              placeholder="例如：右豹迭代 / 榜单数据 / 积分榜"
              className="w-full text-sm rounded-xl border border-line bg-gray-50 dark:bg-white/4 px-3 py-2.5 text-ink placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
            />
            <p className="mt-1.5 text-[10px] text-gray-400 dark:text-white/25">
              用「/」分隔层级，例如：产品线 / 模块 / 功能名
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-line flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              if (menuPath.trim()) onConfirm(menuPath.trim());
            }}
            disabled={!menuPath.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: menuPath.trim() ? `linear-gradient(135deg,${color},#8b5cf6)` : undefined }}
          >
            <Check className="w-3.5 h-3.5" />
            确认加入
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── 需求类型选择（对话前置步骤） ───────────────────────────────────────────────

function RequirementTypeSelector({
  productLine,
  color,
  onSelectNew,
  onSelectExisting,
}: {
  productLine: PrototypeProductLine;
  color: string;
  onSelectNew: () => void;
  onSelectExisting: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: `linear-gradient(135deg,${color},#8b5cf6)` }}
      >
        <Wand2 className="w-6 h-6 text-white" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-ink mb-1">选择需求类型</p>
        <p className="text-xs text-gray-500 dark:text-white/40 max-w-sm">
          选择你的需求类型，AI 会以不同方式帮你完成原型设计
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
        {/* 新功能菜单需求 */}
        <button
          type="button"
          onClick={onSelectNew}
          className="group flex flex-col items-start gap-3 p-4 rounded-2xl border-2 border-line bg-white dark:bg-white/3 hover:border-accent/50 hover:shadow-md transition-all cursor-pointer text-left"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#6366f118' }}
          >
            <Plus className="w-5 h-5 text-[#6366f1]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink mb-1">新功能菜单需求</p>
            <p className="text-xs text-gray-500 dark:text-white/40 leading-relaxed">
              在该系统下全新增加一个菜单模块，AI 从零生成完整原型页面
            </p>
          </div>
          <div
            className="mt-auto flex items-center gap-1 text-xs font-medium"
            style={{ color: '#6366f1' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI 生成全新页面
            <ChevronRight className="w-3 h-3 ml-auto opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>

        {/* 已有功能需求 */}
        <button
          type="button"
          onClick={onSelectExisting}
          className="group flex flex-col items-start gap-3 p-4 rounded-2xl border-2 border-line bg-white dark:bg-white/3 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer text-left"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10">
            <FileEdit className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink mb-1">已有功能需求</p>
            <p className="text-xs text-gray-500 dark:text-white/40 leading-relaxed">
              对已有菜单进行调整，如增加字段、搜索条件或交互优化等
            </p>
          </div>
          <div className="mt-auto flex items-center gap-1 text-xs font-medium text-emerald-500">
            <Edit3 className="w-3.5 h-3.5" />
            在已有页面上调整
            <ChevronRight className="w-3 h-3 ml-auto opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── 已有菜单内联多选组件（嵌入对话框顶部） ─────────────────────────────────────

function ExistingMenuMultiSelect({
  productLine,
  selected,
  onChange,
}: {
  productLine: PrototypeProductLine;
  selected: string[];
  onChange: (keys: string[]) => void;
}) {
  const menus = EXISTING_MENUS[productLine];

  const toggle = (key: string) => {
    onChange(
      selected.includes(key)
        ? selected.filter((k) => k !== key)
        : [...selected, key]
    );
  };

  return (
    <div className="border-b border-line bg-emerald-500/3 px-3 py-2.5 shrink-0">
      <div className="flex items-center gap-2 mb-2">
        <FileEdit className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          选择要调整的菜单
        </span>
        <span className="text-[10px] text-gray-400 dark:text-white/30 ml-auto">
          {selected.length === 0 ? '请至少选一个' : `已选 ${selected.length} 个`}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {menus.map((menu) => {
          const isSelected = selected.includes(menu.key);
          return (
            <button
              key={menu.key}
              type="button"
              onClick={() => toggle(menu.key)}
              title={menu.desc}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                isSelected
                  ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'border-line bg-white dark:bg-white/4 text-gray-500 dark:text-white/40 hover:border-emerald-400/50 hover:text-emerald-500'
              }`}
            >
              {isSelected && <Check className="w-2.5 h-2.5 shrink-0" />}
              {menu.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RequirementPrototypePage({ onPrototypeSaved, onNavigateToModule }: Props) {
  const [view, setView] = useState<View>('landing');
  const [productLine, setProductLine] = useState<PrototypeProductLine>('youbao');
  const [designMode, setDesignMode] = useState<DesignMode>('admin');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [library, setLibrary] = useState<SavedPrototype[]>(() => loadPrototypes());
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [hasNewPreview, setHasNewPreview] = useState(false);
  const [chatStep, setChatStep] = useState<ChatStep>('chatting');
  const [requirementType, setRequirementType] = useState<RequirementType>('new-menu');
  // 已有功能需求：用户在对话框顶部选中的菜单 key 列表
  const [selectedMenuKeys, setSelectedMenuKeys] = useState<string[]>([]);
  const [addToMenuMsg, setAddToMenuMsg] = useState<ChatMsg | null>(null);

  const currentStep = useMemo(() => computeWorkflowStep(messages), [messages]);
  const color = COLORS[productLine];

  // Restore pending + done items from queue on mount
  useEffect(() => {
    fetchQueue().then((queue) => {
      const relevant = queue.filter(
        (q) =>
          q.status === 'pending' ||
          (q.status === 'done' && (q.html || q.requirementType === 'existing-feature'))
      );
      if (relevant.length === 0) return;
      const restored: ChatMsg[] = [];
      for (const item of relevant) {
        restored.push(
          {
            id: `u-${item.id}`, role: 'user',
            text: `**${item.name}**\n\n${item.requirement}`,
            productLine: item.productLine, name: item.name,
            requirementType: item.requirementType,
            targetMenuKeys: item.targetMenuKeys,
            sourceFiles: item.sourceFiles,
          },
          {
            id: `ai-${item.id}`, role: 'ai',
            queueId: item.id,
            status: item.status as MsgStatus,
            html: item.html ?? undefined,
            text: item.status === 'done'
              ? (item.requirementType === 'existing-feature'
                  ? `✅ 已完成修改！源文件已更新，请刷新对应菜单页面确认效果，满意后加入菜单。\n\n📁 已修改文件：${(item.sourceFiles ?? []).join('、')}`
                  : '✅ 原型已生成！点击「预览原型」查看效果，满意后加入菜单。')
              : '',
            productLine: item.productLine, name: item.name,
            requirementType: item.requirementType,
            targetMenuKeys: item.targetMenuKeys,
            sourceFiles: item.sourceFiles,
          }
        );
        setProductLine(item.productLine);
        if (item.requirementType === 'existing-feature' && item.targetMenuKeys) {
          setSelectedMenuKeys(item.targetMenuKeys);
        }
      }
      if (restored.length > 0) {
        setMessages(restored);
        setView('designing');
        setChatStep('chatting');
        setRequirementType(restored[0]?.requirementType ?? 'new-menu');
      }
    });
  }, []);

  const handleSaved = useCallback((proto: SavedPrototype) => {
    const next = [proto, ...loadPrototypes()];
    savePrototypes(next);
    setLibrary(next);
    onPrototypeSaved(proto);
  }, [onPrototypeSaved]);

  const handleLibDelete = (id: string) => {
    const next = library.filter((p) => p.id !== id);
    savePrototypes(next);
    setLibrary(next);
  };

  const handlePreview = useCallback(() => {
    setActiveTab('preview');
    setHasNewPreview(false);
  }, []);

  const handleNewDoneMsg = useCallback(() => {
    setHasNewPreview(true);
  }, []);

  // 打开「加入菜单」弹窗
  const handleOpenAddToMenu = useCallback((msg: ChatMsg) => {
    setAddToMenuMsg(msg);
  }, []);

  // 确认加入菜单（弹窗回调）
  // 已有功能需求完成后可能没有 html（直接改源文件），用空字符串占位
  const handleConfirmAddToMenu = useCallback((menuPath: string) => {
    if (!addToMenuMsg) return;
    const proto = createPrototype(
      addToMenuMsg.name ?? '需求',
      addToMenuMsg.productLine ?? productLine,
      addToMenuMsg.html ?? '',
      addToMenuMsg.requirementType === 'existing-feature'
        ? `已修改源文件：${(addToMenuMsg.sourceFiles ?? []).join('、')}`
        : '',
      addToMenuMsg.queueId,
      menuPath,
      addToMenuMsg.requirementType,
      addToMenuMsg.designMode ?? designMode,
    );
    handleSaved(proto);
    setAddToMenuMsg(null);
    setActiveTab('library');
  }, [addToMenuMsg, productLine, designMode, handleSaved]);

  const handleDeleteFromHistory = useCallback((queueId: string) => {
    void deleteQueueItem(queueId);
    setMessages((prev) =>
      prev.filter((m) => m.queueId !== queueId && m.id !== `u-${queueId}`)
    );
  }, []);

  // 撤销已有功能的源文件改动
  const handleRevert = useCallback((msg: ChatMsg) => {
    if (!msg.queueId) return;
    void revertQueueItem(msg.queueId);
    setMessages((prev) =>
      prev.map((m) => m.queueId === msg.queueId ? { ...m, status: 'reverted' as MsgStatus } : m)
    );
  }, []);

  // 终止 pending 中的任务
  const handleCancelTask = useCallback((queueId: string) => {
    void deleteQueueItem(queueId);
    setMessages((prev) =>
      prev.filter((m) => m.queueId !== queueId && m.id !== `u-${queueId}`)
    );
  }, []);

  // ── Landing page ──
  if (view === 'landing') {
    return (
      <LandingPage
        onSelect={(pl, type, mode) => {
          setProductLine(pl);
          setRequirementType(type);
          setDesignMode(mode);
          setView('designing');
          setActiveTab('chat');
          setChatStep('chatting');
          setMessages([]);
          setSelectedMenuKeys([]);
        }}
      />
    );
  }

  // ── Designing view ──
  const tabItems: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { key: 'chat', label: '设计对话', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: 'preview', label: '页面预览', icon: <Monitor className="w-3.5 h-3.5" /> },
    { key: 'library', label: `已保存 (${library.length})`, icon: <BookOpen className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 100px)' }}>
      {/* Top header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView('landing')}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/80 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
          <div className="w-px h-4 bg-line" />
          <span
            className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: `${color}18`, color }}
          >
            {PRODUCT_LINE_LABEL[productLine]}
          </span>
          {chatStep === 'chatting' && (
            <>
              <div className="w-px h-4 bg-line" />
              <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                designMode === 'mobile'
                  ? 'bg-sky-500/10 text-sky-500'
                  : 'bg-[#6366f1]/10 text-[#6366f1]'
              }`}>
                {designMode === 'mobile'
                  ? <Smartphone className="w-3 h-3" />
                  : <LayoutDashboard className="w-3 h-3" />
                }
                {designMode === 'mobile' ? '移动端' : '管理后台'}
              </span>
              <div className="w-px h-4 bg-line" />
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                requirementType === 'new-menu'
                  ? 'bg-[#6366f1]/10 text-[#6366f1]'
                  : 'bg-emerald-500/10 text-emerald-500'
              }`}>
                {requirementType === 'new-menu' ? '新功能菜单' : '已有功能调整'}
              </span>
            </>
          )}
        </div>

        {/* Tab buttons */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/6 rounded-xl">
          {tabItems.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setActiveTab(t.key);
                if (t.key === 'preview') setHasNewPreview(false);
              }}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === t.key
                  ? 'bg-white dark:bg-white/12 text-ink shadow-sm'
                  : 'text-gray-500 dark:text-white/40 hover:text-gray-800 dark:hover:text-white/70'
              }`}
            >
              {t.icon}
              {t.label}
              {t.key === 'preview' && hasNewPreview && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Workflow strip */}
      <WorkflowStrip currentStep={currentStep} color={color} />

      {/* Content area */}
      <AnimatePresence mode="wait">
        {activeTab === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="flex-1 min-h-0 mt-3"
          >
            <ChatPanel
              productLine={productLine}
              requirementType={requirementType}
              selectedMenuKeys={selectedMenuKeys}
              onSelectedMenuKeysChange={setSelectedMenuKeys}
              messages={messages}
              setMessages={setMessages}
              library={library}
              onPreview={handlePreview}
              onNewDoneMsg={handleNewDoneMsg}
              onAddToMenu={handleOpenAddToMenu}
              onRevert={handleRevert}
              onBackToLanding={() => setView('landing')}
              onCancelTask={handleCancelTask}
              onNavigateToModule={onNavigateToModule}
            />
          </motion.div>
        )}
        {activeTab === 'preview' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="flex-1 min-h-0 mt-3"
          >
            <HistoryPreviewPanel
              messages={messages}
              library={library}
              color={color}
              designMode={designMode}
              onSave={handleOpenAddToMenu}
              onDelete={handleDeleteFromHistory}
            />
          </motion.div>
        )}
        {activeTab === 'library' && (
          <motion.div
            key="lib"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="flex-1 min-h-0 overflow-y-auto mt-3"
          >
            <LibraryPanel
              prototypes={library}
              onDelete={handleLibDelete}
              onNew={() => setActiveTab('chat')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 加入菜单弹窗 */}
      <AnimatePresence>
        {addToMenuMsg && (
          <AddToMenuModal
            msg={addToMenuMsg}
            color={color}
            productLine={productLine}
            onConfirm={handleConfirmAddToMenu}
            onCancel={() => setAddToMenuMsg(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

function LandingPage({
  onSelect,
}: {
  onSelect: (pl: PrototypeProductLine, type: RequirementType, mode: DesignMode) => void;
}) {
  const [hoveredPl, setHoveredPl] = useState<PrototypeProductLine | null>(null);
  const [selectedPl, setSelectedPl] = useState<PrototypeProductLine | null>(null);
  // 选中产品线后，先选设计模式，再展开需求类型
  const [selectedMode, setSelectedMode] = useState<DesignMode | null>(null);
  const [typedIndex, setTypedIndex] = useState(0);

  const TYPED_TEXTS = ['快速原型设计', '智能需求理解', '一键生成页面', 'AI 辅助迭代'];
  const currentText = TYPED_TEXTS[typedIndex % TYPED_TEXTS.length];

  useEffect(() => {
    const t = setInterval(() => setTypedIndex((i) => i + 1), 2800);
    return () => clearInterval(t);
  }, []);

  const productLines = Object.keys(PRODUCT_LINE_LABEL) as PrototypeProductLine[];

  return (
    <div
      className="relative flex flex-col items-center overflow-hidden bg-bg"
      style={{ height: 'calc(100vh - 100px)' }}
    >
      {/* 背景光晕装饰（亮色模式不可见，暗色模式显现） */}
      <div
        className="absolute inset-0 pointer-events-none dark:opacity-100 opacity-0 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute pointer-events-none dark:opacity-100 opacity-0 transition-opacity duration-500"
        style={{
          width: 600, height: 600,
          top: -200, left: '50%', transform: 'translateX(-50%)',
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 60%)',
          filter: 'blur(40px)',
        }}
      />

      {/* 顶部 Hero 区域 */}
      <div className="relative z-10 flex flex-col items-center pt-10 pb-8">
        {/* AI 标识徽章 */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 border border-[#6366f1]/30 bg-[#6366f1]/8 dark:bg-[#6366f1]/10"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[11px] font-medium text-[#6366f1] dark:text-[#a5b4fc]">Powered by Cursor AI</span>
          <Bot className="w-3.5 h-3.5 text-accent" />
        </motion.div>

        {/* 标题 */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl font-bold mb-2 text-ink"
        >
          需求原型设计
        </motion.h1>

        {/* 动态打字副标题 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-2 mb-3"
        >
          <span className="text-sm text-gray-400 dark:text-white/35">通过 AI 对话实现</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={currentText}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="text-sm font-semibold text-accent"
            >
              {currentText}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-xs text-center max-w-sm leading-relaxed text-gray-400 dark:text-white/30"
        >
          选择一条产品线，描述你的需求，AI 将自动生成可交互的原型页面
        </motion.p>
      </div>

      {/* 业务线卡片网格 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="relative z-10 w-full max-w-3xl px-4 flex-1 min-h-0 overflow-y-auto pb-6"
      >
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
        >
          {productLines.map((pl, idx) => {
            const cfg = PL_CARD_CONFIG[pl];
            const Icon = cfg.icon;
            const isHovered = hoveredPl === pl;
            const isSelected = selectedPl === pl;

            return (
              <motion.div
                key={pl}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + idx * 0.08 }}
                onMouseEnter={() => setHoveredPl(pl)}
                onMouseLeave={() => setHoveredPl(null)}
                className="relative rounded-2xl overflow-hidden cursor-pointer"
                style={{
                  border: isSelected
                    ? `1.5px solid ${COLORS[pl]}50`
                    : `1.5px solid var(--color-line)`,
                  background: isHovered
                    ? 'var(--color-surface)'
                    : 'var(--color-sidebar)',
                  boxShadow: isHovered
                    ? `0 0 28px ${cfg.glowColor}, 0 4px 20px rgba(0,0,0,0.12)`
                    : '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'all 0.25s ease',
                }}
                onClick={() => {
                  if (isSelected) {
                    setSelectedPl(null);
                    setSelectedMode(null);
                  } else {
                    setSelectedPl(pl);
                    setSelectedMode(null);
                  }
                }}
              >
                {/* 顶部渐变色条 */}
                <div className="h-1 w-full" style={{ background: cfg.gradient }} />

                {/* 卡片内容 */}
                <div className="p-4">
                  {/* 图标 + 标题行 */}
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{
                        background: `${COLORS[pl]}18`,
                        border: `1px solid ${COLORS[pl]}28`,
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: COLORS[pl] }} />
                    </div>
                    <div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{
                        background: `${COLORS[pl]}12`,
                        color: COLORS[pl],
                        border: `1px solid ${COLORS[pl]}25`,
                      }}
                    >
                      <Cpu className="w-2.5 h-2.5" />
                      AI 就绪
                    </div>
                  </div>

                  <p className="text-sm font-semibold mb-1 text-ink">
                    {PRODUCT_LINE_LABEL[pl]}
                  </p>
                  <p className="text-[11px] leading-relaxed mb-3 text-gray-500 dark:text-white/38">
                    {PL_DESC[pl]}
                  </p>

                  {/* 功能标签 */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {cfg.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/6 text-gray-500 dark:text-white/45 border border-line"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 展开操作区：两步选择 */}
                  <AnimatePresence initial={false}>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 mt-1 border-t border-line" onClick={(e) => e.stopPropagation()}>
                          {/* Step 1: 选设计模式 */}
                          {!selectedMode ? (
                            <>
                              <p className="text-[10px] font-semibold text-gray-400 dark:text-white/30 mb-2 uppercase tracking-wide">
                                选择设计类型
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedMode('admin')}
                                  className="flex flex-col items-start gap-2 p-3 rounded-xl cursor-pointer text-left transition-all bg-[#6366f1]/6 hover:bg-[#6366f1]/12 border border-[#6366f1]/20 hover:border-[#6366f1]/40"
                                >
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#6366f1]/12">
                                    <LayoutDashboard className="w-3.5 h-3.5 text-accent" />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-semibold text-ink">管理后台</p>
                                    <p className="text-[10px] text-gray-400 dark:text-white/35 leading-relaxed mt-0.5">PC 端管理系统页面</p>
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedMode('mobile')}
                                  className="flex flex-col items-start gap-2 p-3 rounded-xl cursor-pointer text-left transition-all bg-sky-500/6 hover:bg-sky-500/12 border border-sky-500/20 hover:border-sky-500/40"
                                >
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-sky-500/12">
                                    <Smartphone className="w-3.5 h-3.5 text-sky-500" />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-semibold text-ink">移动端（H5）</p>
                                    <p className="text-[10px] text-gray-400 dark:text-white/35 leading-relaxed mt-0.5">iPhone 16 Pro 尺寸预览</p>
                                  </div>
                                </button>
                              </div>
                            </>
                          ) : (
                            /* Step 2: 选需求类型 */
                            <>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wide">
                                  选择需求类型
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setSelectedMode(null)}
                                  className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/60 cursor-pointer"
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                  返回
                                </button>
                              </div>
                              {/* 当前设计模式标签 */}
                              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium mb-2 ${
                                selectedMode === 'mobile'
                                  ? 'bg-sky-500/10 text-sky-500'
                                  : 'bg-[#6366f1]/10 text-[#6366f1]'
                              }`}>
                                {selectedMode === 'mobile'
                                  ? <Smartphone className="w-2.5 h-2.5" />
                                  : <LayoutDashboard className="w-2.5 h-2.5" />
                                }
                                {selectedMode === 'mobile' ? '移动端（H5）' : '管理后台'}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => onSelect(pl, 'new-menu', selectedMode)}
                                  className="flex flex-col items-start gap-2 p-3 rounded-xl cursor-pointer text-left transition-all bg-[#6366f1]/6 hover:bg-[#6366f1]/12 border border-[#6366f1]/20 hover:border-[#6366f1]/40"
                                >
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#6366f1]/12">
                                    <Plus className="w-3.5 h-3.5 text-accent" />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-semibold text-ink">新功能菜单</p>
                                    <p className="text-[10px] text-gray-400 dark:text-white/35 leading-relaxed mt-0.5">AI 从零生成原型</p>
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onSelect(pl, 'existing-feature', selectedMode)}
                                  className="flex flex-col items-start gap-2 p-3 rounded-xl cursor-pointer text-left transition-all bg-emerald-500/6 hover:bg-emerald-500/12 border border-emerald-500/20 hover:border-emerald-500/40"
                                >
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/12">
                                    <FileEdit className="w-3.5 h-3.5 text-emerald-500" />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-semibold text-ink">已有功能调整</p>
                                    <p className="text-[10px] text-gray-400 dark:text-white/35 leading-relaxed mt-0.5">在已有页面上迭代</p>
                                  </div>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 底部提示 —— 未展开时显示 */}
                  {!isSelected && (
                    <div className="flex items-center gap-1" style={{ color: COLORS[pl] }}>
                      <span className="text-[11px] font-medium">点击选择</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 扩展提示 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-5 flex items-center justify-center gap-2 text-gray-300 dark:text-white/20"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="text-[11px]">更多业务线持续接入中…</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Workflow Strip ────────────────────────────────────────────────────────────

function WorkflowStrip({ currentStep, color }: { currentStep: number; color: string }) {
  return (
    <div className="flex items-center px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/3 border border-line shrink-0">
      {WORKFLOW_STEPS.map((step, i) => {
        const isActive = i === currentStep;
        const isDone = i < currentStep;
        return (
          <div key={step} className="flex items-center">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                isActive ? 'text-white' : isDone ? 'text-gray-500 dark:text-white/45' : 'text-gray-400 dark:text-white/25'
              }`}
              style={isActive ? { background: color } : undefined}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                  isActive
                    ? 'bg-white/25 text-white'
                    : isDone
                    ? 'bg-gray-200 dark:bg-white/15 text-gray-500 dark:text-white/40'
                    : 'bg-gray-100 dark:bg-white/8 text-gray-400 dark:text-white/20'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </span>
              {step}
            </div>
            {i < WORKFLOW_STEPS.length - 1 && (
              <ChevronRight
                className={`w-3.5 h-3.5 mx-0.5 shrink-0 ${
                  i < currentStep ? 'text-gray-400 dark:text-white/25' : 'text-gray-200 dark:text-white/12'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── History Preview Panel ────────────────────────────────────────────────────

function getDateFromQueueId(id: string): string {
  const ts = parseInt((id ?? '').split('-')[1]);
  if (isNaN(ts)) return '';
  return new Date(ts).toLocaleString('zh-CN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const PREVIEW_DESIGN_WIDTH = 1280;

// iPhone 16 Pro 逻辑像素尺寸（pt）
const IPHONE16PRO_W = 393;
const IPHONE16PRO_H = 852;

function HistoryPreviewPanel({
  messages,
  library,
  color,
  designMode,
  onSave,
  onDelete,
}: {
  messages: ChatMsg[];
  library: SavedPrototype[];
  color: string;
  designMode: DesignMode;
  onSave: (msg: ChatMsg) => void;
  onDelete: (queueId: string) => void;
}) {
  const doneMsgs = messages
    .filter((m) => m.role === 'ai' && m.status === 'done' && m.html)
    .sort((a, b) => b.id.localeCompare(a.id));

  const [selected, setSelected] = useState<ChatMsg | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // Scale-to-fit for main preview iframe
  const iframeWrapRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  useEffect(() => {
    const el = iframeWrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (designMode === 'mobile') {
        // 移动端：按高度适配，留出手机壳边距
        const h = entry.contentRect.height;
        const shellH = IPHONE16PRO_H + 80;
        const shellW = IPHONE16PRO_W + 40;
        setPreviewScale(Math.min(1, w / shellW, h / shellH));
      } else {
        setPreviewScale(Math.min(1, w / PREVIEW_DESIGN_WIDTH));
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [designMode]);

  // Build requirement lookup: queueId → requirement text
  const requirementMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of messages) {
      if (m.role === 'user' && m.queueId === undefined) {
        const qid = m.id.startsWith('u-') ? m.id.slice(2) : m.id;
        const parts = m.text.split('\n\n');
        map[qid] = parts.slice(1).join('\n\n') || m.text;
      }
    }
    return map;
  }, [messages]);

  // Auto-select first item
  const activeMsg = selected ?? doneMsgs[0] ?? null;

  const isUsed = (msg: ChatMsg) =>
    library.some((p) => p.queueId === msg.queueId);

  const handleCopy = () => {
    if (!activeMsg?.html) return;
    navigator.clipboard.writeText(activeMsg.html).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (doneMsgs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 rounded-2xl border border-dashed border-line bg-gray-50 dark:bg-white/2">
        <Monitor className="w-12 h-12 text-gray-300 dark:text-white/15" />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-white/40">暂无生成记录</p>
          <p className="text-xs text-gray-400 dark:text-white/25 mt-1">在「设计对话」中生成原型后，历史记录将显示在这里</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-3">
      {/* ── Left: history list ── */}
      <div className="w-48 shrink-0 flex flex-col gap-1.5 overflow-y-auto pr-1">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wide px-1 shrink-0 mb-0.5">
          生成记录 · {doneMsgs.length} 个
        </p>
        {doneMsgs.map((msg, idx) => {
          const used = isUsed(msg);
          const isActive = (selected ? selected.id === msg.id : idx === 0);
          const requirement = msg.queueId ? (requirementMap[msg.queueId] ?? '') : '';
          const dateStr = getDateFromQueueId(msg.queueId ?? '');
          return (
            <div
              key={msg.id}
              onClick={() => { setSelected(msg); setShowCode(false); }}
              title={requirement}
              className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all shrink-0 ${
                isActive
                  ? 'border-accent/50 bg-accent/5 shadow-sm'
                  : 'border-line hover:border-accent/30 bg-white dark:bg-white/2 hover:bg-gray-50 dark:hover:bg-white/4'
              }`}
            >
              {/* Index badge */}
              <span
                className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                style={isActive ? { background: 'var(--accent,#6366f1)', color: '#fff' } : { background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}
              >
                {idx + 1}
              </span>
              {/* Name + date */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ink truncate">{msg.name}</p>
                <p className="text-[10px] text-gray-400 dark:text-white/30 mt-0.5">{dateStr}</p>
              </div>
              {/* Status / delete */}
              <div className="shrink-0 flex items-center gap-1">
                {used ? (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">
                    已保存
                  </span>
                ) : confirmDeleteId === msg.queueId ? (
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => { onDelete(msg.queueId!); setConfirmDeleteId(null); if (isActive) setSelected(null); }}
                      className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-red-500 text-white cursor-pointer"
                    >确认</button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-1.5 py-0.5 rounded text-[9px] border border-line text-gray-400 cursor-pointer"
                    >取消</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(msg.queueId ?? null); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-[10px] text-gray-400 hover:text-red-400 cursor-pointer px-1 py-0.5 rounded hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Right: detail preview ── */}
      <div className="flex-1 min-w-0 flex flex-col rounded-2xl border border-line overflow-hidden">
        {activeMsg ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-line bg-gray-50 dark:bg-white/3 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Monitor className="w-4 h-4 text-gray-400 dark:text-white/30 shrink-0" />
                <span className="text-sm font-semibold text-ink truncate">{activeMsg.name ?? '原型预览'}</span>
                {activeMsg.productLine && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                    style={{ background: `${COLORS[activeMsg.productLine]}15`, color: COLORS[activeMsg.productLine] }}
                  >
                    {PRODUCT_LINE_LABEL[activeMsg.productLine]}
                  </span>
                )}
                {activeMsg.requirementType === 'existing-feature' && activeMsg.targetMenuKeys?.length && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 bg-emerald-500/10 text-emerald-500">
                    调整：{activeMsg.targetMenuKeys.join(' / ')}
                  </span>
                )}
                {isUsed(activeMsg) && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    已保存至菜单
                  </span>
                )}
                {previewScale < 1 && (
                  <span className="text-[10px] text-gray-400 dark:text-white/30 shrink-0">
                    {Math.round(previewScale * 100)}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCode((v) => !v)}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    showCode ? 'border-accent/40 text-accent bg-accent/8' : 'border-line text-gray-500 hover:bg-gray-100 dark:hover:bg-white/8'
                  }`}
                >
                  <Code2 className="w-3 h-3" />
                  {showCode ? '隐藏代码' : '查看代码'}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-line text-gray-500 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  {copied ? '已复制' : '复制 HTML'}
                </button>
                {!isUsed(activeMsg) && activeMsg.queueId && (
                  <button
                    type="button"
                    onClick={() => onSave(activeMsg)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ background: `linear-gradient(135deg,${color},#8b5cf6)` }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    加入菜单
                  </button>
                )}
              </div>
            </div>
            {/* Iframe + code panel */}
            <div className="flex-1 min-h-0 flex">
              <div
                ref={iframeWrapRef}
                className={`${showCode ? 'flex-1' : 'w-full'} relative overflow-hidden flex items-center justify-center`}
                style={{ background: designMode === 'mobile' ? 'var(--color-surface, #f8fafc)' : undefined }}
              >
                {designMode === 'mobile' ? (
                  /* ── iPhone 16 Pro 外框 ── */
                  <div
                    style={{
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'center center',
                      flexShrink: 0,
                    }}
                  >
                    {/* 手机壳外框 */}
                    <div style={{
                      width: IPHONE16PRO_W + 28,
                      height: IPHONE16PRO_H + 60,
                      borderRadius: 52,
                      background: 'linear-gradient(145deg,#2a2a2e 0%,#1a1a1d 40%,#2a2a2e 100%)',
                      boxShadow: '0 0 0 1.5px rgba(255,255,255,0.12), 0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
                      padding: 10,
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}>
                      {/* 顶部灵动岛 */}
                      <div style={{
                        width: 120, height: 34, borderRadius: 20,
                        background: '#0a0a0a',
                        position: 'absolute',
                        top: 18, left: '50%', transform: 'translateX(-50%)',
                        zIndex: 10,
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
                      }} />
                      {/* 屏幕区域 */}
                      <div style={{
                        width: IPHONE16PRO_W,
                        height: IPHONE16PRO_H,
                        borderRadius: 44,
                        overflow: 'hidden',
                        background: '#000',
                        position: 'relative',
                        flexShrink: 0,
                      }}>
                        <iframe
                          key={activeMsg.id}
                          title={activeMsg.name ?? '原型预览'}
                          srcDoc={activeMsg.html}
                          className="border-0"
                          style={{
                            width: IPHONE16PRO_W,
                            height: IPHONE16PRO_H,
                            display: 'block',
                          }}
                          sandbox="allow-scripts allow-same-origin"
                        />
                      </div>
                      {/* 底部 Home 指示条 */}
                      <div style={{
                        width: 130, height: 5, borderRadius: 3,
                        background: 'rgba(255,255,255,0.3)',
                        position: 'absolute',
                        bottom: 14,
                      }} />
                    </div>
                  </div>
                ) : (
                  /* ── 管理后台：铺满预览 ── */
                  <iframe
                    key={activeMsg.id}
                    title={activeMsg.name ?? '原型预览'}
                    srcDoc={activeMsg.html}
                    className="absolute top-0 left-0 border-0"
                    style={{
                      width: previewScale < 1 ? `${100 / previewScale}%` : '100%',
                      height: previewScale < 1 ? `${100 / previewScale}%` : '100%',
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'top left',
                    }}
                    sandbox="allow-scripts allow-same-origin"
                  />
                )}
              </div>
              {showCode && (
                <div className="w-96 shrink-0 bg-gray-950 overflow-auto border-l border-line">
                  <div className="px-4 py-2 border-b border-white/8 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-white/40 font-mono">HTML</span>
                    <span className="text-[10px] text-white/25">{activeMsg.html!.length.toLocaleString()} chars</span>
                  </div>
                  <pre className="p-4 text-[10px] font-mono text-green-300/80 leading-relaxed whitespace-pre-wrap break-all">
                    {activeMsg.html}
                  </pre>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-400 dark:text-white/25">请从左侧选择一条记录</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

function ChatPanel({
  productLine,
  requirementType,
  selectedMenuKeys,
  onSelectedMenuKeysChange,
  messages,
  setMessages,
  library,
  onPreview,
  onNewDoneMsg,
  onAddToMenu,
  onRevert,
  onBackToLanding,
  onCancelTask,
  onNavigateToModule,
}: {
  productLine: PrototypeProductLine;
  requirementType: RequirementType;
  selectedMenuKeys: string[];
  onSelectedMenuKeysChange: (keys: string[]) => void;
  messages: ChatMsg[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMsg[]>>;
  library: SavedPrototype[];
  onPreview: () => void;
  onNewDoneMsg: () => void;
  onAddToMenu: (msg: ChatMsg) => void;
  onRevert: (msg: ChatMsg) => void;
  onBackToLanding: () => void;
  onCancelTask: (queueId: string) => void;
  onNavigateToModule?: (module: NavigableModule, subKey?: string) => void;
}) {
  const [name, setName] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const color = COLORS[productLine];
  const isExisting = requirementType === 'existing-feature';

  // toast 通知状态
  const [toastMsg, setToastMsg] = useState<{ text: string; isNew: boolean } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string, isNew: boolean) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg({ text, isNew });
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 5000);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 轮询队列状态（新功能 + 已有功能 均轮询）
  useEffect(() => {
    const pendingIds = messages
      .filter((m) => m.role === 'ai' && m.status === 'pending')
      .map((m) => m.queueId!)
      .filter(Boolean);
    if (pendingIds.length === 0) return;

    const t = setInterval(async () => {
      const queue = await fetchQueue();
      for (const id of pendingIds) {
        const found = queue.find((q) => q.id === id);
        if (found?.status === 'done') {
          const isExistingReq = found.requirementType === 'existing-feature';
          const doneText = isExistingReq
            ? `✅ 已完成修改！源文件已更新，请刷新对应菜单页面确认效果，满意后加入菜单。\n\n📁 已修改文件：${(found.sourceFiles ?? []).join('、')}`
            : '✅ 原型已生成！点击「预览原型」查看效果，满意后加入菜单。';
          const updatedMsg: Partial<ChatMsg> = {
            status: 'done' as MsgStatus,
            html: found.html ?? undefined,
            text: doneText,
          };
          setMessages((prev) =>
            prev.map((m) => (m.queueId === id ? { ...m, ...updatedMsg } : m))
          );
          onNewDoneMsg();
          showToast(
            isExistingReq ? '✅ AI 已完成修改，请查看对话结果' : '✅ 原型已生成！点击下方「预览原型」查看',
            !isExistingReq,
          );
        }
      }
    }, 2000);

    return () => clearInterval(t);
  }, [messages, setMessages, onNewDoneMsg, showToast]);

  const canSend = input.trim() && (!isExisting || selectedMenuKeys.length > 0);

  const send = async () => {
    if (!canSend || sending) return;
    const reqName = name.trim() || `需求_${Date.now()}`;
    const id = `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // 已有功能：计算涉及的源文件列表
    const sourceFiles = isExisting
      ? [...new Set(selectedMenuKeys.flatMap((k) => MENU_SOURCE_FILES[k] ?? []))]
      : undefined;

    const menuLabels = isExisting
      ? selectedMenuKeys.map((k) => EXISTING_MENUS[productLine].find((m) => m.key === k)?.label ?? k)
      : undefined;

    const userMsg: ChatMsg = {
      id: `u-${id}`, role: 'user',
      text: `**${reqName}**\n\n${input.trim()}`,
      productLine, name: reqName,
      requirementType,
      targetMenuKeys: isExisting ? selectedMenuKeys : undefined,
      sourceFiles,
    };
    const pendingText = isExisting
      ? `正在分析「${menuLabels?.join('、')}」相关源文件，AI 将直接修改前端实现…`
      : '';
    const aiMsg: ChatMsg = {
      id: `ai-${id}`, role: 'ai',
      text: pendingText, queueId: id,
      status: 'pending', productLine, name: reqName,
      requirementType,
      targetMenuKeys: isExisting ? selectedMenuKeys : undefined,
      sourceFiles,
    };

    setSending(true);
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setName('');
    setInput('');

    const ok = await pushQueue({
      id, productLine, name: reqName, requirement: input.trim(),
      requirementType,
      targetMenuKeys: isExisting ? selectedMenuKeys : undefined,
      sourceFiles,
    });
    if (!ok) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsg.id
            ? { ...m, status: 'error' as MsgStatus, text: '❌ 提交失败，请检查开发服务器是否正在运行。' }
            : m
        )
      );
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const welcome = messages.length === 0;

  const placeholder = isExisting
    ? (selectedMenuKeys.length > 0
        ? `描述「${selectedMenuKeys.map((k) => EXISTING_MENUS[productLine].find((m) => m.key === k)?.label ?? k).join('、')}」需要调整的内容，如增加字段、搜索条件、交互优化等…（Enter 发送）`
        : '请先在上方选择要调整的菜单，再描述需求…')
    : `描述「${PRODUCT_LINE_LABEL[productLine]}」的页面需求…（Enter 发送，Shift+Enter 换行）`;

  return (
    <div className="flex flex-col h-full rounded-2xl border border-line overflow-hidden bg-white dark:bg-white/2">

      {/* 已有功能需求：顶部内联菜单多选 */}
      {isExisting && (
        <ExistingMenuMultiSelect
          productLine={productLine}
          selected={selectedMenuKeys}
          onChange={onSelectedMenuKeysChange}
        />
      )}

      {/* AI 完成通知 Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 mx-3 mt-2.5 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg"
            style={{
              background: toastMsg.isNew
                ? `linear-gradient(135deg,${color}18,${color}08)`
                : 'rgba(34,197,94,0.1)',
              border: `1px solid ${toastMsg.isNew ? color + '35' : 'rgba(34,197,94,0.3)'}`,
              color: toastMsg.isNew ? color : '#16a34a',
            }}
          >
            <span className="text-xs leading-snug">{toastMsg.text}</span>
            <div className="flex items-center gap-2 shrink-0">
              {toastMsg.isNew && (
                <button
                  type="button"
                  onClick={() => { onPreview(); setToastMsg(null); }}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg cursor-pointer transition-opacity hover:opacity-80"
                  style={{ background: color, color: '#fff' }}
                >
                  预览原型
                </button>
              )}
              <button
                type="button"
                onClick={() => setToastMsg(null)}
                className="opacity-50 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
        {welcome && (
          <div className="flex flex-col items-center justify-center h-full gap-5 text-center py-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg,${color},#8b5cf6)` }}
            >
              {isExisting ? <FileEdit className="w-7 h-7 text-white" /> : <Wand2 className="w-7 h-7 text-white" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink mb-1">
                {isExisting ? '对已有功能进行调整' : '开始需求对话'}
              </p>
              <p className="text-xs text-gray-500 dark:text-white/40 max-w-xs leading-relaxed">
                {isExisting
                  ? '在上方选择要调整的菜单，然后描述你的需求。AI 会直接修改对应菜单的前端源文件，无需重新生成原型。'
                  : '描述你想要设计的页面，AI 会自动生成原型。描述越详细，效果越好！'}
              </p>
            </div>
            {!isExisting && (
              <div>
                <p className="text-[10px] text-gray-400 dark:text-white/25 mb-2">快速开始：</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {QUICK[productLine].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setInput(q)}
                      className="text-xs px-3 py-1.5 rounded-full border border-line text-gray-600 dark:text-white/50 hover:border-accent/40 hover:text-accent transition-colors cursor-pointer bg-gray-50 dark:bg-white/4"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={onBackToLanding}
              className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/25 hover:text-gray-600 dark:hover:text-white/50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              重新选择产品线
            </button>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            color={color}
            onPreview={onPreview}
            onAddToMenu={onAddToMenu}
            onRevert={onRevert}
            onCancelTask={onCancelTask}
            library={library}
            onNavigateToModule={onNavigateToModule}
          />
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Name input */}
      <div className="border-t border-line px-3 pt-2 pb-1 shrink-0">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isExisting ? '需求名称（不填则自动命名）' : '原型名称（不填则自动命名）'}
          className="w-full text-xs rounded-lg border border-transparent bg-gray-50 dark:bg-white/4 px-3 py-1.5 text-gray-600 dark:text-white/60 placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:border-accent/30"
        />
      </div>

      {/* Text input */}
      <div className="border-t border-line px-3 py-2.5 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                void send();
              }
            }}
            placeholder={placeholder}
            disabled={sending || (isExisting && selectedMenuKeys.length === 0)}
            rows={3}
            className="flex-1 resize-none rounded-xl border border-line bg-gray-50 dark:bg-white/4 px-3 py-2.5 text-sm text-ink placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            disabled={!canSend || sending}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void send();
            }}
            className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: canSend && !sending ? color : undefined }}
          >
            {sending
              ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              : <Send className={`w-4 h-4 ${canSend ? 'text-white' : 'text-gray-400'}`} />}
          </button>
        </div>
        {isExisting && selectedMenuKeys.length === 0 && (
          <p className="mt-1.5 text-[10px] text-amber-500 dark:text-amber-400 flex items-center gap-1">
            <Zap className="w-3 h-3 shrink-0" />
            请先在上方选择至少一个要调整的菜单
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Streaming Design Progress ────────────────────────────────────────────────

function StreamingDesignProgress() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [doneLines, setDoneLines] = useState<string[]>([]);

  useEffect(() => {
    if (msgIdx >= DESIGN_PROGRESS.length) return;
    const msg = DESIGN_PROGRESS[msgIdx];
    if (charIdx < msg.length) {
      const t = setTimeout(() => setCharIdx((c) => c + 1), 32);
      return () => clearTimeout(t);
    }
    if (msgIdx < DESIGN_PROGRESS.length - 1) {
      const t = setTimeout(() => {
        setDoneLines((prev) => [...prev, msg]);
        setMsgIdx((i) => i + 1);
        setCharIdx(0);
      }, 900);
      return () => clearTimeout(t);
    }
  }, [msgIdx, charIdx]);

  const currentText = msgIdx < DESIGN_PROGRESS.length
    ? DESIGN_PROGRESS[msgIdx].slice(0, charIdx)
    : '';

  return (
    <div className="space-y-1.5 mt-1">
      {doneLines.map((line, i) => (
        <p key={i} className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/30">
          <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
          {line}
        </p>
      ))}
      {msgIdx < DESIGN_PROGRESS.length && (
        <p className="flex items-start gap-1.5 text-sm text-gray-600 dark:text-white/60">
          <Loader2 className="w-3.5 h-3.5 text-accent animate-spin shrink-0 mt-0.5" />
          <span>
            {currentText}
            <span className="inline-block w-0.5 h-3.5 bg-gray-400 dark:bg-white/35 ml-0.5 animate-pulse align-middle" />
          </span>
        </p>
      )}
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg, color, onPreview, onAddToMenu, onRevert, onCancelTask, library, onNavigateToModule,
}: {
  msg: ChatMsg;
  color: string;
  onPreview: () => void;
  onAddToMenu: (msg: ChatMsg) => void;
  onRevert: (msg: ChatMsg) => void;
  onCancelTask: (queueId: string) => void;
  library: SavedPrototype[];
  onNavigateToModule?: (module: NavigableModule, subKey?: string) => void;
}) {
  const isUser = msg.role === 'user';
  const isUsed = library.some((p) => p.queueId === msg.queueId);
  const isExisting = msg.requirementType === 'existing-feature';

  // 计算本条消息涉及的可跳转菜单目标
  const navTargets = (msg.targetMenuKeys ?? [])
    .map((k) => MENU_NAV_TARGET[k])
    .filter(Boolean) as { module: NavigableModule; subKey?: string; label: string }[];

  if (isUser) {
    return (
      <div className="flex justify-end items-end gap-2">
        <div
          className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed text-white"
          style={{ background: color }}
        >
          {msg.text.split('\n').map((line, i) => (
            <p key={i} className={line.startsWith('**') ? 'font-semibold text-white/90 text-xs mb-1' : ''}>
              {line.replace(/\*\*/g, '')}
            </p>
          ))}
        </div>
        <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center bg-gray-200 dark:bg-white/15">
          <User className="w-4 h-4 text-gray-500 dark:text-white/50" />
        </div>
      </div>
    );
  }

  // 系统消息（已有功能类初始提示）
  const isSystemInfo = msg.status === 'done' && !msg.queueId;

  return (
    <div className="flex gap-2">
      <div
        className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold mt-0.5"
        style={{ background: `linear-gradient(135deg,${color},#8b5cf6)` }}
      >
        AI
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed border ${
            msg.status === 'done'
              ? isSystemInfo
                ? 'border-emerald-500/20 bg-emerald-500/5'
                : 'border-green-500/20 bg-green-500/5'
              : msg.status === 'reverted'
              ? 'border-gray-300/40 bg-gray-100/60 dark:border-white/10 dark:bg-white/4'
              : msg.status === 'error'
              ? 'border-red-500/20 bg-red-500/5'
              : 'border-line bg-gray-50 dark:bg-white/6'
          }`}
        >
          {msg.status === 'pending' ? (
            <div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-white/30"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
                <p className="text-xs font-semibold text-gray-500 dark:text-white/50">
                  {msg.requirementType === 'existing-feature'
                    ? 'Cursor AI 正在修改源文件…'
                    : 'Cursor AI 正在生成原型…'}
                </p>
              </div>
              {msg.requirementType === 'existing-feature' ? (
                <div className="mt-2 space-y-1">
                  {msg.sourceFiles?.map((f) => (
                    <p key={f} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-white/40">
                      <FileEdit className="w-3 h-3 text-emerald-400 shrink-0" />
                      {f}
                    </p>
                  ))}
                  {msg.text && (
                    <p className="text-xs text-gray-500 dark:text-white/45 mt-1">{msg.text}</p>
                  )}
                </div>
              ) : (
                <StreamingDesignProgress />
              )}
            </div>
          ) : (
            <p className="text-ink text-sm whitespace-pre-line">{msg.text}</p>
          )}
        </div>
        {/* pending 状态：终止任务 */}
        {msg.status === 'pending' && msg.queueId && (
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCancelTask(msg.queueId!)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-400/40 text-red-500 dark:text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              终止任务
            </button>
          </div>
        )}
        {/* 操作按钮区域 */}
        {msg.status === 'done' && msg.queueId && (
          <div className="mt-2 flex flex-col gap-2">
            {isExisting ? (
              /* 已有功能：跳转查看 + 确认使用 or 撤销修改 */
              <>
                {/* 跳转查看按钮组 */}
                {onNavigateToModule && navTargets.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-gray-400 dark:text-white/30">前往查看：</span>
                    {navTargets.map((t) => (
                      <button
                        key={`${t.module}-${t.subKey ?? ''}`}
                        type="button"
                        onClick={() => onNavigateToModule(t.module, t.subKey)}
                        className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-accent/30 text-accent bg-accent/5 hover:bg-accent/12 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
                {/* 确认 / 撤销 */}
                <div className="flex items-center gap-2 flex-wrap">
                  {isUsed ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-500 px-3 py-2">
                      <Check className="w-3.5 h-3.5" />
                      已确认使用
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onAddToMenu(msg)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-2 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ background: `linear-gradient(135deg,${color},#8b5cf6)` }}
                      >
                        <Check className="w-3.5 h-3.5" />
                        确认使用
                      </button>
                      <button
                        type="button"
                        onClick={() => onRevert(msg)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer hover:opacity-90 transition-opacity border border-red-400/40 text-red-500 dark:text-red-400 bg-red-500/5 hover:bg-red-500/10"
                      >
                        <X className="w-3.5 h-3.5" />
                        撤销修改
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              /* 新功能：预览原型 + 加入菜单 */
              <div className="flex items-center gap-2 flex-wrap">
                {msg.html && (
                  <button
                    type="button"
                    onClick={() => onPreview()}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-2 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ background: `linear-gradient(135deg,${color},#8b5cf6)` }}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    预览原型
                  </button>
                )}
                {!isUsed && (
                  <button
                    type="button"
                    onClick={() => onAddToMenu(msg)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer hover:opacity-90 transition-opacity border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    加入菜单
                  </button>
                )}
                {isUsed && (
                  <span className="flex items-center gap-1 text-xs text-emerald-500 px-3 py-2">
                    <Check className="w-3.5 h-3.5" />
                    已保存至菜单
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        {/* 撤销后的状态提示 */}
        {msg.status === 'reverted' && msg.queueId && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/30 px-1">
            <X className="w-3.5 h-3.5 shrink-0" />
            已撤销修改，源文件已还原
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Library Panel ────────────────────────────────────────────────────────────

const LIBRARY_PLACEHOLDER_ICONS = [Monitor, Layers, Zap, Globe, Rocket, TrendingUp, Users, GraduationCap, Cpu, Bot];
const LIBRARY_PLACEHOLDER_GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #3b82f6, #6366f1)',
  'linear-gradient(135deg, #8b5cf6, #ec4899)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #6366f1, #06b6d4)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #14b8a6, #6366f1)',
  'linear-gradient(135deg, #f97316, #ef4444)',
];
function getLibraryPlaceholder(id: string) {
  const idx = id.charCodeAt(0) % LIBRARY_PLACEHOLDER_ICONS.length;
  return { Icon: LIBRARY_PLACEHOLDER_ICONS[idx], gradient: LIBRARY_PLACEHOLDER_GRADIENTS[idx] };
}

function LibraryPanel({
  prototypes, onDelete, onNew,
}: {
  prototypes: SavedPrototype[];
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewProto, setViewProto] = useState<SavedPrototype | null>(null);

  if (viewProto) {
    return (
      <div className="flex flex-col h-full rounded-2xl border border-line overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-line bg-gray-50 dark:bg-white/3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewProto(null)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white/80 cursor-pointer transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-white/8"
            >
              <ArrowLeft className="w-3.5 h-3.5" />返回
            </button>
            <div className="w-px h-3.5 bg-line" />
            <span className="text-sm font-semibold text-ink">{viewProto.name}</span>
            {viewProto.menuPath && (
              <span className="text-xs text-gray-400 dark:text-white/30">· {viewProto.menuPath}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(viewProto.html)}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-line text-gray-500 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors cursor-pointer"
          >
            <Copy className="w-3 h-3" />复制 HTML
          </button>
        </div>
        {viewProto.html ? (
          <iframe
            title={viewProto.name}
            srcDoc={viewProto.html}
            className="flex-1 w-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
            <FileEdit className="w-12 h-12 text-emerald-400/50" />
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-white/40 mb-1">已直接修改源文件</p>
              <p className="text-xs text-gray-400 dark:text-white/25 leading-relaxed max-w-sm">
                {viewProto.description || '此需求通过直接修改前端源文件实现，无单独原型 HTML。请查看对应菜单页面确认效果。'}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (prototypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <Layers className="w-10 h-10 text-gray-300 dark:text-white/15" />
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-white/40 mb-1">还没有保存的原型</p>
          <p className="text-xs text-gray-400 dark:text-white/25">通过 AI 对话设计并确认后，原型会保存在这里</p>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="flex items-center gap-1.5 text-sm text-accent cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Plus className="w-4 h-4" />开始设计
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {[...prototypes].sort((a, b) => b.createdAt - a.createdAt).map((p) => {
        const c = COLORS[p.productLine];
        const { Icon: PlaceholderIcon, gradient } = getLibraryPlaceholder(p.id);
        return (
          <div
            key={p.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-line bg-white dark:bg-white/3 hover:border-accent/30 hover:shadow-md transition-all"
          >
            {/* 图标占位 */}
            <div
              className="shrink-0"
              style={{
                width: 40, height: 40, borderRadius: 12,
                background: gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(99,102,241,0.2)',
              }}
            >
              <PlaceholderIcon size={18} color="#fff" />
            </div>

            {/* 信息区 */}
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-xs font-semibold text-ink truncate flex-1">{p.name}</p>
                <span
                  className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: `${c}15`, color: c }}
                >
                  {PRODUCT_LINE_LABEL[p.productLine]}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {p.menuPath && (
                  <div className="flex items-center gap-0.5">
                    <FolderTree className="w-2.5 h-2.5 text-gray-400 dark:text-white/25 shrink-0" />
                    <p className="text-[10px] text-gray-500 dark:text-white/35 truncate max-w-[120px]">{p.menuPath}</p>
                  </div>
                )}
                {p.requirementType && (
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    p.requirementType === 'new-menu'
                      ? 'bg-[#6366f1]/10 text-[#6366f1]'
                      : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {p.requirementType === 'new-menu' ? '新功能' : '功能调整'}
                  </span>
                )}
                <p className="text-[10px] text-gray-400 dark:text-white/25 ml-auto shrink-0">
                  {new Date(p.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* 操作区 */}
            <div className="shrink-0 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewProto(p)}
                disabled={!p.html}
                title={p.html ? '查看原型' : '已直接修改源文件'}
                className="flex items-center justify-center w-7 h-7 rounded-lg text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
                style={{ background: p.html ? c : '#9ca3af' }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              {deleteId === p.id ? (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => { onDelete(p.id); setDeleteId(null); }}
                    className="px-2 py-1 rounded-lg text-[10px] font-medium bg-red-500 text-white cursor-pointer"
                  >
                    确认
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(null)}
                    className="px-2 py-1 rounded-lg text-[10px] border border-line text-gray-500 cursor-pointer"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setDeleteId(p.id)}
                  className="flex items-center justify-center w-7 h-7 rounded-lg border border-line text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
