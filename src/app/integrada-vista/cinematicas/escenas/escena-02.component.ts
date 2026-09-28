import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Capítulo 2 · El que se entera por otro. Arriba, dos cajas ámbar (velocidad y viento). El
 * capitán suma a mano en un papel (5 + 3 = 8); cambia el viento y su suma queda vieja. Al centro
 * se dibuja sola una molécula menta punteada que ya tiene la suma correcta. Después aparecen los
 * hilos que la unen a sus fuentes: cuando una cambia, un anillo baja por su hilo y la molécula se
 * rehace. Al final, sin nadie que la lea, se apaga y respira; un nuevo cambio del viento no la
 * despierta. Recién cuando el hilo de lectura del capitán la toca, se enciende con el valor nuevo.
 *
 * Técnicas: la suma a mano es un trazo manuscrito (paths con pathLength="1" que se dibujan por
 * stroke-dashoffset, cifra por cifra); la molécula y los hilos se REVELAN con máscaras cuyo trazo
 * se dibuja (así el punteado aparece de a poco sin deformarse, como el hilo del capítulo 1); los
 * anillos viajan con offset-path sobre el mismo camino que el hilo. Los números cambian por cruce
 * (transiciones con demora por beat), así con movimiento reducido cada cuadro llega igual.
 */
