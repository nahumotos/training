import type { Ejercicio } from '../dominio/tipos';
import { RUTINA_FASE1 } from './rutinaFase1';

/** Lo fijo de un ejercicio: cómo se llama, qué trabaja, cómo se anota el peso y cómo se hace. */
export type BaseEjercicio = Pick<Ejercicio, 'img' | 'n' | 'm' | 'unidad' | 't' | 'alt' | 'aviso' | 'basico'>;

// Los ejercicios de la rutina Fase 1 se reutilizan tal cual (misma técnica y misma foto).
const DE_FASE1: Record<string, BaseEjercicio> = {};
for (const d of RUTINA_FASE1) {
  for (const e of d.ex) {
    DE_FASE1[e.id] ??= { img: e.img, n: e.n, m: e.m, unidad: e.unidad, t: e.t, alt: e.alt, aviso: e.aviso, basico: e.basico };
  }
}

const NUEVOS: Record<string, BaseEjercicio> = {
  'sentadilla-barra': {
    img: 'sentadilla-barra', n: 'Sentadilla con barra', m: 'Cuádriceps, glúteo', unidad: 'lado-barra', basico: true,
    t: 'Barra sobre la espalda alta y pies al ancho de los hombros. Bajá con la espalda recta hasta que la cadera llegue a la altura de las rodillas o un poco más abajo, con las rodillas hacia donde apuntan los pies. Subí empujando el piso.',
    alt: 'Sentadilla en máquina Smith o prensa de piernas.',
  },
  'peso-muerto': {
    img: 'peso-muerto', n: 'Peso muerto con barra', m: 'Espalda baja, glúteo, isquiotibiales', unidad: 'lado-barra', basico: true,
    t: 'Barra pegada a las piernas, espalda recta y pecho alto. Empujá el piso con los pies y estirá cadera y rodillas a la vez. Bajá por el mismo camino, sin redondear la espalda.',
    alt: 'Peso muerto rumano con mancuernas.',
  },
  'press-militar': {
    img: 'press-militar', n: 'Press militar con barra', m: 'Hombro, tríceps', unidad: 'lado-barra', basico: true,
    t: 'De pie, con abdomen y glúteos firmes. Empujá la barra desde la clavícula hasta arriba de la cabeza, sin arquear la espalda baja.',
    alt: 'Press de hombro con mancuernas o en máquina.',
  },
  dominadas: {
    img: 'dominadas', n: 'Dominadas', m: 'Dorsal, bíceps', unidad: 'corporal', basico: true,
    t: 'Colgado con los brazos estirados, subí hasta que el mentón pase la barra llevando los codos hacia abajo. Bajá controlado. Si todavía no salen, usá una banda elástica o la máquina asistida.',
    alt: 'Jalón al pecho.',
  },
  fondos: {
    img: 'fondos', n: 'Fondos en paralelas', m: 'Pecho, tríceps', unidad: 'corporal',
    t: 'Torso un poco inclinado hacia adelante. Bajá hasta que los hombros queden a la altura de los codos y subí sin trabar los codos de golpe.',
    alt: 'Fondos asistidos en máquina.',
  },
  flexiones: {
    img: 'flexiones', n: 'Flexiones de brazos', m: 'Pecho, tríceps', unidad: 'corporal',
    t: 'Cuerpo en línea recta de la cabeza a los talones. Bajá el pecho cerca del piso con los codos a unos 45° del torso. Si cuesta, apoyá las manos en un banco.',
    alt: 'Press plano con mancuernas.',
  },
  estocadas: {
    img: 'estocadas', n: 'Estocadas con mancuernas', m: 'Cuádriceps, glúteo', unidad: 'cu',
    t: 'Paso largo hacia adelante y bajá hasta que la rodilla de atrás casi toque el piso, con el torso derecho. Alterná las piernas; las repeticiones son por pierna.',
    alt: 'Estocadas sin peso.',
  },
  'sentadilla-dividida': {
    img: 'sentadilla-dividida', n: 'Sentadilla dividida con mancuernas', m: 'Cuádriceps, glúteo', unidad: 'cu',
    t: 'Un pie adelante y otro atrás, como en una estocada. Bajá en vertical sin mover los pies y subí empujando con la pierna de adelante. Todas las repeticiones de un lado y después las del otro.',
    alt: 'Con el pie de atrás sobre un banco (sentadilla búlgara), cuando la domines.',
  },
  'puente-gluteo': {
    img: 'puente-gluteo', n: 'Puente de glúteo', m: 'Glúteo', unidad: 'corporal',
    t: 'Boca arriba, con las rodillas dobladas y los pies apoyados. Subí la cadera apretando los glúteos hasta formar una línea de las rodillas a los hombros y aguantá un segundo arriba.',
    alt: 'Hip thrust con barra, para sumar peso.',
  },
  'patada-gluteo': {
    img: 'patada-gluteo', n: 'Patada de glúteo en polea', m: 'Glúteo', unidad: 'kg',
    t: 'Tobillera en la polea baja. Llevá la pierna hacia atrás con la rodilla casi estirada, sin arquear la espalda baja. Todas las repeticiones de un lado y después las del otro.',
    alt: 'En máquina de glúteo o con banda elástica.',
  },
  abductores: {
    img: 'abductores', n: 'Abducción de cadera en máquina', m: 'Glúteo medio', unidad: 'kg',
    t: 'Espalda apoyada. Abrí las piernas contra la resistencia, aguantá un segundo y volvé despacio.',
    alt: 'Acostado de costado con una banda elástica sobre las rodillas.',
  },
  'remo-barra': {
    img: 'remo-barra', n: 'Remo con barra', m: 'Espalda media, dorsal', unidad: 'lado-barra', basico: true,
    t: 'Torso inclinado a unos 45° y espalda recta. Llevá la barra al ombligo con los codos cerca del cuerpo y bajala controlada.',
    alt: 'Remo en polea sentado.',
  },
  plancha: {
    img: 'plancha', n: 'Plancha (segundos)', m: 'Abdomen', unidad: 'corporal',
    t: 'Antebrazos y puntas de los pies apoyados, cuerpo en línea recta. Apretá abdomen y glúteos sin dejar caer la cadera. En lugar de repeticiones, anotá los segundos que aguantaste.',
    alt: 'Con las rodillas apoyadas.',
  },
  'swing-kettlebell': {
    img: 'swing-kettlebell', n: 'Swing con pesa rusa', m: 'Glúteo, isquiotibiales', unidad: 'kg',
    t: 'Pies un poco más abiertos que los hombros. Llevá la pesa entre las piernas doblando la cadera y proyectala hasta la altura del pecho con un empuje fuerte de cadera, con los brazos relajados.',
    alt: 'Peso muerto rumano con mancuernas.',
  },
  escaladores: {
    img: 'escaladores', n: 'Escaladores', m: 'Abdomen, cardio', unidad: 'corporal',
    t: 'En posición de flexión, llevá las rodillas al pecho alternando, rápido y sin levantar la cadera. Cada pierna cuenta como una repetición.',
    alt: 'Más lento, con las manos sobre un banco.',
  },
  'remo-polea': {
    img: 'remo-polea', n: 'Remo en polea sentado', m: 'Espalda media, dorsal', unidad: 'kg', basico: true,
    t: 'Pecho alto y espalda recta. Llevá el agarre al abdomen juntando los omóplatos, sin balancear el torso.',
    alt: 'Remo en máquina.',
  },
  'sentadilla-goblet': {
    img: 'sentadilla-goblet', n: 'Sentadilla goblet', m: 'Cuádriceps, glúteo', unidad: 'kg',
    t: 'Mancuerna o pesa rusa pegada al pecho. Bajá entre las piernas con la espalda recta y los codos por dentro de las rodillas.',
    alt: 'Sentadilla sin peso.',
  },
  'step-up': {
    img: 'step-up', n: 'Subida al banco con mancuernas', m: 'Cuádriceps, glúteo', unidad: 'cu',
    t: 'Pie entero sobre un banco firme, a la altura de la rodilla. Subí empujando con esa pierna, sin impulsarte con la de abajo. Todas las repeticiones de un lado y después las del otro.',
    alt: 'Sin peso.',
  },
  'press-hombro-mancuernas': {
    img: 'press-hombro-mancuernas', n: 'Press de hombro con mancuernas', m: 'Hombro, tríceps', unidad: 'cu',
    t: 'Sentado y con respaldo. Empujá las mancuernas desde la altura de las orejas hasta arriba, sin chocarlas ni arquear la espalda.',
    alt: 'Press de hombro en máquina.',
  },
  pajaros: {
    img: 'pajaros', n: 'Vuelos posteriores con mancuernas', m: 'Hombro posterior', unidad: 'cu',
    t: 'Torso inclinado hacia adelante y brazos casi estirados. Abrí los brazos hacia los costados apretando la parte de atrás de los hombros, sin tirones.',
    alt: 'Face pull en polea.',
  },
  'press-frances': {
    img: 'press-frances', n: 'Press francés con barra Z', m: 'Tríceps', unidad: 'kg',
    t: 'Acostado, con la barra arriba del pecho y los brazos estirados. Doblá solo los codos llevando la barra hacia la frente y volvé a estirar.',
    alt: 'Extensión de tríceps en polea.',
  },
  hiperextensiones: {
    img: 'hiperextensiones', n: 'Hiperextensiones', m: 'Espalda baja, glúteo', unidad: 'corporal',
    t: 'Cadera apoyada en el borde del aparato. Bajá con la espalda recta y subí hasta quedar en línea, sin pasarte hacia atrás.',
    alt: 'Puente de glúteo.',
  },
  'gemelos-parado': {
    img: 'gemelos-parado', n: 'Gemelos de pie', m: 'Gemelos', unidad: 'kg',
    t: 'Puntas de los pies sobre un escalón. Bajá los talones hasta estirar y subí lo más alto que puedas, con una pausa arriba.',
    alt: 'Gemelos en máquina sentado.',
  },
  crunch: {
    img: 'crunch', n: 'Abdominales (crunch)', m: 'Abdomen', unidad: 'corporal',
    t: 'Boca arriba con las rodillas dobladas. Despegá los hombros del piso llevando las costillas hacia la cadera, sin tirar del cuello.',
    alt: 'Crunch en polea.',
  },
};

/** Todos los ejercicios disponibles para armar rutinas, por id. */
export const EJERCICIOS: Record<string, BaseEjercicio> = { ...DE_FASE1, ...NUEVOS };
