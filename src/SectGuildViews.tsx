import { useState } from 'react';
import { Pagination } from './Pagination';
import { useResizableTableColumns, ColumnTipHeader } from './resizableTableColumns';
import { Edit2, Search, Trash2 } from 'lucide-react';
import type { SectGuildFormState, SectGuildRow, SectGuildStatus, SectIntroBlock, SectIntroTabKey } from './sectGuildModel';
import { SECT_GUILD_STATUS_LABEL, SECT_INTRO_TAB_KEYS, SECT_INTRO_TAB_LABEL } from './sectGuildModel';
import { RichTextEditor } from './RichTextEditor';

const SECT_GUILD_COL_DEFAULTS = [160, 120, 100, 100, 100, 100, 120, 100, 160, 120];

/** 门派管理字段说明 */
const MT_FIELD_TIPS: Record<string, string> = {
  name: '门派在列表与详情页中的对外展示名称',
  leader: '门派负责人或对外展示的掌门昵称',
  status: '门派启用/停用状态，停用后前台不可访问该门派',
  totalEarnings: '演示用汇总指标，实际口径以后台数仓为准（元）',
};

const tableHeadClass =
  'px-3 py-3.5 text-left text-[14px] font-bold text-gray-900 dark:text-white/85 font-sans tracking-tight align-middle whitespace-nowrap sm:px-4';
const tableHeadRight = `${tableHeadClass} text-right`;
const tableHeadAction =
  'sticky right-0 z-30 border-l border-line bg-gray-50/95 dark:bg-[#181c28]/95 px-3 py-3.5 text-right text-[14px] font-bold text-gray-900 dark:text-white/85 font-sans tracking-tight align-middle whitespace-nowrap shadow-[-10px_0_20px_-8px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:px-4 relative';
const tableCellActionBase =
  'sticky right-0 z-20 border-l border-line bg-white dark:bg-[#1e2232] px-3 py-4 text-right shadow-[-10px_0_20px_-8px_rgba(0,0,0,0.08)] group-hover:bg-gray-50 dark:group-hover:bg-[#252a3a] sm:px-4';
const tableCellAction = `${tableCellActionBase} align-middle`;

const inputClass =
  'w-full rounded-lg border border-line px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20';

function formatLocal(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return iso;
  }
}

function formatMoney(n: number) {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function statusBadgeClass(s: SectGuildStatus) {
  if (s === 'active') return 'bg-green-50 text-green-700';
  return 'bg-gray-100 text-gray-600';
}


function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-20 text-gray-400">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
        <Search className="h-8 w-8 opacity-20" />
      </div>
      <p className="text-sm font-medium">暂无匹配数据</p>
      <p className="mt-1 text-xs">请尝试调整搜索关键词</p>
    </div>
  );
}

