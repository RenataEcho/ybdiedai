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

export const fieldConfigurationData: FieldConfiguration[] = [
  // Leaderboard
  { id: 'f1', menuName: '榜单数据', routeKey: 'leaderboard', fieldEnName: 'userId', fieldCnName: '用户ID', description: '系统唯一标识符' },
  { id: 'f2', menuName: '榜单数据', routeKey: 'leaderboard', fieldEnName: 'nickname', fieldCnName: '用户昵称', description: '用户注册填写的展示名称' },
  { id: 'f3', menuName: '榜单数据', routeKey: 'leaderboard', fieldEnName: 'type', fieldCnName: '类型', description: '区分个人整体收益与单一项目收益' },
  { id: 'f4', menuName: '榜单数据', routeKey: 'leaderboard', fieldEnName: 'totalEarnings', fieldCnName: '累计收益', description: '在所选统计维度内的总收入金额' },
  { id: 'f5', menuName: '榜单数据', routeKey: 'leaderboard', fieldEnName: 'dimension', fieldCnName: '统计纬度', description: '数据计算的时间跨度（7天或30天）' },
  { id: 'f6', menuName: '榜单数据', routeKey: 'leaderboard', fieldEnName: 'topProject', fieldCnName: '收益最高项目', description: '收益金额最大的单个项目（仅限单项目收益类型）' },
  { id: 'f7', menuName: '榜单数据', routeKey: 'leaderboard', fieldEnName: 'projectEarnings', fieldCnName: '项目收益', description: '最高项目的具体分成金额' },
  { id: 'f8', menuName: '榜单数据', routeKey: 'leaderboard', fieldEnName: 'updateTime', fieldCnName: '更新时间', description: '数据最后一次同步到后台的时间' },
  
  // Community
  { id: 'f9', menuName: '品牌社群', routeKey: 'community', fieldEnName: 'name', fieldCnName: '社群名称', description: '品牌社群的官方名称' },
  { id: 'f10', menuName: '品牌社群', routeKey: 'community', fieldEnName: 'avatar', fieldCnName: '社群头像', description: '社群在平台展示的图标' },
  { id: 'f11', menuName: '品牌社群', routeKey: 'community', fieldEnName: 'tags', fieldCnName: '社群标签', description: '系统或人工标注的社群属性' },
  { id: 'f12', menuName: '品牌社群', routeKey: 'community', fieldEnName: 'totalEarnings', fieldCnName: '累计收益', description: '社群全体成员在维度内的总贡献' },
  { id: 'f13', menuName: '品牌社群', routeKey: 'community', fieldEnName: 'dimension', fieldCnName: '统计纬度', description: '数据计算的时间跨度（7天或30天）' },
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
  { id: 'f41', menuName: '剧作分类', routeKey: 'category', fieldEnName: 'updateTime', fieldCnName: '更新时间', description: '最后修改时间' }
];

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
