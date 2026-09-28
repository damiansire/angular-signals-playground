import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Capítulo 10 · Esperar a que se estabilice. La exploradora habla desde arriba a la derecha y su
 * mensaje llega en pedazos cada vez más largos (sec, sector, sector oc, sector ocho) que caen por
 * la banda hasta la antena del repetidor. El repetidor contesta cada pedazo con un anillo coral,
 * los anillos se pisan y el medidor de temperatura sube hasta el tope. Con la calma la lluvia se
 * congela y se apaga, el mensaje completo se asienta en la pantalla como ficha ámbar y abajo
 * aparece el arco de espera, que se va vaciando: todavía no actúa, espera.
 *
 * Técnicas: la banda es un punteado REVELADO por máscara (el hilo del capítulo 1). Cada gota viaja
 * en curva con los ejes separados: el contenedor mueve X con una curva que frena y el hijo mueve Y
 * (y gira) con una que acelera, así la curva escala con el lienzo, a diferencia de un
 * `offset-path: path()` en píxeles. La banda es esa misma curva muestreada. Los anillos comparten
 * ciclo con las gotas y arrancan con la ráfaga, escondidos: cuando el beat los muestra ya caen
 * justo cuando llega cada pedazo. El medidor se llena por dashoffset en cuatro empujones (una
 * curva `linear()` escalonada) y el arco de espera se vacía con el mismo dashoffset, al revés.
 * Con movimiento reducido cada beat deja un cuadro legible: la ráfaga congelada en el aire.
 */
