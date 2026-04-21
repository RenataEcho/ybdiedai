/**
 * 用户端需求原型 —— 展示各业务线下已加入菜单的移动端（H5）设计原型
 * 样式：历史记录列表 + iPhone 16 Pro 外框实时预览
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone, Monitor, Clock, Layers, Zap, Globe,
  Rocket, TrendingUp, Users, GraduationCap, Cpu, Bot,
  ChevronRight, ExternalLink,
} from 'lucide-react';
import {
  loadPrototypes,
  type SavedPrototype,
  type PrototypeProductLine,
  PRODUCT_LINE_LABEL,
} from './savedPrototypesModel';

// ─── Constants ────────────────────────────────────────────────────────────────

const IPHONE16PRO_W = 393;
const IPHONE16PRO_H = 852;

const COLORS: Record<PrototypeProductLine, string> = {
  youbao: '#6366f1',
  youboom: '#0ea5e9',
  mentor: '#22c55e',
};

const PLACEHOLDER_ICONS = [Monitor, Layers, Zap, Globe, Rocket, TrendingUp, Users, GraduationCap, Cpu, Bot];

function getPlaceholderIcon(id: string) {
  const idx = id.charCodeAt(0) % PLACEHOLDER_ICONS.length;
  return PLACEHOLDER_ICONS[idx];
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString('zh-CN', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  productLine: PrototypeProductLine;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UserPrototypePage({ productLine }: Props) {
  const all = useMemo(() => loadPrototypes(), []);

  // 过滤：当前业务线 + 移动端设计 + 已加入菜单（有 menuPath）
  const mobileProtos = useMemo(
    () =>
      all
        .filter(
          (p) =>
            p.productLine === productLine &&
            p.designMode === 'mobile' &&
            !!p.menuPath,
        )
        .sort((a, b) => b.createdAt - a.createdAt),
    [all, productLine],
  );

  const [selected, setSelected] = useState<SavedPrototype | null>(null);

  const activeProto = selected ?? mobileProtos[0] ?? null;
  const color = COLORS[productLine];

  // ── 空态 ──
  if (mobileProtos.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-gray-50 dark:bg-white/2"
        style={{ height: 'calc(100vh - 120px)' }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: `${color}15` }}
        >
          <Smartphone className="w-8 h-8" style={{ color }} />
        </div>
        <p className="text-base font-semibold text-ink mb-1">暂无用户端原型</p>
        <p className="text-sm text-gray-400 dark:text-white/30 text-center max-w-xs leading-relaxed">
          在「需求原型设计」中选择「移动端（H5）」模式，生成原型后点击「加入菜单」即可在此查看。
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex gap-4"
      style={{ height: 'calc(100vh - 120px)' }}
    >
      {/* ── 左侧历史记录列表 ── */}
      <div className="w-64 shrink-0 flex flex-col gap-1.5 overflow-y-auto pr-1">
        {/* 头部标签 */}
        <div className="flex items-center gap-2 px-1 mb-1 shrink-0">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ background: `${color}18` }}
          >
            <Smartphone className="w-3 h-3" style={{ color }} />
          </div>
          <span className="text-[11px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wide">
            {PRODUCT_LINE_LABEL[productLine]} · {mobileProtos.length} 个原型
          </span>
        </div>

        {mobileProtos.map((proto, idx) => {
          const isActive = (selected ? selected.id === proto.id : idx === 0);
          const PlaceholderIcon = getPlaceholderIcon(proto.id);

          return (
            <motion.div
              key={proto.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
              onClick={() => setSelected(proto)}
              className={`group flex items-start gap-3 px-3 py-3 rounded-xl border cursor-pointer transition-all shrink-0 ${
                isActive
                  ? 'border-sky-400/40 bg-sky-500/6 shadow-sm'
                  : 'border-line hover:border-sky-400/25 bg-white dark:bg-white/2 hover:bg-sky-50/50 dark:hover:bg-white/4'
              }`}
            >
              {/* 图标 */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg,${color},#8b5cf6)`
                    : `${color}18`,
                }}
              >
                <PlaceholderIcon
                  className="w-5 h-5"
                  style={{ color: isActive ? '#fff' : color }}
                />
              </div>

              {/* 文字信息 */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-ink'}`}>
                  {proto.name}
                </p>
                {proto.menuPath && (
                  <p className="text-[10px] text-gray-400 dark:text-white/30 truncate mt-0.5 flex items-center gap-1">
                    <ChevronRight className="w-2.5 h-2.5 shrink-0" />
                    {proto.menuPath}
                  </p>
                )}
                <p className="text-[10px] text-gray-400 dark:text-white/25 mt-1 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 shrink-0" />
                  {formatDate(proto.createdAt)}
                </p>
              </div>

              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 mt-1.5" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── 右侧 iPhone 16 Pro 预览区 ── */}
      <div className="flex-1 min-w-0 flex flex-col rounded-2xl border border-line overflow-hidden">
        {activeProto ? (
          <>
            {/* 顶部工具栏 */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-line bg-gray-50 dark:bg-white/3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${color}18` }}
                >
                  <Smartphone className="w-4 h-4" style={{ color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{activeProto.name}</p>
                  {activeProto.menuPath && (
                    <p className="text-[10px] text-gray-400 dark:text-white/30 flex items-center gap-1">
                      <ChevronRight className="w-2.5 h-2.5" />
                      {activeProto.menuPath}
                    </p>
                  )}
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-sky-500/10 text-sky-500 border border-sky-500/20 shrink-0">
                  iPhone 16 Pro
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const w = window.open('', '_blank');
                  if (w) {
                    w.document.write(activeProto.html);
                    w.document.close();
                  }
                }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-line text-gray-500 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors cursor-pointer shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                新窗口打开
              </button>
            </div>

            {/* iPhone 预览区 */}
            <div
              className="flex-1 min-h-0 flex items-center justify-center overflow-hidden"
              style={{ background: 'linear-gradient(135deg,#f0f4ff 0%,#e8f4f8 50%,#f4f0ff 100%)' }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeProto.id}
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -8 }}
                  transition={{ duration: 0.2 }}
                  style={{ flexShrink: 0 }}
                >
                  {/* 手机壳外框 */}
                  <IPhoneShell html={activeProto.html} name={activeProto.name} />
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-400 dark:text-white/25">请从左侧选择一条原型记录</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── iPhone Shell Component ───────────────────────────────────────────────────

function IPhoneShell({ html, name }: { html: string; name?: string }) {
  // 根据容器高度自动缩放，最大不超过原始尺寸
  const SHELL_W = IPHONE16PRO_W + 28;
  const SHELL_H = IPHONE16PRO_H + 60;

  // 固定展示：最大高度 = 容器高度(calc(100vh - 200px))，保持比例
  // 直接使用固定比例缩放让手机壳适应视口
  const maxH = typeof window !== 'undefined' ? window.innerHeight - 200 : 700;
  const scale = Math.min(1, maxH / SHELL_H);

  return (
    <div
      style={{
        width: SHELL_W * scale,
        height: SHELL_H * scale,
        position: 'relative',
      }}
    >
      {/* 实际手机壳（不缩放，用 transform 缩放） */}
      <div
        style={{
          width: SHELL_W,
          height: SHELL_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {/* 手机外壳 */}
        <div
          style={{
            width: SHELL_W,
            height: SHELL_H,
            borderRadius: 52,
            background: 'linear-gradient(145deg,#2d2d31 0%,#1a1a1d 40%,#2d2d31 100%)',
            boxShadow: '0 0 0 1.5px rgba(255,255,255,0.13), 0 40px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.09)',
            padding: '10px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* 侧边按钮装饰（左） */}
          <div style={{ position: 'absolute', left: -4, top: 120, width: 4, height: 36, borderRadius: '2px 0 0 2px', background: '#222' }} />
          <div style={{ position: 'absolute', left: -4, top: 168, width: 4, height: 60, borderRadius: '2px 0 0 2px', background: '#222' }} />
          <div style={{ position: 'absolute', left: -4, top: 240, width: 4, height: 60, borderRadius: '2px 0 0 2px', background: '#222' }} />
          {/* 侧边按钮装饰（右） */}
          <div style={{ position: 'absolute', right: -4, top: 160, width: 4, height: 80, borderRadius: '0 2px 2px 0', background: '#222' }} />

          {/* 灵动岛 */}
          <div
            style={{
              width: 126,
              height: 36,
              borderRadius: 20,
              background: '#050505',
              position: 'absolute',
              top: 18,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
            }}
          />

          {/* 屏幕 */}
          <div
            style={{
              width: IPHONE16PRO_W,
              height: IPHONE16PRO_H,
              borderRadius: 44,
              overflow: 'hidden',
              background: '#000',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <iframe
              title={name ?? 'H5 原型预览'}
              srcDoc={html}
              style={{
                width: IPHONE16PRO_W,
                height: IPHONE16PRO_H,
                border: 'none',
                display: 'block',
              }}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>

          {/* Home 指示条 */}
          <div
            style={{
              width: 134,
              height: 5,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.28)',
              position: 'absolute',
              bottom: 14,
            }}
          />
        </div>
      </div>
    </div>
  );
}
