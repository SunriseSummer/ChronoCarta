/** 照片对象（后端 API 返回） */
export interface Photo {
  id: number;
  original: string;     // 原图 URL  /images/<id>/xxx.jpg
  thumb_sm: string;     // 128×128    地图标记（正方形裁切）
  thumb_md: string;     // 640×640    瀑布流/照片条（正方形裁切）
  thumb_banner: string; // ≤1600×1200 详情页头部（保留原始宽高比）
  width: number;
  height: number;
  sort_order: number;
  takenAt: number | null;
}

/** 地点数据模型 */
export interface Place {
  id: string;
  routePath: string;
  title: string;       // 地点名称
  lng: number;         // 经度
  lat: number;         // 纬度
  altitude?: number;   // 海拔（米）
  address?: string;    // 逆地理编码地址
  tags: string[];      // 标签列表
  photos: Photo[];     // 照片对象数组
  coverIndex: number;  // 封面照片索引
  description: string; // 文案描述
  tone: 'literary' | 'practical' | 'humor'; // 文案风格
  visitedAt?: number;  // 首次到访时间戳（用户可编辑）
  createdAt: number;   // 记录创建时间戳
  isPreset?: boolean;  // 是否为预置地点（只读）
  isDraft?: boolean;   // 是否为未确认的草稿记录
  isOwner?: boolean;   // 当前用户是否为创建者
  visibility?: 'private' | 'shared'; // 可见性：私密/共享
}

/** 用户信息 */
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;       // 头像 URL
  role: 'user' | 'admin'; // 用户角色
}

/** AI 服务配置 */
export interface AIConfig {
  provider: string;    // 服务商名称
  apiKey: string;      // API 密钥
  baseUrl: string;     // 接口地址
  model: string;       // 模型名称
}

/** 预设快捷标签 */
export const PRESET_TAGS = [
  '日出日落', '星空银河', '雪山冰川', '湖泊湿地', '沙漠戈壁',
  '草原牧场', '古镇老街', '寺庙古迹', '徒步穿越', '自驾公路',
  '野外露营', '高海拔', '亲子游', '摄影打卡', '美食推荐',
  '温泉泡汤', '赶海潮汐', '骑行路线', '无滤镜直出', '宝藏小众',
] as const;

/** AI 写作风格/内容标签（用于单次生成控制，不持久化） */
export const AI_STYLE_TAGS = [
  // 文风基调
  { key: 'literary',   label: '人文地理', icon: 'solar:book-bold',                  prompt: '以人文地理的抒情笔调描写，侧重历史底蕴与情感共鸣' },
  { key: 'practical',  label: '实用攻略', icon: 'solar:checklist-minimalistic-bold', prompt: '以实用攻略的风格描写，侧重路况、海拔、信息与避坑指南' },
  { key: 'humor',      label: '吐槽日记', icon: 'solar:ghost-bold',                  prompt: '以幽默吐槽的日记风格描写，诙谐有趣，侧重主观感受' },
  // 内容主题
  { key: 'landscape',  label: '赞美河山', icon: 'solar:mountains-bold',              prompt: '重点赞美自然风光的壮丽与美景' },
  { key: 'history',    label: '历史沧桑', icon: 'solar:hourglass-bold',              prompt: '融入历史典故与历史背景，增加厚重感' },
  { key: 'culture',    label: '文化民俗', icon: 'solar:diploma-bold',                prompt: '描写当地特色文化、民俗风情与人情味' },
  { key: 'food',       label: '美食诱惑', icon: 'solar:bowl-spoon-bold',             prompt: '描写当地特色美食与饮食文化，令人垂涎' },
  { key: 'freedom',    label: '自由旷野', icon: 'solar:wind-bold',                   prompt: '表达旷野自由之感、逃离城市的解脱与宁静' },
  { key: 'photo',      label: '摄影视角', icon: 'solar:camera-bold',                 prompt: '从摄影构图、光线与色彩角度描写，给出拍摄建议' },
  { key: 'emoji',      label: '小表情', icon: 'solar:sticker-smile-circle-2-bold',  prompt: '适当加入 Emoji 表情，增加活泼感和可读性' },
  { key: 'poem',       label: '古诗引用', icon: 'solar:pen-new-square-bold',         prompt: '引用或化用一句应景的古诗词融入文案' },
  { key: 'intimate',   label: '小红书风', icon: 'solar:heart-bold',                  prompt: '以小红书种草文体，亲切温暖，结尾有推荐语' },
] as const;

/** AI 服务商预设列表 */
export const PROVIDERS = [
  { label: 'KIMI (Moonshot)', baseUrl: 'https://api.moonshot.cn/v1', model: 'kimi-latest' },
  { label: 'GLM (智谱)', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4v-flash' },
  { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { label: 'OpenAI 兼容', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o' },
  { label: '自定义', baseUrl: '', model: '' },
] as const;
