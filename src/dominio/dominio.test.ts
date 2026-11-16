import { describe, expect, it } from 'vitest';
import { diaVacio, estadoKcal, macrosDe, proporciones, proximaComida, recientes, totalesDia } from './comidas';
import { diferenciaDias, esFechaIso, fechaLarga, lunesDe, rotuloSemana, sumarDias } from './fechas';
import { leerNumero, num, reloj } from './formato';
import { OBJETIVOS_INICIALES, validarObjetivos, validarPerfil } from './perfil';
import { mejoresSeries, promedioHora, resumenSemana, textoResumen, textoSerie } from './progreso';
import {
  diasHechosEnSemana,
  etapaActual,
  queTocaHoy,
  sugerencia,
  totalConBarra,
  ultimaVez,
  valoresIniciales,
  diaPorId,
} from './rutina';
import { ErrorImportacion, sanearDia, sanearExportacion, sanearItem, sanearPerfil, sanearSesion } from './saneo';
import type { Dia, ItemComida, Sesion } from './tipos';

const O = OBJETIVOS_INICIALES;

function item(p: Partial<ItemComida> = {}): ItemComida {
  return { id: 'x', n: 'Algo', por: '1', q: 1, p: 10, c: 5, g: 2, k: 100, src: 'lib', ...p };
}

function sesion(fecha: string, dia: string, ej: Sesion['ejercicios'], inicio = `${fecha}T10:00:00.000Z`): Sesion {
  return { id: `${fecha}_${dia}`, dia, fecha, inicio, fin: null, ejercicios: ej };
}

describe('fechas', () => {
  it('valida fechas reales', () => {
    expect(esFechaIso('2026-11-09')).toBe(true);
    expect(esFechaIso('2026-02-30')).toBe(false);
    expect(esFechaIso('9/11/2026')).toBe(false);
  });
  it('calcula lunes y diferencias, también entre meses', () => {
    expect(lunesDe('2026-11-12')).toBe('2026-11-09');
    expect(lunesDe('2026-11-15')).toBe('2026-11-09'); // domingo
    expect(lunesDe('2026-11-09')).toBe('2026-11-09');
    expect(sumarDias('2026-11-30', 1)).toBe('2026-12-01');
    expect(diferenciaDias('2026-11-09', '2026-12-06')).toBe(27);
  });
  it('escribe fechas en español', () => {
    expect(fechaLarga('2026-11-12')).toBe('jueves 12 de noviembre');
    expect(rotuloSemana('2026-11-09')).toBe('Semana del 9 al 15 de noviembre');
    expect(rotuloSemana('2026-11-30')).toBe('Semana del 30 de noviembre al 6 de diciembre');
  });
});

describe('formato', () => {
  it('usa coma decimal y punto de miles', () => {
    expect(num(1234.5, 1)).toBe('1.234,5');
    expect(leerNumero('7,5')).toBe(7.5);
    expect(leerNumero(' ')).toBeNull();
    expect(leerNumero('abc')).toBeNull();
    expect(reloj(95)).toBe('1:35');
  });
});

