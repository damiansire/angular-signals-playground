import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Capítulo 4 · ¿Cambió, o solo se parece? La caja ámbar cae al centro con un 0. La Nave A le
 * tira dos fichas con el mismo 7: la primera cambia el valor y la caja avisa (un anillo que sale
 * hacia las naves, y cada panel suma una marca); la segunda se absorbe con un rebote corto y nada
 * más, porque no cambió. Después aparecen dos tarjetas gemelas con las mismas coordenadas, la
 * vieja a la izquierda y la copia del capitán a la derecha: la copia reemplaza a la vieja, la caja
 * avisa igual y los tres paneles se encienden. Una balanza une las dos tarjetas y su fiel duda
 * entre "=" y "≠"; al final, debajo de la caja, un dial vacío espera que alguien elija el criterio.
 *
 * Técnicas: la ficha viaja en arco con dos envoltorios (uno anima X, otro Y, con curvas
 * distintas), así el recorrido es curvo sin offset-path en píxeles, que no escalan con el lienzo.
 * La onda es la del kit pero en medialuna (solo el borde izquierdo), para que el aviso vaya HACIA
 * las naves y no pise a la mascota. La balanza y el enchufe del dial son punteados REVELADOS por
 * una máscara que se dibuja (como el hilo del capítulo 1). El fiel es un morph de `d` con el
 * resorte de rebote; su estado quieto es "=" con una tacha fantasma punteada, que es la duda sin
 * movimiento. El dial abre con un iris (clip-path) y solo después empieza a buscar.
 */
