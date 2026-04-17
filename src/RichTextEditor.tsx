import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Link as LinkIcon, Image as ImageIcon,
  List, ListOrdered, ListChecks,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Code, Minus, Undo, Redo, Maximize2, Minimize2,
  ChevronDown, Quote, Upload, Globe,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   通用工具按钮
═══════════════════════════════════════════════════════════════ */
function Btn({
  onClick, active = false, disabled = false, title, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean;
  title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={[
        'inline-flex h-7 w-7 items-center justify-center rounded transition-colors',
        active ? 'bg-accent/12 text-accent' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
        disabled ? 'cursor-not-allowed opacity-35' : 'cursor-pointer',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

/* 带文字标签的按钮（用于下拉触发器） */
function BtnLabel({
  onClick, active = false, title, children,
}: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={[
        'inline-flex h-7 items-center gap-0.5 rounded px-1.5 text-xs transition-colors',
        active ? 'bg-accent/12 text-accent' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

/* 垂直分隔线 */
function Sep() {
  return <span className="mx-1 h-4 w-px flex-shrink-0 self-center bg-gray-200" />;
}

/* ═══════════════════════════════════════════════════════════════
   段落/标题 下拉
═══════════════════════════════════════════════════════════════ */
type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
type BlockType = 'paragraph' | `h${HeadingLevel}` | 'blockquote' | 'codeBlock';

const BLOCK_OPTIONS: { type: BlockType; label: string; cls?: string }[] = [
  { type: 'paragraph',  label: '正文' },
  { type: 'h1',         label: '标题 1', cls: 'text-lg font-bold' },
  { type: 'h2',         label: '标题 2', cls: 'text-base font-bold' },
  { type: 'h3',         label: '标题 3', cls: 'text-sm font-semibold' },
];

function getBlockType(editor: NonNullable<ReturnType<typeof useEditor>>): BlockType {
  if (editor.isActive('heading', { level: 1 })) return 'h1';
  if (editor.isActive('heading', { level: 2 })) return 'h2';
  if (editor.isActive('heading', { level: 3 })) return 'h3';
  if (editor.isActive('blockquote')) return 'blockquote';
  if (editor.isActive('codeBlock')) return 'codeBlock';
  return 'paragraph';
}

function applyBlock(editor: NonNullable<ReturnType<typeof useEditor>>, type: BlockType) {
  if (type === 'paragraph') { editor.chain().focus().setParagraph().run(); return; }
  if (type === 'h1') { editor.chain().focus().toggleHeading({ level: 1 }).run(); return; }
  if (type === 'h2') { editor.chain().focus().toggleHeading({ level: 2 }).run(); return; }
  if (type === 'h3') { editor.chain().focus().toggleHeading({ level: 3 }).run(); return; }
  if (type === 'blockquote') { editor.chain().focus().toggleBlockquote().run(); return; }
  if (type === 'codeBlock') { editor.chain().focus().toggleCodeBlock().run(); return; }
}

function BlockDropdown({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  const [open, setOpen] = useState(false);
  const current = BLOCK_OPTIONS.find(o => o.type === getBlockType(editor)) ?? BLOCK_OPTIONS[0];
  return (
    <div className="relative">
      <BtnLabel onClick={() => setOpen(v => !v)} title="段落格式">
        <span className="w-[3.5rem] text-left text-gray-700">{current.label}</span>
        <ChevronDown className="h-3 w-3 text-gray-400" />
      </BtnLabel>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-20 mt-0.5 w-[110px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {BLOCK_OPTIONS.map(o => (
              <button
                key={o.type}
                type="button"
                onClick={() => { applyBlock(editor, o.type); setOpen(false); }}
                className={[
                  'flex w-full items-center px-3 py-1.5 text-left hover:bg-gray-50',
                  o.cls ?? 'text-sm',
                  current.type === o.type ? 'text-accent' : 'text-gray-700',
                ].join(' ')}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   字号 下拉（通过 font-size style 实现）
═══════════════════════════════════════════════════════════════ */
const FONT_SIZES = ['12', '13', '14', '15', '16', '18', '20', '24', '28', '32', '36', '48'];

function FontSizeDropdown({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  const [open, setOpen] = useState(false);
  const cur = (editor.getAttributes('textStyle').fontSize as string | undefined)?.replace('px', '') ?? '默认';
  return (
    <div className="relative">
      <BtnLabel onClick={() => setOpen(v => !v)} title="字号">
        <span className="w-[2.8rem] text-left text-gray-600">{cur === '默认' ? '字号' : cur}</span>
        <ChevronDown className="h-3 w-3 text-gray-400" />
      </BtnLabel>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-20 mt-0.5 w-20 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => { editor.chain().focus().unsetMark('textStyle').run(); setOpen(false); }}
              className="flex w-full items-center px-3 py-1 text-xs text-gray-400 hover:bg-gray-50"
            >
              默认
            </button>
            {FONT_SIZES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  editor.chain().focus().setMark('textStyle', { fontSize: `${s}px` }).run();
                  setOpen(false);
                }}
                className={[
                  'flex w-full items-center px-3 py-1 text-xs hover:bg-gray-50',
                  cur === s ? 'text-accent font-medium' : 'text-gray-700',
                ].join(' ')}
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   文字颜色 / 高亮色 选择器
═══════════════════════════════════════════════════════════════ */
const COLOR_PRESETS = [
  '#000000', '#374151', '#6b7280', '#9ca3af',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#ec4899', '#ffffff',
];

function ColorBtn({
  label, color, isHighlight, onChange,
}: {
  label: string; color: string; isHighlight?: boolean; onChange: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        title={label}
        onClick={() => setOpen(v => !v)}
        className="inline-flex h-7 items-center gap-0.5 rounded px-1 text-gray-500 transition-colors hover:bg-gray-100"
      >
        <span className="relative text-sm font-bold leading-none" style={
          isHighlight
            ? { background: color === '#ffffff' ? 'transparent' : color, color: '#374151', padding: '0 2px', borderRadius: 2 }
            : { color: '#374151' }
        }>
          A
          {!isHighlight && (
            <span className="absolute bottom-[-2px] left-0 right-0 h-[3px] rounded-full" style={{ background: color }} />
          )}
        </span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-20 mt-0.5 rounded-lg border border-gray-200 bg-white p-2.5 shadow-lg" style={{ minWidth: 164 }}>
            <p className="mb-2 text-xs text-gray-400">{label}</p>
            <div className="grid grid-cols-7 gap-1">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() => { onChange(c); setOpen(false); }}
                  className="h-5 w-5 rounded border border-gray-200 transition-transform hover:scale-110"
                  style={{ background: c }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-xs text-gray-400">自定义</span>
              <input
                type="color"
                defaultValue={color}
                onChange={e => onChange(e.target.value)}
                className="h-5 w-8 cursor-pointer rounded border border-gray-200 p-0"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   对齐方式 下拉
═══════════════════════════════════════════════════════════════ */
const ALIGN_OPTS = [
  { v: 'left',    label: '左对齐',  Icon: AlignLeft },
  { v: 'center',  label: '居中',    Icon: AlignCenter },
  { v: 'right',   label: '右对齐',  Icon: AlignRight },
  { v: 'justify', label: '两端对齐',Icon: AlignJustify },
];

function AlignDropdown({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  const [open, setOpen] = useState(false);
  const cur = ALIGN_OPTS.find(o => editor.isActive({ textAlign: o.v })) ?? ALIGN_OPTS[0];
  const CurIcon = cur.Icon;
  return (
    <div className="relative">
      <BtnLabel onClick={() => setOpen(v => !v)} title="文字对齐">
        <CurIcon className="h-3.5 w-3.5" />
        <ChevronDown className="h-3 w-3 text-gray-400" />
      </BtnLabel>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-20 mt-0.5 w-28 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {ALIGN_OPTS.map(o => {
              const Icon = o.Icon;
              return (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => { editor.chain().focus().setTextAlign(o.v).run(); setOpen(false); }}
                  className={[
                    'flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50',
                    editor.isActive({ textAlign: o.v }) ? 'text-accent font-medium' : 'text-gray-700',
                  ].join(' ')}
                >
                  <Icon className="h-3.5 w-3.5" />{o.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   图片插入 下拉（上传 / 网络链接）
═══════════════════════════════════════════════════════════════ */
function ImageDropdown({
  onUpload, onUrl,
}: {
  onUpload: () => void;
  onUrl: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <BtnLabel onClick={() => setOpen(v => !v)} title="插入图片" active={open}>
        <ImageIcon className="h-3.5 w-3.5" />
        <ChevronDown className="h-3 w-3 text-gray-400" />
      </BtnLabel>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-20 mt-0.5 w-36 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => { setOpen(false); onUpload(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
            >
              <Upload className="h-3.5 w-3.5 text-gray-400" />
              上传本地图片
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); onUrl(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
            >
              <Globe className="h-3.5 w-3.5 text-gray-400" />
              输入图片链接
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   链接对话框
═══════════════════════════════════════════════════════════════ */
function Dialog({
  title, placeholder, defaultVal = '', onConfirm, onCancel,
}: {
  title: string; placeholder: string; defaultVal?: string;
  onConfirm: (v: string) => void; onCancel: () => void;
}) {
  const [val, setVal] = useState(defaultVal);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onCancel}>
      <div
        className="w-[340px] rounded-xl bg-white p-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <p className="mb-3 text-sm font-medium text-gray-800">{title}</p>
        <input
          autoFocus
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onConfirm(val); if (e.key === 'Escape') onCancel(); }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100">取消</button>
          <button type="button" onClick={() => onConfirm(val)}
            className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent/90">确认</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   主组件
═══════════════════════════════════════════════════════════════ */
export function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入内容…',
  minHeight = 200,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const imageFileRef = useRef<HTMLInputElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [dialog, setDialog] = useState<'link' | 'imageUrl' | null>(null);
  const [textColor, setTextColor] = useState('#374151');
  const [hlColor, setHlColor] = useState('#fef08a');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-accent underline cursor-pointer' },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: { class: 'rte-img' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  /* 外部 value → editor 同步（非聚焦时） */
  const prevValue = useRef(value);
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    if (value === prevValue.current) return;
    prevValue.current = value;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || '');
    }
  }, [editor, value]);

  /* ── 图片处理 ── */
  const insertImageFile = useCallback((file: File) => {
    if (!editor) return;
    const url = URL.createObjectURL(file);
    editor.chain().focus().setImage({ src: url, alt: file.name }).run();
  }, [editor]);

  const insertImageUrl = (url: string) => {
    if (!editor || !url.trim()) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) insertImageFile(file);
    e.target.value = '';
  };

  /* ── 拖放 & 粘贴 图片 ── */
  const handleDrop = useCallback((e: React.DragEvent) => {
    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
    if (file) { e.preventDefault(); insertImageFile(file); }
  }, [insertImageFile]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const file = Array.from(e.clipboardData.files).find(f => f.type.startsWith('image/'));
    if (file) { e.preventDefault(); insertImageFile(file); }
  }, [insertImageFile]);

  /* ── 颜色 ── */
  const applyColor = (c: string) => {
    setTextColor(c);
    editor?.chain().focus().setColor(c).run();
  };
  const applyHighlight = (c: string) => {
    setHlColor(c);
    editor?.chain().focus().setHighlight({ color: c }).run();
  };

  if (!editor) return null;

  const outer = [
    'flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white',
    fullscreen ? 'fixed inset-4 z-50 shadow-2xl' : '',
  ].join(' ');

  /* 工具栏行公共类 */
  const tbRow = 'flex flex-wrap items-center gap-0.5 border-b border-gray-100 bg-white px-2 py-1';

  return (
    <>
      {/* 隐藏的文件输入 */}
      <input
        ref={imageFileRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 链接对话框 */}
      {dialog === 'link' && (
        <Dialog
          title="插入链接"
          placeholder="https://"
          defaultVal="https://"
          onConfirm={url => {
            setDialog(null);
            if (url && url !== 'https://') editor.chain().focus().setLink({ href: url }).run();
          }}
          onCancel={() => setDialog(null)}
        />
      )}

      {/* 图片链接对话框 */}
      {dialog === 'imageUrl' && (
        <Dialog
          title="输入图片链接"
          placeholder="https://example.com/image.png"
          onConfirm={url => { setDialog(null); insertImageUrl(url); }}
          onCancel={() => setDialog(null)}
        />
      )}

      <div className={outer}>
        {/* ══════════ 工具栏第一行 ══════════
            正文▼ | " | B U I ··· | A▼ Ā▼ | 字号▼ | OL UL ☑
        */}
        <div className={tbRow}>
          <BlockDropdown editor={editor} />
          <Sep />

          {/* 引用 */}
          <Btn title="引用块" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>
            <Quote className="h-4 w-4" />
          </Btn>
          <Sep />

          {/* 字符格式 */}
          <Btn title="加粗 (⌘B)" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
            <Bold className="h-4 w-4" />
          </Btn>
          <Btn title="下划线 (⌘U)" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}>
            <UnderlineIcon className="h-4 w-4" />
          </Btn>
          <Btn title="斜体 (⌘I)" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
            <Italic className="h-4 w-4" />
          </Btn>
          <Btn title="删除线" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}>
            <Strikethrough className="h-4 w-4" />
          </Btn>
          <Sep />

          {/* 颜色 */}
          <ColorBtn label="文字颜色" color={textColor} onChange={applyColor} />
          <ColorBtn label="文字高亮" color={hlColor} isHighlight onChange={applyHighlight} />
          <Sep />

          {/* 字号 */}
          <FontSizeDropdown editor={editor} />
          <Sep />

          {/* 列表 */}
          <Btn title="有序列表" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
            <ListOrdered className="h-4 w-4" />
          </Btn>
          <Btn title="无序列表" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
            <List className="h-4 w-4" />
          </Btn>
          <Btn title="任务清单" onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')}>
            <ListChecks className="h-4 w-4" />
          </Btn>
        </div>

        {/* ══════════ 工具栏第二行 ══════════
            ≡▼ | 🔗 | 🖼▼ | </> — | ↩ ↪ | ⤢
        */}
        <div className={tbRow}>
          {/* 对齐 */}
          <AlignDropdown editor={editor} />
          <Sep />

          {/* 链接 */}
          <Btn title="插入链接" onClick={() => setDialog('link')} active={editor.isActive('link')}>
            <LinkIcon className="h-4 w-4" />
          </Btn>
          {editor.isActive('link') && (
            <Btn title="移除链接" onClick={() => editor.chain().focus().unsetLink().run()}>
              <span className="text-[11px] text-red-400 line-through font-medium">链</span>
            </Btn>
          )}
          <Sep />

          {/* ★ 图片（带下拉：上传 / 链接） */}
          <ImageDropdown
            onUpload={() => imageFileRef.current?.click()}
            onUrl={() => setDialog('imageUrl')}
          />
          <Sep />

          {/* 代码 */}
          <Btn title="代码块" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')}>
            <Code className="h-4 w-4" />
          </Btn>
          <Btn title="行内代码" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')}>
            <span className="font-mono text-[13px]">{`<>`}</span>
          </Btn>

          {/* 分割线 */}
          <Btn title="分割线" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus className="h-4 w-4" />
          </Btn>
          <Sep />

          {/* 撤销 / 重做 */}
          <Btn title="撤销 (⌘Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo className="h-4 w-4" />
          </Btn>
          <Btn title="重做 (⌘⇧Z)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo className="h-4 w-4" />
          </Btn>
          <Sep />

          {/* 全屏 */}
          <Btn title={fullscreen ? '退出全屏' : '全屏编辑'} onClick={() => setFullscreen(f => !f)}>
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Btn>
        </div>

        {/* ══════════ 编辑区 ══════════ */}
        <div
          className="relative flex-1 overflow-y-auto"
          style={{ minHeight }}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onPaste={handlePaste}
        >
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>

      {/* 全屏遮罩 */}
      {fullscreen && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setFullscreen(false)} />
      )}
    </>
  );
}
