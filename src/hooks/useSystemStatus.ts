import { useState, useEffect } from "react";
import { SystemStatus } from "../types/agent";

const HEALTH_URL = "http://127.0.0.1:8000/health";

export const useSystemStatus = () => {
  const [status, setStatus] = useState<SystemStatus>({
    backendOnline: false,
    ollamaOnline: false,
    lastChecked: "",
  });

  const checkHealth = async () => {
    try {
      const res = await fetch(HEALTH_URL, { method: "GET" });
      if (res.ok) {
        setStatus({
          backendOnline: true,
          ollamaOnline: true, // If backend is responsive and healthy
          lastChecked: new Date().toLocaleTimeString(),
        });
      } else {
        setStatus((prev) => ({
          ...prev,
          backendOnline: false,
          lastChecked: new Date().toLocaleTimeString(),
        }));
      }
    } catch {
      setStatus({
        backendOnline: false,
        ollamaOnline: false,
        lastChecked: new Date().toLocaleTimeString(),
      });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 6000);
    return () => clearInterval(interval);
  }, []);

  return { status, checkHealth };
};
