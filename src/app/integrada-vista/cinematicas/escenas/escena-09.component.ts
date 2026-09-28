import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Capítulo 9 · Medir después de pintar. La antena del repetidor aparece en boceto (solo trazo de
 * lápiz); la regla llega abajo y marca cero, porque lo que no está pintado no tiene tamaño. Se le
 * pone un oído a la antena, la pintura la barre de coral y recién entonces el oído avisa y la regla
 * sube a la medida real. Al final la repintan dos veces y los oídos se apilan: los viejos quedan
 * como fantasmas, que es el rastro de registrar el oído en cada pintada.
 *
 * Técnicas: el boceto se dibuja con stroke-dashoffset (pathLength 1) y el eje de construcción se
 * revela con máscara; la pintura es un clip-path que barre de izquierda a derecha sobre una copia
 * entintada de la antena (<use>), y el repintado es una franja clara que cruza dos veces; el aviso
 * del oído a la regla es un cometa (solo dashoffset); la lectura es un cuentakilómetros: cada
 * cifra es una tira de dígitos en ::before que sube por transform, sin JS.
 */
@Component({
  selector: 'app-escena-09',
  template: `
    <div class="k-mundo cine-e9">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <linearGradient id="cine-e9-coral" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#ff8072" />
            <stop offset="1" stop-color="#e8483a" />
          </linearGradient>
          <!-- La antena entintada, una sola vez: la usan la pintura y el repintado. -->
          <g id="cine-e9-torre">
            <path
              d="M 732 476 L 854.5 435 L 759 394 L 827.5 353 L 786 312"
              fill="none"
              stroke="currentColor"
              stroke-width="5"
            />
            <path
              d="M 868 476 L 745.5 435 L 841 394 L 772.5 353 L 814 312"
              fill="none"
              stroke="currentColor"
              stroke-width="5"
            />
            <path d="M 754 273 L 796 273" fill="none" />
            <path d="M 712 476 L 732 476 L 786 312 L 774 312 Z" />
            <path d="M 868 476 L 888 476 L 826 312 L 814 312 Z" />
            <path d="M 756 312 L 844 312 L 844 296 L 756 296 Z" />
            <path d="M 796 296 L 796 266 L 804 266 L 804 296 Z" />
            <path d="M 768 250 Q 806 273 768 296 Q 786 273 768 250 Z" />
            <circle cx="751" cy="273" r="5" />
            <circle cx="800" cy="256" r="10" />
          </g>
          <symbol id="cine-e9-oreja" viewBox="-19 -23 44 46" overflow="visible">
            <path
              d="M -12 -4 C -14 -16, -4 -21, 6 -20 C 16 -19, 20 -10, 18 -1 C 16 6, 10 8, 9 13 C 8 19, 0 21, -4 17 C -7 14, -8 10, -11 6 C -13 3, -12 0, -12 -4 Z"
              fill="#ffb4a8"
              stroke="#3a342a"
              stroke-width="2.6"
              stroke-linejoin="round"
            />
            <path
              d="M -5 -5 C -5 -12, 6 -14, 10 -7 C 12 -2, 8 2, 4 3 C 1 4, -1 7, -3 5 C -5 3, -5 0, -5 -5 Z"
              fill="#e9796b"
            />
            <path
              d="M -1 -3 C 2 -8, 7 -6, 5 -1"
              fill="none"
              stroke="#3a342a"
              stroke-width="2.2"
              stroke-linecap="round"
            />
          </symbol>
          <mask
            id="cine-e9-revela-eje"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1600"
            height="900"
          >
            <path class="cine-e9__revela" pathLength="1" d="M 800 494 L 800 224" />
          </mask>
        </defs>

        <g class="cine-e9__lejos">
          <line x1="200" y1="160" x2="330" y2="112" />
          <line x1="330" y1="112" x2="410" y2="196" />
          <circle cx="200" cy="160" r="12" />
          <circle cx="330" cy="112" r="9" />
          <circle cx="410" cy="196" r="11" />
          <line x1="1010" y1="800" x2="1150" y2="752" />
          <circle cx="1010" cy="800" r="10" />
          <circle cx="1150" cy="752" r="13" />
        </g>

        <!-- El grupo de la antena se dibuja en coordenadas propias y se agranda un 10 % acá; los
             actores de la antena, la regla y los oídos usan la misma cuenta (x·1.1 − 80, y·1.1 − 17.6). -->
        <g transform="translate(-80 -17.6) scale(1.1)">
          <!-- Líneas de construcción del boceto: el suelo y el eje, a lápiz claro. -->
          <path class="k-trazo cine-e9__suelo" pathLength="1" d="M 612 476 L 988 476" />
          <path class="cine-e9__eje" mask="url(#cine-e9-revela-eje)" d="M 800 494 L 800 224" />

          <!-- Cotas: el cero existe desde el principio; el borde derecho, recién pintada. -->
          <path
            class="k-trazo cine-e9__cota cine-e9__cota--0"
            pathLength="1"
            d="M 712 482 L 712 503"
          />
          <path
            class="k-trazo cine-e9__cota cine-e9__cota--1"
            pathLength="1"
            d="M 888 482 L 888 503"
          />

          <!-- El aviso del oído a la regla: sale de abajo del oído y baja hasta el cero. -->
          <path
            class="cine-e9__cometa"
            pathLength="1"
            d="M 784 226 C 700 224, 672 336, 694 424 C 702 458, 712 472, 712 490"
          />
        </g>
      </svg>

      <!-- El héroe: la antena. Boceto, pintura y repintado comparten ventana del mundo. -->
      <div class="k-actor cine-e9__antena" style="--x: 50; --y: 42.533; --w: 13.75">
        <div class="k-cuerpo">
          <span class="cine-e9__brillo"></span>
          <svg class="cine-e9__boceto" viewBox="700 244 200 240">
            <path style="--i: 0" pathLength="1" d="M 712 476 L 732 476 L 786 312 L 774 312 Z" />
            <path style="--i: 1" pathLength="1" d="M 868 476 L 888 476 L 826 312 L 814 312 Z" />
            <path
              style="--i: 2"
              pathLength="1"
              d="M 732 476 L 854.5 435 L 759 394 L 827.5 353 L 786 312"
            />
            <path
              style="--i: 3"
              pathLength="1"
              d="M 868 476 L 745.5 435 L 841 394 L 772.5 353 L 814 312"
            />
            <path style="--i: 4" pathLength="1" d="M 756 312 L 844 312 L 844 296 L 756 296 Z" />
            <path style="--i: 5" pathLength="1" d="M 796 296 L 796 266 L 804 266 L 804 296 Z" />
            <path
              style="--i: 6"
              pathLength="1"
              d="M 768 250 Q 806 273 768 296 Q 786 273 768 250 Z"
            />
            <path style="--i: 7" pathLength="1" d="M 796 273 L 756 273" />
            <path
              style="--i: 8"
              pathLength="1"
              d="M 790 256 A 10 10 0 1 1 810 256 A 10 10 0 1 1 790 256 Z"
            />
          </svg>
          <svg class="cine-e9__pintura" viewBox="700 244 200 240">
            <use href="#cine-e9-torre" fill="url(#cine-e9-coral)" />
          </svg>
          <svg class="cine-e9__repinte" viewBox="700 244 200 240">
            <use href="#cine-e9-torre" />
          </svg>
          <div class="k-onda cine-e9__onda">
            <span style="--i: 0"></span><span style="--i: 1"></span><span style="--i: 2"></span>
          </div>
        </div>
      </div>

      <!-- La regla: su cero alineado con el borde izquierdo de la antena. -->
      <div class="k-actor cine-e9__regla" style="--x: 53.575; --y: 61.844; --w: 20.9">
        <div class="k-cuerpo">
          <svg viewBox="700 504 304 36">
            <rect
              class="cine-e9__regla-cuerpo"
              x="701.5"
              y="505.5"
              width="301"
              height="33"
              rx="5"
            />
            <path
              class="cine-e9__marcas"
              d="M712 506v13M728 506v7M744 506v7M760 506v7M776 506v7M792 506v13M808 506v7M824 506v7M840 506v7M856 506v7M872 506v13M888 506v7M904 506v7M920 506v7M936 506v7M952 506v13M968 506v7M984 506v7M1000 506v7"
            />
          </svg>
          <span class="cine-e9__banda"></span>
          <span class="cine-e9__cursor">
            <span class="cine-e9__aguja"></span>
            <span class="cine-e9__lectura">
              <span class="cine-e9__cifra cine-e9__cifra--c"></span>
              <span class="cine-e9__cifra cine-e9__cifra--d"></span>
              <span class="cine-e9__cifra cine-e9__cifra--u"></span>
              <span class="cine-e9__unidad">px</span>
            </span>
          </span>
        </div>
      </div>

      <!-- Los oídos: uno por cada pintada. Se apilan sobre la punta, de abajo hacia arriba. -->
      <div
        class="k-actor cine-e9__oreja cine-e9__oreja--1"
        style="--x: 50; --y: 24.689; --w: 3.3; --rot: -5deg; --desde: 45%; --d: 0ms; --fantasma: 240ms"
      >
        <div class="k-cuerpo">
          <svg viewBox="-19 -23 44 46">
            <use href="#cine-e9-oreja" x="-19" y="-23" width="44" height="46" />
          </svg>
        </div>
      </div>
      <div
        class="k-actor cine-e9__oreja cine-e9__oreja--2"
        style="--x: 50; --y: 18.211; --w: 3.3; --rot: 6deg; --desde: -90%; --d: 240ms; --fantasma: 540ms"
      >
        <div class="k-cuerpo">
          <svg viewBox="-19 -23 44 46">
            <use href="#cine-e9-oreja" x="-19" y="-23" width="44" height="46" />
          </svg>
        </div>
      </div>
      <div
        class="k-actor cine-e9__oreja cine-e9__oreja--3"
        style="--x: 50; --y: 11.733; --w: 3.3; --rot: -3deg; --desde: -90%; --d: 540ms"
      >
        <div class="k-cuerpo">
          <svg viewBox="-19 -23 44 46">
            <use href="#cine-e9-oreja" x="-19" y="-23" width="44" height="46" />
          </svg>
        </div>
      </div>

      <div class="k-actor k-nave" style="--x: 15; --y: 38; --w: 6.4; --i: 0">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div class="k-actor k-nave k-nave--cap" style="--x: 21; --y: 50; --w: 7.6; --i: 1">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave-cap" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div class="k-actor k-nave" style="--x: 13; --y: 72; --w: 6; --i: 2">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>

      <div class="k-actor k-mascota" style="--x: 84; --y: 64; --w: 10">
        <div class="k-cuerpo">
          <img src="angular-mascot-idea.svg" alt="" width="240" height="300" />
        </div>
      </div>
    </div>
  `,
  styles: `
    .cine-e9__lejos line {
      stroke: #cdc3ad;
      stroke-width: 3;
      stroke-dasharray: 2 10;
      stroke-linecap: round;
    }
    .cine-e9__lejos circle {
      fill: #efe7d4;
      stroke: #cdc3ad;
      stroke-width: 3;
    }

    /* ---- Construcción: el suelo entra con la apertura; el eje, junto con el boceto ---- */
    .cine-e9__suelo {
      stroke: #b9ae96;
      stroke-width: 3;
      stroke-linecap: round;
      --trazo-ms: 1000ms;
    }
    .cine.b-antena-boceto .cine-e9__suelo {
      stroke-dashoffset: 0;
    }
    .cine-e9__eje {
      fill: none;
      stroke: #b9ae96;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-dasharray: 1 11;
      transition: opacity 500ms ease-out 200ms;
    }
    .cine-e9__revela {
      fill: none;
      stroke: #fff;
      stroke-width: 24;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      transition: stroke-dashoffset 1000ms var(--resorte-suave, ease-out);
    }
    /* El boceto se dibuja cuando la tarjeta del capítulo deja el centro: se turnan, no se pisan. */
    .cine.b-antena-boceto.b-titulo-rincon .cine-e9__revela {
      stroke-dashoffset: 0;
    }
    .cine.b-pintado .cine-e9__eje {
      opacity: 0;
    }

    /* ---- La antena: boceto a lápiz, después pintura ---- */
    .cine-e9__antena > .k-cuerpo {
      position: relative;
    }
    .cine-e9__boceto path {
      fill: none;
      stroke: #6b6252;
      stroke-width: 2.4;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      transition: stroke-dashoffset 700ms cubic-bezier(0.45, 0.05, 0.3, 1)
        calc(120ms + var(--i, 0) * 95ms);
    }
    .cine.b-antena-boceto.b-titulo-rincon .cine-e9__boceto path {
      stroke-dashoffset: 0;
    }
    .cine-e9__antena .cine-e9__pintura,
    .cine-e9__antena .cine-e9__repinte {
      position: absolute;
      left: 0;
      top: 0;
    }
    .cine-e9__pintura use {
      stroke: #3a342a;
      stroke-width: 3;
      stroke-linejoin: round;
      color: #b8372b;
    }
    /* La pintura barre de izquierda a derecha. Los márgenes negativos dejan entero el trazo. */
    .cine-e9__pintura {
      clip-path: inset(-8% 100% -8% -8%);
      transition: clip-path 820ms cubic-bezier(0.6, 0.05, 0.35, 1) 200ms;
    }
    .cine.b-pintado .cine-e9__pintura {
      clip-path: inset(-8% -8% -8% -8%);
    }
    /* Repintado: una franja de pintura fresca que cruza dos veces. En reposo no se ve. */
    .cine-e9__repinte use {
      fill: #ffc4bb;
      stroke: #3a342a;
      stroke-width: 3;
      stroke-linejoin: round;
      color: #ff8d80;
    }
    .cine-e9__repinte {
      clip-path: inset(-8% 100% -8% -28%);
    }
    .cine.b-oidos-apilados .cine-e9__repinte {
      animation: cine-e9-repinte 300ms cubic-bezier(0.45, 0, 0.55, 1) 2;
    }

    /* La punta, ya pintada, queda viva: es lo único de la escena que respira. */
    .cine-e9__brillo {
      position: absolute;
      left: 50%;
      top: 5%;
      width: 34%;
      aspect-ratio: 1 / 1;
      translate: -50% -50%;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 90, 74, 0.55) 0%, rgba(255, 90, 74, 0) 68%);
      opacity: 0;
      transition: opacity 500ms ease-out 1000ms;
    }
    .cine.b-pintado .cine-e9__brillo {
      opacity: 0.8;
      animation: cine-e9-late 2.6s ease-in-out 1.5s infinite alternate;
    }
    .cine-e9__onda {
      position: absolute;
      left: 50%;
      top: 5%;
      width: 64%;
      translate: -50% -50%;
      pointer-events: none;
      --acento: #ff5a4a;
    }
    .cine.b-pintado .cine-e9__onda > span {
      animation-name: cine-onda;
      animation-delay: calc(1000ms + var(--i, 0) * 240ms);
    }

    /* ---- El oído avisa a la regla ---- */
    .cine-e9__cometa {
      fill: none;
      stroke: #ff5a4a;
      stroke-width: 8;
      stroke-linecap: round;
      stroke-dasharray: 0.07 2;
      stroke-dashoffset: 0.08;
    }
    .cine.b-pintado .cine-e9__cometa {
      animation: cine-e9-cometa 640ms cubic-bezier(0.45, 0, 0.2, 1) 1050ms 1 both;
    }

    /* ---- Cotas ---- */
    .cine-e9__cota {
      stroke: #ff5a4a;
      stroke-width: 3;
      stroke-linecap: round;
      --trazo-ms: 360ms;
    }
    .cine-e9__cota--0 {
      --trazo-delay: 600ms;
    }
    .cine-e9__cota--1 {
      --trazo-delay: 1550ms;
    }
    .cine.b-regla-cero .cine-e9__cota--0,
    .cine.b-pintado .cine-e9__cota--1 {
      stroke-dashoffset: 0;
    }

    /* ---- La regla: entra desde la flota y mide ---- */
    .cine-e9__regla > .k-cuerpo {
      position: relative;
      opacity: 0;
      transform: translateX(-44cqw);
      transition:
        opacity 240ms ease-out,
        transform 780ms cubic-bezier(0.2, 0.9, 0.25, 1);
    }
    .cine.b-regla-cero .cine-e9__regla > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    .cine-e9__regla-cuerpo {
      fill: #fbf8ef;
      stroke: #3a342a;
      stroke-width: 2.5;
    }
    .cine-e9__marcas {
      fill: none;
      stroke: #6b6252;
      stroke-width: 2;
      stroke-linecap: round;
    }
    /* La banda y la aguja ocupan exactamente el tramo medido: de x 712 a x 888 del mundo. */
    .cine-e9__banda,
    .cine-e9__cursor {
      position: absolute;
      left: 3.947%;
      width: 57.895%;
    }
    .cine-e9__banda {
      top: 54%;
      height: 28%;
      border-radius: 2px;
      background: #ff5a4a;
      transform: scaleX(0);
      transform-origin: 0 50%;
    }
    .cine-e9__cursor {
      top: 0;
      height: 100%;
      pointer-events: none;
    }
    /* Medir llega último, después de la pintura y del aviso: mismo viaje para banda, aguja y cifras. */
    .cine-e9__banda,
    .cine-e9__cursor,
    .cine-e9__cifra::before {
      transition: transform 1100ms cubic-bezier(0.25, 0.8, 0.25, 1) 1650ms;
    }
    .cine.b-pintado .cine-e9__banda {
      transform: none;
    }
    .cine.b-pintado .cine-e9__cursor {
      transform: translateX(100%);
    }
    .cine-e9__aguja {
      position: absolute;
      left: 0;
      bottom: 100%;
      width: 1.2cqw;
      aspect-ratio: 1 / 1;
      translate: -50% 10%;
      background: #201d16;
      clip-path: polygon(0 0, 100% 0, 50% 100%);
    }

    /* La lectura cuelga de la aguja. Entra marcando cero y niega con la cabeza. */
    .cine-e9__lectura {
      position: absolute;
      left: 0;
      top: calc(100% + 1.2cqh);
      display: flex;
      align-items: center;
      padding: 0.4em 0.6em;
      border-radius: 6px;
      background: #201d16;
      color: #fbf8ef;
      font:
        700 clamp(12px, 1.6cqw, 22px) / 1 ui-monospace,
        Menlo,
        Consolas,
        monospace;
      white-space: nowrap;
      translate: -50% 0;
      transform-origin: 50% 0;
      opacity: 0;
      transform: translateY(-35%) scale(0.6);
      transition:
        opacity 200ms ease-out 560ms,
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out) 560ms;
    }
    .cine.b-regla-cero .cine-e9__lectura {
      opacity: 1;
      transform: none;
      animation: cine-e9-niega 620ms ease-in-out 1300ms 1;
    }
    /* Cuentakilómetros: cada cifra es una tira de dígitos que sube. El blanco inicial deja "0". */
    .cine-e9__cifra {
      display: block;
      height: 1em;
      overflow: hidden;
    }
    .cine-e9__cifra::before {
      display: block;
      white-space: pre;
      text-align: center;
    }
    .cine-e9__cifra--c::before {
      content: '\\00a0\\A 1';
    }
    .cine-e9__cifra--d::before {
      content: '\\00a0\\A 1\\A 2\\A 3\\A 4\\A 5\\A 6\\A 7';
    }
    .cine-e9__cifra--u::before {
      content: '0\\A 1\\A 2\\A 3\\A 4\\A 5\\A 6\\A 7\\A 8\\A 9\\A 0\\A 1\\A 2\\A 3\\A 4\\A 5\\A 6';
    }
    .cine.b-pintado .cine-e9__cifra--c::before {
      transform: translateY(-1em);
    }
    .cine.b-pintado .cine-e9__cifra--d::before {
      transform: translateY(-7em);
    }
    .cine.b-pintado .cine-e9__cifra--u::before {
      transform: translateY(-16em);
    }
    .cine-e9__unidad {
      margin-left: 0.35em;
      font-size: 0.78em;
      font-weight: 500;
      color: #cdc3ad;
    }

    /* ---- Los oídos: el primero sube desde la punta; los de cada repintada caen sobre la pila ---- */
    .cine-e9__oreja > .k-cuerpo {
      opacity: 0;
      transform: translateY(var(--desde, -90%)) scale(0.5) rotate(var(--rot, 0deg));
      transition:
        opacity 180ms ease-out var(--d, 0ms),
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out) var(--d, 0ms);
    }
    .cine.b-pintado .cine-e9__oreja--1 > .k-cuerpo,
    .cine.b-oidos-apilados .cine-e9__oreja > .k-cuerpo {
      opacity: 1;
      transform: translateY(0) scale(1) rotate(var(--rot, 0deg));
    }
    /* Los viejos no se van: quedan fantasma, cada uno cuando llega el siguiente. */
    .cine-e9__oreja svg {
      transition: opacity 380ms ease-out var(--fantasma, 0ms);
    }
    .cine.b-oidos-apilados .cine-e9__oreja--1 svg,
    .cine.b-oidos-apilados .cine-e9__oreja--2 svg {
      opacity: 0.4;
    }

    @keyframes cine-e9-repinte {
      from {
        clip-path: inset(-8% 100% -8% -28%);
      }
      to {
        clip-path: inset(-8% -28% -8% 100%);
      }
    }
    @keyframes cine-e9-late {
      from {
        transform: scale(1);
      }
      to {
        transform: scale(1.3);
      }
    }
    @keyframes cine-e9-cometa {
      from {
        stroke-dashoffset: 0.08;
      }
      to {
        stroke-dashoffset: -1.01;
      }
    }
    @keyframes cine-e9-niega {
      0%,
      100% {
        rotate: 0deg;
      }
      20% {
        rotate: -9deg;
      }
      45% {
        rotate: 7deg;
      }
      70% {
        rotate: -4deg;
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Escena09Component {}
