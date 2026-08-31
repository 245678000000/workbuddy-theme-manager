import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

describe('Header', () => {
  it('requires a safe close before starting a debug session', () => {
    render(
      <Header
        status={{
          is_installed: true,
          is_running: true,
          cdp_connected: false,
          debugging_port: 9333,
        }}
        onLaunch={vi.fn()}
        onClose={vi.fn()}
        onReset={vi.fn()}
        loading={false}
      />
    );

    const launchButton = screen.getByRole('button', {
      name: '请先安全关闭后启动',
    }) as HTMLButtonElement;
    expect(launchButton.disabled).toBe(true);
  });
});
