import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Skin } from '../types/skin';
import { Customizer } from './Customizer';

const stockLight: Skin = {
  manifest: {
    id: 'builtin-light',
    name: '官方原味 · 浅色 (Stock Light)',
    version: '1.0.0',
    author: 'Tencent WorkBuddy',
    description: '切换为官方原生浅色视觉与纯净清新配色方案',
    themeMode: 'light',
    accentColor: '#0066FF',
  },
  css_content: '',
  config: { opacity: 1, blur: 0, custom_accent: '#0066FF' },
  is_builtin: true,
};

describe('Customizer', () => {
  it('preserves stockLight blur of 0px', () => {
    render(
      <Customizer
        initialSkin={stockLight}
        isOpen
        onClose={vi.fn()}
        onApplyCustom={vi.fn()}
        onSaveCustom={vi.fn()}
        loading={false}
      />
    );

    expect(screen.getByText('0px')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /跟随系统/ })).toBeInTheDocument();
  });

  it('sends light theme mode with live preview', async () => {
    const user = userEvent.setup();
    const onApplyCustom = vi.fn();
    render(
      <Customizer
        initialSkin={stockLight}
        isOpen
        onClose={vi.fn()}
        onApplyCustom={onApplyCustom}
        onSaveCustom={vi.fn()}
        loading={false}
      />
    );

    await user.click(screen.getByRole('button', { name: /即时试穿预览/ }));
    expect(onApplyCustom).toHaveBeenCalledWith(expect.any(String), 'light');
    const css = onApplyCustom.mock.calls[0][0] as string;
    expect(css).toContain('blur(0px)');
  });

  it('distinguishes between override save and save as new for custom skins', async () => {
    const user = userEvent.setup();
    const onSaveCustom = vi.fn();
    const customSkin: Skin = {
      manifest: {
        id: 'custom-abc12345',
        name: '我的定制',
        version: '1.0.0',
        author: 'User Custom',
        description: '我的专属主题',
        themeMode: 'dark',
        accentColor: '#38bdf8',
      },
      css_content: '',
      config: { opacity: 0.9, blur: 16 },
      is_builtin: false,
    };

    render(
      <Customizer
        initialSkin={customSkin}
        isOpen
        onClose={vi.fn()}
        onApplyCustom={vi.fn()}
        onSaveCustom={onSaveCustom}
        loading={false}
      />
    );

    // 点击「保存修改」
    await user.click(screen.getByRole('button', { name: /保存修改/ }));
    expect(onSaveCustom).toHaveBeenCalledWith(
      'custom-abc12345',
      '我的定制',
      expect.any(String),
      'dark',
      '#38bdf8',
      expect.any(String),
      expect.any(Object)
    );
  });
});
