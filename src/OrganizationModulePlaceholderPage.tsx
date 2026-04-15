import { Info } from 'lucide-react';

type PlaceholderVariant = 'mentor-list' | 'mentor-type' | 'project-allocation';

const copy: Record<
  PlaceholderVariant,
  { title: string; bullets: string[] }
> = {
  'mentor-list': {
    title: '导师列表',
    bullets: [
      '本 Tab 为菜单占位页。正式版将在此维护导师主档列表（与「门派管理」一致的档案维度：基础信息、介绍子模块、运营统计等）。',
      '数据结构与交互规范对齐现有导师迭代下的门派/社群管理模块，便于后续复用表格、抽屉表单与富文本能力。',
    ],
  },
  'mentor-type': {
    title: '导师类型',
    bullets: [
      '本 Tab 为菜单占位页。正式版将配置导师类型枚举、展示策略及与主档的关联关系。',
      '字段与校验规则将与门派管理模块中的分类、状态、排序等模式保持一致（前端演示）。',
    ],
  },
  'project-allocation': {
    title: '项目分配',
    bullets: [
      '本页为菜单占位。正式版将维护导师/客服与项目、学员的分配关系与操作日志。',
      '列表与筛选结构可参考现有「门派管理」中的关联统计与操作列设计（前端演示）。',
    ],
  },
};

export function OrganizationModulePlaceholderPage({ variant }: { variant: PlaceholderVariant }) {
  const { title, bullets } = copy[variant];
  return (
    <div className="p-6 sm:p-8">
      <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-line bg-gray-50/60 px-6 py-8">
        <div className="mb-4 flex items-center gap-2 text-gray-800">
          <Info className="h-5 w-5 shrink-0 text-accent" />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <ul className="list-disc space-y-3 pl-5 text-sm leading-relaxed text-gray-600">
          {bullets.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
