import { useState, useCallback, useEffect } from "react";
import { getCurrentWindow, Window } from "@tauri-apps/api/window";

export interface WindowState {
  isMaximized: boolean;
  isCapsuleVisible: boolean;
  isTauri: boolean;
}

export const useTauriWindow = () => {
  const [windowState, setWindowState] = useState<WindowState>({
    isMaximized: false,
    isCapsuleVisible: false,
    isTauri: false,
  });

  useEffect(() => {
    const isTauriEnv =
      typeof window !== "undefined" &&
      Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);

    setWindowState((prev) => ({ ...prev, isTauri: isTauriEnv }));

    if (isTauriEnv) {
      const win = getCurrentWindow();

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

  /**
   * Close handler: If closing main window while capsule is open,
   * hide main window to background so mini player remains active (Spotify pattern).
   */
  const close = useCallback(async () => {
    try {
      const win = getCurrentWindow();
      if (win.label === "main") {
        const capsule = await Window.getByLabel("capsule");
        const isCapsuleVis = capsule ? await capsule.isVisible() : false;
        if (isCapsuleVis) {
          await win.hide();
          return;
        }
      }
      await win.close();
    } catch (err) {
      console.error("[TauriWindow] close error:", err);
    }
  }, []);

  /**
   * Open / Show the detached Island Capsule window
   */
  const openCapsuleWindow = useCallback(async () => {
    try {
      const capsule = await Window.getByLabel("capsule");
      if (capsule) {
        await capsule.show();
        await capsule.setFocus();
        setWindowState((prev) => ({ ...prev, isCapsuleVisible: true }));
      }
    } catch (err) {
      console.error("[TauriWindow] openCapsuleWindow error:", err);
    }
  }, []);

  /**
   * Hide the detached Island Capsule window
   */
  const hideCapsuleWindow = useCallback(async () => {
    try {
      const capsule = await Window.getByLabel("capsule");
      if (capsule) {
        await capsule.hide();
        setWindowState((prev) => ({ ...prev, isCapsuleVisible: false }));
      }
    } catch (err) {
      console.error("[TauriWindow] hideCapsuleWindow error:", err);
    }
  }, []);

  /**
   * Toggle the detached Island Capsule window visibility
   */
  const toggleMiniMode = useCallback(async () => {
    try {
      const capsule = await Window.getByLabel("capsule");
      if (capsule) {
        const isVis = await capsule.isVisible();
        if (isVis) {
          await capsule.hide();
          setWindowState((prev) => ({ ...prev, isCapsuleVisible: false }));
        } else {
          await capsule.show();
          await capsule.setFocus();
          setWindowState((prev) => ({ ...prev, isCapsuleVisible: true }));
        }
      }
    } catch (err) {
      console.error("[TauriWindow] toggleMiniMode error:", err);
    }
  }, []);

  return {
    ...windowState,
    isMiniMode: windowState.isCapsuleVisible,
    minimize,
    toggleMaximize,
    close,
    openCapsuleWindow,
    hideCapsuleWindow,
    toggleMiniMode,
  };
};
