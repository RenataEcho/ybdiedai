import fieldDescriptionOverridesFile from './field-configuration-description-overrides.json';

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  type: 'individual' | 'project';
  totalEarnings: number;
  dimension: '7d' | '30d';
  topProjectId: string | null;
  topProjectName: string | null;
  projectEarnings: number | null;
  updateTime: string;
}

export interface CommunityEntry {
  id: string;
  name: string;
  avatar: string;
  tags: string[];
  totalEarnings: number;
  dimension: '7d' | '30d';
  updateTime: string;
}

export const individualData: LeaderboardEntry[] = [
  {
    id: 'U1001',
    nickname: '张三',
    type: 'individual',
    totalEarnings: 12500.50,
    dimension: '30d',
    topProjectId: null,
    topProjectName: null,
    projectEarnings: null,
    updateTime: '2024-03-20 14:30:00'
  },
  {
    id: 'U1002',
    nickname: '李四',
    type: 'project',
    totalEarnings: 8900.00,
    dimension: '7d',
    topProjectId: 'P501',
    topProjectName: '春季大促',
    projectEarnings: 4500.00,
    updateTime: '2024-03-20 15:00:00'
  },
  {
    id: 'U1003',
    nickname: '王五',
    type: 'individual',
    totalEarnings: 15600.75,
    dimension: '30d',
    topProjectId: null,
    topProjectName: null,
    projectEarnings: null,
    updateTime: '2024-03-20 12:45:00'
  },
  {
    id: 'U1004',
    nickname: '赵六',
    type: 'project',
    totalEarnings: 21000.00,
    dimension: '30d',
    topProjectId: 'P502',
    topProjectName: '新品首发',
    projectEarnings: 12000.00,
    updateTime: '2024-03-20 16:20:00'
  }
];

export const teamData: LeaderboardEntry[] = [
  {
    id: 'T2001',
    nickname: '飞龙队',
    type: 'individual',
    totalEarnings: 55000.00,
    dimension: '30d',
    topProjectId: null,
    topProjectName: null,
    projectEarnings: null,
    updateTime: '2024-03-20 14:00:00'
  },
  {
    id: 'T2002',
    nickname: '猛虎队',
    type: 'project',
    totalEarnings: 42000.00,
    dimension: '7d',
    topProjectId: 'P601',
    topProjectName: '团队挑战赛',
    projectEarnings: 28000.00,
    updateTime: '2024-03-20 15:30:00'
  }
];

export const communityData: CommunityEntry[] = [
  {
    id: 'C3001',
    name: '极客社区',
    avatar: 'https://picsum.photos/seed/geek/100/100',
    tags: ['技术', '极客', '高收益'],
    totalEarnings: 128000.00,
    dimension: '30d',
    updateTime: '2024-03-20 10:00:00'
  },
  {
    id: 'C3002',
    name: '生活家',
    avatar: 'https://picsum.photos/seed/life/100/100',
    tags: ['生活', '分享'],
    totalEarnings: 85000.00,
    dimension: '7d',
    updateTime: '2024-03-20 11:15:00'
  }
];

export interface BrandRecommendation {
  projectId: string;
  projectName: string;
  projectType: 'tweet' | 'drama' | 'resource' | 'game';
  totalEarnings: number;
  yesterdayEarnings: number;
  yesterdayApprovedKeywords: number;
  isHot: boolean;
  isNew: boolean;
  weightScore: number;
  recommendDate: string;
  updateTime: string;
}

export interface DramaCategory {
  id: string;
  name: string;
  taskType: 'novel' | 'drama' | 'comic' | 'game';
  relatedBusiness: string[]; // Changed to string array for multi-select
  status: 'show' | 'hide';
  sort: number;
  updateTime: string;
}

export interface FieldConfiguration {
  id: string;
  menuName: string;
  routeKey: string;
  fieldEnName: string;
  fieldCnName: string;
  description: string;
}

export interface DramaRecommendation {
  category: string;
  taskId: string;
  taskName: string;
  taskSource: string;
  projectName: string;
  todayEstimatedEarnings: number;
  isHot: boolean;
  isNew: boolean;
  weightScore: number;
  updateTime: string;
}

