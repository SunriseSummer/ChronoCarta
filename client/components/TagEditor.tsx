import { useState } from 'react';
import { Icon } from '@iconify/react';
import { PRESET_TAGS } from '../types';

interface TagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagEditor({ tags, onChange }: TagEditorProps) {
  const [input, setInput] = useState('');

  /** 添加标签（去重、去 # 前缀） */
  function addTag(raw?: string) {
    const t = (raw ?? input).trim().replace(/^#/, '');
    if (t && !tags.includes(t)) onChange([...tags, t]);
    if (!raw) setInput('');
  }

  function removeTag(tag: string) {
    onChange(tags.filter((x) => x !== tag));
  }

  return (
    <div className="space-y-3">
      <h3 className="font-heading font-extrabold text-xl">地理标签</h3>

      {/* 已选标签 + 输入框 */}
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="bg-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-bold border border-primary/30 flex items-center gap-1"
          >
            {t}
            <button onClick={() => removeTag(t)} className="ml-1 cursor-pointer">
              <Icon icon="solar:close-circle-bold" className="size-3 text-muted-foreground" />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1">
          <input
            type="text"
            placeholder="自定义标签"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTag()}
            className="bg-secondary/20 text-secondary-foreground px-3 py-1.5 rounded-full text-xs font-bold border border-secondary/30 outline-none w-24"
          />
          <button
            onClick={() => addTag()}
            className="bg-secondary/20 text-secondary-foreground p-1.5 rounded-full border border-secondary/30 cursor-pointer"
          >
            <Icon icon="hugeicons:add-01" className="size-3" />
          </button>
        </div>
      </div>

      {/* 预置标签快选 */}
      <div className="flex flex-wrap gap-2 pt-2">
        {PRESET_TAGS.filter((t) => !tags.includes(t)).map((t) => (
          <button
            key={t}
            onClick={() => addTag(t)}
            className="px-3 py-1 rounded-full text-xs border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
          >
            + {t}
          </button>
        ))}
      </div>
    </div>
  );
}
