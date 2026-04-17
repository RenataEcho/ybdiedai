/** 导师迭代 — 门派管理：类型与演示数据 */
import _sectGuildSeedJson from './mock/sect-guild-seed.json';

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
