/**
 * 用户端需求原型 —— 展示各业务线下已加入菜单的移动端（H5）设计原型
 * 样式：历史记录列表 + iPhone 16 Pro 外框实时预览
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone, Monitor, Clock, Layers, Zap, Globe,
  Rocket, TrendingUp, Users, GraduationCap, Cpu, Bot,
  ChevronRight, ExternalLink, LayoutDashboard, Copy, Check, BookOpen,
} from 'lucide-react';
import {
  loadPrototypes,
  savePrototypes,
  type SavedPrototype,
  type PrototypeProductLine,
  PRODUCT_LINE_LABEL,
} from './savedPrototypesModel';
import { MenuRuleDescriptionModal, NavRuleHintButton } from './MenuRuleDescriptionModal';

// ─── 工具函数：从 HTML 自动提取 switchState 状态标签 ─────────────────────────

function detectStateLabels(html: string): { key: string; label: string }[] {
  if (!html) return [];
  const results: { key: string; label: string }[] = [];
  const btnRegex = /onclick=["']switchState\(['"]([^'"]+)['"]\)["'][^>]*>([^<]+)<\/button>/gi;
  let m: RegExpExecArray | null;
  while ((m = btnRegex.exec(html)) !== null) {
    const key = m[1].trim();
    const label = m[2].trim();
    if (key && label && !results.find((r) => r.key === key)) {
      results.push({ key, label });
    }
  }
  return results;
}

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
  const [mobileProtos, setMobileProtos] = useState<SavedPrototype[]>([]);

  useEffect(() => {
    const all = loadPrototypes();
    const filtered = all
      .filter(
        (p) =>
          p.productLine === productLine &&
          (p.designMode === 'mobile' || p.designMode == null) &&
          !!p.menuPath,
      )
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((p) => {
        // 对旧数据自动检测状态标签（未保存 stateLabels 时从 HTML 解析）
        if (!p.stateLabels || p.stateLabels.length === 0) {
          const detected = detectStateLabels(p.html ?? '');
          if (detected.length > 0) {
            return { ...p, stateLabels: detected };
          }
        }
        return p;
      });
    setMobileProtos(filtered);
  }, [productLine]);

  const [selected, setSelected] = useState<SavedPrototype | null>(null);
  const [activeStateKey, setActiveStateKey] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 规则说明弹窗
  const [ruleModalOpen, setRuleModalOpen] = useState(false);

  // 复制 HTML 状态
  const [copied, setCopied] = useState(false);

  const activeProto = selected ?? mobileProtos[0] ?? null;
  const color = COLORS[productLine];

  const handleCopyHtml = useCallback(() => {
    const html = (selected ?? mobileProtos[0] ?? null)?.html;
    if (!html) return;
    navigator.clipboard.writeText(html).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const el = document.createElement('textarea');
      el.value = html;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [selected, mobileProtos]);

  // 切换原型时重置状态选择
  useEffect(() => {
    setActiveStateKey(null);
  }, [activeProto?.id]);

  // 通过 postMessage 调用 iframe 内的 switchState（sandbox 无 allow-same-origin，不能直接访问 contentWindow 全局变量）
  const callIframeSwitchState = useCallback((key: string) => {
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: 'SWITCH_STATE', key }, '*');
    } catch {
      // 忽略
    }
  }, [iframeRef]);

  const handleSwitchState = useCallback((key: string) => {
    setActiveStateKey(key);
    callIframeSwitchState(key);
  }, [callIframeSwitchState]);

  // iframe 加载完成后，自动应用当前选中的状态
  const handleIframeLoad = useCallback(() => {
    const key = activeStateKey ?? activeProto?.stateLabels?.[0]?.key;
    if (key) callIframeSwitchState(key);
  }, [activeStateKey, activeProto, callIframeSwitchState]);

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
              onClick={() => setSelected(proto)}  // proto 已是带 stateLabels 的最新版本
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
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <p className="text-[10px] text-gray-400 dark:text-white/25 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 shrink-0" />
                    {formatDate(proto.createdAt)}
                  </p>
                  {proto.stateLabels && proto.stateLabels.length > 0 && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-medium border"
                      style={
                        isActive
                          ? { background: `${color}18`, borderColor: `${color}30`, color }
                          : { background: 'rgba(0,0,0,0.04)', borderColor: 'rgba(0,0,0,0.08)', color: '#94a3b8' }
                      }
                    >
                      {proto.stateLabels.length} 个状态
                    </span>
                  )}
                </div>
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
                {/* 规则说明按钮 */}
                <button
                  type="button"
                  onClick={() => setRuleModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-line text-gray-500 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-accent hover:border-accent/30 transition-colors cursor-pointer shrink-0"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  规则说明
                </button>
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
              <div className="flex items-center gap-2 shrink-0">
                {/* 复制 HTML */}
                <button
                  type="button"
                  onClick={handleCopyHtml}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    copied
                      ? 'border-green-400/40 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'border-line text-gray-500 hover:bg-gray-100 dark:hover:bg-white/8'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '已复制' : '复制 HTML'}
                </button>
                {/* 新窗口打开 */}
                <button
                  type="button"
                  onClick={() => {
                    const w = window.open('', '_blank');
                    if (w) {
                      w.document.write(activeProto.html);
                      w.document.close();
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-line text-gray-500 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  新窗口打开
                </button>
              </div>
            </div>

            {/* iPhone 预览区 */}
            <div
              className="flex-1 min-h-0 flex items-center justify-center overflow-hidden relative"
              style={{ background: 'linear-gradient(135deg,#f0f4ff 0%,#e8f4f8 50%,#f4f0ff 100%)' }}
            >
              {/* 左侧状态切换面板（有 stateLabels 时显示） */}
              {activeProto.stateLabels && activeProto.stateLabels.length > 0 && (
                <div
                  className="absolute left-5 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10"
                  style={{ maxWidth: 120 }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <LayoutDashboard className="w-3 h-3 text-gray-400 dark:text-white/30" />
                    <span className="text-[10px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wide">
                      审核状态
                    </span>
                  </div>
                  {activeProto.stateLabels.map((s) => {
                    const isStateActive = activeStateKey === s.key || (activeStateKey === null && activeProto.stateLabels![0].key === s.key);
                    return (
                      <motion.button
                        key={s.key}
                        type="button"
                        onClick={() => handleSwitchState(s.key)}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="text-left px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer"
                        style={
                          isStateActive
                            ? {
                                background: `linear-gradient(135deg,${color},#8b5cf6)`,
                                borderColor: 'transparent',
                                color: '#fff',
                                boxShadow: `0 4px 12px ${color}40`,
                              }
                            : {
                                background: 'rgba(255,255,255,0.7)',
                                borderColor: 'rgba(0,0,0,0.08)',
                                color: '#64748b',
                                backdropFilter: 'blur(8px)',
                              }
                        }
                      >
                        {s.label}
                      </motion.button>
                    );
                  })}
                </div>
              )}

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
                  <IPhoneShell html={activeProto.html} name={activeProto.name} iframeRef={iframeRef} onIframeLoad={handleIframeLoad} />
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

      {/* 规则说明弹窗：以原型 id 为 routeKey，支持按原型独立编辑 */}
      {activeProto && (
        <MenuRuleDescriptionModal
          open={ruleModalOpen}
          navTitle={activeProto.name}
          routeKeys={[activeProto.id]}
          onClose={() => setRuleModalOpen(false)}
        />
      )}
    </div>
  );
}

// ─── iPhone Shell Component ───────────────────────────────────────────────────

/**
 * 注入 CSS，修复移动端原型 HTML 嵌入 iPhone 外壳 iframe 时的布局问题：
 * 1. 隐藏原型自带的演示控制器（切换状态按钮栏、标签说明文字）
 * 2. 隐藏原型自带的手机壳外框（.phone 类）的装饰样式，让其内容铺满 iframe
 * 3. 修正 body 居中布局（避免内容悬浮在屏幕中央）
 */
function injectIframeResetCss(html: string): string {
  const injected = `<style>
    /* 隐藏演示控制器 */
    .switcher-bar, .sw-label, .sw-btn,
    [class*="switcher"], [class*="sw-label"],
    [class*="demo-bar"], [class*="preview-bar"] {
      display: none !important;
    }
    /* 修正 body 布局，铺满 iframe */
    body {
      padding: 0 !important;
      margin: 0 !important;
      display: block !important;
      align-items: unset !important;
      justify-content: unset !important;
      min-height: 100vh !important;
    }
    /* 如果原型有自带手机壳（.phone），去掉其装饰，铺满屏幕 */
    .phone {
      width: 100% !important;
      min-height: 100vh !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    /* 隐藏原型自带的状态栏（手机壳内的模拟状态栏） */
    .status-bar, .sb-time, .sb-icons { display: none !important; }
  </style>
  <script>
    /* 监听父页面通过 postMessage 发来的状态切换指令 */
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'SWITCH_STATE' && typeof window.switchState === 'function') {
        window.switchState(e.data.key);
      }
    });
  </script>`;
  if (html.includes('</head>')) return html.replace('</head>', injected + '</head>');
  if (html.includes('<body')) return html.replace(/<body(\s[^>]*)?>/, (m) => injected + m);
  return injected + html;
}

function IPhoneShell({ html, name, iframeRef, onIframeLoad }: {
  html: string;
  name?: string;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
  onIframeLoad?: () => void;
}) {
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
              ref={iframeRef}
              title={name ?? 'H5 原型预览'}
              srcDoc={injectIframeResetCss(html)}
              onLoad={onIframeLoad}
              style={{
                width: IPHONE16PRO_W,
                height: IPHONE16PRO_H,
                border: 'none',
                display: 'block',
              }}
              sandbox="allow-scripts"
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
