import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/barlow/latin-400.css';
import '@fontsource/barlow/latin-500.css';
import '@fontsource/barlow/latin-600.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import './estilos/tokens.css';
import './estilos/base.css';
import { App } from './app/App';

const raiz = document.getElementById('raiz');
if (!raiz) throw new Error('Falta el elemento #raiz en index.html');

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
