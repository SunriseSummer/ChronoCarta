// 高德地图配置
export const AMAP_KEY = 'd3b700f077e27b709a49ae9817e1b9db';
export const AMAP_SECRET = 'a0396ba65ef169a4e5bc6d8084ae2665';
/** 根据当前主题返回地图样式 */
export function getAMapStyle(): string {
  const theme = document.documentElement.getAttribute('data-theme');
  return theme === 'light' ? 'amap://styles/normal' : 'amap://styles/dark';
}
export const AMAP_VERSION = '2.0';

/** 初始化高德地图安全配置（页面生命周期内仅需调用一次） */
export function ensureAMapSecurity() {
  (window as Window & { _AMapSecurityConfig?: { securityJsCode: string } })._AMapSecurityConfig = {
    securityJsCode: AMAP_SECRET,
  };
}
