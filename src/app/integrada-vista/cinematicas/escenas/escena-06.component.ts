import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Capítulo 6 · El dato que todavía viaja. El pico del recorrido: la primera transmisión de la
 * exploradora. Al centro, una molécula menta punteada con tres ranuras (cargando, error, valor);
 * arriba a la derecha, la fuente. Una onda débil sale hacia las naves y se rompe a mitad de
 * camino; después dos paquetes viajan por el mismo camino, el segundo sale después y llega antes,
 * y la ranura de valor queda parpadeando entre los dos sin quedarse con ninguno.
 *
 * Técnicas: profundidad con tres planos (lejos, mundo, cerca) que se mueven distinto por transform
 * mientras los actores quedan quietos, que es lo que hace leer la cámara; la onda débil se REVELA
 * con una máscara cuyo trazo lleva un degradé que se apaga (por eso se corta antes de llegar), y su
 * punteado irregular fluye por dashoffset con una opacidad de ruido; el camino de los paquetes se
 * revela igual que el hilo del capítulo 1. Los paquetes siguen una curva sin `offset-path`: X e Y
 * viajan en dos envoltorios con curvas de tiempo distintas, y como las dos curvas son las mismas
 * para los dos paquetes, recorren el mismo camino aunque duren distinto (así el camino escala con
 * el lienzo, cosa que un `path()` en píxeles no hace). La ventana de la exploradora abre en iris.
 */
