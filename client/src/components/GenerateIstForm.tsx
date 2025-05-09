import React, { useState, Fragment } from 'react';
import { generateIst, GenerateIstPayload } from '../services/api';
import Modal from './Modal';

interface ApiErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

type Script = {
  script_id: string;
  name: string;
};

type Props = {
  scripts: Script[];
  onSuccess: () => void;
  loading?: boolean;
};

const expiryOptions = [
  { label: '1天后', value: 1 },
  { label: '7天后', value: 7 },
  { label: '30天后', value: 30 },
  { label: '90天后', value: 90 },
  { label: '永久有效', value: 0 }, // 0 代表永久或不设置过期
];

export default function GenerateIstForm({ scripts, onSuccess, loading = false }: Props) {
  const [scriptId, setScriptId] = useState('');
  // 存储选中的天数，0表示永久
  const [selectedExpiryDays, setSelectedExpiryDays] = useState<number | null>(null);
  const [customerInfo, setCustomerInfo] = useState('');
  const [loadingForm, setLoadingForm] = useState(false);
  const [error, setError] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [createdToken, setCreatedToken] = useState('');
  const [copied, setCopied] = useState<number | false>(false);
  // 新增：控制命令区块展开/收起
  const [showAllCmds, setShowAllCmds] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptId || selectedExpiryDays === null) {
      setError('请选择脚本并设置过期时间');
      return;
    }
    setLoadingForm(true);
    setError('');
    
    const payload: GenerateIstPayload & { customer_info?: string } = { 
      script_id: scriptId,
      customer_info: customerInfo
    };

    if (selectedExpiryDays > 0) {
      const date = new Date();
      date.setDate(date.getDate() + selectedExpiryDays);
      payload.expires_at = date.toISOString();
    }

    try {
      const result = await generateIst(payload);
      if (result && result.token_value) {
        setCreatedToken(result.token_value);
        setShowToken(true);
      } else {
        // fallback: 直接刷新
        onSuccess();
      }
      setScriptId('');
      setSelectedExpiryDays(null);
    } catch (err: unknown) {
      let message = '生成IST失败，请重试。';
      const apiError = err as ApiErrorResponse; 
      if (apiError.response && apiError.response.data && apiError.response.data.error) {
        message = apiError.response.data.error;
      } else if (apiError.message) {
        message = apiError.message;
      }
      setError(message);
    } finally {
      setLoadingForm(false);
    }
  };

  return (
    <>
      <Modal
        open={showToken}
        onClose={() => { setShowToken(false); onSuccess(); }}
        title="新IST已生成"
        actions={undefined}
      >
        <div className="mb-4 text-sm text-neutral-700 dark:text-neutral-200">请妥善保存本次生成的Token，页面关闭后将无法再次查看。</div>
        <div className="relative group mb-6">
          <div className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-800/70 rounded-lg px-4 py-3">
            <code className="font-mono text-sm text-[#0582FF] dark:text-[#3B82F6] select-all break-all mr-2">{createdToken}</code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(createdToken);
                setCopied(0);
                setTimeout(() => setCopied(false), 1200);
              }}
              className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#0582FF] dark:bg-[#3B82F6] text-white text-xs font-medium hover:bg-[#006ADF] dark:hover:bg-[#2563EB] transition-colors duration-150"
            >
              {copied === 0 ? '已复制' : '复制'}
            </button>
          </div>
          <div className="absolute inset-0 rounded-lg border-2 border-[#0582FF] dark:border-[#3B82F6] opacity-0 scale-[0.98] group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none" />
        </div>
        <div className="mb-2 text-base font-semibold text-neutral-800 dark:text-neutral-100">Activator 下载与一键命令</div>
        {/* 限高+展开/收起命令区块 */}
        {(() => {
          const cmdList = [
            {
              label: 'Windows (amd64)',
              url: 'https://cdn.sdjz.wiki/script/activator-windows-amd64.exe', 
              cmd: `powershell -Command \"Invoke-WebRequest -Uri 'https://cdn.sdjz.wiki/script/activator-windows-amd64.exe' -OutFile 'activator.exe'; ./activator.exe --token ${createdToken}\"`,
            },
            {
              label: 'macOS (Intel)',
              url: 'https://cdn.sdjz.wiki/script/activator-darwin-amd64',
              cmd: `wget https://cdn.sdjz.wiki/script/activator-darwin-amd64 -O activator && chmod +x activator && ./activator --token ${createdToken}`,
            },
            {
              label: 'Linux (amd64)',
              url: 'https://cdn.sdjz.wiki/script/activator-linux-amd64',
              cmd: `wget https://cdn.sdjz.wiki/script/activator-linux-amd64 -O activator && chmod +x activator && ./activator --token ${createdToken}`,
            },
            {
              label: 'macOS (Apple Silicon)',
              url: 'https://cdn.sdjz.wiki/script/activator-darwin-arm64',
              cmd: `wget https://cdn.sdjz.wiki/script/activator-darwin-arm64 -O activator && chmod +x activator && ./activator --token ${createdToken}`,
            },
            {
              label: 'Linux (arm64)',
              url: 'https://cdn.sdjz.wiki/script/activator-linux-arm64',
              cmd: `wget https://cdn.sdjz.wiki/script/activator-linux-arm64 -O activator && chmod +x activator && ./activator --token ${createdToken}`,
            },
          ];
          const showLimit = 2;
          const needExpand = cmdList.length > showLimit;
          const visibleCmds = showAllCmds ? cmdList : cmdList.slice(0, showLimit);
          return (
            <div className={`relative space-y-4 transition-all duration-300 ${!showAllCmds && needExpand ? 'max-h-56 overflow-hidden' : ''}`}>
              {visibleCmds.map((item, idx) => (
                <div key={item.label} className="bg-neutral-50 dark:bg-neutral-800/60 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-neutral-700 dark:text-neutral-200">{item.label}</span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#0582FF] dark:text-[#3B82F6] hover:underline"
                    >
                      下载
                    </a>
                  </div>
                  <div className="flex items-start gap-2">
                    <pre className="flex-1 bg-neutral-100 dark:bg-neutral-900 rounded-md px-3 py-2 text-xs font-mono text-neutral-800 dark:text-neutral-100 overflow-x-auto select-all whitespace-pre-wrap break-all">{item.cmd}</pre>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(item.cmd);
                        setCopied(idx + 1);
                        setTimeout(() => setCopied(false), 1200);
                      }}
                      className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-[#0582FF] dark:bg-[#3B82F6] text-white text-xs font-medium hover:bg-[#006ADF] dark:hover:bg-[#2563EB] transition-colors duration-150 mt-1"
                    >
                      {copied === idx + 1 ? '已复制' : '复制'}
                    </button>
                  </div>
                </div>
              ))}
              {/* 遮罩和展开按钮 */}
              {!showAllCmds && needExpand && (
                <div className="absolute left-0 right-0 bottom-0 h-20 flex flex-col items-center justify-end pointer-events-none">
                  <div className="w-full h-16 bg-gradient-to-t from-neutral-100 dark:from-neutral-800/90 to-transparent rounded-b-lg" />
                  <button
                    type="button"
                    onClick={() => setShowAllCmds(true)}
                    className="pointer-events-auto relative -mt-8 mb-2 px-4 py-1.5 text-zinc-500 dark:text-zinc-400 text-xs font-medium transition-colors"
                  >
                    展开全部命令
                  </button>
                </div>
              )}
              {showAllCmds && needExpand && (
                <div className="flex justify-center mt-2">
                  <button
                    type="button"
                    onClick={() => setShowAllCmds(false)}
                    className="px-4 py-1.5 rounded text-neutral-700 dark:text-neutral-200 text-xs font-medium transition-colors"
                  >
                    收起
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="script-select" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          选择脚本
        </label>
        <select
          id="script-select"
          className="block w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-[#0582FF] focus:outline-none focus:ring-1 focus:ring-[#0582FF] dark:border-neutral-600 dark:bg-[#171717] dark:text-neutral-100"
          value={scriptId}
          onChange={e => setScriptId(e.target.value)}
          required
            disabled={loading}
        >
            <option value="" disabled>{loading ? '脚本加载中…' : '请选择一个脚本'}</option>
            {loading ? (
              <option disabled>脚本加载中…</option>
            ) : (
              scripts.map(s => (
            <option key={s.script_id} value={s.script_id}>{s.name} (ID: {s.script_id.substring(0, 8)}...)</option>
              ))
            )}
        </select>
      </div>
        <div className="space-y-2">
          <label htmlFor="ist-customer-info" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            用途/备注（可选）
          </label>
          <textarea
            id="ist-customer-info"
            className="block w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm focus:border-[#0582FF] focus:outline-none focus:ring-1 focus:ring-[#0582FF] dark:border-neutral-600 dark:bg-[#171717] dark:text-neutral-100 dark:placeholder-neutral-500"
            placeholder="请输入用途或备注（可选）"
            value={customerInfo}
            onChange={e => setCustomerInfo(e.target.value)}
            rows={2}
          />
        </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          过期时间
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {expiryOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedExpiryDays(option.value)}
              className={`
                rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ease-in-out
                ${selectedExpiryDays === option.value
                  ? 'bg-[#0582FF] text-white shadow-sm' 
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="text-red-600 dark:text-red-500 text-sm py-1 rounded-md bg-red-50 dark:bg-red-900/30 px-3">{error}</div>}
      <button
        type="submit"
        className="w-full flex justify-center rounded-md bg-[#0582FF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#006ADF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0582FF] disabled:cursor-not-allowed disabled:opacity-70 transition-colors duration-150"
          disabled={loadingForm || scripts.length === 0 || selectedExpiryDays === null}
      >
          {loadingForm ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            处理中…
          </>
        ) : (
          '生成IST'
        )}
      </button>
       {scripts.length === 0 && (
        <p className="text-xs text-center text-neutral-500 dark:text-neutral-400 pt-2">暂无可用脚本，请先上传脚本后再生成IST。</p>
      )}
    </form>
    </>
  );
}
