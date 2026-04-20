/** 数据库行类型定义 */

export interface PlaceRow {
  id: string;
  title: string;
  lng: number;
  lat: number;
  altitude: number | null;
  address: string;
  category: string;
  description: string;
  tone: string;
  visited_at: number | null;
  created_at: number;
  updated_at: number;
  user_id: string | null;
  is_preset: number;
  is_draft: number;
  visibility: string;
  route_path: string;
  image_dir: string;
}

export interface PhotoRow {
  id: number;
  place_id: string;
  sort_order: number;
  is_cover: number;
  original: string;
  thumb_sm: string;
  thumb_md: string;
  thumb_banner: string;
  width: number;
  height: number;
  size_bytes: number;
  taken_at: number | null;
  created_at: number;
}

export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
  avatar: string;
  created_at: number;
  role: string;
}
