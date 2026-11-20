import { createContext, useContext, useEffect, useState } from 'react';

type Tema = 'claro' | 'oscuro' | 'azul' | 'neutro' | 'engie' | 'bistro' | 'desert' | 'forest' | 'cosmos' | 'cadet' | 'rosa';

const TEMAS: Tema[] = ['claro', 'oscuro', 'azul', 'neutro', 'engie', 'bistro', 'desert', 'forest', 'cosmos', 'cadet', 'rosa'];

function getLs(key: string, def: string): string {
  try { return localStorage.getItem(key) ?? def; } catch { return def; }
}

function applyTheme() {
  const raw    = getLs('finlock:tema',   'claro');
  const fuente = getLs('finlock:fuente', 'sans');
  const tamano = getLs('finlock:tamano', 'md');
  const tema   = TEMAS.includes(raw as Tema) ? (raw as Tema) : 'claro';

  document.documentElement.setAttribute('data-theme', tema);
  document.documentElement.setAttribute('data-size',  tamano);

  document.body.classList.remove('font-serif-hc', 'font-mono-hc');
  if (fuente === 'serif') document.body.classList.add('font-serif-hc');
  else if (fuente === 'mono') document.body.classList.add('font-mono-hc');
}

const ThemeCtx = createContext<{ tema: Tema }>({ tema: 'claro' });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>(() => {
    const raw = getLs('finlock:tema', 'claro');
    return TEMAS.includes(raw as Tema) ? (raw as Tema) : 'claro';
  });

  useEffect(() => {
    applyTheme();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'finlock:tema' || e.key === 'finlock:fuente' || e.key === 'finlock:tamano') {
        applyTheme();
        if (e.key === 'finlock:tema') {
          const raw = getLs('finlock:tema', 'claro');
          setTema(TEMAS.includes(raw as Tema) ? (raw as Tema) : 'claro');
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return <ThemeCtx.Provider value={{ tema }}>{children}</ThemeCtx.Provider>;
}

export function useTema() { return useContext(ThemeCtx); }