@Component({
  selector: 'app-escena-06',
  template: `
    <div class="k-mundo cine-e6" aria-hidden="true">
      <!-- Plano lejano: se mueve poco y al revés que el cercano; entre los dos queda la escena. -->
      <div class="cine-e6__capa cine-e6__capa--lejos">
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet">
          <line x1="150" y1="140" x2="236" y2="106" />
          <line x1="236" y1="106" x2="292" y2="168" />
          <line x1="520" y1="812" x2="606" y2="776" />
          <line x1="606" y1="776" x2="690" y2="826" />
          <line x1="1450" y1="300" x2="1510" y2="352" />
          <circle cx="150" cy="140" r="7" />
          <circle cx="236" cy="106" r="5" />
          <circle cx="292" cy="168" r="6" />
          <circle cx="520" cy="812" r="6" />
          <circle cx="606" cy="776" r="8" />
          <circle cx="690" cy="826" r="5" />
          <circle cx="1450" cy="300" r="6" />
          <circle cx="1510" cy="352" r="8" />
          <circle class="cine-e6__polvo" cx="1040" cy="120" r="3" />
          <circle class="cine-e6__polvo" cx="700" cy="86" r="2.5" />
          <circle class="cine-e6__polvo" cx="420" cy="700" r="2.5" />
        </svg>
      </div>

      <svg
        class="cine-e6__mundo"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="cine-e6-desvanece"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="-800"
            y2="0"
          >
            <stop offset="0" stop-color="#fff" />
            <stop offset="0.42" stop-color="#fff" />
            <stop offset="0.9" stop-color="#000" />
          </linearGradient>
          <mask
            id="cine-e6-revela-onda"
            maskUnits="userSpaceOnUse"
            x="-820"
            y="-70"
            width="860"
            height="140"
          >
            <path
              class="cine-e6__revela-onda"
              pathLength="1"
              stroke="url(#cine-e6-desvanece)"
              d="M 0 0 H -800"
            />
          </mask>
          <mask
            id="cine-e6-revela-camino"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1600"
            height="900"
          >
            <path
              class="cine-e6__revela-camino"
              pathLength="1"
              d="M 1408 117 C 1419 383, 1082 343, 901 374"
            />
          </mask>
        </defs>

        <g class="cine-e6__lejos">
          <line x1="1000" y1="772" x2="1090" y2="736" />
          <line x1="1090" y1="736" x2="1160" y2="792" />
          <circle cx="1000" cy="772" r="9" />
          <circle cx="1090" cy="736" r="12" />
          <circle cx="1160" cy="792" r="8" />
        </g>

        <!-- El rombo del riel: este capítulo es el pico. Acompaña a la tarjeta y se va con ella. -->
        <path
          class="k-trazo cine-e6__rombo"
          pathLength="1"
          d="M 800 250 L 824 274 L 800 298 L 776 274 Z"
        />

        <!-- El camino de los paquetes, de la fuente a la ranura de valor. -->
        <path
          class="cine-e6__camino"
          mask="url(#cine-e6-revela-camino)"
          d="M 1408 117 C 1419 383, 1082 343, 901 374"
        />

        <!-- La onda débil: horizontal en su propio sistema, girada hacia las naves. -->
        <g transform="translate(1352 140) rotate(-8.2)">
          <path
            class="cine-e6__onda-debil"
            mask="url(#cine-e6-revela-onda)"
            pathLength="1"
            d="M 0 0 q -18 -26 -36 0 t -36 0 t -36 0 t -36 0 t -36 0 t -36 0 t -36 0 t -36 0 t -36 0 t -36 0 t -36 0 t -36 0 t -36 0 t -36 0 t -36 0 t -36 0 t -36 0 t -36 0 t -36 0 t -36 0 t -36 0 t -36 0"
          />
        </g>
      </svg>

      <!-- La fuente: los anillos del kit, un brillo y la ventana de la exploradora. -->
      <div class="k-actor k-transmision cine-e6__fuente" style="--x: 88; --y: 13; --w: 8">
        <div class="cine-e6__brillo"></div>
        <span style="--i: 0"></span><span style="--i: 1"></span><span style="--i: 2"></span>
        <div class="cine-e6__ventana">
          <div class="cine-e6__iris">
            <svg class="cine-e6__exploradora" viewBox="-70 -40 140 80">
              <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
            </svg>
          </div>
        </div>
      </div>

      <!-- El héroe: la molécula del recurso, punteada porque su valor todavía no llegó. -->
      <div class="k-actor cine-e6__heroe" style="--x: 50; --y: 48; --w: 22">
        <div class="k-cuerpo">
          <span class="cine-e6__halo"></span>
          <svg class="cine-e6__mol" viewBox="-100 -100 200 200">
            <circle class="cine-e6__membrana" r="95" />
            <path class="k-trazo cine-e6__enlace" pathLength="1" d="M 23.4 -13.5 L 38.1 -22" />
            <path class="k-trazo cine-e6__enlace" pathLength="1" d="M -23.4 -13.5 L -38.1 -22" />
            <path class="k-trazo cine-e6__enlace" pathLength="1" d="M 0 27 L 0 44" />
            <circle class="cine-e6__nucleo" r="25" />
          </svg>
          <span class="k-onda cine-e6__onda">
            <span style="--d: 2450ms"></span><span style="--d: 2690ms"></span
            ><span style="--d: 3050ms"></span>
          </span>
          <span
            class="cine-e6__ranura cine-e6__ranura--carga"
            style="--rx: 21.42; --ry: 33.5; --i: 0"
          >
            <svg class="cine-e6__arco" viewBox="-12 -12 24 24">
              <circle class="cine-e6__pista" r="8.5" />
              <circle class="cine-e6__giro" r="8.5" pathLength="1" />
            </svg>
          </span>
          <span class="cine-e6__ranura cine-e6__ranura--error" style="--rx: 50; --ry: 83; --i: 1">
            <svg viewBox="-12 -12 24 24">
              <path d="M -4.5 -4.5 L 4.5 4.5 M 4.5 -4.5 L -4.5 4.5" />
            </svg>
          </span>
          <span
            class="cine-e6__ranura cine-e6__ranura--valor"
            style="--rx: 78.58; --ry: 33.5; --i: 2"
          >
            <b class="cine-e6__num cine-e6__num--8">8</b>
            <b class="cine-e6__num cine-e6__num--7">7</b>
          </span>
        </div>
      </div>

      <!-- Los paquetes: el A (la primera pregunta) sale antes y llega último. -->
      <div
        class="k-actor cine-e6__paquete cine-e6__paquete--a"
        style="--x: 56.29; --y: 41.54; --w: 2.8"
      >
        <div class="cine-e6__px">
          <div class="cine-e6__py">
            <div class="k-cuerpo"><b>7</b></div>
          </div>
        </div>
      </div>
      <div
        class="k-actor cine-e6__paquete cine-e6__paquete--b"
        style="--x: 56.29; --y: 41.54; --w: 2.8"
      >
        <div class="cine-e6__px">
          <div class="cine-e6__py">
            <div class="k-cuerpo"><b>8</b></div>
          </div>
        </div>
      </div>

      <div
        class="k-actor k-nave cine-e6__nave"
        style="--x: 14; --y: 38; --w: 6; --i: 0; --giro: -9deg"
      >
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div
        class="k-actor k-nave k-nave--cap cine-e6__nave"
        style="--x: 22; --y: 53; --w: 7.5; --i: 1; --giro: -15deg"
      >
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave-cap" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div
        class="k-actor k-nave cine-e6__nave"
        style="--x: 13; --y: 67; --w: 6; --i: 2; --giro: -19deg"
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

      <!-- Plano cercano: manchas fuera de foco delante de todo, las que más se mueven. Lejos de
           los bordes: con el lienzo en franjas, una mancha cortada contra el borde se ve como un
           corte duro, no como profundidad. -->
      <div class="cine-e6__capa cine-e6__capa--cerca">
        <i
          class="cine-e6__bokeh"
          style="--bx: 32; --by: 82; --bw: 10; --bc: rgba(98, 196, 173, 0.2)"
        ></i>
        <i
          class="cine-e6__bokeh"
          style="--bx: 64; --by: 9; --bw: 7; --bc: rgba(222, 206, 172, 0.45)"
        ></i>
        <i
          class="cine-e6__bokeh"
          style="--bx: 86; --by: 85; --bw: 6; --bc: rgba(98, 196, 173, 0.16)"
        ></i>
      </div>
    </div>
  `,
  styles: `
    /* Lo que se asoma al borde durante el movimiento de cámara queda adentro del lienzo. */
    .cine__lienzo .k-mundo.cine-e6 {
      overflow: hidden;
    }
    .cine-e6__mundo,
    .cine-e6__capa {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .cine-e6__capa > svg {
      display: block;
      width: 100%;
      height: 100%;
    }

    /* ---- Profundidad: la cámara entra y después gira hacia la señal ----
       Los actores no se mueven con la cámara: el lejano va para un lado y el cercano para el otro,
       y eso alcanza para que la escena tenga fondo. */
    .cine-e6__capa--lejos {
      transform: translate(2cqw, 1.2cqh) scale(1.05);
      transition: transform 2800ms cubic-bezier(0.2, 0.7, 0.2, 1);
    }
    .cine-e6__capa--cerca {
      transform: translate(-6cqw, 3cqh) scale(1.1);
      transition: transform 2800ms cubic-bezier(0.2, 0.7, 0.2, 1);
    }
    .cine.b-abre .cine-e6__capa--lejos,
    .cine.b-abre .cine-e6__capa--cerca {
      transform: none;
    }
    .cine.b-transmision .cine-e6__capa--lejos {
      transform: translate(0.8cqw, -0.6cqh);
    }
    .cine.b-transmision .cine-e6__capa--cerca {
      transform: translate(-2.5cqw, 1.5cqh);
    }
    .cine-e6__capa--lejos line {
      stroke: #ddd3bf;
      stroke-width: 2.5;
      stroke-dasharray: 2 9;
      stroke-linecap: round;
    }
    .cine-e6__capa--lejos circle {
      fill: #f3ecdc;
      stroke: #ddd3bf;
      stroke-width: 2.5;
    }
    .cine-e6__capa--lejos .cine-e6__polvo {
      fill: #ddd3bf;
      stroke: none;
    }
    .cine-e6__bokeh {
      position: absolute;
      left: calc(var(--bx) * 1%);
      top: calc(var(--by) * 1%);
      width: calc(var(--bw) * 1%);
      aspect-ratio: 1 / 1;
      translate: -50% -50%;
      border-radius: 50%;
      background: radial-gradient(circle closest-side, var(--bc) 0 34%, transparent 100%);
    }

    .cine-e6__lejos line {
      stroke: #cdc3ad;
      stroke-width: 3;
      stroke-dasharray: 2 10;
      stroke-linecap: round;
    }
    .cine-e6__lejos circle {
      fill: #efe7d4;
      stroke: #cdc3ad;
      stroke-width: 3;
    }

    /* ---- El rombo: llega con la tarjeta y se va con ella ---- */
    .cine-e6__rombo {
      stroke: #3fa58c;
      stroke-width: 4;
      stroke-linejoin: round;
      transition:
        stroke-dashoffset 900ms var(--resorte-suave, ease-out) 320ms,
        opacity 240ms ease-in;
    }
    .cine.b-titulo .cine-e6__rombo {
      stroke-dashoffset: 0;
    }
    .cine.b-titulo-rincon .cine-e6__rombo {
      opacity: 0;
    }

    /* ---- El héroe: entra cuando la tarjeta le deja el centro ---- */
    .cine-e6__heroe {
      aspect-ratio: 1 / 1;
    }
    .cine-e6__heroe > .k-cuerpo {
      position: relative;
      aspect-ratio: 1 / 1;
      opacity: 0;
      transform: scale(0.45) rotate(-24deg);
      transition:
        opacity 320ms ease-out,
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out);
    }
    .cine.b-estado-en-viaje.b-titulo-rincon .cine-e6__heroe > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    .cine-e6__halo {
      position: absolute;
      inset: -8%;
      border-radius: 50%;
      background: radial-gradient(
        circle closest-side,
        rgba(98, 196, 173, 0.4),
        rgba(98, 196, 173, 0.12) 62%,
        rgba(98, 196, 173, 0) 100%
      );
    }
    .cine-e6__heroe .cine-e6__mol {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .cine-e6__membrana {
      fill: none;
      stroke: #62c4ad;
      stroke-width: 1.6;
      stroke-dasharray: 3 8;
      stroke-linecap: round;
      opacity: 0.75;
    }
    .cine-e6__enlace {
      stroke: #3fa58c;
      stroke-width: 3;
      stroke-linecap: round;
      --trazo-ms: 500ms;
      --trazo-delay: 260ms;
    }
    .cine.b-estado-en-viaje.b-titulo-rincon .cine-e6__enlace {
      stroke-dashoffset: 0;
    }
    .cine-e6__nucleo {
      fill: #e3f4ee;
      stroke: #3fa58c;
      stroke-width: 3.5;
      stroke-dasharray: 7 5;
    }

    /* Las tres ranuras: aparecen de a una, después del cuerpo. */
    .cine-e6__ranura {
      position: absolute;
      left: calc(var(--rx) * 1%);
      top: calc(var(--ry) * 1%);
      width: 22%;
      aspect-ratio: 1 / 1;
      translate: -50% -50%;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: #fbf8ef;
      opacity: 0;
      transform: scale(0.3);
      transition:
        opacity 200ms ease-out calc(320ms + var(--i) * 80ms),
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out)
          calc(320ms + var(--i) * 80ms);
    }
    .cine.b-estado-en-viaje.b-titulo-rincon .cine-e6__ranura {
      opacity: 1;
      transform: none;
    }
    .cine-e6__ranura > svg {
      grid-area: 1 / 1;
    }
    .cine-e6__pista {
      fill: none;
      stroke: #d3ece4;
      stroke-width: 3;
    }
    .cine-e6__giro {
      fill: none;
      stroke: #2f9e7f;
      stroke-width: 3.2;
      stroke-linecap: round;
      stroke-dasharray: 0.3 0.7;
    }
    /* Lo único que no para: el que carga. */
    .cine.b-estado-en-viaje.b-titulo-rincon .cine-e6__arco {
      animation: cine-e6-gira 1.1s linear infinite;
    }
    .cine-e6__ranura--error {
      border: max(1.5px, 0.2cqw) dashed #cdc3ad;
    }
    .cine-e6__ranura--error path {
      fill: none;
      stroke: #bfb49e;
      stroke-width: 2.4;
      stroke-linecap: round;
    }
    .cine-e6__ranura--valor {
      border: max(1.5px, 0.24cqw) dashed #3fa58c;
    }

    /* El número cambia por cruce, como en el capítulo 1. */
    .cine-e6__num {
      grid-area: 1 / 1;
      font:
        700 clamp(9px, 2.2cqw, 34px) / 1 ui-monospace,
        Menlo,
        Consolas,
        monospace;
      color: #201d16;
      opacity: 0;
      transform: translateY(40%);
      transition:
        opacity 240ms ease-out,
        transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out);
    }

    /* ---- La transmisión: primero el brillo y la ventana cerrada ---- */
    .cine-e6__fuente {
      aspect-ratio: 1 / 1;
    }
    .cine-e6__brillo {
      position: absolute;
      inset: -45%;
      border-radius: 50%;
      background: radial-gradient(
        circle closest-side,
        rgba(47, 158, 127, 0.3),
        rgba(47, 158, 127, 0) 100%
      );
      opacity: 0;
      transform: scale(0.4);
      transition:
        opacity 500ms ease-out 260ms,
        transform 900ms var(--resorte-suave, ease-out) 260ms;
    }
    .cine.b-transmision .cine-e6__brillo {
      opacity: 1;
      transform: none;
    }
    .cine-e6__ventana {
      position: absolute;
      inset: 20%;
      display: grid;
      place-items: center;
      border-radius: 50%;
      border: max(1.5px, 0.16cqw) dashed #2f9e7f;
      background: #f4faf7;
      opacity: 0;
      transform: scale(0.2);
      transition:
        opacity 220ms ease-out 420ms,
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out) 420ms;
    }
    /* La señal sin dueño todavía: un punto verde en la ventana cerrada. */
    .cine-e6__ventana::before {
      content: '';
      grid-area: 1 / 1;
      width: 16%;
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      background: #2f9e7f;
    }
    .cine.b-transmision .cine-e6__ventana {
      opacity: 1;
      transform: none;
    }
    /* Cuando habla, la ventana se abre en iris y aparece ella. */
    .cine-e6__iris {
      grid-area: 1 / 1;
      display: grid;
      place-items: center;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: radial-gradient(circle at 50% 45%, #ffffff 0%, #e2f3ec 100%);
      clip-path: circle(0% at 50% 50%);
      transition: clip-path 760ms cubic-bezier(0.22, 0.9, 0.24, 1) 200ms;
    }
    .cine.b-onda-debil .cine-e6__iris {
      clip-path: circle(50% at 50% 50%);
    }
    .cine-e6__fuente .cine-e6__exploradora {
      width: 70%;
      color: #2f9e7f;
      transform: scaleX(-1);
    }

    /* Las naves oyen algo y giran hacia la fuente, de a una. */
    .cine-e6__nave {
      transition: transform 900ms var(--resorte-suave, ease-out) calc(520ms + var(--i) * 80ms);
    }
    .cine.b-transmision .cine-e6__nave {
      transform: rotate(var(--giro));
    }

    /* ---- La onda débil: se revela desde la fuente y se apaga antes de llegar ---- */
    .cine-e6__revela-onda {
      fill: none;
      stroke-width: 76;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      transition: stroke-dashoffset 1700ms cubic-bezier(0.3, 0.6, 0.3, 1);
    }
    .cine.b-onda-debil .cine-e6__revela-onda {
      stroke-dashoffset: 0;
    }
    .cine-e6__onda-debil {
      fill: none;
      stroke: #2f9e7f;
      stroke-width: 4;
      stroke-linecap: round;
      stroke-dasharray: 0.045 0.012 0.018 0.03 0.07 0.015 0.008 0.022 0.03 0.05;
      opacity: 0.6;
    }
    /* Entrecortada: el punteado fluye hacia las naves y la opacidad tartamudea. Unas vueltas y
       queda quieta, apagada: la señal no llegó entera. */
    .cine.b-onda-debil .cine-e6__onda-debil {
      animation:
        cine-e6-fluye 1.2s linear 5,
        cine-e6-ruido 1.3s steps(1, end) 4 both;
    }

    /* ---- Dos paquetes: el camino se abre y viajan ---- */
    .cine-e6__camino {
      fill: none;
      stroke: #62c4ad;
      stroke-width: 5;
      stroke-linecap: round;
      stroke-dasharray: 0.5 15;
    }
    .cine-e6__revela-camino {
      fill: none;
      stroke: #fff;
      stroke-width: 34;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      transition: stroke-dashoffset 1000ms var(--resorte-suave, ease-out);
    }
    .cine.b-dos-paquetes .cine-e6__revela-camino {
      stroke-dashoffset: 0;
    }

    /* El A sale primero y dura 2800 ms; el B sale 520 ms después y dura 1680 (un 40% menos). Con
       las mismas curvas de X y de Y los dos pisan el mismo camino, y el B pasa al A a mitad. */
    .cine-e6__paquete {
      aspect-ratio: 1 / 1;
      --sale: 250ms;
      --dura: 2800ms;
      --llega: 3050ms;
    }
    .cine-e6__paquete--b {
      --sale: 770ms;
      --dura: 1680ms;
      --llega: 2450ms;
    }
    .cine-e6__px,
    .cine-e6__py {
      display: block;
      width: 100%;
    }
    .cine-e6__px {
      transform: translateX(31.71cqw);
      transition: transform var(--dura) cubic-bezier(0.45, 0, 0.55, 1) var(--sale);
    }
    .cine-e6__py {
      transform: translateY(-28.54cqh);
      transition: transform var(--dura) cubic-bezier(0.15, 0.55, 0.3, 1) var(--sale);
    }
    .cine.b-dos-paquetes .cine-e6__px,
    .cine.b-dos-paquetes .cine-e6__py {
      transform: none;
    }
    .cine-e6__paquete .k-cuerpo {
      display: grid;
      place-items: center;
      aspect-ratio: 1 / 1;
      border-radius: 26%;
      border: max(1.5px, 0.15cqw) solid #20705a;
      background: radial-gradient(circle at 36% 30%, #5cc7a8 0%, #2f9e7f 70%);
      box-shadow: 0 8px 14px -8px rgba(20, 70, 55, 0.55);
      opacity: 0;
      transition:
        opacity 160ms linear var(--sale),
        transform 440ms var(--resorte-suave, ease-out) var(--llega);
    }
    .cine-e6__paquete b {
      font:
        700 clamp(7px, 1.5cqw, 22px) / 1 ui-monospace,
        Menlo,
        Consolas,
        monospace;
      color: #fbf8ef;
    }
    /* Al llegar se hacen a un lado de la ranura: los dos quedan a la vista, el B arriba. */
    .cine.b-dos-paquetes .cine-e6__paquete--b .k-cuerpo {
      opacity: 1;
      transform: translate(-1.134cqw, -7.05cqh);
    }
    .cine.b-dos-paquetes .cine-e6__paquete--a .k-cuerpo {
      opacity: 1;
      transform: translate(1.134cqw, 7.05cqh);
    }
    /* La ranura se entera en el orden en que llegan: primero el 8, un rato; después el 7. */
    .cine.b-dos-paquetes .cine-e6__num--8 {
      animation: cine-e6-destello 600ms ease-out 2450ms both;
    }
    .cine.b-dos-paquetes .cine-e6__num--7 {
      opacity: 1;
      transform: none;
      transition-delay: 3050ms;
    }
    .cine.b-dos-paquetes .cine-e6__onda > span {
      animation-name: cine-onda;
      animation-delay: var(--d);
    }
    .cine-e6__onda {
      position: absolute;
      left: 78.58%;
      top: 33.5%;
      width: 44%;
      translate: -50% -50%;
      --acento: #3fa58c;
    }

    /* ---- Cruce: los paquetes se cambian de lado y la ranura no se decide ----
       Quieto (o con movimiento reducido) se ve la doble exposición: los dos números a medias. */
    .cine.b-cruce .cine-e6__num--8 {
      opacity: 0.5;
      transform: translate(-24%, -22%) scale(0.82);
      animation: cine-e6-parpadea-8 3.2s ease-in-out infinite;
    }
    .cine.b-cruce .cine-e6__num--7 {
      opacity: 0.5;
      transform: translate(24%, 22%) scale(0.82);
      transition-delay: 0ms;
      animation: cine-e6-parpadea-7 3.2s ease-in-out infinite;
    }
    .cine.b-cruce .cine-e6__ranura--valor {
      animation: cine-e6-late 1.6s ease-in-out infinite;
    }
    .cine.b-cruce .cine-e6__paquete--b .k-cuerpo {
      animation: cine-e6-cruza-b 1.6s ease-in-out infinite alternate;
    }
    .cine.b-cruce .cine-e6__paquete--a .k-cuerpo {
      animation: cine-e6-cruza-a 1.6s ease-in-out infinite alternate;
    }

    @keyframes cine-e6-gira {
      to {
        transform: rotate(360deg);
      }
    }
    @keyframes cine-e6-fluye {
      from {
        stroke-dashoffset: 0;
      }
      to {
        stroke-dashoffset: -0.3;
      }
    }
    @keyframes cine-e6-ruido {
      0% {
        opacity: 0.95;
      }
      9% {
        opacity: 0.3;
      }
      15% {
        opacity: 0.85;
      }
      27% {
        opacity: 0.12;
      }
      34% {
        opacity: 0.9;
      }
      47% {
        opacity: 0.5;
      }
      55% {
        opacity: 0.08;
      }
      63% {
        opacity: 0.8;
      }
      78% {
        opacity: 0.35;
      }
      86% {
        opacity: 0.95;
      }
      100% {
        opacity: 0.6;
      }
    }
    @keyframes cine-e6-destello {
      0% {
        opacity: 0;
        transform: translateY(40%);
      }
      25%,
      70% {
        opacity: 1;
        transform: none;
      }
      100% {
        opacity: 0;
        transform: translateY(-40%);
      }
    }
    @keyframes cine-e6-parpadea-8 {
      0%,
      22% {
        opacity: 0;
        transform: scale(0.7);
      }
      28%,
      72% {
        opacity: 1;
        transform: none;
      }
      78%,
      100% {
        opacity: 0;
        transform: scale(0.7);
      }
    }
    @keyframes cine-e6-parpadea-7 {
      0%,
      22% {
        opacity: 1;
        transform: none;
      }
      28%,
      72% {
        opacity: 0;
        transform: scale(0.7);
      }
      78%,
      100% {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes cine-e6-late {
      0%,
      38%,
      64%,
      100% {
        transform: none;
      }
      50% {
        transform: scale(1.14);
      }
    }
    @keyframes cine-e6-cruza-b {
      from {
        transform: translate(-1.134cqw, -7.05cqh);
      }
      to {
        transform: translate(2.866cqw, 5.27cqh);
      }
    }
    @keyframes cine-e6-cruza-a {
      from {
        transform: translate(1.134cqw, 7.05cqh);
      }
      to {
        transform: translate(-2.866cqw, -5.27cqh);
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Escena06Component {}
