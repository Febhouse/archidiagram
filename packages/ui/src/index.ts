// Shared UI Components & Design System Tokens for @repo/ui
export const UI_PACKAGE_NAME = '@repo/ui';
export const UI_PACKAGE_VERSION = '1.0.0';

export interface UIConfig {
  themeColor: string;
  borderRadius: string;
}

export const defaultUIConfig: UIConfig = {
  themeColor: '#f59e0b',
  borderRadius: '8px',
};
