// Rutinas armadas para elegir al registrarse: por días por semana y por objetivo.
// Los ids de los días van en los ids de los entrenamientos guardados: no cambiarlos.

import type { Calentamiento, DiaRutina, Ejercicio, Rutina, TipoDia } from '../dominio/tipos';
import { EJERCICIOS } from './ejercicios';
import { RUTINA_FASE1 } from './rutinaFase1';

const NOMBRES_DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/** Descanso como texto: 150 → «2–3 min». */
export function textoDescanso(seg: number): string {
  if (seg <= 0) return 'Sin pausa';
  if (seg < 60) return `${seg} s`;
  if (seg === 150) return '2–3 min';
  const min = seg / 60;
  return `${Number.isInteger(min) ? min : String(min).replace('.', ',')} min`;
}

/** Un ejercicio de la biblioteca con sus series, repeticiones, descanso (s) y RIR. */
function ej(id: string, s: number, r: [number, number], desc: number, rir: string, g?: string): Ejercicio {
  const base = EJERCICIOS[id];
  if (!base) throw new Error(`Falta el ejercicio ${id}`);
  return { id, ...base, s, r, desc, descTxt: textoDescanso(desc), rir, sug: '', sugKg: null, ...(g ? { g } : {}) };
}

const APROXIMACION: Calentamiento = {
  n: 'Series de aproximación',
  dosis: '2 series',
  nota: 'Dos series livianas del primer ejercicio antes de las de la tabla. No cansan y no se anotan.',
};
const BICI: Calentamiento = { n: 'Bici o cinta suave', dosis: '5 min', img: 'bici' };
const HOMBROS: Calentamiento = { n: 'Rotaciones de hombros', dosis: '15', img: 'hombros', nota: 'Círculos lentos hacia atrás.' };
const SENTADILLA_LIBRE: Calentamiento = { n: 'Sentadilla sin peso', dosis: '1 × 12', img: 'sentadilla-libre', nota: 'Lenta y bien profunda.' };
const PSOAS: Calentamiento = { n: 'Movilidad psoas-cadera', dosis: '1 × 10 por lado', img: 'psoas' };

const CALOR: Record<'sup' | 'inf' | 'full', Calentamiento[]> = {
  sup: [BICI, HOMBROS, APROXIMACION],
  inf: [BICI, SENTADILLA_LIBRE, PSOAS, APROXIMACION],
  full: [BICI, HOMBROS, SENTADILLA_LIBRE, APROXIMACION],
};

const CINTA: Calentamiento = { n: 'Cinta con inclinación', dosis: '15–20 min', img: 'cinta', nota: 'A un ritmo en el que puedas hablar con frases cortas.' };
const REMO: Calentamiento = { n: 'Remo (ergómetro)', dosis: '10–15 min', img: 'remo-ergometro', nota: 'Ritmo parejo, empujando con las piernas.' };
const ELIPTICO: Calentamiento = { n: 'Elíptico', dosis: '15–20 min', img: 'eliptica', nota: 'Intensidad moderada.' };

interface DatosDia {
  id: string;
  dow: number;
  tipo: TipoDia;
  letra: string;
  nombre: string;
  foco: string;
  duracion: string;
  calor: keyof typeof CALOR;
  ex: Ejercicio[];
  final?: Calentamiento[];
}

function dias(lista: DatosDia[]): DiaRutina[] {
  return lista.map((d, i) => ({
    id: d.id,
    num: i + 1,
    dow: d.dow,
    dia: NOMBRES_DIAS[d.dow]!,
    tipo: d.tipo,
    letra: d.letra,
    nombre: d.nombre,
    foco: d.foco,
    duracion: d.duracion,
    calor: CALOR[d.calor],
    ex: d.ex,
    ...(d.final ? { final: d.final } : {}),
  }));
}

/** La rutina del plan Fase 1 de Nahu: se asigna a las cuentas anteriores al registro abierto. */
export const RUTINA_PERSONAL: Rutina = {
  id: 'fase1',
  nombre: 'Torso / Pierna · 4 días',
  frecuencia: 4,
  objetivos: ['musculo'],
  nivel: 'intermedio',
  descripcion: 'Plan Fase 1: recomposición en mantenimiento.',
  comodin: [6],
  descanso: 'Caminata de 30–40 min.',
  despues: 'Después, 20–30 min de caminata.',
  horarioComodin: 'de 8 a 13 h',
  dias: RUTINA_FASE1,
  oculta: true,
};

