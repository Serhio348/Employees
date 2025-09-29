import React from 'react';
import { ConfigProvider, theme } from 'antd';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeWrapperProps {
  children: React.ReactNode;
}

const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ children }) => {
  const { theme: currentTheme } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          colorInfo: '#3b82f6',
          borderRadius: 8,
          borderRadiusLG: 12,
          boxShadow: 'var(--shadow-md)',
          boxShadowSecondary: 'var(--shadow-sm)',
          colorBgContainer: 'var(--bg-primary)',
          colorBgElevated: 'var(--bg-secondary)',
          colorText: 'var(--text-primary)',
          colorTextSecondary: 'var(--text-secondary)',
          colorBorder: 'var(--border-color)',
          colorBorderSecondary: 'var(--border-color)',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: 14,
          fontSizeLG: 16,
          fontSizeXL: 18,
          fontWeightStrong: 600,
          lineHeight: 1.6,
          motionDurationSlow: '0.3s',
          motionDurationMid: '0.2s',
          motionDurationFast: '0.1s',
          motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
          motionEaseOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        },
        components: {
          Button: {
            borderRadius: 8,
            boxShadow: 'var(--shadow-sm)',
          },
          Card: {
            borderRadius: 12,
            boxShadow: 'var(--shadow-md)',
          },
          Table: {
            borderRadius: 12,
          },
          Modal: {
            borderRadius: 16,
            boxShadow: 'var(--shadow-xl)',
          },
          Input: {
            borderRadius: 8,
          },
          Select: {
            borderRadius: 8,
          },
          Switch: {
            borderRadius: 20,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default ThemeWrapper;
