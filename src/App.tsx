import {
  useState,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  type ChangeEvent,
  type CSSProperties,
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
  ChevronLeft,
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
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  AlertCircle
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

/** 仅保存「字段说明」覆盖，结构始终以 mockData 为准，避免升级或校验丢弃本地说明 */
const FIELD_CONFIG_DESCRIPTION_OVERRIDES_KEY = 'ybdiedai-field-config-description-overrides';
/** 历史整表 JSON（仍可读并迁移出说明） */
const FIELD_CONFIG_LEGACY_FULL_KEY = 'ybdiedai-field-configurations';

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
  try {
    const direct = localStorage.getItem(FIELD_CONFIG_DESCRIPTION_OVERRIDES_KEY);
    if (direct) {
      const parsed = JSON.parse(direct) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const out: Record<string, string> = {};
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
          if (typeof v === 'string') out[k] = v;
        }
        if (Object.keys(out).length > 0) return out;
      }
    }
    const legacy = localStorage.getItem(FIELD_CONFIG_LEGACY_FULL_KEY);
    if (legacy) {
      const migrated = migrateLegacyFullArrayToDescriptionOverrides(legacy);
      if (migrated) {
        try {
          localStorage.setItem(FIELD_CONFIG_DESCRIPTION_OVERRIDES_KEY, JSON.stringify(migrated));
        } catch {
          /* ignore */
        }
        return migrated;
      }
    }
  } catch {
    /* ignore */
  }
  return {};
}

function compactOverridesForWorkspace(overrides: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [id, text] of Object.entries(overrides)) {
    if (!/^f\d+$/.test(id)) continue;
    const def = fieldConfigurationDescriptionDefaults[id];
    if (def !== undefined && text !== def) out[id] = text;
  }
  return out;
}

function persistDescriptionOverrides(overrides: Record<string, string>) {
  try {
    localStorage.setItem(FIELD_CONFIG_DESCRIPTION_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    /* ignore quota / private mode */
  }
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

type ModuleType = 'leaderboard' | 'recommendation' | 'academy' | 'config';
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
  | { variant: 'academy-content'; editingId: string | null; form: AcademyContentFormState };

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
  };
}

