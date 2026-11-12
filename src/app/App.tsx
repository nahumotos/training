import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ProveedorAvisos } from '../estado/Avisos';
import { ProveedorDatos, ProveedorSesion, useDatos, useSesion } from '../estado/Proveedor';
import { ProveedorTemporizador } from '../estado/Temporizador';
import { Comidas } from '../pantallas/comidas/Comidas';
import { Hoy } from '../pantallas/Hoy';
import { Ingreso } from '../pantallas/Ingreso';
import { NoEncontrada } from '../pantallas/NoEncontrada';
import { DiaRutinaPantalla } from '../pantallas/rutina/DiaRutina';
import { Rutina } from '../pantallas/rutina/Rutina';
import { SinAcceso } from '../pantallas/SinAcceso';
import { crearServicios, type ResultadoServicios } from '../servicios';
import { AvisoActualizacion } from './AvisoActualizacion';
import { Cargando, FaltaConfiguracion } from './Estados';
import { Marco } from './Marco';

// Las pantallas menos usadas se descargan recién cuando se abren.
const Progreso = lazy(() => import('../pantallas/progreso/Progreso'));
const Plan = lazy(() => import('../pantallas/Plan'));
const Ajustes = lazy(() => import('../pantallas/Ajustes'));

export function App() {
  const [resultado, setResultado] = useState<ResultadoServicios | null>(null);

  useEffect(() => {
    let activo = true;
    crearServicios()
      .then((r) => activo && setResultado(r))
      .catch((e: unknown) => {
        console.error(e);
        if (activo) setResultado({ ok: false, faltan: [] });
      });
    return () => {
      activo = false;
    };
  }, []);

  if (!resultado) return <Cargando />;
  if (!resultado.ok) return <FaltaConfiguracion faltan={resultado.faltan} />;

  return (
    <ProveedorSesion servicios={resultado.servicios}>
      <ProveedorAvisos>
        <AvisoActualizacion />
        <BrowserRouter>
          <RutasRaiz />
        </BrowserRouter>
      </ProveedorAvisos>
    </ProveedorSesion>
  );
}

function RutasRaiz() {
  const { usuario } = useSesion();
  const ubicacion = useLocation();
  if (usuario === undefined) return <Cargando />;

  return (
    <Routes>
      <Route
        path="/ingresar"
        element={usuario ? <Navigate to={(ubicacion.state as { desde?: string } | null)?.desde ?? '/'} replace /> : <Ingreso />}
      />
      <Route
        path="*"
        element={
          usuario ? (
            <ProveedorDatos usuario={usuario}>
              <ProveedorTemporizador>
                <AppPrivada />
              </ProveedorTemporizador>
            </ProveedorDatos>
          ) : (
            <Navigate to="/ingresar" replace state={{ desde: ubicacion.pathname + ubicacion.search }} />
          )
        }
      />
    </Routes>
  );
}

function AppPrivada() {
  const { sinAcceso } = useDatos();
  if (sinAcceso) return <SinAcceso />;
  return (
    <Marco>
      <Suspense fallback={<Cargando enLinea />}>
        <Routes>
          <Route path="/" element={<Hoy />} />
          <Route path="/rutina" element={<Rutina />} />
          <Route path="/rutina/:diaId" element={<DiaRutinaPantalla />} />
          <Route path="/comidas" element={<Comidas />} />
          <Route path="/comidas/:fecha" element={<Comidas />} />
          <Route path="/progreso" element={<Progreso />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/ajustes" element={<Ajustes />} />
          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </Suspense>
    </Marco>
  );
}
