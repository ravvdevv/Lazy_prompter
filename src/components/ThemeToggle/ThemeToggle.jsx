import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

const THEMES = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'Match system', Icon: Monitor },
];

const isTheme = (value) => THEMES.some((theme) => theme.value === value);

const readStoredTheme = () => {
  try {
    const stored = localStorage.getItem('theme');
    return isTheme(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
};

const ThemeToggle = () => {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      document.documentElement.classList.toggle('dark', resolved === 'dark');
      document.documentElement.style.colorScheme = resolved;
    };

    apply();

    if (theme !== 'system') return undefined;
    // "system" only stays honest while it keeps listening to the OS.
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  const select = (value) => {
    setTheme(value);
    try {
      localStorage.setItem('theme', value);
    } catch {
      /* storage blocked: the choice still applies for this session */
    }
  };

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-line bg-inset p-0.5">
      {THEMES.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => select(value)}
            aria-pressed={active}
            title={label}
            className={`flex size-11 items-center justify-center rounded-sm transition-colors ${
              active
                ? 'bg-panel text-primary shadow-[var(--shadow)]'
                : 'text-muted hover:text-secondary'
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
