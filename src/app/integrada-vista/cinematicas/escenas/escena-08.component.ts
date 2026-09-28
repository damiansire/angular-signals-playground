import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Capítulo 8 · Mirar la pantalla misma. La Nave B tira sus pipes de RxJS por una esclusa; el
 * último se traduce en el camino (el tubo se vuelve caja ámbar) y se queda. Después un puente une
 * un stream de canicas con esa caja, en las dos direcciones. Al final el hilo de la Nave B busca
 * la pantalla del repetidor: la primera vez rebota contra un hueco vacío, la segunda la pantalla
 * ya existe (un iris la enciende) y el hilo se engancha en el centro.
 *
 * Técnicas: los tubos viajan en arco componiendo dos transiciones (X con salida suave, Y con
 * entrada lenta) sobre envoltorios HTML, en unidades del lienzo, así el recorrido escala con él;
 * el tubo que se queda cambia de forma con `d: path()` (en Safari cruza a una caja fija). Las
 * canicas son guiones de largo cero con punta redonda: el stream entero es un solo trazo cuyo
 * dashoffset corre, y la caja late con el mismo período cuando llega cada una. La vuelta es un
 * "cometa" por el camino invertido. El hilo se revela con máscara (como el del capítulo 1) y su
 * rebote es un resorte en keyframes que termina en el mismo valor que el estado del beat.
 */