describe('comidas', () => {
  it('suma macros por cantidad y marca los totales parciales', () => {
    const m = macrosDe([item({ q: 2 }), item({ c: null, g: null, q: 1 })]);
    expect(m.p).toBe(30);
    expect(m.k).toBe(300);
    expect(m.c).toBe(10);
    expect(m.parcial).toBe(true);
  });

  it('cuenta comidas con proteína desde el umbral y sin extras', () => {
    const d = diaVacio('2026-11-12');
    d.comidas.desayuno = [item({ p: 10 })];
    d.comidas.almuerzo = [item({ p: 9.9 })];
    d.comidas.extras = [item({ p: 50 })];
    const t = totalesDia(d, 10);
    expect(t.comidasConProteina).toBe(1);
    expect(t.p).toBeCloseTo(69.9);
    expect(t.conComida).toBe(true);
  });

  it('informa el estado de las calorías', () => {
    expect(estadoKcal(1500, O)).toEqual({ tipo: 'faltan', cuanto: 900 });
    expect(estadoKcal(2400, O)).toEqual({ tipo: 'rango' });
    expect(estadoKcal(2600, O)).toEqual({ tipo: 'arriba', cuanto: 100 });
  });

  it('sugiere la comida que corresponde a la hora', () => {
    const d = diaVacio('2026-11-12');
    expect(proximaComida(d, new Date(2026, 10, 12, 7, 0))?.id).toBe('desayuno');
    expect(proximaComida(d, new Date(2026, 10, 12, 13, 0))?.id).toBe('almuerzo');
    d.comidas.almuerzo = [item()];
    expect(proximaComida(d, new Date(2026, 10, 12, 13, 0))?.id).toBe('desayuno');
    expect(proximaComida(d, new Date(2026, 10, 12, 20, 0))?.id).toBe('cena');
  });

  it('ordena recientes por frecuencia', () => {
    const a = diaVacio('2026-11-10');
    a.comidas.desayuno = [item({ n: 'Café', ref: 'cafe' }), item({ n: 'Tostada', ref: 'tostada' })];
    const b = diaVacio('2026-11-11');
    b.comidas.desayuno = [item({ n: 'Café', ref: 'cafe', q: 2 })];
    const r = recientes([a, b]);
    expect(r.map((x) => x.n)).toEqual(['Café', 'Tostada']);
    expect(r[0]?.q).toBe(2);
  });

  it('calcula proporciones que suman 100', () => {
    const p = proporciones({ p: 41, c: 80, g: 53 });
    expect(p).not.toBeNull();
    expect(p!.p + p!.c + p!.g).toBe(100);
    expect(proporciones({ p: 0, c: 0, g: 0 })).toBeNull();
  });
});

describe('perfil', () => {
  const campos = (nombre: string, inicio: string) => validarPerfil(nombre, inicio, '2026-11-16').map((e) => e.campo);

  it('acepta nombres reales (o ninguno) y rechaza números o textos largos', () => {
    for (const n of ['', 'Nahu', 'Nahuel Alejo', 'María José', "D'Angelo", 'Ana-Lía']) expect(campos(n, '2026-11-09')).toEqual([]);
    for (const n of ['21 313123 123', 'Nahu2', '!!', 'a'.repeat(31)]) expect(campos(n, '2026-11-09')).toEqual(['nombre']);
  });

  it('acepta el inicio de la rutina entre 2020 y dentro de un año', () => {
    expect(campos('Nahu', '2020-01-01')).toEqual([]);
    expect(campos('Nahu', '2027-11-16')).toEqual([]);
    for (const f of ['2019-12-31', '2027-11-17', '9999-12-01', '2026-02-30', '']) expect(campos('Nahu', f)).toEqual(['inicio']);
    expect(validarPerfil('Nahu', '9999-12-01', '2026-11-16')[0]?.mensaje).toBe('Elegí una fecha entre el 1/1/2020 y el 16/11/2027.');
  });
});

describe('objetivos', () => {
  it('acepta los del plan y rechaza rangos incoherentes', () => {
    expect(validarObjetivos(O)).toEqual([]);
    const mal = structuredClone(O);
    mal.proteina.obj = 200;
    mal.kcal = { min: 2500, max: 2300 };
    const errores = validarObjetivos(mal).map((e) => e.campo);
    expect(errores).toContain('proteina.rango');
    expect(errores).toContain('kcal');
  });
});

