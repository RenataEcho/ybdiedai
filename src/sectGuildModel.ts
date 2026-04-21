/** 导师迭代 — 门派管理：类型与演示数据 */
import _sectGuildSeedJson from './mock/sect-guild-seed.json';

// ─── 门派项目明细 ───────────────────────────────────────────────────────────────

/** 项目所属地区类型（国内/国外） */
export type ProjectRegion = 'domestic' | 'overseas';

/** 门派项目明细：每一行代表该门派旗下的一个项目及其收益数据 */
export interface SectGuildProjectItem {
  /** 项目 ID，对应项目管理中的 id */
  projectId: string;
  /** 项目 icon URL */
  projectIcon: string;
  /** 项目前台名称 */
  projectName: string;
  /**
   * 项目类型（国内推文、国内短剧、国内应用、国内资源、
   * 国外推文、国外短剧、国外资源、国外应用、海外故事、海外短剧）
   */
  projectType: string;
  /** 近 7 日收益（元） */
  earnings7d: number;
  /** 近 30 日收益（元） */
  earnings30d: number;
  /** 总收益（元） */
  earningsTotal: number;
  /** 数据更新时间（ISO 8601） */
  dataUpdatedAt: string;
}

/** 每个门派拥有的项目明细列表（键为门派 id） */
export type SectGuildProjectsMap = Record<string, SectGuildProjectItem[]>;

function makeProject(
  projectId: string,
  projectIcon: string,
  projectName: string,
  projectType: string,
  earnings7d: number,
  earnings30d: number,
  earningsTotal: number,
  dataUpdatedAt: string,
): SectGuildProjectItem {
  return { projectId, projectIcon, projectName, projectType, earnings7d, earnings30d, earningsTotal, dataUpdatedAt };
}

/** 演示用的门派项目明细数据（按门派 id 索引） */
export const sectGuildProjectsMockData: SectGuildProjectsMap = {
  'sg-1': [
    makeProject('PM-10001', 'https://picsum.photos/seed/pmicon1/96/96', '番茄小说推文', '国内推文', 3280, 12450, 98600, '2026-04-19T10:00:00.000Z'),
    makeProject('PM-10002', 'https://picsum.photos/seed/pmicon2/96/96', '抖音短剧-星耀', '国内短剧', 5120, 21300, 145800, '2026-04-19T10:00:00.000Z'),
    makeProject('PM-10003', 'https://picsum.photos/seed/pmicon3/96/96', '七猫小说推文', '国内推文', 1870, 7890, 42300, '2026-04-19T10:00:00.000Z'),
    makeProject('PM-10004', 'https://picsum.photos/seed/pmicon4/96/96', '快手短剧-沸点', '国内短剧', 4200, 18600, 88700, '2026-04-19T10:00:00.000Z'),
    makeProject('PM-10005', 'https://picsum.photos/seed/pmicon5/96/96', '海外TikTok短剧', '海外短剧', 6800, 29500, 173200, '2026-04-19T10:00:00.000Z'),
    makeProject('PM-10006', 'https://picsum.photos/seed/pmicon6/96/96', '国际番茄小说', '国外推文', 2100, 9300, 51000, '2026-04-19T10:00:00.000Z'),
    makeProject('PM-10007', 'https://picsum.photos/seed/pmicon7/96/96', '微信读书推文', '国内推文', 980, 4200, 22100, '2026-04-19T10:00:00.000Z'),
    makeProject('PM-10008', 'https://picsum.photos/seed/pmicon8/96/96', '起点小说-海外', '国外推文', 1540, 6780, 35800, '2026-04-19T10:00:00.000Z'),
    makeProject('PM-10009', 'https://picsum.photos/seed/pmicon9/96/96', '优酷短剧-国内', '国内短剧', 3370, 14500, 79300, '2026-04-19T10:00:00.000Z'),
    makeProject('PM-10010', 'https://picsum.photos/seed/pmicon10/96/96', '海外故事平台', '海外故事', 4900, 21200, 118600, '2026-04-19T10:00:00.000Z'),
    makeProject('PM-10011', 'https://picsum.photos/seed/pmicon11/96/96', '腾讯视频短剧', '国内短剧', 2680, 11400, 63500, '2026-04-19T10:00:00.000Z'),
    makeProject('PM-10012', 'https://picsum.photos/seed/pmicon12/96/96', '国外资源配置', '国外资源', 1200, 5100, 28900, '2026-04-19T10:00:00.000Z'),
  ],
  'sg-2': [
    makeProject('PM-20001', 'https://picsum.photos/seed/pmicon21/96/96', '爱奇艺短剧-赤焰', '国内短剧', 1890, 8200, 43500, '2026-04-19T10:00:00.000Z'),
    makeProject('PM-20002', 'https://picsum.photos/seed/pmicon22/96/96', '书旗小说推文', '国内推文', 1230, 5300, 29800, '2026-04-19T10:00:00.000Z'),
    makeProject('PM-20003', 'https://picsum.photos/seed/pmicon23/96/96', '国内应用推广', '国内应用', 760, 3400, 18900, '2026-04-19T10:00:00.000Z'),
    makeProject('PM-20004', 'https://picsum.photos/seed/pmicon24/96/96', '海外短剧-合作', '海外短剧', 2340, 10100, 56800, '2026-04-19T10:00:00.000Z'),
    makeProject('PM-20005', 'https://picsum.photos/seed/pmicon25/96/96', '国外应用分发', '国外应用', 980, 4200, 24300, '2026-04-19T10:00:00.000Z'),
    makeProject('PM-20006', 'https://picsum.photos/seed/pmicon26/96/96', '国内资源整合', '国内资源', 540, 2300, 12700, '2026-04-19T10:00:00.000Z'),
  ],
};

