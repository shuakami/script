"use client";
import { useRouter } from 'next/navigation';
import TextLogo from '../components/TextLogo';
import Footer from '../components/Footer';

export default function Home() {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#09090b]">
      <main className="flex-grow flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl mx-auto lg:grid lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
          <div className="hidden lg:block text-center lg:text-left lg:pl-8">
            <div className="mx-auto lg:mx-0 mb-6 block">
              <TextLogo size="lg" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl">欢迎回来。</h1>
            <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">Script Guardian 管理后台</p>
          </div>
          <div className="mt-10 lg:mt-0 w-full max-w-md mx-auto">
            <div className="text-center lg:hidden mb-8">
              <div className="mx-auto block mb-2">
                <TextLogo size="sm" />
              </div>
              <h2 className="mt-6 text-center text-2xl font-semibold text-neutral-900 dark:text-neutral-100">登录您的账户</h2>
            </div>
            <div className="space-y-6">
              <button
                className="flex w-full justify-center rounded-md border border-transparent bg-[#0582FF] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#006ADF] focus:outline-none focus:ring-2 focus:ring-[#0582FF] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-[#09090b]"
                onClick={() => router.push('/login')}
              >
                进入后台
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