describe('saneo', () => {
  it('descarta alimentos inválidos y acota valores', () => {
    expect(sanearItem({ n: '', p: 1, k: 1 })).toBeNull();
    expect(sanearItem({ n: 'Algo', p: 'x', k: 1 })).toBeNull();
    const it = sanearItem({ n: 'Algo', p: 10, k: 100, q: 99, c: -1, src: 'raro' });
    expect(it).toMatchObject({ n: 'Algo', q: 1, c: null, src: 'manual' });
  });

  it('arma un día válido aunque los datos estén rotos', () => {
    const d = sanearDia('2026-11-12', { comidas: { cena: [{ n: 'Bife', p: 50, k: 400 }, 'basura'] }, agua: -5, energia: 9, acosto: '25:00', peso: '67,5' });
    expect(d.comidas.cena).toHaveLength(1);
    expect(d.comidas.desayuno).toEqual([]);
    expect(d.agua).toBe(0);
    expect(d.energia).toBeNull();
    expect(d.acosto).toBe('');
    expect(d.peso).toBeNull();
  });

  it('vuelve a los objetivos del plan si los guardados son incoherentes', () => {
    const p = sanearPerfil({ nombre: 'Nahu', inicioRutina: '2026-11-09', objetivos: { kcal: { min: 3000, max: 100 } } });
    expect(p.nombre).toBe('Nahu');
    expect(p.objetivos).toEqual(O);
  });

  it('sanea sesiones y conserva las series pendientes como null', () => {
    const s = sanearSesion('2026-11-09_torso-a', { dia: 'torso-a', fecha: '2026-11-09', inicio: 'x', ejercicios: { 'press-banca': [{ peso: 5, reps: 10 }, null, { reps: 'x' }] } });
    expect(s?.ejercicios['press-banca']).toEqual([{ peso: 5, reps: 10, t: '' }, null, null]);
  });

  it('rechaza archivos que no son exportaciones', () => {
    expect(() => sanearExportacion({ hola: 1 })).toThrow(ErrorImportacion);
    expect(() => sanearExportacion({ formato: 'libreta', version: 2 })).toThrow(ErrorImportacion);
    const e = sanearExportacion({ formato: 'libreta', version: 1, dias: [{ fecha: '2026-10-28', agua: 500 }, { fecha: 'mal' }], alimentos: [{ id: 'a', n: 'Panqueques', p: 4.6, k: 80 }] });
    expect(e.dias).toHaveLength(1);
    expect(e.alimentos[0]?.n).toBe('Panqueques');
    expect(e.perfil).toBeNull();
  });
});

describe('rutina', () => {
  it('dice qué toca cada día', () => {
    expect(queTocaHoy('2026-11-05', '2026-11-09', [])).toEqual({ tipo: 'antes', inicio: '2026-11-09' });
    const lunes = queTocaHoy('2026-11-09', '2026-11-09', []);
    expect(lunes.tipo === 'entreno' && lunes.dia.id).toBe('torso-a');
    expect(queTocaHoy('2026-11-11', '2026-11-09', [])).toMatchObject({ tipo: 'descanso', domingo: false });
    expect(queTocaHoy('2026-11-15', '2026-11-09', [])).toMatchObject({ tipo: 'descanso', domingo: true });
  });

  it('el sábado sugiere los días que faltaron en la semana', () => {
    const hechas = [sesion('2026-11-09', 'torso-a', { 'press-banca': [{ peso: 5, reps: 10, t: '' }] }), sesion('2026-11-10', 'pierna-a', { hack: [null] })];
    const r = queTocaHoy('2026-11-14', '2026-11-09', hechas);
    expect(r.tipo).toBe('comodin');
    if (r.tipo === 'comodin') expect(r.pendientes.map((d) => d.id)).toEqual(['pierna-a', 'torso-b', 'pierna-b']);
    expect([...diasHechosEnSemana(hechas, '2026-11-09')]).toEqual(['torso-a']);
  });

  it('calcula el total con barra solo cuando corresponde', () => {
    expect(totalConBarra(7.5, 'lado-barra')).toBe(35);
    expect(totalConBarra(10, 'lado')).toBeNull();
  });

  it('aplica la doble progresión', () => {
    const banca = diaPorId('torso-a')!.ex[0]!;
    const s = (reps: number) => ({ peso: 5, reps, t: '' });
    expect(sugerencia(banca, [s(10), s(10), s(10)])).toBe('subir');
    expect(sugerencia(banca, [s(10), s(10), s(9)])).toBe('mas-reps');
    expect(sugerencia(banca, [s(10), s(10)])).toBe('mas-reps');
  });

  it('toma la última vez y arma los valores iniciales', () => {
    const banca = diaPorId('torso-a')!.ex[0]!;
    const sesiones = [
      sesion('2026-11-09', 'torso-a', { 'press-banca': [{ peso: 5, reps: 10, t: '' }, { peso: 5, reps: 9, t: '' }, null] }),
      sesion('2026-11-16', 'torso-a', { 'press-banca': [null, null, null] }),
    ];
    const u = ultimaVez('press-banca', sesiones, '2026-11-16_torso-a');
    expect(u?.fecha).toBe('2026-11-09');
    expect(valoresIniciales(banca, u, undefined)).toEqual([
      { peso: 5, repsPrevias: 10 },
      { peso: 5, repsPrevias: 9 },
      { peso: 5, repsPrevias: null },
    ]);
    expect(valoresIniciales(banca, null, undefined)[0]).toEqual({ peso: 5, repsPrevias: null });
    expect(valoresIniciales(banca, null, { peso: 7.5, nota: '', actualizado: '' })[0]?.peso).toBe(7.5);
  });

  it('ubica la etapa de hábitos por semana del plan', () => {
    expect(etapaActual('2026-11-08', '2026-11-09')).toBeNull();
    expect(etapaActual('2026-11-22', '2026-11-09')?.num).toBe(1);
    expect(etapaActual('2026-11-23', '2026-11-09')?.num).toBe(2);
    expect(etapaActual('2026-12-07', '2026-11-09')?.num).toBe(3);
  });
});

