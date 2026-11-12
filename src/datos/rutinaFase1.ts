import type { Calentamiento, DiaRutina } from '../dominio/tipos';

// Rutina Fase 1: torso/pierna, 4 días. Es la misma del plan acordado el 27/10/2026.
// Un ejercicio que aparece en dos días usa el mismo id para compartir notas e historial.

const LATERAL_TEC =
  'Brazo casi estirado. Subí un poco por delante del cuerpo (unos 30°) hasta la altura del hombro, no más arriba, con los pulgares neutros. Subí en 1 s y bajá en 2–3 s.';
const LATERAL_AVISO =
  'Si te molesta el hombro, bajá el peso y subí solo hasta donde no moleste. Si sigue, sacalo y consultá con un kinesiólogo.';

const APROXIMACION_TORSO: Calentamiento = {
  n: 'Series de aproximación',
  dosis: '2 series',
  nota: 'Dos series livianas del primer ejercicio antes de las de la tabla. Ej.: si en banca trabajás con 35 kg, barra sola × 10 y 27,5 kg × 5. No cansan y no se anotan.',
};
const APROXIMACION_PIERNA: Calentamiento = {
  n: 'Series de aproximación',
  dosis: '2 series',
  nota: 'Dos series livianas del primer ejercicio antes de las de la tabla. Ej.: si en la hack trabajás con 10 kg por lado, sin discos × 10 y 5 kg por lado × 5. No cansan y no se anotan.',
};

export const CALOR_TORSO: Calentamiento[] = [
  { n: 'Bici o cinta suave', dosis: '5 min', img: 'bici' },
  { n: 'Rotaciones de hombros', dosis: '15', img: 'hombros', nota: 'Subí los hombros hacia las orejas y giralos hacia atrás, en círculos lentos.' },
  { n: 'Face pull liviano', dosis: '1 × 15', img: 'face-pull' },
  APROXIMACION_TORSO,
];

export const CALOR_PIERNA: Calentamiento[] = [
  { n: 'Bici o cinta suave', dosis: '5 min', img: 'bici' },
  { n: 'Movilidad cadera 90/90', dosis: '1 × 16', nota: 'La misma que hacías en tu rutina anterior.' },
  { n: 'Movilidad sentadilla', dosis: '1 × 12', img: 'sentadilla-libre', nota: 'Sentadilla sin peso, lenta y bien profunda.' },
  { n: 'Movilidad psoas-cadera', dosis: '1 × 16', img: 'psoas' },
  APROXIMACION_PIERNA,
];

