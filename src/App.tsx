import {
  Fragment,
  useState,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  type ChangeEvent,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Users, 
  LayoutDashboard, 
  Clock, 
  Tag,
  Search,
  Info,
  HelpCircle,
  Home,
  BarChart3,
  Flame,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  Plus,
  X,
  Settings,
  Settings2,
  Edit2,
  Check,
  ChevronDown,
  GraduationCap,
  Trash2,
  LayoutGrid,
  FileText,
  Upload,
  ImagePlus,
  Film,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  GripVertical,
  GitBranch,
  UsersRound,
  Shield,
  Gift,
  Building2,
  Headphones,
  FileSearch,
  Bell,
  ClipboardCheck,
  UserCog,
  Moon,
  Sun,
  Wand2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { 
  individualData, 
  teamData, 
  communityData, 
  brandRecommendationData,
  dramaRecommendationData,
  dramaCategoryData,
  fieldConfigurationDataBase,
  fieldConfigurationDescriptionDefaults,
  initialFieldDescriptionOverridesFromFile,
  LeaderboardEntry, 
  CommunityEntry,
  BrandRecommendation,
  DramaRecommendation,
  DramaCategory,
  FieldConfiguration,
  AcademyCategory,
  AcademyContent,
  academyCategoryInitialData,
  academyContentInitialData,
  type AcademyBrandProject,
  fetchAcademyBrandProjects
} from './mockData';
import {
  emptyProjectManagementForm,
  fetchMemberTypeNames,
  formToRow,
  PROJECT_CATEGORY_LABEL,
  rowToForm,
  type ProjectManagementFormState,
  type ProjectManagementRow,
} from './projectManagementModel';
import { ProjectManagementDrawerFields, ProjectManagementTable } from './ProjectManagementViews';
import {
  emptyIterationRecordForm,
  rowToIterationForm,
  createIterationRowFromForm,
  iterationContentPlainText,
  ITERATION_SCOPE_LABEL,
  ITERATION_STATUS_LABEL,
  parseIterationPriority,
  type IterationNavScope,
  type IterationRecordRow,
  type IterationRecordFormState,
} from './iterationRecordModel';
import { IterationRecordDrawerFields, IterationRecordTable, type IterationStaffOption } from './IterationRecordViews';
import {
  loadIterationRecordsFromStorage,
  loadProductStaffFromStorage,
  loadSectGuildFromStorage,
  loadRewardManagementFromStorage,
  loadProjectManagementFromStorage,
  loadYouboomTeamFromStorage,
  loadAcademyCategoriesFromStorage,
  loadAcademyContentsFromStorage,
  readLocalJson,
  saveIterationRecordsToStorage,
  saveProductStaffToStorage,
  saveSectGuildToStorage,
  saveRewardManagementToStorage,
  saveProjectManagementToStorage,
  saveYouboomTeamToStorage,
  saveAcademyCategoriesToStorage,
  saveAcademyContentsToStorage,
  STORAGE_KEYS,
  writeFieldConfigDescriptionOverridesToStorage,
} from './localWorkspacePersistence';
import { useResizableTableColumns } from './resizableTableColumns';
import {
  createProductStaffRow,
  emptyProductStaffForm,
  rowToProductStaffForm,
  type ProductStaffFormState,
  type ProductStaffRow,
} from './productStaffModel';
import { ProductStaffDrawerFields, ProductStaffTable } from './ProductStaffViews';
import {
  createSectGuildRowFromForm,
  emptySectGuildForm,
  rowToSectGuildForm,
  type SectGuildFormState,
  type SectGuildStatus,
} from './sectGuildModel';
import { SectGuildDrawerFields, SectGuildTable } from './SectGuildViews';
import {
  RewardApproveConfirmModal,
  RewardBatchImportDrawer,
  RewardManagementTable,
  RewardPaymentQueueDrawer,
  RewardRejectModal,
} from './RewardManagementViews';
import {
  emptyRewardMgmtSearch,
  exportRewardMgmtExcel,
  downloadRewardImportExcelTemplate,
  REWARD_AUDIT_LABEL,
  REWARD_BUSINESS_LABEL,
  REWARD_PAYMENT_LABEL,
  type RewardManagementRow,
} from './rewardManagementModel';
import { YouboomTeamTable } from './YouboomTeamViews';
import { Pagination } from './Pagination';
import {
  emptyYouboomTeamSearch,
  type YouboomTeamSortField,
  type SortOrder,
} from './youboomTeamModel';
import { RichTextEditor } from './RichTextEditor';
import {
  PAGE_RULE_CATALOG,
  PRODUCT_LINE_NAV_ORDER,
  PRODUCT_LINE_TAB_LABEL,
  type ProductLine,
} from './pageRuleCatalog';
import { RuleDescriptionPage } from './RuleDescriptionPage';
import { MenuRuleDescriptionModal, NavRuleHintButton } from './MenuRuleDescriptionModal';
import { MODULE_RULE_ROUTE_KEYS } from './secondaryNavRuleRoutes';
import { CustomerServiceManagementPage } from './CustomerServiceManagementPage';
import { OrganizationMentorManagementPage } from './OrganizationMentorManagementPage';
import { OrganizationProjectAllocationPage } from './OrganizationProjectAllocationPage';
import { EntryAuditWorkbenchPage } from './EntryAuditWorkbenchPage';
import { MessageNotificationRecordsPage } from './MessageNotificationRecordsPage';
import { GanttMapPage, type GanttBarRef } from './GanttMapPage';
import { DashboardPage } from './DashboardPage';
import RequirementPrototypePage from './RequirementPrototypePage';
import PrototypeViewerPage from './PrototypeViewerPage';
import {
  loadPrototypes,
  savePrototypes,
  type SavedPrototype,
  type PrototypeProductLine,
  PRODUCT_LINE_LABEL as PROTO_PRODUCT_LINE_LABEL,
} from './savedPrototypesModel';
import { DevSaveToRepo } from './DevSaveToRepo';

const PM_DRAWER_WIDTH_STORAGE_KEY = 'ybdiedai-pm-drawer-width';
const ITERATION_RECORD_DRAWER_WIDTH_STORAGE_KEY = 'ybdiedai-iteration-record-drawer-width';

function readInitialPmDrawerWidth(): number {
  if (typeof window === 'undefined') return 640;
  try {
    const raw = localStorage.getItem(PM_DRAWER_WIDTH_STORAGE_KEY);
    const n = raw ? parseInt(raw, 10) : NaN;
    if (Number.isFinite(n)) return Math.max(420, Math.min(1200, n));
  } catch {
    /* ignore */
  }
  return 640;
}

function readInitialIterationRecordDrawerWidth(): number {
  if (typeof window === 'undefined') return 640;
  try {
    const raw = localStorage.getItem(ITERATION_RECORD_DRAWER_WIDTH_STORAGE_KEY);
    const n = raw ? parseInt(raw, 10) : NaN;
    if (Number.isFinite(n)) return Math.max(420, Math.min(1200, n));
  } catch {
    /* ignore */
  }
  return 640;
}

/** 历史整表 JSON（仍可读并迁移出说明） */

function migrateLegacyFullArrayToDescriptionOverrides(raw: string): Record<string, string> | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const rec: Record<string, string> = {};
    for (const x of parsed) {
      if (typeof x !== 'object' || x === null) continue;
      const o = x as Record<string, unknown>;
      if (typeof o.id === 'string' && typeof o.description === 'string') {
        rec[o.id] = o.description;
      }
    }
    return Object.keys(rec).length > 0 ? rec : null;
  } catch {
    return null;
  }
}

function loadDescriptionOverrides(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const directParsed = readLocalJson<unknown>(STORAGE_KEYS.fieldConfigDescriptionOverrides);
  if (directParsed && typeof directParsed === 'object' && !Array.isArray(directParsed)) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(directParsed as Record<string, unknown>)) {
      if (typeof v === 'string') out[k] = v;
    }
    if (Object.keys(out).length > 0) return out;
  }
  const legacy = localStorage.getItem(STORAGE_KEYS.fieldConfigLegacyFull);
  if (legacy) {
    const migrated = migrateLegacyFullArrayToDescriptionOverrides(legacy);
    if (migrated) {
      writeFieldConfigDescriptionOverridesToStorage(migrated);
      return migrated;
    }
  }
  return {};
}

function compactOverridesForWorkspace(overrides: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [id, text] of Object.entries(overrides)) {
    if (!/^(f\d+|yb\d+|mt\d+)$/.test(id)) continue;
    const def = fieldConfigurationDescriptionDefaults[id];
    if (def !== undefined && text !== def) out[id] = text;
  }
  return out;
}

function persistDescriptionOverrides(overrides: Record<string, string>) {
  writeFieldConfigDescriptionOverridesToStorage(overrides);
  const compact = compactOverridesForWorkspace(overrides);
  void fetch('/__dev/api/save-field-config-descriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ overrides: compact }),
  })
    .then((r) => {
      if (!r.ok) {
        console.warn(
          '[字段配置] 未写入仓库文件（需本地运行 npm run dev；预览/生产构建无写盘接口）。已保留 localStorage。'
        );
      }
    })
    .catch(() => {
      console.warn(
        '[字段配置] 无法连接开发服务器写入 src/field-configuration-description-overrides.json，已仅写入 localStorage。'
      );
    });
}

function buildFieldConfigsFromOverrides(overrides: Record<string, string>): FieldConfiguration[] {
  return fieldConfigurationDataBase.map((row) => ({
    ...row,
    description: overrides[row.id] ?? row.description,
    fieldCnName:
      row.fieldEnName === 'dimension' && row.fieldCnName === '统计纬度'
        ? '统计维度'
        : row.fieldCnName,
  }));
}

type ModuleType =
  | 'leaderboard'
  | 'recommendation'
  | 'academy'
  | 'projectManagement'
  | 'iterationRecord'
  | 'sectManagement'
  | 'customerServiceManagement'
  | 'organizationMentorManagement'
  | 'organizationProjectAllocation'
  | 'auditEntryWorkbench'
  | 'auditMessageNotification'
  | 'config'
  | 'ruleDescription'
  | 'rewardManagement'
  | 'youboomTeam'
  | 'productStaff'
  | 'ganttMap'
  | 'dashboard'
  | 'requirementPrototype';

const MODULE_PAGE_TITLE: Record<ModuleType, string> = {
  leaderboard: '榜单数据',
  recommendation: '首页推荐',
  academy: '学院管理',
  projectManagement: '项目管理',
  iterationRecord: '迭代记录',
  sectManagement: '门派管理',
  customerServiceManagement: '客服管理',
  organizationMentorManagement: '导师管理',
  organizationProjectAllocation: '项目分配',
  auditEntryWorkbench: '录入审核工作台',
  auditMessageNotification: '消息通知记录',
  rewardManagement: '奖励管理',
  youboomTeam: '团队数据',
  config: '字段配置',
  ruleDescription: '规则说明',
  productStaff: '产研人员管理',
  ganttMap: '甘特地图',
  dashboard: 'Dashboard',
  requirementPrototype: '需求原型设计',
};

type LeaderboardTab = 'individual' | 'team' | 'community';
type RecommendationTab = 'brand' | 'drama' | 'category';
type AcademyTab = 'academy-category' | 'academy-content';

type DramaCategoryFormState = {
  name: string;
  taskType: DramaCategory['taskType'];
  relatedBusiness: string[];
  sort: number;
  status: 'show' | 'hide';
};

type AcademyCategoryFormState = {
  name: string;
  kingkong: 'yes' | 'no';
  icon: string;
  sort: number;
  status: 'show' | 'hide';
};

type AcademyBatchVideoRow = {
  localId: string;
  file: File;
  /** 演示用：同一本地文件拆成上传中 / 成功 / 失败三条 mock */
  mockOutcome?: 'success' | 'failed' | 'uploading';
  status: 'queued' | 'uploading' | 'success' | 'failed';
  progress: number;
  url?: string;
  errorMessage?: string;
};

type AcademyBatchUploadForm = {
  youbaoId: string;
  tag: AcademyContent['tag'];
  categoryId: string;
  projectName: string;
  projectId: string;
  videoRows: AcademyBatchVideoRow[];
};

type AcademyContentFormState = {
  youbaoId: string;
  cover: string;
  title: string;
  tag: AcademyContent['tag'];
  categoryId: string;
  projectName: string;
  projectId: string;
  contentType: AcademyContent['contentType'];
  content: string;
  status: 'show' | 'hide';
};

type SideDrawerState =
  | { variant: 'drama-category'; editingId: string | null; form: DramaCategoryFormState }
  | { variant: 'academy-category'; editingId: string | null; form: AcademyCategoryFormState }
  | { variant: 'academy-content'; editingId: string | null; form: AcademyContentFormState }
  | { variant: 'project-management'; editingId: string | null; form: ProjectManagementFormState }
  | {
      variant: 'iteration-record';
      editingId: string | null;
      scope: IterationNavScope;
      form: IterationRecordFormState;
    }
  | { variant: 'sect-guild'; editingId: string | null; form: SectGuildFormState }
  | { variant: 'product-staff'; editingId: string | null; form: ProductStaffFormState };

/** 各模块文本检索：草稿在输入框中编辑，点击「搜索」后写入 applied 参与列表过滤 */
type TextSearchForm = {
  lbRank: { userId: string; nickname: string };
  community: { id: string; name: string };
  brand: { projectName: string; projectId: string };
  drama: { taskName: string; taskId: string; projectName: string };
  category: { name: string; relatedBusiness: string };
  config: { menuName: string; routeKey: string; fieldCnName: string; fieldEnName: string };
  academyCat: { name: string };
  academyContent: {
    title: string;
    youbaoId: string;
    projectName: string;
  };
  projectMgmt: { keyword: string };
  iterationRecord: { title: string; content: string };
  sectGuild: { keyword: string };
  productStaff: { name: string };
};

function createEmptyTextSearch(): TextSearchForm {
  return {
    lbRank: { userId: '', nickname: '' },
    community: { id: '', name: '' },
    brand: { projectName: '', projectId: '' },
    drama: { taskName: '', taskId: '', projectName: '' },
    category: { name: '', relatedBusiness: '' },
    config: { menuName: '', routeKey: '', fieldCnName: '', fieldEnName: '' },
    academyCat: { name: '' },
    academyContent: {
      title: '',
      youbaoId: '',
      projectName: '',
    },
    projectMgmt: { keyword: '' },
    iterationRecord: { title: '', content: '' },
    sectGuild: { keyword: '' },
    productStaff: { name: '' },
  };
}

