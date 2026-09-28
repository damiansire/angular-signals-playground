import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Capítulo 0 · Cómo la pantalla sabe qué cambió. La pantalla de la nave se enciende en el centro;
 * un pip ámbar en su esquina muestra el valor real, que cambia, y la pantalla se queda con el viejo,
 * titilando. Detrás aparece el árbol que Zone.js revisaba entero, se enciende de arriba hacia abajo
 * y se apaga con un iris que se cierra sobre la pantalla. Arriba se escribe la pregunta del viaje.
 *
 * Es la primera cinemática que ve el jugador, así que presenta el idioma de todas: el héroe entra
 * con resorte, los trazos se dibujan (stroke-dashoffset), la luz se apaga con un iris (clip-path) y
 * el que avisa lo hace con una onda. El cometa y el hilo punteado quedan para el capítulo 1: ahí
 * significan "avisa solo a quien lo leyó", y usarlos acá para Zone.js mezclaría los dos idiomas.
 */
@Component({
  selector: 'app-escena-00',
  template: `
    <div class="k-mundo cine-e0" aria-hidden="true">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <g class="cine-e0__lejos">
          <line x1="1370" y1="230" x2="1480" y2="180" />
          <line x1="1480" y1="180" x2="1520" y2="290" />
          <circle cx="1370" cy="230" r="11" />
          <circle cx="1480" cy="180" r="14" />
          <circle cx="1520" cy="290" r="9" />
          <line x1="90" y1="820" x2="220" y2="770" />
          <circle cx="90" cy="820" r="12" />
          <circle cx="220" cy="770" r="9" />
        </g>
        <!-- La pregunta del viaje: cada palabra se dibuja a mano y después se llena. -->
        <text class="cine-e0__pregunta" x="800" y="112" text-anchor="middle">
          <tspan style="--i: 0">¿Quién</tspan>
          <tspan style="--i: 1">le</tspan>
          <tspan style="--i: 2">avisó</tspan>
          <tspan style="--i: 3">a</tspan>
          <tspan style="--i: 4">la</tspan>
          <tspan style="--i: 5">pantalla?</tspan>
        </text>
        <path
          class="k-trazo cine-e0__subrayado"
          pathLength="1"
          d="M 600 150 Q 700 140 800 146 T 1000 144"
        />
      </svg>

      <!-- La luz de Zone.js: un brillo por nodo, por fila. El iris la apaga hacia la pantalla. -->
      <div class="cine-e0__luz">
        <span style="--fila: 0"></span><span style="--fila: 1"></span
        ><span style="--fila: 2"></span>
      </div>

      <!-- El árbol de componentes que Zone.js revisaba entero, detrás de la pantalla. -->
      <div class="cine-e0__arbol">
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <path class="k-trazo cine-e0__rama" pathLength="1" d="M 800 270 L 560 414 L 432 558" />
          <path class="k-trazo cine-e0__rama" pathLength="1" d="M 800 270 L 560 414 L 688 558" />
          <path class="k-trazo cine-e0__rama" pathLength="1" d="M 800 270 L 1040 414 L 912 558" />
          <path class="k-trazo cine-e0__rama" pathLength="1" d="M 800 270 L 1040 414 L 1168 558" />
        </svg>
        <div
          class="k-actor cine-e0__nodo"
          style="--x: 50; --y: 30; --w: 3.4; --fila: 0; --apaga: 320ms"
        >
          <div class="k-cuerpo"></div>
        </div>
        <div
          class="k-actor cine-e0__nodo"
          style="--x: 35; --y: 46; --w: 3; --fila: 1; --apaga: 200ms"
        >
          <div class="k-cuerpo"></div>
        </div>
        <div
          class="k-actor cine-e0__nodo"
          style="--x: 65; --y: 46; --w: 3; --fila: 1; --apaga: 200ms"
        >
          <div class="k-cuerpo"></div>
        </div>
        <div
          class="k-actor cine-e0__nodo"
          style="--x: 27; --y: 62; --w: 2.8; --fila: 2; --apaga: 40ms"
        >
          <div class="k-cuerpo"></div>
        </div>
        <div
          class="k-actor cine-e0__nodo"
          style="--x: 43; --y: 62; --w: 2.8; --fila: 2; --apaga: 270ms"
        >
          <div class="k-cuerpo"></div>
        </div>
        <div
          class="k-actor cine-e0__nodo"
          style="--x: 57; --y: 62; --w: 2.8; --fila: 2; --apaga: 270ms"
        >
          <div class="k-cuerpo"></div>
        </div>
        <div
          class="k-actor cine-e0__nodo"
          style="--x: 73; --y: 62; --w: 2.8; --fila: 2; --apaga: 40ms"
        >
          <div class="k-cuerpo"></div>
        </div>
      </div>

      <div class="k-actor k-nave" style="--x: 24; --y: 38; --w: 6; --i: 0">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div class="k-actor k-nave k-nave--cap" style="--x: 18; --y: 50; --w: 7.4; --i: 1">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave-cap" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div class="k-actor k-nave" style="--x: 12; --y: 62; --w: 6; --i: 2">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>

      <!-- El héroe: la pantalla de la nave, con el pip del valor real en la esquina. -->
      <div class="k-actor cine-e0__pantalla" style="--x: 50; --y: 46; --w: 16">
        <div class="k-cuerpo">
          <span class="cine-e0__brillo"></span>
          <span class="cine-e0__rotulo">vel</span>
          <span class="cine-e0__num">12</span>
          <svg class="cine-e0__bisel" viewBox="0 0 160 100">
            <rect x="2.5" y="2.5" width="155" height="95" rx="12.5" pathLength="1" />
          </svg>
          <span class="cine-e0__pip">
            <span class="cine-e0__pip-cara">
              <span class="cine-e0__pip-v cine-e0__pip-v--antes">12</span>
              <span class="cine-e0__pip-v cine-e0__pip-v--despues">30</span>
            </span>
          </span>
        </div>
      </div>
      <div
        class="k-actor k-onda cine-e0__onda"
        style="--x: 57.4; --y: 37.7; --w: 9; --acento: #eb9b3c"
      >
        <span style="--i: 0"></span><span style="--i: 1"></span><span style="--i: 2"></span>
      </div>

      <div class="k-actor k-mascota" style="--x: 84; --y: 64; --w: 10">
        <div class="k-cuerpo">
          <img src="angular-mascot-idea.svg" alt="" width="240" height="300" />
        </div>
      </div>
    </div>
  `,
  styles: `
    .cine-e0__lejos line {
      stroke: #cdc3ad;
      stroke-width: 3;
      stroke-dasharray: 2 10;
      stroke-linecap: round;
    }
    .cine-e0__lejos circle {
      fill: #efe7d4;
      stroke: #cdc3ad;
      stroke-width: 3;
    }

    /* ---- La pantalla: se enciende como un tubo, de una raya a todo el alto ---- */
    .cine-e0__pantalla {
      aspect-ratio: 1.6 / 1;
    }
    .cine-e0__pantalla > .k-cuerpo {
      position: relative;
      display: grid;
      place-items: center;
      height: 100%;
      aspect-ratio: 1.6 / 1;
      border-radius: 9% / 14.4%;
      background:
        repeating-linear-gradient(0deg, rgba(255, 244, 214, 0.035) 0 2px, transparent 2px 5px),
        radial-gradient(120% 90% at 50% 30%, #3b352b 0%, #27231c 70%, #1f1b15 100%);
      box-shadow: 0 26px 34px -24px rgba(60, 45, 20, 0.6);
      opacity: 0;
      transform: scale(0.92, 0.035);
      transition:
        opacity 160ms linear,
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out);
    }
    .cine.b-titulo-rincon .cine-e0__pantalla > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    .cine-e0__brillo {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: radial-gradient(
        46% 42% at 50% 56%,
        rgba(246, 226, 176, 0.26) 0%,
        rgba(246, 226, 176, 0) 100%
      );
      transition: opacity 600ms ease-out 900ms;
    }
    .cine-e0__rotulo {
      position: absolute;
      left: 9%;
      top: 11%;
      font:
        600 clamp(6px, 0.78cqw, 12px) / 1 ui-monospace,
        Menlo,
        Consolas,
        monospace;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #9a9081;
    }
    .cine-e0__num {
      grid-area: 1 / 1;
      font:
        700 clamp(16px, 4.6cqw, 70px) / 1 ui-monospace,
        Menlo,
        Consolas,
        monospace;
      color: #f3e6c4;
      opacity: 0;
      transition: opacity 320ms ease-out 380ms;
    }
    .cine.b-titulo-rincon .cine-e0__num {
      opacity: 1;
    }
    .cine-e0__pantalla .cine-e0__bisel {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .cine-e0__bisel rect {
      fill: none;
      stroke: #9a9081;
      stroke-width: 5;
      stroke-dasharray: 1 0;
      stroke-dashoffset: 0;
    }

    /* ---- panel-viejo: el valor real cambia en el pip; la pantalla se queda con el viejo ---- */
    .cine-e0__pip {
      position: absolute;
      right: -8%;
      top: -15%;
      width: 23%;
      aspect-ratio: 1 / 1;
      opacity: 0;
      transform: scale(0.2);
      transition:
        opacity 160ms ease-out,
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out);
    }
    .cine.b-panel-viejo .cine-e0__pip {
      opacity: 1;
      transform: none;
    }
    .cine-e0__pip-cara {
      display: grid;
      place-items: center;
      width: 100%;
      height: 100%;
      overflow: hidden;
      border-radius: 50%;
      border: 2px solid #3a342a;
      background: radial-gradient(circle at 38% 30%, #ffe0a8 0%, #f2ab41 55%, #d98a24 100%);
      box-shadow: 0 6px 12px -6px rgba(90, 60, 20, 0.6);
    }
    .cine.b-panel-viejo .cine-e0__pip-cara {
      animation: cine-e0-late 640ms cubic-bezier(0.3, 1.4, 0.5, 1) 480ms;
    }
    .cine.b-mascota .cine-e0__pip-cara {
      animation:
        cine-e0-late 640ms cubic-bezier(0.3, 1.4, 0.5, 1) 480ms,
        cine-e0-avisa 700ms cubic-bezier(0.3, 1.4, 0.5, 1) 640ms;
    }
    .cine-e0__pip-v {
      grid-area: 1 / 1;
      font:
        700 clamp(7px, 1.25cqw, 19px) / 1 ui-monospace,
        Menlo,
        Consolas,
        monospace;
      color: #201d16;
      transition:
        opacity 220ms ease-out 480ms,
        transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out) 480ms;
    }
    .cine-e0__pip-v--despues {
      opacity: 0;
      transform: translateY(60%);
    }
    .cine.b-panel-viejo .cine-e0__pip-v--antes {
      opacity: 0;
      transform: translateY(-60%);
    }
    .cine.b-panel-viejo .cine-e0__pip-v--despues {
      opacity: 1;
      transform: none;
    }
    /* La pantalla no se entera: el número pierde tinta y el bisel se corta y titila. Nunca se
       repinta el número; lo único que cambia es cuánto se lo cree uno. */
    .cine.b-panel-viejo .cine-e0__num {
      opacity: 0.5;
      transition: opacity 500ms ease-out 900ms;
      animation: cine-e0-titila-num 2.6s linear 1.6s infinite;
    }
    .cine.b-panel-viejo .cine-e0__brillo {
      opacity: 0.35;
    }
    .cine.b-panel-viejo .cine-e0__bisel rect {
      stroke-dasharray: 0.08 0.012 0.02 0.01 0.13 0.008 0.035 0.014;
      transition: stroke-dasharray 700ms ease-in 900ms;
      animation: cine-e0-titila-bisel 2.6s linear 1.6s infinite;
    }

    /* ---- arbol-entero: el árbol se dibuja desde la raíz y se enciende entero ---- */
    .cine-e0__arbol,
    .cine-e0__luz {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .cine-e0__arbol > svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .cine-e0__arbol {
      opacity: 0;
      transition: opacity 200ms ease-out;
    }
    .cine.b-arbol-entero .cine-e0__arbol {
      opacity: 1;
    }
    .cine-e0__rama {
      stroke: #6b6252;
      stroke-width: 4;
      stroke-linecap: round;
      stroke-linejoin: round;
      --trazo-ms: 640ms;
    }
    .cine.b-arbol-entero .cine-e0__rama {
      stroke-dashoffset: 0;
    }
    .cine-e0__nodo {
      aspect-ratio: 1 / 1;
    }
    .cine-e0__nodo > .k-cuerpo {
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      border: 3px solid #6b6252;
      background-color: #fbf8ef;
      opacity: 0;
      transform: scale(0.3);
      transition:
        opacity 200ms ease-out calc(var(--fila) * 220ms),
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out)
          calc(var(--fila) * 220ms),
        background-color 200ms ease-out calc(1100ms + var(--fila) * 60ms),
        border-color 200ms ease-out calc(1100ms + var(--fila) * 60ms);
    }
    .cine.b-arbol-entero .cine-e0__nodo > .k-cuerpo {
      opacity: 1;
      transform: none;
      background-color: #ffe7b0;
      border-color: #3a342a;
      animation: cine-e0-revisa 900ms cubic-bezier(0.3, 1.4, 0.5, 1)
        calc(1100ms + var(--fila) * 60ms) 2;
    }
    /* La luz: tres capas (una por fila) con un brillo radial por nodo, que se pinta una vez. */
    .cine-e0__luz {
      clip-path: circle(38% at 50% 46%);
    }
    .cine-e0__luz > span {
      position: absolute;
      inset: 0;
      opacity: 0;
      transition: opacity 200ms ease-out calc(1100ms + var(--fila) * 60ms);
    }
    .cine-e0__luz > span:nth-child(1) {
      background: radial-gradient(5.6% 10% at 50% 30%, #f6cf7c 0%, rgba(246, 207, 124, 0) 100%);
    }
    .cine-e0__luz > span:nth-child(2) {
      background:
        radial-gradient(5% 8.9% at 35% 46%, #f6cf7c 0%, rgba(246, 207, 124, 0) 100%),
        radial-gradient(5% 8.9% at 65% 46%, #f6cf7c 0%, rgba(246, 207, 124, 0) 100%);
    }
    .cine-e0__luz > span:nth-child(3) {
      background:
        radial-gradient(4.6% 8.2% at 27% 62%, #f6cf7c 0%, rgba(246, 207, 124, 0) 100%),
        radial-gradient(4.6% 8.2% at 43% 62%, #f6cf7c 0%, rgba(246, 207, 124, 0) 100%),
        radial-gradient(4.6% 8.2% at 57% 62%, #f6cf7c 0%, rgba(246, 207, 124, 0) 100%),
        radial-gradient(4.6% 8.2% at 73% 62%, #f6cf7c 0%, rgba(246, 207, 124, 0) 100%);
    }
    .cine.b-arbol-entero .cine-e0__luz > span {
      opacity: 0.75;
      animation: cine-e0-destello 900ms ease-out calc(1100ms + var(--fila) * 60ms) 2;
    }

    /* ---- arbol-apagado: el iris se cierra sobre la pantalla y el árbol queda de fantasma ---- */
    .cine.b-arbol-apagado .cine-e0__luz {
      clip-path: circle(0% at 50% 46%);
      transition: clip-path 600ms linear;
    }
    .cine.b-arbol-apagado .cine-e0__arbol {
      opacity: 0.15;
      transition: opacity 700ms ease-in 150ms;
    }
    /* Cada nodo se apaga cuando el iris le pasa por encima: primero los de afuera. */
    .cine.b-arbol-apagado .cine-e0__nodo > .k-cuerpo {
      background-color: #fbf8ef;
      border-color: #6b6252;
      transition:
        background-color 200ms ease-in var(--apaga, 0ms),
        border-color 200ms ease-in var(--apaga, 0ms);
    }

    /* ---- pregunta: se escribe a mano, palabra por palabra, y se llena ---- */
    .cine-e0__pregunta {
      font:
        italic 500 60px 'Iowan Old Style',
        'Palatino Linotype',
        Palatino,
        Georgia,
        serif;
      letter-spacing: 0.01em;
      fill: #201d16;
      fill-opacity: 0;
      stroke: #3a342a;
      stroke-width: 1.3;
      stroke-linejoin: round;
      stroke-dasharray: 600;
      stroke-dashoffset: 600;
    }
    .cine-e0__pregunta tspan {
      transition:
        stroke-dashoffset 900ms ease-out calc(var(--i) * 190ms),
        fill-opacity 500ms ease-out calc(var(--i) * 190ms + 600ms);
    }
    .cine.b-pregunta .cine-e0__pregunta tspan {
      stroke-dashoffset: 0;
      fill-opacity: 1;
    }
    .cine-e0__subrayado {
      stroke: #9a9081;
      stroke-width: 3.5;
      stroke-linecap: round;
      --trazo-ms: 700ms;
      --trazo-delay: 1500ms;
    }
    .cine.b-pregunta .cine-e0__subrayado {
      stroke-dashoffset: 0;
    }

    /* ---- mascota: nadie revisa todo, alguien avisa. El pip avisa con una onda ---- */
    .cine-e0__onda {
      pointer-events: none;
    }
    .cine.b-mascota .cine-e0__onda > span {
      animation-name: cine-onda;
      animation-delay: calc(700ms + var(--i) * 240ms);
    }

    @keyframes cine-e0-late {
      0%,
      100% {
        transform: none;
      }
      35% {
        transform: scale(1.22);
      }
    }
    @keyframes cine-e0-avisa {
      0%,
      100% {
        transform: none;
      }
      35% {
        transform: scale(1.18);
      }
    }
    @keyframes cine-e0-revisa {
      0%,
      100% {
        transform: none;
      }
      30% {
        transform: scale(1.15);
      }
    }
    @keyframes cine-e0-destello {
      0%,
      100% {
        opacity: 0.75;
      }
      25% {
        opacity: 1;
      }
    }
    /* El titileo: casi todo el ciclo quieto, dos cortes breves. Irregular, como algo que falla. */
    @keyframes cine-e0-titila-num {
      0%,
      60%,
      66%,
      88%,
      92%,
      100% {
        opacity: 0.5;
      }
      62% {
        opacity: 0.22;
      }
      90% {
        opacity: 0.32;
      }
    }
    @keyframes cine-e0-titila-bisel {
      0%,
      60%,
      66%,
      88%,
      92%,
      100% {
        stroke-dashoffset: 0;
      }
      62% {
        stroke-dashoffset: 0.021;
      }
      90% {
        stroke-dashoffset: -0.014;
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Escena00Component {}