const textFieldInputClass =
  'min-w-[120px] max-w-[200px] px-3 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 shadow-sm';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>('leaderboard');
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

  const [sideDrawer, setSideDrawer] = useState<SideDrawerState | null>(null);
  const isDrawerOpen = sideDrawer !== null;

  const [academyCategories, setAcademyCategories] = useState<AcademyCategory[]>(() => [...academyCategoryInitialData]);
  const [academyContents, setAcademyContents] = useState<AcademyContent[]>(() => [...academyContentInitialData]);
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

  const modules = [
    { id: 'leaderboard', name: '榜单数据', icon: BarChart3 },
    { id: 'recommendation', name: '首页推荐', icon: Home },
    { id: 'academy', name: '学院管理', icon: GraduationCap },
    { id: 'config', name: '字段配置', icon: Settings },
  ];

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
      const matchesSearch =
        (!qm || item.menuName.toLowerCase().includes(qm)) &&
        (!qr || item.routeKey.toLowerCase().includes(qr)) &&
        (!qc || item.fieldCnName.toLowerCase().includes(qc)) &&
        (!qe || item.fieldEnName.toLowerCase().includes(qe));
      return matchesSearch;
    });
  }, [textSearchApplied.config, fieldConfigs]);

  const applyTextSearch = () => {
    setTextSearchApplied(structuredClone(textSearchDraft));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    const empty = createEmptyTextSearch();
    setTextSearchDraft(empty);
    setTextSearchApplied(empty);
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
    setCurrentPage(1);
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
    <div className="flex min-h-screen bg-bg">
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
      <aside className="w-64 bg-white border-r border-line flex flex-col sticky top-0 h-screen z-30">
        <div className="p-6 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">右豹后台迭代</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {modules.map((mod) => {
            const Icon = mod.icon;
            const isActive = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => {
                  setActiveModule(mod.id as ModuleType);
                  resetFilters();
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group cursor-pointer
                  ${isActive ? 'bg-accent/5 text-accent' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-accent' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  {mod.name}
                </div>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-line">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs">
                AD
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-medium text-gray-900 truncate">Admin User</p>
                <p className="text-[10px] text-gray-500 truncate">renataluoy@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 md:px-5 md:py-5 lg:px-6">
        <div className="mx-auto w-full max-w-none">
          {/* Header */}
          <header className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-ink mb-2">
                {activeModule === 'leaderboard'
                  ? '榜单数据'
                  : activeModule === 'recommendation'
                    ? '首页推荐'
                    : activeModule === 'academy'
                      ? '学院管理'
                      : '字段配置'}
              </h1>
              <p className="text-gray-500 text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-accent" />
                {activeModule === 'leaderboard'
                  ? '实时监控各项业务收益与社群表现'
                  : activeModule === 'recommendation'
                    ? '管理首页品牌与剧作推荐内容'
                    : activeModule === 'academy'
                      ? '配置商学院分类与图文/视频内容，支撑前台学院模块展示'
                      : '配置各业务模块数据表的字段规则与说明'}
              </p>
            </div>

            {activeModule === 'config' && (
              <div className="flex w-full max-w-full flex-wrap items-end gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-sm">
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
                      setTextSearchDraft((d) => ({ ...d, config: { ...d.config, fieldCnName: e.target.value } }))
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
                      setTextSearchDraft((d) => ({ ...d, config: { ...d.config, fieldEnName: e.target.value } }))
                    }
                    onKeyDown={(e) => e.key === 'Enter' && applyTextSearch()}
                    className={textFieldInputClass}
                    placeholder="field_key"
                  />
                </label>
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
            )}
          </header>

          {/* Tabs */}
          {activeModule !== 'config' && (
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
              key={`${activeModule}-${leaderboardTab}-${recommendationTab}-${academyTab}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-line rounded-2xl shadow-sm"
            >
              {activeModule !== 'config' && (
                <div className="border-b border-line">
                  <div className="flex flex-wrap items-end gap-3 px-4 py-3 lg:px-5">
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
                    (activeModule === 'recommendation' && recommendationTab === 'category')) && (
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
                    </div>
                  )}
                </div>
              )}
              {activeModule === 'leaderboard' ? (
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
              ) : (
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
              className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-50 flex flex-col ${
                sideDrawer.variant === 'academy-content' ? 'w-[min(100vw,480px)]' : 'w-[min(100vw,400px)]'
              }`}
            >
              <div className="p-6 border-b border-line flex items-center justify-between shrink-0">
                <h2 className="text-lg font-bold">
                  {sideDrawer.variant === 'drama-category' &&
                    (sideDrawer.editingId ? '编辑剧作分类' : '新增剧作分类')}
                  {sideDrawer.variant === 'academy-category' &&
                    (sideDrawer.editingId ? '编辑商学院分类' : '新增商学院分类')}
                  {sideDrawer.variant === 'academy-content' &&
                    (sideDrawer.editingId ? '编辑商学院内容' : '新增商学院内容')}
                </h2>
                <button
                  type="button"
                  onClick={() => setSideDrawer(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                          <AcademyRichTextEditor
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
              </div>

              <div className="p-6 border-t border-line flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSideDrawer(null)}
                  className="flex-1 px-4 py-2 border border-line rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!sideDrawer) return;
                    const ts = new Date().toLocaleString();
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
                  className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium shadow-sm"
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
  'px-3 py-3.5 text-left text-[14px] font-bold text-gray-900 font-sans tracking-tight align-middle whitespace-nowrap sm:px-4';
const tableHeadClassRight = `${tableHeadClass} text-right`;

/** 表尾「操作」列：横向滚动时固定在可视区域右侧 */
const tableHeadAction =
  'sticky right-0 z-30 border-l border-line bg-gray-50/95 px-3 py-3.5 text-right text-[14px] font-bold text-gray-900 font-sans tracking-tight align-middle whitespace-nowrap shadow-[-10px_0_20px_-8px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:px-4';
const tableCellActionBase =
  'sticky right-0 z-20 border-l border-line bg-white px-3 py-4 text-right shadow-[-10px_0_20px_-8px_rgba(0,0,0,0.08)] group-hover:bg-gray-50 sm:px-4';
const tableCellAction = `${tableCellActionBase} align-middle`;
const tableCellActionTop = `${tableCellActionBase} align-top`;

const TOOLTIP_MAX_PX = 448;

function TableHeader({ label, rule, align = 'left' }: { label: string; rule: string; align?: 'left' | 'right' }) {
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
    <th className={alignRight ? tableHeadClassRight : tableHeadClass}>
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
  if (data.length === 0) return <EmptyState />;
  
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="app-data-table min-w-full w-max text-left">
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <TableHeader label="用户ID" rule={getRule('userId')} />
            <TableHeader label="用户昵称" rule={getRule('nickname')} />
            <TableHeader label="类型" rule={getRule('type')} />
            <TableHeader label="累计收益" rule={getRule('totalEarnings')} align="right" />
            <TableHeader label="统计维度" rule={getRule('dimension')} />
            <TableHeader label="收益最高项目" rule={getRule('topProject')} />
            <TableHeader label="项目收益" rule={getRule('projectEarnings')} align="right" />
            <TableHeader label="更新时间" rule={getRule('updateTime')} />
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
  if (data.length === 0) return <EmptyState />;
  
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="app-data-table min-w-full w-max text-left">
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <TableHeader label="社群名称" rule={getRule('name')} />
            <TableHeader label="社群标签" rule={getRule('tags')} />
            <TableHeader label="累计收益" rule={getRule('totalEarnings')} align="right" />
            <TableHeader label="统计维度" rule={getRule('dimension')} />
            <TableHeader label="更新时间" rule={getRule('updateTime')} />
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
  if (data.length === 0) return <EmptyState />;
  
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="app-data-table min-w-full w-max text-left">
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <TableHeader label="项目ID" rule={getRule('projectId')} />
            <TableHeader label="项目名称" rule={getRule('projectName')} />
            <TableHeader label="项目类型" rule={getRule('projectType')} />
            <TableHeader label="项目总收益" rule={getRule('totalEarnings')} align="right" />
            <TableHeader label="昨日收益" rule={getRule('yesterdayEarnings')} align="right" />
            <TableHeader label="昨日题词数量" rule={getRule('yesterdayApprovedKeywords')} align="right" />
            <TableHeader label="热门/上新" rule="项目推荐状态标识" />
            <TableHeader label="加权分值" rule={getRule('weightScore')} align="right" />
            <TableHeader label="推荐日期" rule={getRule('recommendDate')} />
            <TableHeader label="更新时间" rule={getRule('updateTime')} />
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
  if (data.length === 0) return <EmptyState />;
  
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="app-data-table min-w-full w-max text-left">
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <TableHeader label="所属分类" rule={getRule('category')} />
            <TableHeader label="任务ID" rule={getRule('taskId')} />
            <TableHeader label="任务名称" rule={getRule('taskName')} />
            <TableHeader label="任务来源" rule={getRule('taskSource')} />
            <TableHeader label="项目名称" rule={getRule('projectName')} />
            <TableHeader label="今日预估收益" rule={getRule('todayEstimatedEarnings')} align="right" />
            <TableHeader label="热门/上新" rule="剧作推荐状态标识" />
            <TableHeader label="加权分值" rule={getRule('weightScore')} align="right" />
            <TableHeader label="更新时间" rule={getRule('updateTime')} />
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

function AcademyRichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const skipEmit = useRef(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    const next = value || '<p><br></p>';
    if (el.innerHTML === next) return;
    skipEmit.current = true;
    el.innerHTML = next;
    skipEmit.current = false;
  }, [value]);

  const emit = () => {
    const el = ref.current;
    if (!el || skipEmit.current) return;
    onChange(el.innerHTML);
  };

  const run = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  const addLink = () => {
    const url = window.prompt('请输入链接地址（含 http/https）');
    if (!url) return;
    run('createLink', url);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="flex flex-wrap gap-1 border-b border-line bg-gray-50 px-2 py-1.5">
        <button
          type="button"
          title="加粗"
          onClick={() => run('bold')}
          className="rounded-md p-1.5 text-gray-600 hover:bg-white hover:text-ink"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="斜体"
          onClick={() => run('italic')}
          className="rounded-md p-1.5 text-gray-600 hover:bg-white hover:text-ink"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="无序列表"
          onClick={() => run('insertUnorderedList')}
          className="rounded-md p-1.5 text-gray-600 hover:bg-white hover:text-ink"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="插入链接"
          onClick={addLink}
          className="rounded-md p-1.5 text-gray-600 hover:bg-white hover:text-ink"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={ref}
        className="prose prose-sm min-h-[200px] max-h-[320px] max-w-none overflow-y-auto px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-accent/15 focus:ring-inset"
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
      />
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
  if (data.length === 0) return <EmptyState />;

  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const kingkongLabel = (k: AcademyCategory['kingkong']) => (k === 'yes' ? '是' : '否');

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="app-data-table min-w-full w-max text-left">
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <TableHeader label="ID" rule={getRule('seqId')} align="right" />
            <TableHeader label="分类名称" rule={getRule('name')} />
            <TableHeader label="金刚区" rule={getRule('kingkong')} />
            <TableHeader label="icon" rule={getRule('icon')} />
            <TableHeader label="排序" rule={getRule('sort')} align="right" />
            <TableHeader label="状态" rule={getRule('status')} />
            <TableHeader label="内容数" rule={getRule('contentCount')} align="right" />
            <TableHeader label="更新时间" rule={getRule('updateTime')} />
            <th className={tableHeadAction}>操作</th>
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
      <table className="app-data-table min-w-full w-max text-left">
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <th className={`${tableHeadClass} w-10`}>
              <input
                type="checkbox"
                className="accent-accent rounded border-line"
                checked={allPageSelected}
                onChange={toggleAllPage}
                aria-label="全选本页"
              />
            </th>
            <TableHeader label="ID" rule={getRule('seqId')} align="right" />
            <TableHeader label="所属右豹ID" rule={getRule('youbaoId')} />
            <TableHeader label="封面" rule={getRule('cover')} />
            <TableHeader label="标题" rule={getRule('title')} />
            <TableHeader label="标签" rule={getRule('tag')} />
            <TableHeader label="所属分类" rule={getRule('categoryId')} />
            <TableHeader
              label="关联项目"
              rule={`${getRule('projectName')}；${getRule('projectId')}`}
            />
            <TableHeader label="内容类型" rule={getRule('contentType')} />
            <TableHeader label="内容" rule={getRule('content')} />
            <TableHeader label="状态" rule={getRule('status')} />
            <TableHeader label="更新时间" rule={getRule('updateTime')} />
            <th className={tableHeadAction}>操作</th>
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
      <table className="app-data-table min-w-full w-max text-left">
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <TableHeader label="分类名称" rule={getRule('name')} />
            <TableHeader label="任务类型" rule={getRule('taskType')} />
            <TableHeader label="关联业务" rule={getRule('relatedBusiness')} />
            <TableHeader label="状态" rule={getRule('status')} />
            <TableHeader label="分类排序" rule={getRule('sort')} align="right" />
            <TableHeader label="更新时间" rule={getRule('updateTime')} />
            <th className={tableHeadAction}>操作</th>
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
  if (data.length === 0) return <EmptyState />;
  
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="app-data-table min-w-full w-max text-left">
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <th className={tableHeadClass}>菜单名称</th>
            <th className={tableHeadClass}>路由键</th>
            <th className={tableHeadClass}>字段中文名</th>
            <th className={tableHeadClass}>字段英文名</th>
            <th className={tableHeadClass}>字段说明</th>
            <th className={tableHeadAction}>操作</th>
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
      />
    </div>
  );
}

function Pagination({ total, pageSize, currentPage, onPageChange, onPageSizeChange }: { 
  total: number, 
  pageSize: number, 
  currentPage: number, 
  onPageChange: (page: number) => void,
  onPageSizeChange: (size: number) => void
}) {
  const totalPages = Math.ceil(total / pageSize);
  
  return (
    <div className="px-3 py-4 sm:px-4 border-t border-line flex items-center justify-between bg-gray-50/30">
      <div className="flex items-center gap-4">
        <p className="text-sm text-gray-600">
          显示 {total === 0 ? 0 : (currentPage - 1) * pageSize + 1} 到 {Math.min(currentPage * pageSize, total)} 条，共 {total} 条
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">每页显示</span>
          <select 
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-sm bg-white border border-line rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent/30 cursor-pointer"
          >
            {[15, 50, 100, 500, 1000].map(size => (
              <option key={size} value={size}>{size} 条</option>
            ))}
          </select>
        </div>
      </div>
      {totalPages >= 1 && (
        <div className="flex items-center gap-1">
          <button 
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-1.5 rounded border border-line bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => onPageChange(i + 1)}
              className={`
                w-8 h-8 rounded text-sm font-medium transition-all
                ${currentPage === i + 1 ? 'bg-accent text-white shadow-sm' : 'bg-white border border-line text-gray-500 hover:bg-gray-50'}
              `}
            >
              {i + 1}
            </button>
          ))}
          <button 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-1.5 rounded border border-line bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
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
