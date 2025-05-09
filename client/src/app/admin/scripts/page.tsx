"use client";
import { useEffect, useState } from 'react';
import ScriptTable from '../../../components/ScriptTable';
import UploadScriptForm from '../../../components/UploadScriptForm';
import { fetchScripts } from '../../../services/api';
import TextLogo from '../../../components/TextLogo';
import Footer from '../../../components/Footer';

type Script = {
  script_id: string;
  name: string;
  uploaded_at: string;
  file_path_obfuscated: string;
  uploadTime?: string;
  created_at?: string;
};

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchScripts();
      // 统一字段名，适配 ScriptTable
      const scripts = (data.scripts || data)
        .map((item: Partial<Script> & { id: number }) => ({
          script_id: item.id,
          name: item.name || '',
          uploaded_at: item.uploadTime || item.created_at || '',
          file_path_obfuscated: item.file_path_obfuscated || '',
        }));
      setScripts(scripts);
    } catch {
      setError('获取脚本列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-[#09090b]">
      <main className="flex-grow px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl mx-auto space-y-16">
          {/* 页面头部：Logo和标题 */}
          <div className="flex items-center gap-4">
            <TextLogo size="lg" />
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">脚本管理</h1>
          </div>

          {/* 上传表单区域 */}
          <section aria-labelledby="upload-script-heading" className="space-y-6">
            <h2 id="upload-script-heading" className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              上传新脚本
            </h2>
            <UploadScriptForm onSuccess={load} />
          </section>

          {/* 脚本列表区域 */}
          <section aria-labelledby="scripts-list-heading" className="space-y-6">
            <h2 id="scripts-list-heading" className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              已上传脚本
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-20 text-neutral-500 dark:text-neutral-400">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>加载中…</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-20 text-red-600 dark:text-red-500">
                <span>{error}</span>
              </div>
            ) : scripts.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-neutral-500 dark:text-neutral-400">
                <span>暂无脚本</span>
              </div>
            ) : (
              <ScriptTable scripts={scripts} onDeleteSuccess={load} />
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
