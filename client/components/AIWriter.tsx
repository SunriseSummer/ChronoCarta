import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AI_STYLE_TAGS } from '../types';
import type { AIConfig } from '../types';
import { getAIConfig } from '../store/db';
import { generateDescriptionStream } from '../store/ai';

interface AIWriterProps {
  description: string;
  onDescriptionChange: (text: string) => void;
  /** 文风（保留以兼容旧保存逻辑） */
  tone: 'literary' | 'practical' | 'humor';
  onToneChange: (tone: 'literary' | 'practical' | 'humor') => void;
  photos: string[];
  location: { title: string; lng: number; lat: number; altitude?: number; address?: string };
  onTagsGenerated?: (tags: string[]) => void;
}

export default function AIWriter({
  description,
  onDescriptionChange,
  tone,
  onToneChange,
  photos,
  location,
  onTagsGenerated,
}: AIWriterProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // 风格/内容标签多选（默认选中与 tone 对应的预设标签）
  const [selectedTags, setSelectedTags] = useState<string[]>([tone]);
  // 是否携带照片
  const [includePhotos, setIncludePhotos] = useState(false);
  // 是否自动生成地理标签
  const [autoTags, setAutoTags] = useState(true);
  // 自定义标签输入
  const [customInput, setCustomInput] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  // 面板展开/折叠
  const [expanded, setExpanded] = useState(true);

  function toggleTag(key: string) {
    setSelectedTags(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  function addCustomTag() {
    const tag = customInput.trim();
    if (tag && !customTags.includes(tag)) {
      setCustomTags(prev => [...prev, tag]);
    }
    setCustomInput('');
  }

  function removeCustomTag(tag: string) {
    setCustomTags(prev => prev.filter(t => t !== tag));
  }

  function handleCancel() {
    abortRef.current?.abort();
  }

  // 组件卸载时中止未完成的 AI 请求，避免内存泄漏与状态更新告警
  useEffect(() => () => abortRef.current?.abort(), []);

  async function handleGenerate() {
    const config: AIConfig | null = await getAIConfig();
    if (!config?.apiKey) {
      navigate('/profile', { state: { needApiKey: true } });
      return;
    }

    // 同步 tone（取第一个命中的 tone key）
    const toneKeys = ['literary', 'practical', 'humor'] as const;
    const matched = toneKeys.find(k => selectedTags.includes(k));
    if (matched) onToneChange(matched);

    // 取消上一次未完成的请求
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const result = await generateDescriptionStream(
        config,
        photos,
        location,
        {
          styleTags: [...selectedTags],
          customTagPrompts: customTags,
          includePhotos,
          autoTags,
        },
        (partialText) => {
          onDescriptionChange(partialText);
        },
        controller.signal,
      );
      if (result.tags.length) {
        onTagsGenerated?.(result.tags.map((t) => t.replace(/^#/, '')));
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('未知错误');
      if (error.name !== 'AbortError') {
        alert('AI 生成失败: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const hasPhotos = photos.length > 0;

  return (
    <div className="space-y-4">
      {/* 标题 + 操作按钮 */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-extrabold text-xl">此地有感</h3>
        <div className="flex items-center gap-2">
          {/* 展开/折叠选项面板 */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={expanded ? '收起选项' : '展开选项'}
          >
            <Icon
              icon={expanded ? 'solar:alt-arrow-up-line-duotone' : 'solar:alt-arrow-down-line-duotone'}
              className="size-4"
            />
          </button>
          {/* 取消 / 生成按钮 */}
          {loading ? (
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/20 px-4 py-1.5 rounded-full hover:bg-destructive/20 transition-colors cursor-pointer"
            >
              <Icon icon="solar:stop-bold" className="size-4" />
              <span className="text-xs font-bold">停止</span>
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full hover:bg-primary/20 transition-colors group cursor-pointer"
            >
              <Icon icon="solar:magic-stick-3-bold" className="size-4 group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-bold">智能生成</span>
            </button>
          )}
        </div>
      </div>

      {/* 可折叠的选项面板 */}
      {expanded && (
        <div className="bg-card/60 border border-border rounded-2xl p-4 space-y-4">

          {/* 开关选项行 */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* 带照片开关 */}
            <button
              onClick={() => setIncludePhotos(v => !v)}
              disabled={!hasPhotos}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                includePhotos && hasPhotos
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-muted text-muted-foreground'
              }`}
            >
              <Icon icon="solar:camera-bold" className="size-3.5" />
              <span>AI 看图说话</span>
              {includePhotos && hasPhotos && <Icon icon="solar:check-circle-bold" className="size-3.5" />}
            </button>

            {/* 自动生成地理标签开关 */}
            <button
              onClick={() => setAutoTags(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                autoTags
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-muted text-muted-foreground'
              }`}
            >
              <Icon icon="solar:tag-bold" className="size-3.5" />
              <span>生成地理标签</span>
              {autoTags && <Icon icon="solar:check-circle-bold" className="size-3.5" />}
            </button>
          </div>

          {/* 风格/内容标签 */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">写作风格 · 可多选</p>
            <div className="flex flex-wrap gap-2">
              {AI_STYLE_TAGS.map(tag => {
                const active = selectedTags.includes(tag.key);
                return (
                  <button
                    key={tag.key}
                    onClick={() => toggleTag(tag.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-muted/50 text-muted-foreground hover:border-muted hover:text-foreground'
                    }`}
                  >
                    <Icon icon={tag.icon} className="size-3.5" />
                    <span>{tag.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 自定义提示标签 */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">自定义提示</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
                placeholder="输入自定义提示词，回车确认..."
                className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={addCustomTag}
                disabled={!customInput.trim()}
                className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer disabled:opacity-40"
              >
                添加
              </button>
            </div>
            {customTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {customTags.map(tag => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold"
                  >
                    {tag}
                    <button onClick={() => removeCustomTag(tag)} className="hover:text-destructive transition-colors cursor-pointer ml-0.5">
                      <Icon icon="solar:close-circle-bold" className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 文字编辑区 */}
      <textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder={'点击「智能生成」让 AI 为这段记忆提炼文字...'}
        className="w-full bg-card/50 border border-border rounded-xl p-4 min-h-[120px] text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring resize-none scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full"
      />
    </div>
  );
}
