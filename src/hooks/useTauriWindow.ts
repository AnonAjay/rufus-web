import { useState, useCallback, useEffect } from "react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";

interface WindowState {
  isMaximized: boolean;
  isMiniMode: boolean;
  isTauri: boolean;
}

export const useTauriWindow = () => {
  const [windowState, setWindowState] = useState<WindowState>({
    isMaximized: false,
    isMiniMode: false,
    isTauri: false,
  });

  useEffect(() => {
    const isTauriEnv =
      typeof window !== "undefined" &&
      Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);

    setWindowState((prev) => ({ ...prev, isTauri: isTauriEnv }));

    if (isTauriEnv) {
      const win = getCurrentWindow();

      // Ensure window is NOT topmost on regular boot
      win.setAlwaysOnTop(false).catch((err) => {
        console.warn("[TauriWindow] Failed to clear alwaysOnTop flag:", err);
      });

      win
        .isMaximized()
        .then((maximized) => {
          setWindowState((prev) => ({ ...prev, isMaximized: maximized }));
        })
        .catch((err) => {
          console.warn("[TauriWindow] Failed to check maximized state:", err);
        });

      // Listen for window resize/maximize events
      const unlistenPromise = win.onResized(async () => {
        try {
          const maximized = await win.isMaximized();
          setWindowState((prev) => ({ ...prev, isMaximized: maximized }));
        } catch {
          // Ignore
        }
      });

      return () => {
        unlistenPromise.then((unlisten) => unlisten());
      };
    }
  }, []);

  const minimize = useCallback(async () => {
    try {
      const win = getCurrentWindow();
      await win.minimize();
    } catch (err) {
      console.error("[TauriWindow] minimize error:", err);
    }
  }, []);

  const toggleMaximize = useCallback(async () => {
    try {
      const win = getCurrentWindow();
      await win.toggleMaximize();
      const maximized = await win.isMaximized();
      setWindowState((prev) => ({ ...prev, isMaximized: maximized }));
    } catch (err) {
      console.error("[TauriWindow] toggleMaximize error:", err);
      setWindowState((prev) => ({ ...prev, isMaximized: !prev.isMaximized }));
    }
  }, []);

  const close = useCallback(async () => {
    try {
      const win = getCurrentWindow();
      await win.close();
    } catch (err) {
      console.error("[TauriWindow] close error:", err);
    }
  }, []);

  const toggleMiniMode = useCallback(async () => {
    const nextMini = !windowState.isMiniMode;
    setWindowState((prev) => ({ ...prev, isMiniMode: nextMini }));

    try {
      const win = getCurrentWindow();
      if (nextMini) {
        await win.setSize(new LogicalSize(380, 520));
        await win.setAlwaysOnTop(true);
      } else {
        await win.setSize(new LogicalSize(1080, 720));
        await win.setAlwaysOnTop(false);
      }
    } catch (err) {
      console.error("[TauriWindow] toggleMiniMode error:", err);
    }
  }, [windowState.isMiniMode]);

  return {
    ...windowState,
    minimize,
    toggleMaximize,
    close,
    toggleMiniMode,
  };
};
