// Almacén del modo demo: guarda todo en el navegador (localStorage).
// Sirve para desarrollar sin Firebase y para las pruebas automáticas.

import { sanearAlimentoPropio, sanearDia, sanearNota, sanearPerfil, sanearSemana, sanearSesion } from '../../dominio/saneo';
import type { AlimentoPropio, Dia, Exportacion, NotaEjercicio, NotaSemana, Perfil, Sesion } from '../../dominio/tipos';
import { Emisor, importarEnAlmacen } from './comun';
import type { Almacen, Desuscribir, EstadoSync, MotivoError } from './tipos';

interface Datos {
  perfil: Perfil | null;
  dias: Record<string, Dia>;
  alimentos: Record<string, AlimentoPropio>;
  notas: Record<string, NotaEjercicio>;
  sesiones: Record<string, Sesion>;
  semanas: Record<string, NotaSemana>;
}

const vacio = (): Datos => ({ perfil: null, dias: {}, alimentos: {}, notas: {}, sesiones: {}, semanas: {} });

export class AlmacenDemo implements Almacen {
  private datos: Datos;
  private cambios = new Emisor<number>(0);
  private estadoSync: Emisor<EstadoSync>;
  private erroresEmisor = new Emisor<MotivoError | null>(null);

  constructor(private clave: string) {
    this.datos = this.leer();
    this.estadoSync = new Emisor<EstadoSync>({ enLinea: typeof navigator === 'undefined' ? true : navigator.onLine, pendientes: 0 });
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === this.clave) {
          this.datos = this.leer();
          this.avisar();
        }
      });
      const actualizar = () => this.estadoSync.emitir({ enLinea: navigator.onLine, pendientes: 0 });
      window.addEventListener('online', actualizar);
      window.addEventListener('offline', actualizar);
    }
  }

  private leer(): Datos {
    try {
      const crudo = localStorage.getItem(this.clave);
      if (!crudo) return vacio();
      const v = JSON.parse(crudo) as Partial<Datos>;
      const d = vacio();
      d.perfil = v.perfil ? sanearPerfil(v.perfil) : null;
      for (const [k, x] of Object.entries(v.dias ?? {})) d.dias[k] = sanearDia(k, x);
      for (const [k, x] of Object.entries(v.alimentos ?? {})) {
        const a = sanearAlimentoPropio(k, x);
        if (a) d.alimentos[k] = a;
      }
      for (const [k, x] of Object.entries(v.notas ?? {})) {
        const n = sanearNota(x);
        if (n) d.notas[k] = n;
      }
      for (const [k, x] of Object.entries(v.sesiones ?? {})) {
        const s = sanearSesion(k, x);
        if (s) d.sesiones[k] = s;
      }
      for (const [k, x] of Object.entries(v.semanas ?? {})) {
        const s = sanearSemana(k, x);
        if (s) d.semanas[k] = s;
      }
      return d;
    } catch {
      return vacio();
    }
  }

  private async escribir(mutar: (d: Datos) => void): Promise<void> {
    mutar(this.datos);
    try {
      localStorage.setItem(this.clave, JSON.stringify(this.datos));
    } catch (e) {
      console.error('No se pudo guardar en el navegador', e);
    }
    this.avisar();
  }

  private avisar(): void {
    // Como Firestore, avisa de los cambios fuera de la llamada que los produjo.
    queueMicrotask(() => this.cambios.emitir(this.cambios.actual + 1));
  }

  private observar<T>(leer: () => T, cb: (v: T) => void): Desuscribir {
    let anterior = '';
    let activo = true;
    const emitir = () => {
      if (!activo) return;
      const v = leer();
      const firma = JSON.stringify(v);
      if (firma === anterior) return;
      anterior = firma;
      cb(structuredClone(v));
    };
    const quitar = this.cambios.suscribir(() => emitir(), false);
    queueMicrotask(emitir);
    return () => {
      activo = false;
      quitar();
    };
  }

  perfil(cb: (p: Perfil | null) => void) {
    return this.observar(() => this.datos.perfil, cb);
  }
  guardarPerfil(p: Perfil) {
    return this.escribir((d) => {
      d.perfil = structuredClone(p);
    });
  }

  dia(fecha: string, cb: (d: Dia | null) => void) {
    return this.observar(() => this.datos.dias[fecha] ?? null, cb);
  }
  dias(desde: string, hasta: string, cb: (d: Dia[]) => void) {
    return this.observar(
      () =>
        Object.values(this.datos.dias)
          .filter((d) => d.fecha >= desde && d.fecha <= hasta)
          .sort((a, b) => a.fecha.localeCompare(b.fecha)),
      cb,
    );
  }
  guardarDia(dia: Dia) {
    return this.escribir((d) => {
      d.dias[dia.fecha] = structuredClone(dia);
    });
  }

  alimentos(cb: (a: AlimentoPropio[]) => void) {
    return this.observar(() => Object.values(this.datos.alimentos).sort((a, b) => a.n.localeCompare(b.n, 'es')), cb);
  }
  guardarAlimento(a: AlimentoPropio) {
    return this.escribir((d) => {
      d.alimentos[a.id] = structuredClone(a);
    });
  }
  borrarAlimento(id: string) {
    return this.escribir((d) => {
      delete d.alimentos[id];
    });
  }

  notas(cb: (n: Record<string, NotaEjercicio>) => void) {
    return this.observar(() => this.datos.notas, cb);
  }
  guardarNota(exId: string, n: NotaEjercicio) {
    return this.escribir((d) => {
      d.notas[exId] = structuredClone(n);
    });
  }

  sesiones(desde: string, cb: (s: Sesion[]) => void) {
    return this.observar(
      () =>
        Object.values(this.datos.sesiones)
          .filter((s) => s.fecha >= desde)
          .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.inicio.localeCompare(b.inicio)),
      cb,
    );
  }
  guardarSesion(s: Sesion) {
    return this.escribir((d) => {
      d.sesiones[s.id] = structuredClone(s);
    });
  }
  borrarSesion(id: string) {
    return this.escribir((d) => {
      delete d.sesiones[id];
    });
  }

  semana(lunes: string, cb: (n: NotaSemana | null) => void) {
    return this.observar(() => this.datos.semanas[lunes] ?? null, cb);
  }
  guardarSemana(n: NotaSemana) {
    return this.escribir((d) => {
      d.semanas[n.lunes] = structuredClone(n);
    });
  }

  async exportar(): Promise<Exportacion> {
    const d = structuredClone(this.datos);
    return {
      formato: 'libreta',
      version: 1,
      exportado: new Date().toISOString(),
      perfil: d.perfil,
      dias: Object.values(d.dias).sort((a, b) => a.fecha.localeCompare(b.fecha)),
      alimentos: Object.values(d.alimentos),
      notas: d.notas,
      sesiones: Object.values(d.sesiones).sort((a, b) => a.fecha.localeCompare(b.fecha)),
      semanas: Object.values(d.semanas),
    };
  }

  importar(e: Exportacion) {
    return importarEnAlmacen(this, e);
  }

  estado(cb: (e: EstadoSync) => void) {
    return this.estadoSync.suscribir(cb);
  }

  errores(cb: (m: MotivoError) => void) {
    return this.erroresEmisor.suscribir((m) => m && cb(m), false);
  }
}