export const brandRecommendationData: BrandRecommendation[] = [
  {
    projectId: 'P7001',
    projectName: '番茄小说',
    projectType: 'tweet',
    totalEarnings: 156000.00,
    yesterdayEarnings: 4500.00,
    yesterdayApprovedKeywords: 120,
    isHot: true,
    isNew: false,
    weightScore: 95,
    recommendDate: '2024-03-20',
    updateTime: '2024-03-20 18:00:00'
  },
  {
    projectId: 'P7002',
    projectName: '知乎会员',
    projectType: 'tweet',
    totalEarnings: 89000.00,
    yesterdayEarnings: 3200.00,
    yesterdayApprovedKeywords: 85,
    isHot: false,
    isNew: true,
    weightScore: 88,
    recommendDate: '2024-03-20',
    updateTime: '2024-03-20 18:15:00'
  },
  {
    projectId: 'P7003',
    projectName: 'capcut拉新',
    projectType: 'resource',
    totalEarnings: 45000.00,
    yesterdayEarnings: 1200.00,
    yesterdayApprovedKeywords: 45,
    isHot: true,
    isNew: true,
    weightScore: 92,
    recommendDate: '2024-03-19',
    updateTime: '2024-03-20 17:30:00'
  }
];

/** 商学院分类（学院管理 - 分类管理） */
export interface AcademyCategory {
  id: string;
  /** 自增展示 ID */
  seq: number;
  name: string;
  /** 金刚区：是 / 否（必选） */
  kingkong: 'yes' | 'no';
  icon: string;
  sort: number;
  status: 'show' | 'hide';
  updateTime: string;
}

/** 学院内容 — 关联品牌项目（接口 mock） */
export interface AcademyBrandProject {
  id: string;
  name: string;
}

export async function fetchAcademyBrandProjects(): Promise<AcademyBrandProject[]> {
  await new Promise((r) => setTimeout(r, 280));
  return [
    { id: 'P-TOMATO', name: '番茄小说' },
    { id: 'P-ZHIHU-STORY', name: '知乎故事' },
    { id: 'P-BAIDU-PAN', name: '百度网盘' },
    { id: 'P-CAPCUT', name: 'CapCut' },
    { id: 'P-JIMENG', name: '即梦' },
  ];
}

/** 商学院内容（学院管理 - 内容配置） */
export interface AcademyContent {
  id: string;
  seq: number;
  /** 所属右豹 ID */
  youbaoId: string;
  cover: string;
  title: string;
  tag: 'hot' | 'recommend';
  categoryId: string;
  projectName: string;
  projectId: string;
  contentType: 'article' | 'video';
  /** 图文为正文摘要或 HTML；视频为播放地址 */
  content: string;
  status: 'show' | 'hide';
  updateTime: string;
}

export const academyCategoryInitialData: AcademyCategory[] = [
  {
    id: 'ac-cat-1',
    seq: 1,
    name: '新手入门',
    kingkong: 'yes',
    icon: 'https://picsum.photos/seed/academy-kk1/48/48',
    sort: 100,
    status: 'show',
    updateTime: '2024-03-21 09:00:00',
  },
  {
    id: 'ac-cat-2',
    seq: 2,
    name: '进阶玩法',
    kingkong: 'no',
    icon: '',
    sort: 80,
    status: 'show',
    updateTime: '2024-03-21 09:30:00',
  },
  {
    id: 'ac-cat-3',
    seq: 3,
    name: '案例精选',
    kingkong: 'no',
    icon: '',
    sort: 60,
    status: 'hide',
    updateTime: '2024-03-21 10:00:00',
  },
];

