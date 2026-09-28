import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Capítulo 1 · El que avisa. Una caja ámbar cae en el centro; la Nave A la lee (un hilo punteado
 * que se traza de la nave a la caja) y su panel se entera; el panel del capitán, que no leyó, se
 * queda en cero. Al final la caja pulsa y el aviso viaja por el hilo hasta quien la leyó.
 *
 * Técnicas: la caja entra con el resorte de rebote; el hilo se REVELA con una máscara cuyo trazo
 * se dibuja (stroke-dashoffset), así el punteado aparece de a poco sin deformarse; el aviso es un
 * "cometa": un guion corto del trazo que recorre el camino animando solo el dashoffset.
 */
@Component({
  selector: 'app-escena-01',
  template: `
    <div class="k-mundo cine-e1">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <mask
            id="cine-e1-revela"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1600"
            height="900"
          >
            <path
              class="cine-e1__revela"
              pathLength="1"
              d="M 300 396 C 420 348, 600 348, 724 396"
            />
          </mask>
        </defs>
        <g class="cine-e1__lejos">
          <line x1="1180" y1="170" x2="1330" y2="120" />
          <line x1="1330" y1="120" x2="1420" y2="220" />
          <circle cx="1180" cy="170" r="12" />
          <circle cx="1330" cy="120" r="9" />
          <circle cx="1420" cy="220" r="11" />
          <line x1="1180" y1="760" x2="1320" y2="700" />
          <circle cx="1180" cy="760" r="10" />
          <circle cx="1320" cy="700" r="13" />
        </g>
        <!-- El hilo de lectura: punteado, revelado por la máscara. -->
        <path
          class="cine-e1__hilo"
          mask="url(#cine-e1-revela)"
          d="M 300 396 C 420 348, 600 348, 724 396"
        />
        <!-- El aviso: el mismo camino al revés, de la caja a quien la leyó. -->
        <path class="cine-e1__cometa" pathLength="1" d="M 724 396 C 600 348, 420 348, 300 396" />
      </svg>

      <div class="k-actor cine-e1__caja" style="--x: 50; --y: 44; --w: 11">
        <div class="k-cuerpo">
          <span class="cine-e1__valor cine-e1__valor--antes">0</span>
          <span class="cine-e1__valor cine-e1__valor--despues">7</span>
        </div>
      </div>
      <div
        class="k-actor k-onda cine-e1__onda"
        style="--x: 50; --y: 44; --w: 20; --acento: #eb9b3c"
      >
        <span style="--i: 0"></span><span style="--i: 1"></span><span style="--i: 2"></span>
      </div>

      <div class="k-actor k-nave" style="--x: 16; --y: 44; --w: 6.4; --i: 0">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div class="k-actor k-nave k-nave--cap" style="--x: 22; --y: 62; --w: 7.6; --i: 1">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave-cap" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div class="k-actor k-nave" style="--x: 11; --y: 74; --w: 6; --i: 2">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>

      <!-- Los paneles de a bordo: el de la Nave A lee la caja, el del capitán no. -->
      <div class="k-actor cine-e1__panel cine-e1__panel--a" style="--x: 16; --y: 31; --w: 5.2">
        <div class="k-cuerpo">
          <span class="cine-e1__valor cine-e1__valor--antes">0</span>
          <span class="cine-e1__valor cine-e1__valor--despues">7</span>
        </div>
      </div>
      <div class="k-actor cine-e1__panel cine-e1__panel--cap" style="--x: 31; --y: 62; --w: 5.2">
        <div class="k-cuerpo"><span class="cine-e1__valor">0</span></div>
      </div>

      <div class="k-actor k-mascota" style="--x: 84; --y: 64; --w: 10">
        <div class="k-cuerpo">
          <img src="angular-mascot-idea.svg" alt="" width="240" height="300" />
        </div>
      </div>
    </div>
  `,
  styles: `
    .cine-e1__lejos line {
      stroke: #cdc3ad;
      stroke-width: 3;
      stroke-dasharray: 2 10;
      stroke-linecap: round;
    }
    .cine-e1__lejos circle {
      fill: #efe7d4;
      stroke: #cdc3ad;
      stroke-width: 3;
    }

    /* ---- La caja: cae con rebote, el héroe del capítulo ---- */
    .cine-e1__caja {
      aspect-ratio: 1 / 1;
    }
    .cine-e1__caja > .k-cuerpo {
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
    .cine.b-caja-ambar .cine-e1__caja > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    .cine.b-aviso-pulso .cine-e1__caja > .k-cuerpo {
      animation: cine-e1-pulso 900ms cubic-bezier(0.3, 1.4, 0.5, 1) 2;
    }

    /* El número cambia por cruce: el viejo se va hacia arriba, el nuevo entra de abajo. */
    .cine-e1__valor {
      grid-area: 1 / 1;
      font:
        700 clamp(18px, 4.4cqw, 64px) / 1 ui-monospace,
        Menlo,
        Consolas,
        monospace;
      color: #201d16;
      transition:
        opacity 260ms ease-out,
        transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out);
    }
    .cine-e1__valor--despues {
      opacity: 0;
      transform: translateY(40%);
    }
    .cine.b-hilo-lectura .cine-e1__valor--antes {
      opacity: 0;
      transform: translateY(-40%);
    }
    .cine.b-hilo-lectura .cine-e1__valor--despues {
      opacity: 1;
      transform: none;
    }

    /* ---- El hilo de lectura y el aviso ---- */
    .cine-e1__hilo {
      fill: none;
      stroke: #6b6252;
      stroke-width: 5;
      stroke-linecap: round;
      stroke-dasharray: 0.5 16;
    }
    .cine-e1__revela {
      fill: none;
      stroke: #fff;
      stroke-width: 40;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      transition: stroke-dashoffset 1100ms var(--resorte-suave, ease-out);
    }
    .cine.b-hilo-lectura .cine-e1__revela {
      stroke-dashoffset: 0;
    }
    /* El cometa: un guion corto que viaja solo moviendo el dashoffset. Antes del beat queda
       estacionado antes del inicio del camino, invisible. */
    .cine-e1__cometa {
      fill: none;
      stroke: #eb9b3c;
      stroke-width: 12;
      stroke-linecap: round;
      stroke-dasharray: 0.07 2;
      stroke-dashoffset: 0.07;
    }
    .cine.b-aviso-pulso .cine-e1__cometa {
      animation: cine-e1-cometa 1050ms cubic-bezier(0.45, 0, 0.2, 1) 180ms 2 both;
    }
    .cine-e1__onda {
      pointer-events: none;
    }
    .cine.b-aviso-pulso .cine-e1__onda > span {
      animation-name: cine-onda;
    }

    /* ---- Paneles de a bordo ---- */
    .cine-e1__panel {
      aspect-ratio: 1.3 / 1;
    }
    .cine-e1__panel > .k-cuerpo {
      position: relative;
      display: grid;
      place-items: center;
      height: 100%;
      aspect-ratio: 1.3 / 1;
      border-radius: 10px;
      border: 2px solid #3a342a;
      background: #fbf8ef;
      opacity: 0;
      transform: scale(0.6);
      transition:
        opacity 240ms ease-out 380ms,
        transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out) 380ms;
    }
    .cine.b-naves .cine-e1__panel > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    .cine-e1__panel .cine-e1__valor {
      font-size: clamp(12px, 2.1cqw, 30px);
    }
    /* El panel del capitán no se entera: su cero pierde tinta, como algo que quedó viejo. */
    .cine.b-hilo-lectura .cine-e1__panel--cap .cine-e1__valor {
      color: #a39a88;
      transition: color 600ms ease-out 700ms;
    }
    .cine.b-aviso-pulso .cine-e1__panel--a > .k-cuerpo {
      animation: cine-e1-flash 1050ms ease-out 1100ms 2;
    }

    @keyframes cine-e1-pulso {
      0%,
      100% {
        transform: none;
      }
      35% {
        transform: scale(1.08);
      }
    }
    @keyframes cine-e1-cometa {
      from {
        stroke-dashoffset: 0.07;
      }
      to {
        stroke-dashoffset: -1;
      }
    }
    @keyframes cine-e1-flash {
      0%,
      100% {
        background: #fbf8ef;
      }
      30% {
        background: #f7c77e;
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Escena01Component {}
