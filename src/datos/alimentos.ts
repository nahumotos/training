import type { AlimentoBiblioteca, CategoriaId } from '../dominio/tipos';

// Biblioteca de alimentos frecuentes. Valores aproximados por porción:
// p proteína, c hidratos, g grasas (gramos) y k kilocalorías.
// En bebidas alcohólicas las calorías incluyen el alcohol, que no es ningún macronutriente.

export const CATEGORIAS: { id: CategoriaId; nombre: string; ayuda?: string }[] = [
  { id: 'carnes', nombre: 'Carnes y huevos', ayuda: 'Un bife mediano pesa unos 200 g cocido: usá ×2.' },
  { id: 'lacteos', nombre: 'Lácteos' },
  { id: 'harinas', nombre: 'Pastas, pan y papas', ayuda: 'Un plato abundante de fideos o arroz es ×1,5.' },
  { id: 'frutas', nombre: 'Frutas' },
  { id: 'mate', nombre: 'Mate y café', ayuda: 'El mate amargo y el café solo casi no suman calorías. El azúcar sí: cargá las cucharaditas aparte. El edulcorante no suma.' },
  { id: 'afuera', nombre: 'Comida afuera' },
  { id: 'bebidas', nombre: 'Bebidas y agregados', ayuda: 'El aceite y la manteca de cocción se cargan aparte.' },
];

