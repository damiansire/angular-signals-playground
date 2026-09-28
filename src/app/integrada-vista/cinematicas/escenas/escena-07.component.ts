import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Capítulo 7 · Los bordes del aparato. Primero se ve el plano punteado del repetidor; cuando la
 * Nave A le pasa la frecuencia, el aparato se dibuja, el puerto de entrada se enciende y una ficha
 * viaja desde la nave, pasa por la caja de frecuencia y entra al dial. Si la frecuencia cambia
 * afuera, el dial queda viejo y parpadea hasta que la mascota recuerda que lo que entra sigue vivo:
 * el valor nuevo corre por el cable y el dial se pone al día. El aviso sale por el otro borde, como
 * una onda que sacude a las naves. Al final lo encienden sin frecuencia y el dial muestra una
 * ranura vacía que titila.
 *
 * Técnicas: el plano se REVELA con máscara (el punteado no se deforma); el contorno se dibuja con
 * dashoffset; el dial se abre con un iris de clip-path; la ficha recorre un `shape()` en porcentaje
 * del lienzo con offset-path, y su máscara destapa el cable al mismo ritmo; el valor nuevo es un
 * cometa; la onda del kit sale del puerto derecho, detrás del aparato (dos capas de SVG la dejan en
 * el medio). Todo lo que entra es transición: con movimiento reducido cada cosa queda en su destino.
 */