export const PLANTILLAS: Rutina[] = [
  {
    id: 'full-body-2',
    nombre: 'Full body · 2 días',
    frecuencia: 2,
    objetivos: ['forma', 'musculo', 'fuerza'],
    nivel: 'principiante',
    descripcion: 'Todo el cuerpo en cada sesión. Ideal para arrancar o si tenés poco tiempo: con dos días bien hechos ya se progresa.',
    comodin: [6],
    descanso: 'Caminá 30 min los días sin pesas.',
    dias: dias([
      {
        id: 'fb2-a', dow: 1, tipo: 'full', letra: 'A', nombre: 'Full body A', foco: 'Piernas, pecho y espalda', duracion: '50–60 min', calor: 'full',
        ex: [ej('sentadilla-goblet', 3, [10, 12], 120, '2'), ej('press-plano-mancuernas', 3, [8, 10], 120, '2'), ej('jalon-ancho', 3, [10, 12], 120, '2'), ej('peso-muerto-rumano', 3, [10, 12], 120, '2'), ej('elev-lateral', 2, [12, 15], 60, '1–2'), ej('plancha', 2, [30, 45], 60, '—')],
      },
      {
        id: 'fb2-b', dow: 4, tipo: 'full', letra: 'B', nombre: 'Full body B', foco: 'Piernas, hombro y espalda', duracion: '50–60 min', calor: 'full',
        ex: [ej('prensa', 3, [10, 12], 120, '2'), ej('press-hombro-mancuernas', 3, [8, 10], 120, '2'), ej('remo-polea', 3, [10, 12], 120, '2'), ej('hip-thrust', 3, [10, 12], 120, '2'), ej('triceps-polea', 2, [10, 15], 0, '1', '5'), ej('curl-martillo', 2, [10, 12], 60, '1', '5'), ej('crunch', 2, [12, 15], 60, '1')],
      },
    ]),
  },
  {
    id: 'full-body-3',
    nombre: 'Full body · 3 días',
    frecuencia: 3,
    objetivos: ['musculo', 'forma'],
    nivel: 'principiante',
    descripcion: 'Tres sesiones de cuerpo completo, cada una con ejercicios distintos. Cada músculo se entrena tres veces por semana con poco volumen por sesión.',
    comodin: [6],
    descanso: 'Caminá 30 min los días sin pesas.',
    dias: dias([
      {
        id: 'fb3-a', dow: 1, tipo: 'full', letra: 'A', nombre: 'Full body A', foco: 'Sentadilla, pecho y espalda', duracion: '55–65 min', calor: 'full',
        ex: [ej('sentadilla-barra', 3, [8, 10], 150, '2'), ej('press-banca', 3, [8, 10], 150, '2'), ej('remo-polea', 3, [10, 12], 120, '2'), ej('elev-lateral', 3, [12, 15], 60, '1–2'), ej('curl-barra', 2, [10, 12], 60, '1'), ej('crunch-polea', 2, [12, 15], 60, '1')],
      },
      {
        id: 'fb3-b', dow: 3, tipo: 'full', letra: 'B', nombre: 'Full body B', foco: 'Bisagra, hombro y dorsal', duracion: '55–65 min', calor: 'full',
        ex: [ej('peso-muerto-rumano', 3, [8, 10], 150, '2'), ej('press-hombro-mancuernas', 3, [8, 10], 120, '2'), ej('jalon-ancho', 3, [10, 12], 120, '2'), ej('estocadas', 2, [10, 12], 90, '2'), ej('triceps-polea', 2, [10, 15], 60, '1'), ej('elev-rodillas', 2, [12, 15], 60, '1')],
      },
      {
        id: 'fb3-c', dow: 5, tipo: 'full', letra: 'C', nombre: 'Full body C', foco: 'Prensa, glúteo y espalda', duracion: '55–65 min', calor: 'full',
        ex: [ej('prensa', 3, [10, 12], 120, '2'), ej('press-inclinado', 3, [10, 12], 120, '2'), ej('remo-mancuerna', 3, [10, 12], 90, '2'), ej('hip-thrust', 3, [10, 12], 120, '2'), ej('face-pull', 2, [12, 15], 60, '1–2'), ej('curl-martillo', 2, [10, 12], 60, '1')],
      },
    ]),
  },
  {
    id: 'fuerza-3',
    nombre: 'Fuerza · 3 días',
    frecuencia: 3,
    objetivos: ['fuerza'],
    nivel: 'principiante',
    descripcion: 'Pocos ejercicios, pesados y con descansos largos: sentadilla, banca, peso muerto, press militar y remo. Se busca sumar peso a la barra casi todas las semanas.',
    comodin: [6],
    descanso: 'Descanso activo: caminá 20–30 min.',
    dias: dias([
      {
        id: 'f3-a', dow: 1, tipo: 'full', letra: 'A', nombre: 'Fuerza A', foco: 'Sentadilla, banca y remo', duracion: '60–70 min', calor: 'full',
        ex: [ej('sentadilla-barra', 5, [5, 5], 180, '2'), ej('press-banca', 5, [5, 5], 180, '2'), ej('remo-barra', 5, [5, 5], 180, '2'), ej('plancha', 3, [30, 45], 60, '—')],
      },
      {
        id: 'f3-b', dow: 3, tipo: 'full', letra: 'B', nombre: 'Fuerza B', foco: 'Peso muerto, press militar y dominadas', duracion: '60–70 min', calor: 'full',
        ex: [ej('peso-muerto', 3, [5, 5], 180, '2'), ej('press-militar', 5, [5, 5], 180, '2'), ej('dominadas', 3, [5, 8], 150, '2'), ej('hiperextensiones', 2, [10, 12], 60, '2')],
      },
      {
        id: 'f3-c', dow: 5, tipo: 'full', letra: 'C', nombre: 'Fuerza C', foco: 'Sentadilla, banca y volumen', duracion: '60–70 min', calor: 'full',
        ex: [ej('sentadilla-barra', 3, [5, 5], 180, '2'), ej('press-banca', 3, [6, 8], 150, '2'), ej('remo-barra', 3, [6, 8], 150, '2'), ej('press-frances', 2, [8, 10], 90, '2'), ej('curl-barra', 2, [8, 10], 90, '2')],
      },
    ]),
  },
  {
    id: 'fuerza-4',
    nombre: 'Fuerza · Torso / Pierna 4 días',
    frecuencia: 4,
    objetivos: ['fuerza', 'musculo'],
    nivel: 'intermedio',
    descripcion: 'Dos días pesados (pocas repeticiones) y dos de volumen. Para seguir subiendo los básicos cuando ya no se progresa todas las semanas.',
    comodin: [6],
    descanso: 'Caminá 20–30 min los días sin pesas.',
    dias: dias([
      {
        id: 'f4-ta', dow: 1, tipo: 'torso', letra: 'A', nombre: 'Torso pesado', foco: 'Banca, remo y press militar', duracion: '60–70 min', calor: 'sup',
        ex: [ej('press-banca', 4, [4, 6], 180, '2'), ej('remo-barra', 4, [5, 6], 180, '2'), ej('press-militar', 3, [5, 6], 150, '2'), ej('dominadas', 3, [6, 8], 150, '2'), ej('triceps-polea', 2, [10, 12], 60, '1')],
      },
      {
        id: 'f4-pa', dow: 2, tipo: 'pierna', letra: 'A', nombre: 'Pierna pesada', foco: 'Sentadilla y bisagra', duracion: '60–70 min', calor: 'inf',
        ex: [ej('sentadilla-barra', 4, [4, 6], 180, '2'), ej('peso-muerto-rumano', 3, [6, 8], 150, '2'), ej('prensa', 3, [8, 10], 120, '2'), ej('gemelos-parado', 3, [10, 12], 60, '1'), ej('plancha', 3, [30, 45], 60, '—')],
      },
      {
        id: 'f4-tb', dow: 4, tipo: 'torso', letra: 'B', nombre: 'Torso volumen', foco: 'Pecho, espalda y brazos', duracion: '55–65 min', calor: 'sup',
        ex: [ej('press-inclinado', 3, [8, 10], 120, '2'), ej('jalon-ancho', 3, [8, 10], 120, '2'), ej('press-hombro-mancuernas', 3, [8, 10], 120, '2'), ej('remo-mancuerna', 3, [10, 12], 90, '2'), ej('press-frances', 2, [10, 12], 0, '1', '5'), ej('curl-barra', 2, [10, 12], 90, '1', '5')],
      },
      {
        id: 'f4-pb', dow: 5, tipo: 'pierna', letra: 'B', nombre: 'Pierna volumen', foco: 'Peso muerto y unilaterales', duracion: '55–65 min', calor: 'inf',
        ex: [ej('peso-muerto', 3, [3, 5], 180, '2'), ej('sentadilla-dividida', 3, [8, 10], 120, '2'), ej('curl-femoral', 3, [10, 12], 90, '1–2'), ej('hip-thrust', 3, [8, 10], 120, '2'), ej('elev-rodillas', 2, [12, 15], 60, '1')],
      },
    ]),
  },
  {
    id: 'torso-pierna-4',
    nombre: 'Torso / Pierna · 4 días',
    frecuencia: 4,
    objetivos: ['musculo'],
    nivel: 'intermedio',
    descripcion: 'Dos días de torso y dos de pierna. Cada músculo dos veces por semana, con básicos al principio y ejercicios de aislamiento al final.',
    comodin: [6],
    descanso: 'Caminá 30–40 min los días sin pesas.',
    dias: dias([
      {
        id: 'tp4-ta', dow: 1, tipo: 'torso', letra: 'A', nombre: 'Torso A', foco: 'Pecho, espalda, hombro y brazos', duracion: '60–65 min', calor: 'sup',
        ex: [ej('press-banca', 3, [8, 10], 150, '2'), ej('remo-barra', 3, [8, 10], 150, '2'), ej('press-inclinado', 3, [10, 12], 120, '1–2'), ej('jalon-ancho', 3, [10, 12], 120, '1–2'), ej('elev-lateral', 3, [12, 15], 60, '1–2'), ej('triceps-polea', 3, [10, 15], 0, '1', '6'), ej('curl-barra', 3, [10, 12], 90, '1', '6')],
      },
      {
        id: 'tp4-pa', dow: 2, tipo: 'pierna', letra: 'A', nombre: 'Pierna A', foco: 'Cuádriceps, isquios, gemelos y abdomen', duracion: '55–60 min', calor: 'inf',
        ex: [ej('hack', 3, [8, 10], 150, '2'), ej('peso-muerto-rumano', 3, [8, 10], 150, '2'), ej('ext-cuadriceps', 3, [12, 15], 90, '1'), ej('curl-femoral', 3, [10, 12], 90, '1–2'), ej('gemelos', 3, [12, 15], 60, '1'), ej('crunch-polea', 3, [12, 15], 60, '1')],
      },
      {
        id: 'tp4-tb', dow: 4, tipo: 'torso', letra: 'B', nombre: 'Torso B', foco: 'Hombro, espalda, pecho y brazos', duracion: '60–65 min', calor: 'sup',
        ex: [ej('press-hombro', 3, [8, 10], 150, '2'), ej('jalon-neutro', 3, [8, 10], 150, '2'), ej('press-plano-mancuernas', 3, [10, 12], 120, '1–2'), ej('remo-mancuerna', 3, [10, 12], 90, '1–2'), ej('face-pull', 3, [12, 15], 60, '1–2'), ej('triceps-cabeza', 2, [10, 12], 0, '1', '6'), ej('curl-martillo', 2, [10, 12], 60, '1', '6')],
      },
      {
        id: 'tp4-pb', dow: 5, tipo: 'pierna', letra: 'B', nombre: 'Pierna B', foco: 'Glúteo, cuádriceps, isquios y abdomen', duracion: '55–60 min', calor: 'inf',
        ex: [ej('hip-thrust', 3, [8, 10], 150, '2'), ej('prensa', 3, [10, 12], 120, '2'), ej('sentadilla-dividida', 3, [10, 12], 90, '2'), ej('curl-femoral', 3, [10, 12], 90, '1–2'), ej('gemelos-parado', 3, [12, 15], 60, '1'), ej('elev-rodillas', 3, [12, 15], 60, '1')],
      },
    ]),
  },
  {
    id: 'ppl-3',
    nombre: 'Empuje / Tirón / Piernas · 3 días',
    frecuencia: 3,
    objetivos: ['musculo'],
    nivel: 'intermedio',
    descripcion: 'Un día para lo que empuja (pecho, hombro, tríceps), otro para lo que tira (espalda, bíceps) y otro para piernas. Más volumen por músculo en cada sesión.',
    comodin: [6],
    descanso: 'Caminá 30 min los días sin pesas.',
    dias: dias([
      {
        id: 'ppl3-e', dow: 1, tipo: 'empuje', letra: 'E', nombre: 'Empuje', foco: 'Pecho, hombro y tríceps', duracion: '60 min', calor: 'sup',
        ex: [ej('press-banca', 4, [6, 8], 150, '2'), ej('press-hombro-mancuernas', 3, [8, 10], 120, '2'), ej('press-inclinado', 3, [10, 12], 120, '1–2'), ej('elev-lateral', 3, [12, 15], 60, '1'), ej('triceps-polea', 3, [10, 12], 60, '1'), ej('fondos', 2, [8, 12], 90, '2')],
      },
      {
        id: 'ppl3-t', dow: 3, tipo: 'tiron', letra: 'T', nombre: 'Tirón', foco: 'Espalda, hombro posterior y bíceps', duracion: '60 min', calor: 'sup',
        ex: [ej('dominadas', 3, [6, 10], 150, '2'), ej('remo-barra', 3, [8, 10], 150, '2'), ej('remo-polea', 3, [10, 12], 120, '1–2'), ej('face-pull', 3, [12, 15], 60, '1–2'), ej('curl-barra', 3, [10, 12], 60, '1'), ej('curl-martillo', 2, [10, 12], 60, '1')],
      },
      {
        id: 'ppl3-p', dow: 5, tipo: 'pierna', letra: 'P', nombre: 'Piernas', foco: 'Cuádriceps, isquios, glúteo y gemelos', duracion: '60–65 min', calor: 'inf',
        ex: [ej('sentadilla-barra', 4, [6, 8], 180, '2'), ej('peso-muerto-rumano', 3, [8, 10], 150, '2'), ej('prensa', 3, [10, 12], 120, '1–2'), ej('curl-femoral', 3, [10, 12], 90, '1'), ej('gemelos-parado', 4, [10, 15], 60, '1'), ej('crunch-polea', 3, [12, 15], 60, '1')],
      },
    ]),
  },
  {
    id: 'ppl-tp-5',
    nombre: 'Empuje / Tirón / Piernas + Torso / Pierna · 5 días',
    frecuencia: 5,
    objetivos: ['musculo', 'fuerza'],
    nivel: 'intermedio',
    descripcion: 'Tres días de empuje, tirón y piernas, y dos más de torso y pierna. Cada músculo casi dos veces por semana con buen volumen.',
    comodin: [6],
    descanso: 'Caminá 30 min el fin de semana.',
    dias: dias([
      {
        id: 'ppl5-e', dow: 1, tipo: 'empuje', letra: 'E', nombre: 'Empuje', foco: 'Pecho, hombro y tríceps', duracion: '60 min', calor: 'sup',
        ex: [ej('press-banca', 4, [6, 8], 150, '2'), ej('press-hombro-mancuernas', 3, [8, 10], 120, '2'), ej('press-inclinado', 3, [10, 12], 120, '1–2'), ej('elev-lateral', 3, [12, 15], 60, '1'), ej('triceps-polea', 3, [10, 12], 60, '1')],
      },
      {
        id: 'ppl5-t', dow: 2, tipo: 'tiron', letra: 'T', nombre: 'Tirón', foco: 'Espalda y bíceps', duracion: '60 min', calor: 'sup',
        ex: [ej('dominadas', 3, [6, 10], 150, '2'), ej('remo-barra', 3, [8, 10], 150, '2'), ej('remo-polea', 3, [10, 12], 120, '1–2'), ej('face-pull', 3, [12, 15], 60, '1–2'), ej('curl-barra', 3, [10, 12], 60, '1')],
      },
      {
        id: 'ppl5-p', dow: 3, tipo: 'pierna', letra: 'P', nombre: 'Piernas', foco: 'Sentadilla y bisagra', duracion: '60–65 min', calor: 'inf',
        ex: [ej('sentadilla-barra', 4, [6, 8], 180, '2'), ej('peso-muerto-rumano', 3, [8, 10], 150, '2'), ej('prensa', 3, [10, 12], 120, '1–2'), ej('gemelos-parado', 4, [10, 15], 60, '1'), ej('crunch-polea', 3, [12, 15], 60, '1')],
      },
      {
        id: 'ppl5-to', dow: 4, tipo: 'torso', letra: 'T', nombre: 'Torso', foco: 'Pecho, espalda y hombro', duracion: '55–60 min', calor: 'sup',
        ex: [ej('press-plano-mancuernas', 3, [8, 10], 120, '2'), ej('jalon-neutro', 3, [8, 10], 120, '2'), ej('press-militar', 3, [8, 10], 120, '2'), ej('remo-mancuerna', 3, [10, 12], 90, '1–2'), ej('aperturas', 2, [12, 15], 60, '1'), ej('pajaros', 2, [12, 15], 60, '1')],
      },
      {
        id: 'ppl5-pi', dow: 5, tipo: 'pierna', letra: 'P', nombre: 'Pierna', foco: 'Glúteo, cuádriceps e isquios', duracion: '55–60 min', calor: 'inf',
        ex: [ej('hack', 3, [8, 10], 150, '2'), ej('hip-thrust', 3, [8, 10], 150, '2'), ej('ext-cuadriceps', 3, [12, 15], 90, '1'), ej('curl-femoral', 3, [12, 15], 90, '1'), ej('gemelos', 3, [12, 15], 60, '1'), ej('elev-rodillas', 3, [12, 15], 60, '1')],
      },
    ]),
  },
  {
    id: 'ppl-6',
    nombre: 'Empuje / Tirón / Piernas · 6 días',
    frecuencia: 6,
    objetivos: ['musculo'],
    nivel: 'avanzado',
    descripcion: 'Empuje, tirón y piernas dos veces por semana, con variantes distintas cada vez. Mucho volumen: pide buen descanso y buena alimentación.',
    comodin: [],
    descanso: 'El domingo, descanso total o una caminata tranquila.',
    dias: dias([
      {
        id: 'ppl6-ea', dow: 1, tipo: 'empuje', letra: 'E', nombre: 'Empuje A', foco: 'Pecho, hombro y tríceps', duracion: '60 min', calor: 'sup',
        ex: [ej('press-banca', 4, [6, 8], 150, '2'), ej('press-hombro-mancuernas', 3, [8, 10], 120, '2'), ej('press-inclinado', 3, [10, 12], 120, '1–2'), ej('elev-lateral', 3, [12, 15], 60, '1'), ej('triceps-polea', 3, [10, 12], 60, '1')],
      },
      {
        id: 'ppl6-ta', dow: 2, tipo: 'tiron', letra: 'T', nombre: 'Tirón A', foco: 'Espalda y bíceps', duracion: '60 min', calor: 'sup',
        ex: [ej('dominadas', 3, [6, 10], 150, '2'), ej('remo-barra', 3, [8, 10], 150, '2'), ej('remo-polea', 3, [10, 12], 120, '1–2'), ej('face-pull', 3, [12, 15], 60, '1–2'), ej('curl-barra', 3, [10, 12], 60, '1')],
      },
      {
        id: 'ppl6-pa', dow: 3, tipo: 'pierna', letra: 'P', nombre: 'Piernas A', foco: 'Sentadilla y bisagra', duracion: '60–65 min', calor: 'inf',
        ex: [ej('sentadilla-barra', 4, [6, 8], 180, '2'), ej('peso-muerto-rumano', 3, [8, 10], 150, '2'), ej('prensa', 3, [10, 12], 120, '1–2'), ej('gemelos-parado', 4, [10, 15], 60, '1'), ej('crunch-polea', 3, [12, 15], 60, '1')],
      },
      {
        id: 'ppl6-eb', dow: 4, tipo: 'empuje', letra: 'E', nombre: 'Empuje B', foco: 'Hombro, pecho y tríceps', duracion: '60 min', calor: 'sup',
        ex: [ej('press-militar', 4, [6, 8], 150, '2'), ej('press-plano-mancuernas', 3, [8, 10], 120, '2'), ej('aperturas', 3, [12, 15], 60, '1'), ej('elev-lateral', 4, [12, 15], 60, '1'), ej('triceps-cabeza', 3, [10, 12], 60, '1'), ej('fondos', 2, [8, 12], 90, '2')],
      },
      {
        id: 'ppl6-tb', dow: 5, tipo: 'tiron', letra: 'T', nombre: 'Tirón B', foco: 'Espalda media y brazos', duracion: '60 min', calor: 'sup',
        ex: [ej('remo-t', 4, [8, 10], 150, '2'), ej('jalon-ancho', 3, [10, 12], 120, '1–2'), ej('remo-mancuerna', 3, [10, 12], 90, '1–2'), ej('pajaros', 3, [12, 15], 60, '1'), ej('curl-martillo', 3, [10, 12], 60, '1')],
      },
      {
        id: 'ppl6-pb', dow: 6, tipo: 'pierna', letra: 'P', nombre: 'Piernas B', foco: 'Peso muerto y unilaterales', duracion: '60–65 min', calor: 'inf',
        ex: [ej('peso-muerto', 3, [4, 6], 180, '2'), ej('hack', 3, [8, 10], 150, '2'), ej('sentadilla-dividida', 3, [10, 12], 90, '2'), ej('ext-cuadriceps', 3, [12, 15], 60, '1'), ej('curl-femoral', 3, [12, 15], 60, '1'), ej('gemelos', 4, [10, 15], 60, '1')],
      },
    ]),
  },
  {
    id: 'gluteos-3',
    nombre: 'Glúteos y piernas · 3 días',
    frecuencia: 3,
    objetivos: ['gluteos'],
    nivel: 'principiante',
    descripcion: 'Dos días de piernas con foco en glúteo y uno de torso para mantener el equilibrio del cuerpo.',
    comodin: [6],
    descanso: 'Caminá 30 min los días sin pesas.',
    dias: dias([
      {
        id: 'g3-a', dow: 1, tipo: 'pierna', letra: 'A', nombre: 'Glúteo A', foco: 'Hip thrust, sentadilla y bisagra', duracion: '55–60 min', calor: 'inf',
        ex: [ej('hip-thrust', 4, [8, 12], 120, '2'), ej('sentadilla-goblet', 3, [10, 12], 120, '2'), ej('peso-muerto-rumano', 3, [10, 12], 120, '2'), ej('abductores', 3, [12, 15], 60, '1'), ej('patada-gluteo', 3, [12, 15], 60, '1'), ej('plancha', 2, [30, 45], 60, '—')],
      },
      {
        id: 'g3-t', dow: 3, tipo: 'torso', letra: 'T', nombre: 'Torso', foco: 'Pecho, espalda y hombro', duracion: '45–50 min', calor: 'sup',
        ex: [ej('press-plano-mancuernas', 3, [10, 12], 90, '2'), ej('jalon-ancho', 3, [10, 12], 90, '2'), ej('press-hombro-mancuernas', 3, [10, 12], 90, '2'), ej('remo-polea', 3, [10, 12], 90, '2'), ej('elev-lateral', 2, [12, 15], 60, '1'), ej('crunch', 2, [12, 15], 60, '1')],
      },
      {
        id: 'g3-b', dow: 5, tipo: 'pierna', letra: 'B', nombre: 'Glúteo B', foco: 'Unilaterales, prensa e isquios', duracion: '55–60 min', calor: 'inf',
        ex: [ej('sentadilla-dividida', 3, [10, 12], 90, '2'), ej('prensa', 3, [10, 12], 120, '2'), ej('puente-gluteo', 3, [12, 15], 60, '1'), ej('curl-femoral', 3, [10, 12], 90, '1–2'), ej('step-up', 2, [10, 12], 90, '2'), ej('abductores', 3, [15, 20], 60, '1')],
      },
    ]),
  },
  {
    id: 'gluteos-4',
    nombre: 'Glúteos · 4 días',
    frecuencia: 4,
    objetivos: ['gluteos'],
    nivel: 'intermedio',
    descripcion: 'Dos días de inferior pensados para el glúteo (uno pesado y otro con más repeticiones) y dos de torso.',
    comodin: [6],
    descanso: 'Caminá 30–40 min los días sin pesas.',
    dias: dias([
      {
        id: 'g4-ga', dow: 1, tipo: 'pierna', letra: 'A', nombre: 'Glúteo pesado', foco: 'Hip thrust, sentadilla y bisagra', duracion: '60 min', calor: 'inf',
        ex: [ej('hip-thrust', 4, [6, 10], 150, '2'), ej('sentadilla-barra', 3, [8, 10], 150, '2'), ej('peso-muerto-rumano', 3, [8, 10], 150, '2'), ej('abductores', 3, [12, 15], 60, '1'), ej('gemelos-parado', 3, [12, 15], 60, '1')],
      },
      {
        id: 'g4-ta', dow: 2, tipo: 'torso', letra: 'A', nombre: 'Torso A', foco: 'Pecho, espalda y hombro', duracion: '50 min', calor: 'sup',
        ex: [ej('press-plano-mancuernas', 3, [8, 10], 120, '2'), ej('jalon-ancho', 3, [10, 12], 90, '2'), ej('press-hombro-mancuernas', 3, [10, 12], 90, '2'), ej('remo-polea', 3, [10, 12], 90, '2'), ej('elev-lateral', 3, [12, 15], 60, '1'), ej('face-pull', 2, [12, 15], 60, '1')],
      },
      {
        id: 'g4-gb', dow: 4, tipo: 'pierna', letra: 'B', nombre: 'Glúteo bombeo', foco: 'Unilaterales y aislamiento', duracion: '55 min', calor: 'inf',
        ex: [ej('sentadilla-dividida', 3, [10, 12], 90, '2'), ej('hip-thrust', 3, [12, 15], 120, '1'), ej('patada-gluteo', 3, [12, 15], 60, '1'), ej('curl-femoral', 3, [10, 12], 90, '1–2'), ej('hiperextensiones', 3, [12, 15], 60, '1'), ej('abductores', 3, [15, 20], 60, '1')],
      },
      {
        id: 'g4-tb', dow: 5, tipo: 'torso', letra: 'B', nombre: 'Torso B', foco: 'Espalda, pecho y brazos', duracion: '50 min', calor: 'sup',
        ex: [ej('press-inclinado', 3, [10, 12], 90, '2'), ej('remo-mancuerna', 3, [10, 12], 90, '2'), ej('flexiones', 3, [8, 12], 60, '2'), ej('pajaros', 2, [12, 15], 60, '1'), ej('triceps-polea', 2, [10, 15], 0, '1', '5'), ej('curl-martillo', 2, [10, 12], 60, '1', '5')],
      },
    ]),
  },
  {
    id: 'forma-3',
    nombre: 'Fuerza y cardio · 3 días',
    frecuencia: 3,
    objetivos: ['forma'],
    nivel: 'principiante',
    descripcion: 'Pesas de cuerpo completo con descansos cortos y cardio al final. Para bajar grasa y mejorar el estado físico sin perder músculo.',
    comodin: [6],
    descanso: 'Caminá 30–40 min los días sin pesas.',
    dias: dias([
      {
        id: 'fc3-a', dow: 1, tipo: 'full', letra: 'A', nombre: 'Circuito A', foco: 'Cuerpo completo + cinta', duracion: '50–60 min', calor: 'full',
        ex: [ej('sentadilla-goblet', 3, [12, 15], 60, '2'), ej('flexiones', 3, [8, 12], 60, '2'), ej('remo-polea', 3, [12, 15], 60, '2'), ej('swing-kettlebell', 3, [15, 20], 60, '2'), ej('escaladores', 3, [20, 30], 45, '—')],
        final: [CINTA],
      },
      {
        id: 'fc3-b', dow: 3, tipo: 'full', letra: 'B', nombre: 'Circuito B', foco: 'Cuerpo completo + remo', duracion: '50–60 min', calor: 'full',
        ex: [ej('prensa', 3, [12, 15], 60, '2'), ej('press-hombro-mancuernas', 3, [10, 12], 60, '2'), ej('jalon-ancho', 3, [12, 15], 60, '2'), ej('puente-gluteo', 3, [15, 20], 45, '1'), ej('plancha', 3, [30, 45], 45, '—')],
        final: [REMO],
      },
      {
        id: 'fc3-c', dow: 5, tipo: 'full', letra: 'C', nombre: 'Circuito C', foco: 'Cuerpo completo + elíptico', duracion: '50–60 min', calor: 'full',
        ex: [ej('estocadas', 3, [10, 12], 60, '2'), ej('press-plano-mancuernas', 3, [10, 12], 60, '2'), ej('remo-mancuerna', 3, [10, 12], 60, '2'), ej('step-up', 2, [10, 12], 60, '2'), ej('crunch', 3, [15, 20], 45, '1')],
        final: [ELIPTICO],
      },
    ]),
  },
  {
    id: 'forma-4',
    nombre: 'Fuerza y cardio · 4 días',
    frecuencia: 4,
    objetivos: ['forma'],
    nivel: 'intermedio',
    descripcion: 'Torso y pierna con descansos cortos, más cardio al final de cada sesión. Más gasto por semana para bajar grasa manteniendo la fuerza.',
    comodin: [6],
    descanso: 'Caminá 30–40 min los días sin pesas.',
    dias: dias([
      {
        id: 'fc4-ta', dow: 1, tipo: 'torso', letra: 'A', nombre: 'Torso A', foco: 'Pecho, espalda y hombro + cinta', duracion: '60 min', calor: 'sup',
        ex: [ej('press-plano-mancuernas', 3, [10, 12], 75, '2'), ej('remo-polea', 3, [10, 12], 75, '2'), ej('press-hombro-mancuernas', 3, [10, 12], 75, '2'), ej('jalon-ancho', 3, [10, 12], 75, '2'), ej('triceps-polea', 2, [12, 15], 0, '1', '5'), ej('curl-martillo', 2, [12, 15], 45, '1', '5')],
        final: [CINTA],
      },
      {
        id: 'fc4-pa', dow: 2, tipo: 'pierna', letra: 'A', nombre: 'Pierna A', foco: 'Sentadilla y bisagra + elíptico', duracion: '60 min', calor: 'inf',
        ex: [ej('sentadilla-goblet', 3, [10, 12], 90, '2'), ej('peso-muerto-rumano', 3, [10, 12], 90, '2'), ej('estocadas', 3, [10, 12], 75, '2'), ej('curl-femoral', 3, [12, 15], 60, '1'), ej('plancha', 3, [30, 45], 45, '—')],
        final: [ELIPTICO],
      },
      {
        id: 'fc4-tb', dow: 4, tipo: 'torso', letra: 'B', nombre: 'Torso B', foco: 'Circuito de torso + remo', duracion: '55 min', calor: 'sup',
        ex: [ej('flexiones', 3, [8, 12], 60, '2'), ej('remo-mancuerna', 3, [10, 12], 60, '2'), ej('elev-lateral', 3, [12, 15], 45, '1'), ej('face-pull', 3, [12, 15], 45, '1'), ej('escaladores', 3, [20, 30], 45, '—')],
        final: [REMO],
      },
      {
        id: 'fc4-pb', dow: 5, tipo: 'pierna', letra: 'B', nombre: 'Pierna B', foco: 'Prensa, glúteo y swing + cinta', duracion: '60 min', calor: 'inf',
        ex: [ej('prensa', 3, [12, 15], 75, '2'), ej('hip-thrust', 3, [10, 12], 75, '2'), ej('step-up', 3, [10, 12], 60, '2'), ej('swing-kettlebell', 3, [15, 20], 60, '2'), ej('crunch', 3, [15, 20], 45, '1')],
        final: [CINTA],
      },
    ]),
  },
];

/** Todas las rutinas que la app conoce, por id (las armadas y la personal). */
export const RUTINAS: Record<string, Rutina> = Object.fromEntries([RUTINA_PERSONAL, ...PLANTILLAS].map((r) => [r.id, r]));
