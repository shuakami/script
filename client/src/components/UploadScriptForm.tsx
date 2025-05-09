import React, { useRef, useState, DragEvent } from 'react';
import { uploadScriptFile } from '../services/api';

// 定义一个辅助类型来描述可能的API错误响应结构
interface ApiErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

export default function UploadScriptForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileHint, setFileHint] = useState('');
  // 多平台解释器配置
  const [execConfig, setExecConfig] = useState({
    windows: { interpreter: '', args: '' },
    linux: { interpreter: '', args: '' },
    darwin: { interpreter: '', args: '' },
    default: { interpreter: '', args: '' },
  });
  const [execConfigTab, setExecConfigTab] = useState<'windows' | 'linux' | 'darwin' | 'default'>('default');
  const platformList = [
    { key: 'windows', label: 'Windows', icon: '🪟' },
    { key: 'linux', label: 'Linux', icon: '🐧' },
    { key: 'darwin', label: 'macOS', icon: '🍎' },
    { key: 'default', label: '默认', icon: '✨' },
  ];

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
      setError(''); // Clear error when a new file is selected
    } else {
      setFile(null);
    }
  };

  const handleExecConfigChange = (platform: string, field: 'interpreter' | 'args', value: string) => {
    setExecConfig(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const copyDefaultToAll = () => {
    setExecConfig(prev => {
      const d = prev.default;
      return {
        windows: { ...d },
        linux: { ...d },
        darwin: { ...d },
        default: { ...d },
      };
    });
  };

  const insertPythonAllPlatform = () => {
    setExecConfig({
      windows: { interpreter: 'python', args: '-u' },
      linux: { interpreter: 'python3', args: '-u' },
      darwin: { interpreter: 'python3', args: '-u' },
      default: { interpreter: 'python3', args: '-u' },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) {
      setError('请填写名称并选择文件');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('file', file);
      formData.append('file_hint', fileHint);
      // 新增：多平台解释器配置
      formData.append('execution_config', JSON.stringify({
        windows: {
          interpreter: execConfig.windows.interpreter,
          args: execConfig.windows.args.split(/[,，\s]+/).filter(Boolean),
        },
        linux: {
          interpreter: execConfig.linux.interpreter,
          args: execConfig.linux.args.split(/[,，\s]+/).filter(Boolean),
        },
        darwin: {
          interpreter: execConfig.darwin.interpreter,
          args: execConfig.darwin.args.split(/[,，\s]+/).filter(Boolean),
        },
        default: {
          interpreter: execConfig.default.interpreter,
          args: execConfig.default.args.split(/[,，\s]+/).filter(Boolean),
        },
      }));
      await uploadScriptFile(formData);
      setName('');
      setDescription('');
      setFileHint('');
      setExecConfig({
        windows: { interpreter: '', args: '' },
        linux: { interpreter: '', args: '' },
        darwin: { interpreter: '', args: '' },
        default: { interpreter: '', args: '' },
      });
      handleFileChange(null); // Clear file state
      if (inputRef.current) inputRef.current.value = '';
      onSuccess();
    } catch (err: unknown) {
      let message = '上传失败，请重试。';
      const apiError = err as ApiErrorResponse; // 类型断言
      if (apiError.response && apiError.response.data && apiError.response.data.error) {
        message = apiError.response.data.error;
      } else if (apiError.message) {
        message = apiError.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }; 
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="script-name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          脚本名称
        </label>
        <input
          id="script-name"
          type="text"
          className="block w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm focus:border-[#0582FF] focus:outline-none focus:ring-1 focus:ring-[#0582FF] dark:border-neutral-600 dark:bg-[#171717] dark:text-neutral-100 dark:placeholder-neutral-500"
          placeholder="为您的脚本起一个名称"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="script-description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          描述（可选）
        </label>
        <textarea
          id="script-description"
          className="block w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm focus:border-[#0582FF] focus:outline-none focus:ring-1 focus:ring-[#0582FF] dark:border-neutral-600 dark:bg-[#171717] dark:text-neutral-100 dark:placeholder-neutral-500"
          placeholder="为您的脚本添加简要描述（可选）"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="script-file-hint" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          文件类型提示（可选）
        </label>
        <input
          id="script-file-hint"
          type="text"
          className="block w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm focus:border-[#0582FF] focus:outline-none focus:ring-1 focus:ring-[#0582FF] dark:border-neutral-600 dark:bg-[#171717] dark:text-neutral-100 dark:placeholder-neutral-500"
          placeholder="如 .py、.sh、.ps1"
          value={fileHint}
          onChange={e => setFileHint(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="script-file-input" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          选择脚本文件
        </label>
        <div 
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()} // Trigger file input click
          className={`mt-1 flex justify-center rounded-lg border-2 border-dashed px-6 py-10 cursor-pointer transition-colors duration-200 ease-in-out
            ${isDragging 
              ? 'border-[#0582FF] bg-[#0582FF]/10' 
              : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500'
            }
          `}
        >
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              <span className="font-semibold text-[#0582FF]">点击上传</span> 或拖拽文件到此区域
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-500">支持任意脚本文件 (例如 .py, .sh, .js)</p>
            {file && (
              <p className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">已选择: {file.name}</p>
            )}
          </div>
          <input
            id="script-file-input"
            ref={inputRef}
            type="file"
            className="sr-only" // Hide the actual input
            onChange={e => handleFileChange(e.target.files?.[0] || null)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          多平台解释器配置
        </label>
        <div className="mb-2 flex gap-2">
          {platformList.map(p => (
            <button
              key={p.key}
              type="button"
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 transition-colors border ${execConfigTab === p.key ? 'bg-[#0582FF] text-white border-[#0582FF]' : 'bg-neutral-100 dark:bg-[#232323] text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-[#333]'}`}
              onClick={() => setExecConfigTab(p.key as typeof execConfigTab)}
            >
              <span>{p.icon}</span> {p.label}
            </button>
          ))}
          <button
            type="button"
            className="ml-auto px-3 py-1.5 rounded-md text-xs font-medium bg-neutral-100 dark:bg-[#232323] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-[#333]"
            onClick={copyDefaultToAll}
          >
            一键应用默认配置到所有平台
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-neutral-100 dark:bg-neutral-900/30 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 ml-2"
            onClick={insertPythonAllPlatform}
          >
            一键插入Python全平台配置
          </button>
        </div>
        <div className="border rounded-lg p-4 bg-neutral-50 dark:bg-[#171717] border-neutral-200 dark:border-neutral-700">
          <div className="mb-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
            <span>{platformList.find(p => p.key === execConfigTab)?.icon}</span>
            <span>{platformList.find(p => p.key === execConfigTab)?.label}</span>
          </div>
          <div className="mb-2">
            <input
              type="text"
              className="block w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#232323] px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm focus:border-[#0582FF] focus:outline-none focus:ring-1 focus:ring-[#0582FF] dark:text-neutral-100 dark:placeholder-neutral-500"
              placeholder="解释器，如 python3/bash/powershell.exe"
              value={execConfig[execConfigTab].interpreter}
              onChange={e => handleExecConfigChange(execConfigTab, 'interpreter', e.target.value)}
            />
          </div>
          <div>
            <input
              type="text"
              className="block w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#232323] px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm focus:border-[#0582FF] focus:outline-none focus:ring-1 focus:ring-[#0582FF] dark:text-neutral-100 dark:placeholder-neutral-500"
              placeholder="参数（用空格、逗号或回车分隔）"
              value={execConfig[execConfigTab].args}
              onChange={e => handleExecConfigChange(execConfigTab, 'args', e.target.value)}
            />
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">示例：-u 或 --flag1 --flag2</div>
          </div>
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">如未配置某平台，将使用 default 配置作为回退。</div>
      </div>
      {error && <div className="text-red-600 dark:text-red-500 text-sm py-1 rounded-md bg-red-50 dark:bg-red-900/30 px-3">{error}</div>}
      <button
        type="submit"
        className="w-full flex justify-center rounded-md bg-[#0582FF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#006ADF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0582FF] disabled:cursor-not-allowed disabled:opacity-70 transition-colors duration-150"
        disabled={loading || !file || !name} // Disable if no file or name
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            处理中…
          </>
        ) : (
          '上传脚本'
        )}
      </button>
    </form>
  );
}
