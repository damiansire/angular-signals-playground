import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CodeComponent } from '../../../../components-atom/code/code.component';
import { TreeComponent } from '../../../../components/tree/tree.component';
import { CountIncrementComponent } from './count-increment/count-increment.component';
import { CodeClick } from '../../../../components-atom/code/code.interface';
import { TwoColumnLayoutComponent } from '../../../../layouts/two-column-layout/two-column-layout.component';
import { SlidersControlButtonsComponent } from '../../../../components-draw/sliders-control-buttons/sliders-control-buttons.component';
import { ConceptCardComponent } from '../../../../components-atom/concept-card/concept-card.component';

@Component({
  selector: 'app-variable-refresh-and-tree',
  imports: [
    CodeComponent,
    TreeComponent,
    CountIncrementComponent,
    TwoColumnLayoutComponent,
    SlidersControlButtonsComponent,
    ConceptCardComponent,
  ],
  templateUrl: './variable-refresh-and-tree.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './variable-refresh-and-tree.component.css',
})
export class VariableRefreshAndTreeComponent {
  htmlCode = `<section>
  <section>
    <p>
      <span> El valor es: </span>
      <span id="count"> 0 </span>
    </p>
    <button> Increment </button>
  </section>
  <section>
    <p> Multiplo de 2: <span>Si</span></p>
    <p> Multiplo de 3: <span>Si</span></p>
  </section>
</section>`;
  htmlAngularCode = `<section>
  <section>
    <p>
      <span> El valor es: </span>
      <span> {{ count }} </span>
    </p>
    <button (click)="increment()"> Increment </button>
  </section>
  <section>
    <p> Multiplo de 2: {{ count % 2 ? "No" : "Si" }} </p>
    <p> Multiplo de 3: {{ count % 3 ? "No" : "Si" }} </p>
  </section>
</section>`;
  nodesToShow = signal<string[]>([]);
  sliderNumber = 0;
  codeClickHandler(event: CodeClick) {
    if (event.action == 'Select') {
      this.addNode(event.id);
    } else if (event.action == 'Deselect') {
      this.removeNode(event.id);
    }
  }
  addNode(id: string) {
    this.nodesToShow.update((currentNodes) => [...currentNodes, id]);
  }
  removeNode(id: string) {
    this.nodesToShow.update((currentNodes) => currentNodes.filter((node) => node !== id));
  }
  onSliderChanged(newValue: number) {
    this.sliderNumber = newValue;
  }
}
