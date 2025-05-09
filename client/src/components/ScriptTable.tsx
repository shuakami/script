import React, { useState } from 'react';
import Modal from './Modal';
import { deleteScript } from '../services/api';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';

// 配置 dayjs 使用中文和相对时间插件
dayjs.locale('zh-cn');
dayjs.extend(relativeTime);

type Script = {
  script_id: string;
  name: string;
  uploaded_at: string;
  file_path_obfuscated: string;
};

interface Props {
  scripts: Script[];
  onDeleteSuccess?: () => void;
}

export default function ScriptTable({ scripts, onDeleteSuccess }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    setError('');
    try {
      await deleteScript(deleteId);
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
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">名称</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">上传时间</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">混淆路径</th>
            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-neutral-900 dark:text-neutral-100">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {scripts.map(s => (
            <tr key={s.script_id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-mono text-neutral-600 dark:text-neutral-400">{s.script_id}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-900 dark:text-neutral-100">{s.name}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                <span title={dayjs(s.uploaded_at).format('YYYY年MM月DD日 HH:mm:ss')}>
                  {dayjs(s.uploaded_at).fromNow()}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm font-mono text-neutral-600 dark:text-neutral-400">{s.file_path_obfuscated}</td>
              <td className="whitespace-nowrap px-3 py-4 text-right">
                <button
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-zinc-600 dark:text-zinc-400 text-xs font-medium transition-colors"
                  onClick={() => setDeleteId(s.script_id)}
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
        title="⚠️ 危险操作：确认删除脚本"
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
                <div className="mt-2 text-sm text-rose-700 dark:text-rose-300">
                  删除此脚本将会同时删除所有使用该脚本的IST实例，请确定你知道自己在做什么
          <div className="text-base text-neutral-600 dark:text-neutral-300">确定要继续删除该脚本吗？</div>
          {error && <div className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</div>}
        </div>
      </Modal>
    </div>
  );
}