const textFieldInputClass =
  'min-w-[120px] max-w-[200px] px-3 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 shadow-sm';

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleType>('ganttMap');
  const [leaderboardTab, setLeaderboardTab] = useState<LeaderboardTab>('individual');
  const [recommendationTab, setRecommendationTab] = useState<RecommendationTab>('brand');
  const [academyTab, setAcademyTab] = useState<AcademyTab>('academy-category');
  
  const [textSearchDraft, setTextSearchDraft] = useState<TextSearchForm>(() => createEmptyTextSearch());
  const [textSearchApplied, setTextSearchApplied] = useState<TextSearchForm>(() => createEmptyTextSearch());
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dimensionFilter, setDimensionFilter] = useState<string>('all');
  const [hotFilter, setHotFilter] = useState<string>('all');
  const [newFilter, setNewFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [academyCatKingkongFilter, setAcademyCatKingkongFilter] = useState<string>('all');
  const [academyCatStatusFilter, setAcademyCatStatusFilter] = useState<string>('all');
  const [academyContentCategoryFilter, setAcademyContentCategoryFilter] = useState<string>('all');
  const [academyContentTypeFilter, setAcademyContentTypeFilter] = useState<string>('all');
  const [academyContentTagFilter, setAcademyContentTagFilter] = useState<string>('all');
  const [academyContentStatusFilter, setAcademyContentStatusFilter] = useState<string>('all');
  const [projectMgmtRows, setProjectMgmtRows] = useState<ProjectManagementRow[]>(() => loadProjectManagementFromStorage());
  const [memberTypeNames, setMemberTypeNames] = useState<string[]>([]);
  const [projectMgmtCategoryFilter, setProjectMgmtCategoryFilter] = useState<
    'all' | 'tweet' | 'drama' | 'resource' | 'app'
  >('all');
  const [projectMgmtStatusFilter, setProjectMgmtStatusFilter] = useState<'all' | 'show' | 'hide'>('all');
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [sidebarPrevWidth, setSidebarPrevWidth] = useState(256);
  const [sidebarIsResizing, setSidebarIsResizing] = useState(false);
  const isIconOnly = sidebarWidth <= 56;
  const [iterationRecordStatusFilter, setIterationRecordStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'testing' | 'released'>('all');
  const [ganttProductLine, setGanttProductLine] = useState<ProductLine>('youbao');
  const [iterationRecordScope, setIterationRecordScope] = useState<IterationNavScope>('youbao');
  const [iterationRecordRows, setIterationRecordRows] = useState<IterationRecordRow[]>(() =>
    loadIterationRecordsFromStorage()
  );
  const [productStaffRows, setProductStaffRows] = useState<ProductStaffRow[]>(() => loadProductStaffFromStorage());
  const [menuRuleModal, setMenuRuleModal] = useState<{
    open: boolean;
    navTitle: string;
    routeKeys: readonly string[];
  }>({ open: false, navTitle: '', routeKeys: [] });

  const openMenuRuleModalFromKeys = useCallback((navTitle: string, routeKeys: readonly string[]) => {
    setMenuRuleModal({ open: true, navTitle, routeKeys });
  }, []);

  const closeMenuRuleModal = useCallback(() => {
    setMenuRuleModal((s) => ({ ...s, open: false }));
  }, []);
  const [sectGuildRows, setSectGuildRows] = useState(() => loadSectGuildFromStorage());
  const [rewardMgmtRows, setRewardMgmtRows] = useState<RewardManagementRow[]>(() => loadRewardManagementFromStorage());
  const [rewardMgmtSelectedIds, setRewardMgmtSelectedIds] = useState<string[]>([]);
  const [rewardMgmtSearchDraft, setRewardMgmtSearchDraft] = useState(emptyRewardMgmtSearch);
  const [rewardMgmtSearchApplied, setRewardMgmtSearchApplied] = useState(emptyRewardMgmtSearch);
  const [youboomTeamRows] = useState(() => loadYouboomTeamFromStorage());
  const [youboomTeamSearchDraft, setYouboomTeamSearchDraft] = useState(emptyYouboomTeamSearch);
  const [youboomTeamSearchApplied, setYouboomTeamSearchApplied] = useState(emptyYouboomTeamSearch);
  const [youboomTeamSortField, setYouboomTeamSortField] = useState<YouboomTeamSortField | null>(null);
  const [youboomTeamSortOrder, setYouboomTeamSortOrder] = useState<SortOrder>(null);
  const [rewardImportDrawerOpen, setRewardImportDrawerOpen] = useState(false);
  const [rewardPaymentQueueOpen, setRewardPaymentQueueOpen] = useState(false);
  const [rewardRejectModalOpen, setRewardRejectModalOpen] = useState(false);
  const [rewardApproveModalOpen, setRewardApproveModalOpen] = useState(false);
  const [rewardBatchPayConfirm, setRewardBatchPayConfirm] = useState<{ count: number; total: number } | null>(null);
  const [projectMgmtDrawerWidth, setProjectMgmtDrawerWidth] = useState(readInitialPmDrawerWidth);
  const [iterationRecordDrawerWidth, setIterationRecordDrawerWidth] = useState(
    readInitialIterationRecordDrawerWidth
  );
  const drawerResizeDragRef = useRef<{
    kind: 'project-management' | 'iteration-record';
    startX: number;
    startW: number;
  } | null>(null);
  const [sideDrawer, setSideDrawer] = useState<SideDrawerState | null>(null);
  const isDrawerOpen = sideDrawer !== null;

  const [academyCategories, setAcademyCategories] = useState<AcademyCategory[]>(() => loadAcademyCategoriesFromStorage());
  const [academyContents, setAcademyContents] = useState<AcademyContent[]>(() => loadAcademyContentsFromStorage());
  const [selectedAcademyContentIds, setSelectedAcademyContentIds] = useState<string[]>([]);
  const [contentPreview, setContentPreview] = useState<{
    title: string;
    contentType: AcademyContent['contentType'];
    content: string;
  } | null>(null);
  const academyBatchVideoInputRef = useRef<HTMLInputElement>(null);
  /** 系统文件框关闭后可能误点遮罩；此时间戳前忽略遮罩关闭 */
  const academyBatchFilePickerShieldUntilRef = useRef(0);
  const academyBatchDrawerOpenRef = useRef(false);
  const [academyBatchDrawerOpen, setAcademyBatchDrawerOpen] = useState(false);
  const [academyBatchForm, setAcademyBatchForm] = useState<AcademyBatchUploadForm>({
    youbaoId: '',
    tag: 'hot',
    categoryId: '',
    projectName: '',
    projectId: '',
    videoRows: [],
  });
  const [brandProjects, setBrandProjects] = useState<AcademyBrandProject[]>([]);
  const [fieldDescriptionOverrides, setFieldDescriptionOverrides] = useState<Record<string, string>>(() => ({
    ...loadDescriptionOverrides(),
    ...initialFieldDescriptionOverridesFromFile,
  }));
  const fieldConfigs = useMemo(
    () => buildFieldConfigsFromOverrides(fieldDescriptionOverrides),
    [fieldDescriptionOverrides]
  );
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const fieldEditBaselineRef = useRef<{ id: string; description: string } | null>(null);

  useEffect(() => {
    if (!editingFieldId) return;
    const id = editingFieldId;
    const text = editDescription;
    const t = window.setTimeout(() => {
      setFieldDescriptionOverrides((prev) => {
        const next = { ...prev, [id]: text };
        persistDescriptionOverrides(next);
        return next;
      });
    }, 480);
    return () => window.clearTimeout(t);
  }, [editingFieldId, editDescription]);

  useEffect(() => {
    saveIterationRecordsToStorage(iterationRecordRows);
  }, [iterationRecordRows]);

  useEffect(() => {
    saveProductStaffToStorage(productStaffRows);
  }, [productStaffRows]);

  useEffect(() => {
    saveSectGuildToStorage(sectGuildRows);
  }, [sectGuildRows]);

  useEffect(() => {
    saveRewardManagementToStorage(rewardMgmtRows);
  }, [rewardMgmtRows]);

  useEffect(() => {
    saveProjectManagementToStorage(projectMgmtRows);
  }, [projectMgmtRows]);

  useEffect(() => {
    saveYouboomTeamToStorage(youboomTeamRows);
  }, [youboomTeamRows]);

  useEffect(() => {
    saveAcademyCategoriesToStorage(academyCategories);
  }, [academyCategories]);

  useEffect(() => {
    saveAcademyContentsToStorage(academyContents);
  }, [academyContents]);

  useEffect(() => {
    if (activeModule !== 'academy') return;
    let cancelled = false;
    void fetchAcademyBrandProjects().then((list) => {
      if (!cancelled) setBrandProjects(list);
    });
    return () => {
      cancelled = true;
    };
  }, [activeModule]);

  useEffect(() => {
    if (activeModule !== 'projectManagement') return;
    let cancelled = false;
    void fetchMemberTypeNames().then((list) => {
      if (!cancelled) setMemberTypeNames(list);
    });
    return () => {
      cancelled = true;
    };
  }, [activeModule]);

  const clampPmDrawerWidth = useCallback((w: number) => {
    if (typeof window === 'undefined') return Math.max(420, Math.min(1200, w));
    const max = Math.min(1200, window.innerWidth - 24);
    return Math.max(420, Math.min(max, Math.round(w)));
  }, []);

  useEffect(() => {
    const onResize = () => {
      setProjectMgmtDrawerWidth((v) => clampPmDrawerWidth(v));
      setIterationRecordDrawerWidth((v) => clampPmDrawerWidth(v));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampPmDrawerWidth]);

  const onResizableDrawerResizePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>, kind: 'project-management' | 'iteration-record') => {
      if (sideDrawer?.variant !== kind) return;
      e.preventDefault();
      const startW = kind === 'project-management' ? projectMgmtDrawerWidth : iterationRecordDrawerWidth;
      drawerResizeDragRef.current = { kind, startX: e.clientX, startW };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [sideDrawer, projectMgmtDrawerWidth, iterationRecordDrawerWidth]
  );

  const onResizableDrawerResizePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!drawerResizeDragRef.current) return;
      const { kind, startX, startW } = drawerResizeDragRef.current;
      const delta = startX - e.clientX;
      const next = clampPmDrawerWidth(startW + delta);
      if (kind === 'project-management') setProjectMgmtDrawerWidth(next);
      else setIterationRecordDrawerWidth(next);
    },
    [clampPmDrawerWidth]
  );

  const onResizableDrawerResizePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const drag = drawerResizeDragRef.current;
      if (drag) {
        drawerResizeDragRef.current = null;
        if (drag.kind === 'project-management') {
          setProjectMgmtDrawerWidth((w) => {
            const c = clampPmDrawerWidth(w);
            try {
              localStorage.setItem(PM_DRAWER_WIDTH_STORAGE_KEY, String(c));
            } catch {
              /* ignore */
            }
            return c;
          });
        } else {
          setIterationRecordDrawerWidth((w) => {
            const c = clampPmDrawerWidth(w);
            try {
              localStorage.setItem(ITERATION_RECORD_DRAWER_WIDTH_STORAGE_KEY, String(c));
            } catch {
              /* ignore */
            }
            return c;
          });
        }
      }
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [clampPmDrawerWidth]
  );

  useEffect(() => {
    academyBatchDrawerOpenRef.current = academyBatchDrawerOpen;
  }, [academyBatchDrawerOpen]);

  const runBatchVideoRowUpload = useCallback(
    (localId: string, file: File, mockOutcome?: AcademyBatchVideoRow['mockOutcome']) => {
      const rowStillPresent = (rows: AcademyBatchVideoRow[]) => rows.some((r) => r.localId === localId);

      if (mockOutcome === 'uploading') {
        const slowSteps = [8, 22, 38, 55, 72, 86, 92];
        let i = 0;
        const slowTick = () => {
          setAcademyBatchForm((prev) => {
            if (!rowStillPresent(prev.videoRows)) return prev;
            if (i < slowSteps.length) {
              const p = slowSteps[i++];
              return {
                ...prev,
                videoRows: prev.videoRows.map((r) =>
                  r.localId === localId ? { ...r, status: 'uploading', progress: p } : r
                ),
              };
            }
            return {
              ...prev,
              videoRows: prev.videoRows.map((r) =>
                r.localId === localId ? { ...r, status: 'uploading', progress: 92 } : r
              ),
            };
          });
          if (i < slowSteps.length) window.setTimeout(slowTick, 420);
        };
        setAcademyBatchForm((prev) => {
          if (!rowStillPresent(prev.videoRows)) return prev;
          return {
            ...prev,
            videoRows: prev.videoRows.map((r) =>
              r.localId === localId ? { ...r, status: 'uploading', progress: 5 } : r
            ),
          };
        });
        window.setTimeout(slowTick, 180);
        return;
      }

      const steps = [18, 40, 62, 84, 100];
      let stepIdx = 0;
      const tick = () => {
        if (stepIdx < steps.length) {
          const p = steps[stepIdx++];
          setAcademyBatchForm((prev) => {
            if (!rowStillPresent(prev.videoRows)) return prev;
            return {
              ...prev,
              videoRows: prev.videoRows.map((r) =>
                r.localId === localId ? { ...r, status: 'uploading', progress: p } : r
              ),
            };
          });
          window.setTimeout(tick, 200);
        } else {
          const shouldFail =
            mockOutcome === 'failed' ||
            (mockOutcome === undefined && file.name.toLowerCase().includes('fail'));
          setAcademyBatchForm((prev) => {
            if (!rowStillPresent(prev.videoRows)) return prev;
            return {
              ...prev,
              videoRows: prev.videoRows.map((r) => {
                if (r.localId !== localId) return r;
                if (shouldFail) {
                  return {
                    ...r,
                    status: 'failed',
                    progress: 0,
                    errorMessage:
                      mockOutcome === 'failed'
                        ? '演示：上传失败'
                        : '上传失败（文件名包含 fail 时用于联调模拟）',
                  };
                }
                return { ...r, status: 'success', progress: 100, url: URL.createObjectURL(file) };
              }),
            };
          });
        }
      };
      setAcademyBatchForm((prev) => {
        if (!rowStillPresent(prev.videoRows)) return prev;
        return {
          ...prev,
          videoRows: prev.videoRows.map((r) =>
            r.localId === localId ? { ...r, status: 'uploading', progress: 5 } : r
          ),
        };
      });
      window.setTimeout(tick, 160);
    },
    []
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  /** 系统配置内「字段配置 / 规则说明」子 Tab：与 `PRODUCT_LINE_NAV_ORDER` 一级菜单对齐 */
  const [systemProductLine, setSystemProductLine] = useState<ProductLine>('youbao');

  const systemProductLineTabIcons: Record<ProductLine, typeof Layers> = {
    youbao: Layers,
    youboom: Sparkles,
    mentor: UsersRound,
  };
  const [ruleDescSearchDraft, setRuleDescSearchDraft] = useState('');
  const [ruleDescSearchApplied, setRuleDescSearchApplied] = useState('');

  const [navSections, setNavSections] = useState({
    youbao: true,
    youboom: false,
    mentor: true,
    mentorOrg: true,
    mentorAudit: true,
    system: true,
  });

  const youbaoChildren = [
    { id: 'dashboard' as const, name: 'Dashboard', icon: LayoutDashboard },
    { id: 'leaderboard' as const, name: '榜单数据', icon: BarChart3 },
    { id: 'recommendation' as const, name: '首页推荐', icon: Home },
    { id: 'academy' as const, name: '学院管理', icon: GraduationCap },
    { id: 'projectManagement' as const, name: '项目管理', icon: FolderKanban },
  ];

  const showDataTabs =
    activeModule === 'leaderboard' ||
    activeModule === 'recommendation' ||
    activeModule === 'academy';

  const showTableToolbar =
    showDataTabs ||
    activeModule === 'config' ||
    activeModule === 'ruleDescription' ||
    activeModule === 'projectManagement' ||
    activeModule === 'iterationRecord' ||
    activeModule === 'productStaff' ||
    activeModule === 'sectManagement' ||
    activeModule === 'rewardManagement' ||
    activeModule === 'youboomTeam';

  const hideMainPageHeader =
    activeModule === 'customerServiceManagement' ||
    activeModule === 'auditEntryWorkbench' ||
    activeModule === 'auditMessageNotification' ||
    activeModule === 'requirementPrototype';

  const pageRuleHeaderAction = useMemo(() => {
    if (activeModule === 'ganttMap' || activeModule === 'dashboard') {
      return { show: false as const, navTitle: '', routeKeys: [] as const };
    }
    if (activeModule === 'leaderboard') {
      if (leaderboardTab === 'community') {
        return { show: true as const, navTitle: '品牌社群榜单', routeKeys: ['community'] as const };
      }
      return { show: true as const, navTitle: '榜单数据', routeKeys: ['leaderboard'] as const };
    }
    if (activeModule === 'recommendation') {
      if (recommendationTab === 'brand') {
        return { show: true as const, navTitle: '品牌推荐', routeKeys: ['brand'] as const };
      }
      if (recommendationTab === 'drama') {
        return { show: true as const, navTitle: '剧作推荐', routeKeys: ['drama'] as const };
      }
      return { show: true as const, navTitle: '剧作分类', routeKeys: ['category'] as const };
    }
    if (activeModule === 'academy') {
      if (academyTab === 'academy-category') {
        return { show: true as const, navTitle: '分类管理', routeKeys: ['academy-category'] as const };
      }
      return { show: true as const, navTitle: '内容配置', routeKeys: ['academy-content'] as const };
    }
    if (activeModule === 'ruleDescription') {
      const keys = PAGE_RULE_CATALOG.filter((c) => c.productLine === systemProductLine).map((c) => c.routeKey);
      return {
        show: true as const,
        navTitle: `${PRODUCT_LINE_TAB_LABEL[systemProductLine]} · 规则说明`,
        routeKeys: keys,
      };
    }
    const routeKeys = MODULE_RULE_ROUTE_KEYS[activeModule as keyof typeof MODULE_RULE_ROUTE_KEYS];
    if (!routeKeys) return { show: false as const, navTitle: '', routeKeys: [] as const };
    return {
      show: true as const,
      navTitle: MODULE_PAGE_TITLE[activeModule],
      routeKeys,
    };
  }, [activeModule, leaderboardTab, recommendationTab, academyTab, systemProductLine]);

  const contentShellClass =
    activeModule === 'ruleDescription' || hideMainPageHeader
      ? 'bg-transparent border-0 shadow-none rounded-2xl'
      : 'bg-white border border-line rounded-2xl shadow-sm';

  const projectMgmtFieldRules: Record<string, string> = {
    projectId: '列表中的业务项目唯一标识。',
    category: '推文、短剧、资源、应用四类所属分类。',
    sort: '列表排序权重，数值越大越靠前。',
    virtualIncome: '用于展示的虚拟收益数值。',
    frontTitle: '前台 C 端展示的项目标题。',
    backTitle: '后台列表中使用的项目名称。',
    boomSort: '爆单榜等场景的排序权重或序号。',
    projectTags: '项目侧标签文案，多个可用逗号分隔。',
    projectStatus: '显示或隐藏控制前台是否露出。',
    hotProject: '是否标记为热门项目。',
    isNewProduct: '是否标记为新品。',
    onlineState: '上线或下线，控制业务可用状态。',
    memberType: '可见该项目的会员档位或策略名称。',
    updateTime: '最近一次保存或同步的时间。',
  };

  const academyCategoryRows = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of academyContents) {
      counts[c.categoryId] = (counts[c.categoryId] ?? 0) + 1;
    }
    return [...academyCategories]
      .map((c) => ({ ...c, contentCount: counts[c.id] ?? 0 }))
      .sort((a, b) => b.sort - a.sort);
  }, [academyCategories, academyContents]);

  const filteredAcademyCategoryRows = useMemo(() => {
    const t = textSearchApplied.academyCat;
    const qName = t.name.trim().toLowerCase();
    return academyCategoryRows.filter((row) => {
      const matchesSearch = !qName || row.name.toLowerCase().includes(qName);
      const matchesKingkong =
        academyCatKingkongFilter === 'all' ||
        (academyCatKingkongFilter === 'yes' && row.kingkong === 'yes') ||
        (academyCatKingkongFilter === 'no' && row.kingkong === 'no') ||
        (academyCatKingkongFilter === 'unset' && row.kingkong === 'unset');
      const matchesStatus =
        academyCatStatusFilter === 'all' ||
        (academyCatStatusFilter === 'show' && row.status === 'show') ||
        (academyCatStatusFilter === 'hide' && row.status === 'hide');
      return matchesSearch && matchesKingkong && matchesStatus;
    });
  }, [academyCategoryRows, textSearchApplied.academyCat, academyCatKingkongFilter, academyCatStatusFilter]);

  const filteredAcademyContents = useMemo(() => {
    const t = textSearchApplied.academyContent;
    const qTitle = t.title.trim().toLowerCase();
    const qYb = t.youbaoId.trim().toLowerCase();
    const qPn = t.projectName.trim().toLowerCase();
    return academyContents.filter((row) => {
      const matchesSearch =
        (!qTitle || row.title.toLowerCase().includes(qTitle)) &&
        (!qYb || row.youbaoId.toLowerCase().includes(qYb)) &&
        (!qPn || row.projectName.toLowerCase().includes(qPn));
      const matchesCategory =
        academyContentCategoryFilter === 'all' || row.categoryId === academyContentCategoryFilter;
      const matchesType =
        academyContentTypeFilter === 'all' || row.contentType === academyContentTypeFilter;
      const matchesTag =
        academyContentTagFilter === 'all' || row.tag === academyContentTagFilter;
      const matchesStatus =
        academyContentStatusFilter === 'all' ||
        (academyContentStatusFilter === 'show' && row.status === 'show') ||
        (academyContentStatusFilter === 'hide' && row.status === 'hide');
      return matchesSearch && matchesCategory && matchesType && matchesTag && matchesStatus;
    });
  }, [
    academyContents,
    textSearchApplied.academyContent,
    academyContentCategoryFilter,
    academyContentTypeFilter,
    academyContentTagFilter,
    academyContentStatusFilter,
  ]);

  const filteredLeaderboardData = useMemo(() => {
    const baseData = leaderboardTab === 'individual' ? individualData : teamData;
    const { userId, nickname } = textSearchApplied.lbRank;
    const qu = userId.trim().toLowerCase();
    const qn = nickname.trim().toLowerCase();
    return baseData.filter((item) => {
      const matchesSearch =
        (!qu || item.id.toLowerCase().includes(qu)) && (!qn || item.nickname.toLowerCase().includes(qn));
      const matchesType =
        typeFilter === 'all' ||
        (typeFilter === 'individual' && item.type === 'individual') ||
        (typeFilter === 'project' && item.type === 'project');
      const matchesDimension = dimensionFilter === 'all' || item.dimension === dimensionFilter;
      return matchesSearch && matchesType && matchesDimension;
    });
  }, [leaderboardTab, textSearchApplied.lbRank, typeFilter, dimensionFilter]);

  const filteredCommunityData = useMemo(() => {
    const { id, name } = textSearchApplied.community;
    const qi = id.trim().toLowerCase();
    const qn = name.trim().toLowerCase();
    return communityData.filter((item) => {
      const matchesSearch =
        (!qi || item.id.toLowerCase().includes(qi)) && (!qn || item.name.toLowerCase().includes(qn));
      const matchesDimension = dimensionFilter === 'all' || item.dimension === dimensionFilter;
      return matchesSearch && matchesDimension;
    });
  }, [textSearchApplied.community, dimensionFilter]);

  const filteredBrandData = useMemo(() => {
    const { projectName, projectId } = textSearchApplied.brand;
    const qp = projectName.trim().toLowerCase();
    const qid = projectId.trim().toLowerCase();
    return brandRecommendationData.filter((item) => {
      const matchesSearch =
        (!qp || item.projectName.toLowerCase().includes(qp)) && (!qid || item.projectId.toLowerCase().includes(qid));
      const matchesType = typeFilter === 'all' || item.projectType === typeFilter;
      const matchesHot = hotFilter === 'all' || (hotFilter === 'yes' ? item.isHot : !item.isHot);
      const matchesNew = newFilter === 'all' || (newFilter === 'yes' ? item.isNew : !item.isNew);
      const matchesDate = !dateFilter || item.recommendDate === dateFilter;
      return matchesSearch && matchesType && matchesHot && matchesNew && matchesDate;
    });
  }, [textSearchApplied.brand, typeFilter, hotFilter, newFilter, dateFilter]);

  const filteredDramaData = useMemo(() => {
    const { taskName, taskId, projectName } = textSearchApplied.drama;
    const qt = taskName.trim().toLowerCase();
    const qid = taskId.trim().toLowerCase();
    const qp = projectName.trim().toLowerCase();
    return dramaRecommendationData.filter((item) => {
      const matchesSearch =
        (!qt || item.taskName.toLowerCase().includes(qt)) &&
        (!qid || item.taskId.toLowerCase().includes(qid)) &&
        (!qp || item.projectName.toLowerCase().includes(qp));
      const matchesHot = hotFilter === 'all' || (hotFilter === 'yes' ? item.isHot : !item.isHot);
      const matchesNew = newFilter === 'all' || (newFilter === 'yes' ? item.isNew : !item.isNew);
      return matchesSearch && matchesHot && matchesNew;
    });
  }, [textSearchApplied.drama, hotFilter, newFilter]);

  const filteredCategoryData = useMemo(() => {
    const { name, relatedBusiness } = textSearchApplied.category;
    const qn = name.trim().toLowerCase();
    const qb = relatedBusiness.trim().toLowerCase();
    return dramaCategoryData.filter((item) => {
      const matchesSearch =
        (!qn || item.name.toLowerCase().includes(qn)) &&
        (!qb || item.relatedBusiness.some((biz) => biz.toLowerCase().includes(qb)));
      return matchesSearch;
    });
  }, [textSearchApplied.category]);

  const filteredConfigData = useMemo(() => {
    const { menuName, routeKey, fieldCnName, fieldEnName } = textSearchApplied.config;
    const qm = menuName.trim().toLowerCase();
    const qr = routeKey.trim().toLowerCase();
    const qc = fieldCnName.trim().toLowerCase();
    const qe = fieldEnName.trim().toLowerCase();
    return fieldConfigs.filter((item) => {
      const line = item.productLine ?? 'youbao';
      if (line !== systemProductLine) return false;
      const matchesSearch =
        (!qm || item.menuName.toLowerCase().includes(qm)) &&
        (!qr || item.routeKey.toLowerCase().includes(qr)) &&
        (!qc || item.fieldCnName.toLowerCase().includes(qc)) &&
        (!qe || item.fieldEnName.toLowerCase().includes(qe));
      return matchesSearch;
    });
  }, [textSearchApplied.config, fieldConfigs, systemProductLine]);

  const filteredProjectMgmtRows = useMemo(() => {
    const q = textSearchApplied.projectMgmt.keyword.trim().toLowerCase();
    return projectMgmtRows.filter((row) => {
      const matchesKw =
        !q ||
        row.id.toLowerCase().includes(q) ||
        row.frontTitle.toLowerCase().includes(q) ||
        row.backTitle.toLowerCase().includes(q);
      const matchesCat = projectMgmtCategoryFilter === 'all' || row.category === projectMgmtCategoryFilter;
      const matchesStatus =
        projectMgmtStatusFilter === 'all' || row.projectStatus === projectMgmtStatusFilter;
      return matchesKw && matchesCat && matchesStatus;
    });
  }, [projectMgmtRows, textSearchApplied.projectMgmt, projectMgmtCategoryFilter, projectMgmtStatusFilter]);

  const iterationStaffOptions: IterationStaffOption[] = useMemo(
    () => productStaffRows.map((r) => ({ id: r.id, name: r.name, title: r.title })),
    [productStaffRows]
  );

  const iterationStaffNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of productStaffRows) m.set(r.id, r.name);
    return m;
  }, [productStaffRows]);

  const commitGanttBarRange = useCallback((recordId: string, ref: GanttBarRef, startYmd: string, endYmd: string) => {
    setIterationRecordRows((prev) =>
      prev.map((row) => {
        if (row.id !== recordId) return row;
        if (ref.type === 'parent') {
          return { ...row, parentDateStart: startYmd, parentDateEnd: endYmd };
        }
        return {
          ...row,
          subRequirements: row.subRequirements.map((s) =>
            s.id === ref.subId ? { ...s, dateStart: startYmd, dateEnd: endYmd } : s
          ),
        };
      })
    );
  }, []);

  const handleSidebarResizeStart = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setSidebarIsResizing(true);
    const startX = e.clientX;
    const startW = sidebarWidth;
    const onMove = (ev: PointerEvent) => {
      const newW = Math.max(56, Math.min(480, startW + (ev.clientX - startX)));
      setSidebarWidth(newW);
      if (newW > 56) setSidebarPrevWidth(newW);
    };
    const onUp = () => {
      setSidebarIsResizing(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [sidebarWidth]);

  const toggleSidebarCollapse = useCallback(() => {
    if (isIconOnly) {
      setSidebarWidth(sidebarPrevWidth > 56 ? sidebarPrevWidth : 256);
    } else {
      setSidebarPrevWidth(sidebarWidth);
      setSidebarWidth(56);
    }
  }, [isIconOnly, sidebarWidth, sidebarPrevWidth]);

  const filteredIterationRecordRows = useMemo(() => {
    const { title, content } = textSearchApplied.iterationRecord;
    const qt = title.trim().toLowerCase();
    const qc = content.trim().toLowerCase();
    return iterationRecordRows.filter((row) => {
      if (row.scope !== iterationRecordScope) return false;
      if (iterationRecordStatusFilter !== 'all' && row.status !== iterationRecordStatusFilter) return false;
      const matchesTitle =
        !qt ||
        row.parentRequirement.toLowerCase().includes(qt) ||
        row.subRequirements.some((s) => s.title.toLowerCase().includes(qt));
      const matchesContent =
        !qc ||
        iterationContentPlainText(row.detailRulesHtml).includes(qc) ||
        iterationContentPlainText(row.notesHtml).includes(qc);
      return matchesTitle && matchesContent;
    });
  }, [iterationRecordRows, iterationRecordScope, iterationRecordStatusFilter, textSearchApplied.iterationRecord]);

  const filteredProductStaffRows = useMemo(() => {
    const q = textSearchApplied.productStaff.name.trim().toLowerCase();
    return productStaffRows.filter((row) => !q || row.name.toLowerCase().includes(q));
  }, [productStaffRows, textSearchApplied.productStaff.name]);

  const filteredSectGuildRows = useMemo(() => {
    const q = textSearchApplied.sectGuild.keyword.trim().toLowerCase();
    return sectGuildRows.filter((row) => {
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.leaderName.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q)
      );
    });
  }, [sectGuildRows, textSearchApplied.sectGuild.keyword]);

  const filteredRewardMgmtRows = useMemo(() => {
    const f = rewardMgmtSearchApplied;
    const qn = f.projectName.trim().toLowerCase();
    const qu = f.userId.trim().toLowerCase();
    const qk = (f.keyword ?? '').trim().toLowerCase();
    const start = f.importDateStart ? new Date(`${f.importDateStart}T00:00:00`).getTime() : null;
    const end = f.importDateEnd ? new Date(`${f.importDateEnd}T23:59:59.999`).getTime() : null;
    return rewardMgmtRows.filter((row) => {
      if (f.businessType !== 'all' && row.businessType !== f.businessType) return false;
      if (f.auditStatus !== 'all' && row.auditStatus !== f.auditStatus) return false;
      if (f.paymentStatus !== 'all' && row.paymentStatus !== f.paymentStatus) return false;
      if (qn && !row.projectName.toLowerCase().includes(qn)) return false;
      if (qu && !row.userId.toLowerCase().includes(qu)) return false;
      if (qk && !row.keyword.toLowerCase().includes(qk)) return false;
      const ti = new Date(row.importedAt).getTime();
      if (start !== null && ti < start) return false;
      if (end !== null && ti > end) return false;
      return true;
    });
  }, [rewardMgmtRows, rewardMgmtSearchApplied]);

  const filteredYouboomTeamRows = useMemo(() => {
    const qId = youboomTeamSearchApplied.leaderId.trim();
    let rows = youboomTeamRows.filter((row) => {
      if (qId && row.leaderId !== qId) return false;
      return true;
    });
    if (youboomTeamSortField && youboomTeamSortOrder) {
      const field = youboomTeamSortField;
      const order = youboomTeamSortOrder;
      rows = [...rows].sort((a, b) => {
        const va = a[field] as number;
        const vb = b[field] as number;
        return order === 'asc' ? va - vb : vb - va;
      });
    }
    return rows;
  }, [youboomTeamRows, youboomTeamSearchApplied, youboomTeamSortField, youboomTeamSortOrder]);

  const handleYouboomTeamSort = (field: YouboomTeamSortField) => {
    if (youboomTeamSortField !== field) {
      // 切换到新字段：首次默认高到低
      setYouboomTeamSortField(field);
      setYouboomTeamSortOrder('desc');
    } else if (youboomTeamSortOrder === 'desc') {
      // 高到低 → 低到高
      setYouboomTeamSortOrder('asc');
    } else if (youboomTeamSortOrder === 'asc') {
      // 低到高 → 取消排序
      setYouboomTeamSortField(null);
      setYouboomTeamSortOrder(null);
    } else {
      // 无排序 → 高到低
      setYouboomTeamSortField(field);
      setYouboomTeamSortOrder('desc');
    }
  };

  const applyTextSearch = () => {
    setTextSearchApplied(structuredClone(textSearchDraft));
    if (activeModule === 'ruleDescription') {
      setRuleDescSearchApplied(ruleDescSearchDraft.trim());
    }
    if (activeModule === 'rewardManagement') {
      setRewardMgmtSearchApplied(structuredClone(rewardMgmtSearchDraft));
      setRewardMgmtSelectedIds([]);
    }
    if (activeModule === 'youboomTeam') {
      setYouboomTeamSearchApplied(structuredClone(youboomTeamSearchDraft));
    }
    setCurrentPage(1);
  };

  const resetFilters = () => {
    const empty = createEmptyTextSearch();
    setTextSearchDraft(empty);
    setTextSearchApplied(empty);
    setRuleDescSearchDraft('');
    setRuleDescSearchApplied('');
    setTypeFilter('all');
    setDimensionFilter('all');
    setHotFilter('all');
    setNewFilter('all');
    setDateFilter('');
    setAcademyCatKingkongFilter('all');
    setAcademyCatStatusFilter('all');
    setAcademyContentCategoryFilter('all');
    setAcademyContentTypeFilter('all');
    setAcademyContentTagFilter('all');
    setAcademyContentStatusFilter('all');
    setSelectedAcademyContentIds([]);
    setProjectMgmtCategoryFilter('all');
    setProjectMgmtStatusFilter('all');
    setRewardMgmtSearchDraft(emptyRewardMgmtSearch());
    setRewardMgmtSearchApplied(emptyRewardMgmtSearch());
    setRewardMgmtSelectedIds([]);
    setYouboomTeamSearchDraft(emptyYouboomTeamSearch());
    setYouboomTeamSearchApplied(emptyYouboomTeamSearch());
    setCurrentPage(1);
  };

  const selectSystemProductLine = (line: ProductLine) => {
    setSystemProductLine(line);
    setCurrentPage(1);
    setTextSearchDraft((d) => ({
      ...d,
      config: { menuName: '', routeKey: '', fieldCnName: '', fieldEnName: '' },
    }));
    setTextSearchApplied((d) => ({
      ...d,
      config: { menuName: '', routeKey: '', fieldCnName: '', fieldEnName: '' },
    }));
    setRuleDescSearchDraft('');
    setRuleDescSearchApplied('');
  };

  const selectModule = (m: ModuleType) => {
    setActiveModule(m);
    resetFilters();
  };

  const openIterationRecord = (scope: IterationNavScope) => {
    setIterationRecordScope(scope);
    setActiveModule('iterationRecord');
    resetFilters();
  };

  const getFieldRule = (routeKey: string, fieldEnName: string) => {
    const config = fieldConfigs.find(c => c.routeKey === routeKey && c.fieldEnName === fieldEnName);
    return config?.description || '暂无说明';
  };

  const onAcademyBatchVideosPicked = (picked: FileList | null) => {
    academyBatchFilePickerShieldUntilRef.current = 0;
    if (!picked?.length) return;
    if (picked.length > 20) {
      alert('单次最多选择 20 个视频');
    }
    const list = Array.from(picked).slice(0, 20) as File[];
    const mockOutcomes: AcademyBatchVideoRow['mockOutcome'][] = ['success', 'failed', 'uploading'];
    const newRows: AcademyBatchVideoRow[] = list.flatMap((file) =>
      mockOutcomes.map((mockOutcome) => ({
        localId: `bv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        mockOutcome,
        status: 'queued' as const,
        progress: 0,
      }))
    );
    setAcademyBatchForm((prev) => ({
      ...prev,
      videoRows: [...prev.videoRows, ...newRows],
    }));
    queueMicrotask(() => {
      for (const row of newRows) {
        runBatchVideoRowUpload(row.localId, row.file, row.mockOutcome);
      }
    });
    if (!academyBatchDrawerOpenRef.current) {
      setAcademyBatchDrawerOpen(true);
    }
  };

  return (
    <div className={`flex min-h-screen bg-bg${isDark ? ' dark' : ''}`}>
      {/* 挂在抽屉外：避免文件框关闭时遮罩卸载抽屉导致 input 被移除、onChange 不触发 */}
      <input
        ref={academyBatchVideoInputRef}
        type="file"
        accept="video/*"
        multiple
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const picked = e.target.files;
          (e.target as HTMLInputElement).value = '';
          onAcademyBatchVideosPicked(picked);
        }}
      />
      {/* Sidebar */}
      <aside
        className="border-r border-line flex flex-col sticky top-0 h-screen z-30 shrink-0 relative overflow-x-hidden"
        style={{
          width: sidebarWidth,
          transition: sidebarIsResizing ? 'none' : 'width 0.2s cubic-bezier(0.4,0,0.2,1)',
          background: 'var(--color-sidebar)',
        }}
      >
        <div className={`border-b border-line flex items-center ${isIconOnly ? 'justify-center py-3 px-1 flex-col gap-2' : 'gap-1 px-2 py-3'}`}>
          {isIconOnly ? (
            <>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <Layers className="w-5 h-5 text-white" />
              </div>
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-white/40 dark:hover:bg-white/8 dark:hover:text-white/70 transition-colors cursor-pointer"
                title="展开侧边栏"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <Layers className="w-5 h-5 text-white" />
              </div>
              <span className="flex-1 min-w-0 font-bold text-base tracking-tight text-gray-900 dark:text-white/90 truncate overflow-hidden whitespace-nowrap pl-1">不鸣文化后台迭代</span>
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-white/40 dark:hover:bg-white/8 dark:hover:text-white/70 transition-colors cursor-pointer"
                title="收起侧边栏"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        
        <nav className={`sidebar-nav${isIconOnly ? ' sidebar-nav--icon-only' : ''} flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2 text-sm`}>
          <button
            type="button"
            onClick={() => selectModule('ganttMap')}
            className={`
              flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-all cursor-pointer
              ${
                activeModule === 'ganttMap'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-white/75 dark:hover:bg-white/8'
              }
            `}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Calendar className={`shrink-0 h-4 w-4 ${activeModule === 'ganttMap' ? 'text-white' : 'text-accent'}`} />
              <span className="nav-label truncate">甘特地图</span>
            </span>
            {activeModule === 'ganttMap' ? <ChevronRight className="h-4 w-4 text-white/90" /> : null}
          </button>

          <div>
            <button
              type="button"
              onClick={() => setNavSections((s) => ({ ...s, youbao: !s.youbao }))}
              className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hover:bg-gray-50 cursor-pointer dark:text-white/40 dark:hover:bg-white/6"
            >
              <span className="flex min-w-0 items-center gap-2 normal-case text-gray-800 dark:text-white/80">
                <Layers className="shrink-0 h-4 w-4 text-accent" />
                <span className="nav-label truncate">右豹迭代</span>
              </span>
              <ChevronDown
                className={`nav-chevron h-4 w-4 shrink-0 text-gray-400 transition-transform dark:text-white/35 ${navSections.youbao ? '' : '-rotate-90'}`}
              />
            </button>
            {navSections.youbao && (
              <div className="nav-group-content mt-1 space-y-0.5 border-l border-line ml-3 pl-2">
                <button
                  type="button"
                  onClick={() => openIterationRecord('youbao')}
                  className={`
                        flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer
                        ${
                          activeModule === 'iterationRecord' && iterationRecordScope === 'youbao'
                            ? 'bg-accent/5 text-accent'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-white/55 dark:hover:bg-white/8 dark:hover:text-white/90'
                        }
                      `}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <GitBranch
                      className={`shrink-0 h-4 w-4 ${
                        activeModule === 'iterationRecord' && iterationRecordScope === 'youbao'
                          ? 'text-accent'
                          : 'text-gray-400'
                      }`}
                    />
                    <span className="nav-label truncate">迭代记录</span>
                  </span>
                  {activeModule === 'iterationRecord' && iterationRecordScope === 'youbao' ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : null}
                </button>
                {youbaoChildren.map((mod) => {
                  const Icon = mod.icon;
                  const isActive = activeModule === mod.id;
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => selectModule(mod.id)}
                      className={`
                        flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer
                        ${isActive ? 'bg-accent/5 text-accent' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-white/55 dark:hover:bg-white/8 dark:hover:text-white/90'}
                      `}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Icon className={`shrink-0 h-4 w-4 ${isActive ? 'text-accent' : 'text-gray-400 dark:text-white/35'}`} />
                        <span className="nav-label truncate">{mod.name}</span>
                      </span>
                      {isActive && <ChevronRight className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setNavSections((s) => ({ ...s, youboom: !s.youboom }))}
              className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hover:bg-gray-50 cursor-pointer dark:text-white/40 dark:hover:bg-white/6"
            >
              <span className="flex min-w-0 items-center gap-2 normal-case text-gray-800 dark:text-white/80">
                <Sparkles className="shrink-0 h-4 w-4 text-accent" />
                <span className="nav-label truncate">youboom迭代</span>
              </span>
              <ChevronDown
                className={`nav-chevron h-4 w-4 shrink-0 text-gray-400 transition-transform dark:text-white/35 ${navSections.youboom ? '' : '-rotate-90'}`}
              />
            </button>
            {navSections.youboom && (
              <div className="nav-group-content mt-1 space-y-0.5 border-l border-line ml-3 pl-2">
                <button
                  type="button"
                  onClick={() => openIterationRecord('youboom')}
                  className={`
                    flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer
                    ${
                      activeModule === 'iterationRecord' && iterationRecordScope === 'youboom'
                        ? 'bg-accent/5 text-accent'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-white/55 dark:hover:bg-white/8 dark:hover:text-white/90'
                    }
                  `}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <GitBranch
                      className={`shrink-0 h-4 w-4 ${
                        activeModule === 'iterationRecord' && iterationRecordScope === 'youboom'
                          ? 'text-accent'
                          : 'text-gray-400'
                      }`}
                    />
                    <span className="nav-label truncate">迭代记录</span>
                  </span>
                  {activeModule === 'iterationRecord' && iterationRecordScope === 'youboom' ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNavSections((s) => ({ ...s, youboom: true }));
                    selectModule('rewardManagement');
                  }}
                  className={`
                    flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer
                    ${
                      activeModule === 'rewardManagement'
                        ? 'bg-accent/5 text-accent'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-white/55 dark:hover:bg-white/8 dark:hover:text-white/90'
                    }
                  `}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Gift
                      className={`shrink-0 h-4 w-4 ${activeModule === 'rewardManagement' ? 'text-accent' : 'text-gray-400'}`}
                    />
                    <span className="nav-label truncate">奖励管理</span>
                  </span>
                  {activeModule === 'rewardManagement' ? <ChevronRight className="h-4 w-4" /> : null}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNavSections((s) => ({ ...s, youboom: true }));
                    selectModule('youboomTeam');
                  }}
                  className={`
                    flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer
                    ${
                      activeModule === 'youboomTeam'
                        ? 'bg-accent/5 text-accent'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-white/55 dark:hover:bg-white/8 dark:hover:text-white/90'
                    }
                  `}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Users
                      className={`shrink-0 h-4 w-4 ${activeModule === 'youboomTeam' ? 'text-accent' : 'text-gray-400'}`}
                    />
                    <span className="nav-label truncate">团队数据</span>
                  </span>
                  {activeModule === 'youboomTeam' ? <ChevronRight className="h-4 w-4" /> : null}
                </button>
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setNavSections((s) => ({ ...s, mentor: !s.mentor }))}
              className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hover:bg-gray-50 cursor-pointer dark:text-white/40 dark:hover:bg-white/6"
            >
              <span className="flex min-w-0 items-center gap-2 normal-case text-gray-800 dark:text-white/80">
                <UsersRound className="shrink-0 h-4 w-4 text-accent" />
                <span className="nav-label truncate">导师迭代</span>
              </span>
              <ChevronDown
                className={`nav-chevron h-4 w-4 shrink-0 text-gray-400 transition-transform dark:text-white/35 ${navSections.mentor ? '' : '-rotate-90'}`}
              />
            </button>
            {navSections.mentor && (
              <div className="nav-group-content mt-1 space-y-0.5 border-l border-line ml-3 pl-2">
                <button
                  type="button"
                  onClick={() => openIterationRecord('mentor')}
                  className={`
                    flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer
                    ${
                      activeModule === 'iterationRecord' && iterationRecordScope === 'mentor'
                        ? 'bg-accent/5 text-accent'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-white/55 dark:hover:bg-white/8 dark:hover:text-white/90'
                    }
                  `}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <GitBranch
                      className={`shrink-0 h-4 w-4 ${
                        activeModule === 'iterationRecord' && iterationRecordScope === 'mentor'
                          ? 'text-accent'
                          : 'text-gray-400'
                      }`}
                    />
                    <span className="nav-label truncate">迭代记录</span>
                  </span>
                  {activeModule === 'iterationRecord' && iterationRecordScope === 'mentor' ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => setNavSections((s) => ({ ...s, mentorOrg: !s.mentorOrg }))}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 hover:bg-gray-50 cursor-pointer dark:text-white/40 dark:hover:bg-white/6"
                >
                  <span className="flex min-w-0 items-center gap-2 normal-case text-gray-700">
                    <Building2 className="shrink-0 h-3.5 w-3.5 text-accent" />
                    <span className="nav-label truncate">组织管理</span>
                  </span>
                  <ChevronDown
                    className={`nav-chevron h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform dark:text-white/35 ${navSections.mentorOrg ? '' : '-rotate-90'}`}
                  />
                </button>
                {navSections.mentorOrg && (
                  <div className="nav-group-content mt-0.5 space-y-0.5 border-l border-line ml-2 pl-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNavSections((s) => ({ ...s, mentor: true, mentorOrg: true }));
                        selectModule('sectManagement');
                      }}
                      className={`
                    flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer
                    ${activeModule === 'sectManagement' ? 'bg-accent/5 text-accent' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-white/55 dark:hover:bg-white/8 dark:hover:text-white/90'}
                  `}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Shield
                          className={`shrink-0 h-4 w-4 ${activeModule === 'sectManagement' ? 'text-accent' : 'text-gray-400'}`}
                        />
                        <span className="nav-label truncate">门派管理</span>
                      </span>
                      {activeModule === 'sectManagement' ? <ChevronRight className="h-4 w-4" /> : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNavSections((s) => ({ ...s, mentor: true, mentorOrg: true }));
                        selectModule('customerServiceManagement');
                      }}
                      className={`
                    flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer
                    ${
                      activeModule === 'customerServiceManagement'
                        ? 'bg-accent/5 text-accent'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-white/55 dark:hover:bg-white/8 dark:hover:text-white/90'
                    }
                  `}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Headphones
                          className={`shrink-0 h-4 w-4 ${
                            activeModule === 'customerServiceManagement' ? 'text-accent' : 'text-gray-400'
                          }`}
                        />
                        <span className="nav-label truncate">客服管理</span>
                      </span>
                      {activeModule === 'customerServiceManagement' ? <ChevronRight className="h-4 w-4" /> : null}
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setNavSections((s) => ({ ...s, mentorAudit: !s.mentorAudit }))}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 hover:bg-gray-50 cursor-pointer dark:text-white/40 dark:hover:bg-white/6"
                >
                  <span className="flex min-w-0 items-center gap-2 normal-case text-gray-700">
                    <ClipboardCheck className="shrink-0 h-3.5 w-3.5 text-accent" />
                    <span className="nav-label truncate">客服审核中心</span>
                  </span>
                  <ChevronDown
                    className={`nav-chevron h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform dark:text-white/35 ${navSections.mentorAudit ? '' : '-rotate-90'}`}
                  />
                </button>
                {navSections.mentorAudit && (
                  <div className="nav-group-content mt-0.5 space-y-0.5 border-l border-line ml-2 pl-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNavSections((s) => ({ ...s, mentor: true, mentorAudit: true }));
                        selectModule('auditEntryWorkbench');
                      }}
                      className={`
                    flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer
                    ${
                      activeModule === 'auditEntryWorkbench'
                        ? 'bg-accent/5 text-accent'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-white/55 dark:hover:bg-white/8 dark:hover:text-white/90'
                    }
                  `}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <FileSearch
                          className={`shrink-0 h-4 w-4 ${
                            activeModule === 'auditEntryWorkbench' ? 'text-accent' : 'text-gray-400'
                          }`}
                        />
                        <span className="nav-label truncate">录入审核</span>
                      </span>
                      {activeModule === 'auditEntryWorkbench' ? <ChevronRight className="h-4 w-4" /> : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNavSections((s) => ({ ...s, mentor: true, mentorAudit: true }));
                        selectModule('auditMessageNotification');
                      }}
                      className={`
                    flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer
                    ${
                      activeModule === 'auditMessageNotification'
                        ? 'bg-accent/5 text-accent'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-white/55 dark:hover:bg-white/8 dark:hover:text-white/90'
                    }
                  `}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Bell
                          className={`shrink-0 h-4 w-4 ${
                            activeModule === 'auditMessageNotification' ? 'text-accent' : 'text-gray-400'
                          }`}
                        />
                        <span className="nav-label truncate">消息通知</span>
                      </span>
                      {activeModule === 'auditMessageNotification' ? <ChevronRight className="h-4 w-4" /> : null}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setNavSections((s) => ({ ...s, system: !s.system }))}
              className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hover:bg-gray-50 cursor-pointer dark:text-white/40 dark:hover:bg-white/6"
            >
              <span className="flex min-w-0 items-center gap-2 normal-case text-gray-800 dark:text-white/80">
                <Settings className="shrink-0 h-4 w-4 text-accent" />
                <span className="nav-label truncate">系统配置</span>
              </span>
              <ChevronDown
                className={`nav-chevron h-4 w-4 shrink-0 text-gray-400 transition-transform dark:text-white/35 ${navSections.system ? '' : '-rotate-90'}`}
              />
            </button>
            {navSections.system && (
              <div className="nav-group-content mt-1 space-y-0.5 border-l border-line ml-3 pl-2">
                <button
                  type="button"
                  onClick={() => selectModule('productStaff')}
                  className={`
                    flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer
                    ${
                      activeModule === 'productStaff'
                        ? 'bg-accent/5 text-accent'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-white/55 dark:hover:bg-white/8 dark:hover:text-white/90'
                    }
                  `}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <UserCog
                      className={`shrink-0 h-4 w-4 ${activeModule === 'productStaff' ? 'text-accent' : 'text-gray-400'}`}
                    />
                    <span className="nav-label truncate">产研人员管理</span>
                  </span>
                  {activeModule === 'productStaff' ? <ChevronRight className="h-4 w-4" /> : null}
                </button>
                <button
                  type="button"
                  onClick={() => selectModule('config')}
                  className={`
                    flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer
                    ${activeModule === 'config' ? 'bg-accent/5 text-accent' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-white/55 dark:hover:bg-white/8 dark:hover:text-white/90'}
                  `}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Settings2
                      className={`shrink-0 h-4 w-4 ${activeModule === 'config' ? 'text-accent' : 'text-gray-400'}`}
                    />
                    <span className="nav-label truncate">字段配置</span>
                  </span>
                  {activeModule === 'config' ? <ChevronRight className="h-4 w-4" /> : null}
                </button>
                <button
                  type="button"
                  onClick={() => selectModule('ruleDescription')}
                  className={`
                    flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer
                    ${activeModule === 'ruleDescription' ? 'bg-accent/5 text-accent' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-white/55 dark:hover:bg-white/8 dark:hover:text-white/90'}
                  `}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <HelpCircle
                      className={`shrink-0 h-4 w-4 ${activeModule === 'ruleDescription' ? 'text-accent' : 'text-gray-400'}`}
                    />
                    <span className="nav-label truncate">规则说明</span>
                  </span>
                  {activeModule === 'ruleDescription' ? <ChevronRight className="h-4 w-4" /> : null}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => selectModule('requirementPrototype')}
            className={`
              flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-all cursor-pointer
              ${
                activeModule === 'requirementPrototype'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-white/75 dark:hover:bg-white/8'
              }
            `}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Wand2 className={`shrink-0 h-4 w-4 ${activeModule === 'requirementPrototype' ? 'text-white' : 'text-accent'}`} />
              <span className="nav-label truncate">需求原型设计</span>
            </span>
            {activeModule === 'requirementPrototype' ? <ChevronRight className="h-4 w-4 text-white/90" /> : null}
          </button>

        </nav>

        <div className={`border-t border-line ${isIconOnly ? 'flex flex-col items-center gap-2 py-3' : 'p-4'}`}>
          {isIconOnly ? (
            <>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                AD
              </div>
              <button
                type="button"
                onClick={() => setIsDark((v) => !v)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-white/40 dark:hover:bg-white/8 dark:hover:text-white/70 transition-colors cursor-pointer"
                title={isDark ? '切换到亮色模式' : '切换到暗色模式'}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  AD
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-medium text-gray-900 dark:text-white/85 truncate">Admin User</p>
                  <p className="text-[10px] text-gray-500 dark:text-white/45 truncate">renataluoy@gmail.com</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDark((v) => !v)}
                className="ml-2 shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-white/40 dark:hover:bg-white/8 dark:hover:text-white/70 transition-colors cursor-pointer"
                title={isDark ? '切换到亮色模式' : '切换到暗色模式'}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
        {/* 拖拽调宽手柄（始终可用，折叠时向右拖可展开） */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize group z-40"
          onPointerDown={handleSidebarResizeStart}
          title="拖动调整宽度"
        >
          <div className="absolute inset-y-0 right-0 w-1.5 bg-transparent group-hover:bg-accent/30 group-active:bg-accent/50 transition-colors" />
        </div>
      </aside>

      <MenuRuleDescriptionModal
        open={menuRuleModal.open}
        navTitle={menuRuleModal.navTitle}
        routeKeys={menuRuleModal.routeKeys}
        onClose={closeMenuRuleModal}
      />

      <DevSaveToRepo />

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto px-3 py-4 sm:px-4 md:px-5 md:py-5 lg:px-6">
        <div className="mx-auto w-full min-w-0 max-w-none">
          {/* Header */}
          {!hideMainPageHeader ? (
          <header className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-ink">
                  {activeModule === 'dashboard'
                    ? 'Dashboard'
                    : activeModule === 'ganttMap'
                    ? '甘特地图'
                    : activeModule === 'leaderboard' && leaderboardTab === 'community'
                    ? '品牌社群榜单'
                    : activeModule === 'recommendation'
                      ? recommendationTab === 'brand'
                        ? '品牌推荐'
                        : recommendationTab === 'drama'
                          ? '剧作推荐'
                          : '剧作分类'
                      : activeModule === 'academy'
                        ? academyTab === 'academy-category'
                          ? '分类管理'
                          : '内容配置'
                        : MODULE_PAGE_TITLE[activeModule] ?? '工作台'}
                </h1>
                {pageRuleHeaderAction.show ? (
                  <NavRuleHintButton
                    variant="title"
                    active
                    onClick={() =>
                      openMenuRuleModalFromKeys(pageRuleHeaderAction.navTitle, pageRuleHeaderAction.routeKeys)
                    }
                  />
                ) : null}
              </div>
              <p className="text-gray-500 dark:text-white/45 text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-accent" />
                {activeModule === 'dashboard'
                  ? '实时监控用户数据与业务指标；支持今日 / 本周 / 本月 / 自定义时间区间切换。'
                  : activeModule === 'ganttMap'
                  ? '按右豹迭代、youboom迭代、导师系统迭代汇总各板块迭代记录：父需求、子需求、时间线与开发人员、优先级；数据与各板块「迭代记录」一致。'
                  : activeModule === 'leaderboard'
                  ? '实时监控各项业务收益与社群表现'
                  : activeModule === 'recommendation'
                    ? '管理首页品牌与剧作推荐内容'
                    : activeModule === 'academy'
                      ? '配置商学院分类与图文/视频内容，支撑前台学院模块展示'
                      : activeModule === 'iterationRecord'
                        ? `记录 ${ITERATION_SCOPE_LABEL[iterationRecordScope]} 下的版本迭代；支持按父需求、子需求与详细规则检索`
                        : activeModule === 'productStaff'
                          ? '维护产研人员名单与职称，供迭代记录中「开发人员」多选使用（本机持久化）'
                        : activeModule === 'projectManagement'
                          ? '维护项目档案、分类、展示开关与会员策略等配置（当前为前端演示数据）'
                          : activeModule === 'sectManagement'
                            ? '维护导师门派档案、介绍内容与运营数据（当前为前端演示数据）'
                            : activeModule === 'youboomTeam'
                              ? '统计展示 youboom 各团队团长与成员的收益及奖励数据（当前为前端演示数据）'
                            : activeModule === 'rewardManagement'
                              ? '维护 youboom 奖励导入、审核、打款与微信通知等流程（当前为前端演示数据）'
                              : activeModule === 'config'
                                ? '配置各业务模块数据表的字段规则与说明'
                                : activeModule === 'ruleDescription'
                                  ? '维护各菜单规则说明：本机覆盖、仓库默认与代码内置目录的优先级与同步方式'
                                  : activeModule === 'customerServiceManagement'
                                    ? '维护客服档案与企微二维码，供用户主档归属选择（演示）'
                                    : activeModule === 'auditEntryWorkbench'
                                          ? '客服审核录入与工单流转工作台（当前为前端演示数据）'
                                          : activeModule === 'auditMessageNotification'
                                            ? '审核相关消息与通知记录（当前为前端演示数据）'
                                            : '请从左侧选择菜单'}
              </p>
            </div>
          </header>
          ) : null}

          {(activeModule === 'config' || activeModule === 'ruleDescription') && (
            <div className="mb-6 flex w-fit gap-1 rounded-xl bg-gray-200/50 dark:bg-white/6 p-1">
              {PRODUCT_LINE_NAV_ORDER.map((lineId) => {
                const Icon = systemProductLineTabIcons[lineId];
                const isActive = systemProductLine === lineId;
                return (
                  <button
                    key={lineId}
                    type="button"
                    onClick={() => selectSystemProductLine(lineId)}
                    className={`
                      relative flex cursor-pointer items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all
                      ${isActive ? 'text-accent' : 'text-gray-500 hover:text-gray-700 dark:text-white/45 dark:hover:text-white/75'}
                    `}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="systemProductLineTab"
                        className="absolute inset-0 rounded-lg bg-white dark:bg-accent/20 shadow-sm"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {PRODUCT_LINE_TAB_LABEL[lineId]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tabs */}
          {showDataTabs && (
            <div className="flex gap-1 bg-gray-200/50 p-1 rounded-xl mb-6 w-fit">
              {activeModule === 'leaderboard' ? (
                [
                  { id: 'individual', name: '个人榜单', icon: Trophy },
                  { id: 'team', name: '团队榜单', icon: Users },
                  { id: 'community', name: '品牌社群榜单', icon: LayoutDashboard },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = leaderboardTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setLeaderboardTab(tab.id as LeaderboardTab);
                        resetFilters();
                      }}
                      className={`
                        relative flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer
                        ${isActive ? 'text-accent' : 'text-gray-500 hover:text-gray-700'}
                      `}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-white rounded-lg shadow-sm"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {tab.name}
                      </span>
                    </button>
                  );
                })
              ) : activeModule === 'recommendation' ? (
                [
                  { id: 'brand', name: '品牌推荐', icon: Sparkles },
                  { id: 'drama', name: '剧作推荐', icon: Flame },
                  { id: 'category', name: '剧作分类', icon: Tag },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = recommendationTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setRecommendationTab(tab.id as RecommendationTab);
                        resetFilters();
                      }}
                      className={`
                        relative flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer
                        ${isActive ? 'text-accent' : 'text-gray-500 hover:text-gray-700'}
                      `}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-white rounded-lg shadow-sm"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {tab.name}
                      </span>
                    </button>
                  );
                })
              ) : (
                [
                  { id: 'academy-category', name: '分类管理', icon: LayoutGrid },
                  { id: 'academy-content', name: '内容配置', icon: FileText },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = academyTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setAcademyTab(tab.id as AcademyTab);
                        setSelectedAcademyContentIds([]);
                        resetFilters();
                      }}
                      className={`
                        relative flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer
                        ${isActive ? 'text-accent' : 'text-gray-500 hover:text-gray-700'}
                      `}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-white rounded-lg shadow-sm"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {tab.name}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Content Area */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeModule}-${ganttProductLine}-${iterationRecordScope}-${iterationRecordStatusFilter}-${leaderboardTab}-${recommendationTab}-${academyTab}-${systemProductLine}-${projectMgmtCategoryFilter}-${projectMgmtStatusFilter}-${textSearchApplied.projectMgmt.keyword}-${textSearchApplied.iterationRecord.title}-${textSearchApplied.iterationRecord.content}-${textSearchApplied.productStaff.name}-${textSearchApplied.sectGuild.keyword}-${rewardMgmtSearchApplied.businessType}-${rewardMgmtSearchApplied.projectName}-${rewardMgmtSearchApplied.userId}-${rewardMgmtSearchApplied.auditStatus}-${rewardMgmtSearchApplied.paymentStatus}-${rewardMgmtSearchApplied.importDateStart}-${rewardMgmtSearchApplied.importDateEnd}-${youboomTeamSearchApplied.leaderId}-${youboomTeamSortField}-${youboomTeamSortOrder}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`${contentShellClass} min-w-0 max-w-full`}
            >
              {showTableToolbar && (
                <div className="border-b border-line">
                  <div className="flex flex-wrap items-end gap-3 px-4 py-3 lg:px-5">
                  {activeModule === 'config' && (
                    <>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        菜单名称
                        <input
                          type="text"
                          value={textSearchDraft.config.menuName}
                          onChange={(e) =>
                            setTextSearchDraft((d) => ({ ...d, config: { ...d.config, menuName: e.target.value } }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="如：榜单数据"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        路由键
                        <input
                          type="text"
                          value={textSearchDraft.config.routeKey}
                          onChange={(e) =>
                            setTextSearchDraft((d) => ({ ...d, config: { ...d.config, routeKey: e.target.value } }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="leaderboard"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        字段中文名
                        <input
                          type="text"
                          value={textSearchDraft.config.fieldCnName}
                          onChange={(e) =>
                            setTextSearchDraft((d) => ({
                              ...d,
                              config: { ...d.config, fieldCnName: e.target.value },
                            }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="中文列名"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        字段英文名
                        <input
                          type="text"
                          value={textSearchDraft.config.fieldEnName}
                          onChange={(e) =>
                            setTextSearchDraft((d) => ({
                              ...d,
                              config: { ...d.config, fieldEnName: e.target.value },
                            }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="field_key"
                        />
                      </label>
                    </>
                  )}

                  {activeModule === 'ruleDescription' && (
                    <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                      菜单标题 / 路由键
                      <input
                        type="text"
                        value={ruleDescSearchDraft}
                        onChange={(e) => setRuleDescSearchDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                        className={textFieldInputClass}
                        placeholder="按菜单标题或路由键筛选"
                      />
                    </label>
                  )}

                  {activeModule === 'leaderboard' && leaderboardTab !== 'community' && (
                    <>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        {leaderboardTab === 'team' ? '团队ID' : '用户ID'}
                        <input
                          type="text"
                          value={textSearchDraft.lbRank.userId}
                          onChange={(e) =>
                            setTextSearchDraft((d) => ({ ...d, lbRank: { ...d.lbRank, userId: e.target.value } }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder={leaderboardTab === 'team' ? '团队ID' : '用户ID'}
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        {leaderboardTab === 'team' ? '团队名称' : '用户昵称'}
                        <input
                          type="text"
                          value={textSearchDraft.lbRank.nickname}
                          onChange={(e) =>
                            setTextSearchDraft((d) => ({ ...d, lbRank: { ...d.lbRank, nickname: e.target.value } }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder={leaderboardTab === 'team' ? '团队名称' : '用户昵称'}
                        />
                      </label>
                    </>
                  )}

                  {activeModule === 'leaderboard' && leaderboardTab === 'community' && (
                    <>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        社群ID
                        <input
                          type="text"
                          value={textSearchDraft.community.id}
                          onChange={(e) =>
                            setTextSearchDraft((d) => ({ ...d, community: { ...d.community, id: e.target.value } }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="社群ID"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        社群名称
                        <input
                          type="text"
                          value={textSearchDraft.community.name}
                          onChange={(e) =>
                            setTextSearchDraft((d) => ({ ...d, community: { ...d.community, name: e.target.value } }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="社群名称"
                        />
                      </label>
                    </>
                  )}

                  {activeModule === 'recommendation' && recommendationTab === 'brand' && (
                    <>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        项目名称
                        <input
                          type="text"
                          value={textSearchDraft.brand.projectName}
                          onChange={(e) =>
                            setTextSearchDraft((d) => ({ ...d, brand: { ...d.brand, projectName: e.target.value } }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="项目名称"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        项目ID
                        <input
                          type="text"
                          value={textSearchDraft.brand.projectId}
                          onChange={(e) =>
                            setTextSearchDraft((d) => ({ ...d, brand: { ...d.brand, projectId: e.target.value } }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="项目ID"
                        />
                      </label>
                    </>
                  )}

                  {activeModule === 'recommendation' && recommendationTab === 'drama' && (
                    <>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        任务名称
                        <input
                          type="text"
                          value={textSearchDraft.drama.taskName}
                          onChange={(e) =>
                            setTextSearchDraft((d) => ({ ...d, drama: { ...d.drama, taskName: e.target.value } }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="任务名称"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        任务ID
                        <input
                          type="text"
                          value={textSearchDraft.drama.taskId}
                          onChange={(e) =>
                            setTextSearchDraft((d) => ({ ...d, drama: { ...d.drama, taskId: e.target.value } }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="任务ID"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        关联项目名称
                        <input
                          type="text"
                          value={textSearchDraft.drama.projectName}
                          onChange={(e) =>
                            setTextSearchDraft((d) => ({
                              ...d,
                              drama: { ...d.drama, projectName: e.target.value },
                            }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="关联项目名称"
                        />
                      </label>
                    </>
                  )}

                  {activeModule === 'recommendation' && recommendationTab === 'category' && (
                    <>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        分类名称
                        <input
                          type="text"
                          value={textSearchDraft.category.name}
                          onChange={(e) =>
                            setTextSearchDraft((d) => ({ ...d, category: { ...d.category, name: e.target.value } }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="分类名称"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        关联业务
                        <input
                          type="text"
                          value={textSearchDraft.category.relatedBusiness}
                          onChange={(e) =>
                            setTextSearchDraft((d) => ({
                              ...d,
                              category: { ...d.category, relatedBusiness: e.target.value },
                            }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="关联业务关键词"
                        />
                      </label>
                    </>
                  )}

                  {activeModule === 'academy' && academyTab === 'academy-category' && (
                    <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                      分类名称
                      <input
                        type="text"
                        value={textSearchDraft.academyCat.name}
                        onChange={(e) =>
                          setTextSearchDraft((d) => ({
                            ...d,
                            academyCat: { ...d.academyCat, name: e.target.value },
                          }))
                        }
                        onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                        className={textFieldInputClass}
                        placeholder="分类名称"
                      />
                    </label>
                  )}

                  {activeModule === 'academy' && academyTab === 'academy-content' && (
                    <>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        标题
                        <input
                          type="text"
                          value={textSearchDraft.academyContent.title}
                          onChange={(e) =>
                            setTextSearchDraft((d) => ({
                              ...d,
                              academyContent: { ...d.academyContent, title: e.target.value },
                            }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="标题"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        右豹ID
                        <input
                          type="text"
                          value={textSearchDraft.academyContent.youbaoId}
                          onChange={(e) =>
                            setTextSearchDraft((d) => ({
                              ...d,
                              academyContent: { ...d.academyContent, youbaoId: e.target.value },
                            }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="右豹ID"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        项目名称
                        <input
                          type="text"
                          value={textSearchDraft.academyContent.projectName}
                          onChange={(e) =>
                            setTextSearchDraft((d) => ({
                              ...d,
                              academyContent: { ...d.academyContent, projectName: e.target.value },
                            }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="关联项目名称"
                        />
                      </label>
                    </>
                  )}

                  {activeModule === 'academy' && academyTab === 'academy-category' && (
                    <>
                      <select
                        value={academyCatKingkongFilter}
                        onChange={(e) => setAcademyCatKingkongFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-sm"
                      >
                        <option value="all">金刚区</option>
                        <option value="yes">是</option>
                        <option value="no">否</option>
                        <option value="unset">未设置</option>
                      </select>
                      <select
                        value={academyCatStatusFilter}
                        onChange={(e) => setAcademyCatStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-sm"
                      >
                        <option value="all">分类状态</option>
                        <option value="show">显示</option>
                        <option value="hide">隐藏</option>
                      </select>
                    </>
                  )}

                  {activeModule === 'academy' && academyTab === 'academy-content' && (
                    <>
                      <select
                        value={academyContentCategoryFilter}
                        onChange={(e) => setAcademyContentCategoryFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-sm min-w-[120px]"
                      >
                        <option value="all">全部分类</option>
                        {academyCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={academyContentTypeFilter}
                        onChange={(e) => setAcademyContentTypeFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-sm"
                      >
                        <option value="all">内容类型</option>
                        <option value="article">图文</option>
                        <option value="video">视频</option>
                      </select>
                      <select
                        value={academyContentTagFilter}
                        onChange={(e) => setAcademyContentTagFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-sm"
                      >
                        <option value="all">标签</option>
                        <option value="hot">热门</option>
                        <option value="recommend">推荐</option>
                      </select>
                      <select
                        value={academyContentStatusFilter}
                        onChange={(e) => setAcademyContentStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-sm"
                      >
                        <option value="all">内容状态</option>
                        <option value="show">显示</option>
                        <option value="hide">隐藏</option>
                      </select>
                    </>
                  )}

                  {activeModule === 'leaderboard' && leaderboardTab !== 'community' && (
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-3 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-sm"
                    >
                      <option value="all">所有类型</option>
                      <option value="individual">个人收益</option>
                      <option value="project">单项目收益</option>
                    </select>
                  )}

                  {activeModule === 'recommendation' && recommendationTab === 'brand' && (
                    <>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-sm"
                      >
                        <option value="all">所有类型</option>
                        <option value="tweet">推文</option>
                        <option value="drama">短剧</option>
                        <option value="resource">资源</option>
                        <option value="game">游戏</option>
                      </select>
                      <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-sm"
                      />
                    </>
                  )}

                  {activeModule === 'leaderboard' && (
                    <select
                      value={dimensionFilter}
                      onChange={(e) => setDimensionFilter(e.target.value)}
                      className="px-3 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-sm"
                    >
                      <option value="all">所有维度</option>
                      <option value="7d">近7日</option>
                      <option value="30d">近30日</option>
                    </select>
                  )}

                  {activeModule === 'recommendation' && recommendationTab !== 'category' && (
                    <>
                      <select
                        value={hotFilter}
                        onChange={(e) => setHotFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-sm"
                      >
                        <option value="all">热门状态</option>
                        <option value="yes">热门</option>
                        <option value="no">非热门</option>
                      </select>
                      <select
                        value={newFilter}
                        onChange={(e) => setNewFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-sm"
                      >
                        <option value="all">上新状态</option>
                        <option value="yes">上新</option>
                        <option value="no">非上新</option>
                      </select>
                    </>
                  )}

                  {activeModule === 'iterationRecord' && (
                    <>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        父需求 / 子需求
                        <input
                          type="text"
                          value={textSearchDraft.iterationRecord.title}
                          onChange={(e) =>
                            setTextSearchDraft((d) => ({
                              ...d,
                              iterationRecord: { ...d.iterationRecord, title: e.target.value },
                            }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="按父需求或子需求描述筛选"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        详细规则
                        <input
                          type="text"
                          value={textSearchDraft.iterationRecord.content}
                          onChange={(e) =>
                            setTextSearchDraft((d) => ({
                              ...d,
                              iterationRecord: { ...d.iterationRecord, content: e.target.value },
                            }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="按详细规则 / 其他说明纯文本筛选"
                        />
                      </label>
                      <select
                        value={iterationRecordStatusFilter}
                        onChange={(e) => {
                          setIterationRecordStatusFilter(e.target.value as typeof iterationRecordStatusFilter);
                          setCurrentPage(1);
                        }}
                        className="cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                      >
                        <option value="all">全部状态</option>
                        {(Object.keys(ITERATION_STATUS_LABEL) as (keyof typeof ITERATION_STATUS_LABEL)[]).map((k) => (
                          <option key={k} value={k}>{ITERATION_STATUS_LABEL[k]}</option>
                        ))}
                      </select>
                    </>
                  )}

                  {activeModule === 'productStaff' && (
                    <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                      名字
                      <input
                        type="text"
                        value={textSearchDraft.productStaff.name}
                        onChange={(e) =>
                          setTextSearchDraft((d) => ({
                            ...d,
                            productStaff: { ...d.productStaff, name: e.target.value },
                          }))
                        }
                        onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                        className={textFieldInputClass}
                        placeholder="按名字筛选"
                      />
                    </label>
                  )}

                  {activeModule === 'projectManagement' && (
                    <>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        关键词
                        <input
                          type="text"
                          value={textSearchDraft.projectMgmt.keyword}
                          onChange={(e) =>
                            setTextSearchDraft((d) => ({
                              ...d,
                              projectMgmt: { ...d.projectMgmt, keyword: e.target.value },
                            }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="项目ID / 标题"
                        />
                      </label>
                      <select
                        value={projectMgmtCategoryFilter}
                        onChange={(e) => {
                          setProjectMgmtCategoryFilter(e.target.value as typeof projectMgmtCategoryFilter);
                          setCurrentPage(1);
                        }}
                        className="cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                      >
                        <option value="all">全部分类</option>
                        {(Object.keys(PROJECT_CATEGORY_LABEL) as (keyof typeof PROJECT_CATEGORY_LABEL)[]).map(
                          (k) => (
                            <option key={k} value={k}>
                              {PROJECT_CATEGORY_LABEL[k]}
                            </option>
                          )
                        )}
                      </select>
                      <select
                        value={projectMgmtStatusFilter}
                        onChange={(e) => {
                          setProjectMgmtStatusFilter(e.target.value as typeof projectMgmtStatusFilter);
                          setCurrentPage(1);
                        }}
                        className="cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                      >
                        <option value="all">项目状态</option>
                        <option value="show">显示</option>
                        <option value="hide">隐藏</option>
                      </select>
                    </>
                  )}

                  {activeModule === 'sectManagement' && (
                    <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                      关键词
                      <input
                        type="text"
                        value={textSearchDraft.sectGuild.keyword}
                        onChange={(e) =>
                          setTextSearchDraft((d) => ({
                            ...d,
                            sectGuild: { ...d.sectGuild, keyword: e.target.value },
                          }))
                        }
                        onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                        className={textFieldInputClass}
                        placeholder="门派名称 / 负责人"
                      />
                    </label>
                  )}

                  {activeModule === 'youboomTeam' && (
                    <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                      团长ID
                      <input
                        type="text"
                        value={youboomTeamSearchDraft.leaderId}
                        onChange={(e) =>
                          setYouboomTeamSearchDraft((d) => ({ ...d, leaderId: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                        className={textFieldInputClass}
                        placeholder="精确匹配团长ID"
                      />
                    </label>
                  )}

                  {activeModule === 'rewardManagement' && (
                    <>
                      {/* 文本框优先 */}
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        项目名称
                        <input
                          type="text"
                          value={rewardMgmtSearchDraft.projectName}
                          onChange={(e) =>
                            setRewardMgmtSearchDraft((d) => ({ ...d, projectName: e.target.value }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="模糊匹配项目名称"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        用户ID
                        <input
                          type="text"
                          value={rewardMgmtSearchDraft.userId}
                          onChange={(e) => setRewardMgmtSearchDraft((d) => ({ ...d, userId: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="用户ID"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        关键词/口令
                        <input
                          type="text"
                          value={rewardMgmtSearchDraft.keyword ?? ''}
                          onChange={(e) => setRewardMgmtSearchDraft((d) => ({ ...d, keyword: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                          className={textFieldInputClass}
                          placeholder="关键词或口令"
                        />
                      </label>
                      {/* 下拉选择 */}
                      <select
                        value={rewardMgmtSearchDraft.businessType}
                        onChange={(e) =>
                          setRewardMgmtSearchDraft((d) => ({
                            ...d,
                            businessType: e.target.value as typeof d.businessType,
                          }))
                        }
                        className="cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                      >
                        <option value="all">业务类型</option>
                        <option value="brand">{REWARD_BUSINESS_LABEL.brand}</option>
                        <option value="overseas">{REWARD_BUSINESS_LABEL.overseas}</option>
                      </select>
                      <select
                        value={rewardMgmtSearchDraft.auditStatus}
                        onChange={(e) =>
                          setRewardMgmtSearchDraft((d) => ({
                            ...d,
                            auditStatus: e.target.value as typeof d.auditStatus,
                          }))
                        }
                        className="cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                      >
                        <option value="all">审核状态</option>
                        <option value="pending_review">{REWARD_AUDIT_LABEL.pending_review}</option>
                        <option value="reviewed">{REWARD_AUDIT_LABEL.reviewed}</option>
                        <option value="rejected">{REWARD_AUDIT_LABEL.rejected}</option>
                      </select>
                      <select
                        value={rewardMgmtSearchDraft.paymentStatus}
                        onChange={(e) =>
                          setRewardMgmtSearchDraft((d) => ({
                            ...d,
                            paymentStatus: e.target.value as typeof d.paymentStatus,
                          }))
                        }
                        className="cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                      >
                        <option value="all">打款状态</option>
                        <option value="pending_payment">{REWARD_PAYMENT_LABEL.pending_payment}</option>
                        <option value="paid">{REWARD_PAYMENT_LABEL.paid}</option>
                      </select>
                      {/* 日期范围 */}
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        导入时间起
                        <input
                          type="date"
                          value={rewardMgmtSearchDraft.importDateStart}
                          onChange={(e) =>
                            setRewardMgmtSearchDraft((d) => ({ ...d, importDateStart: e.target.value }))
                          }
                          className="min-w-[140px] cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                        导入时间止
                        <input
                          type="date"
                          value={rewardMgmtSearchDraft.importDateEnd}
                          onChange={(e) =>
                            setRewardMgmtSearchDraft((d) => ({ ...d, importDateEnd: e.target.value }))
                          }
                          className="min-w-[140px] cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </label>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={applyTextSearch}
                    className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Search className="w-4 h-4" />
                    搜索
                  </button>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-4 py-2 bg-white border border-line rounded-lg hover:bg-gray-50 transition-colors text-gray-500 text-xs font-medium shadow-sm cursor-pointer shrink-0"
                  >
                    重置
                  </button>
                  </div>

                  {((activeModule === 'academy' && academyTab === 'academy-content') ||
                    (activeModule === 'academy' && academyTab === 'academy-category') ||
                    (activeModule === 'recommendation' && recommendationTab === 'category') ||
                    activeModule === 'projectManagement' ||
                    activeModule === 'sectManagement' ||
                    activeModule === 'iterationRecord' ||
                    activeModule === 'productStaff' ||
                    activeModule === 'rewardManagement') && (
                    <div className="flex flex-wrap items-center gap-3 border-t border-line/80 bg-gray-50/40 px-4 py-3 lg:px-5">
                      {activeModule === 'academy' && academyTab === 'academy-content' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSideDrawer(null);
                              setAcademyBatchForm({
                                youbaoId: '',
                                tag: 'hot',
                                categoryId: academyCategories[0]?.id ?? '',
                                projectName: '',
                                projectId: '',
                                videoRows: [],
                              });
                              setAcademyBatchDrawerOpen(true);
                            }}
                            className="px-3 py-2 bg-white border border-line rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm cursor-pointer"
                          >
                            批量上传视频
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedAcademyContentIds.length === 0) {
                                alert('请先勾选内容');
                                return;
                              }
                              const now = new Date().toLocaleString();
                              setAcademyContents((prev) =>
                                prev.map((r) =>
                                  selectedAcademyContentIds.includes(r.id)
                                    ? { ...r, status: 'show' as const, updateTime: now }
                                    : r
                                )
                              );
                              setSelectedAcademyContentIds([]);
                            }}
                            className="px-3 py-2 bg-white border border-line rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm cursor-pointer"
                          >
                            批量显示
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedAcademyContentIds.length === 0) {
                                alert('请先勾选内容');
                                return;
                              }
                              const now = new Date().toLocaleString();
                              setAcademyContents((prev) =>
                                prev.map((r) =>
                                  selectedAcademyContentIds.includes(r.id)
                                    ? { ...r, status: 'hide' as const, updateTime: now }
                                    : r
                                )
                              );
                              setSelectedAcademyContentIds([]);
                            }}
                            className="px-3 py-2 bg-white border border-line rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm cursor-pointer"
                          >
                            批量隐藏
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedAcademyContentIds.length === 0) {
                                alert('请先勾选内容');
                                return;
                              }
                              if (!window.confirm(`确定删除选中的 ${selectedAcademyContentIds.length} 条内容？`)) return;
                              setAcademyContents((prev) => prev.filter((r) => !selectedAcademyContentIds.includes(r.id)));
                              setSelectedAcademyContentIds([]);
                            }}
                            className="px-3 py-2 bg-red-50 border border-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100/80 shadow-sm cursor-pointer"
                          >
                            批量删除
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const defaultCat = academyCategories[0]?.id ?? '';
                              setSideDrawer({
                                variant: 'academy-content',
                                editingId: null,
                                form: {
                                  youbaoId: '',
                                  cover: '',
                                  title: '',
                                  tag: 'hot',
                                  categoryId: defaultCat,
                                  projectName: '',
                                  projectId: '',
                                  contentType: 'article',
                                  content: '',
                                  status: 'show',
                                },
                              });
                            }}
                            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                            新增内容
                          </button>
                        </>
                      )}

                      {activeModule === 'recommendation' && recommendationTab === 'category' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSideDrawer({
                              variant: 'drama-category',
                              editingId: null,
                              form: {
                                name: '',
                                taskType: 'novel',
                                relatedBusiness: [],
                                sort: 0,
                                status: 'show',
                              },
                            });
                          }}
                          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium shadow-sm flex items-center gap-2 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          新增分类
                        </button>
                      )}

                      {activeModule === 'academy' && academyTab === 'academy-category' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSideDrawer({
                              variant: 'academy-category',
                              editingId: null,
                              form: {
                                name: '',
                                kingkong: 'no',
                                icon: '',
                                sort: 0,
                                status: 'show',
                              },
                            });
                          }}
                          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium shadow-sm flex items-center gap-2 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          新增分类
                        </button>
                      )}

                      {activeModule === 'projectManagement' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSideDrawer({
                              variant: 'project-management',
                              editingId: null,
                              form: emptyProjectManagementForm(),
                            });
                          }}
                          className="flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent/90"
                        >
                          <Plus className="h-4 w-4" />
                          新增项目
                        </button>
                      )}

                      {activeModule === 'sectManagement' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSideDrawer({
                              variant: 'sect-guild',
                              editingId: null,
                              form: emptySectGuildForm(),
                            });
                          }}
                          className="flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent/90"
                        >
                          <Plus className="h-4 w-4" />
                          新增门派
                        </button>
                      )}

                      {activeModule === 'iterationRecord' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSideDrawer({
                              variant: 'iteration-record',
                              editingId: null,
                              scope: iterationRecordScope,
                              form: emptyIterationRecordForm(),
                            });
                          }}
                          className="flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent/90"
                        >
                          <Plus className="h-4 w-4" />
                          新增记录
                        </button>
                      )}

                      {activeModule === 'productStaff' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSideDrawer({
                              variant: 'product-staff',
                              editingId: null,
                              form: emptyProductStaffForm(),
                            });
                          }}
                          className="flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent/90"
                        >
                          <Plus className="h-4 w-4" />
                          新增人员
                        </button>
                      )}

                      {activeModule === 'rewardManagement' && (
                        <>
                          {/* 数据统计：已审核待打款 / 已审核已打款 */}
                          {(() => {
                            const pendingPayment = rewardMgmtRows.filter(
                              (r) => r.auditStatus === 'reviewed' && r.paymentStatus === 'pending_payment'
                            );
                            const paid = rewardMgmtRows.filter(
                              (r) => r.auditStatus === 'reviewed' && r.paymentStatus === 'paid'
                            );
                            const pendingAmount = pendingPayment.reduce((s, r) => s + r.amount, 0);
                            const paidAmount = paid.reduce((s, r) => s + r.amount, 0);
                            const fmt = (n: number) => n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            return (
                              <div className="flex items-center gap-3 mr-1">
                                <div className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5">
                                  <span className="text-[10px] font-medium text-orange-600">已审核待打款</span>
                                  <span className="text-xs font-bold text-orange-700">¥{fmt(pendingAmount)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5">
                                  <span className="text-[10px] font-medium text-emerald-600">已审核已打款</span>
                                  <span className="text-xs font-bold text-emerald-700">¥{fmt(paidAmount)}</span>
                                </div>
                              </div>
                            );
                          })()}
                          <button
                            type="button"
                            onClick={() => setRewardImportDrawerOpen(true)}
                            className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                          >
                            批量导入
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (rewardMgmtSelectedIds.length === 0) {
                                alert('请先勾选记录');
                                return;
                              }
                              const toApprove = rewardMgmtRows.filter(
                                (r) => rewardMgmtSelectedIds.includes(r.id) && r.auditStatus === 'pending_review'
                              );
                              if (toApprove.length === 0) {
                                alert('批量审核通过仅对「待审核」记录生效。');
                                return;
                              }
                              setRewardApproveModalOpen(true);
                            }}
                            className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                          >
                            批量审核通过
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (rewardMgmtSelectedIds.length === 0) {
                                alert('请先勾选记录');
                                return;
                              }
                              const toRevert = rewardMgmtRows.filter(
                                (r) => rewardMgmtSelectedIds.includes(r.id) && r.auditStatus === 'reviewed'
                              );
                              if (toRevert.length === 0) {
                                alert('批量审核驳回仅对已审核记录生效。');
                                return;
                              }
                              setRewardRejectModalOpen(true);
                            }}
                            className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                          >
                            批量审核驳回
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (rewardMgmtSelectedIds.length === 0) {
                                alert('请先勾选记录');
                                return;
                              }
                              const eligible = rewardMgmtRows.filter(
                                (r) =>
                                  rewardMgmtSelectedIds.includes(r.id) &&
                                  r.auditStatus === 'reviewed' &&
                                  r.paymentStatus === 'pending_payment'
                              );
                              if (eligible.length === 0) {
                                alert('所选记录中无符合打款条件的数据（需审核通过且待打款）');
                                return;
                              }
                              const total = eligible.reduce((s, r) => s + (r.amount ?? 0), 0);
                              setRewardBatchPayConfirm({ count: eligible.length, total });
                            }}
                            className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                          >
                            批量打款
                          </button>
                          <button
                            type="button"
                            onClick={() => exportRewardMgmtExcel(filteredRewardMgmtRows)}
                            className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                          >
                            导出数据
                          </button>
                          <button
                            type="button"
                            onClick={() => setRewardPaymentQueueOpen(true)}
                            className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                          >
                            打款任务队列
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (rewardMgmtSelectedIds.length === 0) {
                                alert('请先勾选记录');
                                return;
                              }
                              setRewardMgmtRows((prev) =>
                                prev.map((r) =>
                                  rewardMgmtSelectedIds.includes(r.id)
                                    ? { ...r, wechatNotify: 'sent' as const }
                                    : r
                                )
                              );
                              setRewardMgmtSelectedIds([]);
                            }}
                            className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                          >
                            批量发送微信通知
                          </button>
                        </>
                      )}

                    </div>
                  )}
                </div>
              )}
              {activeModule === 'dashboard' ? (
                <DashboardPage />
              ) : activeModule === 'ganttMap' ? (
                <GanttMapPage
                  iterationRows={iterationRecordRows}
                  staffNameById={iterationStaffNameById}
                  productLine={ganttProductLine}
                  onProductLineChange={setGanttProductLine}
                  onBarRangeCommit={commitGanttBarRange}
                />
              ) : activeModule === 'leaderboard' ? (
                leaderboardTab === 'community' ? (
                  <CommunityTable 
                    data={filteredCommunityData} 
                    currentPage={currentPage} 
                    pageSize={pageSize} 
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    getRule={(field) => getFieldRule('community', field)}
                  />
                ) : (
                  <LeaderboardTable 
                    data={filteredLeaderboardData} 
                    currentPage={currentPage} 
                    pageSize={pageSize} 
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    getRule={(field) => getFieldRule('leaderboard', field)}
                  />
                )
              ) : activeModule === 'recommendation' ? (
                recommendationTab === 'brand' ? (
                  <BrandRecommendationTable 
                    data={filteredBrandData} 
                    currentPage={currentPage} 
                    pageSize={pageSize} 
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    getRule={(field) => getFieldRule('brand', field)}
                  />
                ) : recommendationTab === 'drama' ? (
                  <DramaRecommendationTable 
                    data={filteredDramaData} 
                    currentPage={currentPage} 
                    pageSize={pageSize} 
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    getRule={(field) => getFieldRule('drama', field)}
                  />
                ) : (
                  <DramaCategoryTable 
                    data={filteredCategoryData} 
                    currentPage={currentPage} 
                    pageSize={pageSize} 
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    getRule={(field) => getFieldRule('category', field)}
                    onEdit={(category) => {
                      setSideDrawer({
                        variant: 'drama-category',
                        editingId: category.id,
                        form: {
                          name: category.name,
                          taskType: category.taskType,
                          relatedBusiness: category.relatedBusiness,
                          sort: category.sort,
                          status: category.status,
                        },
                      });
                    }}
                  />
                )
              ) : activeModule === 'academy' ? (
                academyTab === 'academy-category' ? (
                  <AcademyCategoryTable
                    data={filteredAcademyCategoryRows}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    getRule={(field) => getFieldRule('academy-category', field)}
                    onEdit={(row) => {
                      setSideDrawer({
                        variant: 'academy-category',
                        editingId: row.id,
                        form: {
                          name: row.name,
                          kingkong: row.kingkong,
                          icon: row.icon,
                          sort: row.sort,
                          status: row.status,
                        },
                      });
                    }}
                    onDelete={(row) => {
                      if (row.contentCount > 0) {
                        alert('该分类下仍有内容，请先调整或删除内容后再删除分类。');
                        return;
                      }
                      if (!window.confirm(`确定删除分类「${row.name}」？`)) return;
                      setAcademyCategories((prev) => prev.filter((c) => c.id !== row.id));
                    }}
                  />
                ) : (
                  <AcademyContentTable
                    data={filteredAcademyContents}
                    categories={academyCategories}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    getRule={(field) => getFieldRule('academy-content', field)}
                    selectedIds={selectedAcademyContentIds}
                    onSelectionChange={setSelectedAcademyContentIds}
                    onEdit={(row) => {
                      setSideDrawer({
                        variant: 'academy-content',
                        editingId: row.id,
                        form: {
                          youbaoId: row.youbaoId,
                          cover: row.cover,
                          title: row.title,
                          tag: row.tag,
                          categoryId: row.categoryId,
                          projectName: row.projectName,
                          projectId: row.projectId,
                          contentType: row.contentType,
                          content: row.content,
                          status: row.status,
                        },
                      });
                    }}
                    onDelete={(row) => {
                      if (!window.confirm(`确定删除内容「${row.title}」？`)) return;
                      setAcademyContents((prev) => prev.filter((c) => c.id !== row.id));
                      setSelectedAcademyContentIds((s) => s.filter((id) => id !== row.id));
                    }}
                    onPreview={setContentPreview}
                  />
                )
              ) : activeModule === 'projectManagement' ? (
                <ProjectManagementTable
                  data={filteredProjectMgmtRows}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  getRule={(field) => projectMgmtFieldRules[field] ?? '项目管理列表字段'}
                  onEdit={(row) => {
                    setSideDrawer({
                      variant: 'project-management',
                      editingId: row.id,
                      form: rowToForm(row),
                    });
                  }}
                />
              ) : activeModule === 'sectManagement' ? (
                <SectGuildTable
                  data={filteredSectGuildRows}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  onEdit={(row) => {
                    setSideDrawer({
                      variant: 'sect-guild',
                      editingId: row.id,
                      form: rowToSectGuildForm(row),
                    });
                  }}
                  onDelete={(row) => {
                    if (!window.confirm(`确定删除门派「${row.name}」？`)) return;
                    setSectGuildRows((prev) => prev.filter((r) => r.id !== row.id));
                  }}
                />
              ) : activeModule === 'customerServiceManagement' ? (
                <CustomerServiceManagementPage />
              ) : activeModule === 'auditEntryWorkbench' ? (
                <EntryAuditWorkbenchPage />
              ) : activeModule === 'auditMessageNotification' ? (
                <MessageNotificationRecordsPage />
              ) : activeModule === 'productStaff' ? (
                <ProductStaffTable
                  data={filteredProductStaffRows}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  onEdit={(row) => {
                    setSideDrawer({
                      variant: 'product-staff',
                      editingId: row.id,
                      form: rowToProductStaffForm(row),
                    });
                  }}
                  onDelete={(row) => {
                    if (!window.confirm(`确定删除产研人员「${row.name}」？`)) return;
                    setProductStaffRows((prev) => prev.filter((r) => r.id !== row.id));
                  }}
                />
              ) : activeModule === 'iterationRecord' ? (
                <IterationRecordTable
                  data={filteredIterationRecordRows}
                  staffNameById={iterationStaffNameById}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  onEdit={(row) => {
                    setSideDrawer({
                      variant: 'iteration-record',
                      editingId: row.id,
                      scope: row.scope,
                      form: rowToIterationForm(row),
                    });
                  }}
                  onDelete={(row) => {
                    const label = row.parentRequirement.trim().slice(0, 48) || row.id;
                    if (!window.confirm(`确定删除迭代记录「${label}」？`)) return;
                    setIterationRecordRows((prev) => prev.filter((r) => r.id !== row.id));
                  }}
                />
              ) : activeModule === 'youboomTeam' ? (
                <YouboomTeamTable
                  data={filteredYouboomTeamRows}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  sortField={youboomTeamSortField}
                  sortOrder={youboomTeamSortOrder}
                  onSort={handleYouboomTeamSort}
                  getRule={(field) => getFieldRule('youboom-team', field)}
                />
              ) : activeModule === 'rewardManagement' ? (
                <RewardManagementTable
                  data={filteredRewardMgmtRows}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  selectedIds={rewardMgmtSelectedIds}
                  onSelectionChange={setRewardMgmtSelectedIds}
                  getRule={(field) => getFieldRule('reward-management', field)}
                />
              ) : activeModule === 'config' ? (
                <FieldConfigTable 
                  data={filteredConfigData}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  editingId={editingFieldId}
                  editValue={editDescription}
                  onEditStart={(id, val) => {
                    fieldEditBaselineRef.current = { id, description: val };
                    setEditingFieldId(id);
                    setEditDescription(val);
                  }}
                  onEditChange={setEditDescription}
                  onEditSave={(id) => {
                    setFieldDescriptionOverrides((prev) => {
                      const next = { ...prev, [id]: editDescription };
                      persistDescriptionOverrides(next);
                      return next;
                    });
                    fieldEditBaselineRef.current = null;
                    setEditingFieldId(null);
                  }}
                  onEditCancel={() => {
                    const snap = fieldEditBaselineRef.current;
                    fieldEditBaselineRef.current = null;
                    if (snap) {
                      const { id, description: baseline } = snap;
                      setFieldDescriptionOverrides((prev) => {
                        const next = { ...prev };
                        const canonical = fieldConfigurationDescriptionDefaults[id] ?? '';
                        if (baseline === canonical) delete next[id];
                        else next[id] = baseline;
                        persistDescriptionOverrides(next);
                        return next;
                      });
                    }
                    setEditingFieldId(null);
                  }}
                />
              ) : activeModule === 'ruleDescription' ? (
                <div className="p-4 sm:p-5">
                  <RuleDescriptionPage
                    productLine={systemProductLine}
                    filterKeyword={ruleDescSearchApplied}
                  />
                </div>
              ) : activeModule === 'requirementPrototype' ? (
                <div className="p-4 sm:p-5">
                  <RequirementPrototypePage
                    onPrototypeSaved={() => {}}
                    onNavigateToModule={(module, subKey) => {
                      selectModule(module as ModuleType);
                      if (module === 'leaderboard' && subKey === 'community') {
                        setLeaderboardTab('community');
                      } else if (module === 'recommendation' && subKey) {
                        setRecommendationTab(subKey as RecommendationTab);
                      } else if (module === 'academy' && subKey) {
                        setAcademyTab(subKey as AcademyTab);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <Sparkles className="h-12 w-12 text-accent/40" />
                  <p className="text-base font-medium text-gray-800">请选择功能</p>
                  <p className="max-w-md text-sm text-gray-500">从左侧导航进入具体模块。</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Side Drawer */}
      <AnimatePresence>
        {isDrawerOpen && sideDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSideDrawer(null)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed inset-y-0 right-0 z-50 flex min-h-0 flex-col bg-white shadow-2xl ${
                sideDrawer.variant === 'project-management' || sideDrawer.variant === 'iteration-record'
                  ? 'min-w-[420px] max-w-[100vw]'
                  : sideDrawer.variant === 'sect-guild'
                    ? 'w-[min(100vw,560px)]'
                    : sideDrawer.variant === 'academy-content'
                      ? 'w-[min(100vw,480px)]'
                      : 'w-[min(100vw,400px)]'
              }`}
              style={
                sideDrawer.variant === 'project-management'
                  ? { width: clampPmDrawerWidth(projectMgmtDrawerWidth) }
                  : sideDrawer.variant === 'iteration-record'
                    ? { width: clampPmDrawerWidth(iterationRecordDrawerWidth) }
                    : undefined
              }
            >
              {(sideDrawer.variant === 'project-management' || sideDrawer.variant === 'iteration-record') && (
                <div
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="拖动调整抽屉宽度"
                  title="拖动调整宽度"
                  className="absolute left-0 top-0 z-[60] flex h-full w-3 cursor-ew-resize touch-none select-none items-center justify-center border-r border-transparent hover:border-accent/25 hover:bg-gray-100/90"
                  onPointerDown={(e) =>
                    onResizableDrawerResizePointerDown(
                      e,
                      sideDrawer.variant === 'project-management' ? 'project-management' : 'iteration-record'
                    )
                  }
                  onPointerMove={onResizableDrawerResizePointerMove}
                  onPointerUp={onResizableDrawerResizePointerUp}
                  onPointerCancel={onResizableDrawerResizePointerUp}
                >
                  <GripVertical className="pointer-events-none h-5 w-5 text-gray-300" aria-hidden />
                </div>
              )}
              <div
                className={`border-b border-line flex items-center justify-between shrink-0 ${
                  sideDrawer.variant === 'project-management' || sideDrawer.variant === 'iteration-record'
                    ? 'pl-10 pr-3 py-3.5'
                    : 'p-6'
                }`}
              >
                <h2
                  className={`font-bold ${
                    sideDrawer.variant === 'project-management' || sideDrawer.variant === 'iteration-record'
                      ? 'text-base'
                      : 'text-lg'
                  }`}
                >
                  {sideDrawer.variant === 'drama-category' &&
                    (sideDrawer.editingId ? '编辑剧作分类' : '新增剧作分类')}
                  {sideDrawer.variant === 'academy-category' &&
                    (sideDrawer.editingId ? '编辑商学院分类' : '新增商学院分类')}
                  {sideDrawer.variant === 'academy-content' &&
                    (sideDrawer.editingId ? '编辑商学院内容' : '新增商学院内容')}
                  {sideDrawer.variant === 'project-management' &&
                    (sideDrawer.editingId ? '编辑项目' : '新增项目')}
                  {sideDrawer.variant === 'iteration-record' &&
                    (sideDrawer.editingId ? '编辑迭代记录' : '新增迭代记录')}
                  {sideDrawer.variant === 'product-staff' &&
                    (sideDrawer.editingId ? '编辑产研人员' : '新增产研人员')}
                  {sideDrawer.variant === 'sect-guild' &&
                    (sideDrawer.editingId ? '编辑门派' : '新增门派')}
                </h2>
                <button
                  type="button"
                  onClick={() => setSideDrawer(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div
                className={
                  sideDrawer.variant === 'project-management'
                    ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4'
                    : sideDrawer.variant === 'iteration-record'
                      ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-6'
                      : 'min-h-0 flex-1 overflow-y-auto p-6 space-y-6'
                }
              >
                {sideDrawer.variant === 'drama-category' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        分类名称
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="请输入分类名称"
                        className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
                        value={sideDrawer.form.name}
                        onChange={(e) =>
                          setSideDrawer((d) =>
                            d?.variant === 'drama-category'
                              ? { ...d, form: { ...d.form, name: e.target.value } }
                              : d
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">推荐任务类型</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'novel', name: '小说' },
                          { id: 'drama', name: '短剧' },
                          { id: 'comic', name: '漫剧' },
                          { id: 'game', name: '游戏' },
                        ].map((type) => (
                          <label
                            key={type.id}
                            className="flex items-center gap-2 p-3 border border-line rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <input
                              type="radio"
                              name="taskType"
                              className="accent-accent"
                              checked={sideDrawer.form.taskType === type.id}
                              onChange={() =>
                                setSideDrawer((d) =>
                                  d?.variant === 'drama-category'
                                    ? { ...d, form: { ...d.form, taskType: type.id as DramaCategory['taskType'] } }
                                    : d
                                )
                              }
                            />
                            <span className="text-sm">{type.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">关联业务 (多选)</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['融合', '版权', '商单', '哔哩哔哩', '聚星', '原生', '0粉快手', '海外文娱', 'TTO'].map(
                          (biz) => (
                            <label
                              key={biz}
                              className="flex items-center gap-2 p-2 border border-line rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                              <input
                                type="checkbox"
                                className="accent-accent"
                                checked={sideDrawer.form.relatedBusiness.includes(biz)}
                                onChange={(e) =>
                                  setSideDrawer((d) => {
                                    if (d?.variant !== 'drama-category') return d;
                                    const next = e.target.checked
                                      ? [...d.form.relatedBusiness, biz]
                                      : d.form.relatedBusiness.filter((b) => b !== biz);
                                    return { ...d, form: { ...d.form, relatedBusiness: next } };
                                  })
                                }
                              />
                              <span className="text-sm">{biz}</span>
                            </label>
                          )
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">排序</label>
                      <input
                        type="number"
                        placeholder="数值越大越靠前"
                        className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
                        value={sideDrawer.form.sort}
                        onChange={(e) =>
                          setSideDrawer((d) =>
                            d?.variant === 'drama-category'
                              ? { ...d, form: { ...d.form, sort: parseInt(e.target.value, 10) || 0 } }
                              : d
                          )
                        }
                      />
                      <p className="text-[10px] text-gray-400">数值越大越靠前</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">状态</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="drama-cat-status"
                            className="accent-accent"
                            checked={sideDrawer.form.status === 'show'}
                            onChange={() =>
                              setSideDrawer((d) =>
                                d?.variant === 'drama-category'
                                  ? { ...d, form: { ...d.form, status: 'show' } }
                                  : d
                              )
                            }
                          />
                          <span className="text-sm">显示</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="drama-cat-status"
                            className="accent-accent"
                            checked={sideDrawer.form.status === 'hide'}
                            onChange={() =>
                              setSideDrawer((d) =>
                                d?.variant === 'drama-category'
                                  ? { ...d, form: { ...d.form, status: 'hide' } }
                                  : d
                              )
                            }
                          />
                          <span className="text-sm">隐藏</span>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">更新时间</label>
                      <input
                        type="text"
                        disabled
                        className="w-full px-4 py-2 bg-gray-50 border border-line rounded-lg text-gray-400 text-sm"
                        value={new Date().toLocaleString()}
                      />
                    </div>
                  </>
                )}

                {sideDrawer.variant === 'academy-category' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        分类名称
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
                        value={sideDrawer.form.name}
                        onChange={(e) =>
                          setSideDrawer((d) =>
                            d?.variant === 'academy-category'
                              ? { ...d, form: { ...d.form, name: e.target.value } }
                              : d
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        金刚区
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="academy-kk"
                            className="accent-accent"
                            checked={sideDrawer.form.kingkong === 'yes'}
                            onChange={() =>
                              setSideDrawer((d) =>
                                d?.variant === 'academy-category' ? { ...d, form: { ...d.form, kingkong: 'yes' } } : d
                              )
                            }
                          />
                          <span className="text-sm">是</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="academy-kk"
                            className="accent-accent"
                            checked={sideDrawer.form.kingkong === 'no'}
                            onChange={() =>
                              setSideDrawer((d) =>
                                d?.variant === 'academy-category' ? { ...d, form: { ...d.form, kingkong: 'no' } } : d
                              )
                            }
                          />
                          <span className="text-sm">否</span>
                        </label>
                      </div>
                    </div>
                    <AcademyImageUploadField
                      label={
                        <>
                          icon
                          {sideDrawer.form.kingkong === 'yes' && <span className="text-red-500">*</span>}
                        </>
                      }
                      value={sideDrawer.form.icon}
                      onChange={(url) =>
                        setSideDrawer((d) =>
                          d?.variant === 'academy-category' ? { ...d, form: { ...d.form, icon: url } } : d
                        )
                      }
                      hint="选择「金刚区=是」时必须上传图标；否时选填。"
                    />
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">排序</label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
                        value={sideDrawer.form.sort}
                        onChange={(e) =>
                          setSideDrawer((d) =>
                            d?.variant === 'academy-category'
                              ? { ...d, form: { ...d.form, sort: parseInt(e.target.value, 10) || 0 } }
                              : d
                          )
                        }
                      />
                      <p className="text-[10px] text-gray-400">数值越大越靠前</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">状态</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="academy-cat-status"
                            className="accent-accent"
                            checked={sideDrawer.form.status === 'show'}
                            onChange={() =>
                              setSideDrawer((d) =>
                                d?.variant === 'academy-category'
                                  ? { ...d, form: { ...d.form, status: 'show' } }
                                  : d
                              )
                            }
                          />
                          <span className="text-sm">显示</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="academy-cat-status"
                            className="accent-accent"
                            checked={sideDrawer.form.status === 'hide'}
                            onChange={() =>
                              setSideDrawer((d) =>
                                d?.variant === 'academy-category'
                                  ? { ...d, form: { ...d.form, status: 'hide' } }
                                  : d
                              )
                            }
                          />
                          <span className="text-sm">隐藏</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {sideDrawer.variant === 'academy-content' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        所属右豹ID
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-accent/20 outline-none text-sm"
                        value={sideDrawer.form.youbaoId}
                        onChange={(e) =>
                          setSideDrawer((d) =>
                            d?.variant === 'academy-content'
                              ? { ...d, form: { ...d.form, youbaoId: e.target.value } }
                              : d
                          )
                        }
                      />
                    </div>
                    <AcademyImageUploadField
                      label={
                        <>
                          封面
                          <span className="text-red-500">*</span>
                        </>
                      }
                      value={sideDrawer.form.cover}
                      onChange={(url) =>
                        setSideDrawer((d) =>
                          d?.variant === 'academy-content' ? { ...d, form: { ...d.form, cover: url } } : d
                        )
                      }
                      hint="支持本地图片上传，用于列表与卡片展示。"
                    />
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        标题
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-accent/20 outline-none text-sm"
                        value={sideDrawer.form.title}
                        onChange={(e) =>
                          setSideDrawer((d) =>
                            d?.variant === 'academy-content'
                              ? { ...d, form: { ...d.form, title: e.target.value } }
                              : d
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">标签</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="academy-content-tag"
                            className="accent-accent"
                            checked={sideDrawer.form.tag === 'hot'}
                            onChange={() =>
                              setSideDrawer((d) =>
                                d?.variant === 'academy-content' ? { ...d, form: { ...d.form, tag: 'hot' } } : d
                              )
                            }
                          />
                          <span className="text-sm">热门</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="academy-content-tag"
                            className="accent-accent"
                            checked={sideDrawer.form.tag === 'recommend'}
                            onChange={() =>
                              setSideDrawer((d) =>
                                d?.variant === 'academy-content'
                                  ? { ...d, form: { ...d.form, tag: 'recommend' } }
                                  : d
                              )
                            }
                          />
                          <span className="text-sm">推荐</span>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        所属分类
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-accent/20 outline-none text-sm bg-white"
                        value={sideDrawer.form.categoryId}
                        onChange={(e) =>
                          setSideDrawer((d) =>
                            d?.variant === 'academy-content'
                              ? { ...d, form: { ...d.form, categoryId: e.target.value } }
                              : d
                          )
                        }
                      >
                        {academyCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        关联品牌项目
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-accent/20 outline-none text-sm bg-white"
                        value={sideDrawer.form.projectId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const p = brandProjects.find((x) => x.id === id);
                          setSideDrawer((d) =>
                            d?.variant === 'academy-content'
                              ? { ...d, form: { ...d.form, projectId: id, projectName: p?.name ?? '' } }
                              : d
                          );
                        }}
                      >
                        <option value="">请选择项目名称（自动带出项目 ID）</option>
                        {brandProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                        {sideDrawer.variant === 'academy-content' &&
                          sideDrawer.form.projectId &&
                          !brandProjects.some((p) => p.id === sideDrawer.form.projectId) && (
                            <option value={sideDrawer.form.projectId}>
                              {sideDrawer.form.projectName || '历史项目'}（已绑定）
                            </option>
                          )}
                      </select>
                      <div className="rounded-lg border border-line bg-gray-50/80 px-3 py-2 text-xs text-gray-600">
                        项目 ID：
                        <span className="ml-1 font-mono text-gray-800">
                          {sideDrawer.form.projectId || '—'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">内容类型</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="academy-content-type"
                            className="accent-accent"
                            checked={sideDrawer.form.contentType === 'article'}
                            onChange={() =>
                              setSideDrawer((d) =>
                                d?.variant === 'academy-content'
                                  ? { ...d, form: { ...d.form, contentType: 'article' } }
                                  : d
                              )
                            }
                          />
                          <span className="text-sm">图文</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="academy-content-type"
                            className="accent-accent"
                            checked={sideDrawer.form.contentType === 'video'}
                            onChange={() =>
                              setSideDrawer((d) =>
                                d?.variant === 'academy-content'
                                  ? { ...d, form: { ...d.form, contentType: 'video' } }
                                  : d
                              )
                            }
                          />
                          <span className="text-sm">视频</span>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {sideDrawer.form.contentType === 'article' ? (
                        <>
                          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            内容
                            <span className="text-red-500">*</span>
                          </label>
                          <RichTextEditor
                            value={sideDrawer.form.content}
                            onChange={(html) =>
                              setSideDrawer((d) =>
                                d?.variant === 'academy-content'
                                  ? { ...d, form: { ...d.form, content: html } }
                                  : d
                              )
                            }
                          />
                        </>
                      ) : (
                        <AcademyVideoUploadField
                          label={
                            <>
                              内容
                              <span className="text-red-500">*</span>
                            </>
                          }
                          value={sideDrawer.form.content}
                          onChange={(url) =>
                            setSideDrawer((d) =>
                              d?.variant === 'academy-content'
                                ? { ...d, form: { ...d.form, content: url } }
                                : d
                            )
                          }
                          hint="支持本地视频上传，生成可播放地址（演示环境为本机 blob URL）；保存逻辑与图文一致。"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">状态</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="academy-content-status"
                            className="accent-accent"
                            checked={sideDrawer.form.status === 'show'}
                            onChange={() =>
                              setSideDrawer((d) =>
                                d?.variant === 'academy-content'
                                  ? { ...d, form: { ...d.form, status: 'show' } }
                                  : d
                              )
                            }
                          />
                          <span className="text-sm">显示</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="academy-content-status"
                            className="accent-accent"
                            checked={sideDrawer.form.status === 'hide'}
                            onChange={() =>
                              setSideDrawer((d) =>
                                d?.variant === 'academy-content'
                                  ? { ...d, form: { ...d.form, status: 'hide' } }
                                  : d
                              )
                            }
                          />
                          <span className="text-sm">隐藏</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {sideDrawer.variant === 'project-management' && (
                  <ProjectManagementDrawerFields
                    form={sideDrawer.form}
                    onPatch={(p) =>
                      setSideDrawer((d) =>
                        d?.variant === 'project-management' ? { ...d, form: { ...d.form, ...p } } : d
                      )
                    }
                    memberTypeOptions={memberTypeNames}
                  />
                )}

                {sideDrawer.variant === 'iteration-record' && (
                  <Fragment key={sideDrawer.editingId ?? 'new-iteration-record'}>
                    <IterationRecordDrawerFields
                      form={sideDrawer.form}
                      staffOptions={iterationStaffOptions}
                      onPatch={(p) =>
                        setSideDrawer((d) =>
                          d?.variant === 'iteration-record' ? { ...d, form: { ...d.form, ...p } } : d
                        )
                      }
                    />
                  </Fragment>
                )}

                {sideDrawer.variant === 'product-staff' && (
                  <ProductStaffDrawerFields
                    form={sideDrawer.form}
                    onPatch={(p) =>
                      setSideDrawer((d) =>
                        d?.variant === 'product-staff' ? { ...d, form: { ...d.form, ...p } } : d
                      )
                    }
                  />
                )}

                {sideDrawer.variant === 'sect-guild' && (
                  <SectGuildDrawerFields
                    form={sideDrawer.form}
                    onPatch={(p) =>
                      setSideDrawer((d) =>
                        d?.variant === 'sect-guild' ? { ...d, form: { ...d.form, ...p } } : d
                      )
                    }
                  />
                )}

              </div>

              <div
                className={`mt-auto flex shrink-0 gap-3 border-t border-line bg-white ${
                  sideDrawer.variant === 'project-management' || sideDrawer.variant === 'iteration-record'
                    ? 'px-4 py-4'
                    : 'p-6'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSideDrawer(null)}
                  className="flex-1 rounded-lg border border-line px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!sideDrawer) return;
                    const ts = new Date().toLocaleString();
                    if (sideDrawer.variant === 'product-staff') {
                      const f = sideDrawer.form;
                      if (!f.name.trim()) {
                        alert('请输入名字');
                        return;
                      }
                      const id = sideDrawer.editingId ?? `ps-${Date.now()}`;
                      const prevRow = sideDrawer.editingId
                        ? productStaffRows.find((r) => r.id === sideDrawer.editingId) ?? null
                        : null;
                      const nextRow = createProductStaffRow(f, id, prevRow);
                      if (sideDrawer.editingId) {
                        setProductStaffRows((prev) => prev.map((r) => (r.id === id ? nextRow : r)));
                      } else {
                        setProductStaffRows((prev) => [...prev, nextRow]);
                      }
                      setSideDrawer(null);
                      return;
                    }
                    if (sideDrawer.variant === 'iteration-record') {
                      const f = sideDrawer.form;
                      if (!f.parentRequirement.trim()) {
                        alert('请填写父需求');
                        return;
                      }
                      if (!parseIterationPriority(f.priority)) {
                        alert('请选择优先级');
                        return;
                      }
                      const scope = sideDrawer.scope;
                      const prevRow = sideDrawer.editingId
                        ? iterationRecordRows.find((r) => r.id === sideDrawer.editingId) ?? null
                        : null;
                      const id = sideDrawer.editingId ?? `ir-${Date.now()}`;
                      const nextRow = createIterationRowFromForm(f, scope, id, prevRow);
                      if (sideDrawer.editingId) {
                        setIterationRecordRows((prev) => prev.map((r) => (r.id === id ? nextRow : r)));
                      } else {
                        setIterationRecordRows((prev) => [...prev, nextRow]);
                      }
                      setSideDrawer(null);
                      return;
                    }
                    if (sideDrawer.variant === 'sect-guild') {
                      const f = sideDrawer.form;
                      if (!f.name.trim()) {
                        alert('请输入门派名称');
                        return;
                      }
                      if (!f.leaderName.trim()) {
                        alert('请输入门派负责人');
                        return;
                      }
                      const prevRow = sideDrawer.editingId
                        ? sectGuildRows.find((r) => r.id === sideDrawer.editingId) ?? null
                        : null;
                      const id = sideDrawer.editingId ?? `sg-${Date.now()}`;
                      const stats = prevRow
                        ? {
                            projectCount: prevRow.projectCount,
                            mentorCount: prevRow.mentorCount,
                            studentCount: prevRow.studentCount,
                            totalStudentEarnings: prevRow.totalStudentEarnings,
                            status: prevRow.status,
                          }
                        : {
                            projectCount: 0,
                            mentorCount: 0,
                            studentCount: 0,
                            totalStudentEarnings: 0,
                            status: 'active' satisfies SectGuildStatus,
                          };
                      const nextRow = createSectGuildRowFromForm(f, id, prevRow, stats);
                      if (sideDrawer.editingId) {
                        setSectGuildRows((prev) => prev.map((r) => (r.id === id ? nextRow : r)));
                      } else {
                        setSectGuildRows((prev) => [...prev, nextRow]);
                      }
                      setSideDrawer(null);
                      return;
                    }
                    if (sideDrawer.variant === 'project-management') {
                      const f = sideDrawer.form;
                      if (!f.frontTitle.trim() || !f.backTitle.trim()) {
                        alert('请填写前端标题与后台标题');
                        return;
                      }
                      if (sideDrawer.editingId) {
                        setProjectMgmtRows((prev) =>
                          prev.map((r) =>
                            r.id === sideDrawer.editingId ? formToRow(f, r.id, r.seq, ts) : r
                          )
                        );
                      } else {
                        const nextSeq = Math.max(0, ...projectMgmtRows.map((r) => r.seq)) + 1;
                        const id = `PM-${Date.now()}`;
                        setProjectMgmtRows((prev) => [...prev, formToRow(f, id, nextSeq, ts)]);
                      }
                      setSideDrawer(null);
                      return;
                    }
                    if (sideDrawer.variant === 'drama-category') {
                      if (!sideDrawer.form.name.trim()) {
                        alert('请输入分类名称');
                        return;
                      }
                      setSideDrawer(null);
                      return;
                    }
                    if (sideDrawer.variant === 'academy-category') {
                      const f = sideDrawer.form;
                      if (!f.name.trim()) {
                        alert('请输入分类名称');
                        return;
                      }
                      const kingkongStored: AcademyCategory['kingkong'] = f.kingkong;
                      if (kingkongStored === 'yes' && !f.icon.trim()) {
                        alert('已选择金刚区为「是」，请上传 icon 图片');
                        return;
                      }
                      if (sideDrawer.editingId) {
                        setAcademyCategories((prev) =>
                          prev.map((c) =>
                            c.id === sideDrawer.editingId
                              ? {
                                  ...c,
                                  name: f.name.trim(),
                                  kingkong: kingkongStored,
                                  icon: f.icon.trim(),
                                  sort: f.sort,
                                  status: f.status,
                                  updateTime: ts,
                                }
                              : c
                          )
                        );
                      } else {
                        const nextSeq = Math.max(0, ...academyCategories.map((c) => c.seq)) + 1;
                        setAcademyCategories((prev) => [
                          ...prev,
                          {
                            id: `ac-cat-${Date.now()}`,
                            seq: nextSeq,
                            name: f.name.trim(),
                            kingkong: kingkongStored,
                            icon: f.icon.trim(),
                            sort: f.sort,
                            status: f.status,
                            updateTime: ts,
                          },
                        ]);
                      }
                      setSideDrawer(null);
                      return;
                    }
                    const f = sideDrawer.form;
                    if (!f.youbaoId.trim() || !f.title.trim() || !f.cover.trim() || !f.content.trim()) {
                      alert('请填写必填项：右豹ID、封面、标题、内容');
                      return;
                    }
                    if (!f.categoryId) {
                      alert('请选择所属分类');
                      return;
                    }
                    if (!f.projectId.trim()) {
                      alert('请选择关联品牌项目');
                      return;
                    }
                    if (sideDrawer.editingId) {
                      setAcademyContents((prev) =>
                        prev.map((c) =>
                          c.id === sideDrawer.editingId
                            ? {
                                ...c,
                                youbaoId: f.youbaoId.trim(),
                                cover: f.cover.trim(),
                                title: f.title.trim(),
                                tag: f.tag,
                                categoryId: f.categoryId,
                                projectName: f.projectName.trim(),
                                projectId: f.projectId.trim(),
                                contentType: f.contentType,
                                content: f.content.trim(),
                                status: f.status,
                                updateTime: ts,
                              }
                            : c
                        )
                      );
                    } else {
                      const nextSeq = Math.max(0, ...academyContents.map((c) => c.seq)) + 1;
                      setAcademyContents((prev) => [
                        ...prev,
                        {
                          id: `ac-con-${Date.now()}`,
                          seq: nextSeq,
                          youbaoId: f.youbaoId.trim(),
                          cover: f.cover.trim(),
                          title: f.title.trim(),
                          tag: f.tag,
                          categoryId: f.categoryId,
                          projectName: f.projectName.trim(),
                          projectId: f.projectId.trim(),
                          contentType: f.contentType,
                          content: f.content.trim(),
                          status: f.status,
                          updateTime: ts,
                        },
                      ]);
                    }
                    setSideDrawer(null);
                  }}
                  className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent/90"
                >
                  保存
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {academyBatchDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                if (e.target !== e.currentTarget) return;
                if (Date.now() < academyBatchFilePickerShieldUntilRef.current) return;
                setAcademyBatchDrawerOpen(false);
              }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[45]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed top-0 right-0 z-[46] flex h-full w-[min(100vw,560px)] flex-col bg-white shadow-2xl"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-line px-3 py-4 sm:px-4">
                <div>
                  <h2 className="text-lg font-bold text-ink">批量上传视频</h2>
                  <p className="mt-1 text-xs text-gray-500">单次最多选择 20 个视频文件。</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAcademyBatchDrawerOpen(false)}
                  className="rounded-full p-2 transition-colors hover:bg-gray-100"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                <div className="space-y-2">
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    所属右豹ID
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-line px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20"
                    value={academyBatchForm.youbaoId}
                    onChange={(e) =>
                      setAcademyBatchForm((p) => ({ ...p, youbaoId: e.target.value }))
                    }
                    placeholder="例如 YB10001"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">标签</label>
                  <div className="flex gap-4">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="batch-academy-tag"
                        className="accent-accent"
                        checked={academyBatchForm.tag === 'hot'}
                        onChange={() => setAcademyBatchForm((p) => ({ ...p, tag: 'hot' }))}
                      />
                      <span className="text-sm">热门</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="batch-academy-tag"
                        className="accent-accent"
                        checked={academyBatchForm.tag === 'recommend'}
                        onChange={() => setAcademyBatchForm((p) => ({ ...p, tag: 'recommend' }))}
                      />
                      <span className="text-sm">推荐</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    所属分类
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-lg border border-line bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20"
                    value={academyBatchForm.categoryId}
                    onChange={(e) =>
                      setAcademyBatchForm((p) => ({ ...p, categoryId: e.target.value }))
                    }
                  >
                    {academyCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    关联品牌项目
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-lg border border-line bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20"
                    value={academyBatchForm.projectId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const p = brandProjects.find((x) => x.id === id);
                      setAcademyBatchForm((prev) => ({
                        ...prev,
                        projectId: id,
                        projectName: p?.name ?? '',
                      }));
                    }}
                  >
                    <option value="">请选择项目</option>
                    {brandProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">
                    项目 ID：<span className="font-mono text-gray-800">{academyBatchForm.projectId || '—'}</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">选择视频文件</label>
                  <button
                    type="button"
                    onClick={() => {
                      academyBatchFilePickerShieldUntilRef.current = Date.now() + 1200;
                      window.requestAnimationFrame(() => {
                        academyBatchVideoInputRef.current?.click();
                      });
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-gray-50/80 py-8 text-sm font-medium text-gray-600 transition-colors hover:border-accent/40 hover:bg-accent/5"
                  >
                    <Upload className="h-5 w-5 text-accent" />
                    点击选择视频（可多选）
                  </button>
                  <AcademyBatchStaticStatusMocks />
                </div>
                {academyBatchForm.videoRows.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-600">上传队列</p>
                    <div className="space-y-2">
                      {academyBatchForm.videoRows.map((row) => (
                        <div key={row.localId}>
                          <AcademyBatchVideoRowCard
                            row={row}
                            onRemove={() =>
                              setAcademyBatchForm((prev) => ({
                                ...prev,
                                videoRows: prev.videoRows.filter((r) => r.localId !== row.localId),
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex shrink-0 gap-3 border-t border-line px-3 py-4 sm:px-4">
                <button
                  type="button"
                  onClick={() => setAcademyBatchDrawerOpen(false)}
                  className="flex-1 rounded-lg border border-line py-2 text-sm font-medium transition-colors hover:bg-gray-50"
                >
                  关闭
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const f = academyBatchForm;
                    if (!f.youbaoId.trim()) {
                      alert('请填写所属右豹ID');
                      return;
                    }
                    if (!f.categoryId) {
                      alert('请选择所属分类');
                      return;
                    }
                    if (!f.projectId.trim()) {
                      alert('请选择关联品牌项目');
                      return;
                    }
                    const ok = f.videoRows.filter((r) => r.status === 'success' && r.url);
                    if (ok.length === 0) {
                      alert('请至少等待一条「成功」状态的视频完成后再确定上传');
                      return;
                    }
                    const pending = f.videoRows.some((r) => r.status === 'uploading' || r.status === 'queued');
                    if (pending && !window.confirm('仍有文件在上传中，是否仅为已成功的上传生成内容？')) {
                      return;
                    }
                    const ts = new Date().toLocaleString();
                    setAcademyContents((prev) => {
                      let seq = Math.max(0, ...prev.map((c) => c.seq));
                      const next = [...prev];
                      ok.forEach((row, idx) => {
                        seq += 1;
                        const titleStem =
                          row.file.name.replace(/\.[^/.]+$/, '') || `批量视频${idx + 1}`;
                        next.push({
                          id: `ac-con-${Date.now()}-${idx}-${row.localId}`,
                          seq,
                          youbaoId: f.youbaoId.trim(),
                          cover: `https://picsum.photos/seed/ac-bulk-${Date.now()}-${idx}/160/100`,
                          title: titleStem,
                          tag: f.tag,
                          categoryId: f.categoryId,
                          projectName: f.projectName,
                          projectId: f.projectId,
                          contentType: 'video',
                          content: row.url!,
                          status: 'show',
                          updateTime: ts,
                        });
                      });
                      return next;
                    });
                    setAcademyBatchDrawerOpen(false);
                    setAcademyBatchForm({
                      youbaoId: '',
                      tag: 'hot',
                      categoryId: academyCategories[0]?.id ?? '',
                      projectName: '',
                      projectId: '',
                      videoRows: [],
                    });
                  }}
                  className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent/90"
                >
                  确定上传
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <RewardBatchImportDrawer
        open={rewardImportDrawerOpen}
        onClose={() => setRewardImportDrawerOpen(false)}
        importOperator="Admin User"
        onImported={(rows) => {
          setRewardMgmtRows((prev) => [...rows, ...prev]);
          setCurrentPage(1);
        }}
      />
      <RewardPaymentQueueDrawer open={rewardPaymentQueueOpen} onClose={() => setRewardPaymentQueueOpen(false)} />
      <RewardApproveConfirmModal
        open={rewardApproveModalOpen}
        count={rewardMgmtRows.filter((r) => rewardMgmtSelectedIds.includes(r.id) && r.auditStatus === 'pending_review').length}
        totalAmount={rewardMgmtRows
          .filter((r) => rewardMgmtSelectedIds.includes(r.id) && r.auditStatus === 'pending_review')
          .reduce((sum, r) => sum + r.amount, 0)}
        onConfirm={() => {
          const ts = new Date().toISOString();
          setRewardMgmtRows((prev) =>
            prev.map((r) =>
              rewardMgmtSelectedIds.includes(r.id) && r.auditStatus === 'pending_review'
                ? { ...r, auditStatus: 'reviewed' as const, reviewer: 'Admin User', reviewedAt: ts }
                : r
            )
          );
          setRewardMgmtSelectedIds([]);
          setRewardApproveModalOpen(false);
        }}
        onCancel={() => setRewardApproveModalOpen(false)}
      />
      <RewardRejectModal
        open={rewardRejectModalOpen}
        count={rewardMgmtRows.filter((r) => rewardMgmtSelectedIds.includes(r.id) && r.auditStatus === 'reviewed').length}
        onConfirm={(reason) => {
          setRewardMgmtRows((prev) =>
            prev.map((r) =>
              rewardMgmtSelectedIds.includes(r.id) && r.auditStatus === 'reviewed'
                ? {
                    ...r,
                    auditStatus: 'rejected' as const,
                    rejectReason: reason,
                    paymentStatus: 'pending_payment' as const,
                    payer: '',
                    paidAt: null,
                  }
                : r
            )
          );
          setRewardMgmtSelectedIds([]);
          setRewardRejectModalOpen(false);
        }}
        onCancel={() => setRewardRejectModalOpen(false)}
      />
      {/* 批量打款二次确认弹窗 */}
      <AnimatePresence>
        {rewardBatchPayConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-sm mx-4 rounded-2xl bg-white dark:bg-gray-900 border border-line shadow-2xl p-6"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/90">确认执行批量打款？</p>
                  <p className="text-xs text-gray-500 dark:text-white/45 mt-0.5">请核对以下信息后再确认</p>
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-white/5 border border-line px-4 py-3 mb-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-white/50">本次打款笔数</span>
                  <span className="font-semibold text-gray-900 dark:text-white/90">{rewardBatchPayConfirm.count} 笔订单</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-white/50">总奖励金额</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {rewardBatchPayConfirm.total.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 元
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/8 border border-amber-200/60 dark:border-amber-500/20 px-3 py-2.5 mb-5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  打款仅针对审核通过的数据进行执行，打款后可在「打款任务队列」查看打款成功和失败的情况。
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRewardBatchPayConfirm(null)}
                  className="flex-1 py-2 rounded-xl border border-line text-sm text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ts = new Date().toISOString();
                    setRewardMgmtRows((prev) =>
                      prev.map((r) =>
                        rewardMgmtSelectedIds.includes(r.id) &&
                        r.auditStatus === 'reviewed' &&
                        r.paymentStatus === 'pending_payment'
                          ? { ...r, paymentStatus: 'paid' as const, payer: 'Admin User', paidAt: ts }
                          : r
                      )
                    );
                    setRewardMgmtSelectedIds([]);
                    setRewardBatchPayConfirm(null);
                  }}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
                >
                  确认打款
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {contentPreview && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setContentPreview(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-line"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-3 py-4 sm:px-4">
              <h3 className="text-lg font-bold text-ink pr-4">{contentPreview.title}</h3>
              <button
                type="button"
                onClick={() => setContentPreview(null)}
                className="shrink-0 rounded-full p-2 hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="max-h-[calc(90vh-5rem)] overflow-auto p-6">
              {contentPreview.contentType === 'video' ? (
                <video
                  src={contentPreview.content}
                  controls
                  className="w-full max-h-[60vh] rounded-lg bg-black"
                />
              ) : /^\s*</.test(contentPreview.content) ? (
                <div
                  className="prose prose-sm max-w-none text-gray-800"
                  dangerouslySetInnerHTML={{ __html: contentPreview.content }}
                />
              ) : (
                <pre className="whitespace-pre-wrap break-words font-sans text-sm text-gray-800">
                  {contentPreview.content}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 表格横向滚动容器等不会把 scroll 冒泡到 window，需一并监听才能对齐 fixed 字段说明层 */
function bindScrollableAncestors(anchor: HTMLElement | null, handler: () => void): () => void {
  if (!anchor) return () => {};
  const nodes = new Set<EventTarget>([window]);
  let el: HTMLElement | null = anchor.parentElement;
  while (el) {
    const { overflow, overflowX, overflowY } = window.getComputedStyle(el);
    const o = `${overflow}${overflowX}${overflowY}`;
    if (/(auto|scroll|overlay)/.test(o)) nodes.add(el);
    el = el.parentElement;
  }
  const opts: AddEventListenerOptions = { capture: true, passive: true };
  nodes.forEach((n) => n.addEventListener('scroll', handler as EventListener, opts));
  return () => {
    nodes.forEach((n) => n.removeEventListener('scroll', handler as EventListener, opts));
  };
}

const tableHeadClass =
  'px-3 py-3.5 text-left text-[14px] font-bold text-gray-900 dark:text-white/85 font-sans tracking-tight align-middle whitespace-nowrap sm:px-4';
const tableHeadClassRight = `${tableHeadClass} text-right`;

/** 表尾「操作」列：横向滚动时固定在可视区域右侧 */
const tableHeadAction =
  'sticky right-0 z-30 border-l border-line bg-gray-50/95 dark:bg-[#181c28]/95 px-3 py-3.5 text-right text-[14px] font-bold text-gray-900 dark:text-white/85 font-sans tracking-tight align-middle whitespace-nowrap shadow-[-10px_0_20px_-8px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:px-4 relative';
const tableCellActionBase =
  'sticky right-0 z-20 border-l border-line bg-white dark:bg-[#1e2232] px-3 py-4 text-right shadow-[-10px_0_20px_-8px_rgba(0,0,0,0.08)] group-hover:bg-gray-50 dark:group-hover:bg-[#252a3a] sm:px-4';
const tableCellAction = `${tableCellActionBase} align-middle`;
const tableCellActionTop = `${tableCellActionBase} align-top`;

const APP_LB_COL_DEFAULTS: number[] = [112, 128, 96, 128, 168, 144, 128, 160];
const APP_COMM_COL_DEFAULTS: number[] = [220, 200, 128, 120, 160];
const APP_BRAND_COL_DEFAULTS: number[] = [96, 160, 96, 120, 120, 120, 120, 96, 140, 160];
const APP_DRAMA_REC_COL_DEFAULTS: number[] = [120, 100, 160, 120, 140, 112, 96, 96, 160];
const APP_ACAD_CAT_COL_DEFAULTS: number[] = [72, 160, 96, 88, 88, 88, 88, 160, 100];
const APP_ACAD_CONTENT_COL_DEFAULTS: number[] = [44, 72, 120, 72, 160, 72, 120, 180, 88, 220, 88, 140, 120];
const APP_DRAMA_CAT_COL_DEFAULTS: number[] = [160, 110, 220, 88, 88, 160, 108];
const APP_FIELD_CFG_COL_DEFAULTS: number[] = [120, 140, 120, 120, 320, 100];

const TOOLTIP_MAX_PX = 448;

function TableHeader({
  label,
  rule,
  align = 'left',
  resizeHandle,
}: {
  label: string;
  rule: string;
  align?: 'left' | 'right';
  resizeHandle?: ReactNode;
}) {
  const alignRight = align === 'right';
  const iconRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [tipStyle, setTipStyle] = useState<CSSProperties>({});

  const updateTipPosition = useCallback(() => {
    const el = iconRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margin = 8;
    const maxWidth = Math.min(TOOLTIP_MAX_PX, window.innerWidth - 2 * margin);
    let left: number;
    if (alignRight) {
      left = r.right - maxWidth;
      if (left < margin) left = margin;
      if (left + maxWidth > window.innerWidth - margin) {
        left = Math.max(margin, window.innerWidth - margin - maxWidth);
      }
    } else {
      left = r.left;
      if (left + maxWidth > window.innerWidth - margin) {
        left = Math.max(margin, window.innerWidth - margin - maxWidth);
      }
      if (left < margin) left = margin;
    }
    const top = r.bottom + margin;
    setTipStyle({
      top,
      left,
      maxWidth,
      width: 'max-content',
    });
  }, [alignRight]);

  useLayoutEffect(() => {
    if (!open) return;
    updateTipPosition();
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(updateTipPosition);
    });
    return () => cancelAnimationFrame(id);
  }, [open, updateTipPosition]);

  useEffect(() => {
    if (!open) return;
    const onScrollResize = () => updateTipPosition();
    const unbindScrollers = bindScrollableAncestors(iconRef.current, onScrollResize);
    window.addEventListener('resize', onScrollResize);
    return () => {
      unbindScrollers();
      window.removeEventListener('resize', onScrollResize);
    };
  }, [open, updateTipPosition]);

  const tipPortal =
    open &&
    createPortal(
      <div
        className="pointer-events-none fixed z-[10000] max-h-[60vh] overflow-y-auto rounded bg-gray-900 px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed text-white shadow-xl"
        style={tipStyle}
        aria-hidden
      >
        <div className="mb-1 border-b border-white/10 pb-1 text-[11px] font-semibold text-blue-300">字段规则</div>
        <div className="whitespace-normal break-words">{rule}</div>
      </div>,
      document.body
    );

  return (
    <th className={`${alignRight ? tableHeadClassRight : tableHeadClass} relative`}>
      <div className={`flex flex-nowrap items-center gap-1.5 ${alignRight ? 'justify-end' : 'justify-start'}`}>
        <span>{label}</span>
        <div
          ref={iconRef}
          className="inline-flex shrink-0"
          onMouseEnter={() => {
            setOpen(true);
          }}
          onMouseLeave={() => setOpen(false)}
        >
          <HelpCircle className="h-3.5 w-3.5 cursor-help text-gray-400 opacity-70 transition-opacity hover:opacity-100" />
        </div>
      </div>
      {tipPortal}
      {resizeHandle}
    </th>
  );
}

function LeaderboardTable({ data, currentPage, pageSize, onPageChange, onPageSizeChange, getRule }: { 
  data: LeaderboardEntry[], 
  currentPage: number, 
  pageSize: number, 
  onPageChange: (page: number) => void,
  onPageSizeChange: (size: number) => void,
  getRule: (field: string) => string
}) {
  const rtc = useResizableTableColumns('app-leaderboard', APP_LB_COL_DEFAULTS);
  if (data.length === 0) return <EmptyState />;
  
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table
        className="app-data-table app-data-table--resizable w-full min-w-0 border-collapse text-left"
        style={{ minWidth: rtc.tableMinWidth }}
      >
        {rtc.colGroup}
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <TableHeader label="用户ID" rule={getRule('userId')} resizeHandle={rtc.renderResizeHandle(0)} />
            <TableHeader label="用户昵称" rule={getRule('nickname')} resizeHandle={rtc.renderResizeHandle(1)} />
            <TableHeader label="类型" rule={getRule('type')} resizeHandle={rtc.renderResizeHandle(2)} />
            <TableHeader
              label="累计收益"
              rule={getRule('totalEarnings')}
              align="right"
              resizeHandle={rtc.renderResizeHandle(3)}
            />
            <TableHeader label="统计维度" rule={getRule('dimension')} resizeHandle={rtc.renderResizeHandle(4)} />
            <TableHeader label="收益最高项目" rule={getRule('topProject')} resizeHandle={rtc.renderResizeHandle(5)} />
            <TableHeader
              label="项目收益"
              rule={getRule('projectEarnings')}
              align="right"
              resizeHandle={rtc.renderResizeHandle(6)}
            />
            <TableHeader label="更新时间" rule={getRule('updateTime')} resizeHandle={rtc.renderResizeHandle(7)} />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {paginatedData.map((item) => (
            <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
              <td className="px-3 py-4 sm:px-4 font-mono text-sm text-gray-500">{item.id}</td>
              <td className="px-3 py-4 sm:px-4 font-bold text-sm text-ink">{item.nickname}</td>
              <td className="px-3 py-4 sm:px-4">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${
                  item.type === 'individual' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                }`}>
                  {item.type === 'individual' ? '个人收益' : '单项目收益'}
                </span>
              </td>
              <td className="px-3 py-4 sm:px-4 font-mono text-sm text-right font-bold text-accent">
                ¥{item.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="px-3 py-4 sm:px-4">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  {item.dimension === '7d' ? '近7日' : '近30日'}
                </div>
              </td>
              <td className="px-3 py-4 sm:px-4">
                {item.type === 'individual' ? (
                  <span className="text-gray-300">-</span>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono text-gray-400">{item.topProjectId}</span>
                    <span className="text-sm font-medium text-gray-700">{item.topProjectName}</span>
                  </div>
                )}
              </td>
              <td className="px-3 py-4 sm:px-4 font-mono text-sm text-right text-gray-600">
                {item.type === 'individual' ? (
                  <span className="text-gray-300">-</span>
                ) : (
                  `¥${item.projectEarnings?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                )}
              </td>
              <td className="px-3 py-4 sm:px-4 text-sm text-gray-400">{item.updateTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination 
        total={data.length} 
        pageSize={pageSize} 
        currentPage={currentPage} 
        onPageChange={onPageChange} 
        onPageSizeChange={onPageSizeChange}
        pageSizes={[15, 50, 100, 500, 1000]}
      />
    </div>
  );
}

function CommunityTable({ data, currentPage, pageSize, onPageChange, onPageSizeChange, getRule }: { 
  data: CommunityEntry[], 
  currentPage: number, 
  pageSize: number, 
  onPageChange: (page: number) => void,
  onPageSizeChange: (size: number) => void,
  getRule: (field: string) => string
}) {
  const rtc = useResizableTableColumns('app-community', APP_COMM_COL_DEFAULTS);
  if (data.length === 0) return <EmptyState />;
  
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table
        className="app-data-table app-data-table--resizable w-full min-w-0 border-collapse text-left"
        style={{ minWidth: rtc.tableMinWidth }}
      >
        {rtc.colGroup}
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <TableHeader label="社群名称" rule={getRule('name')} resizeHandle={rtc.renderResizeHandle(0)} />
            <TableHeader label="社群标签" rule={getRule('tags')} resizeHandle={rtc.renderResizeHandle(1)} />
            <TableHeader
              label="累计收益"
              rule={getRule('totalEarnings')}
              align="right"
              resizeHandle={rtc.renderResizeHandle(2)}
            />
            <TableHeader label="统计维度" rule={getRule('dimension')} resizeHandle={rtc.renderResizeHandle(3)} />
            <TableHeader label="更新时间" rule={getRule('updateTime')} resizeHandle={rtc.renderResizeHandle(4)} />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {paginatedData.map((item) => (
            <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
              <td className="px-3 py-4 sm:px-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={item.avatar} 
                    alt={item.name} 
                    className="w-10 h-10 rounded-full border border-line object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="font-bold text-sm text-ink">{item.name}</span>
                </div>
              </td>
              <td className="px-3 py-4 sm:px-4">
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-3 py-4 sm:px-4 font-mono text-sm text-right font-bold text-accent">
                ¥{item.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="px-3 py-4 sm:px-4">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  {item.dimension === '7d' ? '近7日' : '近30日'}
                </div>
              </td>
              <td className="px-3 py-4 sm:px-4 text-sm text-gray-400">{item.updateTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination 
        total={data.length} 
        pageSize={pageSize} 
        currentPage={currentPage} 
        onPageChange={onPageChange} 
        onPageSizeChange={onPageSizeChange}
        pageSizes={[15, 50, 100, 500, 1000]}
      />
    </div>
  );
}

function BrandRecommendationTable({ data, currentPage, pageSize, onPageChange, onPageSizeChange, getRule }: { 
  data: BrandRecommendation[], 
  currentPage: number, 
  pageSize: number, 
  onPageChange: (page: number) => void,
  onPageSizeChange: (size: number) => void,
  getRule: (field: string) => string
}) {
  const rtc = useResizableTableColumns('app-brand-recommendation', APP_BRAND_COL_DEFAULTS);
  if (data.length === 0) return <EmptyState />;
  
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table
        className="app-data-table app-data-table--resizable w-full min-w-0 border-collapse text-left"
        style={{ minWidth: rtc.tableMinWidth }}
      >
        {rtc.colGroup}
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <TableHeader label="项目ID" rule={getRule('projectId')} resizeHandle={rtc.renderResizeHandle(0)} />
            <TableHeader label="项目名称" rule={getRule('projectName')} resizeHandle={rtc.renderResizeHandle(1)} />
            <TableHeader label="项目类型" rule={getRule('projectType')} resizeHandle={rtc.renderResizeHandle(2)} />
            <TableHeader
              label="项目总收益"
              rule={getRule('totalEarnings')}
              align="right"
              resizeHandle={rtc.renderResizeHandle(3)}
            />
            <TableHeader
              label="昨日收益"
              rule={getRule('yesterdayEarnings')}
              align="right"
              resizeHandle={rtc.renderResizeHandle(4)}
            />
            <TableHeader
              label="昨日题词数量"
              rule={getRule('yesterdayApprovedKeywords')}
              align="right"
              resizeHandle={rtc.renderResizeHandle(5)}
            />
            <TableHeader label="热门/上新" rule="项目推荐状态标识" resizeHandle={rtc.renderResizeHandle(6)} />
            <TableHeader
              label="加权分值"
              rule={getRule('weightScore')}
              align="right"
              resizeHandle={rtc.renderResizeHandle(7)}
            />
            <TableHeader label="推荐日期" rule={getRule('recommendDate')} resizeHandle={rtc.renderResizeHandle(8)} />
            <TableHeader label="更新时间" rule={getRule('updateTime')} resizeHandle={rtc.renderResizeHandle(9)} />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {paginatedData.map((item) => (
            <tr key={item.projectId} className="group hover:bg-gray-50 transition-colors">
              <td className="px-3 py-4 sm:px-4 font-mono text-sm text-gray-500">{item.projectId}</td>
              <td className="px-3 py-4 sm:px-4 font-bold text-sm text-ink">{item.projectName}</td>
              <td className="px-3 py-4 sm:px-4">
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase">
                  {item.projectType === 'tweet' ? '推文' : item.projectType === 'drama' ? '短剧' : item.projectType === 'resource' ? '资源' : '游戏'}
                </span>
              </td>
              <td className="px-3 py-4 sm:px-4 font-mono text-sm text-right text-accent font-bold">¥{item.totalEarnings.toLocaleString()}</td>
              <td className="px-3 py-4 sm:px-4 font-mono text-sm text-right text-green-600 font-medium">¥{item.yesterdayEarnings.toLocaleString()}</td>
              <td className="px-3 py-4 sm:px-4 font-mono text-sm text-right text-gray-600">{item.yesterdayApprovedKeywords}</td>
              <td className="px-3 py-4 sm:px-4">
                <div className="flex gap-1">
                  {item.isHot && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-[9px] font-bold">HOT</span>}
                  {item.isNew && <span className="px-1.5 py-0.5 bg-green-100 text-green-600 rounded text-[9px] font-bold">NEW</span>}
                </div>
              </td>
              <td className="px-3 py-4 sm:px-4 text-right">
                <span className="font-mono text-sm font-bold text-gray-700">{item.weightScore}</span>
              </td>
              <td className="px-3 py-4 sm:px-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {item.recommendDate}
                </div>
              </td>
              <td className="px-3 py-4 sm:px-4 text-sm text-gray-400">{item.updateTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination 
        total={data.length} 
        pageSize={pageSize} 
        currentPage={currentPage} 
        onPageChange={onPageChange} 
        onPageSizeChange={onPageSizeChange}
        pageSizes={[15, 50, 100, 500, 1000]}
      />
    </div>
  );
}

function DramaRecommendationTable({ data, currentPage, pageSize, onPageChange, onPageSizeChange, getRule }: { 
  data: DramaRecommendation[], 
  currentPage: number, 
  pageSize: number, 
  onPageChange: (page: number) => void,
  onPageSizeChange: (size: number) => void,
  getRule: (field: string) => string
}) {
  const rtc = useResizableTableColumns('app-drama-recommendation', APP_DRAMA_REC_COL_DEFAULTS);
  if (data.length === 0) return <EmptyState />;
  
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table
        className="app-data-table app-data-table--resizable w-full min-w-0 border-collapse text-left"
        style={{ minWidth: rtc.tableMinWidth }}
      >
        {rtc.colGroup}
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <TableHeader label="所属分类" rule={getRule('category')} resizeHandle={rtc.renderResizeHandle(0)} />
            <TableHeader label="任务ID" rule={getRule('taskId')} resizeHandle={rtc.renderResizeHandle(1)} />
            <TableHeader label="任务名称" rule={getRule('taskName')} resizeHandle={rtc.renderResizeHandle(2)} />
            <TableHeader label="任务来源" rule={getRule('taskSource')} resizeHandle={rtc.renderResizeHandle(3)} />
            <TableHeader label="项目名称" rule={getRule('projectName')} resizeHandle={rtc.renderResizeHandle(4)} />
            <TableHeader
              label="今日预估收益"
              rule={getRule('todayEstimatedEarnings')}
              align="right"
              resizeHandle={rtc.renderResizeHandle(5)}
            />
            <TableHeader label="热门/上新" rule="剧作推荐状态标识" resizeHandle={rtc.renderResizeHandle(6)} />
            <TableHeader
              label="加权分值"
              rule={getRule('weightScore')}
              align="right"
              resizeHandle={rtc.renderResizeHandle(7)}
            />
            <TableHeader label="更新时间" rule={getRule('updateTime')} resizeHandle={rtc.renderResizeHandle(8)} />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {paginatedData.map((item) => (
            <tr key={item.taskId} className="group hover:bg-gray-50 transition-colors">
              <td className="px-3 py-4 sm:px-4">
                <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">{item.category}</span>
              </td>
              <td className="px-3 py-4 sm:px-4 font-mono text-sm text-gray-500">{item.taskId}</td>
              <td className="px-3 py-4 sm:px-4 font-bold text-sm text-ink">{item.taskName}</td>
              <td className="px-3 py-4 sm:px-4 text-sm text-gray-600">{item.taskSource}</td>
              <td className="px-3 py-4 sm:px-4 text-sm text-gray-600">{item.projectName}</td>
              <td className="px-3 py-4 sm:px-4 font-mono text-sm text-right text-accent font-bold">¥{item.todayEstimatedEarnings.toLocaleString()}</td>
              <td className="px-3 py-4 sm:px-4">
                <div className="flex gap-1">
                  {item.isHot && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-[9px] font-bold">HOT</span>}
                  {item.isNew && <span className="px-1.5 py-0.5 bg-green-100 text-green-600 rounded text-[9px] font-bold">NEW</span>}
                </div>
              </td>
              <td className="px-3 py-4 sm:px-4 text-right">
                <span className="font-mono text-sm font-bold text-gray-700">{item.weightScore}</span>
              </td>
              <td className="px-3 py-4 sm:px-4 text-sm text-gray-400">{item.updateTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination 
        total={data.length} 
        pageSize={pageSize} 
        currentPage={currentPage} 
        onPageChange={onPageChange} 
        onPageSizeChange={onPageSizeChange}
        pageSizes={[15, 50, 100, 500, 1000]}
      />
    </div>
  );
}

function AcademyImageUploadField({
  label,
  value,
  onChange,
  hint,
}: {
  label: ReactNode;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (value.startsWith('blob:')) URL.revokeObjectURL(value);
    onChange(URL.createObjectURL(file));
  };
  const clear = () => {
    if (value.startsWith('blob:')) URL.revokeObjectURL(value);
    onChange('');
  };
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1 text-sm font-medium text-gray-700">{label}</label>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={pick} />
      <div className="flex flex-wrap items-start gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-gray-50">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">未上传</div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <ImagePlus className="h-4 w-4 text-accent" />
            上传图片
          </button>
          {value ? (
            <button
              type="button"
              onClick={clear}
              className="text-left text-xs text-red-600 hover:underline"
            >
              清除
            </button>
          ) : null}
        </div>
      </div>
      {hint ? <p className="text-[10px] text-gray-400">{hint}</p> : null}
    </div>
  );
}

function AcademyVideoUploadField({
  label,
  value,
  onChange,
  hint,
}: {
  label: ReactNode;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (value.startsWith('blob:')) URL.revokeObjectURL(value);
    onChange(URL.createObjectURL(file));
  };
  const clear = () => {
    if (value.startsWith('blob:')) URL.revokeObjectURL(value);
    onChange('');
  };
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1 text-sm font-medium text-gray-700">{label}</label>
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={pick} />
      <div className="flex flex-col gap-3">
        <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-xl border border-line bg-gray-950">
          {value ? (
            <video src={value} controls playsInline className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full min-h-[120px] w-full items-center justify-center text-xs text-gray-500">
              未上传视频
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <Film className="h-4 w-4 text-accent" />
            上传视频
          </button>
          {value ? (
            <button
              type="button"
              onClick={clear}
              className="w-fit text-left text-xs text-red-600 hover:underline"
            >
              清除
            </button>
          ) : null}
        </div>
      </div>
      {hint ? <p className="text-[10px] text-gray-400">{hint}</p> : null}
    </div>
  );
}

function academyBatchMockOutcomeLabel(o: AcademyBatchVideoRow['mockOutcome']) {
  if (o === 'success') return '（演示：成功）';
  if (o === 'failed') return '（演示：失败）';
  if (o === 'uploading') return '（演示：模拟上传中）';
  return '';
}

/** 批量上传抽屉内固定三条状态示例，不依赖本机选文件 */
function AcademyBatchStaticStatusMocks() {
  return (
    <div className="space-y-2 border-t border-line/70 pt-4">
      <p className="text-xs font-medium text-gray-500">上传状态示例（静态 mock）</p>
      <div className="space-y-2">
        <div className="rounded-xl border border-line bg-white p-3 shadow-sm">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">示例_模拟上传中.mp4</p>
            <p className="mt-0.5 text-[11px] text-gray-400">12.40 MB</p>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-accent">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              模拟上传中 68%
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-[68%] rounded-full bg-accent" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-line bg-white p-3 shadow-sm">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">示例_成功.mp4</p>
            <p className="mt-0.5 text-[11px] text-gray-400">8.02 MB</p>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2 text-xs font-medium text-green-600">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              成功
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-line bg-white p-3 shadow-sm">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">示例_失败.mp4</p>
            <p className="mt-0.5 text-[11px] text-gray-400">15.00 MB</p>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              失败
            </div>
            <p className="text-[11px] leading-snug text-red-500/90">演示：网络超时，请重试</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AcademyBatchVideoRowCard({
  row,
  onRemove,
}: {
  row: AcademyBatchVideoRow;
  onRemove: () => void;
}) {
  const mb = (row.file.size / (1024 * 1024)).toFixed(2);
  const suffix = academyBatchMockOutcomeLabel(row.mockOutcome);
  return (
    <div className="rounded-xl border border-line bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">
            {row.file.name}
            {suffix ? <span className="text-gray-500">{suffix}</span> : null}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-400">{mb} MB</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-lg px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100"
        >
          移除
        </button>
      </div>
      <div className="mt-3 space-y-1.5">
        {row.status === 'queued' && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" />
            等待上传…
          </div>
        )}
        {row.status === 'uploading' && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-accent">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {row.mockOutcome === 'uploading' ? '模拟上传中' : '上传中'} {row.progress}%
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-200"
                style={{ width: `${row.progress}%` }}
              />
            </div>
          </div>
        )}
        {row.status === 'success' && (
          <div className="flex items-center gap-2 text-xs font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            成功
          </div>
        )}
        {row.status === 'failed' && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              失败
            </div>
            {row.errorMessage ? (
              <p className="text-[11px] leading-snug text-red-500/90">{row.errorMessage}</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

type AcademyCategoryRow = AcademyCategory & { contentCount: number };

function AcademyCategoryTable({
  data,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  getRule,
  onEdit,
  onDelete,
}: {
  data: AcademyCategoryRow[];
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  getRule: (field: string) => string;
  onEdit: (row: AcademyCategoryRow) => void;
  onDelete: (row: AcademyCategoryRow) => void;
}) {
  const rtc = useResizableTableColumns('app-academy-category', APP_ACAD_CAT_COL_DEFAULTS);
  if (data.length === 0) return <EmptyState />;

  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const kingkongLabel = (k: AcademyCategory['kingkong']) => (k === 'yes' ? '是' : '否');

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table
        className="app-data-table app-data-table--resizable w-full min-w-0 border-collapse text-left"
        style={{ minWidth: rtc.tableMinWidth }}
      >
        {rtc.colGroup}
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <TableHeader label="ID" rule={getRule('seqId')} align="right" resizeHandle={rtc.renderResizeHandle(0)} />
            <TableHeader label="分类名称" rule={getRule('name')} resizeHandle={rtc.renderResizeHandle(1)} />
            <TableHeader label="金刚区" rule={getRule('kingkong')} resizeHandle={rtc.renderResizeHandle(2)} />
            <TableHeader label="icon" rule={getRule('icon')} resizeHandle={rtc.renderResizeHandle(3)} />
            <TableHeader label="排序" rule={getRule('sort')} align="right" resizeHandle={rtc.renderResizeHandle(4)} />
            <TableHeader label="状态" rule={getRule('status')} resizeHandle={rtc.renderResizeHandle(5)} />
            <TableHeader
              label="内容数"
              rule={getRule('contentCount')}
              align="right"
              resizeHandle={rtc.renderResizeHandle(6)}
            />
            <TableHeader label="更新时间" rule={getRule('updateTime')} resizeHandle={rtc.renderResizeHandle(7)} />
            <th className={tableHeadAction}>
              操作
              {rtc.renderResizeHandle(8)}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {paginatedData.map((item) => (
            <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
              <td className="px-3 py-4 sm:px-4 text-right font-mono text-sm text-gray-500">{item.seq}</td>
              <td className="px-3 py-4 sm:px-4 font-bold text-sm text-ink">{item.name}</td>
              <td className="px-3 py-4 sm:px-4 text-sm text-gray-600">{kingkongLabel(item.kingkong)}</td>
              <td className="px-3 py-4 sm:px-4">
                {item.icon ? (
                  <img
                    src={item.icon}
                    alt=""
                    className="h-9 w-9 rounded-lg border border-line object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-gray-300 text-sm">-</span>
                )}
              </td>
              <td className="px-3 py-4 sm:px-4 text-right font-mono text-sm text-gray-600">{item.sort}</td>
              <td className="px-3 py-4 sm:px-4">
                <span
                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                    item.status === 'show' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {item.status === 'show' ? '显示' : '隐藏'}
                </span>
              </td>
              <td className="px-3 py-4 sm:px-4 text-right font-mono text-sm text-gray-700">{item.contentCount}</td>
              <td className="px-3 py-4 sm:px-4 text-sm text-gray-400">{item.updateTime}</td>
              <td className={tableCellAction}>
                <div className="inline-flex gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="p-1.5 text-accent hover:bg-accent/5 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        total={data.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizes={[15, 50, 100, 500, 1000]}
      />
    </div>
  );
}

function AcademyContentTable({
  data,
  categories,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  getRule,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  onPreview,
}: {
  data: AcademyContent[];
  categories: AcademyCategory[];
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  getRule: (field: string) => string;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit: (row: AcademyContent) => void;
  onDelete: (row: AcademyContent) => void;
  onPreview: (p: { title: string; contentType: AcademyContent['contentType']; content: string }) => void;
}) {
  const rtc = useResizableTableColumns('app-academy-content', APP_ACAD_CONTENT_COL_DEFAULTS);
  if (data.length === 0) return <EmptyState />;

  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageIds = paginatedData.map((r) => r.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  const toggleAllPage = () => {
    if (allPageSelected) {
      onSelectionChange(selectedIds.filter((id) => !pageIds.includes(id)));
    } else {
      const set = new Set([...selectedIds, ...pageIds]);
      onSelectionChange([...set]);
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const contentSnippet = (row: AcademyContent) => {
    const raw = row.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return raw.length > 36 ? `${raw.slice(0, 36)}…` : raw || '—';
  };

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table
        className="app-data-table app-data-table--resizable w-full min-w-0 border-collapse text-left"
        style={{ minWidth: rtc.tableMinWidth }}
      >
        {rtc.colGroup}
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <th className={`${tableHeadClass} relative w-10`}>
              <input
                type="checkbox"
                className="accent-accent rounded border-line"
                checked={allPageSelected}
                onChange={toggleAllPage}
                aria-label="全选本页"
              />
              {rtc.renderResizeHandle(0)}
            </th>
            <TableHeader label="ID" rule={getRule('seqId')} align="right" resizeHandle={rtc.renderResizeHandle(1)} />
            <TableHeader label="所属右豹ID" rule={getRule('youbaoId')} resizeHandle={rtc.renderResizeHandle(2)} />
            <TableHeader label="封面" rule={getRule('cover')} resizeHandle={rtc.renderResizeHandle(3)} />
            <TableHeader label="标题" rule={getRule('title')} resizeHandle={rtc.renderResizeHandle(4)} />
            <TableHeader label="标签" rule={getRule('tag')} resizeHandle={rtc.renderResizeHandle(5)} />
            <TableHeader label="所属分类" rule={getRule('categoryId')} resizeHandle={rtc.renderResizeHandle(6)} />
            <TableHeader
              label="关联项目"
              rule={`${getRule('projectName')}；${getRule('projectId')}`}
              resizeHandle={rtc.renderResizeHandle(7)}
            />
            <TableHeader label="内容类型" rule={getRule('contentType')} resizeHandle={rtc.renderResizeHandle(8)} />
            <TableHeader label="内容" rule={getRule('content')} resizeHandle={rtc.renderResizeHandle(9)} />
            <TableHeader label="状态" rule={getRule('status')} resizeHandle={rtc.renderResizeHandle(10)} />
            <TableHeader label="更新时间" rule={getRule('updateTime')} resizeHandle={rtc.renderResizeHandle(11)} />
            <th className={tableHeadAction}>
              操作
              {rtc.renderResizeHandle(12)}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {paginatedData.map((item) => (
            <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
              <td className="px-3 py-4 sm:px-4">
                <input
                  type="checkbox"
                  className="accent-accent rounded border-line"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleOne(item.id)}
                  aria-label="选择行"
                />
              </td>
              <td className="px-3 py-4 sm:px-4 text-right font-mono text-sm text-gray-500">{item.seq}</td>
              <td className="px-3 py-4 sm:px-4 font-mono text-xs text-gray-600">{item.youbaoId}</td>
              <td className="px-3 py-4 sm:px-4">
                <img
                  src={item.cover}
                  alt=""
                  className="h-10 w-14 rounded border border-line object-cover"
                  referrerPolicy="no-referrer"
                />
              </td>
              <td className="px-3 py-4 sm:px-4 max-w-[140px]">
                <span className="line-clamp-2 text-sm font-medium text-ink">{item.title}</span>
              </td>
              <td className="px-3 py-4 sm:px-4">
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                    item.tag === 'hot' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {item.tag === 'hot' ? '热门' : '推荐'}
                </span>
              </td>
              <td className="px-3 py-4 sm:px-4 text-sm text-gray-600">{catName(item.categoryId)}</td>
              <td className="px-3 py-4 sm:px-4 text-sm text-gray-600">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-ink">{item.projectName || '—'}</span>
                  <span className="font-mono text-[10px] text-gray-400">{item.projectId || '—'}</span>
                </div>
              </td>
              <td className="px-3 py-4 sm:px-4">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                  {item.contentType === 'article' ? '图文' : '视频'}
                </span>
              </td>
              <td className="px-3 py-4 sm:px-4 max-w-[200px]">
                <div className="group/cell relative">
                  <span className="cursor-default text-xs text-gray-500">{contentSnippet(item)}</span>
                  <div className="pointer-events-none absolute left-0 top-full z-[55] mt-2 max-h-48 w-72 overflow-auto rounded-lg border border-line bg-gray-900 px-3 py-2 text-left text-[11px] leading-relaxed text-white opacity-0 shadow-xl transition-opacity group-hover/cell:pointer-events-auto group-hover/cell:opacity-100">
                    <div className="mb-1 font-semibold text-blue-300">
                      {item.contentType === 'video' ? '视频地址' : '图文摘要'}
                    </div>
                    {item.contentType === 'video' ? (
                      <span className="break-all font-mono">{item.content}</span>
                    ) : (
                      <span className="whitespace-pre-wrap break-words">{item.content.replace(/<[^>]+>/g, '')}</span>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-3 py-4 sm:px-4">
                <span
                  className={`rounded px-2 py-1 text-[10px] font-bold ${
                    item.status === 'show' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {item.status === 'show' ? '显示' : '隐藏'}
                </span>
              </td>
              <td className="px-3 py-4 sm:px-4 text-sm text-gray-400">{item.updateTime}</td>
              <td className={tableCellAction}>
                <div className="inline-flex flex-wrap justify-end gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      onPreview({
                        title: item.title,
                        contentType: item.contentType,
                        content: item.content,
                      })
                    }
                    className="flex items-center gap-0.5 rounded p-1.5 text-gray-500 hover:bg-gray-100"
                    title="查看内容"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="p-1.5 text-accent hover:bg-accent/5 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        total={data.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizes={[15, 50, 100, 500, 1000]}
      />
    </div>
  );
}

function DramaCategoryTable({ data, currentPage, pageSize, onPageChange, onPageSizeChange, getRule, onEdit }: { 
  data: DramaCategory[], 
  currentPage: number, 
  pageSize: number, 
  onPageChange: (page: number) => void,
  onPageSizeChange: (size: number) => void,
  getRule: (field: string) => string,
  onEdit: (category: DramaCategory) => void
}) {
  const rtc = useResizableTableColumns('app-drama-category', APP_DRAMA_CAT_COL_DEFAULTS);
  if (data.length === 0) return <EmptyState />;

  const taskTypeMap: Record<string, string> = {
    novel: '小说',
    drama: '短剧',
    comic: '漫剧',
    game: '游戏'
  };

  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table
        className="app-data-table app-data-table--resizable w-full min-w-0 border-collapse text-left"
        style={{ minWidth: rtc.tableMinWidth }}
      >
        {rtc.colGroup}
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <TableHeader label="分类名称" rule={getRule('name')} resizeHandle={rtc.renderResizeHandle(0)} />
            <TableHeader label="任务类型" rule={getRule('taskType')} resizeHandle={rtc.renderResizeHandle(1)} />
            <TableHeader label="关联业务" rule={getRule('relatedBusiness')} resizeHandle={rtc.renderResizeHandle(2)} />
            <TableHeader label="状态" rule={getRule('status')} resizeHandle={rtc.renderResizeHandle(3)} />
            <TableHeader
              label="分类排序"
              rule={getRule('sort')}
              align="right"
              resizeHandle={rtc.renderResizeHandle(4)}
            />
            <TableHeader label="更新时间" rule={getRule('updateTime')} resizeHandle={rtc.renderResizeHandle(5)} />
            <th className={tableHeadAction}>
              操作
              {rtc.renderResizeHandle(6)}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {paginatedData.map((item) => (
            <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
              <td className="px-3 py-4 sm:px-4 font-bold text-sm text-ink">{item.name}</td>
              <td className="px-3 py-4 sm:px-4">
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">
                  {taskTypeMap[item.taskType] || item.taskType}
                </span>
              </td>
              <td className="px-3 py-4 sm:px-4">
                <div className="flex flex-wrap gap-1">
                  {item.relatedBusiness.map(biz => (
                    <span key={biz} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-medium">
                      {biz}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-3 py-4 sm:px-4">
                <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                  item.status === 'show' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {item.status === 'show' ? '显示' : '隐藏'}
                </span>
              </td>
              <td className="px-3 py-4 sm:px-4 text-right font-mono text-sm text-gray-600 font-medium">{item.sort}</td>
              <td className="px-3 py-4 sm:px-4 text-sm text-gray-400">{item.updateTime}</td>
              <td className={tableCellAction}>
                <button 
                  onClick={() => onEdit(item)}
                  className="p-1.5 text-accent hover:bg-accent/5 rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination 
        total={data.length} 
        pageSize={pageSize} 
        currentPage={currentPage} 
        onPageChange={onPageChange} 
        onPageSizeChange={onPageSizeChange}
        pageSizes={[15, 50, 100, 500, 1000]}
      />
    </div>
  );
}

function FieldConfigTable({ 
  data, 
  currentPage, 
  pageSize, 
  onPageChange,
  onPageSizeChange,
  editingId,
  editValue,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel
}: { 
  data: FieldConfiguration[], 
  currentPage: number, 
  pageSize: number, 
  onPageChange: (page: number) => void,
  onPageSizeChange: (size: number) => void,
  editingId: string | null,
  editValue: string,
  onEditStart: (id: string, val: string) => void,
  onEditChange: (val: string) => void,
  onEditSave: (id: string) => void,
  onEditCancel: () => void
}) {
  const rtc = useResizableTableColumns('app-field-config', APP_FIELD_CFG_COL_DEFAULTS);
  if (data.length === 0) return <EmptyState />;
  
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table
        className="app-data-table app-data-table--resizable w-full min-w-0 border-collapse text-left"
        style={{ minWidth: rtc.tableMinWidth }}
      >
        {rtc.colGroup}
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <th className={`${tableHeadClass} relative`}>
              菜单名称
              {rtc.renderResizeHandle(0)}
            </th>
            <th className={`${tableHeadClass} relative`}>
              路由键
              {rtc.renderResizeHandle(1)}
            </th>
            <th className={`${tableHeadClass} relative`}>
              字段中文名
              {rtc.renderResizeHandle(2)}
            </th>
            <th className={`${tableHeadClass} relative`}>
              字段英文名
              {rtc.renderResizeHandle(3)}
            </th>
            <th className={`${tableHeadClass} relative`}>
              字段说明
              {rtc.renderResizeHandle(4)}
            </th>
            <th className={tableHeadAction}>
              操作
              {rtc.renderResizeHandle(5)}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {paginatedData.map((item) => (
            <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
              <td className="px-3 py-4 sm:px-4 align-top text-sm font-bold text-ink">{item.menuName}</td>
              <td className="px-3 py-4 sm:px-4 align-top font-mono text-sm text-gray-500">{item.routeKey}</td>
              <td className="px-3 py-4 sm:px-4 align-top text-sm font-medium text-gray-700">{item.fieldCnName}</td>
              <td className="px-3 py-4 sm:px-4 align-top font-mono text-sm text-gray-400 break-words">{item.fieldEnName}</td>
              <td className="px-3 py-4 sm:px-4 align-top">
                {editingId === item.id ? (
                  <input 
                    type="text" 
                    className="w-full min-w-0 max-w-full px-3 py-1.5 border border-accent rounded text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                    value={editValue}
                    onChange={(e) => onEditChange(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <span className="text-sm text-gray-600 whitespace-normal break-words [overflow-wrap:anywhere]">{item.description}</span>
                )}
              </td>
              <td className={tableCellActionTop}>
                {editingId === item.id ? (
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onEditSave(item.id)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={onEditCancel}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => onEditStart(item.id, item.description)}
                    className="p-1.5 text-accent hover:bg-accent/5 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination 
        total={data.length} 
        pageSize={pageSize} 
        currentPage={currentPage} 
        onPageChange={onPageChange} 
        onPageSizeChange={onPageSizeChange}
        pageSizes={[15, 50, 100, 500, 1000]}
      />
    </div>
  );
}


function EmptyState() {
  return (
    <div className="p-20 flex flex-col items-center justify-center text-gray-400">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
        <Search className="w-8 h-8 opacity-20" />
      </div>
      <p className="text-sm font-medium">暂无匹配数据</p>
      <p className="text-xs mt-1">请尝试调整搜索关键词或筛选条件</p>
    </div>
  );
}
