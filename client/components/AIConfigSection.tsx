import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { getAIConfig, saveAIConfig } from '../store/db';
import { testConnection } from '../store/ai';
import type { AIConfig } from '../types';
import { PROVIDERS } from '../types';
import PageSection from './PageSection';

interface AIConfigSectionProps {
  userId: string;
}

export default function AIConfigSection({ userId }: AIConfigSectionProps) {
  const [provider, setProvider] = useState<string>(PROVIDERS[0].label);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState<string>(PROVIDERS[0].baseUrl);
  const [model, setModel] = useState<string>(PROVIDERS[0].model);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getAIConfig().then((cfg) => {
      if (cfg) {
        setApiKey(cfg.apiKey);
        setBaseUrl(cfg.baseUrl);
        setModel(cfg.model);
        setProvider(cfg.provider || PROVIDERS[0].label);
      }
    });
  }, [userId]);

  function handleProviderChange(label: string) {
    setProvider(label);
    const found = PROVIDERS.find((p) => p.label === label);
    if (found && found.baseUrl) {
      setBaseUrl(found.baseUrl);
      setModel(found.model);
    }
    setTestResult(null);
  }

  async function handleSave() {
    const config: AIConfig = { provider, apiKey, baseUrl, model };
    await saveAIConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const ok = await testConnection({ provider, apiKey, baseUrl, model });
      setTestResult(ok ? 'success' : 'fail');
    } catch {
      setTestResult('fail');
    } finally {
      setTesting(false);
    }
  }

  return (
    <>
      <PageSection title="AI 服务配置" description="BYOK 模式 · 密钥仅存储在本地" className="pt-2" />

      <div className="space-y-2">
        <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">服务商</label>
        <select
          value={provider}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
        >
          {PROVIDERS.map((p) => (
            <option key={p.label} value={p.label}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">API Key</label>
        <input
          type="password"
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => { setApiKey(e.target.value); setTestResult(null); }}
          className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Base URL</label>
        <input
          type="url"
          placeholder="https://api.example.com/v1"
          value={baseUrl}
          onChange={(e) => { setBaseUrl(e.target.value); setTestResult(null); }}
          className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">模型名称</label>
        <input
          type="text"
          placeholder="gpt-4o"
          value={model}
          onChange={(e) => { setModel(e.target.value); setTestResult(null); }}
          className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleTest}
          disabled={testing || !apiKey}
          className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground font-heading font-bold py-3 rounded-xl border border-border hover:bg-secondary/80 transition-all cursor-pointer disabled:opacity-50"
        >
          {testing ? (
            <Icon icon="solar:refresh-bold" className="size-5 animate-spin" />
          ) : (
            <Icon icon="solar:plug-circle-bold" className="size-5" />
          )}
          <span>{testing ? '测试中...' : '测试连接'}</span>
        </button>
        <button
          onClick={handleSave}
          className="flex-1 bg-primary text-primary-foreground font-heading font-bold py-3 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          {saved ? '✅ 已保存' : '保存配置'}
        </button>
      </div>

      {testResult === 'success' && (
        <div className="bg-success/30 border border-success/50 rounded-xl p-4 flex items-center gap-3 animate-in fade-in">
          <span className="text-3xl">🎉</span>
          <div>
            <p className="font-bold text-success-foreground">连接成功！</p>
            <p className="text-xs text-success-foreground/70">AI 服务已就绪，可以使用智能描写功能了</p>
          </div>
        </div>
      )}
      {testResult === 'fail' && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3">
          <span className="text-3xl">❌</span>
          <div>
            <p className="font-bold text-destructive">连接失败</p>
            <p className="text-xs text-destructive/70">请检查 API Key、Base URL 和模型名称是否正确</p>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <h4 className="font-bold text-sm">关于 BYOK 模式</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          本应用采用 BYOK（Bring Your Own Key）模式，所有 AI 请求直接从您的浏览器发送到 AI 服务商，
          不经过任何第三方服务器。您的 API Key 仅保存在本地浏览器中，完全私有。
        </p>
      </div>
    </>
  );
}
