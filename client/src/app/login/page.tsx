"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import TextLogo from '../../components/TextLogo';
import Footer from '../../components/Footer';
import { checkHasAdmin, registerAdmin } from '../../services/api';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registerMode, setRegisterMode] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/admin/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    (async () => {
      try {
        const data = await checkHasAdmin();
        setRegisterMode(!data.hasAdmin);
      } catch {
        setRegisterMode(false);
      }
    })();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(username, password);
    } catch {
      setError('登录失败，请检查用户名或密码');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    setRegisterError('');
    try {
      await registerAdmin(username, password);
      setRegisterSuccess(true);
      setTimeout(() => {
        setRegisterMode(false);
        setRegisterSuccess(false);
      }, 1200);
    } catch (err: unknown) {
      let msg: string | undefined = undefined;
      if (
        err && typeof err === 'object' &&
        'response' in err &&
        err.response && typeof err.response === 'object' &&
        'data' in (err.response as Record<string, unknown>) &&
        (err.response as { data?: unknown }).data &&
        typeof (err.response as { data?: unknown }).data === 'object' &&
        'error' in (err.response as { data?: { error?: unknown } }).data!
      ) {
        msg = (err.response as { data: { error?: string } }).data.error;
      }
      setRegisterError(msg || '注册失败');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#09090b]">
      <main className="flex-grow flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl mx-auto lg:grid lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
          <div className="hidden lg:block text-center lg:text-left lg:pl-8">
            <div className="mx-auto lg:mx-0 mb-6 block">
              <TextLogo size="lg" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl">欢迎回来。</h1>
            <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">使用您的账户凭据登录。</p>
          </div>
          <div className="mt-10 lg:mt-0 w-full max-w-md mx-auto">
            <div className="text-center lg:hidden mb-8">
              <div className="mx-auto block mb-2">
                <TextLogo size="sm" />
              </div>
              <h2 className="mt-6 text-center text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{registerMode ? '注册管理员账户' : '登录您的账户'}</h2>
            </div>
            {registerMode ? (
              <form className="space-y-5" onSubmit={handleRegister}>
                <div>
                  <label htmlFor="reg-username" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">用户名</label>
                  <input
                    id="reg-username"
                    type="text"
                    autoComplete="username"
                    required
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm focus:border-[#0582FF] focus:outline-none focus:ring-1 focus:ring-[#0582FF] dark:border-neutral-600 dark:bg-[#171717] dark:text-neutral-100 dark:placeholder-neutral-500"
                    placeholder="请输入用户名"
                    name="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">密码</label>
                  <input
                    id="reg-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm focus:border-[#0582FF] focus:outline-none focus:ring-1 focus:ring-[#0582FF] dark:border-neutral-600 dark:bg-[#171717] dark:text-neutral-100 dark:placeholder-neutral-500"
                    placeholder="请输入密码"
                    name="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                {registerError && <div className="text-red-500 text-sm text-center">{registerError}</div>}
                {registerSuccess && <div className="text-green-600 text-sm text-center">注册成功，请登录</div>}
                <div>
                  <button
                    type="submit"
                    className="flex w-full justify-center rounded-md border border-transparent bg-[#0582FF] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#006ADF] focus:outline-none focus:ring-2 focus:ring-[#0582FF] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-[#09090b]"
                    disabled={registering}
                  >
                    {registering ? '注册中…' : '注册'}
                  </button>
                </div>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={handleLogin}>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">用户名</label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    required
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm focus:border-[#0582FF] focus:outline-none focus:ring-1 focus:ring-[#0582FF] dark:border-neutral-600 dark:bg-[#171717] dark:text-neutral-100 dark:placeholder-neutral-500"
                    placeholder="请输入用户名"
                    name="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">密码</label>
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm focus:border-[#0582FF] focus:outline-none focus:ring-1 focus:ring-[#0582FF] dark:border-neutral-600 dark:bg-[#171717] dark:text-neutral-100 dark:placeholder-neutral-500"
                    placeholder="请输入密码"
                    name="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                <div>
                  <button
                    type="submit"
                    className="flex w-full justify-center rounded-md border border-transparent bg-[#0582FF] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#006ADF] focus:outline-none focus:ring-2 focus:ring-[#0582FF] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-[#09090b]"
                    disabled={loading}
                  >
                    {loading ? '登录中…' : '登录'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
