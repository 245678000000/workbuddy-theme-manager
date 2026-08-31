import { describe, expect, it } from 'vitest';
import { buildCustomSkin, previewCustomSkin, type CustomSkinInput } from './customSkin';

const sampleInput: CustomSkinInput = {
  name: '定制皮肤',
  description: '测试',
  themeMode: 'dark',
  accentColor: '#38bdf8',
  opacity: 0.9,
  blur: 16,
  fontFamily: 'system-ui',
  customCss: '',
};

describe('buildCustomSkin', () => {
  it('preserves zero blur', () => {
    const result = buildCustomSkin({ ...sampleInput, blur: 0 });
    expect(result.config.blur).toBe(0);
    expect(result.cssContent).toContain('blur(0px)');
  });

  it('stores user css exactly once', () => {
    const result = buildCustomSkin({ ...sampleInput, customCss: '.x { color: red; }' });
    expect(result.config.custom_css).toBe('.x { color: red; }');
    expect(result.cssContent).not.toContain('.x { color: red; }');
  });

  it('preserves light preview mode', () => {
    const result = buildCustomSkin({ ...sampleInput, themeMode: 'light' });
    expect(result.forceDark).toBe(false);
  });

  it('keeps generated tokens and live selectors in base css', () => {
    const result = buildCustomSkin(sampleInput);
    expect(result.cssContent).toContain('--wb-accent');
    expect(result.cssContent).toContain('--wb-bg');
    expect(result.cssContent).toContain('.conversation-sidebar');
    expect(result.cssContent).toContain('.main-content');
  });
});

describe('previewCustomSkin', () => {
  it('includes user css for live preview without forcing dark mode', () => {
    const preview = previewCustomSkin({
      ...sampleInput,
      themeMode: 'light',
      customCss: '.x { color: red; }',
    });
    expect(preview.forceDark).toBe(false);
    expect(preview.css).toContain('blur(16px)');
    expect(preview.css).toContain('.x { color: red; }');
  });
});