@Component({
  selector: 'app-escena-10',
  template: `
    <div class="k-mundo cine-e10">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <mask
            id="cine-e10-revela"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1600"
            height="900"
          >
            <path
              class="cine-e10__revela"
              pathLength="1"
              d="M 1408 108 C 1386 108, 1318 108, 1276 109 C 1233 110, 1191 111, 1154 112 C 1117 114, 1082 115, 1051 118 C 1020 120, 993 123, 970 126 C 946 129, 926 133, 908 138 C 891 142, 876 147, 864 153 C 851 159, 842 166, 833 173 C 825 181, 819 189, 814 198 C 809 207, 806 218, 803 228 C 801 239, 801 256, 800 262"
            />
          </mask>
        </defs>
        <g class="cine-e10__lejos">
          <line x1="150" y1="170" x2="290" y2="118" />
          <line x1="290" y1="118" x2="392" y2="206" />
          <circle cx="150" cy="170" r="12" />
          <circle cx="290" cy="118" r="9" />
          <circle cx="392" cy="206" r="11" />
          <line x1="1040" y1="800" x2="1170" y2="752" />
          <circle cx="1040" cy="800" r="11" />
          <circle cx="1170" cy="752" r="13" />
        </g>

        <!-- La banda: por donde cae la ráfaga, de la exploradora a la antena. -->
        <path
          class="cine-e10__banda"
          mask="url(#cine-e10-revela)"
          d="M 1408 108 C 1386 108, 1318 108, 1276 109 C 1233 110, 1191 111, 1154 112 C 1117 114, 1082 115, 1051 118 C 1020 120, 993 123, 970 126 C 946 129, 926 133, 908 138 C 891 142, 876 147, 864 153 C 851 159, 842 166, 833 173 C 825 181, 819 189, 814 198 C 809 207, 806 218, 803 228 C 801 239, 801 256, 800 262"
        />
        <g class="cine-e10__fuente">
          <circle class="cine-e10__fuente-halo" cx="1408" cy="108" r="24" />
          <circle class="cine-e10__fuente-nucleo" cx="1408" cy="108" r="10" />
        </g>

        <!-- El medidor de temperatura abraza al repetidor por la derecha; el tope es la raya de arriba. -->
        <g class="cine-e10__medidor">
          <path
            class="cine-e10__medidor-pista"
            pathLength="1"
            d="M 912.5 579 A 175 175 0 0 0 912.5 311"
          />
          <path
            class="cine-e10__medidor-nivel"
            pathLength="1"
            d="M 912.5 579 A 175 175 0 0 0 912.5 311"
          />
          <path
            class="cine-e10__medidor-marcas"
            d="M 972 525 L 983 530 M 990 445 L 1002 445 M 972 365 L 983 360"
          />
          <path class="cine-e10__medidor-tope" d="M 901 324 L 925 296" />
          <circle class="cine-e10__medidor-bulbo" cx="912.5" cy="579" r="13" />
        </g>

        <!-- El arco de espera: aparece con la calma y se vacía. La pausa del medio es el efecto quieto. -->
        <g class="cine-e10__espera">
          <circle class="cine-e10__espera-pista" cx="800" cy="612" r="34" />
          <circle
            class="cine-e10__espera-arco"
            cx="800"
            cy="612"
            r="34"
            pathLength="1"
            transform="rotate(-90 800 612)"
          />
          <line class="cine-e10__espera-pausa" x1="793" y1="603" x2="793" y2="621" />
          <line class="cine-e10__espera-pausa" x1="807" y1="603" x2="807" y2="621" />
        </g>
      </svg>

      <div class="k-actor k-transmision cine-e10__ondas" style="--x: 88; --y: 12; --w: 8">
        <span style="--i: 0"></span><span style="--i: 1"></span><span style="--i: 2"></span>
      </div>

      <!-- El héroe: el repetidor, con su antena coral, su pantalla vacía y los anillos que contesta. -->
      <div class="k-actor cine-e10__repetidor" style="--x: 50; --y: 44.22; --w: 15.5">
        <div class="k-cuerpo">
          <span class="cine-e10__calor"></span>
          <svg class="cine-e10__aparato" viewBox="676 248 248 300">
            <line class="cine-e10__mastil" x1="800" y1="362" x2="800" y2="278" />
            <rect class="cine-e10__collar" x="784" y="346" width="32" height="16" rx="4" />
            <circle class="cine-e10__punta" cx="800" cy="262" r="13" />
            <circle class="cine-e10__punta-luz" cx="795.5" cy="257.5" r="4" />
            <rect class="cine-e10__puerto" x="680" y="428" width="16" height="30" rx="4" />
            <rect class="cine-e10__puerto" x="904" y="428" width="16" height="30" rx="4" />
            <rect class="cine-e10__pata" x="720" y="524" width="24" height="18" rx="4" />
            <rect class="cine-e10__pata" x="856" y="524" width="24" height="18" rx="4" />
            <rect class="cine-e10__caja" x="692" y="360" width="216" height="170" rx="26" />
            <rect class="cine-e10__pantalla" x="724" y="386" width="152" height="88" rx="12" />
            <rect class="cine-e10__hueco" x="736" y="398" width="128" height="64" rx="7" />
            <circle class="cine-e10__dial" cx="742" cy="502" r="13" />
            <line class="cine-e10__aguja" x1="742" y1="502" x2="750" y2="494" />
            <circle class="cine-e10__luz" cx="790" cy="502" r="6" />
            <circle class="cine-e10__luz" cx="812" cy="502" r="6" />
            <path class="cine-e10__rejilla" d="M 846 494 H 882 M 846 502 H 882 M 846 510 H 882" />
          </svg>
          <!-- El mensaje completo: llega verde como un pedazo más y se asienta ámbar. -->
          <div class="cine-e10__ficha">
            <span class="cine-e10__ficha-oro"></span>
            <i></i><i></i><i></i><i></i>
          </div>
          <div class="k-onda cine-e10__ecos">
            <span style="--i: 0; --t: 1100; --ss: 0.45; --so: 0.85"></span>
            <span style="--i: 1; --t: 1550; --ss: 0.8; --so: 0.62"></span>
            <span style="--i: 2; --t: 2000; --ss: 1.15; --so: 0.4"></span>
            <span style="--i: 3; --t: 2450; --ss: 1.5; --so: 0.18"></span>
          </div>
        </div>
      </div>

      <!-- La ráfaga: cuatro pedazos de 1, 2, 3 y 4 gotas. --t es cuándo sale cada gota en el ciclo;
           --fx, --fy y --o son el cuadro congelado (a 1,7 s del ciclo). -->
      <div class="k-actor cine-e10__lluvia" style="--x: 88; --y: 12; --w: 0">
        <span class="cine-e10__gota" style="--t: 0; --fx: 1; --fy: 1; --o: 0"><i></i></span>
        <span class="cine-e10__gota" style="--t: 450; --fx: 1; --fy: 1; --o: 0"><i></i></span>
        <span class="cine-e10__gota" style="--t: 540; --fx: 1; --fy: 1; --o: 0"><i></i></span>
        <span class="cine-e10__gota" style="--t: 900; --fx: 0.956; --fy: 0.465; --o: 1"
          ><i></i
        ></span>
        <span class="cine-e10__gota" style="--t: 990; --fx: 0.92; --fy: 0.349; --o: 1"
          ><i></i
        ></span>
        <span class="cine-e10__gota" style="--t: 1080; --fx: 0.871; --fy: 0.254; --o: 1"
          ><i></i
        ></span>
        <span class="cine-e10__gota" style="--t: 1350; --fx: 0.614; --fy: 0.071; --o: 1"
          ><i></i
        ></span>
        <span class="cine-e10__gota" style="--t: 1440; --fx: 0.483; --fy: 0.038; --o: 1"
          ><i></i
        ></span>
        <span class="cine-e10__gota" style="--t: 1530; --fx: 0.33; --fy: 0.015; --o: 1"
          ><i></i
        ></span>
        <span class="cine-e10__gota" style="--t: 1620; --fx: 0.159; --fy: 0.003; --o: 1"
          ><i></i
        ></span>
      </div>

      <div class="k-actor k-nave cine-e10__tripu" style="--x: 16; --y: 38; --w: 6.2; --i: 0">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div
        class="k-actor k-nave k-nave--cap cine-e10__tripu"
        style="--x: 23; --y: 55; --w: 7.4; --i: 1"
      >
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave-cap" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div class="k-actor k-nave cine-e10__tripu" style="--x: 13; --y: 71; --w: 6; --i: 2">
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
    .cine-e10__lejos line {
      stroke: #cdc3ad;
      stroke-width: 3;
      stroke-dasharray: 2 10;
      stroke-linecap: round;
    }
    .cine-e10__lejos circle {
      fill: #efe7d4;
      stroke: #cdc3ad;
      stroke-width: 3;
    }

    /* ---- La fuente y la banda ---- */
    .cine-e10__fuente {
      opacity: 0;
      transition: opacity 400ms ease-out;
    }
    .cine.b-transmision .cine-e10__fuente {
      opacity: 1;
    }
    .cine-e10__fuente-halo {
      fill: none;
      stroke: #2f9e7f;
      stroke-width: 3;
      stroke-dasharray: 4 7;
    }
    .cine-e10__fuente-nucleo {
      fill: #2f9e7f;
      stroke: #1d6b55;
      stroke-width: 3;
    }
    /* El kit no le da alto a la transmisión: sin esto sus anillos serían una raya. */
    .cine-e10__ondas {
      aspect-ratio: 1 / 1;
    }
    .cine-e10__banda {
      fill: none;
      stroke: #9fd3c2;
      stroke-width: 5;
      stroke-linecap: round;
      stroke-dasharray: 0.5 14;
    }
    .cine-e10__revela {
      fill: none;
      stroke: #fff;
      stroke-width: 36;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      transition: stroke-dashoffset 1400ms var(--resorte-suave, ease-out) 350ms;
    }
    .cine.b-transmision .cine-e10__revela {
      stroke-dashoffset: 0;
    }

    /* ---- El repetidor: sube con rebote cuando la tarjeta del capítulo le deja el centro ---- */
    .cine-e10__repetidor > .k-cuerpo {
      position: relative;
      opacity: 0;
      transform: translateY(12cqh) scale(0.9);
      transition:
        opacity 280ms ease-out,
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out);
    }
    .cine.b-titulo-rincon .cine-e10__repetidor > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
    .cine-e10__aparato {
      position: relative;
    }
    .cine-e10__mastil {
      stroke: #3a342a;
      stroke-width: 6;
      stroke-linecap: round;
    }
    .cine-e10__collar {
      fill: #e8dcc2;
      stroke: #3a342a;
      stroke-width: 4;
    }
    .cine-e10__punta {
      fill: #ff5a4a;
      stroke: #3a342a;
      stroke-width: 4;
    }
    .cine-e10__punta-luz {
      fill: #ffd9cf;
    }
    .cine-e10__puerto,
    .cine-e10__pata {
      fill: #3a342a;
    }
    .cine-e10__caja {
      fill: #f4d29a;
      stroke: #3a342a;
      stroke-width: 5;
    }
    .cine-e10__pantalla {
      fill: #2a251c;
      stroke: #3a342a;
      stroke-width: 4;
    }
    .cine-e10__hueco {
      fill: none;
      stroke: #6b6252;
      stroke-width: 2.5;
      stroke-dasharray: 5 7;
    }
    .cine-e10__dial {
      fill: #fbf8ef;
      stroke: #3a342a;
      stroke-width: 4;
    }
    .cine-e10__aguja {
      stroke: #ff5a4a;
      stroke-width: 3.5;
      stroke-linecap: round;
    }
    .cine-e10__luz {
      fill: #cdc3ad;
      stroke: #3a342a;
      stroke-width: 2.5;
    }
    .cine-e10__rejilla {
      fill: none;
      stroke: #6b6252;
      stroke-width: 3;
      stroke-linecap: round;
    }

    /* ---- La ráfaga ---- */
    .cine-e10__lluvia {
      transition: opacity 360ms ease-out;
    }
    .cine-e10__gota {
      position: absolute;
      left: 0;
      top: 0;
      opacity: 0;
    }
    .cine-e10__gota > i {
      position: absolute;
      left: -0.95cqw;
      top: -0.31cqw;
      width: 1.9cqw;
      height: 0.62cqw;
      border-radius: 999px;
      background: #2f9e7f;
      box-shadow: inset 0 -0.12cqw 0 rgba(20, 70, 55, 0.35);
    }
    /* El cuadro congelado: cada gota donde estaba a 1,7 s del ciclo. En reproducción la animación
       lo pisa; con movimiento reducido es lo que queda. */
    .cine.b-rafaga .cine-e10__gota {
      opacity: var(--o);
      transform: translateX(calc(var(--fx) * -38cqw));
      animation: cine-e10-gota-x 2800ms linear infinite both;
      animation-delay: calc(var(--t) * 1ms);
    }
    .cine.b-rafaga .cine-e10__gota > i {
      transform: translateY(calc(var(--fy) * 17.11cqh)) rotate(calc(var(--fy) * -89deg));
      animation: cine-e10-gota-y 2800ms linear infinite both;
      animation-delay: calc(var(--t) * 1ms);
    }

    /* ---- Los ecos: un anillo por pedazo que llega. Corren desde la ráfaga, escondidos, para
       caer en fase con las gotas; el beat solo los muestra. ---- */
    .cine-e10__ecos {
      --acento: #ff5a4a;
      position: absolute;
      left: 50%;
      top: 4.67%;
      width: 90.3%;
      translate: -50% -50%;
      opacity: 0;
      transition: opacity 300ms ease-out;
      pointer-events: none;
    }
    .cine-e10__ecos > span {
      border-width: 3px;
    }
    .cine.b-eco-multiple .cine-e10__ecos {
      opacity: 1;
    }
    .cine.b-eco-multiple .cine-e10__ecos > span {
      opacity: var(--so);
      transform: scale(var(--ss));
    }
    .cine.b-rafaga .cine-e10__ecos > span {
      animation: cine-e10-eco 2800ms linear infinite both;
      animation-delay: calc(var(--t) * 1ms);
    }

    /* ---- La temperatura ---- */
    .cine-e10__calor {
      position: absolute;
      left: 50%;
      top: 54%;
      width: 175%;
      aspect-ratio: 1 / 1.05;
      translate: -50% -50%;
      border-radius: 50%;
      background: radial-gradient(
        closest-side,
        rgba(255, 90, 74, 0.42),
        rgba(255, 90, 74, 0.15) 58%,
        rgba(255, 90, 74, 0)
      );
      opacity: 0;
      transition: opacity 1800ms ease-out 300ms;
    }
    .cine.b-temperatura .cine-e10__calor {
      opacity: 1;
    }
    .cine.b-temperatura .cine-e10__aparato {
      animation: cine-e10-tiembla 1400ms linear 600ms infinite;
    }
    .cine-e10__medidor {
      opacity: 0;
      transition: opacity 200ms ease-out;
    }
    .cine.b-temperatura .cine-e10__medidor {
      opacity: 1;
    }
    .cine-e10__medidor-pista,
    .cine-e10__medidor-nivel {
      fill: none;
      stroke-linecap: round;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
    }
    .cine-e10__medidor-pista {
      stroke: #e6dcc6;
      stroke-width: 18;
      transition: stroke-dashoffset 600ms var(--resorte-suave, ease-out);
    }
    .cine-e10__medidor-nivel {
      stroke: #ff5a4a;
      stroke-width: 10;
    }
    .cine.b-temperatura .cine-e10__medidor-pista {
      stroke-dashoffset: 0;
    }
    /* Cuatro empujones, uno por respuesta, y un respiro corto entre cada uno. */
    .cine.b-temperatura .cine-e10__medidor-nivel {
      stroke-dashoffset: 0.07;
      transition: stroke-dashoffset 2600ms ease-out 450ms;
      transition: stroke-dashoffset 2600ms
        linear(0, 0.22 16%, 0.25 25%, 0.47 41%, 0.5 50%, 0.72 66%, 0.75 75%, 0.96 91%, 1) 450ms;
    }
    .cine-e10__medidor-marcas {
      fill: none;
      stroke: #6b6252;
      stroke-width: 3;
      stroke-linecap: round;
    }
    .cine-e10__medidor-tope {
      fill: none;
      stroke: #3a342a;
      stroke-width: 5;
      stroke-linecap: round;
    }
    .cine-e10__medidor-bulbo {
      fill: #ff5a4a;
      stroke: #3a342a;
      stroke-width: 3.5;
    }

    /* La tripulación se echa atrás cuando el repetidor calienta, y vuelve con la calma. */
    .cine-e10__tripu {
      transition: transform var(--resorte-suave-ms, 520ms) var(--resorte-suave, ease-out)
        calc(var(--i, 0) * 80ms + 700ms);
    }
    .cine.b-temperatura .cine-e10__tripu {
      transform: translateX(-1.4cqw);
    }
    .cine.b-calma .cine-e10__tripu {
      transform: none;
    }

    /* ---- La calma: la lluvia se congela y se apaga, todo se enfría, el mensaje se asienta ---- */
    .cine.b-calma .cine-e10__lluvia {
      opacity: 0;
    }
    .cine.b-calma .cine-e10__gota,
    .cine.b-calma .cine-e10__gota > i,
    .cine.b-calma .cine-e10__ecos > span {
      animation-play-state: paused;
    }
    .cine.b-calma .cine-e10__ecos {
      opacity: 0;
    }
    .cine.b-calma .cine-e10__aparato {
      animation: none;
    }
    .cine.b-calma .cine-e10__calor {
      opacity: 0;
      transition: opacity 1400ms ease-out 300ms;
    }
    .cine.b-calma .cine-e10__medidor-nivel {
      stroke-dashoffset: 0.74;
      transition: stroke-dashoffset 2200ms var(--resorte-suave, ease-out) 300ms;
    }
    .cine-e10__banda {
      transition: stroke 1200ms ease-out 200ms;
    }
    .cine.b-calma .cine-e10__banda {
      stroke: #d6ccb6;
    }
    .cine.b-calma .cine-e10__fuente {
      opacity: 0.45;
      transition: opacity 1200ms ease-out 200ms;
    }

    .cine-e10__ficha {
      position: absolute;
      left: 50%;
      top: 60.67%;
      width: 48.4%;
      aspect-ratio: 120 / 52;
      translate: -50% -50%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4.5%;
      border-radius: 0.8cqw;
      background: #2f9e7f;
      box-shadow: 0 0.6cqw 1cqw -0.6cqw rgba(0, 0, 0, 0.6);
      opacity: 0;
      transform: translateY(-18.67cqh) scale(0.4);
      transition:
        opacity 180ms linear 150ms,
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out) 150ms;
    }
    .cine-e10__ficha-oro {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      border: 0.2cqw solid #3a342a;
      background: radial-gradient(circle at 38% 30%, #ffe0a8 0%, #f2ab41 55%, #d98a24 100%);
      box-shadow: inset 0 -0.3cqw 0.6cqw rgba(120, 70, 10, 0.35);
      opacity: 0;
      transition: opacity 450ms ease-out 650ms;
    }
    .cine-e10__ficha > i {
      position: relative;
      width: 16%;
      height: 19%;
      border-radius: 999px;
      background: #d9f2e9;
      transition: background-color 450ms ease-out 650ms;
    }
    .cine.b-calma .cine-e10__ficha {
      opacity: 1;
      transform: none;
    }
    .cine.b-calma .cine-e10__ficha-oro {
      opacity: 1;
    }
    .cine.b-calma .cine-e10__ficha > i {
      background-color: #3a342a;
    }

    .cine-e10__espera {
      opacity: 0;
      transform-box: fill-box;
      transform-origin: center;
      transform: scale(0.6);
      transition:
        opacity 260ms ease-out 900ms,
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out) 900ms;
    }
    .cine.b-calma .cine-e10__espera {
      opacity: 1;
      transform: none;
    }
    .cine-e10__espera-pista {
      fill: #fbf8ef;
      stroke: #e6dcc6;
      stroke-width: 10;
    }
    .cine-e10__espera-arco {
      fill: none;
      stroke: #ff5a4a;
      stroke-width: 10;
      stroke-linecap: round;
      stroke-dasharray: 1;
      stroke-dashoffset: 0;
    }
    .cine.b-calma .cine-e10__espera-arco {
      stroke-dashoffset: 0.62;
      transition: stroke-dashoffset 7000ms linear 1400ms;
    }
    .cine-e10__espera-pausa {
      stroke: #3a342a;
      stroke-width: 5;
      stroke-linecap: round;
    }

    /* X frena, Y acelera: la gota sale de costado y cae sobre la antena. El giro sigue a Y, que es
       cuando la curva dobla. El viaje es el 39,3% del ciclo (1,1 s de 2,8 s). */
    @keyframes cine-e10-gota-x {
      0% {
        opacity: 0;
        transform: translateX(0);
        animation-timing-function: cubic-bezier(0.25, 0.55, 0.45, 1);
      }
      2% {
        opacity: 1;
      }
      37.5% {
        opacity: 1;
      }
      39.3%,
      100% {
        opacity: 0;
        transform: translateX(-38cqw);
      }
    }
    @keyframes cine-e10-gota-y {
      0% {
        transform: translateY(0) rotate(0deg);
        animation-timing-function: cubic-bezier(0.55, 0, 0.8, 0.55);
      }
      39.3%,
      100% {
        transform: translateY(17.11cqh) rotate(-89deg);
      }
    }
    @keyframes cine-e10-eco {
      0% {
        opacity: 0;
        transform: scale(0.15);
        animation-timing-function: cubic-bezier(0.2, 0.7, 0.3, 1);
      }
      1% {
        opacity: 0.9;
      }
      53.6%,
      100% {
        opacity: 0;
        transform: scale(1.6);
      }
    }
    /* Tiembla a ráfagas, no parejo: como algo que aguanta y cada tanto no aguanta. */
    @keyframes cine-e10-tiembla {
      0%,
      40%,
      100% {
        transform: none;
      }
      8% {
        transform: translate(-0.14cqw, 0.06cqw) rotate(-0.6deg);
      }
      16% {
        transform: translate(0.12cqw, -0.05cqw) rotate(0.5deg);
      }
      24% {
        transform: translate(-0.1cqw, -0.04cqw) rotate(-0.4deg);
      }
      32% {
        transform: translate(0.08cqw, 0.05cqw) rotate(0.3deg);
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Escena10Component {}