export function SectGuildTable({
  data,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}: {
  data: SectGuildRow[];
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (row: SectGuildRow) => void;
  onDelete: (row: SectGuildRow) => void;
}) {
  const rtc = useResizableTableColumns('sect-guild', SECT_GUILD_COL_DEFAULTS);
  if (data.length === 0) return <EmptyState />;
  const paginated = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table
        className="app-data-table app-data-table--resizable w-full min-w-0 border-collapse text-left"
        style={{ minWidth: rtc.tableMinWidth }}
      >
        {rtc.colGroup}
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <ColumnTipHeader label="门派名称" tip={MT_FIELD_TIPS.name} className={`${tableHeadClass} relative`} resizeHandle={rtc.renderResizeHandle(0)} />
            <ColumnTipHeader label="负责人" tip={MT_FIELD_TIPS.leader} className={`${tableHeadClass} relative`} resizeHandle={rtc.renderResizeHandle(1)} />
            <th className={`${tableHeadClass} relative`}>
              门派 icon
              {rtc.renderResizeHandle(2)}
            </th>
            <th className={`${tableHeadRight} relative`}>
              门派项目数
              {rtc.renderResizeHandle(3)}
            </th>
            <th className={`${tableHeadRight} relative`}>
              导师数量
              {rtc.renderResizeHandle(4)}
            </th>
            <th className={`${tableHeadRight} relative`}>
              学员总数
              {rtc.renderResizeHandle(5)}
            </th>
            <ColumnTipHeader label="学员总收益" tip={MT_FIELD_TIPS.totalEarnings} align="right" className={`${tableHeadRight} relative`} resizeHandle={rtc.renderResizeHandle(6)} />
            <ColumnTipHeader label="状态" tip={MT_FIELD_TIPS.status} className={`${tableHeadClass} relative`} resizeHandle={rtc.renderResizeHandle(7)} />
            <th className={`${tableHeadClass} relative`}>
              创建时间
              {rtc.renderResizeHandle(8)}
            </th>
            <th className={tableHeadAction}>
              操作
              {rtc.renderResizeHandle(9)}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {paginated.map((row) => (
            <tr key={row.id} className="group transition-colors hover:bg-gray-50">
              <td className="min-w-0 break-words px-3 py-4 text-sm font-medium text-ink sm:px-4">{row.name}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700 sm:px-4">{row.leaderName || '—'}</td>
              <td className="px-3 py-4 sm:px-4">
                {row.iconUrl ? (
                  <img
                    src={row.iconUrl}
                    alt=""
                    className="h-10 w-10 rounded-lg border border-line object-cover"
                  />
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-700 sm:px-4">
                {row.projectCount}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-700 sm:px-4">
                {row.mentorCount}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-700 sm:px-4">
                {row.studentCount}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-700 sm:px-4">
                ¥{formatMoney(row.totalStudentEarnings)}
              </td>
              <td className="px-3 py-4 sm:px-4">
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(row.status)}`}>
                  {SECT_GUILD_STATUS_LABEL[row.status]}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600 sm:px-4">
                {formatLocal(row.createdAt)}
              </td>
              <td className={tableCellAction}>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(row)}
                    className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(row)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50/80 px-2.5 py-1.5 text-xs font-medium text-red-700 shadow-sm transition-colors hover:bg-red-100/80"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    删除
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

export function SectGuildDrawerFields({
  form,
  onPatch,
}: {
  form: SectGuildFormState;
  onPatch: (p: Partial<SectGuildFormState>) => void;
}) {
  const [introTab, setIntroTab] = useState<SectIntroTabKey>('communityIntro');
  const block: SectIntroBlock = form.intro[introTab];

  const patchIntro = (tab: SectIntroTabKey, partial: Partial<SectIntroBlock>) => {
    onPatch({
      intro: {
        ...form.intro,
        [tab]: { ...form.intro[tab], ...partial },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
          门派名称
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className={inputClass}
          value={form.name}
          onChange={(e) => onPatch({ name: e.target.value })}
          placeholder="请输入门派名称"
        />
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
          门派负责人
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className={inputClass}
          value={form.leaderName}
          onChange={(e) => onPatch({ leaderName: e.target.value })}
          placeholder="负责人姓名"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">门派 icon</label>
        <input
          type="text"
          className={inputClass}
          value={form.iconUrl}
          onChange={(e) => onPatch({ iconUrl: e.target.value })}
          placeholder="图片 URL"
        />
        {form.iconUrl ? (
          <img src={form.iconUrl} alt="" className="mt-1 h-14 w-14 rounded-lg border border-line object-cover" />
        ) : null}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-800">门派介绍</p>
        <div className="flex flex-wrap gap-1 rounded-xl bg-gray-200/50 p-1">
          {SECT_INTRO_TAB_KEYS.map((key) => {
            const active = introTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setIntroTab(key)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  active ? 'bg-white text-accent shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {SECT_INTRO_TAB_LABEL[key]}
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-line bg-gray-50/40 p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">标题</label>
            <input
              type="text"
              className={inputClass}
              value={block.title}
              onChange={(e) => patchIntro(introTab, { title: e.target.value })}
              placeholder="板块标题"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">描述</label>
            <textarea
              className={`${inputClass} min-h-[72px] resize-y`}
              value={block.description}
              onChange={(e) => patchIntro(introTab, { description: e.target.value })}
              placeholder="板块描述"
            />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700">是否显示</span>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  className="accent-accent"
                  checked={block.visible}
                  onChange={() => patchIntro(introTab, { visible: true })}
                />
                显示
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  className="accent-accent"
                  checked={!block.visible}
                  onChange={() => patchIntro(introTab, { visible: false })}
                />
                隐藏
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700">文案内容</span>
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name={`sect-content-${introTab}`}
                  className="accent-accent"
                  checked={block.contentKind === 'richText'}
                  onChange={() => patchIntro(introTab, { contentKind: 'richText' })}
                />
                图文（富文本）
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name={`sect-content-${introTab}`}
                  className="accent-accent"
                  checked={block.contentKind === 'video'}
                  onChange={() => patchIntro(introTab, { contentKind: 'video' })}
                />
                视频
              </label>
            </div>
            {block.contentKind === 'richText' ? (
              <RichTextEditor
                value={block.richTextHtml}
                onChange={(html) => patchIntro(introTab, { richTextHtml: html })}
              />
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  className={inputClass}
                  value={block.videoUrl}
                  onChange={(e) => patchIntro(introTab, { videoUrl: e.target.value })}
                  placeholder="视频地址（mp4 等）"
                />
                {block.videoUrl ? (
                  <video
                    controls
                    className="mt-2 max-h-48 w-full rounded-lg border border-line bg-black"
                    src={block.videoUrl}
                  >
                    您的浏览器不支持视频播放
                  </video>
                ) : (
                  <p className="text-xs text-gray-400">填写地址后下方预览</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
