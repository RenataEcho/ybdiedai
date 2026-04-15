/** 项目管理（右豹迭代）— 类型与演示数据 */
import _projectManagementSeedJson from './mock/project-management-seed.json';

export type ProjectCategory = 'tweet' | 'drama' | 'resource' | 'app';
export type YesNo = 'yes' | 'no';
/** 详情介绍各板块：图文为富文本 HTML，视频为可播放地址或本机 blob URL */
export type ProjectDetailContentType = 'article' | 'video';

export type ProjectDetailBlockKey = 'introduction' | 'process' | 'notice' | 'teaching';

/** 「项目介绍」下的子模块 */
export type ProjectIntroSubKey =
  | 'projectDescription'
  | 'keywordRequirements'
  | 'backfill'
  | 'order'
  | 'settlement';

export interface ProjectDetailSectionState {
  title: string;
  description: string;
  contentType: ProjectDetailContentType;
  /** 图文：富文本 HTML；视频：地址或上传生成的 blob URL */
  content: string;
  /** 前台是否展示该板块 */
  visible: YesNo;
}

export type ProjectIntroductionDetailState = Record<ProjectIntroSubKey, ProjectDetailSectionState>;

export interface ProjectManagementDetailState {
  introduction: ProjectIntroductionDetailState;
  process: ProjectDetailSectionState;
  notice: ProjectDetailSectionState;
  teaching: ProjectDetailSectionState;
}
export type ShowHide = 'show' | 'hide';
export type TransferGift = 'on' | 'off';
export type OnlineState = 'online' | 'offline';

export interface ProjectManagementRow {
  id: string;
  seq: number;
  category: ProjectCategory;
  sort: number;
  virtualIncome: number;
  frontTitle: string;
  backTitle: string;
  boomSort: string;
  projectTags: string;
  tagTitle: string;
  booklistLink: string;
  orderRemark: string;
  projectIcon: string;
  stampUrl: string;
  transferGift: TransferGift;
  projectStatus: ShowHide;
  hotProject: YesNo;
  isNewProduct: YesNo;
  onlineState: OnlineState;
  wechatPush: YesNo;
  forbidPromptWords: YesNo;
  boomListVisible: ShowHide;
  searchVolumeVisible: ShowHide;
  expireDays: number;
  limitPromptWords: number;
  isBackfill: YesNo;
  homeDisplay: YesNo;
  memberType: string;
  memberVisible: YesNo;
  memberCanDo: YesNo;
  adminHidden: YesNo;
  isToutiao: YesNo;
  projectEn: string;
  shortDramaTweet: YesNo;
  officialPrompts: YesNo;
  isBook: YesNo;
  isBatch: YesNo;
  isWhitelist: YesNo;
  assignMentor: YesNo;
  isCommercial: YesNo;
  isOverseas: YesNo;
  copyrightNative: YesNo;
  detail: ProjectManagementDetailState;
  updateTime: string;
}

export type ProjectManagementFormState = Omit<ProjectManagementRow, 'id' | 'seq' | 'updateTime'>;

export const PROJECT_CATEGORY_LABEL: Record<ProjectCategory, string> = {
  tweet: '推文',
  drama: '短剧',
  resource: '资源',
  app: '应用',
};

export const PROJECT_DETAIL_BLOCK_LABEL: Record<ProjectDetailBlockKey, string> = {
  introduction: '项目介绍',
  process: '项目流程',
  notice: '特别注意',
  teaching: '项目教学',
};

export const PROJECT_INTRO_SUB_LABEL: Record<ProjectIntroSubKey, string> = {
  projectDescription: '项目说明',
  keywordRequirements: '关键词要求',
  backfill: '回填',
  order: '订单',
  settlement: '结算',
};

export function emptyDetailSection(): ProjectDetailSectionState {
  return {
    title: '',
    description: '',
    contentType: 'article',
    content: '',
    visible: 'yes',
  };
}

export function emptyIntroductionDetail(): ProjectIntroductionDetailState {
  return {
    projectDescription: emptyDetailSection(),
    keywordRequirements: emptyDetailSection(),
    backfill: emptyDetailSection(),
    order: emptyDetailSection(),
    settlement: emptyDetailSection(),
  };
}

function mergeDetailSection(raw: unknown): ProjectDetailSectionState {
  const base = emptyDetailSection();
  if (!raw || typeof raw !== 'object') return base;
  const s = raw as Partial<ProjectDetailSectionState>;
  return {
    ...base,
    ...s,
    visible: s.visible === 'yes' || s.visible === 'no' ? s.visible : base.visible,
  };
}