export const academyContentInitialData: AcademyContent[] = [
  {
    id: 'ac-con-1',
    seq: 1,
    youbaoId: 'YB10001',
    cover: 'https://picsum.photos/seed/academy-c1/120/80',
    title: '右豹商学院：第一课',
    tag: 'hot',
    categoryId: 'ac-cat-1',
    projectName: '番茄小说',
    projectId: 'P-TOMATO',
    contentType: 'article',
    content:
      '<p>欢迎学习右豹商学院课程。本文介绍平台基础操作与收益结算规则，建议新手完整阅读。</p><p>更多内容请在移动端查看完整图文。</p>',
    status: 'show',
    updateTime: '2024-03-21 11:00:00',
  },
  {
    id: 'ac-con-2',
    seq: 2,
    youbaoId: 'YB10002',
    cover: 'https://picsum.photos/seed/academy-c2/120/80',
    title: '短视频带货入门',
    tag: 'recommend',
    categoryId: 'ac-cat-1',
    projectName: 'CapCut',
    projectId: 'P-CAPCUT',
    contentType: 'video',
    content: 'https://example.com/videos/sample-intro.mp4',
    status: 'show',
    updateTime: '2024-03-21 11:15:00',
  },
  {
    id: 'ac-con-3',
    seq: 3,
    youbaoId: 'YB10003',
    cover: 'https://picsum.photos/seed/academy-c3/120/80',
    title: '进阶：矩阵账号运营',
    tag: 'recommend',
    categoryId: 'ac-cat-2',
    projectName: '知乎故事',
    projectId: 'P-ZHIHU-STORY',
    contentType: 'article',
    content: '矩阵账号的核心是内容节奏与账号定位。建议按周规划选题，并同步数据复盘。',
    status: 'show',
    updateTime: '2024-03-21 12:00:00',
  },
  {
    id: 'ac-con-4',
    seq: 4,
    youbaoId: 'YB10004',
    cover: 'https://picsum.photos/seed/academy-c4/120/80',
    title: '案例复盘：单月破万',
    tag: 'hot',
    categoryId: 'ac-cat-2',
    projectName: '即梦',
    projectId: 'P-JIMENG',
    contentType: 'video',
    content: 'https://example.com/videos/case-study.mp4',
    status: 'hide',
    updateTime: '2024-03-21 12:30:00',
  },
  {
    id: 'ac-con-5',
    seq: 5,
    youbaoId: 'YB10005',
    cover: 'https://picsum.photos/seed/academy-c5/120/80',
    title: '隐藏分类下的草稿',
    tag: 'hot',
    categoryId: 'ac-cat-3',
    projectName: '百度网盘',
    projectId: 'P-BAIDU-PAN',
    contentType: 'article',
    content: '该内容所属分类当前为隐藏状态，可用于后台联调与预览。',
    status: 'hide',
    updateTime: '2024-03-21 13:00:00',
  },
];

export const dramaCategoryData: DramaCategory[] = [
  {
    id: 'C1',
    name: '国内小说',
    taskType: 'novel',
    relatedBusiness: ['融合'],
    status: 'show',
    sort: 100,
    updateTime: '2024-03-20 10:00:00'
  },
  {
    id: 'C2',
    name: '海外小说',
    taskType: 'novel',
    relatedBusiness: ['海外文娱'],
    status: 'show',
    sort: 90,
    updateTime: '2024-03-20 10:05:00'
  },
  {
    id: 'C3',
    name: '国内漫剧',
    taskType: 'comic',
    relatedBusiness: ['版权'],
    status: 'show',
    sort: 80,
    updateTime: '2024-03-20 10:10:00'
  },
  {
    id: 'C4',
    name: '国内短剧',
    taskType: 'drama',
    relatedBusiness: ['0粉快手'],
    status: 'show',
    sort: 70,
    updateTime: '2024-03-20 10:15:00'
  },
  {
    id: 'C5',
    name: '海外短剧',
    taskType: 'drama',
    relatedBusiness: ['TTO'],
    status: 'show',
    sort: 60,
    updateTime: '2024-03-20 10:20:00'
  },
  {
    id: 'C6',
    name: 'TTO小说',
    taskType: 'novel',
    relatedBusiness: ['TTO'],
    status: 'show',
    sort: 50,
    updateTime: '2024-03-20 10:25:00'
  },
  {
    id: 'C7',
    name: 'TTO短剧',
    taskType: 'drama',
    relatedBusiness: ['TTO'],
    status: 'show',
    sort: 40,
    updateTime: '2024-03-20 10:30:00'
  }
];

