// Pone el tema claro u oscuro antes de pintar la página, para que no parpadee.
// Misma regla que src/estado/tema.ts: lo elegido a mano en este dispositivo o, si no, el sistema.
(function () {
  var preferencia = null;
  try {
    preferencia = localStorage.getItem('libreta-tema');
  } catch (e) {
    // Sin almacenamiento: se sigue al sistema.
  }
  var oscuro = preferencia === 'oscuro' || (preferencia !== 'claro' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.tema = oscuro ? 'oscuro' : 'claro';
  var metas = document.querySelectorAll('meta[name="theme-color"]');
  for (var i = 0; i < metas.length; i++) metas[i].setAttribute('content', oscuro ? '#000000' : '#f2f2f7');
})();
