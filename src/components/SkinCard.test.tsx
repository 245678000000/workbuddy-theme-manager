import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Skin } from '../types/skin';
import { SkinCard } from './SkinCard';

const jingtian: Skin = {
  manifest: {
    id: 'jingtian-starlight',
    name: '景甜 · STARLIGHT 星蝶光廊',
    version: '1.0.0',
    author: 'Wangnov',
    description: '偶像星蝶浅色陪伴主题',
    themeMode: 'light',
    accentColor: '#7046E8',
  },
  css_content: '',
  config: { opacity: 0.58, blur: 22, custom_accent: '#7046E8' },
  is_builtin: true,
};

describe('SkinCard', () => {
  it('does not expose delete on the builtin jingtian skin', () => {
    render(
      <SkinCard
        skin={jingtian}
        isActive={false}
        onApply={vi.fn()}
        onCustomize={vi.fn()}
        onDelete={vi.fn()}
        loading={false}
      />
    );

    expect(screen.queryByTitle('删除自定义皮肤')).not.toBeInTheDocument();
  });
});
