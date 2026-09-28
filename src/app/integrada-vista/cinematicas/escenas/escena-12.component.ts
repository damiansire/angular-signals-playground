import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Final · Quien lee, vuelve. La molécula entera del recorrido (la misma espiral de doce átomos que
 * el jugador cruzó) se enciende en orden; solo brillan los capítulos que estableció, el resto
 * queda punteado: es la deuda visible de la partida. En el borde derecho se abre la salida, un
 * iris dorado, entero si no quedó deuda y a medias si quedó. Con la salida entera la exploradora
 * entra, busca a la tripulación y se van los cuatro por el iris; a medias, ella se asoma, la
 * tripulación va hacia la salida y se da vuelta: este mundo también es casa.
 *
 * Técnicas: la cadena punteada se REVELA con una máscara cuyo trazo se dibuja (como el hilo del
 * capítulo 1), y los enlaces dorados se dibujan encima uno por uno con stroke-dashoffset, solo
 * donde los dos extremos están establecidos (clases `e-<n>` del reproductor). Un cometa recorre
 * la molécula entera hasta la salida. El iris es un clip-path circle(). Las naves vuelan por
 * offset-path con shape() en porcentaje del lienzo (así la ruta escala con él), y la vuelta de
 * la variante incompleta es una transición de offset-rotate de `auto` a `auto 180deg`.
 */
