import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Cargando } from '../app/Estados';
import { RUTINAS } from '../datos/plantillas';
import { puede } from '../dominio/acceso';
import { perfilInicial } from '../dominio/perfil';
import type { Perfil, Rutina, Seccion } from '../dominio/tipos';
import type { Almacen, EstadoSync } from '../servicios/almacen/tipos';
import type { Acceso, Servicios, Usuario } from '../servicios/tipos';
import { useSuscripcion } from './suscripcion';

interface ValorSesion {
  servicios: Servicios;
  /** undefined mientras se comprueba la sesión. */
  usuario: Usuario | null | undefined;
}

interface ValorDatos {
  almacen: Almacen;
  usuario: Usuario;
  /** Qué secciones ve la cuenta y si es admin. */
  acceso: Acceso;
  puede: (s: Seccion) => boolean;
  /** Rutina elegida; null si todavía no eligió una. */
  rutina: Rutina | null;
  /** Perfil guardado o, si todavía no hay uno, el inicial (con la rutina según el tipo de cuenta). */
  perfil: Perfil;
  perfilGuardado: boolean;
  /** Ya llegó lo guardado (aunque sea "no hay perfil"): recién ahí se puede escribir el perfil. */
  perfilCargado: boolean;
  sinAcceso: boolean;
  sync: EstadoSync;
}

const CtxSesion = createContext<ValorSesion | null>(null);
const CtxDatos = createContext<ValorDatos | null>(null);

export function ProveedorSesion({ servicios, children }: { servicios: Servicios; children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null | undefined>(undefined);
  useEffect(() => servicios.auth.observar(setUsuario), [servicios]);
  const valor = useMemo(() => ({ servicios, usuario }), [servicios, usuario]);
  return <CtxSesion.Provider value={valor}>{children}</CtxSesion.Provider>;
}

export function useSesion(): ValorSesion {
  const v = useContext(CtxSesion);
  if (!v) throw new Error('useSesion fuera de ProveedorSesion');
  return v;
}

/**
 * Rutina de cada perfil. Los perfiles guardados antes del registro abierto no tienen el campo:
 * son las cuentas que ya usaban el plan Fase 1. Sin perfil guardado, depende del tipo de cuenta:
 * las anteriores y las de admin arrancan con el plan Fase 1; las nuevas eligen una.
 */
function conRutina(guardado: Perfil | null, acceso: Acceso): Perfil {
  const porCuenta = acceso.admin || acceso.anterior ? 'fase1' : null;
  if (!guardado) return { ...perfilInicial(), rutina: porCuenta };
  return { ...guardado, rutina: guardado.rutina === undefined ? 'fase1' : guardado.rutina };
}

const claveAcceso = (uid: string) => `libreta-acceso-${uid}`;

/** Último acceso conocido de la cuenta en este dispositivo (para abrir enseguida y sin señal). */
function accesoGuardado(uid: string): Acceso | null {
  try {
    const v = JSON.parse(localStorage.getItem(claveAcceso(uid)) ?? 'null') as Acceso | null;
    return v && typeof v.admin === 'boolean' && typeof v.anterior === 'boolean' && Array.isArray(v.secciones) ? v : null;
  } catch {
    return null;
  }
}

/**
 * Si no se puede saber el acceso (primera vez en este dispositivo y sin señal), se abre con lo
 * mínimo, la rutina: es preferible que una sección aparezca después a que se cierre después.
 * Es solo lo que muestra la interfaz: los datos los protegen las reglas de Firestore y la IA, el Worker.
 */
const ACCESO_SIN_CONEXION: Acceso = { admin: false, anterior: false, secciones: [] };

export function ProveedorDatos({ usuario, children }: { usuario: Usuario; children: ReactNode }) {
  const { servicios } = useSesion();
  const almacen = useMemo(() => servicios.crearAlmacen(usuario.uid), [servicios, usuario.uid]);
  const [perfil, perfilCargado] = useSuscripcion<Perfil | null>((cb) => almacen.perfil(cb), `perfil-${usuario.uid}`, null);
  const [accesoLeido] = useSuscripcion<Acceso | null>((cb) => servicios.cuentas.acceso(usuario.uid, cb), `acceso-${usuario.uid}`, null);
  const [provisional, setProvisional] = useState<{ uid: string; acceso: Acceso | null }>(() => ({ uid: usuario.uid, acceso: accesoGuardado(usuario.uid) }));
  const acceso = accesoLeido ?? (provisional.uid === usuario.uid ? provisional.acceso : null);

  // Lo último que se supo queda guardado; si en un rato no llega nada, se abre igual.
  useEffect(() => {
    if (accesoLeido) {
      try {
        localStorage.setItem(claveAcceso(usuario.uid), JSON.stringify(accesoLeido));
      } catch {
        /* sin almacenamiento */
      }
      return;
    }
    const t = window.setTimeout(
      () => setProvisional((p) => ({ uid: usuario.uid, acceso: p.uid === usuario.uid && p.acceso ? p.acceso : ACCESO_SIN_CONEXION })),
      2500,
    );
    return () => window.clearTimeout(t);
  }, [accesoLeido, usuario.uid]);
  const [sync, setSync] = useState<EstadoSync>({ enLinea: true, pendientes: 0 });
  const [sinAcceso, setSinAcceso] = useState(false);

  useEffect(() => almacen.estado(setSync), [almacen]);
  useEffect(() => almacen.errores((m) => m === 'sin-acceso' && setSinAcceso(true)), [almacen]);

  // La cuenta queda anotada (con su nombre y su último ingreso) para el panel de administración.
  const nombrePerfil = perfil?.nombre;
  useEffect(() => {
    if (!usuario.email || !perfilCargado) return;
    void servicios.cuentas.anotar({ uid: usuario.uid, email: usuario.email, nombre: nombrePerfil }).catch(() => undefined);
  }, [servicios, usuario.uid, usuario.email, perfilCargado, nombrePerfil]);

  const valor = useMemo<ValorDatos | null>(() => {
    if (!acceso) return null;
    const p = conRutina(perfil, acceso);
    return {
      almacen,
      usuario,
      acceso,
      puede: (s: Seccion) => puede(acceso, s),
      rutina: p.rutina ? (RUTINAS[p.rutina] ?? null) : null,
      perfil: p,
      perfilGuardado: perfilCargado && perfil !== null,
      perfilCargado,
      sinAcceso,
      sync,
    };
  }, [almacen, usuario, acceso, perfil, perfilCargado, sinAcceso, sync]);

  // Hasta saber qué ve la cuenta no se muestra nada (evita mostrar secciones que después se cierran).
  if (!valor) return <Cargando />;
  return <CtxDatos.Provider value={valor}>{children}</CtxDatos.Provider>;
}

export function useDatos(): ValorDatos {
  const v = useContext(CtxDatos);
  if (!v) throw new Error('useDatos fuera de ProveedorDatos');
  return v;
}
