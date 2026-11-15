import type { MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { Link, useNavigate, type LinkProps } from 'react-router-dom';

/**
 * Enlace que, al tocarlo, desliza la pantalla como en el iPhone: entrar a un día de la rutina
 * viene desde la derecha y volver se va hacia la derecha. Lleva al mismo lugar que un enlace
 * común; si el navegador no sabe deslizar o se pidió «reducir movimiento», navega igual que
 * siempre. Los estilos del deslizamiento están en base.css.
 */
let limpiar = 0;

export function EnlaceDeslizante({ paso, to, onClick, ...resto }: Omit<LinkProps, 'to'> & { to: string; paso: 'adelante' | 'atras' }) {
  const navegar = useNavigate();

  const tocar = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    // Abrir en otra pestaña (o con teclas modificadoras) sigue siendo un enlace común.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    e.preventDefault();
    const raiz = document.documentElement;
    raiz.dataset.paso = paso;
    window.clearTimeout(limpiar);
    const transicion = document.startViewTransition(() => flushSync(() => navegar(to)));
    void transicion.finished.finally(() => {
      limpiar = window.setTimeout(() => delete raiz.dataset.paso, 50);
    });
  };

  return <Link to={to} onClick={tocar} {...resto} />;
}
