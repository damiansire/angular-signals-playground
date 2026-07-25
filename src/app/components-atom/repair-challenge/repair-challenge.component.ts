import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { evaluateRepair, RepairChallenge } from '../../libs/repair-challenge';

/**
 * Cierre de un sub-nivel: el sistema queda averiado y hay que elegir la pieza que lo repara.
 * Va DESPUÉS de la explicación, no antes: el ejemplo de arriba ya mostró cómo funciona, esto
 * pregunta si podés arreglarlo cuando no funciona.
 *
 * La consecuencia es la escena, no un cartel: al acertar cambia la lectura del sistema. Errar
 * devuelve la razón de ESA pieza y la descarta, así el reintento es informado y no tanteo.
 */
@Component({
  selector: 'app-repair-challenge',
  templateUrl: './repair-challenge.component.html',
  styleUrl: './repair-challenge.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepairChallengeComponent {
  readonly challenge = input.required<RepairChallenge>();

  readonly repaired = signal(false);
  /** Piezas ya descartadas, en orden de intento. */
  readonly ruledOut = signal<readonly number[]>([]);
  /** Razón de la última pieza elegida. Vacío hasta el primer intento. */
  readonly why = signal('');

  readonly readout = computed(() =>
    this.repaired() ? this.challenge().healthyReadout : this.challenge().brokenReadout,
  );

  isRuledOut(index: number): boolean {
    return this.ruledOut().includes(index);
  }

  choose(index: number): void {
    if (this.repaired() || this.isRuledOut(index)) return;

    const verdict = evaluateRepair(this.challenge(), index);
    this.why.set(verdict.why);
    if (verdict.repaired) {
      this.repaired.set(true);
      return;
    }
    this.ruledOut.update((prev) => [...prev, index]);
  }

  retry(): void {
    this.repaired.set(false);
    this.ruledOut.set([]);
    this.why.set('');
  }
}
