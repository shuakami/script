"use client";
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import TextLogo from '../../../components/TextLogo';
import Footer from '../../../components/Footer';

export default function Dashboard() {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#09090b]">
      <main className="flex-grow flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl mx-auto lg:grid lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
          <div className="hidden lg:block text-center lg:text-left lg:pl-8">
            <div className="mx-auto lg:mx-0 mb-6 block">
              <TextLogo size="lg" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl">欢迎使用 Script Guardian</h1>
            <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">极简安全脚本管理后台</p>
          </div>
          <div className="mt-10 lg:mt-0 w-full max-w-md mx-auto flex flex-col gap-6 items-center">
            <button
              className="flex w-full justify-center rounded-md border border-transparent bg-[#0582FF] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#006ADF] focus:outline-none focus:ring-2 focus:ring-[#0582FF] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-[#09090b]"
              onClick={() => router.push('/admin/scripts')}
            >
              脚本管理
            </button>
            <button
              className="flex w-full justify-center rounded-md border border-transparent bg-[#0582FF] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#006ADF] focus:outline-none focus:ring-2 focus:ring-[#0582FF] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-[#09090b]"
              onClick={() => router.push('/admin/ists')}
            >
              IST管理
            </button>
            <button
              className="text-neutral-400 hover:text-red-500 text-sm mt-4"
              onClick={logout}
            >
              退出登录
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