export const BIBLIOTECA: AlimentoBiblioteca[] = [
  { id: 'carne', cat: 'carnes', n: 'Carne vacuna (bife, nalga, cuadril)', por: '100 g cocida', p: 27, c: 0, g: 12, k: 220 },
  { id: 'asado', cat: 'carnes', n: 'Asado (tira o vacío)', por: '100 g cocido', p: 24, c: 0, g: 23, k: 300 },
  { id: 'mila-carne-horno', cat: 'carnes', n: 'Milanesa de carne al horno', por: '1 mediana', p: 24, c: 15, g: 14, k: 280 },
  { id: 'mila-carne-frita', cat: 'carnes', n: 'Milanesa de carne frita', por: '1 mediana', p: 24, c: 15, g: 24, k: 370 },
  { id: 'mila-pollo-horno', cat: 'carnes', n: 'Milanesa de pollo al horno', por: '1 mediana', p: 20, c: 14, g: 10, k: 230 },
  { id: 'mila-pollo-frita', cat: 'carnes', n: 'Milanesa de pollo frita', por: '1 mediana', p: 20, c: 14, g: 20, k: 320 },
  { id: 'pechuga', cat: 'carnes', n: 'Pechuga de pollo', por: '100 g cocida', p: 31, c: 0, g: 4, k: 165 },
  { id: 'pata-muslo', cat: 'carnes', n: 'Pata-muslo de pollo sin piel', por: '1 unidad', p: 26, c: 0, g: 12, k: 210 },
  { id: 'huevo', cat: 'carnes', n: 'Huevo duro o revuelto', por: '1 unidad', p: 6, c: 0.5, g: 5.5, k: 80 },
  { id: 'huevo-frito', cat: 'carnes', n: 'Huevo frito', por: '1 unidad', p: 6, c: 0.5, g: 9, k: 110 },
  { id: 'jamon', cat: 'carnes', n: 'Jamón cocido', por: '2 fetas (40 g)', p: 7, c: 0.5, g: 2, k: 50 },
  { id: 'leche', cat: 'lacteos', n: 'Leche entera', por: '1 taza (250 ml)', p: 8, c: 12, g: 8, k: 155 },
  { id: 'leche-desc', cat: 'lacteos', n: 'Leche descremada', por: '1 taza (250 ml)', p: 8, c: 12, g: 0.5, k: 90 },
  { id: 'cafe-leche', cat: 'lacteos', n: 'Café con leche, sin azúcar', por: '1 taza', p: 6, c: 10, g: 6.5, k: 125 },
  { id: 'yogur', cat: 'lacteos', n: 'Yogur entero', por: '1 pote o vaso (190 g)', p: 6, c: 24, g: 4.5, k: 160 },
  { id: 'queso', cat: 'lacteos', n: 'Queso cremoso o de máquina', por: '2 fetas (40 g)', p: 9, c: 0.5, g: 10, k: 130 },
  { id: 'queso-rallado', cat: 'lacteos', n: 'Queso rallado', por: '1 cda (10 g)', p: 3.5, c: 0.3, g: 2.8, k: 40 },
  { id: 'licuado', cat: 'lacteos', n: 'Licuado de banana con leche', por: '1 vaso grande (300 ml)', p: 10, c: 44, g: 8.5, k: 290 },
  { id: 'fideos', cat: 'harinas', n: 'Fideos', por: 'Plato normal (100 g secos)', p: 12, c: 72, g: 1.5, k: 355 },
  { id: 'arroz', cat: 'harinas', n: 'Arroz blanco', por: 'Plato normal (80 g secos)', p: 6, c: 63, g: 0.5, k: 285 },
  { id: 'papas-horno', cat: 'harinas', n: 'Papas al horno', por: '1 plato (250 g)', p: 5, c: 45, g: 7, k: 260 },
  { id: 'pure', cat: 'harinas', n: 'Puré de papas', por: '1 plato (250 g)', p: 5, c: 38, g: 9.5, k: 260 },
  { id: 'papas-fritas', cat: 'harinas', n: 'Papas fritas', por: 'Porción mediana (150 g)', p: 5, c: 55, g: 25, k: 470 },
  { id: 'tostada', cat: 'harinas', n: 'Tostada o rebanada de pan', por: '1 rebanada (25 g)', p: 2, c: 13, g: 1, k: 70 },
  { id: 'pan-frances', cat: 'harinas', n: 'Pan francés', por: '1 pan (60 g)', p: 5, c: 33, g: 1, k: 165 },
  { id: 'banana', cat: 'frutas', n: 'Banana', por: '1 mediana', p: 1.3, c: 27, g: 0.4, k: 105 },
  { id: 'manzana', cat: 'frutas', n: 'Manzana', por: '1 mediana', p: 0.4, c: 21, g: 0.3, k: 80 },
  { id: 'naranja', cat: 'frutas', n: 'Naranja', por: '1 mediana', p: 1.2, c: 15, g: 0.2, k: 65 },
  { id: 'mandarina', cat: 'frutas', n: 'Mandarina', por: '1 unidad', p: 0.5, c: 11, g: 0.3, k: 45 },
  { id: 'pera', cat: 'frutas', n: 'Pera', por: '1 mediana', p: 0.6, c: 26, g: 0.2, k: 100 },
  { id: 'cafe-solo', cat: 'mate', n: 'Café solo, sin azúcar', por: '1 taza', p: 0.3, c: 0, g: 0, k: 2 },
  { id: 'cortado', cat: 'mate', n: 'Café cortado, sin azúcar', por: '1 taza', p: 1, c: 1.5, g: 1, k: 20 },
  { id: 'galletitas-agua', cat: 'mate', n: 'Galletitas de agua', por: '3 unidades (20 g)', p: 2, c: 14, g: 2.5, k: 85 },
  { id: 'bizcochitos', cat: 'mate', n: 'Bizcochitos de grasa', por: '1 puñado (30 g)', p: 2, c: 18, g: 9, k: 160 },
  { id: 'medialuna', cat: 'mate', n: 'Medialuna', por: '1 unidad', p: 3, c: 22, g: 7.5, k: 170 },
  { id: 'dulce-leche', cat: 'mate', n: 'Dulce de leche', por: '1 cda (20 g)', p: 1.4, c: 11, g: 1.5, k: 65 },
  { id: 'azucar', cat: 'mate', n: 'Azúcar', por: '1 cdta (5 g)', p: 0, c: 5, g: 0, k: 20 },
  { id: 'hamburguesa', cat: 'afuera', n: 'Hamburguesa completa', por: '1 unidad', p: 30, c: 40, g: 35, k: 600 },
  { id: 'sanguche-mila', cat: 'afuera', n: 'Sándwich de milanesa completo', por: '1 unidad', p: 35, c: 70, g: 36, k: 750 },
  { id: 'pizza', cat: 'afuera', n: 'Pizza de muzzarella', por: '1 porción', p: 11, c: 32, g: 12, k: 280 },
  { id: 'empanada', cat: 'afuera', n: 'Empanada de carne al horno', por: '1 unidad', p: 11, c: 28, g: 15, k: 290 },
  { id: 'choripan', cat: 'afuera', n: 'Choripán', por: '1 unidad', p: 20, c: 40, g: 31, k: 520 },
  { id: 'tostado', cat: 'afuera', n: 'Tostado de jamón y queso', por: '1 unidad', p: 18, c: 30, g: 17, k: 350 },
  { id: 'gaseosa', cat: 'bebidas', n: 'Gaseosa común', por: '1 vaso (350 ml)', p: 0, c: 37, g: 0, k: 150 },
  { id: 'cerveza', cat: 'bebidas', n: 'Cerveza', por: '1 lata (473 ml)', p: 2, c: 16, g: 0, k: 200 },
  { id: 'fernet', cat: 'bebidas', n: 'Fernet con coca', por: '1 vaso', p: 0, c: 25, g: 0, k: 230 },
  { id: 'vino', cat: 'bebidas', n: 'Vino', por: '1 copa (150 ml)', p: 0, c: 4, g: 0, k: 125 },
  { id: 'aceite', cat: 'bebidas', n: 'Aceite', por: '1 cda (13 g)', p: 0, c: 0, g: 13, k: 115 },
  { id: 'manteca', cat: 'bebidas', n: 'Manteca', por: '1 cda (15 g)', p: 0, c: 0, g: 12, k: 110 },
];

export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Busca por nombre y porción, sin distinguir acentos ni mayúsculas. Todas las palabras tienen que aparecer. */
export function coincide(texto: string, consulta: string): boolean {
  const t = normalizar(texto);
  return normalizar(consulta)
    .split(/\s+/)
    .filter(Boolean)
    .every((palabra) => t.includes(palabra));
}