describe('progreso', () => {
  it('promedia horas de dormir que cruzan la medianoche', () => {
    expect(promedioHora(['23:30', '00:30'])).toBe('00:00');
    expect(promedioHora(['08:00', '09:00'], 0)).toBe('08:30');
    expect(promedioHora([])).toBeNull();
  });

  it('elige la mejor serie por peso y después por repeticiones', () => {
    const s = [
      sesion('2026-11-09', 'torso-a', { 'press-banca': [{ peso: 5, reps: 10, t: '' }, { peso: 7.5, reps: 8, t: '' }, { peso: 7.5, reps: 9, t: '' }] }),
    ];
    expect(mejoresSeries('press-banca', s)).toEqual([{ fecha: '2026-11-09', peso: 7.5, reps: 9 }]);
    expect(textoSerie({ unidad: 'lado-barra' }, { peso: 7.5, reps: 9 })).toBe('7,5 kg por lado × 9 (total 35 kg)');
  });

  it('arma el resumen semanal', () => {
    const d1: Dia = diaVacio('2026-11-09');
    d1.comidas.desayuno = [item({ p: 30, k: 500 })];
    d1.comidas.almuerzo = [item({ p: 50, k: 900 })];
    d1.comidas.merienda = [item({ p: 10, k: 300 })];
    d1.comidas.cena = [item({ p: 40, k: 800 })];
    d1.pasos = 6000;
    d1.acosto = '23:00';
    d1.levanto = '08:00';
    d1.molestias = 'hombro derecho 2/10';
    const d2: Dia = { ...diaVacio('2026-11-10'), peso: 67.4 };
    const ses = [sesion('2026-11-09', 'torso-a', { 'press-banca': [{ peso: 5, reps: 10, t: '' }] })];
    const r = resumenSemana('2026-11-09', [d1, d2], ses, O, '2026-11-12');
    expect(r.entrenamientos).toMatchObject({ hechos: 1, total: 4, dias: ['Torso A'], faltaron: ['Pierna A'] });
    expect(r.diasCargados).toBe(1);
    expect(r.diasConProteina).toBe(1);
    expect(r.diasCuatroComidas).toBe(1);
    expect(r.pasosProm).toBe(6000);
    expect(r.ultimoPeso).toEqual({ fecha: '2026-11-10', valor: 67.4 });
    const texto = textoResumen(r, 'Me costó la merienda', O);
    expect(texto).toContain('Entrenamientos: 1 de 4 (Torso A)');
    expect(texto).toContain('Faltaron: Pierna A');
    expect(texto).toContain('Press de banca con barra: 5 kg por lado × 10 (total 30 kg)');
    expect(texto).toContain('QUÉ ME COSTÓ: Me costó la merienda');
    expect(texto).toContain('Sueño promedio: de 23:00 a 08:00');
  });

  it('una semana sin datos se resume sin frases a medias', () => {
    const r = resumenSemana('2026-11-09', [], [], O, '2026-11-12');
    const texto = textoResumen(r, '', O);
    expect(texto).toContain('Promedio por día cargado: sin datos');
    expect(texto).toContain('QUÉ ME COSTÓ: sin completar');
    expect(texto).not.toMatch(/sin datos de proteína/);
  });
});
