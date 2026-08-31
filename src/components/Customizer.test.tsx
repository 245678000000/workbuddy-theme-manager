import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Skin } from '../types/skin';
import { Customizer } from './Customizer';

const parchment: Skin = {
  manifest: {
    id: 'builtin-parchment',
    name: '温润羊皮纸 (Warm Parchment)',
    version: '1.0.0',
    author: 'WorkBuddy Skin Manager',
    description: '柔和米黄低疲劳护眼阅读体验',
    themeMode: 'light',
    accentColor: '#b45309',
  },
  css_content: '',
  config: { opacity: 1, blur: 0, custom_accent: '#b45309' },
  is_builtin: true,
};

describe('Customizer', () => {
  it('preserves parchment blur of 0px', () => {
    render(
      <Customizer
        initialSkin={parchment}
        isOpen
        onClose={vi.fn()}
        onApplyCustom={vi.fn()}
        onSaveCustom={vi.fn()}
        loading={false}
      />
    );

    expect(screen.getByText('0px')).toBeInTheDocument();
  });

  it('sends light theme mode with live preview', async () => {
    const user = userEvent.setup();
    const onApplyCustom = vi.fn();
    render(
      <Customizer
        initialSkin={parchment}
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
});