@Component({
  selector: 'app-escena-02',
  template: `
    <div class="k-mundo cine-e2">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <mask
            id="cine-e2-revela"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1600"
            height="900"
          >
            <path
              class="cine-e2__revela cine-e2__revela--vel"
              pathLength="1"
              d="M 640 290 C 640 348, 680 396, 722 418"
            />
            <path
              class="cine-e2__revela cine-e2__revela--viento"
              pathLength="1"
              d="M 960 290 C 960 348, 920 396, 878 418"
            />
            <path
              class="cine-e2__revela cine-e2__revela--cap"
              pathLength="1"
              d="M 380 498 C 480 526, 590 560, 694 524"
            />
          </mask>
        </defs>
        <g class="cine-e2__lejos">
          <line x1="1250" y1="140" x2="1370" y2="100" />
          <line x1="1370" y1="100" x2="1460" y2="190" />
          <circle cx="1250" cy="140" r="12" />
          <circle cx="1370" cy="100" r="9" />
          <circle cx="1460" cy="190" r="11" />
          <line x1="470" y1="800" x2="590" y2="760" />
          <circle cx="470" cy="800" r="10" />
          <circle cx="590" cy="760" r="13" />
        </g>

        <!-- La suma a mano del capitán: un papel y cinco trazos, en el orden en que se escriben. -->
        <g class="cine-e2__mano" transform="rotate(-3 460 372)">
          <rect class="cine-e2__papel" x="406" y="276" width="110" height="192" rx="8" />
          <path
            class="cine-e2__letra"
            style="--d: 800ms"
            pathLength="1"
            transform="translate(482 314)"
            d="M 16 -22 L -5 -21 L -8 -2 C 0 -9, 17 -6, 17 8 C 17 22, 1 26, -11 18"
          />
          <path
            class="cine-e2__letra"
            style="--d: 1200ms"
            pathLength="1"
            transform="translate(434 368)"
            d="M -13 1 L 13 -1 M 1 -13 L -1 13"
          />
          <path
            class="cine-e2__letra"
            style="--d: 1400ms"
            pathLength="1"
            transform="translate(482 366)"
            d="M -12 -19 C -2 -27, 16 -23, 13 -10 C 11 -3, 3 -1, -2 -1 C 9 -1, 18 5, 15 15 C 11 26, -6 25, -13 17"
          />
          <path
            class="cine-e2__letra"
            style="--d: 1800ms; --t: 320ms"
            pathLength="1"
            transform="translate(460 402)"
            d="M -44 0 C -14 -4, 16 3, 46 -2"
          />
          <path
            class="cine-e2__letra"
            style="--d: 2050ms; --t: 560ms"
            pathLength="1"
            transform="translate(480 440)"
            d="M 9 -19 C 3 -28, -13 -25, -12 -14 C -11 -4, 14 -1, 14 11 C 14 25, -14 26, -14 11 C -14 0, 11 -5, 11 -15 C 11 -19, 10 -21, 8 -22"
          />
        </g>

        <!-- Los hilos: dos de las fuentes a la molécula, y el de lectura del capitán. -->
        <g class="cine-e2__hilos" mask="url(#cine-e2-revela)">
          <path d="M 640 290 C 640 348, 680 396, 722 418" />
          <path d="M 960 290 C 960 348, 920 396, 878 418" />
          <path d="M 380 498 C 480 526, 590 560, 694 524" />
        </g>
        <circle class="cine-e2__anillo cine-e2__anillo--vel" r="12" />
        <circle class="cine-e2__anillo cine-e2__anillo--viento" r="12" />
        <circle class="cine-e2__anillo cine-e2__anillo--eco" r="12" />
      </svg>

      <div
        class="k-actor k-onda cine-e2__onda-viento"
        style="--x: 60; --y: 26; --w: 10; --acento: #eb9b3c"
      >
        <span style="--i: 0"></span><span style="--i: 1"></span><span style="--i: 2"></span>
      </div>
      <div
        class="k-actor cine-e2__caja cine-e2__caja--vel"
        style="--x: 40; --y: 26; --w: 6; --i: 0"
      >
        <div class="k-cuerpo">
          <span class="cine-e2__rotulo">velocidad</span>
          <div class="cine-e2__cara">
            <span class="cine-e2__v cine-e2__v--a">5</span>
            <span class="cine-e2__v cine-e2__v--b">6</span>
          </div>
        </div>
      </div>
      <div
        class="k-actor cine-e2__caja cine-e2__caja--viento"
        style="--x: 60; --y: 26; --w: 6; --i: 1"
      >
        <div class="k-cuerpo">
          <span class="cine-e2__rotulo">viento</span>
          <div class="cine-e2__cara">
            <span class="cine-e2__v cine-e2__v--a">3</span>
            <span class="cine-e2__v cine-e2__v--b">4</span>
            <span class="cine-e2__v cine-e2__v--c">5</span>
            <span class="cine-e2__v cine-e2__v--d">7</span>
          </div>
        </div>
      </div>

      <div
        class="k-actor k-onda cine-e2__onda-mol"
        style="--x: 50; --y: 55; --w: 22; --acento: #62c4ad"
      >
        <span style="--i: 0"></span><span style="--i: 1"></span><span style="--i: 2"></span>
      </div>
      <!-- El héroe: la molécula derivada. Nadie la escribe; la suma le llega por los hilos. -->
      <div class="k-actor cine-e2__mol" style="--x: 50; --y: 55; --w: 16">
        <div class="k-cuerpo">
          <span class="cine-e2__halo"></span>
          <div class="cine-e2__vida">
            <span class="cine-e2__relleno"></span>
            <svg viewBox="-120 -120 240 240">
              <defs>
                <mask
                  id="cine-e2-revela-mol"
                  maskUnits="userSpaceOnUse"
                  x="-120"
                  y="-120"
                  width="240"
                  height="240"
                >
                  <circle
                    class="cine-e2__revela cine-e2__revela--mol"
                    r="104"
                    pathLength="1"
                    transform="rotate(-90)"
                  />
                </mask>
              </defs>
              <circle class="cine-e2__contorno" r="104" mask="url(#cine-e2-revela-mol)" />
            </svg>
            <span class="cine-e2__suma cine-e2__suma--a">9</span>
            <span class="cine-e2__suma cine-e2__suma--b">11</span>
            <span class="cine-e2__suma cine-e2__suma--c">13</span>
          </div>
        </div>
      </div>

      <div class="k-actor k-nave" style="--x: 13; --y: 38; --w: 6.2; --i: 0">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div class="k-actor k-nave k-nave--cap" style="--x: 20; --y: 55; --w: 7.6; --i: 1">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave-cap" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div class="k-actor k-nave" style="--x: 11; --y: 72; --w: 6.2; --i: 2">
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
    .cine-e2__lejos line {
      stroke: #cdc3ad;
      stroke-width: 3;
      stroke-dasharray: 2 10;
      stroke-linecap: round;
    }
    .cine-e2__lejos circle {
      fill: #efe7d4;
      stroke: #cdc3ad;
      stroke-width: 3;
    }

    /* ---- La suma a mano: se escribe cifra por cifra y, cuando cambia el viento, queda vieja ---- */
    .cine-e2__mano {
      stroke: #3a342a;
      transition:
        stroke 700ms ease-out,
        opacity 700ms ease-out;
    }
    .cine.b-suma-a-mano .cine-e2__mano {
      stroke: #6b6252;
      opacity: 0.4;
      transition-delay: 3900ms;
    }
    .cine-e2__papel {
      fill: #fffdf6;
      stroke: #d9cfb9;
      stroke-width: 2;
      opacity: 0;
      transition: opacity 320ms ease-out;
    }
    .cine.b-suma-a-mano .cine-e2__papel {
      opacity: 1;
      transition-delay: 600ms;
    }
    /* El hueco del patrón es un poco más largo que el trazo: así la tapa redonda no deja un punto
       suelto al principio antes de escribir. */
    .cine-e2__letra {
      fill: none;
      stroke-width: 4.5;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 1 1.1;
      stroke-dashoffset: 1.05;
      transition: stroke-dashoffset var(--t, 440ms) cubic-bezier(0.45, 0.05, 0.4, 1) var(--d, 0ms);
    }
    .cine.b-suma-a-mano .cine-e2__letra {
      stroke-dashoffset: 0;
    }

    /* ---- Hilos: punteados, revelados por la máscara ---- */
    .cine-e2__hilos path {
      fill: none;
      stroke: #6b6252;
      stroke-width: 5;
      stroke-linecap: round;
      stroke-dasharray: 0.5 16;
    }
    .cine-e2__revela {
      fill: none;
      stroke: #fff;
      stroke-width: 40;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      transition: stroke-dashoffset 800ms var(--resorte-suave, ease-out) var(--d, 0ms);
    }
    .cine.b-hilos-fuente .cine-e2__revela--vel,
    .cine.b-hilos-fuente .cine-e2__revela--viento,
    .cine.b-reposo .cine-e2__revela--cap {
      stroke-dashoffset: 0;
    }
    .cine.b-hilos-fuente .cine-e2__revela--viento {
      --d: 120ms;
    }
    .cine.b-reposo .cine-e2__revela--cap {
      --d: 1200ms;
    }

    /* Los anillos: bajan por el hilo de su fuente. Fuera de su viaje no se ven. */
    .cine-e2__anillo {
      fill: #fbf8ef;
      stroke: #eb9b3c;
      stroke-width: 5;
      opacity: 0;
      offset-rotate: 0deg;
    }
    .cine-e2__anillo--vel {
      offset-path: path('M 640 290 C 640 348, 680 396, 722 418');
    }
    .cine-e2__anillo--viento,
    .cine-e2__anillo--eco {
      offset-path: path('M 960 290 C 960 348, 920 396, 878 418');
    }
    .cine.b-hilos-fuente .cine-e2__anillo--vel {
      animation: cine-e2-viaja 820ms cubic-bezier(0.45, 0, 0.25, 1) 1000ms both;
    }
    .cine.b-hilos-fuente .cine-e2__anillo--viento {
      animation: cine-e2-viaja 820ms cubic-bezier(0.45, 0, 0.25, 1) 1120ms both;
    }
    .cine.b-reposo .cine-e2__anillo--eco {
      animation: cine-e2-viaja 820ms cubic-bezier(0.45, 0, 0.25, 1) 350ms both;
    }

    /* ---- Las fuentes: dos cajas ámbar que caen cuando la tarjeta del capítulo se va ---- */
    .cine-e2__caja {
      aspect-ratio: 1 / 1;
    }
    .cine-e2__caja > .k-cuerpo {
      position: relative;
      opacity: 0;
      transform: translateY(-42cqh) rotate(-8deg) scale(1.08);
      transition:
        opacity 200ms linear calc(200ms + var(--i, 0) * 120ms),
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out)
          calc(200ms + var(--i, 0) * 120ms);
    }
    .cine.b-titulo-rincon .cine-e2__caja > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    .cine-e2__cara {
      display: grid;
      place-items: center;
      aspect-ratio: 1 / 1;
      overflow: hidden;
      border-radius: 22%;
      border: 2.5px solid #3a342a;
      background: radial-gradient(circle at 38% 30%, #ffe0a8 0%, #f2ab41 55%, #d98a24 100%);
      box-shadow:
        inset 0 -4px 8px rgba(120, 70, 10, 0.35),
        0 12px 20px -12px rgba(90, 60, 20, 0.55);
    }
    .cine-e2__rotulo {
      position: absolute;
      left: 50%;
      bottom: calc(100% + 1cqh);
      translate: -50% 0;
      font:
        600 clamp(8px, 1.05cqw, 14px) / 1 ui-monospace,
        Menlo,
        Consolas,
        monospace;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      white-space: nowrap;
      color: #6b6252;
    }
    .cine.b-suma-a-mano .cine-e2__caja--viento .cine-e2__cara {
      animation: cine-e2-late-a 620ms cubic-bezier(0.3, 1.4, 0.5, 1) 3300ms;
    }
    .cine.b-hilos-fuente .cine-e2__caja--vel .cine-e2__cara {
      animation: cine-e2-late-b 620ms cubic-bezier(0.3, 1.4, 0.5, 1) 900ms;
    }
    .cine.b-hilos-fuente .cine-e2__caja--viento .cine-e2__cara {
      animation: cine-e2-late-b 620ms cubic-bezier(0.3, 1.4, 0.5, 1) 1020ms;
    }
    .cine.b-reposo .cine-e2__caja--viento .cine-e2__cara {
      animation: cine-e2-late-c 620ms cubic-bezier(0.3, 1.4, 0.5, 1) 250ms;
    }
    .cine-e2__onda-viento,
    .cine-e2__onda-mol {
      pointer-events: none;
    }
    /* Sin relleno hacia atrás: durante la demora el anillo no se ve, ni asomado detrás del héroe. */
    .cine.b-suma-a-mano .cine-e2__onda-viento > span {
      animation-name: cine-onda;
      animation-delay: calc(3300ms + var(--i, 0) * 240ms);
      animation-fill-mode: none;
    }

    /* ---- Los números: cambian por cruce, el viejo sube y el nuevo entra de abajo ---- */
    .cine-e2__v,
    .cine-e2__suma {
      grid-area: 1 / 1;
      font:
        700 clamp(10px, 2.5cqw, 36px) / 1 ui-monospace,
        Menlo,
        Consolas,
        monospace;
      color: #201d16;
      transition:
        opacity 260ms ease-out var(--d, 0ms),
        transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out) var(--d, 0ms);
    }
    .cine-e2__v:not(.cine-e2__v--a),
    .cine-e2__suma {
      opacity: 0;
      transform: translateY(45%);
    }
    .cine.b-suma-a-mano .cine-e2__caja--viento .cine-e2__v {
      --d: 3400ms;
    }
    .cine.b-molecula-punteada .cine-e2__suma {
      --d: 800ms;
    }
    .cine.b-hilos-fuente .cine-e2__caja--vel .cine-e2__v {
      --d: 950ms;
    }
    .cine.b-hilos-fuente .cine-e2__caja--viento .cine-e2__v {
      --d: 1070ms;
    }
    .cine.b-hilos-fuente .cine-e2__suma {
      --d: 1950ms;
    }
    .cine.b-reposo .cine-e2__caja--viento .cine-e2__v {
      --d: 350ms;
    }
    .cine.b-reposo .cine-e2__suma {
      --d: 2150ms;
    }
    /* Entran. Cada número sale en un beat posterior al que lo trajo, así la regla de salida
       (que va después) gana cuando los dos beats están encendidos. */
    .cine.b-suma-a-mano .cine-e2__caja--viento .cine-e2__v--b,
    .cine.b-molecula-punteada .cine-e2__suma--a,
    .cine.b-hilos-fuente .cine-e2__caja--vel .cine-e2__v--b,
    .cine.b-hilos-fuente .cine-e2__caja--viento .cine-e2__v--c,
    .cine.b-hilos-fuente .cine-e2__suma--b,
    .cine.b-reposo .cine-e2__caja--viento .cine-e2__v--d,
    .cine.b-reposo .cine-e2__suma--c {
      opacity: 1;
      transform: none;
    }
    /* Salen. */
    .cine.b-suma-a-mano .cine-e2__caja--viento .cine-e2__v--a,
    .cine.b-hilos-fuente .cine-e2__caja--vel .cine-e2__v--a,
    .cine.b-hilos-fuente .cine-e2__caja--viento .cine-e2__v--b,
    .cine.b-hilos-fuente .cine-e2__suma--a,
    .cine.b-reposo .cine-e2__caja--viento .cine-e2__v--c,
    .cine.b-reposo .cine-e2__suma--b {
      opacity: 0;
      transform: translateY(-45%);
    }

    /* ---- La molécula menta: se dibuja sola, se rehace, se duerme y la despierta quien la lee ---- */
    .cine-e2__mol {
      aspect-ratio: 1 / 1;
    }
    .cine-e2__mol > .k-cuerpo {
      position: relative;
      opacity: 0;
      transform: scale(0.9);
      transition:
        opacity 240ms ease-out,
        transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out);
    }
    .cine.b-molecula-punteada .cine-e2__mol > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    .cine-e2__halo {
      position: absolute;
      inset: -22%;
      border-radius: 50%;
      background: radial-gradient(
        circle,
        rgba(98, 196, 173, 0.42) 0%,
        rgba(98, 196, 173, 0.14) 45%,
        transparent 68%
      );
      opacity: 0;
      transition: opacity 700ms ease-out 700ms;
    }
    .cine.b-molecula-punteada .cine-e2__halo {
      opacity: 0.7;
    }
    /* El único loop propio de la escena, y en el foco: la molécula respira mientras espera. */
    .cine.b-reposo .cine-e2__halo {
      animation: cine-e2-respira 2s ease-in-out infinite alternate;
    }
    .cine-e2__vida {
      position: relative;
      display: grid;
      place-items: center;
      aspect-ratio: 1 / 1;
    }
    .cine-e2__vida > * {
      grid-area: 1 / 1;
    }
    .cine-e2__relleno {
      width: 80%;
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      background: radial-gradient(circle at 40% 34%, #f1fbf7 0%, #c4ebe0 52%, #92d6c4 100%);
      box-shadow: inset 0 -6px 14px rgba(30, 110, 90, 0.25);
      opacity: 0;
      transform: scale(0.7);
      transition:
        opacity 400ms ease-out 520ms,
        transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out) 520ms;
    }
    .cine.b-molecula-punteada .cine-e2__relleno {
      opacity: 1;
      transform: none;
    }
    .cine-e2__contorno {
      fill: none;
      stroke: #62c4ad;
      stroke-width: 9;
      stroke-linecap: round;
      stroke-dasharray: 0.1 17;
    }
    .cine-e2__revela--mol {
      stroke-width: 30;
      transition: stroke-dashoffset 1000ms cubic-bezier(0.5, 0.1, 0.3, 1) 80ms;
    }
    .cine.b-molecula-punteada .cine-e2__revela--mol {
      stroke-dashoffset: 0;
    }
    .cine-e2__suma {
      font-size: clamp(14px, 4.8cqw, 68px);
    }
    .cine.b-hilos-fuente .cine-e2__vida {
      animation: cine-e2-flash 700ms cubic-bezier(0.3, 1.4, 0.5, 1) 1900ms;
    }
    /* Se apaga, respira una vez y, cuando el hilo del capitán la toca, se enciende. Termina donde
       empezó: con movimiento reducido el cuadro final es la molécula encendida. */
    .cine.b-reposo .cine-e2__vida {
      animation: cine-e2-duerme 2500ms ease-in-out both;
    }
    .cine.b-reposo .cine-e2__onda-mol > span {
      animation-name: cine-onda;
      animation-delay: calc(2100ms + var(--i, 0) * 240ms);
      animation-fill-mode: none;
    }

    @keyframes cine-e2-viaja {
      0% {
        offset-distance: 0%;
        opacity: 0;
      }
      14%,
      86% {
        opacity: 1;
      }
      100% {
        offset-distance: 100%;
        opacity: 0;
      }
    }
    @keyframes cine-e2-late-a {
      0%,
      100% {
        transform: none;
      }
      35% {
        transform: scale(1.14);
      }
    }
    @keyframes cine-e2-late-b {
      0%,
      100% {
        transform: none;
      }
      35% {
        transform: scale(1.14);
      }
    }
    @keyframes cine-e2-late-c {
      0%,
      100% {
        transform: none;
      }
      35% {
        transform: scale(1.14);
      }
    }
    @keyframes cine-e2-flash {
      0%,
      100% {
        transform: none;
      }
      40% {
        transform: scale(1.1);
      }
    }
    @keyframes cine-e2-duerme {
      0% {
        opacity: 1;
        transform: none;
      }
      20% {
        opacity: 0.38;
        transform: scale(0.95);
      }
      50% {
        opacity: 0.6;
        transform: scale(0.97);
      }
      80% {
        opacity: 0.38;
        transform: scale(0.95);
      }
      88% {
        opacity: 1;
        transform: scale(1.1);
      }
      100% {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes cine-e2-respira {
      from {
        opacity: 0.3;
        transform: scale(0.94);
      }
      to {
        opacity: 0.85;
        transform: scale(1.05);
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Escena02Component {}
