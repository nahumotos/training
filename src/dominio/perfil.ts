import type { Objetivos, Perfil } from './tipos';

/** Objetivos del plan Fase 1 (recomposición en mantenimiento). */
export const OBJETIVOS_INICIALES: Objetivos = {
  proteina: { obj: 130, min: 120, max: 140 },
  kcal: { min: 2300, max: 2500 },
  hidratos: { min: 270, max: 320 },
  grasas: { min: 60, max: 75 },
  agua: 1750,
  umbralComida: 10,
};

export const INICIO_RUTINA_INICIAL = '2026-11-09';

export function perfilInicial(): Perfil {
  return {
    nombre: '',
    inicioRutina: INICIO_RUTINA_INICIAL,
    objetivos: structuredClone(OBJETIVOS_INICIALES),
  };
}

export interface ErrorValidacion {
  campo: string;
  mensaje: string;
}

/** Revisa que los objetivos sean coherentes. Devuelve la lista de problemas (vacía si están bien). */
export function validarObjetivos(o: Objetivos): ErrorValidacion[] {
  const e: ErrorValidacion[] = [];
  const entero = (v: number) => Number.isFinite(v) && Number.isInteger(v);
  const fuera = (v: number, min: number, max: number) => !entero(v) || v < min || v > max;

  if (fuera(o.proteina.obj, 40, 400)) e.push({ campo: 'proteina.obj', mensaje: 'La proteína objetivo tiene que estar entre 40 y 400 g.' });
  if (fuera(o.proteina.min, 20, 400) || fuera(o.proteina.max, 20, 450)) {
    e.push({ campo: 'proteina.rango', mensaje: 'El rango de proteína tiene que estar entre 20 y 450 g.' });
  } else if (!(o.proteina.min <= o.proteina.obj && o.proteina.obj <= o.proteina.max)) {
    e.push({ campo: 'proteina.rango', mensaje: 'La proteína objetivo tiene que quedar dentro de su rango.' });
  }
  if (fuera(o.kcal.min, 800, 8000) || fuera(o.kcal.max, 800, 8000) || o.kcal.min >= o.kcal.max) {
    e.push({ campo: 'kcal', mensaje: 'Las calorías van de 800 a 8.000, con el mínimo menor que el máximo.' });
  }
  if (fuera(o.hidratos.min, 0, 1500) || fuera(o.hidratos.max, 0, 1500) || o.hidratos.min > o.hidratos.max) {
    e.push({ campo: 'hidratos', mensaje: 'Los hidratos van de 0 a 1.500 g, con el mínimo menor o igual al máximo.' });
  }
  if (fuera(o.grasas.min, 0, 500) || fuera(o.grasas.max, 0, 500) || o.grasas.min > o.grasas.max) {
    e.push({ campo: 'grasas', mensaje: 'Las grasas van de 0 a 500 g, con el mínimo menor o igual al máximo.' });
  }
  if (fuera(o.agua, 250, 6000)) e.push({ campo: 'agua', mensaje: 'El agua tiene que estar entre 250 y 6.000 ml.' });
  if (fuera(o.umbralComida, 1, 60)) e.push({ campo: 'umbralComida', mensaje: 'El mínimo de proteína por comida tiene que estar entre 1 y 60 g.' });
  return e;
}