/** 兼容旧版「项目介绍」为单块结构的 detail */
export function normalizeProjectManagementDetail(raw: unknown): ProjectManagementDetailState {
  const empty = emptyProjectManagementDetail();
  if (!raw || typeof raw !== 'object') return empty;
  const d = raw as Partial<ProjectManagementDetailState>;

  let introduction: ProjectIntroductionDetailState;
  const intro = d.introduction;
  if (intro && typeof intro === 'object' && 'projectDescription' in intro) {
    const i = intro as Partial<ProjectIntroductionDetailState>;
    introduction = {
      projectDescription: mergeDetailSection(i.projectDescription),
      keywordRequirements: mergeDetailSection(i.keywordRequirements),
      backfill: mergeDetailSection(i.backfill),
      order: mergeDetailSection(i.order),
      settlement: mergeDetailSection(i.settlement),
    };
  } else if (intro && typeof intro === 'object' && ('contentType' in intro || 'title' in intro)) {
    introduction = {
      ...emptyIntroductionDetail(),
      projectDescription: mergeDetailSection(intro),
    };
  } else {
    introduction = emptyIntroductionDetail();
  }

  return {
    introduction,
    process: mergeDetailSection(d.process),
    notice: mergeDetailSection(d.notice),
    teaching: mergeDetailSection(d.teaching),
  };
}

export function emptyProjectManagementDetail(): ProjectManagementDetailState {
  return {
    introduction: emptyIntroductionDetail(),
    process: emptyDetailSection(),
    notice: emptyDetailSection(),
    teaching: emptyDetailSection(),
  };
}

export function emptyProjectManagementForm(): ProjectManagementFormState {
  return {
    category: 'tweet',
    sort: 0,
    virtualIncome: 0,
    frontTitle: '',
    backTitle: '',
    boomSort: '',
    projectTags: '',
    tagTitle: '',
    booklistLink: '',
    orderRemark: '',
    projectIcon: '',
    stampUrl: '',
    transferGift: 'off',
    projectStatus: 'show',
    hotProject: 'no',
    isNewProduct: 'no',
    onlineState: 'online',
    wechatPush: 'no',
    forbidPromptWords: 'no',
    boomListVisible: 'show',
    searchVolumeVisible: 'show',
    expireDays: 360,
    limitPromptWords: 0,
    isBackfill: 'yes',
    homeDisplay: 'yes',
    memberType: '普通会员',
    memberVisible: 'no',
    memberCanDo: 'yes',
    adminHidden: 'no',
    isToutiao: 'yes',
    projectEn: '',
    shortDramaTweet: 'yes',
    officialPrompts: 'yes',
    isBook: 'yes',
    isBatch: 'yes',
    isWhitelist: 'yes',
    assignMentor: 'no',
    isCommercial: 'yes',
    isOverseas: 'yes',
    copyrightNative: 'yes',
    detail: emptyProjectManagementDetail(),
  };
}

export function rowToForm(row: ProjectManagementRow): ProjectManagementFormState {
  const { id: _id, seq: _seq, updateTime: _u, ...rest } = row;
  return {
    ...rest,
    detail: normalizeProjectManagementDetail(row.detail ?? null),
  };
}

export function formToRow(
  form: ProjectManagementFormState,
  id: string,
  seq: number,
  updateTime: string
): ProjectManagementRow {
  return { ...form, id, seq, updateTime };
}

/** 模拟从数据库拉取的会员类型名称（与普通/高级会员合并展示） */
export async function fetchMemberTypeNames(): Promise<string[]> {
  await new Promise((r) => setTimeout(r, 200));
  return ['钻石会员', '企业会员', '体验会员', '渠道专属会员'];
}

const _projectManagementFromFile = _projectManagementSeedJson as unknown as ProjectManagementRow[];

