import { useLayoutEffect, useRef } from 'react';
import { Bold, Italic, List, Link as LinkIcon } from 'lucide-react';

export function RichTextEditor({
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
