import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Film, ImagePlus } from 'lucide-react';
import type {
  OnlineState,
  ProjectCategory,
  ProjectDetailBlockKey,
  ProjectDetailContentType,
  ProjectDetailSectionState,
  ProjectIntroSubKey,
  ProjectManagementFormState,
} from './projectManagementModel';
import {
  PROJECT_CATEGORY_LABEL,
  PROJECT_DETAIL_BLOCK_LABEL,
  PROJECT_INTRO_SUB_LABEL,
  normalizeProjectManagementDetail,
} from './projectManagementModel';
import { RichTextEditor } from './RichTextEditor';

const inputClass =
  'w-full min-w-0 rounded-lg border border-line bg-white px-3 py-2 text-sm shadow-sm outline-none transition-shadow focus:border-accent/40 focus:ring-2 focus:ring-accent/15';

/** 随容器宽度自动增加列数；单列最小宽度略增，避免标签与控件互相遮挡 */
const compactGrid =
  'grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,12.25rem),1fr))]';

/** 素材字段占满行宽，避免缩略图与按钮在窄格内叠压 */
const mediaStack = 'flex flex-col gap-4';

type PmTabId = 'base' | 'media' | 'display' | 'member' | 'capability' | 'detail';

const PM_TABS: { id: PmTabId; label: string }[] = [
  { id: 'base', label: '基础信息' },
  { id: 'detail', label: '详情介绍' },
  { id: 'media', label: '素材' },
  { id: 'display', label: '展示推广' },
  { id: 'member', label: '会员前台' },
  { id: 'capability', label: '能力标识' },
];

const DETAIL_BLOCK_KEYS: ProjectDetailBlockKey[] = ['introduction', 'process', 'notice', 'teaching'];

const INTRO_SUB_KEYS: ProjectIntroSubKey[] = [
  'projectDescription',
  'keywordRequirements',
  'backfill',
  'order',
  'settlement',
];

