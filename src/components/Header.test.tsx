import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
        appTheme="dark"
        onAppThemeChange={vi.fn()}
        onCheckUpdate={vi.fn()}
        hasUpdate={false}
      />
    );

    const launchButton = screen.getByRole('button', {
      name: '需先关闭后重启',
    }) as HTMLButtonElement;
    expect(launchButton.disabled).toBe(true);
  });

  it('triggers onAppThemeChange when clicking theme toggles', async () => {
    const user = userEvent.setup();
    const onThemeChange = vi.fn();
    render(
      <Header
        status={null}
        onLaunch={vi.fn()}
        onClose={vi.fn()}
        onReset={vi.fn()}
        loading={false}
        appTheme="dark"
        onAppThemeChange={onThemeChange}
        onCheckUpdate={vi.fn()}
        hasUpdate={false}
      />
    );

    await user.click(screen.getByTitle('软件浅色模式'));
    expect(onThemeChange).toHaveBeenCalledWith('light');

    await user.click(screen.getByTitle('软件跟随操作系统'));
    expect(onThemeChange).toHaveBeenCalledWith('system');
  });

  it('triggers onCheckUpdate when clicking update button', async () => {
    const user = userEvent.setup();
    const onCheckUpdate = vi.fn();
    render(
      <Header
        status={null}
        onLaunch={vi.fn()}
        onClose={vi.fn()}
        onReset={vi.fn()}
        loading={false}
        appTheme="dark"
        onAppThemeChange={vi.fn()}
        onCheckUpdate={onCheckUpdate}
        hasUpdate={true}
      />
    );

    await user.click(screen.getByTitle('检查 GitHub 最新版本更新'));
    expect(onCheckUpdate).toHaveBeenCalled();
  });
});
