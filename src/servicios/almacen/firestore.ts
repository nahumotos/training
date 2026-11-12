// Almacén en Cloud Firestore. Cada usuario tiene sus datos en users/{uid}/…
// La caché persistente de Firestore guarda todo en el teléfono: funciona sin señal
// y sincroniza sola cuando vuelve la conexión.

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
  type DocumentData,
  type Firestore,
  type FirestoreError,
} from 'firebase/firestore';
import { sanearAlimentoPropio, sanearDia, sanearNota, sanearPerfil, sanearSemana, sanearSesion } from '../../dominio/saneo';
import type { AlimentoPropio, Dia, Exportacion, NotaEjercicio, NotaSemana, Perfil, Sesion } from '../../dominio/tipos';
import { Emisor, importarEnAlmacen } from './comun';
import type { Almacen, Desuscribir, EstadoSync, MotivoError } from './tipos';

export class AlmacenFirestore implements Almacen {
  private pendientes = 0;
  private estadoSync: Emisor<EstadoSync>;
  private erroresEmisor = new Emisor<MotivoError | null>(null);

  constructor(
    private db: Firestore,
    private uid: string,
  ) {
    this.estadoSync = new Emisor<EstadoSync>({ enLinea: navigator.onLine, pendientes: 0 });
    const actualizar = () => this.estadoSync.emitir({ enLinea: navigator.onLine, pendientes: this.pendientes });
    window.addEventListener('online', actualizar);
    window.addEventListener('offline', actualizar);
  }

  // ---------- Rutas ----------

  private usuario() {
    return doc(this.db, 'users', this.uid);
  }
  private col(nombre: 'dias' | 'alimentos' | 'notas' | 'sesiones' | 'semanas') {
    return collection(this.db, 'users', this.uid, nombre);
  }

  // ---------- Infraestructura ----------

  private alError = (e: FirestoreError) => {
    if (e.code === 'permission-denied') this.erroresEmisor.emitir('sin-acceso');
    else {
      console.error('Error de Firestore', e);
      this.erroresEmisor.emitir('otro');
    }
  };

  private async escribir(op: Promise<void>): Promise<void> {
    this.pendientes++;
    this.estadoSync.emitir({ enLinea: navigator.onLine, pendientes: this.pendientes });
    try {
      await op;
    } catch (e) {
      this.alError(e as FirestoreError);
      throw e;
    } finally {
      this.pendientes--;
      this.estadoSync.emitir({ enLinea: navigator.onLine, pendientes: this.pendientes });
    }
  }

  private conActualizado<T extends object>(v: T): DocumentData {
    return { ...v, actualizado: new Date().toISOString() };
  }

  // ---------- Perfil ----------

  perfil(cb: (p: Perfil | null) => void): Desuscribir {
    return onSnapshot(this.usuario(), (s) => cb(s.exists() ? sanearPerfil(s.data()) : null), this.alError);
  }
  guardarPerfil(p: Perfil) {
    return this.escribir(setDoc(this.usuario(), this.conActualizado(p)));
  }

  // ---------- Días ----------

  dia(fecha: string, cb: (d: Dia | null) => void): Desuscribir {
    return onSnapshot(doc(this.col('dias'), fecha), (s) => cb(s.exists() ? sanearDia(fecha, s.data()) : null), this.alError);
  }
  dias(desde: string, hasta: string, cb: (d: Dia[]) => void): Desuscribir {
    const q = query(this.col('dias'), where('fecha', '>=', desde), where('fecha', '<=', hasta), orderBy('fecha'));
    return onSnapshot(q, (s) => cb(s.docs.map((d) => sanearDia(d.id, d.data()))), this.alError);
  }
  guardarDia(d: Dia) {
    return this.escribir(setDoc(doc(this.col('dias'), d.fecha), this.conActualizado(d)));
  }

  // ---------- Mis alimentos ----------

