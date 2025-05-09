"use client";
import { useEffect, useState } from 'react';
import IstTable from '../../../components/IstTable';
import GenerateIstForm from '../../../components/GenerateIstForm';
import { fetchIsts, fetchScripts } from '../../../services/api';
import TextLogo from '../../../components/TextLogo';
import Footer from '../../../components/Footer';

type Script = {
  script_id: string;
  name: string;
};

type Ist = {
  ist_id: string;
  status: string;
  expires_at: string;
  fk_script_id: string;
  created_at: string;
};

export default function IstsPage() {
  const [ists, setIsts] = useState<Ist[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [istData, scriptData] = await Promise.all([
        fetchIsts(),
        fetchScripts(),
      ]);
      const istsRaw = istData.ists || istData;
      const ists = istsRaw.map((item: Partial<Ist> & { id: number, token_value: string, fk_script_id: number, customer_info?: string }) => ({
        ist_id: String(item.id),
        token_value: item.token_value,
        fk_script_id: String(item.fk_script_id),
        customer_info: item.customer_info || '',
        status: item.status || '',
        expires_at: item.expires_at || '',
      }));
      setIsts(ists);
      // 调试输出
      console.log('fetchScripts 返回:', scriptData);
      // 兼容后端返回 id 字段，name 兜底为 id
      const scripts = (scriptData.scripts || scriptData)
        .map((item: Partial<Script> & { id: number }) => ({
          script_id: String(item.id),
          name: item.name || String(item.id),
        }));
      setScripts(scripts);
    } catch {
      setError('获取IST或脚本列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#09090b]">
      <main className="flex-grow px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl mx-auto space-y-10">
          {/* 页面头部：Logo和标题 */}
          <div className="flex items-center gap-4">
            <TextLogo size="lg" />
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">IST管理</h1>
          </div>

          {/* 生成IST表单区域 */}
          <section aria-labelledby="generate-ist-heading">
            <h2 id="generate-ist-heading" className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              生成新IST
            </h2>
            <GenerateIstForm scripts={scripts} onSuccess={load} loading={loading} />
          </section>

          {/* IST列表区域 */}
          <section aria-labelledby="ists-list-heading">
            <h2 id="ists-list-heading" className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              已生成IST
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-neutral-400 animate-pulse">加载中…</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-red-500">{error}</div>
              </div>
            ) : ists.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-neutral-400">暂无IST</div>
              </div>
            ) : (
              <IstTable ists={ists} scripts={scripts} onDeleteSuccess={load} />
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