export const RUTINA_FASE1: DiaRutina[] = [
  {
    id: 'torso-a',
    num: 1,
    dow: 1,
    dia: 'Lunes',
    tipo: 'torso',
    letra: 'A',
    nombre: 'Torso A',
    foco: 'Pecho, espalda, hombro y brazos',
    duracion: '60–65 min',
    calor: CALOR_TORSO,
    ex: [
      {
        id: 'press-banca', img: 'press-banca', n: 'Press de banca con barra', m: 'Pecho, tríceps',
        s: 3, r: [8, 10], desc: 150, descTxt: '2–3 min', rir: '2', sug: '5 kg por lado', sugKg: 5, unidad: 'lado-barra', basico: true,
        t: 'Omóplatos juntos y hacia abajo, pies firmes en el piso. La barra baja hasta tocar el pecho a la altura de los pezones, con los codos a 45–60° del torso.',
        alt: 'Press plano con mancuernas o en máquina.',
      },
      {
        id: 'remo-t', img: 'remo-t-barra', n: 'Remo en T', m: 'Espalda media, dorsal',
        s: 3, r: [8, 10], desc: 150, descTxt: '2–3 min', rir: '2', sug: '15 kg', sugKg: 15, unidad: 'kg', basico: true,
        t: 'Espalda recta, inclinada a unos 45°. Tirá llevando los codos hacia la cadera, sin tirones.',
        alt: 'Remo en polea sentado.',
      },
      {
        id: 'press-inclinado', img: 'press-inclinado', n: 'Press inclinado con mancuernas', m: 'Pecho superior',
        s: 3, r: [10, 12], desc: 120, descTxt: '2 min', rir: '1–2', sug: '7,5 kg c/u', sugKg: 7.5, unidad: 'cu',
        t: 'Banco a 30°. Bajada controlada hasta sentir estiramiento en el pecho.',
        alt: 'Press inclinado en máquina.',
      },
      {
        id: 'jalon-ancho', img: 'jalon-ancho', n: 'Jalón al pecho, agarre ancho', m: 'Dorsal',
        s: 3, r: [10, 12], desc: 120, descTxt: '2 min', rir: '1–2', sug: 'El siguiente después de 25 kg', sugKg: null, unidad: 'kg', basico: true,
        t: 'Pecho alto. Llevá la barra a la parte alta del pecho con los codos hacia abajo, sin balancear el torso.',
        alt: 'Dominadas asistidas.',
      },
      {
        id: 'elev-lateral', img: 'elev-lateral', n: 'Elevación lateral', m: 'Hombro lateral',
        s: 3, r: [12, 15], desc: 60, descTxt: '1 min', rir: '1–2', sug: '2,5–4 kg c/u', sugKg: 2.5, unidad: 'cu',
        t: LATERAL_TEC, alt: 'En polea baja, un brazo por vez.', aviso: LATERAL_AVISO,
      },
      {
        id: 'triceps-polea', img: 'triceps-polea', n: 'Extensión de tríceps en polea', m: 'Tríceps',
        s: 3, r: [10, 15], desc: 0, descTxt: 'Sin pausa', rir: '1', sug: '25 kg', sugKg: 25, unidad: 'kg', g: '6',
        t: 'Codos pegados al cuerpo y quietos, extensión completa abajo.',
        alt: 'Con cuerda.',
      },
      {
        id: 'curl-barra', img: 'curl-barra', n: 'Curl con barra', m: 'Bíceps',
        s: 3, r: [10, 12], desc: 90, descTxt: '1,5 min', rir: '1', sug: '2,5 kg por lado', sugKg: 2.5, unidad: 'lado-barra', g: '6',
        t: 'Codos quietos al costado, sin balancear la cadera, bajada completa.',
        alt: 'Curl con mancuernas.',
      },
    ],
  },
  {
    id: 'pierna-a',
    num: 2,
    dow: 2,
    dia: 'Martes',
    tipo: 'pierna',
    letra: 'A',
    nombre: 'Pierna A',
    foco: 'Cuádriceps, isquios, gemelos y abdomen',
    duracion: '55–60 min',
    calor: CALOR_PIERNA,
    ex: [
      {
        id: 'hack', img: 'hack', n: 'Sentadilla hack', m: 'Cuádriceps, glúteo',
        s: 3, r: [8, 10], desc: 150, descTxt: '2–3 min', rir: '2', sug: '10 kg por lado', sugKg: 10, unidad: 'lado', basico: true,
        t: 'Pies a la altura de los hombros, en el medio de la plataforma. Bajá hasta que el muslo quede paralelo o un poco más, con las rodillas hacia las puntas y sin despegar los talones.',
        alt: 'Prensa.',
      },
      {
        id: 'peso-muerto-rumano', img: 'peso-muerto-rumano', n: 'Peso muerto rumano con mancuernas', m: 'Isquiotibiales, glúteo',
        s: 3, r: [8, 10], desc: 150, descTxt: '2–3 min', rir: '3', sug: 'Probar', sugKg: null, unidad: 'cu',
        t: 'Rodillas apenas flexionadas, cadera hacia atrás, espalda recta y mancuernas pegadas a las piernas. Bajá hasta sentir tensión fuerte atrás del muslo (más o menos a mitad de la tibia) y subí empujando la cadera adelante. RIR 3 mientras aprendés el movimiento.',
        alt: 'Hiperextensiones en banco romano.',
      },
      {
        id: 'ext-cuadriceps', img: 'ext-cuadriceps', n: 'Extensión de cuádriceps', m: 'Cuádriceps',
        s: 3, r: [12, 15], desc: 90, descTxt: '1,5 min', rir: '1', sug: 'Probar', sugKg: null, unidad: 'kg',
        t: 'La rodilla alineada con el eje de la máquina. Pausa de 1 s arriba.',
        alt: 'Prensa con los pies bajos en la plataforma.',
      },
      {
        id: 'curl-femoral', img: 'curl-femoral', n: 'Curl femoral en máquina', m: 'Isquiotibiales',
        s: 3, r: [10, 12], desc: 90, descTxt: '1,5 min', rir: '1–2', sug: '25 kg', sugKg: 25, unidad: 'kg',
        t: 'Cadera pegada al asiento. Bajada lenta, de 2–3 s.',
        alt: 'Curl femoral sentado.',
      },
      {
        id: 'gemelos', img: 'gemelos', n: 'Gemelos en máquina', m: 'Gemelos',
        s: 3, r: [10, 15], desc: 60, descTxt: '1 min', rir: '1', sug: 'El siguiente después de 10 kg', sugKg: null, unidad: 'kg',
        t: 'Rango completo, con pausa de 1–2 s abajo, el talón estirado y sin rebotar.',
        alt: 'Elevación de talones en un escalón.',
      },
      {
        id: 'crunch-polea', img: 'crunch-polea', n: 'Crunch en polea', m: 'Abdomen',
        s: 3, r: [10, 15], desc: 60, descTxt: '1 min', rir: '1–2', sug: 'Probar', sugKg: null, unidad: 'kg',
        t: 'De rodillas, cuerda a los costados de la cabeza. Enrollá la columna llevando el pecho hacia la pelvis, con la cadera quieta.',
        alt: 'Crunch en el piso con un disco.',
      },
    ],
  },
  {
    id: 'torso-b',
    num: 3,
    dow: 4,
    dia: 'Jueves',
    tipo: 'torso',
    letra: 'B',
    nombre: 'Torso B',
    foco: 'Hombro, espalda, pecho y brazos',
    duracion: '60–65 min',
    calor: CALOR_TORSO,
    ex: [
      {
        id: 'press-hombro', img: 'press-hombro', n: 'Press de hombro en máquina convergente', m: 'Hombro, tríceps',
        s: 3, r: [8, 10], desc: 120, descTxt: '2 min', rir: '2', sug: '5 kg por lado', sugKg: 5, unidad: 'lado', basico: true,
        t: 'Espalda apoyada y asiento regulado para que las manijas queden a la altura de los hombros. No bloquees los codos arriba.',
        alt: 'Press con mancuernas sentado.', aviso: 'Si te molesta el hombro, sacalo y avisá en la revisión semanal.',
      },
      {
        id: 'jalon-neutro', img: 'jalon-neutro', n: 'Jalón al pecho, agarre cerrado o neutro', m: 'Dorsal',
        s: 3, r: [8, 10], desc: 120, descTxt: '2 min', rir: '2', sug: 'El mismo que el lunes', sugKg: null, unidad: 'kg',
        t: 'Pecho alto. Llevá la barra a la parte alta del pecho con los codos pegados al cuerpo.',
        alt: 'Dominadas asistidas con agarre neutro.',
      },
      {
        id: 'press-plano-mancuernas', img: 'press-plano-mancuernas', n: 'Press plano con mancuernas', m: 'Pecho, tríceps',
        s: 3, r: [10, 12], desc: 120, descTxt: '2 min', rir: '1–2', sug: 'Probar', sugKg: null, unidad: 'cu',
        t: 'Omóplatos juntos. Bajá las mancuernas a los costados del pecho con control.',
        alt: 'Press de banca con barra o en máquina.',
      },
      {
        id: 'remo-mancuerna', img: 'remo-mancuerna', n: 'Remo con mancuerna a una mano', m: 'Dorsal',
        s: 3, r: [10, 12], desc: 90, descTxt: '1,5 min', rir: '1–2', sug: 'Probar', sugKg: null, unidad: 'cu', porBrazo: true,
        t: 'Rodilla y mano en el banco, espalda plana. Llevá el codo hacia la cadera. Las repeticiones son por brazo.',
        alt: 'Remo en polea a una mano.',
      },
      {
        id: 'aperturas', img: 'aperturas', n: 'Aperturas en polea o pec deck', m: 'Pecho',
        s: 2, r: [12, 15], desc: 60, descTxt: '1 min', rir: '1', sug: 'Probar', sugKg: null, unidad: 'kg',
        t: 'Codos semiflexionados y fijos. Abrí hasta sentir estiramiento sin pasar la línea del hombro.',
        alt: 'Aperturas con mancuernas.',
      },
      {
        id: 'elev-lateral', img: 'elev-lateral', n: 'Elevación lateral', m: 'Hombro lateral',
        s: 3, r: [12, 15], desc: 0, descTxt: 'Sin pausa', rir: '1–2', sug: '2,5–4 kg c/u', sugKg: 2.5, unidad: 'cu', g: '6',
        t: LATERAL_TEC, alt: 'En polea baja, un brazo por vez.', aviso: LATERAL_AVISO,
      },
      {
        id: 'face-pull', img: 'face-pull', n: 'Face pull en polea', m: 'Hombro posterior, espalda alta',
        s: 3, r: [12, 15], desc: 60, descTxt: '1 min', rir: '1–2', sug: 'Probar', sugKg: null, unidad: 'kg', g: '6',
        t: 'Polea a la altura de la cara, con cuerda. Tirá hacia la frente separando las manos, con los codos altos.',
        alt: 'Pájaros con mancuernas.',
      },
      {
        id: 'triceps-cabeza', img: 'triceps-cabeza', n: 'Extensión de tríceps sobre la cabeza', m: 'Tríceps',
        s: 2, r: [10, 12], desc: 0, descTxt: 'Sin pausa', rir: '1', sug: '10 kg (una mancuerna)', sugKg: 10, unidad: 'kg', g: '7',
        t: 'Codos apuntando arriba y cerrados. Bajá la mancuerna detrás de la cabeza hasta estirar.',
        alt: 'En polea con cuerda.',
      },
      {
        id: 'curl-martillo', img: 'curl-martillo', n: 'Curl martillo', m: 'Bíceps, antebrazo',
        s: 2, r: [10, 12], desc: 90, descTxt: '1,5 min', rir: '1', sug: '5 kg c/u', sugKg: 5, unidad: 'cu', g: '7',
        t: 'Palmas enfrentadas, codos quietos.',
        alt: 'En polea con cuerda.',
      },
    ],
  },
  {
    id: 'pierna-b',
    num: 4,
    dow: 5,
    dia: 'Viernes',
    tipo: 'pierna',
    letra: 'B',
    nombre: 'Pierna B',
    foco: 'Glúteo, cuádriceps, isquios y abdomen',
    duracion: '55–60 min',
    calor: CALOR_PIERNA,
    ex: [
      {
        id: 'hip-thrust', img: 'hip-thrust', n: 'Hip thrust con barra', m: 'Glúteo',
        s: 3, r: [8, 12], desc: 120, descTxt: '2 min', rir: '2', sug: 'Barra + 5 kg por lado', sugKg: 5, unidad: 'lado-barra', basico: true,
        t: 'El borde del banco debajo de los omóplatos, pies al ancho de la cadera, mentón hacia el pecho. Subí hasta que el torso quede paralelo al piso y apretá los glúteos 1 s, sin arquear la zona lumbar. Usá almohadilla en la barra.',
        alt: 'Puente de glúteo en cajón.',
      },
      {
        id: 'prensa', img: 'prensa', n: 'Prensa de piernas', m: 'Cuádriceps, glúteo',
        s: 3, r: [10, 12], desc: 120, descTxt: '2 min', rir: '2', sug: 'Probar', sugKg: null, unidad: 'lado',
        t: 'Pies a la altura de los hombros. Bajá hasta justo antes de que la cadera se despegue del respaldo y no bloquees las rodillas arriba.',
        alt: 'Sentadilla goblet con mancuerna.',
      },
      {
        id: 'curl-femoral', img: 'curl-femoral', n: 'Curl femoral en máquina', m: 'Isquiotibiales',
        s: 3, r: [10, 12], desc: 90, descTxt: '1,5 min', rir: '1', sug: 'El mismo que el martes', sugKg: null, unidad: 'kg',
        t: 'Cadera pegada al asiento. Bajada lenta, de 2–3 s.',
        alt: 'Curl femoral sentado.',
      },
      {
        id: 'ext-cuadriceps', img: 'ext-cuadriceps', n: 'Extensión de cuádriceps', m: 'Cuádriceps',
        s: 2, r: [12, 15], desc: 90, descTxt: '1,5 min', rir: '1', sug: 'El mismo que el martes', sugKg: null, unidad: 'kg',
        t: 'La rodilla alineada con el eje de la máquina. Pausa de 1 s arriba.',
        alt: 'Prensa con los pies bajos en la plataforma.',
      },
      {
        id: 'gemelos', img: 'gemelos', n: 'Gemelos en máquina', m: 'Gemelos',
        s: 3, r: [12, 15], desc: 60, descTxt: '1 min', rir: '1', sug: 'El mismo que el martes', sugKg: null, unidad: 'kg',
        t: 'Rango completo, con pausa de 1–2 s abajo, el talón estirado y sin rebotar.',
        alt: 'Elevación de talones en un escalón.',
      },
      {
        id: 'elev-rodillas', img: 'elev-rodillas', n: 'Elevación de rodillas', m: 'Abdomen',
        s: 3, r: [10, 15], desc: 60, descTxt: '1 min', rir: '1–2', sug: 'Peso corporal', sugKg: null, unidad: 'corporal',
        t: 'Colgado o en paralelas, sin balanceo. Subí las rodillas al pecho redondeando un poco la pelvis.',
        alt: 'Crunch inverso en el piso.',
      },
    ],
  },
];
