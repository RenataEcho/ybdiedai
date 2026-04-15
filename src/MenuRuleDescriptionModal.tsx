import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { X } from 'lucide-react';
import {
  loadPageRuleLocalOverrides,
  resolveRulesForRouteKeys,
  type ResolvedPageRule,
} from './pageRuleResolve';

export type MenuRuleDescriptionModalProps = {
  open: boolean;
  navTitle: string;
  routeKeys: readonly string[];
  onClose: () => void;
};

export function MenuRuleDescriptionModal({ open, navTitle, routeKeys, onClose }: MenuRuleDescriptionModalProps) {
  const [rows, setRows] = useState<ResolvedPageRule[]>([]);

  useEffect(() => {
    if (!open) return;
    const local = loadPageRuleLocalOverrides();
    setRows(resolveRulesForRouteKeys(routeKeys, local));
  }, [open, routeKeys]);

  const sourceHint = useMemo(() => {
    if (rows.some((r) => r.source === 'local')) return '本机覆盖';
    if (rows.some((r) => r.source === 'repo')) return '仓库 / 工作区 JSON';
    return '代码内置';
  }, [rows]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 dark:bg-black/60">
      <div className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-xl bg-white dark:bg-[#1e2232] shadow-xl border border-line">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-ink">规则说明 · {navTitle}</h2>
            <p className="mt-1 text-xs text-gray-500">当前优先级：{sourceHint}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-white/8 cursor-pointer"
            aria-label="关闭"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto p-5 space-y-8">
          {rows.map((row) => (
            <section key={row.routeKey} className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line/80 pb-2">
                <h3 className="text-sm font-semibold text-gray-900">{row.effectiveMenuTitle}</h3>
                <span className="font-mono text-[10px] text-gray-400">{row.routeKey}</span>
              </div>
              <div className="space-y-3">
                {row.effectiveParagraphs.map((p, i) => (
                  <div key={i} className="rounded-lg border border-line bg-gray-50/50 dark:bg-white/4 p-3 space-y-2">
                    <div className="text-xs text-gray-500">段落 {i + 1}</div>
                    <div className="text-sm font-medium text-gray-900">{p.subheading}</div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{p.body}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line bg-white dark:bg-white/6 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:hover:bg-white/10 cursor-pointer"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

function ruleHintButtonClass(on: boolean, variant: 'sidebar' | 'title') {
  if (variant === 'title') {
    return on
      ? 'shrink-0 text-sm font-semibold text-accent hover:underline cursor-pointer select-none'
      : 'shrink-0 text-sm font-semibold text-gray-500 hover:text-accent hover:underline cursor-pointer select-none';
  }
  return on
    ? 'shrink-0 text-[10px] font-medium text-accent hover:underline px-0 py-0'
    : 'shrink-0 text-[10px] font-medium text-gray-400 hover:text-accent hover:underline px-0 py-0';
}

export function NavRuleHintButton({
  active,
  variant = 'sidebar',
  onClick,
}: {
  active?: boolean;
  /** `title`：与页面主标题并排展示 */
  variant?: 'sidebar' | 'title';
  onClick: (e: SyntheticEvent) => void;
}) {
  const fire = (e: SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(e);
  };
  return (
    <span
      role="button"
      tabIndex={0}
      className={ruleHintButtonClass(!!active, variant)}
      onClick={fire}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') fire(e);
      }}
    >
      规则说明
    </span>
  );
}