export const fieldConfigurationDataBase: FieldConfiguration[] = [
  // Leaderboard
  { id: 'f1', menuName: '榜单数据', routeKey: 'leaderboard', fieldEnName: 'userId', fieldCnName: '用户ID', description: '系统唯一标识符' },
  { id: 'f2', menuName: '榜单数据', routeKey: 'leaderboard', fieldEnName: 'nickname', fieldCnName: '用户昵称', description: '用户注册填写的展示名称' },
  { id: 'f3', menuName: '榜单数据', routeKey: 'leaderboard', fieldEnName: 'type', fieldCnName: '类型', description: '区分个人整体收益与单一项目收益' },
  { id: 'f4', menuName: '榜单数据', routeKey: 'leaderboard', fieldEnName: 'totalEarnings', fieldCnName: '累计收益', description: '在所选统计维度内的总收入金额' },
  { id: 'f5', menuName: '榜单数据', routeKey: 'leaderboard', fieldEnName: 'dimension', fieldCnName: '统计维度', description: '数据计算的时间跨度（7天或30天）' },
  { id: 'f6', menuName: '榜单数据', routeKey: 'leaderboard', fieldEnName: 'topProject', fieldCnName: '收益最高项目', description: '收益金额最大的单个项目（仅限单项目收益类型）' },
  { id: 'f7', menuName: '榜单数据', routeKey: 'leaderboard', fieldEnName: 'projectEarnings', fieldCnName: '项目收益', description: '最高项目的具体分成金额' },
  { id: 'f8', menuName: '榜单数据', routeKey: 'leaderboard', fieldEnName: 'updateTime', fieldCnName: '更新时间', description: '数据最后一次同步到后台的时间' },
  
  // Community
  { id: 'f9', menuName: '品牌社群', routeKey: 'community', fieldEnName: 'name', fieldCnName: '社群名称', description: '品牌社群的官方名称' },
  { id: 'f10', menuName: '品牌社群', routeKey: 'community', fieldEnName: 'avatar', fieldCnName: '社群头像', description: '社群在平台展示的图标' },
  { id: 'f11', menuName: '品牌社群', routeKey: 'community', fieldEnName: 'tags', fieldCnName: '社群标签', description: '系统或人工标注的社群属性' },
  { id: 'f12', menuName: '品牌社群', routeKey: 'community', fieldEnName: 'totalEarnings', fieldCnName: '累计收益', description: '社群全体成员在维度内的总贡献' },
  { id: 'f13', menuName: '品牌社群', routeKey: 'community', fieldEnName: 'dimension', fieldCnName: '统计维度', description: '数据计算的时间跨度（7天或30天）' },
  { id: 'f14', menuName: '品牌社群', routeKey: 'community', fieldEnName: 'updateTime', fieldCnName: '更新时间', description: '数据最后一次同步到后台的时间' },

  // Brand
  { id: 'f15', menuName: '品牌推荐', routeKey: 'brand', fieldEnName: 'projectId', fieldCnName: '项目ID', description: '项目的唯一编号' },
  { id: 'f16', menuName: '品牌推荐', routeKey: 'brand', fieldEnName: 'projectName', fieldCnName: '项目名称', description: '品牌推广项目的名称' },
  { id: 'f17', menuName: '品牌推荐', routeKey: 'brand', fieldEnName: 'projectType', fieldCnName: '项目类型', description: '项目的业务分类（推文、短剧、资源、游戏）' },
  { id: 'f18', menuName: '品牌推荐', routeKey: 'brand', fieldEnName: 'totalEarnings', fieldCnName: '项目总收益', description: '该项目自上线以来的累计总收益' },
  { id: 'f19', menuName: '品牌推荐', routeKey: 'brand', fieldEnName: 'yesterdayEarnings', fieldCnName: '昨日收益', description: '该项目在昨日产生的总收益' },
  { id: 'f20', menuName: '品牌推荐', routeKey: 'brand', fieldEnName: 'yesterdayApprovedKeywords', fieldCnName: '昨日题词数量', description: '昨日提交并审核通过的题词总数' },
  { id: 'f21', menuName: '品牌推荐', routeKey: 'brand', fieldEnName: 'isHot', fieldCnName: '热门', description: '是否标记为当前热门推荐项目' },
  { id: 'f22', menuName: '品牌推荐', routeKey: 'brand', fieldEnName: 'isNew', fieldCnName: '上新', description: '是否为近期上线的新项目' },
  { id: 'f23', menuName: '品牌推荐', routeKey: 'brand', fieldEnName: 'weightScore', fieldCnName: '加权分值', description: '系统根据多维度指标计算的推荐权重分' },
  { id: 'f24', menuName: '品牌推荐', routeKey: 'brand', fieldEnName: 'recommendDate', fieldCnName: '推荐日期', description: '该项目被推荐的具体日期' },
  { id: 'f25', menuName: '品牌推荐', routeKey: 'brand', fieldEnName: 'updateTime', fieldCnName: '更新时间', description: '数据最后一次同步的时间' },

  // Drama
  { id: 'f26', menuName: '剧作推荐', routeKey: 'drama', fieldEnName: 'category', fieldCnName: '所属分类', description: '剧作的题材分类（如言情、悬疑等）' },
  { id: 'f27', menuName: '剧作推荐', routeKey: 'drama', fieldEnName: 'taskId', fieldCnName: '任务ID', description: '推广任务的唯一标识' },
  { id: 'f28', menuName: '剧作推荐', routeKey: 'drama', fieldEnName: 'taskName', fieldCnName: '任务名称', description: '具体推广任务的名称' },
  { id: 'f29', menuName: '剧作推荐', routeKey: 'drama', fieldEnName: 'taskSource', fieldCnName: '任务来源', description: '任务所属的流量平台（如抖音、快手）' },
  { id: 'f30', menuName: '剧作推荐', routeKey: 'drama', fieldEnName: 'projectName', fieldCnName: '项目名称', description: '关联的项目名称' },
  { id: 'f31', menuName: '剧作推荐', routeKey: 'drama', fieldEnName: 'todayEstimatedEarnings', fieldCnName: '今日预估收益', description: '根据实时数据预估的今日收益' },
  { id: 'f32', menuName: '剧作推荐', routeKey: 'drama', fieldEnName: 'isHot', fieldCnName: '热门', description: '是否标记为热门剧作' },
  { id: 'f33', menuName: '剧作推荐', routeKey: 'drama', fieldEnName: 'isNew', fieldCnName: '上新', description: '是否为新上线剧作' },
  { id: 'f34', menuName: '剧作推荐', routeKey: 'drama', fieldEnName: 'weightScore', fieldCnName: '加权分值', description: '系统计算的推荐权重分' },
  { id: 'f35', menuName: '剧作推荐', routeKey: 'drama', fieldEnName: 'updateTime', fieldCnName: '更新时间', description: '数据最后一次同步的时间' },

  // Category
  { id: 'f36', menuName: '剧作分类', routeKey: 'category', fieldEnName: 'name', fieldCnName: '分类名称', description: '剧作题材的分类名称' },
  { id: 'f37', menuName: '剧作分类', routeKey: 'category', fieldEnName: 'taskType', fieldCnName: '任务类型', description: '推荐任务类型' },
  { id: 'f38', menuName: '剧作分类', routeKey: 'category', fieldEnName: 'relatedBusiness', fieldCnName: '关联业务', description: '该分类关联的具体业务来源' },
  { id: 'f39', menuName: '剧作分类', routeKey: 'category', fieldEnName: 'status', fieldCnName: '状态', description: '分类在前端的显示或隐藏状态' },
  { id: 'f40', menuName: '剧作分类', routeKey: 'category', fieldEnName: 'sort', fieldCnName: '分类排序', description: '分类在列表中的显示顺序（数字越小越靠前）' },
  { id: 'f41', menuName: '剧作分类', routeKey: 'category', fieldEnName: 'updateTime', fieldCnName: '更新时间', description: '最后修改时间' },

  // 学院管理 - 分类管理
  { id: 'f42', menuName: '分类管理', routeKey: 'academy-category', fieldEnName: 'seqId', fieldCnName: 'ID', description: '分类记录的自增主键，用于唯一标识一条分类' },
  { id: 'f43', menuName: '分类管理', routeKey: 'academy-category', fieldEnName: 'name', fieldCnName: '分类名称', description: '商学院栏目下展示的分类名称' },
  { id: 'f44', menuName: '分类管理', routeKey: 'academy-category', fieldEnName: 'kingkong', fieldCnName: '金刚区', description: '是否在首页金刚区展示该分类入口；必选，仅「是」或「否」' },
  { id: 'f45', menuName: '分类管理', routeKey: 'academy-category', fieldEnName: 'icon', fieldCnName: 'icon', description: '分类图标地址；选择「金刚区=是」时必填' },
  { id: 'f46', menuName: '分类管理', routeKey: 'academy-category', fieldEnName: 'sort', fieldCnName: '排序', description: '列表排序权重，数值越大越靠前' },
  { id: 'f47', menuName: '分类管理', routeKey: 'academy-category', fieldEnName: 'status', fieldCnName: '状态', description: '控制分类在前台的显示或隐藏' },
  { id: 'f48', menuName: '分类管理', routeKey: 'academy-category', fieldEnName: 'contentCount', fieldCnName: '内容数', description: '内容配置中归属该分类的内容条数（实时统计）' },
  { id: 'f49', menuName: '分类管理', routeKey: 'academy-category', fieldEnName: 'updateTime', fieldCnName: '更新时间', description: '分类信息最后一次保存的时间' },

  // 学院管理 - 内容配置
  { id: 'f50', menuName: '内容配置', routeKey: 'academy-content', fieldEnName: 'seqId', fieldCnName: 'ID', description: '商学院内容的自增主键' },
  { id: 'f51', menuName: '内容配置', routeKey: 'academy-content', fieldEnName: 'youbaoId', fieldCnName: '所属右豹ID', description: '内容归属的右豹用户或主体标识' },
  { id: 'f52', menuName: '内容配置', routeKey: 'academy-content', fieldEnName: 'cover', fieldCnName: '封面', description: '列表与卡片区域展示的封面图地址' },
  { id: 'f53', menuName: '内容配置', routeKey: 'academy-content', fieldEnName: 'title', fieldCnName: '标题', description: '内容的展示标题' },
  { id: 'f54', menuName: '内容配置', routeKey: 'academy-content', fieldEnName: 'tag', fieldCnName: '标签', description: '运营标签：热门或推荐，用于前台角标与筛选' },
  { id: 'f55', menuName: '内容配置', routeKey: 'academy-content', fieldEnName: 'categoryId', fieldCnName: '所属分类', description: '该内容归属的商学院分类' },
  { id: 'f56', menuName: '内容配置', routeKey: 'academy-content', fieldEnName: 'projectName', fieldCnName: '关联品牌项目名称', description: '与内容关联的推广或品牌项目名称' },
  { id: 'f57', menuName: '内容配置', routeKey: 'academy-content', fieldEnName: 'projectId', fieldCnName: '关联品牌项目ID', description: '关联项目的唯一编号' },
  { id: 'f58', menuName: '内容配置', routeKey: 'academy-content', fieldEnName: 'contentType', fieldCnName: '内容类型', description: '图文或视频，决定前台预览与播放方式' },
  { id: 'f59', menuName: '内容配置', routeKey: 'academy-content', fieldEnName: 'content', fieldCnName: '内容', description: '图文为正文章节或富文本；视频为可播放的地址链接' },
  { id: 'f60', menuName: '内容配置', routeKey: 'academy-content', fieldEnName: 'status', fieldCnName: '状态', description: '内容在前台的显示或隐藏' },
  { id: 'f61', menuName: '内容配置', routeKey: 'academy-content', fieldEnName: 'updateTime', fieldCnName: '更新时间', description: '内容最后一次保存或发布的时间' }
];

