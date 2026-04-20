/**
 * AI 服务调用层
 * 通过 OpenAI 兼容接口流式生成旅行文案与标签
 */
import type { AIConfig } from '../types';
import { AI_STYLE_TAGS } from '../types';

type ContentBlock = { type: string; text?: string; image_url?: { url: string } };

interface AIMessage {
  role: 'system' | 'user';
  content: string | ContentBlock[];
}

export interface LocationInfo {
  title: string;
  lng: number;
  lat: number;
  altitude?: number;
  address?: string;
}

export interface GenerateOptions {
  styleTags: string[];
  customTagPrompts?: string[];
  includePhotos: boolean;
  autoTags: boolean;
}

// ── 内部工具函数 ──

/** 将图片 URL 转为 base64 data URL（服务端相对路径自动 fetch 转换） */
async function toBase64DataUrl(photo: string, signal?: AbortSignal): Promise<string | null> {
  if (photo.startsWith('data:')) return photo;
  if (!photo.startsWith('/')) return null;
  try {
    const blob = await fetch(photo, { signal }).then(r => r.blob());
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** 根据选中的风格标签和自定义提示词构建风格指令文本 */
function buildStyleInstruction(styleTags: string[], customTagPrompts: string[]): string {
  const tagPrompts = styleTags
    .map(key => AI_STYLE_TAGS.find(t => t.key === key)?.prompt)
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const allPrompts = [...tagPrompts, ...customTagPrompts];
  return allPrompts.length > 0
    ? allPrompts.map((p, i) => `${i + 1}. ${p}`).join('\n')
    : '1. 以自然流畅的旅行笔记风格描写';
}

/** 格式化位置信息为文本 */
function formatLocationInfo(location: LocationInfo): string {
  return [
    `地点: ${location.title}`,
    `坐标: ${location.lat}N, ${location.lng}E`,
    location.altitude ? `海拔: ${location.altitude}m` : '',
    location.address ? `地址: ${location.address}` : '',
  ].filter(Boolean).join('\n');
}

/** 构建用户消息（位置文本 + 可选照片） */
async function buildUserContent(
  photos: string[],
  location: LocationInfo,
  includePhotos: boolean,
  signal?: AbortSignal,
): Promise<AIMessage['content']> {
  const locInfo = formatLocationInfo(location);
  if (!includePhotos) return locInfo;

  const blocks: ContentBlock[] = [{ type: 'text', text: locInfo }];
  for (const photo of photos.slice(0, 3)) {
    const dataUrl = await toBase64DataUrl(photo, signal);
    if (dataUrl) blocks.push({ type: 'image_url', image_url: { url: dataUrl } });
  }
  return blocks.length > 1 ? blocks : locInfo;
}

/** 调用 AI 聊天补全 API */
function callChatCompletions(
  config: AIConfig,
  messages: AIMessage[],
  options?: { stream?: boolean; signal?: AbortSignal },
): Promise<Response> {
  return fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      ...(options?.stream ? { stream: true } : {}),
    }),
    signal: options?.signal,
  });
}

// ── 公开 API ──

/** 流式生成旅行文案；onChunk 回调每次更新已累积的文案（不含 TAGS 行） */
export async function generateDescriptionStream(
  config: AIConfig,
  photos: string[],
  location: LocationInfo,
  options: GenerateOptions,
  onChunk: (partialText: string) => void,
  signal?: AbortSignal,
): Promise<{ tags: string[] }> {
  const { styleTags, customTagPrompts = [], includePhotos, autoTags } = options;

  const styleInstruction = buildStyleInstruction(styleTags, customTagPrompts);
  const tagInstruction = autoTags
    ? '文案结束后另起一行，以"TAGS:"开头，后接3-5个地理/主题标签（逗号分隔，不带#号），例如：TAGS: 高海拔, 古镇, 徒步'
    : '';

  const systemPrompt = `你是一位旅行文案大师。用户会提供旅行地点的信息${includePhotos ? '和照片' : ''}。请按如下格式输出，不要有任何JSON或Markdown格式符号：
先输出150-300字的中文旅行文案，要求：
${styleInstruction}
${tagInstruction}
只输出文案${autoTags ? '和标签行' : ''}，不要其他内容。`;

  const content = await buildUserContent(photos, location, includePhotos, signal);

  const res = await callChatCompletions(
    config,
    [{ role: 'system', content: systemPrompt }, { role: 'user', content }],
    { stream: true, signal },
  );
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`AI 请求失败 (${res.status}): ${errText}`);
  }

  if (!res.body) {
    throw new Error('AI 响应体为空');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let sseBuffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    sseBuffer += decoder.decode(value, { stream: true });
    const lines = sseBuffer.split('\n');
    sseBuffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content ?? '';
        if (delta) {
          accumulated += delta;
          const tagsIdx = accumulated.search(/\nTAGS:/i);
          onChunk(tagsIdx >= 0 ? accumulated.slice(0, tagsIdx).trim() : accumulated);
        }
      } catch { /* skip malformed SSE frame */ }
    }
  }

  const tags: string[] = [];
  if (autoTags) {
    const match = accumulated.match(/\nTAGS:\s*(.+)/i);
    if (match) {
      tags.push(...match[1].split(/[,，]/).map(t => t.trim()).filter(Boolean));
    }
  }
  return { tags };
}

/** 测试 AI 服务连接是否可用 */
export async function testConnection(config: AIConfig): Promise<boolean> {
  try {
    const res = await callChatCompletions(config, [
      { role: 'user', content: '你好，请回复"连接成功"' },
    ]);
    return res.ok;
  } catch {
    return false;
  }
}
