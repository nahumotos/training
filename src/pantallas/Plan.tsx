import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Icono } from '../componentes/Icono';
import { fechaLarga, sumarDias } from '../dominio/fechas';
import { num } from '../dominio/formato';
import { ETAPAS } from '../dominio/rutina';
import { useDatos } from '../estado/Proveedor';
import { useTitulo } from '../estado/hooks';
import estilos from './Plan.module.css';

const INDICE = [
  ['estrategia', 'Estrategia'],
  ['semana', 'Semana tipo'],
  ['reglas', 'Reglas de entrenamiento'],
  ['hombro', 'Hombro'],
  ['nutricion', 'Nutrición'],
  ['movimiento', 'Movimiento'],
  ['habitos', 'Hábitos'],
  ['suplementos', 'Suplementos'],
  ['seguimiento', 'Seguimiento'],
] as const;

export default function Plan() {
  useTitulo('Plan Fase 1');
  const { perfil } = useDatos();
  const { hash } = useLocation();
  const o = perfil.objetivos;
  const inicio = perfil.inicioRutina;

  // Los enlaces del tipo /plan#reglas llevan a la sección.
  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <article className="pila pantalla">
      <header className="cabecera">
        <p className="ceja">Plan Fase 1</p>
        <h1>Recomposición: más músculo, menos panza</h1>
        <p className="sub">
          Desde el {fechaLarga(inicio)}, durante 8 a 12 semanas con la misma rutina. Primera revisión mensual: {fechaLarga(sumarDias(inicio, 27))}.
        </p>
      </header>

      <nav aria-label="Secciones del plan" className={estilos.indice}>
        {INDICE.map(([id, texto]) => (
          <a key={id} href={`#${id}`}>
            {texto}
          </a>
        ))}
      </nav>

      <section id="estrategia" className="tarjeta" aria-labelledby="t-estrategia">
        <h2 id="t-estrategia" className="titulo-seccion con-icono">
          <Icono nombre="disco" tam={20} />
          Estrategia
        </h2>
        <p>
          Comer en <b>mantenimiento</b> con proteína alta, entrenar pesas 4 días por semana con sobrecarga progresiva y caminar todos los días.
        </p>
        <ul className="lista-reglas">
          <li>Sin déficit: con poca masa muscular, quedarías más flaco pero no más marcado.</li>
          <li>Sin doble turno: a este nivel, lo que limita los resultados es la recuperación, no las horas de gimnasio.</li>
          <li>Prioridad visual: hombro lateral, espalda y pecho. Ensanchan el torso y hacen que la cintura se vea más chica.</li>
          <li>Expectativa: cambios visibles en 12 semanas; un físico armado lleva entre 1 y 2 años de constancia.</li>
        </ul>
      </section>

      <section id="semana" className="tarjeta" aria-labelledby="t-semana">
        <h2 id="t-semana" className="titulo-seccion con-icono">
          <Icono nombre="hoy" tam={20} />
          Semana tipo
        </h2>
        <div className="desborde">
          <table className="tabla">
            <thead>
              <tr>
                <th scope="col">Día</th>
                <th scope="col">Entrenamiento (~10 h)</th>
                <th scope="col">Caminata</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Lunes', 'Torso A', '20–30 min'],
                ['Martes', 'Pierna A', '20–30 min'],
                ['Miércoles', 'Descanso', '30–40 min'],
                ['Jueves', 'Torso B', '20–30 min'],
                ['Viernes', 'Pierna B', '20–30 min'],
                ['Sábado', 'Comodín (8–13 h), solo si faltaste', '30–40 min'],
                ['Domingo', 'Descanso (el gimnasio cierra)', '30–40 min'],
              ].map(([d, e, c]) => (
                <tr key={d}>
                  <th scope="row">{d}</th>
                  <td>{e}</td>
                  <td>{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="tenue">Comidas: desayuno 8:45 · almuerzo 12:30 · merienda 15:30 · cena 21:00.</p>
      </section>

      <section id="reglas" className="tarjeta" aria-labelledby="t-reglas">
        <h2 id="t-reglas" className="titulo-seccion con-icono">
          <Icono nombre="rutina" tam={20} />
          Reglas de entrenamiento
        </h2>
        <h3 className="rotulo">Calentamiento (8–10 min)</h3>
        <ul className="lista-reglas">
          <li>5 minutos de bici o cinta suave, y la movilidad del día (está en cada día de la rutina).</li>
          <li>
            <b>Series de aproximación:</b> 2 series livianas del primer ejercicio que no cansan y no se anotan. Ej.: con 35 kg de trabajo en banca, barra sola × 10
            y 27,5 kg × 5. En el segundo ejercicio grande, una serie liviana de 6.
          </li>
        </ul>
        <h3 className="rotulo">RIR y técnica</h3>
        <p>
          RIR 2 es terminar la serie sabiendo que podías hacer 2 más con buena técnica. En los ejercicios grandes quedate en RIR 2; en los de aislamiento podés
          llegar a RIR 1, y a 0 en la última serie. Si la técnica se rompe, la serie terminó.
        </p>
        <h3 className="rotulo">Progresión (doble progresión)</h3>
        <ol className={estilos.pasos}>
          <li>Arrancá con un peso con el que llegues al mínimo del rango con el RIR indicado.</li>
          <li>En cada sesión, intentá sumar 1 repetición en alguna serie.</li>
          <li>Cuando completes el máximo del rango en todas las series, subí el peso: 1,25–2,5 kg por lado en barra, 1–2 kg en mancuernas, una placa en máquina.</li>
          <li>Con el peso nuevo volvés al mínimo del rango.</li>
          <li>No se suman series hasta la revisión mensual.</li>
        </ol>
        <h3 className="rotulo">Cuándo bajar la carga</h3>
        <p>Si aparecen dos de estas señales, hacé una semana con 2 series por ejercicio en lugar de 3, con el mismo peso:</p>
        <ul className="lista-reglas">
          <li>El rendimiento baja dos sesiones seguidas en el mismo ejercicio.</li>
          <li>Aparece dolor articular que se repite.</li>
          <li>Dormís mal o andás sin energía varios días seguidos.</li>
          <li>El dolor muscular dura más de 3 días.</li>
        </ul>
        <h3 className="rotulo">Si faltás</h3>
        <ul className="lista-reglas">
          <li>Recuperás la sesión el sábado, de 8 a 13 h.</li>
          <li>Si no llegás, seguís la semana siguiente con la sesión que tocaba, en orden. Nunca dos sesiones el mismo día.</li>
          <li>Después de más de 2 semanas sin entrenar, bajá un 10 % los pesos y volvé a subir.</li>
        </ul>
        <p className="tenue">La rutina no cambia por aburrimiento: se ajusta solo por estancamiento, molestias, mala recuperación o problemas para cumplirla.</p>
      </section>

      <section id="hombro" className="tarjeta" aria-labelledby="t-hombro">
        <h2 id="t-hombro" className="titulo-seccion con-icono">
          <Icono nombre="persona" tam={20} />
          Hombro
        </h2>
        <p>
          La elevación lateral con brazo doblado salió de la rutina. La versión nueva: peso liviano, brazo casi estirado, subir unos 30° por delante del cuerpo
          hasta la altura del hombro, pulgares neutros, 1 s para subir y 2–3 s para bajar.
        </p>
        <div className="desborde">
          <table className="tabla">
            <thead>
              <tr>
                <th scope="col">Si sentís…</th>
                <th scope="col">Hacé esto</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nada</td>
                <td>Progresá normal</td>
              </tr>
              <tr>
                <td>Molestia leve que no crece y se va al terminar</td>
                <td>Bajá el peso y subí solo hasta donde no moleste</td>
              </tr>
              <tr>
                <td>La misma molestia con esta versión o con el press de hombro</td>
                <td>Sacá los dos ejercicios y consultá con un kinesiólogo o traumatólogo</td>
              </tr>
              <tr>
                <td>Dolor fuera del gimnasio, de noche o en la vida diaria</td>
                <td>Consultá antes de seguir entrenando hombros</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="tenue">Esto no es un diagnóstico. Una molestia que se siente «en el hueso» la tiene que evaluar un profesional en persona.</p>
      </section>

      <section id="nutricion" className="tarjeta" aria-labelledby="t-nutricion">
        <h2 id="t-nutricion" className="titulo-seccion con-icono">
          <Icono nombre="comidas" tam={20} />
          Nutrición
        </h2>
        <p>
          4 comidas por día, con proteína en cada una, todos los días, entrenes o no. Lo más importante es llegar a la proteína; las calorías son una estimación
          con un margen de unos 200–300 kcal.
        </p>
        <div className="desborde">
          <table className="tabla">
            <thead>
              <tr>
                <th scope="col">Objetivo diario</th>
                <th scope="col">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Calorías</td>
                <td className="num">
                  {num(o.kcal.min)}–{num(o.kcal.max)} kcal
                </td>
              </tr>
              <tr>
                <td>Proteína</td>
                <td className="num">
                  {o.proteina.obj} g (rango {o.proteina.min}–{o.proteina.max})
                </td>
              </tr>
              <tr>
                <td>Hidratos</td>
                <td className="num">
                  {o.hidratos.min}–{o.hidratos.max} g
                </td>
              </tr>
              <tr>
                <td>Grasas</td>
                <td className="num">
                  {o.grasas.min}–{o.grasas.max} g
                </td>
              </tr>
              <tr>
                <td>Agua</td>
                <td className="num">{num(o.agua / 1000, 2)} L, sin contar el mate</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="lista-reglas">
          <li>Antes de entrenar: el desayuno, 1 a 1,5 h antes; una banana si llegás con hambre.</li>
          <li>Después: el almuerzo dentro de las 2 horas siguientes. No hace falta batido.</li>
          <li>2 o 3 frutas por día. Las verduras no son obligatorias por ahora.</li>
          <li>Fuera de casa: un plato con buena porción de proteína, sin compensar después.</li>
          <li>Mate amargo y edulcorante no se cargan; el azúcar y el aceite de cocción, sí.</li>
        </ul>
        <h3 className="rotulo">Ajustes cada 2 semanas</h3>
        <div className="desborde">
          <table className="tabla">
            <thead>
              <tr>
                <th scope="col">Si…</th>
                <th scope="col">Entonces…</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>La cintura baja y los pesos suben</td>
                <td>Seguí igual</td>
              </tr>
              <tr>
                <td>La cintura sube más de 1 cm y los pesos suben</td>
                <td>Bajá ~200 kcal (media porción de hidratos en el almuerzo)</td>
              </tr>
              <tr>
                <td>La cintura no cambia y los pesos se estancan</td>
                <td>Revisá sueño y proteína; si están bien, sumá ~200 kcal</td>
              </tr>
              <tr>
                <td>Mucha hambre o poca energía</td>
                <td>Sumá una colación de yogur y fruta</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="tenue">Los objetivos se cambian en Ajustes.</p>
      </section>

      <section id="movimiento" className="tarjeta" aria-labelledby="t-movimiento">
        <h2 id="t-movimiento" className="titulo-seccion con-icono">
          <Icono nombre="pasos" tam={20} />
          Movimiento
        </h2>
        <ul className="lista-reglas">
          <li>Semana 1: medí el promedio de pasos (app Salud) y caminá 20 minutos por día.</li>
          <li>Semanas 2–4: sumá 1.000 pasos diarios por semana.</li>
          <li>Desde la semana 5: sostené 7.000–8.000 pasos por día.</li>
          <li>Pausas activas: cada 45–60 minutos frente a la computadora, 2–3 minutos de pie.</li>
          <li>Cardio desde la semana 5: 1 o 2 sesiones de 15–20 minutos a ritmo moderado, nunca antes de un día de pierna.</li>
          <li>Fútbol: después de que un kinesiólogo evalúe el tobillo. Si volvés, retomá el equilibrio en un pie.</li>
        </ul>
      </section>

      <section id="habitos" className="tarjeta" aria-labelledby="t-habitos">
        <h2 id="t-habitos" className="titulo-seccion con-icono">
          <Icono nombre="series" tam={20} />
          Hábitos por etapas
        </h2>
        <p>Pasás a la etapa siguiente cuando cumplís la anterior 5 de 7 días. Para el sueño, el ancla es la hora de levantarte.</p>
        <div className="desborde">
          <table className="tabla">
            <thead>
              <tr>
                <th scope="col">Etapa</th>
                <th scope="col">Semanas</th>
                <th scope="col">Hábitos</th>
              </tr>
            </thead>
            <tbody>
              {ETAPAS.map((e) => (
                <tr key={e.num}>
                  <th scope="row">{e.num}</th>
                  <td>{e.semanas}</td>
                  <td>{e.habitos.join(' · ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="suplementos" className="tarjeta" aria-labelledby="t-suplementos">
        <h2 id="t-suplementos" className="titulo-seccion con-icono">
          <Icono nombre="gota" tam={20} />
          Suplementos
        </h2>
        <p>Ninguno es necesario para progresar.</p>
        <ul className="lista-reglas">
          <li>Creatina monohidrato: opcional, 3–5 g por día, todos los días. Puede sumar 1–2 kg de agua dentro del músculo.</li>
          <li>Proteína en polvo: solo como recurso un día que no llegues con la comida.</li>
          <li>Cafeína, pre-entreno, quemadores, BCAA y glutamina: no hacen falta.</li>
        </ul>
      </section>

      <section id="seguimiento" className="tarjeta" aria-labelledby="t-seguimiento">
        <h2 id="t-seguimiento" className="titulo-seccion con-icono">
          <Icono nombre="progreso" tam={20} />
          Seguimiento
        </h2>
        <ul className="lista-reglas">
          <li>
            <b>Diario (1–2 min):</b> series en Rutina; comidas, agua, pasos, sueño, energía y molestias en Comidas.
          </li>
          <li>
            <b>Semanal (domingo):</b> en Progreso, completá qué te costó y copiá el resumen para la revisión.
          </li>
          <li>
            <b>Mensual:</b> fotos de frente, perfil y espalda (mismo lugar y luz, a la mañana, en ayunas, con temporizador), cintura a la altura del ombligo y peso
            si hay balanza.
          </li>
        </ul>
      </section>
    </article>
  );
}
