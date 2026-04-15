import { useState, useMemo } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  ShoppingCart,
  Award,
  UserCheck,
  Activity,
  Star,
  Handshake,
  GraduationCap,
  RefreshCw,
  FileText,
  DollarSign,
  PieChart,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type TimePeriod = 'today' | 'week' | 'month' | 'custom';

interface StatCard {
  label: string;
  value: string | number;
  sub?: string;
  subNote?: string;
  trend?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface WalletRow {
  label: string;
  settled: string;
  pending: string;
  orders: string;
  color: string;
}

interface PieSlice {
  label: string;
  value: number;
  color: string;
}

// ─── Mock data per period ────────────────────────────────────────────────────

const PERIOD_DATA: Record<TimePeriod, {
  userStats: { total: number; newUsers: number; active: number; normal: number; core: number; partners: number; mentors: number };
  convStats: { orderUsers: number; fillback: number; keywords: number; orderAmount: string; orderCount: number };
  projectUsers: { brand: number; overseas: number; fusion: number; copyright: number; other: number };
  walletSummary: { settledAmt: string; pendingAmt: string; settledOrders: number };
  wallets: WalletRow[];
}> = {
  today: {
    userStats:  { total: 128450, newUsers: 312, active: 8760, normal: 98200, core: 24800, partners: 3210, mentors: 1240 },
    convStats:  { orderUsers: 2341, fillback: 876, keywords: 1230, orderAmount: '¥42,800', orderCount: 3210 },
    projectUsers: { brand: 980, overseas: 620, fusion: 430, copyright: 180, other: 131 },
    walletSummary: { settledAmt: '¥38,420', pendingAmt: '¥12,600', settledOrders: 2830 },
    wallets: [
      { label: '项目钱包', settled: '¥22,100', pending: '¥8,200', orders: '1,680', color: '#6366f1' },
      { label: '分红钱包', settled: '¥10,800', pending: '¥2,900', orders: '780',  color: '#f59e0b' },
      { label: '奖励钱包', settled: '¥5,520',  pending: '¥1,500', orders: '370',  color: '#10b981' },
    ],
  },
  week: {
    userStats:  { total: 128450, newUsers: 2180, active: 41200, normal: 98200, core: 24800, partners: 3210, mentors: 1240 },
    convStats:  { orderUsers: 15600, fillback: 5420, keywords: 8760, orderAmount: '¥298,600', orderCount: 22400 },
    projectUsers: { brand: 6800, overseas: 4300, fusion: 2900, copyright: 1200, other: 400 },
    walletSummary: { settledAmt: '¥268,000', pendingAmt: '¥89,400', settledOrders: 19800 },
    wallets: [
      { label: '项目钱包', settled: '¥154,000', pending: '¥52,000', orders: '11,400', color: '#6366f1' },
      { label: '分红钱包', settled: '¥76,200',  pending: '¥24,600', orders: '5,600',  color: '#f59e0b' },
      { label: '奖励钱包', settled: '¥37,800',  pending: '¥12,800', orders: '2,800',  color: '#10b981' },
    ],
  },
  month: {
    userStats:  { total: 128450, newUsers: 8760, active: 92400, normal: 98200, core: 24800, partners: 3210, mentors: 1240 },
    convStats:  { orderUsers: 58200, fillback: 21800, keywords: 34500, orderAmount: '¥1,284,600', orderCount: 86400 },
    projectUsers: { brand: 26400, overseas: 16800, fusion: 11200, copyright: 4800, other: -1 },
    walletSummary: { settledAmt: '¥1,142,000', pendingAmt: '¥328,600', settledOrders: 76400 },
    wallets: [
      { label: '项目钱包', settled: '¥658,000', pending: '¥192,000', orders: '44,200', color: '#6366f1' },
      { label: '分红钱包', settled: '¥324,000', pending: '¥92,000',  orders: '20,400', color: '#f59e0b' },
      { label: '奖励钱包', settled: '¥160,000', pending: '¥44,600',  orders: '11,800', color: '#10b981' },
    ],
  },
  custom: {
    userStats:  { total: 128450, newUsers: 5120, active: 64800, normal: 98200, core: 24800, partners: 3210, mentors: 1240 },
    convStats:  { orderUsers: 32400, fillback: 12200, keywords: 19800, orderAmount: '¥742,000', orderCount: 48600 },
    projectUsers: { brand: 15200, overseas: 9600, fusion: 6400, copyright: 2800, other: -1 },
    walletSummary: { settledAmt: '¥664,000', pendingAmt: '¥196,000', settledOrders: 44200 },
    wallets: [
      { label: '项目钱包', settled: '¥382,000', pending: '¥114,000', orders: '25,600', color: '#6366f1' },
      { label: '分红钱包', settled: '¥188,000', pending: '¥54,000',  orders: '11,800', color: '#f59e0b' },
      { label: '奖励钱包', settled: '¥94,000',  pending: '¥28,000',  orders: '6,800',  color: '#10b981' },
    ],
  },
};

const TREND_SEEDS: Record<TimePeriod, number[]> = {
  today: [8.2, 12.4, -3.1, 0.8, 5.6, 2.1, 1.4],
  week:  [15.6, 23.8, 7.2, 2.4, 12.1, 4.8, 3.2],
  month: [32.4, 48.2, 18.6, 5.8, 22.4, 9.6, 7.2],
  custom: [21.8, 34.2, 11.4, 3.6, 16.8, 6.4, 4.8],
};

// ─── Helper components ───────────────────────────────────────────────────────

function TrendBadge({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium rounded px-1.5 py-0.5 ${
        up ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' : 'text-red-500 bg-red-50 dark:bg-red-950/40 dark:text-red-400'
      }`}
    >
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(value)}%
    </span>
  );
}

function StatCardComp({ card }: { card: StatCard }) {
  const Icon = card.icon;
  return (
    <div className="bg-white rounded-xl border border-line p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">{card.label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-gray-900 tabular-nums">
          {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
        </span>
        {card.trend !== undefined && <TrendBadge value={card.trend} />}
      </div>
      {card.sub && (
        <p className="text-xs text-gray-400 leading-relaxed">{card.sub}</p>
      )}
    </div>
  );
}

/** Mini pie chart using SVG */
function PieChartSvg({ slices }: { slices: PieSlice[] }) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const r = 80;
  const cx = 100;
  const cy = 100;
  let startAngle = -Math.PI / 2;

  const paths = slices.map((slice) => {
    const angle = (slice.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const midAngle = startAngle + angle / 2;
    startAngle = endAngle;
    return { d, color: slice.color, label: slice.label, value: slice.value, midAngle };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width="200" height="200" viewBox="0 0 200 200" className="shrink-0">
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} stroke="white" strokeWidth="2" />
        ))}
        <circle cx={cx} cy={cy} r={40} fill="white" className="dark:fill-[#1e2232]" />
        <text x={cx} y={cy - 6} textAnchor="middle" className="text-xs" fontSize="11" fill="#6b7280">合计</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1a1a1a" className="dark:fill-white">
          {total.toLocaleString()}
        </text>
      </svg>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {slices.map((s, i) => {
          const pct = total > 0 ? ((s.value / total) * 100).toFixed(1) : '0';
          return (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="text-xs text-gray-600 truncate">{s.label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-gray-800 tabular-nums">{s.value.toLocaleString()}</span>
                <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Horizontal bar chart using div */
function BarChartHoriz({ rows }: { rows: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-20 shrink-0 text-right">{row.label}</span>
          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: max > 0 ? `${(row.value / max) * 100}%` : '0%',
                background: row.color,
              }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-800 tabular-nums w-16 text-right">
            {typeof row.value === 'string' ? row.value : row.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Wallet breakdown row */
function WalletCard({ row }: { row: WalletRow }) {
  return (
    <div className="bg-white rounded-xl border border-line p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full" style={{ background: row.color }} />
        <span className="text-sm font-semibold text-gray-800">{row.label}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-400">已结算金额</span>
          <span className="text-base font-bold text-gray-900 tabular-nums">{row.settled}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-400">待结算金额</span>
          <span className="text-base font-bold text-amber-600 tabular-nums">{row.pending}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-400">已结算订单数</span>
          <span className="text-base font-bold text-gray-900 tabular-nums">{row.orders}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full bg-accent" />
        <span className="flex items-center gap-1.5 text-base font-semibold text-gray-900">
          {icon}
          {title}
        </span>
      </div>
      {children}
    </section>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PERIOD_LABELS: Record<TimePeriod, string> = {
  today: '今日',
  week:  '本周',
  month: '本月',
  custom: '自定义',
};

export function DashboardPage() {
  const [period, setPeriod] = useState<TimePeriod>('today');
  const [activeTab, setActiveTab] = useState<'business' | 'wallet'>('business');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const data = PERIOD_DATA[period];
  const trends = TREND_SEEDS[period];
  const { userStats, convStats, projectUsers, walletSummary, wallets } = data;

  const userCards: StatCard[] = useMemo(() => [
    { label: '总用户数',   value: userStats.total,    sub: '平台累计注册用户总数',                               icon: Users,       color: 'bg-indigo-500',  trend: undefined },
    { label: '新增用户数', value: userStats.newUsers,  sub: '统计周期内首次注册用户数量',                          icon: UserCheck,   color: 'bg-emerald-500', trend: trends[1] },
    { label: '活跃用户数', value: userStats.active,    sub: '按设备ID或注册手机号去重。停留时长>30秒或有点击行为。', icon: Activity,    color: 'bg-blue-500',    trend: trends[2] },
    { label: '普通会员数', value: userStats.normal,    sub: '注册默认为普通会员。',                                icon: Star,        color: 'bg-slate-500',   trend: trends[3] },
    { label: '核心会员数', value: userStats.core,      sub: '一般为后台设置的核心会员。',                          icon: Award,       color: 'bg-violet-500',  trend: trends[4] },
    { label: '合伙人数量', value: userStats.partners,  sub: '身份为合伙人的总数。',                               icon: Handshake,   color: 'bg-orange-500',  trend: trends[5] },
    { label: '导师数量',   value: userStats.mentors,   sub: '认证通过的导师总数。',                               icon: GraduationCap, color: 'bg-pink-500',  trend: trends[6] },
  ], [userStats, trends]);

  const convCards: StatCard[] = useMemo(() => [
    { label: '出单用户数', value: convStats.orderUsers, sub: '在该项目下成功结算至少一笔订单的用户数。按用户ID去重。', icon: ShoppingCart, color: 'bg-indigo-500',  trend: trends[0] },
    { label: '回填数量',   value: convStats.fillback,  sub: '用户实际回填/提交的内容数量。包含所有审核状态。',       icon: RefreshCw,   color: 'bg-emerald-500', trend: trends[1] },
    { label: '题词数量',   value: convStats.keywords,  sub: '项目关联的关键词总数。包含所有审核状态。',             icon: FileText,    color: 'bg-amber-500',   trend: trends[2] },
    { label: '订单总金额', value: convStats.orderAmount, sub: '所有审核通过发订单的支付总额。以实际支付金额为准，转换为RMB。', icon: DollarSign, color: 'bg-rose-500', trend: trends[3] },
    { label: '订单数量',   value: convStats.orderCount,  sub: '成功创建并审核通过的订单总数。仅品牌类项目该字段会有数据。', icon: BarChart3,  color: 'bg-blue-500', trend: trends[4] },
  ], [convStats, trends]);

  const pieSlices: PieSlice[] = useMemo(() => [
    { label: '品牌项目用户数', value: projectUsers.brand,     color: '#6366f1' },
    { label: '海外项目用户数', value: projectUsers.overseas,  color: '#f59e0b' },
    { label: '融合项目用户数', value: projectUsers.fusion,    color: '#10b981' },
    { label: '版权分销用户数', value: projectUsers.copyright, color: '#3b82f6' },
    { label: '其他业务用户数', value: projectUsers.other > 0 ? projectUsers.other : 0, color: '#8b5cf6' },
  ].filter((s) => s.value > 0), [projectUsers]);

  const barRows = useMemo(() => pieSlices.map((s) => ({ label: s.label.replace('项目用户数', '').replace('分销用户数', '分销'), value: s.value, color: s.color })), [pieSlices]);

  const walletBarRows = useMemo(() => wallets.map((w) => ({
    label: w.label,
    value: parseFloat(w.settled.replace(/[¥,]/g, '')),
    color: w.color,
  })), [wallets]);

  return (
    <div className="space-y-8 pb-8">
      {/* Time period selector */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-0.5">
          {(['today', 'week', 'month', 'custom'] as TimePeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
                period === p
                  ? 'bg-white text-accent shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <input
              type="date"
              value={customRange.start}
              onChange={(e) => setCustomRange((r) => ({ ...r, start: e.target.value }))}
              className="border border-line rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-accent/20 outline-none bg-white"
            />
            <span>至</span>
            <input
              type="date"
              value={customRange.end}
              onChange={(e) => setCustomRange((r) => ({ ...r, end: e.target.value }))}
              className="border border-line rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-accent/20 outline-none bg-white"
            />
          </div>
        )}

        {/* Tab switcher */}
        <div className="ml-auto flex items-center border border-line rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveTab('business')}
            className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'business' ? 'bg-accent text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            业务数据看板
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'wallet' ? 'bg-accent text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            钱包数据看板
          </button>
        </div>
      </div>

      {/* ── 业务数据看板 ─────────────────────────────────── */}
      {activeTab === 'business' && (
        <div className="space-y-8">
          {/* 用户数据 */}
          <Section title="用户数据" icon={<Users className="w-4 h-4 text-accent" />}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              {userCards.map((card) => (
                <StatCardComp key={card.label} card={card} />
              ))}
            </div>
          </Section>

          {/* 转化数据 */}
          <Section title="转化数据" icon={<TrendingUp className="w-4 h-4 text-accent" />}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {convCards.map((card) => (
                <StatCardComp key={card.label} card={card} />
              ))}
            </div>
          </Section>

          {/* 转化分布 */}
          <Section title="用户转化分布" icon={<PieChart className="w-4 h-4 text-accent" />}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie */}
              <div className="bg-white border border-line rounded-xl p-6">
                <p className="text-sm font-semibold text-gray-700 mb-4">各业务线用户占比</p>
                <PieChartSvg slices={pieSlices} />
              </div>
              {/* Bar */}
              <div className="bg-white border border-line rounded-xl p-6">
                <p className="text-sm font-semibold text-gray-700 mb-4">转化数据对比</p>
                <BarChartHoriz rows={barRows} />
                <p className="text-xs text-gray-400 mt-4">不同业务线的用户转化数量对比，直观展示各业务线的获客能力。</p>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ── 钱包数据看板 ─────────────────────────────────── */}
      {activeTab === 'wallet' && (
        <div className="space-y-8">
          {/* 累计汇总 */}
          <Section title="钱包累计统计" icon={<Wallet className="w-4 h-4 text-accent" />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-line rounded-xl p-5 flex flex-col gap-2">
                <span className="text-sm text-gray-500">所有钱包累计已结算总金额</span>
                <span className="text-3xl font-bold text-gray-900 tabular-nums">{walletSummary.settledAmt}</span>
                <span className="text-xs text-gray-400">包含项目、分红、奖励钱包的已结算总和。</span>
              </div>
              <div className="bg-white border border-line rounded-xl p-5 flex flex-col gap-2">
                <span className="text-sm text-gray-500">所有钱包累计待结算总金额</span>
                <span className="text-3xl font-bold text-amber-600 tabular-nums">{walletSummary.pendingAmt}</span>
                <span className="text-xs text-gray-400">包含项目、分红、奖励钱包的待结算总和。</span>
              </div>
              <div className="bg-white border border-line rounded-xl p-5 flex flex-col gap-2">
                <span className="text-sm text-gray-500">所有钱包累计已结算订单总数</span>
                <span className="text-3xl font-bold text-gray-900 tabular-nums">{walletSummary.settledOrders.toLocaleString()}</span>
                <span className="text-xs text-gray-400">包含项目、分红、奖励钱包的已结算订单总和。</span>
              </div>
            </div>
          </Section>

          {/* 分项钱包 */}
          <Section title="各钱包明细" icon={<BarChart3 className="w-4 h-4 text-accent" />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {wallets.map((w) => (
                <WalletCard key={w.label} row={w} />
              ))}
            </div>
          </Section>

          {/* 各钱包支出分布 */}
          <Section title="各钱包支出分布" icon={<PieChart className="w-4 h-4 text-accent" />}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-line rounded-xl p-6">
                <p className="text-sm font-semibold text-gray-700 mb-4">已结算金额分布</p>
                <PieChartSvg
                  slices={wallets.map((w) => ({
                    label: w.label,
                    value: parseFloat(w.settled.replace(/[¥,]/g, '')),
                    color: w.color,
                  }))}
                />
              </div>
              <div className="bg-white border border-line rounded-xl p-6">
                <p className="text-sm font-semibold text-gray-700 mb-4">各钱包已结算金额对比</p>
                <BarChartHoriz rows={walletBarRows} />
                <p className="text-xs text-gray-400 mt-4">对比项目钱包、分红钱包、奖励钱包的已结算金额。</p>
              </div>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
