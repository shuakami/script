export default function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-200/80 bg-white dark:border-[#262626]/80 dark:bg-[#09090b]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <div className="flex justify-between items-end w-full">
            <div className="flex flex-col items-start gap-1">
              <nav className="flex items-center text-xs text-neutral-500 dark:text-neutral-400 flex-wrap">
                <a className="hover:text-neutral-900 dark:hover:text-neutral-100" href="#">关于我们</a>
                <span className="px-2">/</span>
                <a className="hover:text-neutral-900 dark:hover:text-neutral-100" href="#">帮助中心</a>
                <span className="px-2">/</span>
                <a className="hover:text-neutral-900 dark:hover:text-neutral-100" href="#">隐私政策</a>
                <span className="px-2">/</span>
                <a className="hover:text-neutral-900 dark:hover:text-neutral-100" href="#">服务条款</a>
              </nav>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">© 2025 sdjz.wiki Auth. All rights reserved.</p>
            </div>
            <button className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:bg-[#262626]" title="切换到深色模式">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z" clipRule="evenodd"></path></svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
} 