@Component({
  selector: 'app-escena-07',
  template: `
    <div class="k-mundo cine-e7" aria-hidden="true">
      <svg
        class="cine-e7__capa"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <mask id="cine-e7-plano" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="900">
            <path
              class="cine-e7__revela cine-e7__revela--plano"
              pathLength="1"
              d="M 640 423 V 356 A 32 32 0 0 1 672 324 H 928 A 32 32 0 0 1 960 356 V 508 A 32 32 0 0 1 928 540 H 672 A 32 32 0 0 1 640 508 Z"
            />
            <path
              class="cine-e7__revela cine-e7__revela--antena"
              pathLength="1"
              d="M 900 324 L 926 252"
            />
          </mask>
          <mask id="cine-e7-cable" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="900">
            <path
              class="cine-e7__revela cine-e7__revela--cable"
              pathLength="1"
              d="M 317 396 C 376 396, 432 270, 512 270 C 568 270, 584 423, 640 423"
            />
          </mask>
        </defs>

        <g class="cine-e7__lejos">
          <line x1="1190" y1="170" x2="1330" y2="118" />
          <line x1="1330" y1="118" x2="1430" y2="214" />
          <circle cx="1190" cy="170" r="12" />
          <circle cx="1330" cy="118" r="9" />
          <circle cx="1430" cy="214" r="11" />
          <line x1="560" y1="790" x2="690" y2="738" />
          <circle cx="560" cy="790" r="10" />
          <circle cx="690" cy="738" r="13" />
        </g>

        <!-- El plano del repetidor: punteado, lo destapa la máscara cuando la tarjeta se va. -->
        <g class="cine-e7__plano" mask="url(#cine-e7-plano)">
          <path
            d="M 640 423 V 356 A 32 32 0 0 1 672 324 H 928 A 32 32 0 0 1 960 356 V 508 A 32 32 0 0 1 928 540 H 672 A 32 32 0 0 1 640 508 Z"
          />
          <path d="M 900 324 L 926 252" />
          <circle cx="929" cy="244" r="11" />
        </g>

        <!-- El cable de la entrada: el rastro que deja la ficha de la nave al puerto. -->
        <path
          class="cine-e7__cable"
          mask="url(#cine-e7-cable)"
          d="M 317 396 C 376 396, 432 270, 512 270 C 568 270, 584 423, 640 423"
        />
        <!-- El valor nuevo: de la caja al puerto, por el mismo cable. -->
        <path class="cine-e7__cometa" pathLength="1" d="M 512 270 C 568 270, 584 423, 640 423" />
      </svg>

      <!-- La onda va entre las dos capas: pasa por detrás del aparato y por delante del cielo. -->
      <div
        class="k-actor k-onda cine-e7__onda"
        style="--x: 60; --y: 47; --w: 52; --acento: #eb9b3c"
      >
        <span style="--i: 0"></span><span style="--i: 1"></span><span style="--i: 2"></span>
      </div>

      <svg
        class="cine-e7__capa"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="cine-e7-chapa" cx="0.36" cy="0.26" r="0.9">
            <stop offset="0" stop-color="#ffe0a8" />
            <stop offset="0.55" stop-color="#f2ab41" />
            <stop offset="1" stop-color="#d98a24" />
          </radialGradient>
          <radialGradient id="cine-e7-brillo">
            <stop offset="0" stop-color="#eb9b3c" stop-opacity="0.8" />
            <stop offset="1" stop-color="#eb9b3c" stop-opacity="0" />
          </radialGradient>
        </defs>

        <g class="cine-e7__cuerpo">
          <path
            class="cine-e7__chapa"
            d="M 640 423 V 356 A 32 32 0 0 1 672 324 H 928 A 32 32 0 0 1 960 356 V 508 A 32 32 0 0 1 928 540 H 672 A 32 32 0 0 1 640 508 Z"
          />
          <rect class="cine-e7__marco" x="658" y="342" width="284" height="180" rx="18" />
        </g>
        <!-- Empieza y termina en el puerto de entrada: la costura del trazo queda bajo el zócalo. -->
        <path
          class="cine-e7__contorno"
          pathLength="1"
          d="M 640 423 V 356 A 32 32 0 0 1 672 324 H 928 A 32 32 0 0 1 960 356 V 508 A 32 32 0 0 1 928 540 H 672 A 32 32 0 0 1 640 508 Z"
        />
        <path
          class="cine-e7__contorno cine-e7__contorno--antena"
          pathLength="1"
          d="M 900 324 L 926 252"
        />
        <circle class="cine-e7__bola" cx="929" cy="244" r="11" />

        <g class="cine-e7__puerto cine-e7__puerto--entra">
          <circle class="cine-e7__brillo" cx="640" cy="423" r="62" />
          <circle class="cine-e7__zocalo" cx="640" cy="423" r="21" />
          <circle class="cine-e7__pin" cx="640" cy="423" r="8" />
        </g>
        <g class="cine-e7__puerto cine-e7__puerto--sale">
          <circle class="cine-e7__brillo" cx="960" cy="423" r="62" />
          <circle class="cine-e7__zocalo" cx="960" cy="423" r="21" />
          <circle class="cine-e7__pin" cx="960" cy="423" r="8" />
        </g>
        <!-- Lo que queda de la onda: el borde de salida sigue emitiendo hacia afuera. -->
        <g class="cine-e7__emite">
          <path pathLength="1" style="--i: 0" d="M 995 393 A 46 46 0 0 1 995 453" />
          <path pathLength="1" style="--i: 1" d="M 1012 379 A 68 68 0 0 1 1012 467" />
          <path pathLength="1" style="--i: 2" d="M 1029 365 A 90 90 0 0 1 1029 481" />
        </g>
      </svg>

      <div class="k-actor cine-e7__dial" style="--x: 50; --y: 47; --w: 8.6">
        <div class="k-cuerpo">
          <span class="cine-e7__aguja"></span>
          <span class="cine-e7__num cine-e7__num--viejo"
            ><span class="cine-e7__parpadeo">88</span></span
          >
          <span class="cine-e7__num cine-e7__num--nuevo">104</span>
          <svg class="cine-e7__ranura" viewBox="0 0 100 46">
            <rect x="4" y="4" width="92" height="38" rx="11" pathLength="20" />
          </svg>
        </div>
      </div>

      <!-- La ficha va antes que la caja: la cruza por detrás, como si la caja le pusiera el valor. -->
      <div class="k-actor cine-e7__ficha" style="--x: 40; --y: 47; --w: 3.2">
        <div class="k-cuerpo">88</div>
      </div>

      <div class="k-actor cine-e7__caja" style="--x: 32; --y: 30; --w: 7">
        <div class="k-cuerpo">
          <span class="cine-e7__valor cine-e7__valor--antes">88</span>
          <span class="cine-e7__valor cine-e7__valor--despues">104</span>
        </div>
      </div>

      <div class="k-actor k-nave cine-e7__nave" style="--x: 17; --y: 44; --w: 6.2; --i: 0; --r: 1">
        <div class="k-cuerpo">
          <span class="cine-e7__recibe"></span>
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div
        class="k-actor k-nave k-nave--cap cine-e7__nave"
        style="--x: 22; --y: 61; --w: 7.4; --i: 1; --r: 0"
      >
        <div class="k-cuerpo">
          <span class="cine-e7__recibe"></span>
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave-cap" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div class="k-actor k-nave cine-e7__nave" style="--x: 12; --y: 74; --w: 5.8; --i: 2; --r: 2">
        <div class="k-cuerpo">
          <span class="cine-e7__recibe"></span>
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
    /* Dos capas de mundo del tamaño del lienzo: la de atrás (plano, cable, cometa) y la del
       aparato, con la onda del kit entre ellas. */
    .cine-e7 .cine-e7__capa {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
      pointer-events: none;
    }
    .cine-e7__lejos line {
      stroke: #cdc3ad;
      stroke-width: 3;
      stroke-dasharray: 2 10;
      stroke-linecap: round;
    }
    .cine-e7__lejos circle {
      fill: #efe7d4;
      stroke: #cdc3ad;
      stroke-width: 3;
    }

    /* ---- El plano: el aparato antes de existir ---- */
    .cine-e7__plano path,
    .cine-e7__plano circle {
      fill: none;
      stroke: #bdb299;
      stroke-width: 4;
      stroke-linecap: round;
      stroke-dasharray: 0.5 13;
    }
    .cine-e7__plano {
      transition: opacity 300ms ease-out 700ms;
    }
    .cine.b-repetidor .cine-e7__plano {
      opacity: 0;
    }
    .cine-e7__revela {
      fill: none;
      stroke: #fff;
      stroke-width: 40;
      stroke-linecap: round;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
    }
    .cine-e7__revela--plano {
      transition: stroke-dashoffset 1300ms var(--resorte-suave, ease-out) 150ms;
    }
    .cine-e7__revela--antena {
      transition: stroke-dashoffset 380ms ease-out 1150ms;
    }
    .cine.b-titulo-rincon .cine-e7__revela--plano,
    .cine.b-titulo-rincon .cine-e7__revela--antena {
      stroke-dashoffset: 0;
    }

    /* ---- El aparato: el contorno se dibuja, la chapa llena, los puertos aparecen ---- */
    .cine-e7__chapa {
      fill: url(#cine-e7-chapa);
    }
    .cine-e7__marco {
      fill: none;
      stroke: #b8741c;
      stroke-opacity: 0.45;
      stroke-width: 2.5;
    }
    .cine-e7__cuerpo {
      opacity: 0;
      transition: opacity 500ms ease-out 450ms;
    }
    .cine.b-repetidor .cine-e7__cuerpo {
      opacity: 1;
    }
    .cine-e7__contorno {
      fill: none;
      stroke: #3a342a;
      stroke-width: 5;
      stroke-linejoin: round;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      transition: stroke-dashoffset 900ms var(--resorte-suave, ease-out);
    }
    .cine-e7__contorno--antena {
      stroke-linecap: round;
      transition: stroke-dashoffset 320ms ease-out 760ms;
    }
    .cine.b-repetidor .cine-e7__contorno {
      stroke-dashoffset: 0;
    }
    .cine-e7__bola {
      fill: #eb9b3c;
      stroke: #3a342a;
      stroke-width: 4;
      opacity: 0;
      transition: opacity 200ms ease-out 1050ms;
    }
    .cine.b-repetidor .cine-e7__bola {
      opacity: 1;
    }

    .cine-e7__puerto {
      opacity: 0;
      transition: opacity 300ms ease-out 600ms;
    }
    .cine.b-repetidor .cine-e7__puerto {
      opacity: 1;
    }
    .cine-e7__zocalo {
      fill: #fbf8ef;
      stroke: #3a342a;
      stroke-width: 4;
    }
    .cine-e7__pin {
      fill: #6b6252;
      transition: fill 240ms ease-out;
    }
    .cine-e7__brillo {
      fill: url(#cine-e7-brillo);
      opacity: 0;
      transform-box: fill-box;
      transform-origin: center;
      transition: opacity 300ms ease-out;
    }
    /* El puerto de entrada se enciende antes de que salga la ficha: el borde espera el valor. */
    .cine.b-repetidor .cine-e7__puerto--entra .cine-e7__brillo {
      opacity: 1;
      transition-delay: 850ms;
    }
    .cine.b-repetidor .cine-e7__puerto--entra .cine-e7__pin {
      fill: #eb9b3c;
      transition-delay: 850ms;
    }
    .cine.b-mascota .cine-e7__puerto--entra .cine-e7__brillo {
      animation: cine-e7-latido 700ms ease-out 1250ms;
    }
    .cine.b-borde-salida .cine-e7__puerto--sale .cine-e7__brillo {
      opacity: 1;
    }
    .cine.b-borde-salida .cine-e7__puerto--sale .cine-e7__pin {
      fill: #eb9b3c;
    }
    .cine-e7__emite path {
      fill: none;
      stroke: #d98a24;
      stroke-width: 5;
      stroke-linecap: round;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      transition:
        stroke-dashoffset 420ms var(--resorte-suave, ease-out) calc(120ms + var(--i, 0) * 90ms),
        opacity 200ms ease-in;
    }
    .cine.b-borde-salida .cine-e7__emite path {
      stroke-dashoffset: 0;
    }

    /* ---- El cable y el cometa ---- */
    .cine-e7__cable {
      fill: none;
      stroke: #6b6252;
      stroke-width: 4.5;
      stroke-linecap: round;
      stroke-dasharray: 0.5 13;
      transition: opacity 220ms ease-in;
    }
    /* Misma duración y curva que el viaje de la ficha: el cable aparece detrás de ella. */
    .cine-e7__revela--cable {
      transition: stroke-dashoffset 1000ms cubic-bezier(0.5, 0, 0.25, 1) 1000ms;
    }
    .cine.b-repetidor .cine-e7__revela--cable {
      stroke-dashoffset: 0;
    }
    .cine-e7__cometa {
      fill: none;
      stroke: #eb9b3c;
      stroke-width: 11;
      stroke-linecap: round;
      stroke-dasharray: 0.12 2;
      stroke-dashoffset: 0.12;
    }
    .cine.b-mascota .cine-e7__cometa {
      animation: cine-e7-cometa 850ms cubic-bezier(0.45, 0, 0.2, 1) 400ms both;
    }

    /* ---- La ficha: sale de la nave, pasa por la caja y entra al puerto ---- */
    .cine-e7__ficha {
      aspect-ratio: 1 / 1;
      opacity: 0;
      offset-distance: 0%;
      transition:
        opacity 140ms linear 1000ms,
        offset-distance 1000ms cubic-bezier(0.5, 0, 0.25, 1) 1000ms;
    }
    /* Sin shape() la ficha se queda en su lugar de llegada (el puerto) y solo se funde. 99.9 %
       porque una forma básica es un lazo: al 100 % volvería al principio. */
    @supports (offset-path: shape(from 0% 0%, line to 1% 1%)) {
      .cine-e7__ficha {
        translate: none;
        offset-path: shape(
          from 19.8% 44%,
          curve to 32% 30% with 23.5% 44% / 27% 30%,
          curve to 40% 47% with 35.5% 30% / 36.5% 47%
        );
        offset-rotate: 0deg;
      }
    }
    .cine.b-repetidor .cine-e7__ficha {
      opacity: 1;
      offset-distance: 99.9%;
    }
    .cine-e7__ficha > .k-cuerpo {
      display: grid;
      place-items: center;
      aspect-ratio: 1 / 1;
      border-radius: 30%;
      border: 2.5px solid #3a342a;
      background: radial-gradient(circle at 38% 30%, #ffe0a8 0%, #f2ab41 60%, #d98a24 100%);
      font:
        700 clamp(6px, 1.1cqw, 17px) / 1 ui-monospace,
        Menlo,
        Consolas,
        monospace;
      color: #201d16;
      transition:
        opacity 180ms ease-in 2000ms,
        transform 220ms ease-in 2000ms;
    }
    .cine.b-repetidor .cine-e7__ficha > .k-cuerpo {
      opacity: 0;
      transform: scale(0.3);
    }

    /* ---- La caja de frecuencia, afuera ---- */
    .cine-e7__caja {
      aspect-ratio: 1.35 / 1;
    }
    .cine-e7__caja > .k-cuerpo {
      display: grid;
      place-items: center;
      height: 100%;
      padding-top: 12%;
      box-sizing: border-box;
      border-radius: 12px;
      border: 3px solid #3a342a;
      background:
        linear-gradient(#eb9b3c, #eb9b3c) top / 100% 20% no-repeat,
        #fbf8ef;
      overflow: hidden;
      opacity: 0;
      transform: scale(0.6);
      transition:
        opacity 240ms ease-out 250ms,
        transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out) 250ms;
    }
    .cine.b-repetidor .cine-e7__caja > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    .cine.b-frecuencia-vieja .cine-e7__caja > .k-cuerpo {
      animation: cine-e7-pulso 800ms cubic-bezier(0.3, 1.4, 0.5, 1);
    }
    .cine.b-vacio .cine-e7__caja > .k-cuerpo {
      opacity: 0.35;
      transition: opacity 260ms ease-in;
    }
    .cine-e7__valor {
      grid-area: 1 / 1;
      font:
        700 clamp(9px, 2.3cqw, 34px) / 1 ui-monospace,
        Menlo,
        Consolas,
        monospace;
      color: #201d16;
      transition:
        opacity 240ms ease-out 150ms,
        transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out) 150ms;
    }
    .cine-e7__valor--despues {
      opacity: 0;
      transform: translateY(60%);
    }
    .cine.b-frecuencia-vieja .cine-e7__valor--antes {
      opacity: 0;
      transform: translateY(-60%);
    }
    .cine.b-frecuencia-vieja .cine-e7__valor--despues {
      opacity: 1;
      transform: none;
    }

    /* ---- El dial: se abre en iris y toma el valor cuando la ficha entra ---- */
    .cine-e7__dial {
      aspect-ratio: 1 / 1;
    }
    .cine-e7__dial > .k-cuerpo {
      position: relative;
      display: grid;
      place-items: center;
      aspect-ratio: 1 / 1;
      box-sizing: border-box;
      border-radius: 50%;
      border: 3px solid #3a342a;
      background:
        radial-gradient(circle closest-side, #fbf8ef 0 73%, transparent 74%),
        repeating-conic-gradient(from -1.5deg, #8a7f6b 0 3deg, transparent 3deg 22.5deg), #f1e9d6;
      box-shadow: inset 0 3px 6px rgba(60, 40, 10, 0.25);
      clip-path: circle(0% at 50% 50%);
      transition: clip-path 560ms var(--resorte-suave, ease-out) 600ms;
    }
    .cine.b-repetidor .cine-e7__dial > .k-cuerpo {
      clip-path: circle(62% at 50% 50%);
    }
    .cine-e7__aguja {
      position: absolute;
      inset: 0;
      transform: rotate(-135deg);
      transition:
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out) 2050ms,
        opacity 200ms ease-out;
    }
    .cine-e7__aguja::before {
      content: '';
      position: absolute;
      left: 50%;
      top: 2%;
      width: 11%;
      height: 19%;
      translate: -50% 0;
      box-sizing: border-box;
      border-radius: 3px;
      border: 2px solid #3a342a;
      background: #eb9b3c;
    }
    .cine.b-repetidor .cine-e7__aguja {
      transform: rotate(-48deg);
    }
    .cine.b-mascota .cine-e7__aguja {
      transform: rotate(42deg);
      transition-delay: 1250ms, 0ms;
    }

    .cine-e7__num {
      grid-area: 1 / 1;
      font:
        700 clamp(9px, 2.4cqw, 36px) / 1 ui-monospace,
        Menlo,
        Consolas,
        monospace;
      color: #201d16;
      opacity: 0;
      transform: translateY(40%);
      transition:
        opacity 260ms ease-out,
        transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out),
        color 500ms ease-out;
    }
    .cine-e7__parpadeo {
      display: inline-block;
    }
    .cine.b-repetidor .cine-e7__num--viejo {
      opacity: 1;
      transform: none;
      transition-delay: 2050ms;
    }
    /* Afuera cambió y adentro no: el número viejo pierde tinta, se corre y falla como un visor. */
    .cine.b-frecuencia-vieja .cine-e7__num--viejo {
      color: #a39a88;
      transform: translate(-5%, 4%);
      transition-delay: 450ms;
    }
    .cine.b-frecuencia-vieja:not(.b-mascota) .cine-e7__parpadeo {
      animation: cine-e7-desajuste 1.4s linear 700ms infinite;
    }
    .cine.b-mascota .cine-e7__num--viejo {
      opacity: 0;
      transform: translateY(-40%);
      transition:
        opacity 200ms ease-in 1250ms,
        transform var(--resorte-firme-ms, 360ms) var(--resorte-firme, ease-out) 1250ms;
    }
    .cine.b-mascota .cine-e7__num--nuevo {
      opacity: 1;
      transform: none;
      transition-delay: 1300ms;
    }

    .cine-e7__dial .cine-e7__ranura {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 66%;
      translate: -50% -50%;
      opacity: 0;
      transform: scale(0.7);
      transition:
        opacity 240ms ease-out,
        transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out);
    }
    .cine-e7__ranura rect {
      fill: #ece3cf;
      stroke: #c7781c;
      stroke-width: 4.5;
      stroke-linecap: round;
      stroke-dasharray: 1 1;
    }

    /* ---- Las naves reciben la onda: se sacuden en el orden en que les llega ---- */
    .cine-e7__nave > .k-cuerpo {
      position: relative;
    }
    .cine-e7__recibe {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 150%;
      aspect-ratio: 1 / 1;
      translate: -50% -50%;
      border-radius: 50%;
      background: radial-gradient(
        circle closest-side,
        rgba(235, 155, 60, 0.55),
        rgba(235, 155, 60, 0)
      );
      opacity: 0;
    }
    .cine-e7__onda {
      pointer-events: none;
    }
    .cine-e7 .cine-e7__onda > span {
      inset: -30%;
      border-width: 3px;
      animation-duration: 2.2s;
    }
    .cine.b-borde-salida .cine-e7__onda > span {
      animation-name: cine-onda;
      animation-delay: calc(250ms + var(--i, 0) * 240ms);
    }
    .cine.b-borde-salida .cine-e7__nave > .k-cuerpo {
      animation: cine-e7-sacudon 720ms cubic-bezier(0.3, 1.2, 0.5, 1)
        calc(650ms + var(--r, 0) * 100ms);
    }
    .cine.b-borde-salida .cine-e7__recibe {
      animation: cine-e7-destello 800ms ease-out calc(650ms + var(--r, 0) * 100ms);
    }

    /* ---- Vacío: lo encendieron sin frecuencia. Salir cuesta menos que entrar ---- */
    .cine.b-vacio .cine-e7__cable,
    .cine.b-vacio .cine-e7__emite path {
      opacity: 0;
    }
    .cine.b-vacio .cine-e7__puerto .cine-e7__brillo {
      opacity: 0;
      transition-delay: 0ms;
    }
    .cine.b-vacio .cine-e7__puerto .cine-e7__pin {
      fill: #6b6252;
      transition-delay: 0ms;
    }
    .cine.b-vacio .cine-e7__num--nuevo {
      opacity: 0;
      transform: translateY(-40%);
      transition:
        opacity 180ms ease-in,
        transform var(--resorte-firme-ms, 360ms) var(--resorte-firme, ease-out);
    }
    .cine.b-vacio .cine-e7__aguja {
      transform: rotate(-135deg);
      opacity: 0.4;
      transition:
        transform var(--resorte-firme-ms, 360ms) var(--resorte-firme, ease-out),
        opacity 200ms ease-out;
    }
    .cine.b-vacio .cine-e7__ranura {
      opacity: 1;
      transform: none;
      transition-delay: 260ms;
    }
    .cine.b-vacio .cine-e7__ranura rect {
      animation: cine-e7-ranura 1.2s linear 700ms infinite;
    }

    @keyframes cine-e7-pulso {
      0%,
      100% {
        transform: none;
      }
      35% {
        transform: scale(1.14);
      }
    }
    @keyframes cine-e7-cometa {
      from {
        stroke-dashoffset: 0.12;
      }
      to {
        stroke-dashoffset: -1;
      }
    }
    @keyframes cine-e7-desajuste {
      0%,
      18%,
      52%,
      64%,
      100% {
        opacity: 1;
      }
      10% {
        opacity: 0.25;
      }
      58% {
        opacity: 0.4;
      }
    }
    @keyframes cine-e7-latido {
      0%,
      100% {
        transform: none;
      }
      40% {
        transform: scale(1.45);
      }
    }
    @keyframes cine-e7-sacudon {
      0%,
      100% {
        transform: none;
      }
      30% {
        transform: translate(-0.9cqw, -0.8cqh) rotate(-6deg);
      }
    }
    @keyframes cine-e7-destello {
      0%,
      100% {
        opacity: 0;
      }
      25% {
        opacity: 1;
      }
    }
    @keyframes cine-e7-ranura {
      0% {
        stroke-dashoffset: 0;
        opacity: 1;
      }
      50% {
        opacity: 0.35;
      }
      100% {
        stroke-dashoffset: -2;
        opacity: 1;
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Escena07Component {}