@Component({
  selector: 'app-escena-12',
  template: `
    <div class="k-mundo cine-e12">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <radialGradient id="cine-e12-brillo">
            <stop offset="0" stop-color="#f2c27a" stop-opacity="0.5" />
            <stop offset="0.55" stop-color="#f2c27a" stop-opacity="0.16" />
            <stop offset="1" stop-color="#f2c27a" stop-opacity="0" />
          </radialGradient>
          <mask
            id="cine-e12-revela-cadena"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1600"
            height="900"
          >
            <path
              class="cine-e12__revela cine-e12__revela--cadena"
              pathLength="1"
              d="M 768.7 437.4 Q 768.7 375.5 768.7 313.6 Q 827.3 301 865.9 335.1 Q 922.8 370.8 926.9 429.4 Q 944.6 501.6 902 551.8 Q 861 622.3 788.3 629.4 Q 702.9 653.6 640.1 603.7 Q 555.3 558.6 543.8 471.9 Q 511.7 373.9 567.7 297.6 Q 615.5 198.1 715.8 180.7 Q 825.9 139.3 916.3 200.2 Q 1031.1 249.3 1055.8 362.9"
            />
          </mask>
          <mask
            id="cine-e12-revela-ruta"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1600"
            height="900"
          >
            <path
              class="cine-e12__revela cine-e12__revela--ruta"
              pathLength="1"
              d="M 1055.8 362.9 C 1170 326, 1290 398, 1420 360"
            />
          </mask>
        </defs>

        <g class="cine-e12__lejos">
          <line x1="70" y1="150" x2="180" y2="96" />
          <line x1="180" y1="96" x2="270" y2="170" />
          <line x1="1020" y1="820" x2="1130" y2="780" />
          <circle cx="70" cy="150" r="11" />
          <circle cx="180" cy="96" r="8" />
          <circle cx="270" cy="170" r="10" />
          <circle cx="1020" cy="820" r="9" />
          <circle cx="1130" cy="780" r="12" />
        </g>

        <circle class="cine-e12__brillo" cx="800" cy="405" r="380" fill="url(#cine-e12-brillo)" />

        <!-- La cadena del recorrido, punteada: lo que existe aunque no se haya establecido. -->
        <path
          class="cine-e12__cadena"
          mask="url(#cine-e12-revela-cadena)"
          d="M 768.7 437.4 Q 768.7 375.5 768.7 313.6 Q 827.3 301 865.9 335.1 Q 922.8 370.8 926.9 429.4 Q 944.6 501.6 902 551.8 Q 861 622.3 788.3 629.4 Q 702.9 653.6 640.1 603.7 Q 555.3 558.6 543.8 471.9 Q 511.7 373.9 567.7 297.6 Q 615.5 198.1 715.8 180.7 Q 825.9 139.3 916.3 200.2 Q 1031.1 249.3 1055.8 362.9"
        />
        <path
          class="cine-e12__ruta-punteada"
          mask="url(#cine-e12-revela-ruta)"
          d="M 1055.8 362.9 C 1170 326, 1290 398, 1420 360"
        />

        <!-- Los enlaces dorados: uno por par de capítulos consecutivos. -->
        <path
          class="k-trazo cine-e12__enlace cine-e12__enlace--1"
          style="--i: 1"
          pathLength="1"
          d="M 768.7 437.4 Q 768.7 375.5 768.7 313.6"
        />
        <path
          class="k-trazo cine-e12__enlace cine-e12__enlace--2"
          style="--i: 2"
          pathLength="1"
          d="M 768.7 313.6 Q 827.3 301 865.9 335.1"
        />
        <path
          class="k-trazo cine-e12__enlace cine-e12__enlace--3"
          style="--i: 3"
          pathLength="1"
          d="M 865.9 335.1 Q 922.8 370.8 926.9 429.4"
        />
        <path
          class="k-trazo cine-e12__enlace cine-e12__enlace--4"
          style="--i: 4"
          pathLength="1"
          d="M 926.9 429.4 Q 944.6 501.6 902 551.8"
        />
        <path
          class="k-trazo cine-e12__enlace cine-e12__enlace--5"
          style="--i: 5"
          pathLength="1"
          d="M 902 551.8 Q 861 622.3 788.3 629.4"
        />
        <path
          class="k-trazo cine-e12__enlace cine-e12__enlace--6"
          style="--i: 6"
          pathLength="1"
          d="M 788.3 629.4 Q 702.9 653.6 640.1 603.7"
        />
        <path
          class="k-trazo cine-e12__enlace cine-e12__enlace--7"
          style="--i: 7"
          pathLength="1"
          d="M 640.1 603.7 Q 555.3 558.6 543.8 471.9"
        />
        <path
          class="k-trazo cine-e12__enlace cine-e12__enlace--8"
          style="--i: 8"
          pathLength="1"
          d="M 543.8 471.9 Q 511.7 373.9 567.7 297.6"
        />
        <path
          class="k-trazo cine-e12__enlace cine-e12__enlace--9"
          style="--i: 9"
          pathLength="1"
          d="M 567.7 297.6 Q 615.5 198.1 715.8 180.7"
        />
        <path
          class="k-trazo cine-e12__enlace cine-e12__enlace--10"
          style="--i: 10"
          pathLength="1"
          d="M 715.8 180.7 Q 825.9 139.3 916.3 200.2"
        />
        <path
          class="k-trazo cine-e12__enlace cine-e12__enlace--11"
          style="--i: 11"
          pathLength="1"
          d="M 916.3 200.2 Q 1031.1 249.3 1055.8 362.9"
        />
        <path
          class="k-trazo cine-e12__ruta"
          pathLength="1"
          d="M 1055.8 362.9 C 1170 326, 1290 398, 1420 360"
        />

        <!-- El cometa: la molécula entera avisa, de punta a punta, y la salida se abre. -->
        <path
          class="cine-e12__cometa"
          pathLength="1"
          d="M 768.7 437.4 Q 768.7 375.5 768.7 313.6 Q 827.3 301 865.9 335.1 Q 922.8 370.8 926.9 429.4 Q 944.6 501.6 902 551.8 Q 861 622.3 788.3 629.4 Q 702.9 653.6 640.1 603.7 Q 555.3 558.6 543.8 471.9 Q 511.7 373.9 567.7 297.6 Q 615.5 198.1 715.8 180.7 Q 825.9 139.3 916.3 200.2 Q 1031.1 249.3 1055.8 362.9 C 1170 326, 1290 398, 1420 360"
        />
      </svg>

      <!-- Los doce átomos, en el orden de la cadena (0 al centro). -->
      <div class="k-actor cine-e12__atomo cine-e12__atomo--0" style="--x: 48.04; --y: 48.6; --i: 0">
        <span class="k-cuerpo"><span class="cine-e12__oro"></span></span>
      </div>
      <div
        class="k-actor cine-e12__atomo cine-e12__atomo--1"
        style="--x: 48.04; --y: 34.84; --i: 1"
      >
        <span class="k-cuerpo"><span class="cine-e12__oro"></span></span>
      </div>
      <div
        class="k-actor cine-e12__atomo cine-e12__atomo--2"
        style="--x: 54.12; --y: 37.23; --i: 2"
      >
        <span class="k-cuerpo"><span class="cine-e12__oro"></span></span>
      </div>
      <div
        class="k-actor cine-e12__atomo cine-e12__atomo--3"
        style="--x: 57.93; --y: 47.71; --i: 3"
      >
        <span class="k-cuerpo"><span class="cine-e12__oro"></span></span>
      </div>
      <div
        class="k-actor cine-e12__atomo cine-e12__atomo--4"
        style="--x: 56.38; --y: 61.31; --i: 4"
      >
        <span class="k-cuerpo"><span class="cine-e12__oro"></span></span>
      </div>
      <div
        class="k-actor cine-e12__atomo cine-e12__atomo--5"
        style="--x: 49.27; --y: 69.93; --i: 5"
      >
        <span class="k-cuerpo"><span class="cine-e12__oro"></span></span>
      </div>
      <div class="k-actor cine-e12__atomo cine-e12__atomo--6" style="--x: 40; --y: 67.08; --i: 6">
        <span class="k-cuerpo"><span class="cine-e12__oro"></span></span>
      </div>
      <div
        class="k-actor cine-e12__atomo cine-e12__atomo--7"
        style="--x: 33.99; --y: 52.44; --i: 7"
      >
        <span class="k-cuerpo"><span class="cine-e12__oro"></span></span>
      </div>
      <div
        class="k-actor cine-e12__atomo cine-e12__atomo--8"
        style="--x: 35.48; --y: 33.07; --i: 8"
      >
        <span class="k-cuerpo"><span class="cine-e12__oro"></span></span>
      </div>
      <div
        class="k-actor cine-e12__atomo cine-e12__atomo--9"
        style="--x: 44.74; --y: 20.08; --i: 9"
      >
        <span class="k-cuerpo"><span class="cine-e12__oro"></span></span>
      </div>
      <div
        class="k-actor cine-e12__atomo cine-e12__atomo--10"
        style="--x: 57.27; --y: 22.25; --i: 10"
      >
        <span class="k-cuerpo"><span class="cine-e12__oro"></span></span>
      </div>
      <div
        class="k-actor cine-e12__atomo cine-e12__atomo--11"
        style="--x: 65.99; --y: 40.32; --i: 11"
      >
        <span class="k-cuerpo"><span class="cine-e12__oro"></span></span>
      </div>

      <!-- La salida: un iris en el borde, con el espacio de afuera adentro. -->
      <div class="k-actor cine-e12__iris" style="--x: 92; --y: 40; --w: 11">
        <div class="k-cuerpo">
          <span class="cine-e12__portal"><span class="cine-e12__giro"></span></span>
          <span class="cine-e12__aro"></span>
        </div>
      </div>
      <div class="k-actor k-transmision" style="--x: 92; --y: 40; --w: 8">
        <span style="--i: 0"></span><span style="--i: 1"></span><span style="--i: 2"></span>
      </div>
      <div
        class="k-actor k-onda cine-e12__onda"
        style="--x: 92; --y: 40; --w: 13; --acento: #c98a2a"
      >
        <span style="--i: 0"></span><span style="--i: 1"></span><span style="--i: 2"></span>
      </div>

      <div
        class="k-actor k-nave cine-e12__vuela cine-e12__nave--a"
        style="--x: 15; --y: 40; --w: 6.4; --i: 0; --orden: 1"
      >
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div
        class="k-actor k-nave k-nave--cap cine-e12__vuela cine-e12__nave--cap"
        style="--x: 21; --y: 56; --w: 7.6; --i: 1; --orden: 2"
      >
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave-cap" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div
        class="k-actor k-nave cine-e12__vuela cine-e12__nave--b"
        style="--x: 12; --y: 71; --w: 6.4; --i: 2; --orden: 3"
      >
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div
        class="k-actor k-nave k-nave--4 cine-e12__vuela cine-e12__nave4"
        style="--x: 91; --y: 40; --w: 6.4; --orden: 0"
      >
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
    .cine-e12__lejos line {
      stroke: #cdc3ad;
      stroke-width: 3;
      stroke-dasharray: 2 10;
      stroke-linecap: round;
    }
    .cine-e12__lejos circle {
      fill: #efe7d4;
      stroke: #cdc3ad;
      stroke-width: 3;
    }

    /* ---- La molécula: primero existe (punteada), después se enciende lo establecido ---- */
    .cine-e12__brillo {
      opacity: 0;
      transition: opacity 1400ms ease-out 500ms;
    }
    .cine.b-titulo-rincon .cine-e12__brillo {
      opacity: 0.4;
    }
    .cine.cine--completo.b-titulo-rincon .cine-e12__brillo {
      opacity: 1;
    }

    .cine-e12__cadena,
    .cine-e12__ruta-punteada {
      fill: none;
      stroke: #9d9179;
      stroke-width: 4.5;
      stroke-linecap: round;
      stroke-dasharray: 0.5 13;
    }
    .cine-e12__revela {
      fill: none;
      stroke: #fff;
      stroke-width: 44;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
    }
    .cine-e12__revela--cadena {
      transition: stroke-dashoffset 1300ms var(--resorte-suave, ease-out);
    }
    .cine.b-molecula-entera .cine-e12__revela--cadena {
      stroke-dashoffset: 0;
    }
    .cine-e12__revela--ruta {
      transition: stroke-dashoffset 900ms var(--resorte-suave, ease-out) 200ms;
    }
    .cine.b-salida-iris .cine-e12__revela--ruta {
      stroke-dashoffset: 0;
    }

    .cine-e12__enlace,
    .cine-e12__ruta {
      stroke: #c98a2a;
      stroke-width: 6;
      stroke-linecap: round;
    }
    .cine-e12__enlace {
      --trazo-ms: 420ms;
      --trazo-delay: calc(var(--i) * 120ms);
    }
    /* Un enlace se enciende solo si el jugador estableció los dos capítulos que une. */
    :is(
      .cine.b-titulo-rincon.e-0.e-1 .cine-e12__enlace--1,
      .cine.b-titulo-rincon.e-1.e-2 .cine-e12__enlace--2,
      .cine.b-titulo-rincon.e-2.e-3 .cine-e12__enlace--3,
      .cine.b-titulo-rincon.e-3.e-4 .cine-e12__enlace--4,
      .cine.b-titulo-rincon.e-4.e-5 .cine-e12__enlace--5,
      .cine.b-titulo-rincon.e-5.e-6 .cine-e12__enlace--6,
      .cine.b-titulo-rincon.e-6.e-7 .cine-e12__enlace--7,
      .cine.b-titulo-rincon.e-7.e-8 .cine-e12__enlace--8,
      .cine.b-titulo-rincon.e-8.e-9 .cine-e12__enlace--9,
      .cine.b-titulo-rincon.e-9.e-10 .cine-e12__enlace--10,
      .cine.b-titulo-rincon.e-10.e-11 .cine-e12__enlace--11
    ) {
      stroke-dashoffset: 0;
    }

    /* Átomo: zócalo punteado (lo que existe), núcleo de oro (lo establecido) y su órbita. */
    .cine-e12__atomo {
      --w: 4.2;
      --e12-luz: 0;
      --e12-op: 1;
      aspect-ratio: 1 / 1;
    }
    .cine.b-titulo-rincon .cine-e12__atomo {
      --e12-op: 0.55;
    }
    :is(
      .cine.b-titulo-rincon.e-0 .cine-e12__atomo--0,
      .cine.b-titulo-rincon.e-1 .cine-e12__atomo--1,
      .cine.b-titulo-rincon.e-2 .cine-e12__atomo--2,
      .cine.b-titulo-rincon.e-3 .cine-e12__atomo--3,
      .cine.b-titulo-rincon.e-4 .cine-e12__atomo--4,
      .cine.b-titulo-rincon.e-5 .cine-e12__atomo--5,
      .cine.b-titulo-rincon.e-6 .cine-e12__atomo--6,
      .cine.b-titulo-rincon.e-7 .cine-e12__atomo--7,
      .cine.b-titulo-rincon.e-8 .cine-e12__atomo--8,
      .cine.b-titulo-rincon.e-9 .cine-e12__atomo--9,
      .cine.b-titulo-rincon.e-10 .cine-e12__atomo--10,
      .cine.b-titulo-rincon.e-11 .cine-e12__atomo--11
    ) {
      --e12-luz: 1;
      --e12-op: 1;
      --e12-orbita: #c98a2a;
    }
    .cine-e12__atomo > .k-cuerpo {
      position: relative;
      aspect-ratio: 1 / 1;
      opacity: 0;
      transform: scale(0.4);
      transition:
        opacity 300ms ease-out calc(var(--i) * 70ms),
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out)
          calc(var(--i) * 70ms);
    }
    .cine.b-molecula-entera .cine-e12__atomo > .k-cuerpo {
      opacity: var(--e12-op);
      transform: none;
    }
    .cine-e12__atomo > .k-cuerpo::before,
    .cine-e12__atomo > .k-cuerpo::after,
    .cine-e12__oro {
      content: '';
      position: absolute;
      box-sizing: border-box;
      border-radius: 50%;
    }
    .cine-e12__atomo > .k-cuerpo::before {
      left: 30%;
      top: 30%;
      width: 40%;
      height: 40%;
      border: 2px dotted #9d9179;
      background: #f7f1e2;
    }
    .cine-e12__oro {
      left: 26%;
      top: 26%;
      width: 48%;
      height: 48%;
      background: radial-gradient(
        circle at 36% 32%,
        #fff2d2 0%,
        #eab252 42%,
        #c98a2a 70%,
        #86561a 100%
      );
      box-shadow:
        inset 0 -2px 5px rgba(80, 50, 10, 0.35),
        0 0 0 4px rgba(201, 138, 42, 0.18);
      opacity: var(--e12-luz);
      transform: scale(calc(0.4 + var(--e12-luz) * 0.6));
      transition:
        opacity 260ms ease-out calc(var(--i) * 120ms),
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out)
          calc(var(--i) * 120ms);
    }
    .cine-e12__atomo > .k-cuerpo::after {
      left: 0;
      top: 33%;
      width: 100%;
      height: 34%;
      border: 2px solid var(--e12-orbita, #d6ccb5);
      transform: rotate(-26deg);
      transition: border-color 420ms ease-out calc(var(--i) * 120ms);
    }

    /* ---- La salida ---- */
    .cine-e12__iris {
      aspect-ratio: 1 / 1;
      --e12-abre: 150ms;
    }
    .cine.cine--completo .cine-e12__iris {
      --e12-abre: 1150ms;
    }
    .cine-e12__iris > .k-cuerpo {
      position: relative;
      aspect-ratio: 1 / 1;
    }
    .cine-e12__portal,
    .cine-e12__aro,
    .cine-e12__giro {
      position: absolute;
      border-radius: 50%;
    }
    /* Adentro, el espacio de afuera: una luz al fondo y un par de estrellas. */
    .cine-e12__portal {
      inset: 0;
      overflow: hidden;
      background:
        radial-gradient(circle at 28% 66%, #fff8e6 0 1.2%, transparent 1.8%),
        radial-gradient(circle at 70% 30%, #fff8e6 0 1%, transparent 1.6%),
        radial-gradient(circle at 64% 76%, #fff8e6 0 0.8%, transparent 1.4%),
        radial-gradient(circle, #fff4da 0%, #f3cf8a 13%, #7b6f7e 32%, #3a3f5f 58%, #242840 100%);
      clip-path: circle(0% at 50% 50%);
      transition: clip-path 760ms var(--resorte-suave, ease-out) var(--e12-abre);
    }
    .cine-e12__giro {
      inset: 17%;
      border: 2px dashed rgba(246, 206, 134, 0.75);
    }
    .cine-e12__aro {
      inset: 0;
      border: 5px solid #c98a2a;
      box-shadow:
        0 0 0 7px rgba(201, 138, 42, 0.16),
        inset 0 0 0 2px rgba(255, 236, 196, 0.55);
      transform: scale(0);
      transition: transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out)
        var(--e12-abre);
    }
    .cine.cine--completo.b-salida-iris .cine-e12__portal {
      clip-path: circle(50% at 50% 50%);
    }
    .cine.cine--completo.b-salida-iris .cine-e12__aro {
      transform: none;
    }
    .cine.cine--incompleto.b-salida-iris .cine-e12__portal {
      clip-path: circle(25% at 50% 50%);
    }
    .cine.cine--incompleto.b-salida-iris .cine-e12__aro {
      transform: scale(0.5);
    }
    /* Lo único que gira en loop es la salida: es el foco del final. */
    .cine.b-salida-iris .cine-e12__giro {
      animation: cine-e12-giro 18s linear infinite;
    }
    .cine-e12__ruta {
      --trazo-ms: 620ms;
      --trazo-delay: 850ms;
    }
    .cine.cine--completo.b-salida-iris .cine-e12__ruta {
      stroke-dashoffset: 0;
    }
    .cine-e12__cometa {
      fill: none;
      stroke: #f6c867;
      stroke-width: 11;
      stroke-linecap: round;
      stroke-dasharray: 0.05 2;
      stroke-dashoffset: 0.08;
    }
    .cine.cine--completo.b-salida-iris .cine-e12__cometa {
      animation: cine-e12-cometa 1300ms cubic-bezier(0.45, 0, 0.3, 1) both;
    }
    .cine-e12__onda {
      pointer-events: none;
    }
    .cine.cine--completo.b-regreso .cine-e12__onda > span {
      animation-name: cine-onda;
      animation-delay: calc(2.2s + var(--i) * 0.24s);
    }

    /* ---- Las naves ---- */
    /* La exploradora no llega con la tripulación: aparece recién desde la salida. */
    .cine .k-actor.k-nave.cine-e12__nave4 > .k-cuerpo {
      opacity: 0;
      transform: scale(0.3);
      transition:
        opacity 220ms linear,
        transform 700ms var(--resorte-suave, ease-out);
    }
    .cine.b-nave4-entra .k-actor.k-nave.cine-e12__nave4 > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    .cine.cine--incompleto.b-nave4-entra .k-actor.k-nave.cine-e12__nave4 > .k-cuerpo {
      transform: scale(0.55);
    }
    /* Completo: entran al iris y se achican hasta perderse en la luz de afuera. */
    .cine.cine--completo.b-regreso .k-actor.cine-e12__vuela > .k-cuerpo {
      scale: 0.12;
      opacity: 0;
      transition:
        scale 520ms ease-in calc(var(--orden) * 200ms + 1350ms),
        opacity 260ms linear calc(var(--orden) * 200ms + 1620ms);
    }

    /* Los vuelos: rutas en porcentaje del lienzo (16:9 fijo), así escalan con él. */
    @supports (offset-path: shape(from 0 0, line to 1px 1px)) {
      .k-actor.cine-e12__vuela {
        translate: none;
        offset-rotate: auto;
        offset-distance: 0%;
      }
      .cine-e12__nave--a {
        offset-path: shape(
          from 15% 40%,
          curve to 50% 8.44% with 26.25% 40% / 29.38% 9.33%,
          curve to 92% 40% with 70% 7.56% / 83.75% 22.22%
        );
      }
      .cine-e12__nave--cap {
        offset-path: shape(
          from 21% 56%,
          curve to 53.75% 11.11% with 28.75% 56% / 26.88% 14.44%,
          curve to 92% 40% with 73.13% 9.78% / 85% 26.22%
        );
      }
      .cine-e12__nave--b {
        offset-path: shape(
          from 12% 71%,
          curve to 43.13% 12.44% with 26.25% 71% / 23.75% 18.89%,
          curve to 92% 40% with 62.5% 6.67% / 84.38% 16.67%
        );
      }
      /* Sale del iris, pasa por arriba de la molécula, frena junto a la tripulación (46.88 %),
         y la ruta sigue en un rulo de vuelta al iris: así el rebote al frenar tiene por dónde ir. */
      .cine-e12__nave4 {
        offset-path: shape(
          from 92% 40%,
          curve to 58.13% 6.67% with 83.13% 40% / 78.13% 7.11%,
          curve to 25% 27.78% with 40% 6.22% / 31.25% 27.78%,
          curve to 23.75% 12.22% with 20.63% 27.78% / 18.75% 15.56%,
          curve to 92% 40% with 37.5% 4.44% / 81.25% 7.78%
        );
      }

      .cine.cine--completo.b-nave4-entra .k-actor.cine-e12__nave4 {
        offset-distance: 46.88%;
        transition: offset-distance 1700ms cubic-bezier(0.22, 0.85, 0.3, 1.2);
      }
      .cine.cine--completo.b-regreso .k-actor.cine-e12__vuela {
        offset-distance: 99.9%;
        transition: offset-distance 1900ms cubic-bezier(0.5, 0, 0.25, 1) calc(var(--orden) * 200ms);
      }

      /* Incompleto: ella se asoma; la tripulación va hacia la salida y se da vuelta. */
      .cine.cine--incompleto.b-nave4-entra .k-actor.cine-e12__nave4 {
        offset-distance: 0.55%;
        transition: offset-distance 900ms var(--resorte-suave, ease-out);
      }
      .cine.cine--incompleto.b-nave4-entra .k-actor.cine-e12__vuela:not(.cine-e12__nave4) {
        transition: offset-distance 1600ms var(--resorte-suave, ease-out)
          calc((var(--orden) - 1) * 150ms);
      }
      .cine.cine--incompleto.b-nave4-entra .cine-e12__nave--a {
        offset-distance: 77%;
      }
      .cine.cine--incompleto.b-nave4-entra .cine-e12__nave--cap {
        offset-distance: 64.5%;
      }
      .cine.cine--incompleto.b-nave4-entra .cine-e12__nave--b {
        offset-distance: 56%;
      }
      .cine.cine--incompleto.b-regreso .k-actor.cine-e12__vuela:not(.cine-e12__nave4) {
        offset-rotate: auto 180deg;
        transition:
          offset-rotate 820ms cubic-bezier(0.55, 0, 0.3, 1) calc((var(--orden) - 1) * 120ms),
          offset-distance 1300ms var(--resorte-suave, ease-out)
            calc((var(--orden) - 1) * 120ms + 380ms);
      }
      .cine.cine--incompleto.b-regreso .cine-e12__nave--a {
        offset-distance: 71%;
      }
      .cine.cine--incompleto.b-regreso .cine-e12__nave--cap {
        offset-distance: 58.5%;
      }
      .cine.cine--incompleto.b-regreso .cine-e12__nave--b {
        offset-distance: 52%;
      }
    }

    @keyframes cine-e12-cometa {
      from {
        stroke-dashoffset: 0.08;
      }
      to {
        stroke-dashoffset: -1;
      }
    }
    @keyframes cine-e12-giro {
      to {
        transform: rotate(360deg);
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Escena12Component {}
