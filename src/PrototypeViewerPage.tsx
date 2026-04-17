import { useState } from 'react';
import { ArrowLeft, Maximize2, Minimize2, Copy, Check, Trash2, Code2 } from 'lucide-react';
import { type SavedPrototype, PRODUCT_LINE_LABEL } from './savedPrototypesModel';

const PRODUCT_LINE_COLORS = {
  youbao: '#6366f1',
  youboom: '#0ea5e9',
  mentor: '#22c55e',
} as const;

type Props = {
  proto: SavedPrototype;
  onBack: () => void;
  onDelete: (id: string) => void;
};

export default function PrototypeViewerPage({ proto, onBack, onDelete }: Props) {
  const [fullscreen, setFullscreen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const color = PRODUCT_LINE_COLORS[proto.productLine];

  const handleCopy = () => {
    navigator.clipboard.writeText(proto.html).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDelete = () => {
    onDelete(proto.id);
    onBack();
  };

  return (
    <div className={`flex flex-col ${fullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-[#0f1117]' : 'h-[calc(100vh-100px)]'}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-white dark:bg-white/2 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/80 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
          <div className="w-px h-4 bg-line" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink">{proto.name}</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: `${color}15`, color }}
            >
              {PRODUCT_LINE_LABEL[proto.productLine]}
            </span>
          </div>
          {proto.description && (
            <span className="text-xs text-gray-400 dark:text-white/30 hidden lg:block">· {proto.description}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCode((v) => !v)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              showCode
                ? 'border-accent/40 text-accent bg-accent/8'
                : 'border-line text-gray-500 dark:text-white/40 hover:text-gray-800 dark:hover:text-white/70 hover:bg-gray-100 dark:hover:bg-white/8'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            {showCode ? '隐藏代码' : '查看代码'}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-line text-gray-500 dark:text-white/40 hover:text-gray-800 dark:hover:text-white/70 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '已复制' : '复制 HTML'}
          </button>
          <button
            type="button"
            onClick={() => setFullscreen((v) => !v)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-line text-gray-500 dark:text-white/40 hover:text-gray-800 dark:hover:text-white/70 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors cursor-pointer"
          >
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            {fullscreen ? '退出全屏' : '全屏查看'}
          </button>
          {deleteConfirm ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-red-500">确认删除？</span>
              <button
                type="button"
                onClick={handleDelete}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500 text-white cursor-pointer font-medium"
              >
                删除
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-line text-gray-500 cursor-pointer"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-line text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/30 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              删除
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex gap-0">
        {/* Preview */}
        <div className={`flex-1 min-h-0 ${showCode ? 'border-r border-line' : ''}`}>
          <iframe
            title={proto.name}
            srcDoc={proto.html}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>

        {/* Code panel */}
        {showCode && (
          <div className="w-96 shrink-0 flex flex-col bg-gray-950 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/8 flex items-center justify-between shrink-0">
              <span className="text-xs font-medium text-white/50 font-mono">HTML</span>
              <span className="text-xs text-white/30">{proto.html.length.toLocaleString()} chars</span>
            </div>
            <pre className="flex-1 min-h-0 overflow-auto p-4 text-[11px] font-mono text-green-300/80 leading-relaxed whitespace-pre-wrap break-all">
              {proto.html}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