@Component({
  selector: 'app-escena-04',
  template: `
    <div class="k-mundo cine-e4">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <mask
            id="cine-e4-revela"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1600"
            height="900"
          >
            <path
              class="cine-e4__revela"
              pathLength="1"
              d="M 608 352 V 272 Q 608 261 619 261 H 800"
            />
            <path
              class="cine-e4__revela"
              pathLength="1"
              d="M 992 352 V 272 Q 992 261 981 261 H 800"
            />
            <path
              class="cine-e4__revela cine-e4__revela--enchufe"
              pathLength="1"
              d="M 800 544 V 488"
            />
          </mask>
        </defs>
        <g class="cine-e4__lejos">
          <line x1="1190" y1="150" x2="1330" y2="100" />
          <line x1="1330" y1="100" x2="1430" y2="190" />
          <circle cx="1190" cy="150" r="12" />
          <circle cx="1330" cy="100" r="9" />
          <circle cx="1430" cy="190" r="11" />
          <line x1="1050" y1="806" x2="1190" y2="758" />
          <circle cx="1050" cy="806" r="10" />
          <circle cx="1190" cy="758" r="13" />
        </g>
        <!-- La balanza: une la tarjeta vieja y la nueva pasando por el fiel. -->
        <path
          class="cine-e4__punteado"
          mask="url(#cine-e4-revela)"
          d="M 608 352 V 272 Q 608 261 619 261 H 981 Q 992 261 992 272 V 352"
        />
        <!-- El enchufe: el criterio del dial entra a la caja por abajo. -->
        <path class="cine-e4__punteado" mask="url(#cine-e4-revela)" d="M 800 544 V 488" />
      </svg>

      <!-- El aviso: medialunas que salen de la caja hacia las naves. -->
      <div class="k-actor k-onda cine-e4__onda" style="--x: 50; --y: 45; --w: 44">
        <span style="--i: 0"></span><span style="--i: 1"></span><span style="--i: 2"></span>
      </div>

      <div class="k-actor cine-e4__caja" style="--x: 50; --y: 45; --w: 10">
        <div class="k-cuerpo">
          <div class="cine-e4__cara">
            <span class="cine-e4__v cine-e4__v--0">0</span>
            <span class="cine-e4__v cine-e4__v--7">7</span>
            <span class="cine-e4__v cine-e4__v--coord cine-e4__v--a">(4,9)</span>
            <span class="cine-e4__v cine-e4__v--coord cine-e4__v--b">(4,9)</span>
          </div>
        </div>
      </div>

      <!-- La ficha que escribe la Nave A: la misma, dos veces. -->
      <div class="k-actor cine-e4__ficha" style="--x: 50; --y: 45; --w: 2.8">
        <div class="k-cuerpo">
          <span class="cine-e4__ficha-arco"><span class="cine-e4__ficha-bola">7</span></span>
        </div>
      </div>

      <div
        class="k-actor cine-e4__tarjeta cine-e4__tarjeta--a"
        style="--x: 38; --y: 45; --w: 7.5; --i: 0"
      >
        <div class="k-cuerpo">
          <span class="cine-e4__pin"></span><span class="cine-e4__coord">(4,9)</span>
        </div>
      </div>
      <div
        class="k-actor cine-e4__tarjeta cine-e4__tarjeta--b"
        style="--x: 62; --y: 45; --w: 7.5; --i: 1"
      >
        <div class="k-cuerpo">
          <span class="cine-e4__pin"></span><span class="cine-e4__coord">(4,9)</span>
        </div>
      </div>

      <!-- El fiel de la balanza: "=" con una tacha que aparece y se va. -->
      <div class="k-actor cine-e4__fiel" style="--x: 50; --y: 29; --w: 6">
        <div class="k-cuerpo">
          <svg viewBox="0 0 100 100">
            <path class="cine-e4__tacha-fantasma" d="M 63 18 L 37 82" />
            <path class="cine-e4__igual" d="M 26 40 H 74 M 26 60 H 74" />
            <path class="cine-e4__tacha" d="M 50 50 L 50 50" />
          </svg>
        </div>
      </div>

      <div class="k-actor cine-e4__dial" style="--x: 50; --y: 69; --w: 9.4">
        <div class="k-cuerpo">
          <svg class="cine-e4__dial-anillo" viewBox="-50 -50 100 100">
            <path
              class="cine-e4__dial-marcas"
              d="M 0 -31 L 0 -41 M 9.1 -33.8 L 10.6 -39.6 M 17.5 -30.3 L 20.5 -35.5 M 24.7 -24.7 L 29 -29 M 30.3 -17.5 L 35.5 -20.5 M 33.8 -9.1 L 39.6 -10.6 M 31 0 L 41 0 M 33.8 9.1 L 39.6 10.6 M 30.3 17.5 L 35.5 20.5 M 24.7 24.7 L 29 29 M 17.5 30.3 L 20.5 35.5 M 9.1 33.8 L 10.6 39.6 M 0 31 L 0 41 M -9.1 33.8 L -10.6 39.6 M -17.5 30.3 L -20.5 35.5 M -24.7 24.7 L -29 29 M -30.3 17.5 L -35.5 20.5 M -33.8 9.1 L -39.6 10.6 M -31 0 L -41 0 M -33.8 -9.1 L -39.6 -10.6 M -30.3 -17.5 L -35.5 -20.5 M -24.7 -24.7 L -29 -29 M -17.5 -30.3 L -20.5 -35.5 M -9.1 -33.8 L -10.6 -39.6"
            />
            <path class="cine-e4__dial-indice" d="M 0 -45 L -5.5 -35 L 5.5 -35 Z" />
          </svg>
          <span class="cine-e4__dial-txt">¿igual?</span>
        </div>
      </div>

      <div class="k-actor k-nave" style="--x: 16; --y: 33; --w: 6.2; --i: 0">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div class="k-actor k-nave k-nave--cap" style="--x: 23; --y: 52; --w: 7.4; --i: 1">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave-cap" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div class="k-actor k-nave" style="--x: 13; --y: 70; --w: 6; --i: 2">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>

      <!-- Los paneles de a bordo cuentan los avisos: una marca por cada vez que la caja avisó. -->
      <div class="k-actor cine-e4__panel" style="--x: 16; --y: 23; --w: 3.4; --i: 0">
        <div class="k-cuerpo">
          <span class="cine-e4__marca cine-e4__marca--1"></span>
          <span class="cine-e4__marca cine-e4__marca--2"></span>
        </div>
      </div>
      <div class="k-actor cine-e4__panel" style="--x: 23; --y: 42; --w: 3.4; --i: 1">
        <div class="k-cuerpo">
          <span class="cine-e4__marca cine-e4__marca--1"></span>
          <span class="cine-e4__marca cine-e4__marca--2"></span>
        </div>
      </div>
      <div class="k-actor cine-e4__panel" style="--x: 13; --y: 60; --w: 3.4; --i: 2">
        <div class="k-cuerpo">
          <span class="cine-e4__marca cine-e4__marca--1"></span>
          <span class="cine-e4__marca cine-e4__marca--2"></span>
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
    .cine-e4__lejos line {
      stroke: #cdc3ad;
      stroke-width: 3;
      stroke-dasharray: 2 10;
      stroke-linecap: round;
    }
    .cine-e4__lejos circle {
      fill: #efe7d4;
      stroke: #cdc3ad;
      stroke-width: 3;
    }

    /* ---- La caja: el héroe. Entra cuando la tarjeta del capítulo deja libre el centro ---- */
    .cine-e4__caja {
      aspect-ratio: 1 / 1;
    }
    .cine-e4__caja > .k-cuerpo {
      opacity: 0;
      transform: translateY(-58cqh) rotate(-8deg) scale(1.08);
      transition:
        opacity 200ms linear,
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out);
    }
    .cine.b-titulo-rincon .cine-e4__caja > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    /* Los golpes van en la cara y no en el cuerpo: así no se pelean con la transición de entrada. */
    .cine-e4__cara {
      position: relative;
      display: grid;
      place-items: center;
      aspect-ratio: 1 / 1;
      overflow: hidden;
      border-radius: 22%;
      border: 3px solid #3a342a;
      background: radial-gradient(circle at 38% 30%, #ffe0a8 0%, #f2ab41 55%, #d98a24 100%);
      box-shadow:
        inset 0 -6px 12px rgba(120, 70, 10, 0.35),
        0 18px 30px -18px rgba(90, 60, 20, 0.55);
      transform-origin: 50% 70%;
    }
    .cine.b-siete-dos-veces .cine-e4__cara {
      animation: cine-e4-golpes 1600ms linear 1620ms 1 none;
    }
    .cine.b-coordenadas-gemelas .cine-e4__cara {
      animation: cine-e4-pulso 760ms linear 1160ms 1 none;
    }

    /* El valor de la caja cambia como un contador que rueda: el viejo sube, el nuevo entra de abajo.
       La cara recorta, así el número sale y entra desde adentro de la caja. */
    .cine-e4__v {
      grid-area: 1 / 1;
      font:
        700 clamp(16px, 4.6cqw, 68px) / 1 ui-monospace,
        Menlo,
        Consolas,
        monospace;
      color: #201d16;
      transition:
        opacity 260ms ease-out,
        transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out);
    }
    .cine-e4__v--coord {
      font-size: clamp(9px, 2.05cqw, 30px);
      letter-spacing: -0.04em;
    }
    .cine-e4__v--7,
    .cine-e4__v--b {
      opacity: 0;
      transform: translateY(75%);
    }
    .cine-e4__v--a {
      opacity: 0;
    }
    .cine.b-siete-dos-veces .cine-e4__v--0 {
      opacity: 0;
      transform: translateY(-75%);
      transition-delay: 1640ms;
    }
    .cine.b-siete-dos-veces .cine-e4__v--7 {
      opacity: 1;
      transform: none;
      transition-delay: 1640ms;
    }
    /* Con las coordenadas el 7 se apaga en el lugar: ese cambio no es el que importa. */
    .cine.b-coordenadas-gemelas .cine-e4__v--7 {
      opacity: 0;
      transform: scale(0.7);
      transition:
        opacity 180ms ease-in,
        transform 180ms ease-in;
    }
    /* La coordenada vieja está en la caja un segundo y se va hacia arriba cuando entra la copia:
       es un paso de ida y vuelta dentro de un mismo beat, por eso es keyframe y su reposo es oculto. */
    .cine.b-coordenadas-gemelas .cine-e4__v--a {
      animation: cine-e4-coord-vieja 1300ms linear 120ms 1 both;
    }
    .cine.b-coordenadas-gemelas .cine-e4__v--b {
      opacity: 1;
      transform: none;
      transition-delay: 1160ms;
    }

    /* ---- La ficha: viaja en arco de la Nave A a la caja, dos veces ---- */
    .cine-e4__ficha {
      aspect-ratio: 1 / 1;
      pointer-events: none;
    }
    .cine-e4__ficha-arco {
      display: block;
    }
    .cine-e4__ficha-bola {
      display: grid;
      place-items: center;
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      border: 2px solid #3a342a;
      background: radial-gradient(circle at 38% 32%, #ffe6b8 0%, #f2ab41 60%, #d98a24 100%);
      font:
        700 clamp(8px, 1.55cqw, 24px) / 1 ui-monospace,
        Menlo,
        Consolas,
        monospace;
      color: #201d16;
      opacity: 0;
    }
    .cine.b-siete-dos-veces .cine-e4__ficha > .k-cuerpo {
      animation: cine-e4-ficha-x 1350ms linear 900ms 2 both;
    }
    .cine.b-siete-dos-veces .cine-e4__ficha-arco {
      animation: cine-e4-ficha-y 1350ms linear 900ms 2 both;
    }
    .cine.b-siete-dos-veces .cine-e4__ficha-bola {
      animation: cine-e4-ficha-bola 1350ms linear 900ms 2 both;
    }

    /* ---- La onda: solo el borde izquierdo, así el aviso tiene dirección ---- */
    .cine-e4__onda {
      pointer-events: none;
    }
    .cine-e4 .cine-e4__onda > span {
      border: 4px solid transparent;
      border-left-color: #eb9b3c;
    }
    /* Sin relleno hacia atrás: con demora larga, el primer cuadro de la onda se vería quieto. */
    .cine.b-siete-dos-veces .cine-e4__onda > span {
      animation: cine-onda 1500ms cubic-bezier(0.2, 0.7, 0.3, 1) calc(1640ms + var(--i) * 240ms) 1
        none;
    }
    /* Cambiar el nombre de la animación la reinicia: la misma onda avisa dos veces. */
    .cine.b-coordenadas-gemelas .cine-e4__onda > span {
      animation: cine-e4-onda 1500ms cubic-bezier(0.2, 0.7, 0.3, 1) calc(1160ms + var(--i) * 240ms)
        1 none;
    }

    /* ---- Tarjetas gemelas ---- */
    .cine-e4__tarjeta {
      aspect-ratio: 1.25 / 1;
    }
    .cine-e4 .cine-e4__tarjeta > .k-cuerpo {
      position: relative;
      display: grid;
      place-items: center;
      align-content: center;
      gap: 0.5cqw;
      height: 100%;
      aspect-ratio: 1.25 / 1;
      border-radius: 14%;
      border: 2px solid #3a342a;
      background: #fbf8ef;
      box-shadow: 0 12px 20px -14px rgba(60, 40, 10, 0.55);
      opacity: 0;
      transform: translateY(5cqh) scale(0.7);
      transition:
        opacity 240ms ease-out calc(120ms + var(--i) * 160ms),
        transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out)
          calc(120ms + var(--i) * 160ms),
        border-color 360ms ease-out 1160ms,
        background-color 360ms ease-out 1160ms;
    }
    .cine.b-coordenadas-gemelas .cine-e4__tarjeta > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    /* El contorno punteado de la vieja: queda como fantasma de lo que había. */
    .cine-e4__tarjeta--a > .k-cuerpo::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: inherit;
      border: 2px dashed #9a9081;
      opacity: 0;
      transition: opacity 360ms ease-out 1160ms;
    }
    .cine.b-coordenadas-gemelas .cine-e4__tarjeta--a > .k-cuerpo {
      border-color: transparent;
      background-color: rgba(251, 248, 239, 0.4);
    }
    .cine.b-coordenadas-gemelas .cine-e4__tarjeta--a > .k-cuerpo::after {
      opacity: 1;
    }
    .cine-e4__tarjeta--a .cine-e4__pin,
    .cine-e4__tarjeta--a .cine-e4__coord {
      transition: opacity 360ms ease-out 1160ms;
    }
    .cine.b-coordenadas-gemelas .cine-e4__tarjeta--a .cine-e4__pin,
    .cine.b-coordenadas-gemelas .cine-e4__tarjeta--a .cine-e4__coord {
      opacity: 0.42;
    }
    /* La copia empuja hacia la caja justo antes de entrar: es el gesto de reemplazar. */
    .cine.b-coordenadas-gemelas .cine-e4__tarjeta--b > .k-cuerpo {
      border-color: #c47a1c;
      background-color: #fff1d6;
      animation: cine-e4-empuja 520ms linear 980ms 1 none;
    }
    .cine-e4__pin {
      width: 1.5cqw;
      aspect-ratio: 1 / 1;
      border-radius: 50% 50% 50% 0;
      border: 2px solid #3a342a;
      background: radial-gradient(circle, #fbf8ef 0 24%, #eb9b3c 28%);
      transform: rotate(-45deg);
    }
    .cine-e4__coord {
      font:
        700 clamp(8px, 1.6cqw, 24px) / 1 ui-monospace,
        Menlo,
        Consolas,
        monospace;
      letter-spacing: -0.04em;
      color: #201d16;
    }

    /* ---- La balanza y el enchufe: punteados revelados por máscara ---- */
    .cine-e4__punteado {
      fill: none;
      stroke: #6b6252;
      stroke-width: 5;
      stroke-linecap: round;
      stroke-dasharray: 0.5 16;
    }
    .cine-e4__revela {
      fill: none;
      stroke: #fff;
      stroke-width: 40;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      transition: stroke-dashoffset 900ms var(--resorte-suave, ease-out);
    }
    .cine.b-balanza .cine-e4__revela {
      stroke-dashoffset: 0;
    }
    .cine-e4__revela--enchufe {
      transition-duration: 520ms;
      transition-delay: 560ms;
    }
    .cine.b-balanza .cine-e4__revela--enchufe {
      stroke-dashoffset: 1;
    }
    .cine.b-criterio .cine-e4__revela--enchufe {
      stroke-dashoffset: 0;
    }

    /* ---- El fiel: duda entre "=" y "≠" ---- */
    .cine-e4__fiel {
      aspect-ratio: 1 / 1;
    }
    .cine-e4__fiel > .k-cuerpo {
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      border: 3px solid #3a342a;
      background: radial-gradient(circle at 42% 36%, #fffaf0 0%, #fbf3e0 60%, #efe3c6 100%);
      box-shadow: 0 12px 20px -14px rgba(60, 40, 10, 0.55);
      opacity: 0;
      transform: scale(0.3) rotate(-30deg);
      transition:
        opacity 220ms ease-out 460ms,
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out) 460ms;
    }
    .cine.b-balanza .cine-e4__fiel > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    .cine-e4__igual {
      fill: none;
      stroke: #201d16;
      stroke-width: 9;
      stroke-linecap: round;
    }
    .cine-e4__tacha-fantasma {
      fill: none;
      stroke: #c9892f;
      stroke-width: 5;
      stroke-linecap: round;
      stroke-dasharray: 5 8;
      opacity: 0.85;
    }
    .cine-e4__tacha {
      fill: none;
      stroke: #d9801f;
      stroke-width: 9;
      stroke-linecap: round;
      opacity: 0;
    }
    .cine.b-balanza .cine-e4__tacha {
      animation: cine-e4-duda 1300ms var(--resorte-rebote, ease-out) 1100ms infinite alternate both;
    }
    .cine.b-balanza .cine-e4__fiel svg {
      animation: cine-e4-vaiven 1300ms ease-in-out 1100ms infinite alternate both;
    }
    /* Cuando aparece el dial, el foco pasa ahí: el fiel se queda quieto en su duda. */
    .cine.b-criterio .cine-e4__tacha,
    .cine.b-criterio .cine-e4__fiel svg {
      animation: none;
    }
    .cine.b-criterio .cine-e4__fiel > .k-cuerpo {
      opacity: 0.7;
      transition: opacity 400ms ease-out;
    }

    /* ---- El dial del criterio: abre con un iris y busca sin elegir ---- */
    .cine-e4__dial {
      aspect-ratio: 1 / 1;
    }
    .cine-e4__dial > .k-cuerpo {
      position: relative;
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      background: radial-gradient(circle at 42% 36%, #fffaf0 0%, #f6eedb 62%, #e6dbc2 100%);
      box-shadow:
        inset 0 0 0 3px #3a342a,
        0 14px 22px -16px rgba(60, 40, 10, 0.55);
      clip-path: circle(0% at 50% 50%);
      transition: clip-path 760ms var(--resorte-suave, ease-out);
    }
    .cine.b-criterio .cine-e4__dial > .k-cuerpo {
      clip-path: circle(85% at 50% 50%);
    }
    .cine-e4__dial-marcas {
      fill: none;
      stroke: #6b6252;
      stroke-width: 2.4;
      stroke-linecap: round;
    }
    .cine-e4__dial-indice {
      fill: #eb9b3c;
      stroke: #3a342a;
      stroke-width: 2;
      stroke-linejoin: round;
    }
    .cine.b-criterio .cine-e4__dial-anillo {
      animation: cine-e4-busca 3400ms ease-in-out 900ms infinite alternate both;
    }
    .cine-e4__dial-txt {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      font:
        italic 500 clamp(8px, 1.55cqw, 24px) / 1 'Iowan Old Style',
        'Palatino Linotype',
        Palatino,
        Georgia,
        serif;
      color: #3a342a;
      opacity: 0;
      transition: opacity 420ms ease-out 420ms;
    }
    .cine.b-criterio .cine-e4__dial-txt {
      opacity: 1;
    }

    /* ---- Paneles de a bordo: cuentan avisos ---- */
    .cine-e4__panel {
      aspect-ratio: 1.3 / 1;
    }
    /* El brillo del panel encendido es un degradado detrás, no un filtro. */
    .cine-e4__panel::before {
      content: '';
      position: absolute;
      inset: -70%;
      background: radial-gradient(circle, rgba(242, 171, 65, 0.5) 0%, transparent 62%);
      opacity: 0;
      transition: opacity 420ms ease-out calc(1600ms + var(--i) * 100ms);
    }
    .cine.b-coordenadas-gemelas .cine-e4__panel::before {
      opacity: 1;
    }
    .cine-e4 .cine-e4__panel > .k-cuerpo {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14%;
      height: 100%;
      aspect-ratio: 1.3 / 1;
      border-radius: 18%;
      border: 2px solid #3a342a;
      background-color: #fbf8ef;
      opacity: 0;
      transform: scale(0.6);
      transition:
        opacity 240ms ease-out 380ms,
        transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out) 380ms,
        background-color 360ms ease-out calc(1600ms + var(--i) * 100ms);
    }
    .cine.b-naves .cine-e4__panel > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    .cine.b-siete-dos-veces .cine-e4__panel > .k-cuerpo {
      animation: cine-e4-flash 900ms ease-out calc(2080ms + var(--i) * 100ms) 1 none;
    }
    .cine.b-coordenadas-gemelas .cine-e4__panel > .k-cuerpo {
      background-color: #f7c77e;
    }
    .cine-e4__marca {
      width: 13%;
      height: 48%;
      border-radius: 2px;
      background: #3a342a;
      transform: scaleY(0);
      transition: transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out);
    }
    .cine.b-siete-dos-veces .cine-e4__marca--1 {
      transform: none;
      transition-delay: calc(2080ms + var(--i) * 100ms);
    }
    .cine.b-coordenadas-gemelas .cine-e4__marca--2 {
      transform: none;
      transition-delay: calc(1600ms + var(--i) * 100ms);
    }

    @keyframes cine-e4-golpes {
      0% {
        transform: none;
        animation-timing-function: cubic-bezier(0.2, 0.8, 0.4, 1);
      }
      12% {
        transform: scale(1.1);
        animation-timing-function: cubic-bezier(0.4, 0, 0.4, 1);
      }
      30%,
      85% {
        transform: none;
        animation-timing-function: cubic-bezier(0.2, 0.8, 0.4, 1);
      }
      90% {
        transform: scale(0.95, 0.93);
        animation-timing-function: cubic-bezier(0.3, 1.5, 0.5, 1);
      }
      100% {
        transform: none;
      }
    }
    @keyframes cine-e4-pulso {
      0% {
        transform: none;
        animation-timing-function: cubic-bezier(0.2, 0.8, 0.4, 1);
      }
      30% {
        transform: scale(1.1);
        animation-timing-function: cubic-bezier(0.4, 0, 0.4, 1);
      }
      100% {
        transform: none;
      }
    }
    @keyframes cine-e4-coord-vieja {
      0% {
        opacity: 0;
        transform: scale(0.8);
        animation-timing-function: ease-out;
      }
      16% {
        opacity: 1;
        transform: none;
      }
      80% {
        opacity: 1;
        transform: none;
        animation-timing-function: cubic-bezier(0.5, 0, 0.3, 1);
      }
      100% {
        opacity: 0;
        transform: translateY(-75%);
      }
    }
    /* El arco de la ficha: X e Y con curvas distintas. Sube rápido, cae acelerando. */
    @keyframes cine-e4-ficha-x {
      0% {
        transform: translateX(-30.5cqw);
        animation-timing-function: cubic-bezier(0.45, 0, 0.4, 1);
      }
      55%,
      100% {
        transform: none;
      }
    }
    @keyframes cine-e4-ficha-y {
      0% {
        transform: translateY(-12cqh);
        animation-timing-function: cubic-bezier(0.2, 0.7, 0.4, 1);
      }
      22% {
        transform: translateY(-22cqh);
        animation-timing-function: cubic-bezier(0.6, 0, 0.9, 0.5);
      }
      55%,
      100% {
        transform: none;
      }
    }
    @keyframes cine-e4-ficha-bola {
      0% {
        opacity: 0;
        transform: scale(0.5);
      }
      6%,
      47% {
        opacity: 1;
        transform: none;
      }
      55%,
      100% {
        opacity: 0;
        transform: scale(0.3);
      }
    }
    @keyframes cine-e4-onda {
      0% {
        opacity: 0.85;
        transform: scale(0.15);
      }
      100% {
        opacity: 0;
        transform: scale(1.6);
      }
    }
    @keyframes cine-e4-flash {
      0%,
      100% {
        background-color: #fbf8ef;
      }
      25% {
        background-color: #f7c77e;
      }
    }
    @keyframes cine-e4-empuja {
      0% {
        transform: none;
        animation-timing-function: cubic-bezier(0.3, 0, 0.6, 1);
      }
      40% {
        transform: translateX(-1.4cqw) scale(0.96);
        animation-timing-function: cubic-bezier(0.2, 0.8, 0.4, 1);
      }
      100% {
        transform: none;
      }
    }
    @keyframes cine-e4-duda {
      0%,
      16% {
        d: path('M 50 50 L 50 50');
        opacity: 0;
      }
      24% {
        opacity: 1;
      }
      62%,
      100% {
        d: path('M 63 18 L 37 82');
        opacity: 1;
      }
    }
    @keyframes cine-e4-vaiven {
      from {
        transform: rotate(-6deg);
      }
      to {
        transform: rotate(6deg);
      }
    }
    @keyframes cine-e4-busca {
      from {
        transform: rotate(-38deg);
      }
      to {
        transform: rotate(38deg);
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Escena04Component {}