@Component({
  selector: 'app-escena-08',
  template: `
    <div class="k-mundo cine-e8">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <linearGradient
            id="cine-e8-lejania"
            gradientUnits="userSpaceOnUse"
            x1="1000"
            y1="0"
            x2="1110"
            y2="0"
          >
            <stop offset="0" stop-color="#fff" />
            <stop offset="1" stop-color="#fff" stop-opacity="0" />
          </linearGradient>
          <!-- El stream llega de lejos: su punta derecha se desvanece en vez de cortarse. -->
          <mask
            id="cine-e8-horizonte"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1600"
            height="900"
          >
            <rect width="1600" height="900" fill="url(#cine-e8-lejania)" />
          </mask>
          <mask
            id="cine-e8-revela-puente"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1600"
            height="900"
          >
            <path
              class="cine-e8__revela-puente"
              pathLength="1"
              d="M 604 252 C 570 186, 452 186, 420 252"
            />
          </mask>
          <radialGradient id="cine-e8-cuerpo" cx="0.34" cy="0.2" r="0.9">
            <stop offset="0" stop-color="#b8afa0" />
            <stop offset="1" stop-color="#8d8373" />
          </radialGradient>
          <radialGradient id="cine-e8-brillo">
            <stop offset="0" stop-color="#fffaf0" stop-opacity="0.95" />
            <stop offset="1" stop-color="#fffaf0" stop-opacity="0" />
          </radialGradient>
        </defs>
        <g class="cine-e8__lejos">
          <line x1="1250" y1="124" x2="1380" y2="78" />
          <line x1="1380" y1="78" x2="1470" y2="178" />
          <circle cx="1250" cy="124" r="11" />
          <circle cx="1380" cy="78" r="9" />
          <circle cx="1470" cy="178" r="13" />
          <line x1="560" y1="792" x2="700" y2="738" />
          <circle cx="560" cy="792" r="12" />
          <circle cx="700" cy="738" r="9" />
        </g>
        <!-- El puente: punteado, revelado por la máscara desde el stream hacia la caja. -->
        <path
          class="cine-e8__puente"
          mask="url(#cine-e8-revela-puente)"
          d="M 604 252 C 570 186, 452 186, 420 252"
        />
        <g mask="url(#cine-e8-horizonte)">
          <path class="k-trazo cine-e8__stream" pathLength="1" d="M 1110 252 L 604 252" />
          <!-- Stream y puente en un solo camino: cada canica termina adentro de la caja. -->
          <path
            class="cine-e8__canicas"
            pathLength="1"
            d="M 1110 252 L 604 252 C 570 186, 452 186, 420 252"
          />
          <!-- Y al revés: el mismo camino invertido, de la caja al stream. -->
          <path
            class="cine-e8__vuelta"
            pathLength="1"
            d="M 420 252 C 452 186, 570 186, 604 252 L 1110 252"
          />
        </g>
      </svg>

      <div class="k-actor cine-e8__esclusa" style="--x: 31; --y: 12; --w: 5.6">
        <div class="k-cuerpo">
          <span class="cine-e8__luz"></span>
          <span class="cine-e8__vano">
            <span class="cine-e8__puerta cine-e8__puerta--arriba"></span>
            <span class="cine-e8__puerta cine-e8__puerta--abajo"></span>
          </span>
        </div>
      </div>

      <!-- El héroe: el repetidor, con el hueco de su pantalla. -->
      <div class="k-actor cine-e8__repetidor" style="--x: 50; --y: 56; --w: 17">
        <div class="k-cuerpo">
          <svg viewBox="0 0 200 240">
            <path class="cine-e8__patas" d="M 48 208 L 40 232 M 152 208 L 160 232" />
            <line class="cine-e8__mastil" x1="100" y1="64" x2="100" y2="26" />
            <circle class="cine-e8__bola" cx="100" cy="18" r="9" />
            <rect class="cine-e8__chasis" x="20" y="62" width="160" height="150" rx="22" />
            <rect class="cine-e8__hueco" x="42" y="84" width="116" height="84" rx="10" />
            <circle class="cine-e8__perilla" cx="58" cy="190" r="7" />
            <circle class="cine-e8__perilla" cx="82" cy="190" r="7" />
            <path class="cine-e8__rejilla" d="M 122 184 H 158 M 122 196 H 158" />
          </svg>
          <span class="cine-e8__pantalla"></span>
          <span class="cine-e8__halo"></span>
        </div>
      </div>

      <!-- Los pipes de la Nave B. Cada actor vive en su destino y arranca desplazado hasta la
           nariz de la nave: el estado final es "sin transform", así con movimiento reducido
           quedan igual donde tienen que quedar. -->
      <div
        class="k-actor cine-e8__tubo cine-e8__tubo--tirado"
        style="--x: 31; --y: 12.5; --w: 6; --i: 0; --dx: -13.5cqw; --dy: 20.5cqh; --giro: 30deg"
      >
        <div class="cine-e8__vx">
          <div class="cine-e8__vy">
            <div class="cine-e8__giro">
              <svg viewBox="0 0 100 100">
                <path
                  class="cine-e8__forma"
                  d="M 6 30 L 20 30 L 20 38 L 80 38 L 80 30 L 94 30 L 94 70 L 80 70 L 80 62 L 20 62 L 20 70 L 6 70 Z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div
        class="k-actor cine-e8__tubo cine-e8__tubo--tirado"
        style="--x: 31; --y: 12.5; --w: 6; --i: 1; --dx: -13.5cqw; --dy: 20.5cqh; --giro: -20deg"
      >
        <div class="cine-e8__vx">
          <div class="cine-e8__vy">
            <div class="cine-e8__giro">
              <svg viewBox="0 0 100 100">
                <path
                  class="cine-e8__forma"
                  d="M 6 30 L 20 30 L 20 38 L 80 38 L 80 30 L 94 30 L 94 70 L 80 70 L 80 62 L 20 62 L 20 70 L 6 70 Z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div
        class="k-actor cine-e8__tubo cine-e8__tubo--caja"
        style="--x: 26; --y: 28; --w: 7; --i: 2; --dx: -8.5cqw; --dy: 5cqh; --giro: 0deg"
      >
        <div class="cine-e8__vx">
          <div class="cine-e8__vy">
            <div class="cine-e8__giro">
              <svg viewBox="0 0 100 100">
                <path
                  class="cine-e8__forma cine-e8__forma--caja"
                  d="M 6 30 L 20 30 L 20 38 L 80 38 L 80 30 L 94 30 L 94 70 L 80 70 L 80 62 L 20 62 L 20 70 L 6 70 Z"
                />
                <path
                  class="cine-e8__forma-plan"
                  d="M 14 26 L 26 14 L 40 14 L 60 14 L 74 14 L 86 26 L 86 74 L 74 86 L 60 86 L 40 86 L 26 86 L 14 74 Z"
                />
                <ellipse class="cine-e8__destello" cx="38" cy="34" rx="17" ry="11" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- El hilo de lectura va adelante del repetidor: tiene que verse entrar en la pantalla. -->
      <svg
        class="cine-e8__frente"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <mask
            id="cine-e8-revela-hilo"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1600"
            height="900"
          >
            <path
              class="cine-e8__revela-hilo"
              pathLength="1"
              d="M 276 298 C 400 320, 560 512, 690 512 L 800 512"
            />
          </mask>
        </defs>
        <path
          class="cine-e8__hilo"
          mask="url(#cine-e8-revela-hilo)"
          d="M 276 298 C 400 320, 560 512, 690 512 L 800 512"
        />
      </svg>

      <div class="k-actor cine-e8__nudo" style="--x: 50; --y: 56.9; --w: 1.4">
        <div class="k-cuerpo"></div>
      </div>
      <div
        class="k-actor k-onda cine-e8__onda"
        style="--x: 50; --y: 56.9; --w: 19; --acento: #eb9b3c"
      >
        <span style="--i: 0"></span><span style="--i: 1"></span><span style="--i: 2"></span>
      </div>

      <div class="k-actor k-nave" style="--x: 11; --y: 50; --w: 6; --i: 0">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div
        class="k-actor k-nave cine-e8__naveB"
        style="--x: 15; --y: 33; --w: 6; --i: 1; --c: #7a66a6"
      >
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div class="k-actor k-nave k-nave--cap" style="--x: 20; --y: 67; --w: 7.5; --i: 2">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave-cap" x="-70" y="-40" width="140" height="80" />
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
    .cine-e8__lejos line {
      stroke: #cdc3ad;
      stroke-width: 3;
      stroke-dasharray: 2 10;
      stroke-linecap: round;
    }
    .cine-e8__lejos circle {
      fill: #efe7d4;
      stroke: #cdc3ad;
      stroke-width: 3;
    }

    /* ---- La esclusa: entorno. Llega con las naves, se abre para tirar, se cierra cuando la
       mascota dice que no se tira nada ---- */
    .cine-e8__esclusa,
    .cine-e8__esclusa > .k-cuerpo {
      aspect-ratio: 4 / 5;
    }
    .cine-e8__esclusa > .k-cuerpo {
      position: relative;
      opacity: 0;
      transform: scale(0.6);
      transition:
        opacity 260ms ease-out 300ms,
        transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out) 300ms;
    }
    .cine.b-naves .cine-e8__esclusa > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    .cine-e8__vano {
      position: absolute;
      inset: 0;
      overflow: hidden;
      border: clamp(2px, 0.3cqw, 4px) solid #3a342a;
      border-radius: 14% / 11%;
      background: radial-gradient(circle at 50% 55%, #4d4436 0%, #1f1b15 80%);
    }
    /* Franjas de peligro en el borde donde se juntan: se lee compuerta, no frasco. */
    .cine-e8__puerta {
      position: absolute;
      left: 0;
      width: 100%;
      height: 50%;
      transition: transform var(--resorte-firme-ms, 360ms) var(--resorte-firme, ease-out);
    }
    .cine-e8__puerta--arriba {
      top: 0;
      background:
        linear-gradient(to top, transparent 0 22%, #d8ceb6 22%),
        repeating-linear-gradient(-45deg, #eb9b3c 0 10%, #3a342a 10% 20%);
    }
    .cine-e8__puerta--abajo {
      bottom: 0;
      background:
        linear-gradient(to bottom, transparent 0 22%, #d8ceb6 22%),
        repeating-linear-gradient(-45deg, #eb9b3c 0 10%, #3a342a 10% 20%);
    }
    .cine-e8__luz {
      position: absolute;
      left: 50%;
      top: -9%;
      width: 20%;
      aspect-ratio: 1 / 1;
      translate: -50% -50%;
      border-radius: 50%;
      background: #6b6252;
      transition: background-color 200ms ease-out 150ms;
    }
    .cine.b-pipes-esclusa .cine-e8__puerta {
      transition-delay: 150ms;
    }
    .cine.b-pipes-esclusa .cine-e8__puerta--arriba {
      transform: translateY(-100%);
    }
    .cine.b-pipes-esclusa .cine-e8__puerta--abajo {
      transform: translateY(100%);
    }
    .cine.b-pipes-esclusa .cine-e8__luz {
      background: #eb9b3c;
    }
    .cine.b-mascota .cine-e8__puerta {
      transform: none;
      transition-delay: 500ms;
    }
    .cine.b-mascota .cine-e8__luz {
      background: #6b6252;
      transition-delay: 500ms;
    }

    /* ---- Los pipes: arco = X que frena temprano + Y que arranca tarde ---- */
    .cine-e8__tubo {
      --parte: calc(600ms + var(--i, 0) * 190ms);
      pointer-events: none;
    }
    .cine-e8__vx {
      transform: translateX(var(--dx));
      transition: transform 1150ms cubic-bezier(0.22, 0.61, 0.36, 1) var(--parte);
    }
    .cine-e8__vy {
      transform: translateY(var(--dy));
      transition: transform 1150ms cubic-bezier(0.55, 0.06, 0.68, 0.53) var(--parte);
    }
    .cine.b-pipes-esclusa .cine-e8__vx,
    .cine.b-pipes-esclusa .cine-e8__vy {
      transform: none;
    }
    .cine-e8__giro {
      opacity: 0;
      transform: scale(0.45) rotate(-24deg);
      transition:
        opacity 200ms linear var(--parte),
        transform 1150ms cubic-bezier(0.3, 0.7, 0.4, 1) var(--parte);
    }
    .cine.b-pipes-esclusa .cine-e8__giro {
      opacity: 1;
      transform: rotate(var(--giro, 0deg));
    }
    /* Los que se tiran: al llegar se achican adentro de la esclusa. Salir cuesta menos. */
    .cine-e8__tubo--tirado svg {
      transition:
        opacity 240ms ease-in calc(var(--parte) + 880ms),
        transform 320ms ease-in calc(var(--parte) + 820ms);
    }
    .cine.b-pipes-esclusa .cine-e8__tubo--tirado svg {
      opacity: 0;
      transform: scale(0.25);
    }
    /* El que se queda frena a mitad de camino: más largo en X, sin prisa en Y. */
    .cine-e8__tubo--caja .cine-e8__vx {
      transition: transform 1300ms cubic-bezier(0.16, 0.84, 0.3, 1) var(--parte);
    }
    .cine-e8__tubo--caja .cine-e8__vy {
      transition: transform 1300ms cubic-bezier(0.45, 0, 0.25, 1) var(--parte);
    }

    .cine-e8__forma {
      d: path(
        'M 6 30 L 20 30 L 20 38 L 80 38 L 80 30 L 94 30 L 94 70 L 80 70 L 80 62 L 20 62 L 20 70 L 6 70 Z'
      );
      fill: #dccff4;
      stroke: #5f4f8a;
      stroke-width: 5;
      stroke-linejoin: round;
    }
    /* El morph: los doce vértices del tubo se reparten sobre una caja de esquinas cortadas. */
    .cine-e8__forma--caja {
      transition:
        d 520ms cubic-bezier(0.65, 0, 0.35, 1) calc(var(--parte) + 380ms),
        fill 420ms ease-out calc(var(--parte) + 440ms),
        stroke 420ms ease-out calc(var(--parte) + 440ms);
    }
    .cine.b-pipes-esclusa .cine-e8__forma--caja {
      d: path(
        'M 14 26 L 26 14 L 40 14 L 60 14 L 74 14 L 86 26 L 86 74 L 74 86 L 60 86 L 40 86 L 26 86 L 14 74 Z'
      );
      fill: #f2ab41;
      stroke: #3a342a;
    }
    .cine-e8__forma-plan {
      fill: #f2ab41;
      stroke: #3a342a;
      stroke-width: 5;
      stroke-linejoin: round;
      opacity: 0;
    }
    .cine-e8__destello {
      fill: url(#cine-e8-brillo);
      opacity: 0;
      transition: opacity 360ms ease-out calc(var(--parte) + 820ms);
    }
    .cine.b-pipes-esclusa .cine-e8__destello {
      opacity: 0.85;
    }
    /* Sin d: path() (Safari) no hay morph: el tubo se apaga y la caja aparece en su lugar. */
    @supports not (d: path('M 0 0')) {
      .cine-e8__forma--caja,
      .cine-e8__forma-plan {
        transition: opacity 320ms ease-out calc(var(--parte) + 420ms);
      }
      .cine.b-pipes-esclusa .cine-e8__forma--caja {
        opacity: 0;
      }
      .cine.b-pipes-esclusa .cine-e8__forma-plan {
        opacity: 1;
      }
    }

    /* ---- El puente: stream de canicas hacia la caja, y una de vuelta ---- */
    .cine-e8__stream {
      stroke: #6b6252;
      stroke-width: 4;
      stroke-linecap: round;
      --trazo-ms: 800ms;
    }
    .cine.b-puente .cine-e8__stream {
      stroke-dashoffset: 0;
    }
    .cine-e8__puente {
      fill: none;
      stroke: #9a9081;
      stroke-width: 7;
      stroke-linecap: round;
      stroke-dasharray: 0.5 14;
    }
    .cine-e8__revela-puente {
      fill: none;
      stroke: #fff;
      stroke-width: 40;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      transition: stroke-dashoffset 650ms var(--resorte-suave, ease-out) 450ms;
    }
    .cine.b-puente .cine-e8__revela-puente {
      stroke-dashoffset: 0;
    }
    /* Canicas = guiones de largo cero con punta redonda. Correr el dashoffset un período mueve
       todas a la vez, y el período coincide con el latido de la caja. */
    .cine-e8__canicas {
      fill: none;
      stroke: #8e7bc4;
      stroke-width: 22;
      stroke-linecap: round;
      stroke-dasharray: 0.001 0.199;
      opacity: 0;
      transition: opacity 260ms ease-out 900ms;
    }
    .cine.b-puente .cine-e8__canicas {
      opacity: 1;
      animation: cine-e8-fluye 1000ms linear 1200ms 3;
    }
    .cine-e8__vuelta {
      fill: none;
      stroke: #eb9b3c;
      stroke-width: 22;
      stroke-linecap: round;
      stroke-dasharray: 0.001 2;
      stroke-dashoffset: 0.01;
    }
    .cine.b-puente .cine-e8__vuelta {
      animation: cine-e8-vuelve 1300ms linear 4400ms 2;
    }
    .cine-e8__tubo--caja svg {
      transform-origin: 50% 50%;
    }
    .cine.b-puente .cine-e8__tubo--caja svg {
      animation:
        cine-e8-late 1000ms ease-out 2130ms 3,
        cine-e8-late 1300ms ease-out 4320ms 2;
    }

    /* ---- El repetidor ---- */
    .cine-e8__repetidor > .k-cuerpo {
      position: relative;
      opacity: 0;
      transform: translateY(9cqh) scale(0.82);
      transform-origin: 50% 100%;
      transition:
        opacity 300ms ease-out,
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out);
    }
    .cine.b-titulo-rincon .cine-e8__repetidor > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    .cine-e8__patas {
      fill: none;
      stroke: #6b6252;
      stroke-width: 7;
      stroke-linecap: round;
    }
    .cine-e8__mastil {
      stroke: #6b6252;
      stroke-width: 5;
      stroke-linecap: round;
    }
    .cine-e8__bola {
      fill: #9a9081;
      stroke: #6b6252;
      stroke-width: 4;
      transition: fill 400ms ease-out 1100ms;
    }
    .cine.b-pantalla-aparece .cine-e8__bola {
      fill: #f2ab41;
    }
    .cine-e8__chasis {
      fill: url(#cine-e8-cuerpo);
      stroke: #6b6252;
      stroke-width: 5;
    }
    .cine-e8__hueco {
      fill: #ddd4bf;
      stroke: #fbf8ef;
      stroke-width: 4;
      stroke-linecap: round;
      stroke-dasharray: 0.5 10;
    }
    .cine-e8__perilla {
      fill: #6b6252;
    }
    .cine-e8__rejilla {
      stroke: #6b6252;
      stroke-width: 4;
      stroke-linecap: round;
    }
    /* La pantalla: una capa HTML sobre el hueco, que se enciende con un iris. Borde ámbar: es un
       valor, como la caja. */
    .cine-e8__pantalla {
      position: absolute;
      left: 21%;
      top: 35%;
      width: 58%;
      height: 35%;
      border-radius: 9% / 12%;
      background:
        linear-gradient(#6b6252, #6b6252) 14% 20% / 36% 8% no-repeat,
        linear-gradient(#c9b99b, #c9b99b) 14% 82% / 58% 7% no-repeat,
        radial-gradient(circle at 50% 50%, #fffaf0 0%, #fde9c2 55%, #f2c27a 100%);
      box-shadow: inset 0 0 0 2px #eb9b3c;
      clip-path: circle(0% at 50% 50%);
      transition: clip-path 760ms var(--resorte-suave, ease-out) 100ms;
    }
    .cine.b-pantalla-aparece .cine-e8__pantalla {
      clip-path: circle(75% at 50% 50%);
    }
    .cine-e8__halo {
      position: absolute;
      left: 50%;
      top: 7.5%;
      width: 30%;
      aspect-ratio: 1 / 1;
      translate: -50% -50%;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(242, 171, 65, 0.75) 0%, rgba(242, 171, 65, 0) 68%);
      opacity: 0;
      transition: opacity 500ms ease-out 1100ms;
    }
    /* El único loop nuevo: la antena respira cuando la pantalla ya se puede leer. */
    .cine.b-pantalla-aparece .cine-e8__halo {
      opacity: 1;
      animation: cine-e8-antena 2.4s ease-in-out 1600ms infinite alternate;
    }

    /* ---- El hilo de la Nave B ---- */
    .cine-e8__frente {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .cine-e8__hilo {
      fill: none;
      stroke: #7a66a6;
      stroke-width: 5;
      stroke-linecap: round;
      stroke-dasharray: 0.5 15;
    }
    .cine-e8__revela-hilo {
      fill: none;
      stroke: #fff;
      stroke-width: 40;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
    }
    /* Busca, toca el borde del hueco y retrocede: el keyframe termina en el mismo valor que el
       estado del beat, así sin movimiento queda igual (corto, sin llegar). */
    .cine.b-pantalla-vacia .cine-e8__revela-hilo {
      stroke-dashoffset: 0.25;
      animation: cine-e8-rebota 1400ms linear 150ms backwards;
    }
    .cine.b-pantalla-aparece .cine-e8__revela-hilo {
      stroke-dashoffset: 0;
      transition: stroke-dashoffset 480ms var(--resorte-suave, ease-out) 700ms;
    }
    .cine.b-pantalla-vacia .cine-e8__hueco {
      animation: cine-e8-destello 700ms ease-out 870ms;
    }
    .cine.b-pipes-esclusa .cine-e8__naveB {
      animation: cine-e8-tira 720ms ease-out 480ms;
    }
    .cine.b-pantalla-vacia .cine-e8__naveB > .k-cuerpo {
      animation: cine-e8-retro 620ms ease-out 860ms;
    }
    .cine-e8__nudo,
    .cine-e8__nudo > .k-cuerpo {
      aspect-ratio: 1 / 1;
    }
    .cine-e8__nudo > .k-cuerpo {
      border-radius: 50%;
      background: #7a66a6;
      box-shadow: 0 0 0 2px #fbf8ef;
      opacity: 0;
      transform: scale(0.2);
      transition:
        opacity 160ms ease-out 1150ms,
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out) 1150ms;
    }
    .cine.b-pantalla-aparece .cine-e8__nudo > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    .cine-e8__onda {
      pointer-events: none;
    }
    .cine.b-pantalla-aparece .cine-e8__onda > span {
      animation-name: cine-onda;
      animation-delay: calc(1200ms + var(--i, 0) * 0.24s);
    }

    @keyframes cine-e8-fluye {
      from {
        stroke-dashoffset: 0;
      }
      to {
        stroke-dashoffset: -0.2;
      }
    }
    @keyframes cine-e8-vuelve {
      from {
        stroke-dashoffset: 0.01;
      }
      to {
        stroke-dashoffset: -1.01;
      }
    }
    @keyframes cine-e8-late {
      0%,
      40%,
      100% {
        transform: none;
      }
      8% {
        transform: scale(1.16);
      }
    }
    @keyframes cine-e8-rebota {
      0% {
        stroke-dashoffset: 1;
        animation-timing-function: cubic-bezier(0.5, 0, 0.9, 0.6);
      }
      52% {
        stroke-dashoffset: 0.125;
        animation-timing-function: cubic-bezier(0.2, 0.7, 0.4, 1);
      }
      70% {
        stroke-dashoffset: 0.32;
        animation-timing-function: ease-in-out;
      }
      86% {
        stroke-dashoffset: 0.23;
        animation-timing-function: ease-in-out;
      }
      100% {
        stroke-dashoffset: 0.25;
      }
    }
    @keyframes cine-e8-destello {
      0%,
      100% {
        stroke: #fbf8ef;
      }
      25% {
        stroke: #7a66a6;
      }
    }
    @keyframes cine-e8-tira {
      0%,
      100% {
        transform: none;
      }
      28% {
        transform: translateX(-1cqw) rotate(-6deg);
      }
    }
    @keyframes cine-e8-retro {
      0%,
      100% {
        transform: none;
      }
      25% {
        transform: translateX(-0.9cqw);
      }
    }
    @keyframes cine-e8-antena {
      from {
        opacity: 0.55;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1.15);
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Escena08Component {}
