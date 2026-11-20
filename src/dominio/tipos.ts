// Tipos del dominio. Son los mismos para el almacenamiento en Firestore,
// el modo demo y la exportación de datos.

export type ComidaId = 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'extras';

export type OrigenItem = 'lib' | 'mio' | 'ia' | 'manual';

/** Un alimento cargado en una comida. p, c, g y k son por unidad: el total es valor × q. */
export interface ItemComida {
  id: string;
  n: string;
  por: string;
  q: number;
  p: number;
  /** Hidratos en gramos. null cuando no se conoce. */
  c: number | null;
  /** Grasas en gramos. null cuando no se conoce. */
  g: number | null;
  k: number;
  src: OrigenItem;
  /** Id del alimento de la biblioteca o de Mis alimentos, si vino de ahí. */
  ref?: string;
}

export interface Dia {
  fecha: string;
  comidas: Record<ComidaId, ItemComida[]>;
  /** Mililitros. */
  agua: number;
  pasos: number | null;
  /** HH:MM */
  acosto: string;
  /** HH:MM */
  levanto: string;
  /** 1 a 5 */
  energia: number | null;
  /** kg */
  peso: number | null;
  /** cm */
  cintura: number | null;
  molestias: string;
  nota: string;
}

export type CategoriaId = 'carnes' | 'lacteos' | 'harinas' | 'frutas' | 'mate' | 'afuera' | 'bebidas';

export interface Alimento {
  id: string;
  n: string;
  por: string;
  p: number;
  c: number | null;
  g: number | null;
  k: number;
}

export interface AlimentoBiblioteca extends Alimento {
  cat: CategoriaId;
}

export interface AlimentoPropio extends Alimento {
  creado: string;
}

/**
 * Cómo se anota el peso de un ejercicio.
 * - lado-barra: discos por lado en una barra de 20 kg (se puede calcular el total).
 * - lado: discos por lado en una máquina (no se conoce el peso del carro).
 * - cu: peso de cada mancuerna.
 * - kg: peso total o de la placa.
 * - corporal: sin peso agregado.
 */
export type UnidadPeso = 'lado-barra' | 'lado' | 'cu' | 'kg' | 'corporal';

export interface Ejercicio {
  id: string;
  /** Nombre base de la animación en /ejercicios. */
  img: string;
  n: string;
  /** Músculos. */
  m: string;
  /** Series. */
  s: number;
  /** Rango de repeticiones. */
  r: [number, number];
  /** Descanso en segundos para el temporizador (0: sin pausa, sigue el otro ejercicio de la superserie). */
  desc: number;
  /** Descanso como lo dice el plan. */
  descTxt: string;
  rir: string;
  /** Peso inicial sugerido, como texto. */
  sug: string;
  /** Peso inicial sugerido como número, si se puede expresar así. */
  sugKg: number | null;
  unidad: UnidadPeso;
  /** Grupo de superserie, por ejemplo "6". */
  g?: string;
  porBrazo?: boolean;
  /** Ejercicio básico para el resumen semanal y los gráficos de cargas. */
  basico?: boolean;
  /** Técnica. */
  t: string;
  alt: string;
  aviso?: string;
}

export interface Calentamiento {
  n: string;
  dosis: string;
  img?: string;
  nota?: string;
}

export type TipoDia = 'torso' | 'pierna' | 'full' | 'empuje' | 'tiron';

export interface DiaRutina {
  id: string;
  num: number;
  /** Día de la semana: 0 domingo … 6 sábado. */
  dow: number;
  dia: string;
  /** Qué trabaja: define el color del círculo del día. */
  tipo: TipoDia;
  letra: string;
  nombre: string;
  foco: string;
  duracion: string;
  calor: Calentamiento[];
  ex: Ejercicio[];
  /** Para terminar (por ejemplo, cardio después de las pesas). */
  final?: Calentamiento[];
}

export interface SerieHecha {
  /** Peso en la unidad del ejercicio. null en peso corporal. */
  peso: number | null;
  reps: number;
  /** Momento en que se marcó, ISO. */
  t: string;
}

export interface Sesion {
  /** `${fecha}_${diaId}` */
  id: string;
  dia: string;
  fecha: string;
  inicio: string;
  fin: string | null;
  /** Por ejercicio, una posición por serie; null si esa serie todavía no se hizo. */
  ejercicios: Record<string, (SerieHecha | null)[]>;
}

export interface NotaEjercicio {
  peso: number | null;
  nota: string;
  actualizado: string;
}

export interface Rango {
  min: number;
  max: number;
}

export interface Objetivos {
  proteina: { obj: number; min: number; max: number };
  kcal: Rango;
  hidratos: Rango;
  grasas: Rango;
  /** Mililitros. */
  agua: number;
  /** Gramos de proteína desde los que una comida cuenta como "con proteína". */
  umbralComida: number;
}

export interface Perfil {
  nombre: string;
  /** Primer día de la rutina, YYYY-MM-DD. */
  inicioRutina: string;
  objetivos: Objetivos;
  /**
   * Rutina elegida (id de las rutinas armadas). null: todavía no eligió.
   * Sin el campo (perfiles anteriores al registro abierto): la de cada tipo de cuenta.
   */
  rutina?: string | null;
}

/** Qué busca la persona con la rutina. */
export type ObjetivoRutina = 'musculo' | 'fuerza' | 'forma' | 'gluteos';
export type NivelRutina = 'principiante' | 'intermedio' | 'avanzado';

/** Una rutina completa: sus días y cómo se organiza la semana. */
export interface Rutina {
  id: string;
  nombre: string;
  /** Días de entrenamiento por semana. */
  frecuencia: number;
  objetivos: ObjetivoRutina[];
  nivel: NivelRutina;
  descripcion: string;
  /** Días de la semana (0 domingo … 6 sábado) para recuperar un entrenamiento que faltó. */
  comodin: number[];
  /** Qué hacer los días sin pesas, como una oración: «Caminá 30 min.» */
  descanso: string;
  /** Qué hacer después de entrenar, si la rutina lo indica. */
  despues?: string;
  /** Detalle del comodín, por ejemplo «de 8 a 13 h». */
  horarioComodin?: string;
  dias: DiaRutina[];
  /** No se ofrece para elegir (por ejemplo, un plan personal). */
  oculta?: boolean;
}

/** Secciones de la app que se habilitan por cuenta. Rutina está siempre. */
export type Seccion = 'rutina' | 'comidas' | 'progreso' | 'plan';

export interface NotaSemana {
  /** Lunes de la semana, YYYY-MM-DD. */
  lunes: string;
  nota: string;
}

/** Formato de exportación e importación de todos los datos. */
export interface Exportacion {
  formato: 'libreta';
  version: 1;
  exportado: string;
  perfil: Perfil | null;
  dias: Dia[];
  alimentos: AlimentoPropio[];
  notas: Record<string, NotaEjercicio>;
  sesiones: Sesion[];
  semanas: NotaSemana[];
}
