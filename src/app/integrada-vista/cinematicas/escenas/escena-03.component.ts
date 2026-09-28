import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Capítulo 3 · El que sale a hacer algo. La Nave B se engancha una baliza coral al casco: la baliza
 * lee la caja ámbar (un hilo punteado) y suena cuando la caja cambia; la caja del viento, que nadie
 * leyó, cambia y no pasa nada. Después se apila una segunda baliza encima de la vieja, que no se
 * apagó: las dos parpadean a destiempo, y detrás de la nave queda una estela de anillos.
 *
 * Técnicas: la baliza vive ADENTRO del SVG de la nave, así flota pegada al casco; los hilos se
 * revelan con una máscara que se dibuja (el punteado aparece sin deformarse); el aviso es un anillo
 * que viaja por el hilo animando solo el dashoffset (dos trazos redondos superpuestos, coral y
 * papel); las cajas y la baliza entran recién cuando la tarjeta del capítulo deja el centro.
 */
@Component({
  selector: 'app-escena-03',
  template: `
    <div class="k-mundo cine-e3">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <radialGradient id="cine-e3-brillo" cx="50%" cy="50%" r="50%">
            <stop offset="0" stop-color="#ffe3da" stop-opacity="0.95" />
            <stop offset="0.38" stop-color="#ff5a4a" stop-opacity="0.5" />
            <stop offset="1" stop-color="#ff5a4a" stop-opacity="0" />
          </radialGradient>
          <mask
            id="cine-e3-revela-1"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1600"
            height="900"
          >
            <path
              class="cine-e3__revela cine-e3__revela--1"
              pathLength="1"
              d="M 444 430 C 530 368, 650 360, 748 398"
            />
          </mask>
          <mask
            id="cine-e3-revela-2"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1600"
            height="900"
          >
            <path
              class="cine-e3__revela cine-e3__revela--2"
              pathLength="1"
              d="M 444 397 C 530 316, 660 314, 752 372"
            />
          </mask>
        </defs>
        <g class="cine-e3__lejos">
          <line x1="1200" y1="150" x2="1330" y2="104" />
          <line x1="1330" y1="104" x2="1432" y2="190" />
          <circle cx="1200" cy="150" r="12" />
          <circle cx="1330" cy="104" r="9" />
          <circle cx="1432" cy="190" r="11" />
          <line x1="600" y1="770" x2="742" y2="722" />
          <circle cx="600" cy="770" r="10" />
          <circle cx="742" cy="722" r="13" />
        </g>
        <!-- Los hilos de lectura: la baliza lee la caja. El segundo es de la baliza nueva. -->
        <path
          class="cine-e3__hilo"
          mask="url(#cine-e3-revela-1)"
          d="M 444 430 C 530 368, 650 360, 748 398"
        />
        <path
          class="cine-e3__hilo"
          mask="url(#cine-e3-revela-2)"
          d="M 444 397 C 530 316, 660 314, 752 372"
        />
        <!-- El aviso: un anillo que va de la caja a la baliza por el mismo hilo, al revés. -->
        <path class="cine-e3__anillo" pathLength="1" d="M 748 398 C 650 360, 530 368, 444 430" />
        <path
          class="cine-e3__anillo cine-e3__anillo--hueco"
          pathLength="1"
          d="M 748 398 C 650 360, 530 368, 444 430"
        />
      </svg>

      <!-- Las ondas van antes que sus cajas: mientras esperan quedan tapadas por la caja. -->
      <div
        class="k-actor k-onda cine-e3__onda cine-e3__onda--caja"
        style="--x: 52; --y: 44; --w: 20; --acento: #eb9b3c"
      >
        <span style="--i: 0"></span><span style="--i: 1"></span><span style="--i: 2"></span>
      </div>
      <div class="k-actor cine-e3__caja" style="--x: 52; --y: 44; --w: 9">
        <div class="k-cuerpo">
          <span class="cine-e3__valor cine-e3__valor--antes">7</span>
          <span class="cine-e3__valor cine-e3__valor--despues">8</span>
        </div>
      </div>

      <div
        class="k-actor k-onda cine-e3__onda cine-e3__onda--viento"
        style="--x: 66; --y: 44; --w: 12; --acento: #c9a46a"
      >
        <span style="--i: 0"></span><span style="--i: 1"></span>
      </div>
      <div class="k-actor cine-e3__caja cine-e3__caja--viento" style="--x: 66; --y: 44; --w: 7">
        <div class="k-cuerpo">
          <svg class="cine-e3__glifo" viewBox="0 0 22 14">
            <path d="M 2 4 Q 6 1 10 4 T 20 4 M 2 10 Q 6 7 10 10 T 16 10" />
          </svg>
          <span class="cine-e3__valor cine-e3__valor--antes">3</span>
          <span class="cine-e3__valor cine-e3__valor--despues">5</span>
        </div>
      </div>

      <div class="k-actor k-nave" style="--x: 14; --y: 37; --w: 6; --i: 0">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div class="k-actor k-nave k-nave--cap" style="--x: 15; --y: 65; --w: 7.4; --i: 1">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave-cap" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <!-- Nave B, un poco adelantada, con las balizas enganchadas al casco. -->
      <div class="k-actor k-nave" style="--x: 26; --y: 52; --w: 7.6; --i: 2">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
            <g class="cine-e3__baliza cine-e3__baliza--vieja">
              <circle class="cine-e3__brillo" cx="0" cy="-41" r="46" />
              <path class="cine-e3__montura" d="M -22 -22.8 L 22 -9.9 L 18 -26 L -18 -26 Z" />
              <path class="cine-e3__domo" d="M -20 -26 V -40 A 20 20 0 0 1 20 -40 V -26 Z" />
              <path class="cine-e3__fantasma" d="M -20 -26 V -40 A 20 20 0 0 1 20 -40 V -26 Z" />
              <circle class="cine-e3__luz" cx="0" cy="-41" r="7" />
            </g>
            <g class="cine-e3__baliza cine-e3__baliza--nueva">
              <circle class="cine-e3__brillo" cx="0" cy="-79" r="46" />
              <path class="cine-e3__montura" d="M -11 -58 L 11 -58 L 15 -65 L -15 -65 Z" />
              <path class="cine-e3__domo" d="M -20 -65 V -78 A 20 20 0 0 1 20 -78 V -65 Z" />
              <circle class="cine-e3__luz" cx="0" cy="-79" r="7" />
            </g>
          </svg>
        </div>
      </div>

      <div
        class="k-actor k-onda cine-e3__sonar cine-e3__sonar--vieja"
        style="--x: 26; --y: 48; --w: 4.4; --acento: #ff5a4a"
      >
        <span style="--i: 0"></span><span style="--i: 1"></span><span style="--i: 2"></span>
      </div>
      <div
        class="k-actor k-onda cine-e3__sonar cine-e3__sonar--nueva"
        style="--x: 26; --y: 44.4; --w: 4.4; --acento: #ff5a4a"
      >
        <span style="--i: 0"></span>
      </div>

      <!-- El rastro: cada anillo sale de la baliza y se queda atrás. El más viejo, el más lejos. -->
      <span class="k-actor cine-e3__eco" style="--x: 5.4; --y: 49; --w: 4; --i: 0; --o: 0.2"></span>
      <span
        class="k-actor cine-e3__eco"
        style="--x: 9.6; --y: 47.6; --w: 3.6; --i: 1; --o: 0.28"
      ></span>
      <span
        class="k-actor cine-e3__eco"
        style="--x: 13.4; --y: 46.6; --w: 3.2; --i: 2; --o: 0.38"
      ></span>
      <span
        class="k-actor cine-e3__eco"
        style="--x: 16.9; --y: 46.4; --w: 2.8; --i: 3; --o: 0.48"
      ></span>
      <span
        class="k-actor cine-e3__eco"
        style="--x: 20.1; --y: 47; --w: 2.4; --i: 4; --o: 0.6"
      ></span>

      <div class="k-actor k-mascota" style="--x: 84; --y: 64; --w: 10">
        <div class="k-cuerpo">
          <img src="angular-mascot-idea.svg" alt="" width="240" height="300" />
        </div>
      </div>
    </div>
  `,
  styles: `
    .cine-e3__lejos line {
      stroke: #cdc3ad;
      stroke-width: 3;
      stroke-dasharray: 2 10;
      stroke-linecap: round;
    }
    .cine-e3__lejos circle {
      fill: #efe7d4;
      stroke: #cdc3ad;
      stroke-width: 3;
    }

    /* ---- Las cajas: entran cuando la tarjeta del capítulo deja el centro ---- */
    .cine-e3__caja {
      aspect-ratio: 1 / 1;
    }
    .cine-e3__caja > .k-cuerpo {
      position: relative;
      aspect-ratio: 1 / 1;
      display: grid;
      place-items: center;
      border-radius: 22%;
      border: 3px solid #3a342a;
      background: radial-gradient(circle at 38% 30%, #ffe0a8 0%, #f2ab41 55%, #d98a24 100%);
      box-shadow:
        inset 0 -6px 12px rgba(120, 70, 10, 0.35),
        0 18px 30px -18px rgba(90, 60, 20, 0.55);
      opacity: 0;
      transform: translateY(-58cqh) rotate(-8deg) scale(1.08);
      transition:
        opacity 200ms linear,
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out);
    }
    /* La del viento es la misma clase de caja, más pálida: nadie la lee, no es la protagonista. */
    .cine-e3__caja--viento > .k-cuerpo {
      border-color: #6b6252;
      background: radial-gradient(circle at 38% 30%, #fff3dc 0%, #f4d49a 60%, #e2b46c 100%);
      box-shadow: inset 0 -5px 10px rgba(120, 80, 20, 0.25);
      transform: translateY(5cqh) scale(0.6);
      transition:
        opacity 240ms ease-out 180ms,
        transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out) 180ms;
    }
    .cine.b-titulo-rincon .cine-e3__caja > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    .cine-e3__caja .cine-e3__glifo {
      position: absolute;
      left: 12%;
      top: 9%;
      width: 30%;
      fill: none;
      stroke: #6b6252;
      stroke-width: 2;
      stroke-linecap: round;
    }

    /* El número cambia por cruce: el viejo se va hacia arriba, el nuevo entra de abajo. */
    .cine-e3__valor {
      grid-area: 1 / 1;
      font:
        700 clamp(18px, 4cqw, 60px) / 1 ui-monospace,
        Menlo,
        Consolas,
        monospace;
      color: #201d16;
      transition:
        opacity 260ms ease-out,
        transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out);
    }
    .cine-e3__caja--viento .cine-e3__valor {
      font-size: clamp(14px, 3cqw, 44px);
      color: #3a342a;
      translate: 0 12%;
    }
    .cine-e3__valor--despues {
      opacity: 0;
      transform: translateY(40%);
    }
    .cine.b-hilo-lectura .cine-e3__caja .cine-e3__valor--antes {
      opacity: 0;
      transform: translateY(-40%);
      transition-delay: 1050ms;
    }
    .cine.b-hilo-lectura .cine-e3__caja .cine-e3__valor--despues {
      opacity: 1;
      transform: none;
      transition-delay: 1050ms;
    }
    /* El viento cambia recién cuando el capitán lo dice, bastante después que la caja. */
    .cine.b-hilo-lectura .cine-e3__caja--viento .cine-e3__valor {
      transition-delay: 2750ms;
    }

    /* Las dos cajas pulsan: la ámbar primero, la del viento cuando le toca. */
    .cine.b-hilo-lectura .cine-e3__caja > .k-cuerpo {
      animation: cine-e3-pulso 900ms cubic-bezier(0.3, 1.4, 0.5, 1) 1000ms 1;
    }
    .cine.b-hilo-lectura .cine-e3__caja--viento > .k-cuerpo {
      animation-delay: 2700ms;
    }
    .cine-e3__onda,
    .cine-e3__sonar {
      pointer-events: none;
    }
    .cine.b-hilo-lectura .cine-e3__onda--caja > span {
      animation-name: cine-onda;
      animation-delay: calc(1000ms + var(--i) * 0.24s);
    }
    .cine.b-hilo-lectura .cine-e3__onda--viento > span {
      animation-name: cine-onda;
      animation-delay: calc(2700ms + var(--i) * 0.24s);
    }

    /* ---- Los hilos de lectura y el anillo que viaja por el primero ---- */
    .cine-e3__hilo {
      fill: none;
      stroke: #6b6252;
      stroke-width: 5;
      stroke-linecap: round;
      stroke-dasharray: 0.5 16;
    }
    .cine-e3__revela {
      fill: none;
      stroke: #fff;
      stroke-width: 44;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      transition: stroke-dashoffset 1000ms var(--resorte-suave, ease-out);
    }
    .cine.b-hilo-lectura .cine-e3__revela--1 {
      stroke-dashoffset: 0;
    }
    .cine.b-baliza-doble .cine-e3__revela--2 {
      stroke-dashoffset: 0;
      transition-delay: 350ms;
    }
    /* Un guion casi sin largo con punta redonda es un punto; con otro más fino encima, un anillo.
       Estacionado antes del comienzo del camino, no se ve hasta que viaja. */
    .cine-e3__anillo {
      fill: none;
      stroke: #ff5a4a;
      stroke-width: 22;
      stroke-linecap: round;
      stroke-dasharray: 0.004 3;
      stroke-dashoffset: 0.05;
    }
    .cine-e3__anillo--hueco {
      stroke: #fbf8ef;
      stroke-width: 10;
    }
    .cine.b-hilo-lectura .cine-e3__anillo {
      animation: cine-e3-viaje 850ms cubic-bezier(0.45, 0, 0.2, 1) 1150ms 1 both;
    }

    /* ---- La baliza: dentro del SVG de la nave, así flota con el casco ---- */
    .cine-e3__baliza {
      transform-box: fill-box;
      transform-origin: 50% 100%;
    }
    .cine-e3__montura {
      fill: #3a342a;
    }
    .cine-e3__domo {
      fill: #ff5a4a;
      stroke: #3a342a;
      stroke-width: 3;
      stroke-linejoin: round;
      transition:
        fill 500ms ease-out,
        stroke 500ms ease-out;
    }
    .cine-e3__luz {
      fill: #fff4ea;
    }
    .cine-e3__fantasma {
      fill: none;
      stroke: #ff5a4a;
      stroke-width: 2.5;
      stroke-dasharray: 4 4;
      opacity: 0;
      transition: opacity 500ms ease-out 200ms;
    }
    .cine-e3__brillo {
      fill: url(#cine-e3-brillo);
      opacity: 0;
      transform-box: fill-box;
      transform-origin: 50% 50%;
    }

    /* Se engancha cuando la tarjeta ya se fue y las cajas cayeron: cae sobre el casco y rebota. */
    .cine-e3__baliza--vieja {
      opacity: 0;
      transform: translateY(-26px) scale(1.3);
      transition:
        opacity 160ms linear 380ms,
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out) 380ms;
    }
    .cine.b-baliza-coral.b-titulo-rincon .cine-e3__baliza--vieja {
      opacity: 1;
      transform: none;
    }
    .cine.b-baliza-coral.b-titulo-rincon .cine-e3__baliza--vieja .cine-e3__brillo {
      opacity: 0.3;
    }

    /* El sonar de la baliza recién puesta: dos vueltas de anillos, y calla. */
    .cine-e3__sonar > span {
      border-width: 1.5px;
    }
    .cine.b-baliza-coral.b-titulo-rincon .cine-e3__sonar--vieja > span {
      animation: cine-e3-sonar 1200ms cubic-bezier(0.2, 0.7, 0.3, 1) 2 both;
      animation-delay: calc(650ms + var(--i) * 220ms);
    }
    /* La caja cambió: el anillo llega por el hilo y la baliza destella una vez. */
    .cine.b-hilo-lectura.b-titulo-rincon .cine-e3__sonar--vieja > span {
      animation: cine-e3-sonar 1100ms cubic-bezier(0.2, 0.7, 0.3, 1) 1 both;
      animation-delay: calc(1980ms + var(--i) * 180ms);
    }
    .cine.b-hilo-lectura .cine-e3__baliza--vieja .cine-e3__brillo {
      animation: cine-e3-destello 900ms ease-out 1980ms 1;
    }

    /* ---- La baliza doble: la nueva se apila encima, la vieja queda fantasma y no para ---- */
    .cine-e3__baliza--nueva {
      opacity: 0;
      transform: translateY(-36px) scale(1.3);
      transition:
        opacity 160ms linear,
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out);
    }
    .cine.b-baliza-doble .cine-e3__baliza--nueva {
      opacity: 1;
      transform: none;
    }
    .cine.b-baliza-doble.b-titulo-rincon .cine-e3__baliza--vieja {
      opacity: 0.6;
      transition: opacity 500ms ease-out;
    }
    .cine.b-baliza-doble .cine-e3__baliza--vieja .cine-e3__domo {
      fill: rgba(255, 90, 74, 0.12);
      stroke: rgba(58, 52, 42, 0);
    }
    .cine.b-baliza-doble .cine-e3__baliza--vieja .cine-e3__fantasma {
      opacity: 1;
    }
    /* Parpadean a destiempo: 700 ms entre una y otra. */
    .cine.b-baliza-doble.b-titulo-rincon .cine-e3__baliza .cine-e3__brillo {
      opacity: 0.6;
      animation: cine-e3-parpadeo 1400ms ease-in-out 1500ms infinite both;
    }
    .cine.b-baliza-doble.b-titulo-rincon .cine-e3__baliza--vieja .cine-e3__brillo {
      animation-delay: 2200ms;
    }
    .cine.b-baliza-doble .cine-e3__sonar > span:first-child {
      animation: cine-e3-sonar 1400ms cubic-bezier(0.2, 0.7, 0.3, 1) 1500ms infinite both;
    }
    .cine.b-baliza-doble .cine-e3__sonar--vieja > span:first-child {
      animation-delay: 2200ms;
      border-style: dashed;
    }
    .cine.b-baliza-doble .cine-e3__sonar--vieja > span:not(:first-child) {
      animation: none;
    }

    /* ---- El rastro: anillos que salen de la baliza, se quedan atrás y no se borran ---- */
    .cine-e3__eco {
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      border: 2px solid #c98476;
      opacity: 0;
      transform: translate(calc((26 - var(--x)) * 1cqw), calc((46.4 - var(--y)) * 1cqh)) scale(0.3);
      transition:
        opacity 360ms ease-out calc(200ms + var(--i) * 380ms),
        transform 1000ms var(--resorte-suave, ease-out) calc(200ms + var(--i) * 380ms);
    }
    .cine.b-rastro .cine-e3__eco {
      opacity: var(--o);
      transform: none;
    }

    @keyframes cine-e3-pulso {
      0%,
      100% {
        transform: none;
      }
      35% {
        transform: scale(1.1);
      }
    }
    @keyframes cine-e3-viaje {
      from {
        stroke-dashoffset: 0.05;
      }
      to {
        stroke-dashoffset: -1.01;
      }
    }
    @keyframes cine-e3-sonar {
      0% {
        opacity: 0;
        transform: scale(0.25);
      }
      8% {
        opacity: 1;
      }
      100% {
        opacity: 0;
        transform: scale(3);
      }
    }
    @keyframes cine-e3-destello {
      0% {
        opacity: 0.3;
        transform: scale(0.8);
      }
      25% {
        opacity: 1;
        transform: scale(1.3);
      }
      100% {
        opacity: 0.3;
        transform: none;
      }
    }
    @keyframes cine-e3-parpadeo {
      0%,
      55%,
      100% {
        opacity: 0.15;
      }
      18% {
        opacity: 1;
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Escena03Component {}