export const fieldConfigurationDescriptionDefaults: Readonly<Record<string, string>> =
  Object.fromEntries(fieldConfigurationDataBase.map((r) => [r.id, r.description]));

const rawOverrideFile = fieldDescriptionOverridesFile as Record<string, unknown>;
export const initialFieldDescriptionOverridesFromFile: Record<string, string> = {};
for (const [k, v] of Object.entries(rawOverrideFile)) {
  if (typeof v === 'string') initialFieldDescriptionOverridesFromFile[k] = v;
}

export const fieldConfigurationData: FieldConfiguration[] = fieldConfigurationDataBase.map((row) => {
  const fromFile = initialFieldDescriptionOverridesFromFile[row.id];
  return {
    ...row,
    description: fromFile ?? row.description,
    fieldCnName:
      row.fieldEnName === 'dimension' && row.fieldCnName === '统计纬度'
        ? '统计维度'
        : row.fieldCnName,
  };
});

export const dramaRecommendationData: DramaRecommendation[] = [
  {
    category: '国内小说',
    taskId: 'T8001',
    taskName: '深夜食堂',
    taskSource: '融合',
    projectName: '短剧推广计划',
    todayEstimatedEarnings: 850.00,
    isHot: true,
    isNew: false,
    weightScore: 94,
    updateTime: '2024-03-20 19:00:00'
  },
  {
    category: '国内短剧',
    taskId: 'T8002',
    taskName: '霸道总裁爱上我',
    taskSource: '0粉快手',
    projectName: '爆款剧场',
    todayEstimatedEarnings: 1200.00,
    isHot: true,
    isNew: true,
    weightScore: 98,
    updateTime: '2024-03-20 19:10:00'
  },
  {
    category: '海外短剧',
    taskId: 'T8003',
    taskName: '海外故事集',
    taskSource: 'TTO',
    projectName: '全球短剧',
    todayEstimatedEarnings: 2100.00,
    isHot: false,
    isNew: true,
    weightScore: 85,
    updateTime: '2024-03-20 19:20:00'
  }
];
