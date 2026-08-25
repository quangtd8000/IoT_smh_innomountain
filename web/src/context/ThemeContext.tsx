import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemePref = 'light' | 'dark' | 'system';
export type Resolved = 'light' | 'dark';

interface ThemeContextValue {
  /** Điều người dùng đã chọn */
  pref: ThemePref;
  /** Điều đang thực sự hiển thị */
  resolved: Resolved;
  setPref: (p: ThemePref) => void;
  /** Đổi qua lại sáng ↔ tối */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'smarthome-theme';

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    // localStorage có thể bị chặn — coi như chưa chọn gì
  }
  return 'system';
}

function systemTheme(): Resolved {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pref, setPrefState] = useState<ThemePref>(readPref);
  const [resolved, setResolved] = useState<Resolved>(() =>
    readPref() === 'system' ? systemTheme() : (readPref() as Resolved)
  );

  // Theo dõi cài đặt hệ thống, chỉ khi người dùng chọn "theo hệ thống"
  useEffect(() => {
    if (pref !== 'system') {
      setResolved(pref);
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => setResolved(mq.matches ? 'dark' : 'light');
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [pref]);

  // Luôn ghi giá trị tường minh, không bao giờ để trống
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved);
  }, [resolved]);

  const setPref = useCallback((p: ThemePref) => {
    setPrefState(p);
    try {
      localStorage.setItem(STORAGE_KEY, p);
    } catch {
      // Không lưu được thì vẫn đổi trong phiên này
    }
  }, []);

  const toggle = useCallback(() => {
    setPref(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved, setPref]);

  return (
    <ThemeContext.Provider value={{ pref, resolved, setPref, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme phải nằm trong ThemeProvider');
  return ctx;
};
