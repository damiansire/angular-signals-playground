import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Capítulo 11 · Quien lee, avisa. El cierre: vuelve el árbol de siete nodos del capítulo 0, ahora
 * dorado y apagado, envuelto por el halo tinta de Zone.js. Abajo, la caja de valor dorada; tres
 * hilos de lectura la unen con los únicos tres nodos que la leen. Cuando la caja cambia, el aviso
 * viaja solo por esos hilos y solo esos tres se encienden. Arriba cuelga la pregunta del viaje, que
 * se enciende cuando la tripulación la repite; al final el halo de Zone.js se cierra y se va.
 *
 * Técnicas: el halo entra y sale con un iris (clip-path circle) sobre una viñeta de degradado; las
 * ramas y los contornos de los nodos se dibujan con stroke-dashoffset, por filas; los hilos
 * punteados se revelan con una máscara que se dibuja (el mismo truco del capítulo 1) y el aviso es
 * un "cometa" que recorre cada hilo animando solo el dashoffset. Los nodos lectores son actores
 * HTML encima del dibujo, porque son lo único del árbol que se mueve. La pregunta brilla con escala,
 * opacidad y un halo radial, sin filtros.
 */
@Component({
  selector: 'app-escena-11',
  template: `
    <div class="k-mundo cine-e11">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <mask
            id="cine-e11-revela"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1600"
            height="900"
          >
            <path
              class="cine-e11__revela"
              style="--i: 0"
              pathLength="1"
              d="M 560 442 C 562 650, 690 700, 800 704"
            />
            <path
              class="cine-e11__revela"
              style="--i: 1"
              pathLength="1"
              d="M 910 584 C 900 650, 830 670, 800 704"
            />
            <path
              class="cine-e11__revela"
              style="--i: 2"
              pathLength="1"
              d="M 1164 584 C 1140 680, 920 705, 800 704"
            />
          </mask>
        </defs>

        <g class="cine-e11__lejos">
          <line x1="1170" y1="210" x2="1290" y2="165" />
          <line x1="1290" y1="165" x2="1360" y2="245" />
          <circle cx="1170" cy="210" r="11" />
          <circle cx="1290" cy="165" r="8" />
          <circle cx="1360" cy="245" r="10" />
          <line x1="340" y1="745" x2="430" y2="780" />
          <circle cx="340" cy="745" r="10" />
          <circle cx="430" cy="780" r="12" />
        </g>

        <!-- El árbol del capítulo 0, en los mismos lugares: raíz, dos hijos, cuatro hojas. Las ramas
             van de borde a borde para dibujarse sin cruzar el relleno de los nodos. -->
        <g class="cine-e11__ramas">
          <path style="--f: 0" pathLength="1" d="M 776.8 283.9 L 580.6 401.7" />
          <path style="--f: 0" pathLength="1" d="M 823.2 283.9 L 1019.4 401.7" />
          <path style="--f: 1" pathLength="1" d="M 544.1 431.9 L 446.9 541.3" />
          <path style="--f: 1" pathLength="1" d="M 575.9 431.9 L 673.1 541.3" />
          <path style="--f: 1" pathLength="1" d="M 1024.1 431.9 L 926.9 541.3" />
          <path style="--f: 1" pathLength="1" d="M 1055.9 431.9 L 1153.1 541.3" />
        </g>
        <g class="cine-e11__nodo" style="--f: 0; --i: 0">
          <circle class="cine-e11__relleno" cx="800" cy="270" r="27" />
          <circle
            class="cine-e11__contorno"
            cx="800"
            cy="270"
            r="27"
            pathLength="1"
            transform="rotate(-90 800 270)"
          />
        </g>
        <g class="cine-e11__nodo" style="--f: 1; --i: 0">
          <circle class="cine-e11__relleno" cx="560" cy="414" r="24" />
          <circle
            class="cine-e11__contorno"
            cx="560"
            cy="414"
            r="24"
            pathLength="1"
            transform="rotate(-90 560 414)"
          />
        </g>
        <g class="cine-e11__nodo" style="--f: 1; --i: 1">
          <circle class="cine-e11__relleno" cx="1040" cy="414" r="24" />
          <circle
            class="cine-e11__contorno"
            cx="1040"
            cy="414"
            r="24"
            pathLength="1"
            transform="rotate(-90 1040 414)"
          />
        </g>
        <g class="cine-e11__nodo" style="--f: 2; --i: 0">
          <circle class="cine-e11__relleno" cx="432" cy="558" r="22.4" />
          <circle
            class="cine-e11__contorno"
            cx="432"
            cy="558"
            r="22.4"
            pathLength="1"
            transform="rotate(-90 432 558)"
          />
        </g>
        <g class="cine-e11__nodo" style="--f: 2; --i: 1">
          <circle class="cine-e11__relleno" cx="688" cy="558" r="22.4" />
          <circle
            class="cine-e11__contorno"
            cx="688"
            cy="558"
            r="22.4"
            pathLength="1"
            transform="rotate(-90 688 558)"
          />
        </g>
        <g class="cine-e11__nodo" style="--f: 2; --i: 2">
          <circle class="cine-e11__relleno" cx="912" cy="558" r="22.4" />
          <circle
            class="cine-e11__contorno"
            cx="912"
            cy="558"
            r="22.4"
            pathLength="1"
            transform="rotate(-90 912 558)"
          />
        </g>
        <g class="cine-e11__nodo" style="--f: 2; --i: 3">
          <circle class="cine-e11__relleno" cx="1168" cy="558" r="22.4" />
          <circle
            class="cine-e11__contorno"
            cx="1168"
            cy="558"
            r="22.4"
            pathLength="1"
            transform="rotate(-90 1168 558)"
          />
        </g>

        <!-- Los hilos de lectura: van de quien lee a la caja, punteados y revelados por la máscara. -->
        <g class="cine-e11__hilos" mask="url(#cine-e11-revela)">
          <path d="M 560 442 C 562 650, 690 700, 800 704" />
          <path d="M 910 584 C 900 650, 830 670, 800 704" />
          <path d="M 1164 584 C 1140 680, 920 705, 800 704" />
        </g>
        <!-- El aviso: el mismo camino al revés, de la caja a cada lector. -->
        <path
          class="cine-e11__cometa"
          style="--i: 0"
          pathLength="1"
          d="M 800 704 C 690 700, 562 650, 560 442"
        />
        <path
          class="cine-e11__cometa"
          style="--i: 1"
          pathLength="1"
          d="M 800 704 C 830 670, 900 650, 910 584"
        />
        <path
          class="cine-e11__cometa"
          style="--i: 2"
          pathLength="1"
          d="M 800 704 C 920 705, 1140 680, 1164 584"
        />
      </svg>

      <!-- Zone.js: un halo tinta que envuelve la escena entera, con su anillo que lo abarca todo. -->
      <div class="cine-e11__zona">
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet">
          <ellipse class="cine-e11__anillo" cx="800" cy="445" rx="760" ry="415" />
        </svg>
      </div>

      <div class="k-actor cine-e11__caja" style="--x: 50; --y: 82; --w: 4.6">
        <div class="k-cuerpo">
          <span class="cine-e11__valor cine-e11__valor--antes">7</span>
          <span class="cine-e11__valor cine-e11__valor--despues">8</span>
        </div>
      </div>
      <div
        class="k-actor k-onda cine-e11__onda"
        style="--x: 50; --y: 82; --w: 10; --acento: #c98a2a"
      >
        <span style="--i: 0"></span><span style="--i: 1"></span><span style="--i: 2"></span>
      </div>

      <!-- Los tres lectores: encima de sus nodos, apagados hasta que les llega el aviso. -->
      <div class="k-actor cine-e11__lector" style="--x: 35; --y: 46; --w: 3; --i: 0">
        <div class="k-cuerpo">
          <span class="cine-e11__lector-halo"></span><span class="cine-e11__lector-nucleo"></span>
        </div>
      </div>
      <div class="k-actor cine-e11__lector" style="--x: 57; --y: 62; --w: 2.8; --i: 1">
        <div class="k-cuerpo">
          <span class="cine-e11__lector-halo"></span><span class="cine-e11__lector-nucleo"></span>
        </div>
      </div>
      <div class="k-actor cine-e11__lector" style="--x: 73; --y: 62; --w: 2.8; --i: 2">
        <div class="k-cuerpo">
          <span class="cine-e11__lector-halo"></span><span class="cine-e11__lector-nucleo"></span>
        </div>
      </div>

      <!-- La pregunta del viaje, colgada arriba: apagada hasta que alguien la repite. -->
      <div class="k-actor cine-e11__pregunta" style="--x: 50; --y: 13; --w: 4.5">
        <div class="k-cuerpo">
          <span class="cine-e11__pregunta-halo"></span>
          <svg viewBox="0 0 100 140">
            <path
              class="cine-e11__gancho"
              pathLength="1"
              d="M 28 40 C 28 18, 46 8, 60 10 C 78 12, 86 28, 82 44 C 78 58, 60 62, 54 76 C 51 83, 50 90, 50 98"
            />
            <circle class="cine-e11__punto" cx="50" cy="124" r="8" />
          </svg>
        </div>
      </div>

      <div class="k-actor k-nave k-nave--cap" style="--x: 19; --y: 53; --w: 7.5; --i: 0">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave-cap" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div class="k-actor k-nave" style="--x: 13; --y: 39; --w: 6; --i: 1">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div class="k-actor k-nave" style="--x: 12; --y: 67; --w: 6; --i: 2">
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
    .cine-e11__lejos line {
      stroke: #cdc3ad;
      stroke-width: 3;
      stroke-dasharray: 2 10;
      stroke-linecap: round;
    }
    .cine-e11__lejos circle {
      fill: #efe7d4;
      stroke: #cdc3ad;
      stroke-width: 3;
    }

    /* ---- Zone.js: entra con un iris que se abre, se va con uno que se cierra ---- */
    .cine-e11__zona {
      position: absolute;
      inset: 0;
      pointer-events: none;
      /* Una banda de tinta que abraza el anillo y se apaga antes del borde del lienzo: si llegara
         al borde, el halo dibujaría el rectángulo del lienzo contra el fondo de la sala. */
      background: radial-gradient(
        ellipse 47.5% 46.1% at 50% 49.4%,
        transparent 66%,
        rgba(32, 29, 22, 0.07) 86%,
        rgba(32, 29, 22, 0.13) 99%,
        rgba(32, 29, 22, 0.05) 103%,
        transparent 106%
      );
      clip-path: circle(0% at 50% 49%);
      transition: clip-path 1100ms var(--resorte-suave, ease-out);
    }
    /* 64 % es el radio justo que encierra el anillo y su banda: abierto de más, el iris de salida
       gastaría su primer tramo cerrándose sobre nada. */
    .cine.b-arbol-completo .cine-e11__zona {
      clip-path: circle(64% at 50% 49%);
    }
    /* Salir cuesta menos que entrar: el iris se cierra más rápido y se funde mientras se cierra. */
    .cine.b-zone-se-apaga .cine-e11__zona {
      clip-path: circle(0% at 50% 49%);
      opacity: 0;
      transition:
        clip-path 820ms cubic-bezier(0.45, 0, 0.55, 1),
        opacity 640ms ease-in 160ms;
    }
    .cine-e11__zona svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .cine-e11__anillo {
      fill: none;
      stroke: #6b6252;
      stroke-opacity: 0.5;
      stroke-width: 3;
      stroke-dasharray: 10 16;
      stroke-linecap: round;
    }

    /* ---- El árbol: dorado y apagado. Entra cuando la tarjeta del capítulo deja el centro ---- */
    .cine-e11__ramas path {
      fill: none;
      stroke: #d4bb86;
      stroke-width: 4;
      stroke-linecap: round;
      stroke-dasharray: 1 2;
      stroke-dashoffset: 1.01;
      transition: stroke-dashoffset 520ms var(--resorte-suave, ease-out)
        calc(200ms + var(--f) * 170ms);
    }
    .cine-e11__relleno {
      fill: #f3e8cf;
      opacity: 0;
      transition: opacity 320ms ease-out calc(120ms + var(--f) * 170ms + var(--i) * 50ms);
    }
    .cine-e11__contorno {
      fill: none;
      stroke: #c9a560;
      stroke-width: 4;
      stroke-dasharray: 1 2;
      stroke-dashoffset: 1.01;
      transition: stroke-dashoffset 640ms var(--resorte-suave, ease-out)
        calc(120ms + var(--f) * 170ms + var(--i) * 50ms);
    }
    .cine.b-arbol-completo.b-titulo-rincon .cine-e11__ramas path,
    .cine.b-arbol-completo.b-titulo-rincon .cine-e11__contorno {
      stroke-dashoffset: 0;
    }
    .cine.b-arbol-completo.b-titulo-rincon .cine-e11__relleno {
      opacity: 1;
    }

    /* ---- Los hilos de lectura y el aviso ---- */
    .cine-e11__hilos path {
      fill: none;
      stroke: #8b7d63;
      stroke-width: 4.5;
      stroke-linecap: round;
      stroke-dasharray: 0.5 14;
    }
    .cine-e11__revela {
      fill: none;
      stroke: #fff;
      stroke-width: 40;
      stroke-dasharray: 1 2;
      stroke-dashoffset: 1.01;
      transition: stroke-dashoffset 900ms var(--resorte-suave, ease-out)
        calc(820ms + var(--i) * 140ms);
    }
    .cine.b-arbol-completo.b-titulo-rincon .cine-e11__revela {
      stroke-dashoffset: 0;
    }
    /* Estacionado antes del comienzo del camino, invisible hasta que la caja cambia. */
    .cine-e11__cometa {
      fill: none;
      stroke: #e0a23a;
      stroke-width: 12;
      stroke-linecap: round;
      stroke-dasharray: 0.08 2;
      stroke-dashoffset: 0.08;
    }
    .cine.b-lectores-encendidos .cine-e11__cometa {
      animation: cine-e11-cometa 760ms cubic-bezier(0.45, 0, 0.2, 1) calc(220ms + var(--i) * 150ms)
        1 both;
    }

    /* ---- La caja de valor: aparece en su lugar con el rebote del héroe ---- */
    .cine-e11__caja {
      aspect-ratio: 1 / 1;
    }
    .cine-e11__caja > .k-cuerpo {
      position: relative;
      aspect-ratio: 1 / 1;
      display: grid;
      place-items: center;
      border-radius: 22%;
      border: 3px solid #3a342a;
      background: radial-gradient(circle at 38% 30%, #ffeec4 0%, #e6b052 55%, #c98a2a 100%);
      box-shadow:
        inset 0 -5px 10px rgba(110, 70, 10, 0.35),
        0 16px 26px -16px rgba(90, 60, 20, 0.55);
      opacity: 0;
      transform: scale(0.4) rotate(-12deg);
      transition:
        opacity 200ms linear 560ms,
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out) 560ms;
    }
    .cine.b-arbol-completo.b-titulo-rincon .cine-e11__caja > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    .cine.b-lectores-encendidos .cine-e11__caja > .k-cuerpo {
      animation: cine-e11-pulso 820ms cubic-bezier(0.3, 1.4, 0.5, 1) 1;
    }
    .cine-e11__valor {
      grid-area: 1 / 1;
      font:
        700 clamp(12px, 2.5cqw, 40px) / 1 ui-monospace,
        Menlo,
        Consolas,
        monospace;
      color: #201d16;
      transition:
        opacity 240ms ease-out,
        transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out);
    }
    .cine-e11__valor--despues {
      opacity: 0;
      transform: translateY(40%);
    }
    .cine.b-lectores-encendidos .cine-e11__valor--antes {
      opacity: 0;
      transform: translateY(-40%);
    }
    .cine.b-lectores-encendidos .cine-e11__valor--despues {
      opacity: 1;
      transform: none;
    }
    .cine-e11__onda {
      pointer-events: none;
    }
    .cine.b-lectores-encendidos .cine-e11__onda > span {
      animation-name: cine-onda;
    }

    /* ---- Los lectores: cada uno se enciende cuando el cometa llega a su nodo ---- */
    .cine-e11__lector {
      aspect-ratio: 1 / 1;
    }
    .cine-e11__lector > .k-cuerpo {
      position: relative;
      aspect-ratio: 1 / 1;
      opacity: 0;
      transform: scale(0.4);
      transition:
        opacity 180ms linear calc(900ms + var(--i) * 150ms),
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out)
          calc(900ms + var(--i) * 150ms);
    }
    .cine.b-lectores-encendidos .cine-e11__lector > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    .cine-e11__lector-halo,
    .cine-e11__lector-nucleo {
      position: absolute;
      left: 50%;
      top: 50%;
      aspect-ratio: 1 / 1;
      translate: -50% -50%;
      border-radius: 50%;
    }
    .cine-e11__lector-halo {
      width: 280%;
      background: radial-gradient(
        circle,
        rgba(236, 176, 72, 0.55) 0%,
        rgba(236, 176, 72, 0.18) 40%,
        transparent 70%
      );
    }
    .cine.b-lectores-encendidos .cine-e11__lector-halo {
      animation: cine-e11-destello 820ms cubic-bezier(0.3, 1.4, 0.5, 1)
        calc(1000ms + var(--i) * 150ms) 1;
    }
    .cine-e11__lector-nucleo {
      width: 100%;
      box-sizing: border-box;
      border: 3px solid #6a4a16;
      background: radial-gradient(circle at 38% 32%, #fff3d2 0%, #eab24f 50%, #c98a2a 100%);
      box-shadow: inset 0 -3px 6px rgba(110, 70, 10, 0.35);
    }

    /* ---- La pregunta: se escribe apagada y brilla cuando la repiten ---- */
    .cine-e11__pregunta > .k-cuerpo {
      position: relative;
    }
    .cine-e11__pregunta svg {
      position: relative;
    }
    .cine-e11__pregunta-halo {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 300%;
      aspect-ratio: 1 / 1;
      translate: -50% -50%;
      border-radius: 50%;
      background: radial-gradient(
        circle,
        rgba(232, 168, 60, 0.62) 0%,
        rgba(232, 168, 60, 0.26) 34%,
        transparent 68%
      );
      opacity: 0;
      transform: scale(0.5);
      transition:
        opacity 520ms ease-out,
        transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out);
    }
    .cine-e11__gancho {
      fill: none;
      stroke: #d6c39b;
      stroke-width: 11;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 1 2;
      stroke-dashoffset: 1.01;
      transition:
        stroke-dashoffset 900ms var(--resorte-suave, ease-out) 1150ms,
        stroke 480ms ease-out;
    }
    .cine-e11__punto {
      fill: #d6c39b;
      opacity: 0;
      transition:
        opacity 240ms ease-out 1900ms,
        fill 480ms ease-out;
    }
    .cine.b-arbol-completo.b-titulo-rincon .cine-e11__gancho {
      stroke-dashoffset: 0;
    }
    .cine.b-arbol-completo.b-titulo-rincon .cine-e11__punto {
      opacity: 1;
    }
    .cine.b-pregunta-brilla .cine-e11__gancho {
      stroke: #c98a2a;
    }
    .cine.b-pregunta-brilla .cine-e11__punto {
      fill: #c98a2a;
    }
    .cine.b-pregunta-brilla .cine-e11__pregunta-halo {
      opacity: 1;
      transform: none;
    }
    /* El único loop propio de la escena: la pregunta espera la respuesta. Arranca cuando el halo
       ya llegó, así el primer cuadro del loop coincide con el estado de reposo. */
    .cine.b-pregunta-brilla .cine-e11__pregunta > .k-cuerpo {
      animation: cine-e11-late 1500ms ease-in-out 560ms infinite alternate;
    }
    .cine.b-pregunta-brilla .cine-e11__pregunta-halo {
      animation: cine-e11-brillo 1500ms ease-in-out 560ms infinite alternate;
    }

    @keyframes cine-e11-cometa {
      from {
        stroke-dashoffset: 0.08;
      }
      to {
        stroke-dashoffset: -1;
      }
    }
    @keyframes cine-e11-pulso {
      0%,
      100% {
        transform: none;
      }
      35% {
        transform: scale(1.1);
      }
    }
    @keyframes cine-e11-destello {
      0%,
      100% {
        transform: none;
      }
      40% {
        transform: scale(1.35);
      }
    }
    @keyframes cine-e11-late {
      from {
        transform: none;
      }
      to {
        transform: scale(1.07);
      }
    }
    @keyframes cine-e11-brillo {
      from {
        opacity: 1;
      }
      to {
        opacity: 0.5;
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Escena11Component {}
