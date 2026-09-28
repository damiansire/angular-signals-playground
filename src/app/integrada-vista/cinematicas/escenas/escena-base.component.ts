import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

import { acentoDe } from './acentos';

/**
 * La escena mínima de un capítulo: el átomo del concepto como héroe, la tripulación a la
 * izquierda, la mascota a la derecha y el eco de la exploradora arriba. Es la que se juega
 * cuando un capítulo todavía no tiene escena propia, y es también el molde de las escenas:
 * el mundo es un SVG de fondo (lo que se dibuja una vez) y los actores son HTML (lo que se mueve).
 */
@Component({
  selector: 'app-escena-base',
  template: `
    <div class="k-mundo cine-eb" [style.--acento]="acento()">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <!-- Moléculas lejanas: el mundo en el que cayeron. Quietas, para que el héroe se lea. -->
        <g class="cine-eb__lejos">
          <line x1="180" y1="170" x2="330" y2="120" />
          <line x1="330" y1="120" x2="420" y2="220" />
          <circle cx="180" cy="170" r="14" />
          <circle cx="330" cy="120" r="10" />
          <circle cx="420" cy="220" r="12" />
          <line x1="1240" y1="760" x2="1380" y2="700" />
          <line x1="1380" y1="700" x2="1470" y2="790" />
          <circle cx="1240" cy="760" r="11" />
          <circle cx="1380" cy="700" r="15" />
          <circle cx="1470" cy="790" r="9" />
        </g>
        <path
          class="k-trazo cine-eb__enlace"
          pathLength="1"
          d="M 420 560 C 560 470 660 450 740 430"
        />
      </svg>

      <div class="k-actor k-atomo cine-eb__heroe" style="--x: 50; --y: 46; --w: 17">
        <div class="k-cuerpo">
          <span class="k-atomo__halo"></span>
          <span class="k-atomo__orbita" style="--rot: 0deg">
            <span class="k-atomo__anillo"></span>
            <span class="k-atomo__e" style="--dur: 5.5s"></span>
          </span>
          <span class="k-atomo__orbita" style="--rot: 60deg">
            <span class="k-atomo__anillo"></span>
            <span class="k-atomo__e" style="--dur: 7s; --dly: -2s"></span>
          </span>
          <span class="k-atomo__orbita" style="--rot: -60deg">
            <span class="k-atomo__anillo"></span>
            <span class="k-atomo__e" style="--dur: 8.5s; --dly: -5s"></span>
          </span>
          <span class="k-atomo__nucleo"></span>
        </div>
      </div>

      <div class="k-actor k-nave k-nave--cap" style="--x: 22; --y: 58; --w: 7.5; --i: 0">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave-cap" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div class="k-actor k-nave" style="--x: 14; --y: 48; --w: 6; --i: 1">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>
      <div class="k-actor k-nave" style="--x: 13; --y: 68; --w: 6; --i: 2">
        <div class="k-cuerpo">
          <svg class="k-flota" viewBox="-70 -40 140 80">
            <use href="#cine-nave" x="-70" y="-40" width="140" height="80" />
          </svg>
        </div>
      </div>

      <div class="k-actor k-transmision" style="--x: 86; --y: 16; --w: 9">
        <span style="--i: 0"></span><span style="--i: 1"></span><span style="--i: 2"></span>
      </div>

      <div class="k-actor k-mascota" style="--x: 84; --y: 64; --w: 10">
        <div class="k-cuerpo">
          <img src="angular-mascot-idea.svg" alt="" width="240" height="300" />
        </div>
      </div>
    </div>
  `,
  styles: `
    .cine-eb__lejos line {
      stroke: #c9bfa9;
      stroke-width: 3;
      stroke-dasharray: 2 10;
      stroke-linecap: round;
    }
    .cine-eb__lejos circle {
      fill: #efe7d4;
      stroke: #c9bfa9;
      stroke-width: 3;
    }
    .cine-eb__enlace {
      stroke: var(--acento);
      stroke-width: 5;
      stroke-linecap: round;
      --trazo-delay: 200ms;
    }
    .cine.b-naves .cine-eb__enlace {
      stroke-dashoffset: 0;
    }
    /* El héroe llega cuando la tarjeta del capítulo se va: se turnan el centro, no lo comparten. */
    .cine-eb__heroe > .k-cuerpo {
      opacity: 0;
      transform: scale(0.45) rotate(-24deg);
      transition:
        opacity 320ms ease-out,
        transform var(--resorte-rebote-ms, 620ms) var(--resorte-rebote, ease-out);
    }
    .cine.b-titulo-rincon .cine-eb__heroe > .k-cuerpo {
      opacity: 1;
      transform: none;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EscenaBaseComponent {
  readonly capitulo = input(0);
  protected readonly acento = computed(() => acentoDe(this.capitulo()));
}