export const projectManagementSeedData: ProjectManagementRow[] = _projectManagementFromFile.length > 0
  ? _projectManagementFromFile.map((r) => ({ ...r, detail: normalizeProjectManagementDetail(r.detail) }))
  : [
  {
    id: 'PM-10001',
    seq: 1,
    category: 'tweet',
    sort: 100,
    virtualIncome: 0,
    frontTitle: '番茄小说推文',
    backTitle: '番茄小说-后台',
    boomSort: '10',
    projectTags: '小说,CPA',
    tagTitle: '',
    booklistLink: 'https://example.com/list/tomato',
    orderRemark: '测试备注',
    projectIcon: 'https://picsum.photos/seed/pmicon1/96/96',
    stampUrl: 'https://picsum.photos/seed/pmstamp1/64/64',
    transferGift: 'off',
    projectStatus: 'show',
    hotProject: 'yes',
    isNewProduct: 'no',
    onlineState: 'online',
    wechatPush: 'no',
    forbidPromptWords: 'no',
    boomListVisible: 'show',
    searchVolumeVisible: 'show',
    expireDays: 360,
    limitPromptWords: 3,
    isBackfill: 'yes',
    homeDisplay: 'yes',
    memberType: '普通会员',
    memberVisible: 'no',
    memberCanDo: 'yes',
    adminHidden: 'no',
    isToutiao: 'yes',
    projectEn: 'tomato-novel',
    shortDramaTweet: 'yes',
    officialPrompts: 'yes',
    isBook: 'yes',
    isBatch: 'yes',
    isWhitelist: 'yes',
    assignMentor: 'no',
    isCommercial: 'yes',
    isOverseas: 'yes',
    copyrightNative: 'yes',
    detail: {
      introduction: {
        projectDescription: {
          title: '项目概览',
          description: '面向新手的项目说明与收益结构摘要。',
          contentType: 'article',
          visible: 'yes',
          content:
            '<p><strong>番茄小说推文</strong> 适合有短视频账号的创作者，按 CPA 结算。</p><ul><li>准备账号与素材</li><li>按书单选书</li><li>发布挂载链接</li></ul>',
        },
        keywordRequirements: {
          title: '关键词与话题',
          description: '搜索与话题标签相关约束。',
          contentType: 'article',
          visible: 'yes',
          content: '<p>需包含指定关键词；避免违规词与竞品品牌词。</p>',
        },
        backfill: {
          title: '回填说明',
          description: '订单与转化回填规则。',
          contentType: 'article',
          visible: 'no',
          content: '<p>请在 T+1 内完成回填，超时将影响结算。</p>',
        },
        order: {
          title: '下单流程',
          description: '从选书到出单的步骤。',
          contentType: 'article',
          visible: 'yes',
          content: '<p>选书 → 生成推广链接 → 发布 → 回传订单号。</p>',
        },
        settlement: {
          title: '结算周期',
          description: '打款与对账说明。',
          contentType: 'video',
          visible: 'yes',
          content: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        },
      },
      process: {
        title: '操作演示',
        description: '全流程录屏，建议全屏观看。',
        contentType: 'video',
        visible: 'yes',
        content: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      },
      notice: {
        title: '合规提醒',
        description: '发布前必读。',
        contentType: 'article',
        visible: 'yes',
        content: '<p>请勿使用虚假宣传；遵守平台与版权方规则。</p>',
      },
      teaching: {
        title: '剪辑要点',
        description: '图文教程。',
        contentType: 'article',
        visible: 'yes',
        content: '<p>封面清晰、前 3 秒抛出钩子、结尾引导转化。</p>',
      },
    },
    updateTime: '2024-03-21 10:20:00',
  },
  {
    id: 'PM-10002',
    seq: 2,
    category: 'drama',
    sort: 88,
    virtualIncome: 0,
    frontTitle: '短剧拉新 A',
    backTitle: '短剧拉新-A-后台',
    boomSort: '5',
    projectTags: '短剧,CPS',
    tagTitle: '爆单',
    booklistLink: '',
    orderRemark: '',
    projectIcon: '',
    stampUrl: '',
    transferGift: 'off',
    projectStatus: 'show',
    hotProject: 'yes',
    isNewProduct: 'yes',
    onlineState: 'online',
    wechatPush: 'no',
    forbidPromptWords: 'no',
    boomListVisible: 'hide',
    searchVolumeVisible: 'show',
    expireDays: 180,
    limitPromptWords: 0,
    isBackfill: 'no',
    homeDisplay: 'yes',
    memberType: '高级会员',
    memberVisible: 'yes',
    memberCanDo: 'yes',
    adminHidden: 'no',
    isToutiao: 'no',
    projectEn: 'drama-a',
    shortDramaTweet: 'yes',
    officialPrompts: 'yes',
    isBook: 'no',
    isBatch: 'yes',
    isWhitelist: 'yes',
    assignMentor: 'no',
    isCommercial: 'yes',
    isOverseas: 'no',
    copyrightNative: 'yes',
    detail: emptyProjectManagementDetail(),
    updateTime: '2024-03-21 11:05:00',
  },
  {
    id: 'PM-10003',
    seq: 3,
    category: 'resource',
    sort: 60,
    virtualIncome: 0,
    frontTitle: '网盘资源推广',
    backTitle: '网盘-资源位',
    boomSort: '',
    projectTags: '资源',
    tagTitle: '',
    booklistLink: '',
    orderRemark: '隐藏演示',
    projectIcon: 'https://picsum.photos/seed/pmicon3/96/96',
    stampUrl: '',
    transferGift: 'off',
    projectStatus: 'hide',
    hotProject: 'no',
    isNewProduct: 'no',
    onlineState: 'offline',
    wechatPush: 'no',
    forbidPromptWords: 'yes',
    boomListVisible: 'show',
    searchVolumeVisible: 'hide',
    expireDays: 90,
    limitPromptWords: 10,
    isBackfill: 'yes',
    homeDisplay: 'no',
    memberType: '普通会员',
    memberVisible: 'no',
    memberCanDo: 'no',
    adminHidden: 'yes',
    isToutiao: 'no',
    projectEn: 'pan-res',
    shortDramaTweet: 'no',
    officialPrompts: 'no',
    isBook: 'no',
    isBatch: 'no',
    isWhitelist: 'no',
    assignMentor: 'no',
    isCommercial: 'no',
    isOverseas: 'no',
    copyrightNative: 'no',
    detail: emptyProjectManagementDetail(),
    updateTime: '2024-03-20 16:40:00',
  },
];