function DetailSubTabs({
  active,
  onChange,
}: {
  active: ProjectDetailBlockKey;
  onChange: (k: ProjectDetailBlockKey) => void;
}) {
  return (
    <div className="rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-line/50">
      <div className="flex flex-wrap gap-1">
        {DETAIL_BLOCK_KEYS.map((k) => {
          const on = active === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => onChange(k)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                on
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {PROJECT_DETAIL_BLOCK_LABEL[k]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function IntroSubTabs({
  active,
  onChange,
}: {
  active: ProjectIntroSubKey;
  onChange: (k: ProjectIntroSubKey) => void;
}) {
  return (
    <div className="rounded-lg bg-gray-100/90 p-1 ring-1 ring-line/40">
      <div className="flex gap-0.5 overflow-x-auto overflow-y-hidden [scrollbar-width:thin]">
        {INTRO_SUB_KEYS.map((k) => {
          const on = active === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => onChange(k)}
              className={`shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                on ? 'bg-white text-accent shadow-sm ring-1 ring-line/60' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {PROJECT_INTRO_SUB_LABEL[k]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DetailVideoUploadField({
  value,
  onChange,
  embedded,
}: {
  value: string;
  onChange: (url: string) => void;
  /** 与左侧「内容」标签组合时隐藏内部标题与底部说明 */
  embedded?: boolean;
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
      {!embedded ? (
        <label className="text-sm font-medium text-gray-700">内容（视频）</label>
      ) : null}
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={pick} />
      <div className="flex flex-col gap-3">
        <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-xl border border-line bg-gray-950">
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
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <Film className="h-4 w-4 shrink-0 text-accent" aria-hidden />
            上传视频
          </button>
          {value ? (
            <button type="button" onClick={clear} className="w-fit text-left text-xs text-red-600 hover:underline">
              清除视频
            </button>
          ) : null}
        </div>
      </div>
      {!embedded ? (
        <p className="text-[11px] leading-relaxed text-gray-400">
          演示环境上传生成本机 blob 地址；生产环境可对接对象存储后写入正式 URL。
        </p>
      ) : null}
    </div>
  );
}

function patchDetailSectionContentType(
  prev: ProjectDetailSectionState,
  next: ProjectDetailContentType,
  onPatchSection: (p: Partial<ProjectDetailSectionState>) => void
) {
  if (next === prev.contentType) return;
  if (prev.content.startsWith('blob:')) URL.revokeObjectURL(prev.content);
  if (next === 'article') {
    onPatchSection({ contentType: 'article', content: '<p><br></p>' });
  } else {
    onPatchSection({ contentType: 'video', content: '' });
  }
}

function DetailSectionEditor({
  radioSuffix,
  section,
  onPatchSection,
}: {
  radioSuffix: string;
  section: ProjectDetailSectionState;
  onPatchSection: (p: Partial<ProjectDetailSectionState>) => void;
}) {
  const radioName = `pm-detail-ct-${radioSuffix}`;
  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <div className="grid gap-2.5 sm:grid-cols-2">
        <FieldRow label="标题">
          <input
            type="text"
            className={inputClass}
            value={section.title}
            onChange={(e) => onPatchSection({ title: e.target.value })}
            placeholder="板块标题"
          />
        </FieldRow>
        <InlineRadios
          label="是否显示"
          name={`pm-detail-vis-${radioSuffix}`}
          value={section.visible}
          onChange={(v) => onPatchSection({ visible: v })}
          options={
            [
              { v: 'yes' as const, text: '是' },
              { v: 'no' as const, text: '否' },
            ] as const
          }
        />
      </div>
      <FieldRow label="描述" alignTop>
        <textarea
          className={`${inputClass} min-h-[5rem] resize-y`}
          rows={3}
          value={section.description}
          onChange={(e) => onPatchSection({ description: e.target.value })}
          placeholder="板块说明或摘要"
        />
      </FieldRow>
      <InlineRadios
        label="内容类型"
        name={radioName}
        value={section.contentType}
        onChange={(v) => patchDetailSectionContentType(section, v, onPatchSection)}
        options={
          [
            { v: 'article' as const, text: '图文' },
            { v: 'video' as const, text: '视频' },
          ] as const
        }
      />
      <FieldRow label="内容" alignTop>
        {section.contentType === 'article' ? (
          <RichTextEditor value={section.content} onChange={(html) => onPatchSection({ content: html })} />
        ) : (
          <DetailVideoUploadField embedded value={section.content} onChange={(url) => onPatchSection({ content: url })} />
        )}
      </FieldRow>
    </div>
  );
}

function TabBar({ active, onChange }: { active: PmTabId; onChange: (id: PmTabId) => void }) {
  return (
    <div
      className="sticky top-0 z-10 -mx-1 mb-3 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line bg-white/95 pb-3 backdrop-blur-sm [scrollbar-width:thin]"
      role="tablist"
      aria-label="项目表单分区"
    >
      {PM_TABS.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              on
                ? 'bg-accent/12 text-accent ring-1 ring-accent/25'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/** 标签紧贴控件左侧：左对齐、窄间距，无预留空白栏 */
function FieldRow({
  label,
  hint,
  children,
  alignTop,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  alignTop?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 gap-1 rounded-lg border border-line/80 bg-white px-2 py-1.5 shadow-sm ${
        alignTop ? 'items-start' : 'min-h-[2.25rem] items-center'
      }`}
    >
      <label
        className={`shrink-0 whitespace-nowrap text-left text-xs font-semibold text-gray-600 ${alignTop ? 'pt-2' : ''}`}
        title={hint ?? undefined}
      >
        {label}
      </label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function ImagePickField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
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
    <div className="min-w-0 rounded-lg border border-line/80 bg-white p-3 shadow-sm">
      <div className="mb-2 text-xs font-semibold text-gray-700">{label}</div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={pick} />
      <div className="flex flex-wrap items-start gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-gray-50">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-1 text-center text-[11px] text-gray-400">
              未上传
            </div>
          )}
        </div>
        <div className="flex min-w-[8rem] flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-line bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-100"
          >
            <ImagePlus className="h-4 w-4 shrink-0 text-accent" aria-hidden />
            <span className="whitespace-nowrap">上传图片</span>
          </button>
          {value ? (
            <button type="button" onClick={clear} className="w-fit text-left text-xs text-red-600 hover:underline">
              清除图片
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InlineRadios<T extends string>({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly { v: T; text: string }[];
}) {
  return (
    <div className="flex min-h-[2.25rem] min-w-0 items-center gap-1 rounded-lg border border-line/80 bg-white px-2 py-1.5 shadow-sm">
      <span className="shrink-0 whitespace-nowrap text-left text-xs font-semibold text-gray-600">{label}</span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
        {options.map(({ v, text }) => (
          <label key={String(v)} className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name={name}
              className="accent-accent h-3.5 w-3.5 shrink-0"
              checked={value === v}
              onChange={() => onChange(v)}
            />
            <span className="text-sm text-gray-800">{text}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function CompactStepper({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
}) {
  return (
    <div className="flex min-h-[2.25rem] min-w-0 items-center gap-1 rounded-lg border border-line/80 bg-white px-2 py-1.5 shadow-sm">
      <span className="shrink-0 whitespace-nowrap text-left text-xs font-semibold text-gray-600">{label}</span>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          className="shrink-0 rounded-lg border border-line bg-gray-50 px-2.5 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-100"
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          −
        </button>
        <input
          type="number"
          className={`${inputClass} w-0 flex-1 text-center font-mono tabular-nums`}
          value={Number.isFinite(value) ? value : 0}
          min={min}
          onChange={(e) => onChange(parseInt(e.target.value, 10) || min)}
        />
        <button
          type="button"
          className="shrink-0 rounded-lg border border-line bg-gray-50 px-2.5 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-100"
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function ProjectManagementDrawerFields({
  form,
  onPatch,
  memberTypeOptions,
}: {
  form: ProjectManagementFormState;
  onPatch: (p: Partial<ProjectManagementFormState>) => void;
  memberTypeOptions: string[];
}) {
  const memberChoices = Array.from(new Set(['普通会员', '高级会员', ...memberTypeOptions]));
  const [tab, setTab] = useState<PmTabId>('base');
  const [detailBlock, setDetailBlock] = useState<ProjectDetailBlockKey>('introduction');
  const [introSub, setIntroSub] = useState<ProjectIntroSubKey>('projectDescription');
  const detailSafe = normalizeProjectManagementDetail(form.detail ?? null);

  return (
    <div className="flex min-h-0 min-w-0 flex-col pb-2">
      <TabBar active={tab} onChange={setTab} />

      {tab === 'base' && (
        <div className={compactGrid}>
          <FieldRow label="所属分类">
            <select
              className={inputClass}
              value={form.category}
              onChange={(e) => onPatch({ category: e.target.value as ProjectCategory })}
            >
              {(Object.keys(PROJECT_CATEGORY_LABEL) as ProjectCategory[]).map((k) => (
                <option key={k} value={k}>
                  {PROJECT_CATEGORY_LABEL[k]}
                </option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label="排序">
            <input
              type="number"
              className={inputClass}
              value={form.sort}
              onChange={(e) => onPatch({ sort: parseInt(e.target.value, 10) || 0 })}
            />
          </FieldRow>
          <FieldRow label="虚拟收益">
            <input
              type="number"
              className={inputClass}
              value={form.virtualIncome}
              onChange={(e) => onPatch({ virtualIncome: parseFloat(e.target.value) || 0 })}
            />
          </FieldRow>
          <FieldRow label="爆单排序">
            <input
              type="text"
              className={inputClass}
              value={form.boomSort}
              onChange={(e) => onPatch({ boomSort: e.target.value })}
            />
          </FieldRow>
          <FieldRow label="项目标签">
            <input
              type="text"
              className={inputClass}
              value={form.projectTags}
              onChange={(e) => onPatch({ projectTags: e.target.value })}
            />
          </FieldRow>
          <FieldRow label="标签标题" hint="可选">
            <input
              type="text"
              className={inputClass}
              value={form.tagTitle}
              onChange={(e) => onPatch({ tagTitle: e.target.value })}
              placeholder="可选"
            />
          </FieldRow>
          <FieldRow label="前端标题">
            <input
              type="text"
              className={inputClass}
              value={form.frontTitle}
              onChange={(e) => onPatch({ frontTitle: e.target.value })}
              placeholder="前台展示"
            />
          </FieldRow>
          <FieldRow label="后台标题">
            <input
              type="text"
              className={inputClass}
              value={form.backTitle}
              onChange={(e) => onPatch({ backTitle: e.target.value })}
              placeholder="后台列表"
            />
          </FieldRow>
          <FieldRow label="书单链接">
            <input
              type="text"
              className={inputClass}
              value={form.booklistLink}
              onChange={(e) => onPatch({ booklistLink: e.target.value })}
            />
          </FieldRow>
          <FieldRow label="订单备注">
            <input
              type="text"
              className={inputClass}
              value={form.orderRemark}
              onChange={(e) => onPatch({ orderRemark: e.target.value })}
            />
          </FieldRow>
        </div>
      )}

      {tab === 'media' && (
        <div className={mediaStack}>
          <ImagePickField label="项目图标" value={form.projectIcon} onChange={(url) => onPatch({ projectIcon: url })} />
          <ImagePickField label="图章" value={form.stampUrl} onChange={(url) => onPatch({ stampUrl: url })} />
        </div>
      )}

      {tab === 'display' && (
        <div className={compactGrid}>
          <InlineRadios
            label="开启转赠"
            name="pm-transfer"
            value={form.transferGift}
            onChange={(v) => onPatch({ transferGift: v })}
            options={
              [
                { v: 'on' as const, text: '开启' },
                { v: 'off' as const, text: '不开启' },
              ] as const
            }
          />
          <InlineRadios
            label="项目状态"
            name="pm-status"
            value={form.projectStatus}
            onChange={(v) => onPatch({ projectStatus: v })}
            options={
              [
                { v: 'show' as const, text: '显示' },
                { v: 'hide' as const, text: '隐藏' },
              ] as const
            }
          />
          <InlineRadios
            label="热门项目"
            name="pm-hot"
            value={form.hotProject}
            onChange={(v) => onPatch({ hotProject: v })}
            options={
              [
                { v: 'yes' as const, text: '是' },
                { v: 'no' as const, text: '否' },
              ] as const
            }
          />
          <InlineRadios
            label="是否新品"
            name="pm-newp"
            value={form.isNewProduct}
            onChange={(v) => onPatch({ isNewProduct: v })}
            options={
              [
                { v: 'yes' as const, text: '是' },
                { v: 'no' as const, text: '否' },
              ] as const
            }
          />
          <InlineRadios
            label="是否下线"
            name="pm-online"
            value={form.onlineState}
            onChange={(v) => onPatch({ onlineState: v as OnlineState })}
            options={
              [
                { v: 'online' as const, text: '上线' },
                { v: 'offline' as const, text: '下线' },
              ] as const
            }
          />
          <InlineRadios
            label="微信推送"
            name="pm-wx"
            value={form.wechatPush}
            onChange={(v) => onPatch({ wechatPush: v })}
            options={
              [
                { v: 'yes' as const, text: '是' },
                { v: 'no' as const, text: '否' },
              ] as const
            }
          />
          <InlineRadios
            label="禁止提词"
            name="pm-forbid"
            value={form.forbidPromptWords}
            onChange={(v) => onPatch({ forbidPromptWords: v })}
            options={
              [
                { v: 'yes' as const, text: '是' },
                { v: 'no' as const, text: '否' },
              ] as const
            }
          />
          <InlineRadios
            label="爆单榜"
            name="pm-boomlist"
            value={form.boomListVisible}
            onChange={(v) => onPatch({ boomListVisible: v })}
            options={
              [
                { v: 'show' as const, text: '显示' },
                { v: 'hide' as const, text: '隐藏' },
              ] as const
            }
          />
          <InlineRadios
            label="搜索量"
            name="pm-searchvol"
            value={form.searchVolumeVisible}
            onChange={(v) => onPatch({ searchVolumeVisible: v })}
            options={
              [
                { v: 'show' as const, text: '显示' },
                { v: 'hide' as const, text: '隐藏' },
              ] as const
            }
          />
          <FieldRow label="过期天数">
            <input
              type="number"
              className={inputClass}
              value={form.expireDays}
              min={0}
              onChange={(e) => onPatch({ expireDays: parseInt(e.target.value, 10) || 0 })}
            />
          </FieldRow>
          <CompactStepper
            label="限制题词"
            value={form.limitPromptWords}
            onChange={(n) => onPatch({ limitPromptWords: n })}
            min={0}
          />
        </div>
      )}

      {tab === 'member' && (
        <div className={compactGrid}>
          <InlineRadios
            label="是否回填"
            name="pm-back"
            value={form.isBackfill}
            onChange={(v) => onPatch({ isBackfill: v })}
            options={
              [
                { v: 'yes' as const, text: '是' },
                { v: 'no' as const, text: '否' },
              ] as const
            }
          />
          <InlineRadios
            label="首页展示"
            name="pm-home"
            value={form.homeDisplay}
            onChange={(v) => onPatch({ homeDisplay: v })}
            options={
              [
                { v: 'yes' as const, text: '是' },
                { v: 'no' as const, text: '否' },
              ] as const
            }
          />
          <FieldRow label="会员类型" hint="含接口返回的会员名称（演示合并）">
            <select
              className={inputClass}
              value={form.memberType}
              onChange={(e) => onPatch({ memberType: e.target.value })}
            >
              {memberChoices.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </FieldRow>
          <InlineRadios
            label="会员可见"
            name="pm-mvis"
            value={form.memberVisible}
            onChange={(v) => onPatch({ memberVisible: v })}
            options={
              [
                { v: 'yes' as const, text: '是' },
                { v: 'no' as const, text: '否' },
              ] as const
            }
          />
          <InlineRadios
            label="会员可做"
            name="pm-mdo"
            value={form.memberCanDo}
            onChange={(v) => onPatch({ memberCanDo: v })}
            options={
              [
                { v: 'yes' as const, text: '是' },
                { v: 'no' as const, text: '否' },
              ] as const
            }
          />
          <InlineRadios
            label="后台隐藏"
            name="pm-admh"
            value={form.adminHidden}
            onChange={(v) => onPatch({ adminHidden: v })}
            options={
              [
                { v: 'yes' as const, text: '是' },
                { v: 'no' as const, text: '否' },
              ] as const
            }
          />
          <InlineRadios
            label="是否头条"
            name="pm-tt"
            value={form.isToutiao}
            onChange={(v) => onPatch({ isToutiao: v })}
            options={
              [
                { v: 'yes' as const, text: '是' },
                { v: 'no' as const, text: '否' },
              ] as const
            }
          />
        </div>
      )}

      {tab === 'capability' && (
        <div className={compactGrid}>
          <FieldRow label="项目英文">
            <input
              type="text"
              className={inputClass}
              value={form.projectEn}
              onChange={(e) => onPatch({ projectEn: e.target.value })}
            />
          </FieldRow>
          <InlineRadios
            label="短剧推文"
            name="pm-sdt"
            value={form.shortDramaTweet}
            onChange={(v) => onPatch({ shortDramaTweet: v })}
            options={
              [
                { v: 'yes' as const, text: '是' },
                { v: 'no' as const, text: '否' },
              ] as const
            }
          />
          <InlineRadios
            label="官方提词"
            name="pm-off"
            value={form.officialPrompts}
            onChange={(v) => onPatch({ officialPrompts: v })}
            options={
              [
                { v: 'yes' as const, text: '是' },
                { v: 'no' as const, text: '否' },
              ] as const
            }
          />
          <InlineRadios
            label="是否书籍"
            name="pm-book"
            value={form.isBook}
            onChange={(v) => onPatch({ isBook: v })}
            options={
              [
                { v: 'yes' as const, text: '是' },
                { v: 'no' as const, text: '否' },
              ] as const
            }
          />
          <InlineRadios
            label="是否批量"
            name="pm-batch"
            value={form.isBatch}
            onChange={(v) => onPatch({ isBatch: v })}
            options={
              [
                { v: 'yes' as const, text: '是' },
                { v: 'no' as const, text: '否' },
              ] as const
            }
          />
          <InlineRadios
            label="是否开白"
            name="pm-white"
            value={form.isWhitelist}
            onChange={(v) => onPatch({ isWhitelist: v })}
            options={
              [
                { v: 'yes' as const, text: '是' },
                { v: 'no' as const, text: '否' },
              ] as const
            }
          />
          <InlineRadios
            label="分配导师"
            name="pm-mentor"
            value={form.assignMentor}
            onChange={(v) => onPatch({ assignMentor: v })}
            options={
              [
                { v: 'yes' as const, text: '是' },
                { v: 'no' as const, text: '否' },
              ] as const
            }
          />
          <InlineRadios
            label="商单项目"
            name="pm-comm"
            value={form.isCommercial}
            onChange={(v) => onPatch({ isCommercial: v })}
            options={
              [
                { v: 'yes' as const, text: '是' },
                { v: 'no' as const, text: '否' },
              ] as const
            }
          />
          <InlineRadios
            label="是否海外"
            name="pm-os"
            value={form.isOverseas}
            onChange={(v) => onPatch({ isOverseas: v })}
            options={
              [
                { v: 'yes' as const, text: '是' },
                { v: 'no' as const, text: '否' },
              ] as const
            }
          />
          <InlineRadios
            label="版权分销原生"
            name="pm-copy"
            value={form.copyrightNative}
            onChange={(v) => onPatch({ copyrightNative: v })}
            options={
              [
                { v: 'yes' as const, text: '是' },
                { v: 'no' as const, text: '否' },
              ] as const
            }
          />
        </div>
      )}

      {tab === 'detail' && (
        <div className="min-w-0 space-y-4 rounded-xl border border-line/50 bg-gradient-to-b from-gray-50/90 to-white p-4 shadow-inner">
          <DetailSubTabs active={detailBlock} onChange={setDetailBlock} />
          {detailBlock === 'introduction' ? (
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold text-gray-500">
                  <span className="text-gray-800">{PROJECT_DETAIL_BLOCK_LABEL.introduction}</span>
                  <span className="mx-1.5 text-gray-300">/</span>
                  子模块配置
                </p>
              </div>
              <IntroSubTabs active={introSub} onChange={setIntroSub} />
              <DetailSectionEditor
                radioSuffix={`introduction-${introSub}`}
                section={detailSafe.introduction[introSub]}
                onPatchSection={(p) =>
                  onPatch({
                    detail: {
                      ...detailSafe,
                      introduction: {
                        ...detailSafe.introduction,
                        [introSub]: { ...detailSafe.introduction[introSub], ...p },
                      },
                    },
                  })
                }
              />
            </div>
          ) : (
            <DetailSectionEditor
              radioSuffix={detailBlock}
              section={detailSafe[detailBlock]}
              onPatchSection={(p) =>
                onPatch({
                  detail: {
                    ...detailSafe,
                    [detailBlock]: { ...detailSafe[detailBlock], ...p },
                  },
                })
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