export type SectGuildStatus = 'active' | 'inactive';

export const SECT_GUILD_STATUS_LABEL: Record<SectGuildStatus, string> = {
  active: '启用',
  inactive: '停用',
};

export type SectIntroTabKey = 'communityIntro' | 'specialtyProjects' | 'hallOfFame' | 'communityCases';

export const SECT_INTRO_TAB_LABEL: Record<SectIntroTabKey, string> = {
  communityIntro: '社群介绍',
  specialtyProjects: '专精项目',
  hallOfFame: '战绩榜',
  communityCases: '社群案例',
};

export const SECT_INTRO_TAB_KEYS: SectIntroTabKey[] = [
  'communityIntro',
  'specialtyProjects',
  'hallOfFame',
  'communityCases',
];

export type SectContentKind = 'richText' | 'video';

export interface SectIntroBlock {
  title: string;
  description: string;
  visible: boolean;
  /** 文案内容：图文为富文本，视频为链接 */
  contentKind: SectContentKind;
  richTextHtml: string;
  videoUrl: string;
}

export function emptySectIntroBlock(): SectIntroBlock {
  return {
    title: '',
    description: '',
    visible: true,
    contentKind: 'richText',
    richTextHtml: '<p><br></p>',
    videoUrl: '',
  };
}

export function defaultSectIntroTabs(): Record<SectIntroTabKey, SectIntroBlock> {
  return {
    communityIntro: emptySectIntroBlock(),
    specialtyProjects: emptySectIntroBlock(),
    hallOfFame: emptySectIntroBlock(),
    communityCases: emptySectIntroBlock(),
  };
}

export interface SectGuildRow {
  id: string;
  name: string;
  leaderName: string;
  iconUrl: string;
  /** 门派标签，自由文本 */
  tags: string;
  projectCount: number;
  mentorCount: number;
  studentCount: number;
  /** 累计学员收益（演示数值） */
  totalStudentEarnings: number;
  status: SectGuildStatus;
  /** ISO 8601 */
  createdAt: string;
  intro: Record<SectIntroTabKey, SectIntroBlock>;
}

