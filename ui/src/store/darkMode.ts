import { create } from 'zustand';

interface DarkModeStore {
  dark: boolean;
  toggle: () => void;
}

const saved = localStorage.getItem('nirdosh_dark_mode') === 'true';
if (saved) document.documentElement.classList.add('dark');

export const useDarkMode = create<DarkModeStore>((set, get) => ({
  dark: saved,
  toggle: () => {
    const next = !get().dark;
    set({ dark: next });
    localStorage.setItem('nirdosh_dark_mode', String(next));
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
}));
