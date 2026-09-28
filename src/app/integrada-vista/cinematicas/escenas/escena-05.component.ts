import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Capítulo 5 · Cuando el observador interviene. Sobre un mapa del sector, tres rutas ámbar van del
 * punto de partida al destino; el marcador menta (un derivado: punteado) se posa sobre la primera,
 * la que propone el mapa. El puntero de la Nave B lo arrastra a la tercera y lo suelta: el borde
 * queda entero, porque ahora es un valor puesto a mano. Cambia el sector, el mapa trae rutas
 * nuevas y la tercera vieja se borra sin reemplazo: el marcador queda flotando sobre nada.
 *
 * Técnicas: las rutas se dibujan con stroke-dashoffset (pathLength="1") y la vieja se borra con el
 * mismo trazo corrido hacia adelante; el arrastre recorre un offset-path `shape()` en porcentaje del
 * lienzo, así escala con la pantalla; las rutas nuevas son un morph de `d: path()` (Safari no lo
 * interpola: ahí se cruzan con copias). El mapa entra con su beat, pero las rutas y el marcador
 * esperan a que la tarjeta del capítulo se vaya: se turnan el centro, no lo comparten.
 */
@Component({
  selector: 'app-escena-05',
  template: `
    <div class="k-mundo cine-e5">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <pattern
            id="cine-e5-grilla"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle class="cine-e5__grilla-punto" cx="20" cy="20" r="2.2" />
          </pattern>
          <clipPath id="cine-e5-recorte">
            <rect x="512" y="246" width="616" height="398" rx="30" />
          </clipPath>
        </defs>

        <g class="cine-e5__lejos">
          <line x1="170" y1="150" x2="310" y2="105" />
          <line x1="310" y1="105" x2="400" y2="185" />
          <circle cx="170" cy="150" r="12" />
          <circle cx="310" cy="105" r="9" />
          <circle cx="400" cy="185" r="11" />
          <line x1="1240" y1="165" x2="1380" y2="115" />
          <line x1="1380" y1="115" x2="1465" y2="205" />
          <circle cx="1240" cy="165" r="10" />
          <circle cx="1380" cy="115" r="13" />
          <circle cx="1465" cy="205" r="9" />
        </g>

        <!-- El mapa del sector: papel, grilla de puntos (se corre cuando cambia el sector) y borde. -->
        <g class="cine-e5__placa">
          <rect class="cine-e5__placa-fondo" x="512" y="246" width="616" height="398" rx="30" />
          <g clip-path="url(#cine-e5-recorte)">
            <rect
              class="cine-e5__grilla"
              x="512"
              y="246"
              width="720"
              height="398"
              fill="url(#cine-e5-grilla)"
            />
          </g>
          <rect class="cine-e5__placa-borde" x="512" y="246" width="616" height="398" rx="30" />
        </g>

        <!-- Las rutas del sector uno. La 1 y la 2 se transforman en las del sector dos. -->
        <path
          class="cine-e5__ruta cine-e5__ruta--vieja cine-e5__ruta--1"
          pathLength="1"
          style="--i: 0"
          d="M 600 452 C 690 282, 950 282, 1040 452"
        />
        <path
          class="cine-e5__ruta cine-e5__ruta--vieja cine-e5__ruta--2"
          pathLength="1"
          style="--i: 1"
          d="M 600 452 C 730 418, 910 488, 1040 452"
        />
        <path
          class="cine-e5__ruta cine-e5__ruta--vieja cine-e5__ruta--3"
          pathLength="1"
          style="--i: 2"
          d="M 600 452 C 690 622, 950 622, 1040 452"
        />
        <!-- La tercera del sector dos no reemplaza a la vieja: pasa por otro lado. -->
        <path
          class="cine-e5__ruta cine-e5__ruta--nueva"
          pathLength="1"
          style="--i: 2"
          d="M 600 452 C 740 480, 930 420, 1050 334"
        />
        <!-- Copias para los navegadores que no interpolan d: ahí se cruzan en vez de transformarse. -->
        <path
          class="cine-e5__ruta cine-e5__ruta--nueva cine-e5__ruta--respaldo"
          pathLength="1"
          style="--i: 0"
          d="M 600 452 C 640 320, 860 250, 1050 334"
        />
        <path
          class="cine-e5__ruta cine-e5__ruta--nueva cine-e5__ruta--respaldo"
          pathLength="1"
          style="--i: 1"
          d="M 600 452 C 720 400, 900 360, 1050 334"
        />

        <circle class="cine-e5__nodo cine-e5__nodo--a" cx="600" cy="452" r="13" />
        <g class="cine-e5__nodo cine-e5__nodo--b">
          <circle cx="1040" cy="452" r="15" />
          <circle class="cine-e5__nodo-centro" cx="1040" cy="452" r="5" />
        </g>
        <g class="cine-e5__nodo cine-e5__nodo--b2">
          <circle cx="1050" cy="334" r="15" />
          <circle class="cine-e5__nodo-centro" cx="1050" cy="334" r="5" />
        </g>
      </svg>

      <div class="k-actor cine-e5__sector" style="--x: 37; --y: 66.5; --w: 6.6">
        <div class="k-cuerpo">
          <span class="cine-e5__sector-k">sector</span>
          <span class="cine-e5__sector-n">
            <b class="cine-e5__n cine-e5__n--antes">1</b>
            <b class="cine-e5__n cine-e5__n--despues">2</b>
          </span>
        </div>
      </div>

      <div
        class="k-actor k-onda cine-e5__onda"
        style="--x: 51.25; --y: 64.39; --w: 9; --acento: #62c4ad"
      >
        <span style="--i: 0"></span><span style="--i: 1"></span><span style="--i: 2"></span>
      </div>

      <!-- El marcador: la punta del alfiler es el centro del actor, así cae justo sobre la ruta. -->
      <div class="k-actor cine-e5__marcador" style="--x: 51.25; --y: 36.06; --w: 4.2">
        <div class="k-cuerpo">
          <svg class="cine-e5__pin" viewBox="-24 -56 48 112">
            <ellipse class="cine-e5__pin-sombra" cx="0" cy="0" rx="11" ry="3.5" />
            <path
              class="cine-e5__pin-cuerpo"
              d="M 0 0 C -3 -8, -17 -18, -17 -32 A 17 17 0 1 1 17 -32 C 17 -18, 3 -8, 0 0 Z"
            />
            <path
              class="cine-e5__pin-borde cine-e5__pin-borde--derivado"
              d="M 0 0 C -3 -8, -17 -18, -17 -32 A 17 17 0 1 1 17 -32 C 17 -18, 3 -8, 0 0 Z"
            />
            <path
              class="cine-e5__pin-borde cine-e5__pin-borde--mano"
              d="M 0 0 C -3 -8, -17 -18, -17 -32 A 17 17 0 1 1 17 -32 C 17 -18, 3 -8, 0 0 Z"
            />
            <circle class="cine-e5__pin-ojo" cx="0" cy="-32" r="6.5" />
          </svg>
          <!-- El puntero de la Nave B: llega desde ella, arrastra, suelta y se va. -->
          <div class="cine-e5__mano">
            <div class="cine-e5__mano-suelta">
              <svg viewBox="-2 -2 18 25">
                <path d="M 0 0 L 0 18 L 4.6 13.8 L 7.6 20.6 L 10.8 19.2 L 7.8 12.6 L 13.8 12.6 Z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="k-actor k-nave" style="--x: 15; --y: 40; --w: 6.2; --i: 0">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div class="k-actor k-nave k-nave--cap" style="--x: 22; --y: 56; --w: 7.4; --i: 1">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave-cap" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div class="k-actor k-nave cine-e5__nave-b" style="--x: 14.5; --y: 72; --w: 6.2; --i: 2">
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
    .cine-e5__lejos line {
      stroke: #cdc3ad;
      stroke-width: 3;
      stroke-dasharray: 2 10;
      stroke-linecap: round;
    }
    .cine-e5__lejos circle {
      fill: #efe7d4;
      stroke: #cdc3ad;
      stroke-width: 3;
    }

    /* ---- El mapa: el entorno llega primero y en voz baja, para que la tarjeta se siga leyendo ---- */
    .cine-e5__placa {
      opacity: 0;
      transition: opacity 600ms ease-out;
    }
    .cine.b-mapa-rutas .cine-e5__placa {
      opacity: 1;
    }
    .cine-e5__placa-fondo {
      fill: #f2ebd9;
    }
    .cine-e5__placa-borde {
      fill: none;
      stroke: #ddd3bd;
      stroke-width: 3;
    }
    .cine-e5__grilla-punto {
      fill: #d6cbb2;
    }
    /* Correrse dos casilleros termina igual que empezó: se lee como paneo, no como otro mapa. */
    .cine-e5__grilla {
      transition: transform 1100ms var(--resorte-suave, ease-out);
    }
    .cine.b-sector-nuevo .cine-e5__grilla {
      transform: translateX(-80px);
    }

    .cine-e5__sector {
      aspect-ratio: 2.3 / 1;
    }
    .cine-e5__sector > .k-cuerpo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.45em;
      height: 100%;
      aspect-ratio: 2.3 / 1;
      border-radius: 8px;
      border: 2px solid #cdc3ad;
      background: #fbf8ef;
      opacity: 0;
      transform: translateY(1.6cqh);
      transition:
        opacity 400ms ease-out 250ms,
        transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out) 250ms;
    }
    .cine.b-mapa-rutas .cine-e5__sector > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    .cine-e5__sector-k {
      font:
        600 clamp(6px, 0.85cqw, 12px) / 1 ui-monospace,
        Menlo,
        Consolas,
        monospace;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #6b6252;
    }
    /* El número del sector cambia como un odómetro: el viejo sale por arriba, el nuevo sube. */
    .cine-e5__sector-n {
      display: grid;
      overflow: hidden;
    }
    .cine-e5__n {
      grid-area: 1 / 1;
      font:
        700 clamp(9px, 1.8cqw, 26px) / 1.1 ui-monospace,
        Menlo,
        Consolas,
        monospace;
      color: #c7771a;
      transition:
        opacity 240ms ease-out,
        transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out);
    }
    .cine-e5__n--despues {
      opacity: 0;
      transform: translateY(90%);
    }
    .cine.b-sector-nuevo .cine-e5__n--antes {
      opacity: 0;
      transform: translateY(-90%);
    }
    .cine.b-sector-nuevo .cine-e5__n--despues {
      opacity: 1;
      transform: none;
    }

    /* ---- Las rutas (la fuente, ámbar). La elegida va plena; las otras, en ámbar lavado ---- */
    .cine-e5__ruta {
      fill: none;
      stroke: #efc68b;
      stroke-width: 8;
      stroke-linecap: round;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
    }
    .cine.b-titulo-rincon .cine-e5__ruta--vieja {
      stroke-dashoffset: 0;
      transition:
        stroke-dashoffset 900ms var(--resorte-suave, ease-out) calc(var(--i, 0) * 140ms),
        stroke 420ms ease-out 1150ms;
    }
    .cine.b-titulo-rincon .cine-e5__ruta--1 {
      stroke: #e0861f;
    }
    .cine.b-mano-pisa .cine-e5__ruta {
      transition:
        stroke-dashoffset 900ms var(--resorte-suave, ease-out) calc(var(--i, 0) * 140ms),
        stroke 420ms ease-out 1440ms;
    }
    .cine.b-mano-pisa .cine-e5__ruta--1 {
      stroke: #efc68b;
    }
    .cine.b-mano-pisa .cine-e5__ruta--3 {
      stroke: #e0861f;
    }
    /* Sector nuevo: la 1 y la 2 se transforman, la 3 se borra hacia adelante y no vuelve. Ninguna
       queda elegida: la lista nueva no tiene la ruta que se marcó a mano. */
    .cine.b-sector-nuevo .cine-e5__ruta {
      transition:
        d 950ms cubic-bezier(0.65, 0, 0.35, 1) 150ms,
        stroke-dashoffset 620ms cubic-bezier(0.55, 0, 0.9, 0.4),
        opacity 380ms ease-in 240ms,
        stroke 300ms ease-out;
    }
    .cine.b-sector-nuevo .cine-e5__ruta--1 {
      d: path('M 600 452 C 640 320, 860 250, 1050 334');
    }
    .cine.b-sector-nuevo .cine-e5__ruta--2 {
      d: path('M 600 452 C 720 400, 900 360, 1050 334');
    }
    .cine.b-sector-nuevo .cine-e5__ruta--3 {
      stroke-dashoffset: -1;
      opacity: 0;
    }
    .cine.b-sector-nuevo .cine-e5__ruta--nueva {
      stroke-dashoffset: 0;
      transition: stroke-dashoffset 900ms var(--resorte-suave, ease-out) 450ms;
    }
    .cine-e5__ruta--respaldo {
      display: none;
    }
    @supports not (d: path('M 0 0')) {
      .cine-e5__ruta--respaldo {
        display: inline;
      }
      .cine.b-sector-nuevo .cine-e5__ruta--1,
      .cine.b-sector-nuevo .cine-e5__ruta--2 {
        opacity: 0;
      }
    }

    /* ---- Partida y destino ---- */
    .cine-e5__nodo {
      fill: #fbf8ef;
      stroke: #3a342a;
      stroke-width: 4;
      transform-box: fill-box;
      transform-origin: center;
      transform: scale(0);
      transition: transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out);
    }
    .cine-e5__nodo-centro {
      fill: #3a342a;
      stroke: none;
    }
    .cine.b-titulo-rincon .cine-e5__nodo--a {
      transform: none;
    }
    .cine.b-titulo-rincon .cine-e5__nodo--b {
      transform: none;
      transition-delay: 700ms;
    }
    .cine.b-sector-nuevo .cine-e5__nodo--b {
      opacity: 0;
      transform: scale(0.5);
      transition:
        opacity 240ms ease-in,
        transform 240ms ease-in;
    }
    .cine.b-sector-nuevo .cine-e5__nodo--b2 {
      transform: none;
      transition-delay: 820ms;
    }

    /* ---- El marcador (el derivado, menta) ---- */
    .cine-e5__marcador {
      aspect-ratio: 48 / 112;
      pointer-events: none;
    }
    .cine-e5__marcador > .k-cuerpo {
      position: relative;
      aspect-ratio: 48 / 112;
      opacity: 0;
      transform: translateY(-12cqh) scale(0.7);
      transition:
        opacity 220ms linear 900ms,
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out) 900ms;
    }
    .cine.b-titulo-rincon .cine-e5__marcador > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    /* Sin ruta abajo, se despega del mapa: queda flotando. */
    .cine.b-marcador-suspenso .cine-e5__marcador > .k-cuerpo {
      transform: translateY(-2.2cqh);
      transition: transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out);
    }

    /* El arrastre recorre una curva en porcentaje del lienzo (offset-path con shape()), así la
       trayectoria escala con la pantalla. Chrome cierra el shape() (100% vuelve al inicio): la curva
       va y vuelve por el mismo camino y la ruta 3 queda exacta en el 50%. Sin shape(), baja derecho
       con un transform. */
    .cine.b-mano-pisa .cine-e5__marcador {
      transform: translateY(28.33cqh);
      transition: transform 900ms cubic-bezier(0.6, 0, 0.3, 1) 540ms;
    }
    @supports (offset-path: shape(from 0% 0%, line to 100% 100%)) {
      .cine-e5 .cine-e5__marcador {
        left: 0;
        top: 0;
        translate: none;
        offset-path: shape(
          from 51.25% 36.06%,
          curve to 51.25% 64.39% with 60.5% 41% / 60.5% 59.5%,
          curve to 51.25% 36.06% with 60.5% 59.5% / 60.5% 41%
        );
        offset-anchor: 50% 50%;
        offset-rotate: 0deg;
        offset-distance: 0%;
      }
      .cine.b-mano-pisa .cine-e5__marcador {
        transform: none;
        offset-distance: 50%;
        transition: offset-distance 900ms cubic-bezier(0.6, 0, 0.3, 1) 540ms;
      }
    }

    .cine-e5__pin {
      transform-origin: 50% 50%;
    }
    /* Agarre, viaje y caída en un solo pulso: se levanta cuando llega el puntero, viaja alzado y al
       soltarse aplasta y rebota sobre la ruta nueva. */
    .cine.b-mano-pisa .cine-e5__pin {
      animation: cine-e5-agarre 1500ms linear 420ms both;
    }
    .cine.b-marcador-suspenso .cine-e5__pin {
      animation: cine-e5-duda 600ms ease-in-out 480ms infinite;
    }
    .cine-e5__pin-sombra {
      fill: #201d16;
      opacity: 0.18;
      transition: opacity 300ms ease-out;
    }
    .cine.b-marcador-suspenso .cine-e5__pin-sombra {
      opacity: 0;
    }
    .cine-e5__pin-cuerpo {
      fill: #dcf2ea;
    }
    .cine-e5__pin-borde {
      fill: none;
      stroke-width: 3.4;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: opacity 260ms ease-out 1440ms;
    }
    /* Derivado = punteado, como la molécula del capítulo 2. Puesto a mano = borde entero. */
    .cine-e5__pin-borde--derivado {
      stroke: #3f9e89;
      stroke-dasharray: 0.1 6.4;
    }
    .cine-e5__pin-borde--mano {
      stroke: #2b8672;
      opacity: 0;
    }
    .cine.b-mano-pisa .cine-e5__pin-borde--derivado {
      opacity: 0;
    }
    .cine.b-mano-pisa .cine-e5__pin-borde--mano {
      opacity: 1;
    }
    .cine-e5__pin-ojo {
      fill: #62c4ad;
    }

    /* El puntero entra desde la Nave B (abajo a la izquierda). Dos capas: la de afuera aparece, la
       de adentro suelta y se va, así el estado final (puntero ido) no necesita keyframes. */
    .cine-e5__mano {
      position: absolute;
      left: 55.8%;
      top: 22%;
      width: 62%;
      opacity: 0;
      transform: translate(-20cqw, 20cqh);
      transition:
        opacity 200ms linear,
        transform 480ms var(--resorte-suave, ease-out);
    }
    .cine.b-mano-pisa .cine-e5__mano {
      opacity: 1;
      transform: none;
    }
    .cine-e5__mano-suelta {
      transition:
        opacity 280ms ease-in 1640ms,
        transform 420ms ease-out 1560ms;
    }
    .cine.b-mano-pisa .cine-e5__mano-suelta {
      opacity: 0;
      transform: translate(1.4cqw, -2.4cqh);
    }
    .cine-e5__mano path {
      fill: #c9b6ea;
      stroke: #201d16;
      stroke-width: 1.6;
      stroke-linejoin: round;
    }

    .cine-e5__onda {
      pointer-events: none;
    }
    .cine.b-mano-pisa .cine-e5__onda > span {
      animation-name: cine-onda;
      animation-delay: calc(1440ms + var(--i, 0) * 0.24s);
      animation-fill-mode: none;
    }

    /* ---- La Nave B: se inclina hacia el mapa al marcar, y se achica cuando su ruta se va ---- */
    .cine-e5__nave-b {
      transition: transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out);
    }
    .cine.b-mano-pisa .cine-e5__nave-b {
      transform: translateX(1.2cqw) rotate(-9deg);
    }
    .cine.b-marcador-suspenso .cine-e5__nave-b {
      transform: translateX(-0.4cqw) rotate(7deg);
    }

    @keyframes cine-e5-agarre {
      0% {
        transform: none;
        animation-timing-function: cubic-bezier(0.3, 0, 0.3, 1);
      }
      10% {
        transform: translateY(-14%) scale(1.06);
      }
      68% {
        transform: translateY(-14%) scale(1.06);
        animation-timing-function: cubic-bezier(0.5, 0, 0.9, 0.6);
      }
      78% {
        transform: scale(1.14, 0.84);
        animation-timing-function: ease-out;
      }
      89% {
        transform: scale(0.96, 1.05);
        animation-timing-function: ease-in-out;
      }
      100% {
        transform: none;
      }
    }
    @keyframes cine-e5-duda {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.3;
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Escena05Component {}
