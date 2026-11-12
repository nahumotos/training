import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { perfilInicial } from '../dominio/perfil';
import type { Perfil } from '../dominio/tipos';
import type { Almacen, EstadoSync } from '../servicios/almacen/tipos';
import type { Servicios, Usuario } from '../servicios/tipos';
import { useSuscripcion } from './suscripcion';

interface ValorSesion {
  servicios: Servicios;
  /** undefined mientras se comprueba la sesión. */
  usuario: Usuario | null | undefined;
}

interface ValorDatos {
  almacen: Almacen;
  usuario: Usuario;
  /** Perfil guardado o, si todavía no hay uno, el del plan. */
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

export function ProveedorDatos({ usuario, children }: { usuario: Usuario; children: ReactNode }) {
  const { servicios } = useSesion();
  const almacen = useMemo(() => servicios.crearAlmacen(usuario.uid), [servicios, usuario.uid]);
  const [perfil, perfilCargado] = useSuscripcion<Perfil | null>((cb) => almacen.perfil(cb), `perfil-${usuario.uid}`, null);
  const [sync, setSync] = useState<EstadoSync>({ enLinea: true, pendientes: 0 });
  const [sinAcceso, setSinAcceso] = useState(false);

  useEffect(() => almacen.estado(setSync), [almacen]);
  useEffect(() => almacen.errores((m) => m === 'sin-acceso' && setSinAcceso(true)), [almacen]);

  const valor = useMemo<ValorDatos>(
    () => ({
      almacen,
      usuario,
      perfil: perfil ?? perfilInicial(),
      perfilGuardado: perfilCargado && perfil !== null,
      perfilCargado,
      sinAcceso,
      sync,
    }),
    [almacen, usuario, perfil, perfilCargado, sinAcceso, sync],
  );
  return <CtxDatos.Provider value={valor}>{children}</CtxDatos.Provider>;
}

export function useDatos(): ValorDatos {
  const v = useContext(CtxDatos);
  if (!v) throw new Error('useDatos fuera de ProveedorDatos');
  return v;
}