export type SectGuildFormState = {
  name: string;
  leaderName: string;
  iconUrl: string;
  tags: string;
  intro: Record<SectIntroTabKey, SectIntroBlock>;
};

export function emptySectGuildForm(): SectGuildFormState {
  return {
    name: '',
    leaderName: '',
    iconUrl: '',
    tags: '',
    intro: defaultSectIntroTabs(),
  };
}

export function rowToSectGuildForm(row: SectGuildRow): SectGuildFormState {
  return {
    name: row.name,
    leaderName: row.leaderName,
    iconUrl: row.iconUrl,
    tags: row.tags ?? '',
    intro: structuredClone(row.intro),
  };
}

function nowIso() {
  return new Date().toISOString();
}

export function createSectGuildRowFromForm(
  form: SectGuildFormState,
  id: string,
  prev: SectGuildRow | null,
  stats: Pick<SectGuildRow, 'projectCount' | 'mentorCount' | 'studentCount' | 'totalStudentEarnings' | 'status'>
): SectGuildRow {
  return {
    id,
    name: form.name.trim(),
    leaderName: form.leaderName.trim(),
    iconUrl: form.iconUrl.trim(),
    tags: form.tags.trim(),
    projectCount: stats.projectCount,
    mentorCount: stats.mentorCount,
    studentCount: stats.studentCount,
    totalStudentEarnings: stats.totalStudentEarnings,
    status: stats.status,
    createdAt: prev?.createdAt ?? nowIso(),
    intro: {
      communityIntro: { ...form.intro.communityIntro },
      specialtyProjects: { ...form.intro.specialtyProjects },
      hallOfFame: { ...form.intro.hallOfFame },
      communityCases: { ...form.intro.communityCases },
    },
  };
}

const _sectGuildFromFile = _sectGuildSeedJson as unknown as SectGuildRow[];

export const sectGuildSeedData: SectGuildRow[] = _sectGuildFromFile.length > 0
  ? _sectGuildFromFile
  : [
  {
    id: 'sg-1',
    name: '青云门',
    leaderName: '林导师',
    iconUrl: 'https://picsum.photos/seed/sect-qing/96/96',
    tags: '小说推文,短剧',
    projectCount: 12,
    mentorCount: 5,
    studentCount: 128,
    totalStudentEarnings: 256800.5,
    status: 'active',
    createdAt: '2026-03-01T08:00:00.000Z',
    intro: {
      communityIntro: {
        title: '关于我们',
        description: '专注小说推文与短剧拉新',
        visible: true,
        contentKind: 'richText',
        richTextHtml: '<p>欢迎加入青云门，<strong>每周案例复盘</strong>与专属答疑。</p>',
        videoUrl: '',
      },
      specialtyProjects: {
        title: '主推项目',
        description: '当前社群主攻方向',
        visible: true,
        contentKind: 'video',
        richTextHtml: '<p><br></p>',
        videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      },
      hallOfFame: {
        title: '本月之星',
        description: '收益与成长榜',
        visible: true,
        contentKind: 'richText',
        richTextHtml: '<p>榜单每周更新。</p>',
        videoUrl: '',
      },
      communityCases: {
        title: '案例精选',
        description: '真实学员反馈',
        visible: false,
        contentKind: 'richText',
        richTextHtml: '<p>案例脱敏展示。</p>',
        videoUrl: '',
      },
    },
  },
  {
    id: 'sg-2',
    name: '赤焰堂',
    leaderName: '周导师',
    iconUrl: 'https://picsum.photos/seed/sect-chi/96/96',
    tags: '',
    projectCount: 6,
    mentorCount: 2,
    studentCount: 45,
    totalStudentEarnings: 68200,
    status: 'inactive',
    createdAt: '2026-02-18T14:30:00.000Z',
    intro: {
      communityIntro: { ...emptySectIntroBlock(), title: '社群说明' },
      specialtyProjects: { ...emptySectIntroBlock() },
      hallOfFame: { ...emptySectIntroBlock() },
      communityCases: { ...emptySectIntroBlock() },
    },
  },
];
