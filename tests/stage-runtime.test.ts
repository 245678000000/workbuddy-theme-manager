import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

declare global {
  interface Window {
    __WB_SKIN_PAYLOAD: Record<string, unknown>;
    __wbSkinRuntime: {
      payload: { skinId: string };
      observer?: MutationObserver | null;
      dispose: (options: { restoreTheme: boolean }) => void;
    };
  }
}

const STAGE_JS = readFileSync(
  resolve(__dirname, '../src-tauri/src/skin/stage.js'),
  'utf8'
);

function applyPayload(payload: Record<string, unknown>) {
  window.__WB_SKIN_PAYLOAD = payload;
  return new Function(STAGE_JS)();
}

function skinPayload(skinId: string, css: string, extra: Record<string, unknown> = {}) {
  return {
    skinId,
    css,
    forceDark: false,
    stage: {
      wallpaper: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
      portraitHome: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
    },
    reset: false,
    ...extra,
  };
}

async function flushObservers() {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

describe('stage runtime lifecycle', () => {
  afterEach(() => {
    window.__wbSkinRuntime?.dispose?.({ restoreTheme: true });
    document.documentElement.removeAttribute('style');
    document.documentElement.className = '';
    document.body.replaceChildren();
    localStorage.clear();
  });

  it('replaces a previous skin without leaving a stale observer or duplicate style', async () => {
    applyPayload(skinPayload('skin-a', ':root { --skin: a }'));
    applyPayload(skinPayload('skin-b', ':root { --skin: b }'));

    document.getElementById('workbuddy-custom-skin-style')?.remove();
    document.body.appendChild(document.createElement('div')).className = 'route-change';
    await flushObservers();

    expect(document.documentElement.dataset.wbSkin).toBe('skin-b');
    expect(document.querySelectorAll('#workbuddy-custom-skin-style')).toHaveLength(1);
    expect(document.querySelector('#workbuddy-custom-skin-style')).toHaveTextContent('--skin: b');
    expect(window.__wbSkinRuntime.payload.skinId).toBe('skin-b');
  });

  it('reset removes manager layers, observers, storage, and workbuddy attributes', async () => {
    applyPayload(skinPayload('skin-a', ':root { --skin: a }'));
    applyPayload({
      skinId: 'builtin-default',
      css: '',
      forceDark: false,
      stage: null,
      reset: true,
    });

    document.body.appendChild(document.createElement('div')).className = 'route-change';
    await flushObservers();

    expect(document.querySelector('#workbuddy-custom-skin-style')).toBeNull();
    expect(document.querySelector('#wb-skin-stage')).toBeNull();
    expect(document.querySelector('#wb-skin-portraits')).toBeNull();
    expect(window.__wbSkinRuntime).toBeFalsy();
    expect(localStorage.getItem('wb-skin-payload')).toBeNull();
    expect(document.documentElement.getAttribute('data-wb-skin')).toBeNull();
    expect(document.documentElement.getAttribute('data-wb-scene')).toBeNull();
    expect(document.documentElement.getAttribute('data-wb-stage')).toBeNull();
    expect(document.documentElement.getAttribute('data-wb-native-theme')).toBeNull();
  });
});