  alimentos(cb: (a: AlimentoPropio[]) => void): Desuscribir {
    return onSnapshot(
      this.col('alimentos'),
      (s) =>
        cb(
          s.docs
            .map((d) => sanearAlimentoPropio(d.id, d.data()))
            .filter((a): a is AlimentoPropio => a !== null)
            .sort((a, b) => a.n.localeCompare(b.n, 'es')),
        ),
      this.alError,
    );
  }
  guardarAlimento(a: AlimentoPropio) {
    return this.escribir(setDoc(doc(this.col('alimentos'), a.id), this.conActualizado(a)));
  }
  borrarAlimento(id: string) {
    return this.escribir(deleteDoc(doc(this.col('alimentos'), id)));
  }

  // ---------- Notas de ejercicios ----------

  notas(cb: (n: Record<string, NotaEjercicio>) => void): Desuscribir {
    return onSnapshot(
      this.col('notas'),
      (s) => {
        const r: Record<string, NotaEjercicio> = {};
        for (const d of s.docs) {
          const n = sanearNota(d.data());
          if (n) r[d.id] = n;
        }
        cb(r);
      },
      this.alError,
    );
  }
  guardarNota(exId: string, n: NotaEjercicio) {
    return this.escribir(setDoc(doc(this.col('notas'), exId), n));
  }

  // ---------- Sesiones ----------

  sesiones(desde: string, cb: (s: Sesion[]) => void): Desuscribir {
    const q = query(this.col('sesiones'), where('fecha', '>=', desde), orderBy('fecha'));
    return onSnapshot(
      q,
      (s) => cb(s.docs.map((d) => sanearSesion(d.id, d.data())).filter((x): x is Sesion => x !== null)),
      this.alError,
    );
  }
  guardarSesion(s: Sesion) {
    return this.escribir(setDoc(doc(this.col('sesiones'), s.id), this.conActualizado(s)));
  }
  borrarSesion(id: string) {
    return this.escribir(deleteDoc(doc(this.col('sesiones'), id)));
  }

  // ---------- Notas de la semana ----------

  semana(lunes: string, cb: (n: NotaSemana | null) => void): Desuscribir {
    return onSnapshot(doc(this.col('semanas'), lunes), (s) => cb(s.exists() ? sanearSemana(lunes, s.data()) : null), this.alError);
  }
  guardarSemana(n: NotaSemana) {
    return this.escribir(setDoc(doc(this.col('semanas'), n.lunes), this.conActualizado(n)));
  }

  // ---------- Exportar e importar ----------

  async exportar(): Promise<Exportacion> {
    const [perfil, dias, alimentos, notas, sesiones, semanas] = await Promise.all([
      getDoc(this.usuario()),
      getDocs(this.col('dias')),
      getDocs(this.col('alimentos')),
      getDocs(this.col('notas')),
      getDocs(this.col('sesiones')),
      getDocs(this.col('semanas')),
    ]);
    const notasR: Record<string, NotaEjercicio> = {};
    for (const d of notas.docs) {
      const n = sanearNota(d.data());
      if (n) notasR[d.id] = n;
    }
    return {
      formato: 'libreta',
      version: 1,
      exportado: new Date().toISOString(),
      perfil: perfil.exists() ? sanearPerfil(perfil.data()) : null,
      dias: dias.docs.map((d) => sanearDia(d.id, d.data())).sort((a, b) => a.fecha.localeCompare(b.fecha)),
      alimentos: alimentos.docs.map((d) => sanearAlimentoPropio(d.id, d.data())).filter((a): a is AlimentoPropio => a !== null),
      notas: notasR,
      sesiones: sesiones.docs.map((d) => sanearSesion(d.id, d.data())).filter((s): s is Sesion => s !== null),
      semanas: semanas.docs.map((d) => sanearSemana(d.id, d.data())).filter((s): s is NotaSemana => s !== null),
    };
  }

  importar(e: Exportacion) {
    return importarEnAlmacen(this, e);
  }

  estado(cb: (e: EstadoSync) => void): Desuscribir {
    return this.estadoSync.suscribir(cb);
  }

  errores(cb: (m: MotivoError) => void): Desuscribir {
    return this.erroresEmisor.suscribir((m) => m && cb(m), false);
  }
}
