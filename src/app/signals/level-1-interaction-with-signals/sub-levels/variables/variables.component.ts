import { Component, computed, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CircuitoComponent } from '../../../../components-draw/circuito/circuito.component';
import { NodoCircuito } from '../../../../components-draw/circuito/circuito.modelo';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { TitleComponent } from '../../../../components-atom/title/title.component';
import { CodeComponent } from '../../../../components-atom/code/code.component';
import { ConceptCardComponent } from '../../../../components-atom/concept-card/concept-card.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { PLAIN_VARIABLE_SYSTEM } from '../../signals-systems';

interface DataTypeExample {
  name: string;
  examples: string[];
}

@Component({
  selector: 'app-variables',
  imports: [
    ManipulableSystemComponent,
    CircuitoComponent,
    TitleComponent,
    CodeComponent,
    ConceptCardComponent,
  ],
  templateUrl: './variables.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './variables.component.css',
})
export class VariablesComponent implements OnInit {
  readonly closingSystem = PLAIN_VARIABLE_SYSTEM;
  dataTypes = ['Number'];
  typesExamples: Record<string, DataTypeExample> = {
    Number: {
      name: 'Number',
      examples: ['1', '6', '56', '5.4', '10.1'],
    },
    String: {
      name: 'String',
      examples: ['"A"', '"B"', '"C"', '"Hello"', '"Count$"'],
    },
    Boolean: {
      name: 'Boolean',
      examples: ['true', 'false'],
    },
    Object: {
      name: 'Object',
      examples: ['{}', '{name: "Damian"}', '{surname: "Sire", age: 26}'],
    },
    Array: {
      name: 'Array',
      examples: ['[]', '[1,2,3,4,5]', '[true, false]', '[ 1 , 2 , true  ]'],
    },
  };
  readonly selectedType = signal(this.typesExamples['Number']);
  readonly selectedExampleValue = signal(this.selectedType().examples[0]);
  readonly lines = computed<CodeLine[]>(() => [
    { line: `var value = ${this.selectedExampleValue()}`, active: false },
    {
      line: `const value = ${this.selectedExampleValue()}`,
      active: false,
    },
    { line: `let value = ${this.selectedExampleValue()}`, active: false },
  ]);

  /** Tres cajas y ningún enlace: una variable guarda el valor y no le avisa a nadie. */
  readonly cajas = computed<NodoCircuito[]>(() =>
    ['var', 'const', 'let'].map((nombre, i) => ({
      id: nombre,
      nombre,
      valor: this.selectedExampleValue(),
      tono: 'caja',
      col: i + 1,
      fila: 1,
    })),
  );

  ngOnInit() {
    this.dataTypes = Object.keys(this.typesExamples);
  }

  selectExample(value: { name: string; value: string }) {
    this.selectedExampleValue.set(value.name);
  }

  selectType(value: { name: string; value: string }) {
    const variableName: string = value.name;
    const newSelectedType = this.typesExamples[variableName];
    this.selectedType.set(newSelectedType);
    // El código de abajo tiene que hablar del tipo recién elegido. Sin esto seguía mostrando el valor
    // del tipo anterior hasta que además tocaras un ejemplo, y parecía que elegir tipo no hacía nada.
    this.selectedExampleValue.set(newSelectedType.examples[0]);
  }
}
