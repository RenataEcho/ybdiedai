import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Lock, User, Loader2, ShieldCheck } from 'lucide-react';

const CREDENTIALS = {
  username: 'admin',
  password: 'Ybd@2026#Secure!',
};

const SESSION_KEY = 'ybdiedai_auth_session';

export function checkSession(): boolean {
  try {
    const val = sessionStorage.getItem(SESSION_KEY);
    if (!val) return false;
    const { expiry } = JSON.parse(val);
    return Date.now() < expiry;
  } catch {
    return false;
  }
}

export function saveSession() {
  const expiry = Date.now() + 8 * 60 * 60 * 1000; // 8 小时
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ expiry }));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  // 粒子背景动画种子
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 6 + Math.random() * 10,
    delay: Math.random() * 5,
  }));

  useEffect(() => {
    if (shake) {
      const t = setTimeout(() => setShake(false), 600);
      return () => clearTimeout(t);
    }
  }, [shake]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    await new Promise((r) => setTimeout(r, 800));

    if (
      username.trim() === CREDENTIALS.username &&
      password === CREDENTIALS.password
    ) {
      saveSession();
      onLogin();
    } else {
      setLoading(false);
      setError('账号或密码错误，请重新输入');
      setShake(true);
      setPassword('');
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f1117 0%, #141820 50%, #1a1028 100%)' }}
    >
      {/* 装饰光晕 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 60% 20%, rgba(99,102,241,0.13) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(139,92,246,0.10) 0%, transparent 70%)',
        }}
      />

      {/* 浮动粒子 */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: 'rgba(139,92,246,0.35)',
          }}
          animate={{ y: [0, -24, 0], opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* 登录卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={shake ? 'animate-shake' : ''}
        style={{ width: '100%', maxWidth: 420, padding: '0 16px' }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 20,
            boxShadow: '0 8px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
            padding: '40px 36px 36px',
          }}
        >
          {/* Logo 区 */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
            >
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>
              管理后台
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.38)' }}>
              请登录您的账号以继续
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* 账号 */}
            <div className="mb-4">
              <label className="block text-sm mb-1.5 font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                账号
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  placeholder="请输入账号"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 10,
                    color: 'rgba(255,255,255,0.88)',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; }}
                />
              </div>
            </div>

            {/* 密码 */}
            <div className="mb-5">
              <label className="block text-sm mb-1.5 font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                密码
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="请输入密码"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 36px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 10,
                    color: 'rgba(255,255,255,0.88)',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(255,255,255,0.35)', lineHeight: 0, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm mb-4 px-3 py-2 rounded-lg"
                style={{
                  color: '#f87171',
                  background: 'rgba(239,68,68,0.10)',
                  border: '1px solid rgba(239,68,68,0.20)',
                }}
              >
                {error}
              </motion.p>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 font-semibold text-sm text-white transition-all"
              style={{
                padding: '11px 0',
                borderRadius: 10,
                background: loading
                  ? 'rgba(99,102,241,0.5)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(99,102,241,0.4)',
                transition: 'opacity 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  登录中…
                </>
              ) : (
                '登 录'
              )}
            </button>
          </form>

          {/* 底部提示 */}
          <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.22)' }}>
            默认账号 <span style={{ color: 'rgba(255,255,255,0.45)' }}>admin</span>
            {' · '}
            如需修改密码请联系管理员
          </p>
        </div>
      </motion.div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-6px); }
          30% { transform: translateX(6px); }
          45% { transform: translateX(-4px); }
          60% { transform: translateX(4px); }
          75% { transform: translateX(-2px); }
          90% { transform: translateX(2px); }
        }
        .animate-shake { animation: shake 0.55s cubic-bezier(.36,.07,.19,.97); }
        input::placeholder { color: rgba(255,255,255,0.22); }
      `}</style>
    </div>
  );
}
