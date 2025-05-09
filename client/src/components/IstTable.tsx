import React, { useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');
import Modal from './Modal';
import { deleteIst } from '../services/api';

type Ist = {
  ist_id: string;
  status: string;
  expires_at: string;
  fk_script_id: string;
  created_at: string;
  customer_info?: string;
};

type Script = {
  script_id: string;
  name: string;
};

interface Props {
  ists: Ist[];
  scripts?: Script[];
  onDeleteSuccess?: () => void;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  UNUSED: { label: '未使用', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  ACTIVATED: { label: '已使用', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  EXPIRED: { label: '已过期', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300' },
};

export default function IstTable({ ists, scripts = [], onDeleteSuccess }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 脚本ID到名称映射
  const scriptMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    scripts.forEach(s => { map[s.script_id] = s.name; });
    return map;
  }, [scripts]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    setError('');
    try {
      await deleteIst(deleteId);
      setDeleteId(null);
      if (onDeleteSuccess) onDeleteSuccess();
    } catch {
      setError('删除失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
        <thead>
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">ID</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">状态</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">过期时间</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">脚本</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">用途/备注</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">创建时间</th>
            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-neutral-900 dark:text-neutral-100">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {ists.map(i => (
            <tr key={i.ist_id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-mono text-neutral-600 dark:text-neutral-400">{i.ist_id}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span className={`inline-block rounded px-2 py-0.5 font-medium text-xs ${STATUS_MAP[i.status]?.color || 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300'}`}>
                  {STATUS_MAP[i.status]?.label || i.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                {dayjs(i.expires_at).isValid() ?
                  (dayjs(i.expires_at).isAfter(dayjs())
                    ? `还有${dayjs().to(dayjs(i.expires_at), true)}`
                    : `已过期${dayjs(i.expires_at).toNow(true)}`)
                  : i.expires_at}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-900 dark:text-neutral-100">
                {scriptMap[i.fk_script_id] || <span className="font-mono text-neutral-400">{i.fk_script_id}</span>}（ID：{i.ist_id}）
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-600 dark:text-neutral-400">{i.customer_info || ''}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                {dayjs(i.created_at).isValid() ? dayjs(i.created_at).fromNow() : i.created_at}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-right">
                <button
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-zinc-600 dark:text-zinc-400 text-xs font-medium transition-colors"
                  onClick={() => setDeleteId(i.ist_id)}
                >
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="确认删除IST"
        actions={
          <div className="flex justify-between w-full">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md h-10 px-5 text-sm font-medium bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600 transition"
              onClick={() => setDeleteId(null)}
              disabled={loading}
            >
              取消
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md h-10 px-5 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white dark:bg-rose-600 dark:hover:bg-rose-700 dark:text-white transition"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? '删除中…' : '确认删除'}
            </button>
          </div>
        }
      >
        <div className="text-base text-neutral-600 dark:text-neutral-300">确定要删除该IST吗？此操作不可撤销。</div>
        {error && <div className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</div>}
      </Modal>
    </div>
  );
}
