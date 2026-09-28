import { ManipulableChallenge, SystemState } from '../../libs/manipulable-challenge';

/**
 * Sistemas del nivel 7: los bordes del componente. Los tres primeros atacan el mismo malentendido
 * desde lugares distintos, que un input ahora es un signal y no un campo que alguien te rellena
 * antes de arrancar. El cuarto lo lleva al borde por donde escribe el usuario: la validez de un
 * formulario tampoco es un dato que se calcula una vez, se deriva del modelo.
 */

const K = 'perilla';
const knob = (label: string, positions = 2) => [{ id: K, positions, label }];

/** 7/1 · un input es un signal: leerlo en el constructor congela el valor inicial. */
export const INPUT_OUTPUT_SYSTEM: ManipulableChallenge = {
  knobs: knob('leer el input una vez o derivarlo'),
  gauges: [{ id: 'desfasado', label: 'desfasado' }],
  action: 'cambiar desde el padre',
  start: { desfasado: 0 },
  code: (k) => [
    { text: 'readonly precio = input(0);' },
    { text: '' },
    k[K] === 1
      ? { text: 'readonly conIva = computed(() => this.precio() * 1.21);', knob: K }
      : { text: 'readonly conIva = this.precio() * 1.21;', knob: K },
  ],
  // Leído en la construcción, el input entrega su valor inicial y ahí queda.
  settle: (s: SystemState) => ({ desfasado: s.actions > 0 && s.knobs[K] !== 1 ? 1 : 0 }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['desfasado'] === 0,
};

/** 7/2 · model hace el two-way sin dos piezas que mantener en sincronía. */
export const MODEL_SYSTEM: ManipulableChallenge = {
  knobs: knob('atar el par input y output a mano o usar model'),
  gauges: [{ id: 'perdidos', label: 'cambios perdidos' }],
  action: 'editar en el hijo',
  start: { perdidos: 0 },
  code: (k) =>
    k[K] === 1
      ? [
          { text: 'readonly valor = model(0);', knob: K },
          { text: '' },
          { text: 'this.valor.set(nuevo);' },
        ]
      : [
          { text: 'readonly valor = input(0);', knob: K },
          { text: 'readonly valorChange = output<number>();' },
          { text: '' },
          { text: 'this.valorChange.emit(nuevo);' },
        ],
  // Emitiendo sin escribir el propio estado, el hijo muestra el valor viejo hasta que vuelve.
  settle: (s: SystemState) => ({ perdidos: s.knobs[K] === 1 ? 0 : s.actions }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['perdidos'] === 0,
};

/** 7/3 · input.required avisa en build; el opcional te deja el undefined adentro. */
export const INPUT_REQUIRED_SYSTEM: ManipulableChallenge = {
  knobs: knob('declarar el input opcional o requerido'),
  gauges: [{ id: 'undefined', label: 'undefined leídos' }],
  action: 'usar sin pasarlo',
  start: { undefined: 0 },
  code: (k) => [
    k[K] === 1
      ? { text: 'readonly userId = input.required<string>();', knob: K }
      : { text: 'readonly userId = input<string>();', knob: K },
    { text: '' },
    { text: 'cargar(this.userId());' },
  ],
  // El opcional compila y explota adentro; el requerido no deja pasar el template.
  settle: (s: SystemState) => ({ undefined: s.knobs[K] === 1 ? 0 : s.actions }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['undefined'] === 0,
};

/**
 * 7/4 · validar a mano en el handler congela la validez entre envío y envío; el form la deriva.
 * La trampa es plausible porque `valido` ES un signal: parece reactivo, pero solo lo escribe
 * `enviar()`, así que cada edición posterior queda sin validar hasta el próximo envío.
 */
export const SIGNAL_FORMS_SYSTEM: ManipulableChallenge = {
  knobs: knob('validar a mano al enviar o derivar la validez del form'),
  gauges: [{ id: 'sinValidar', label: 'sin validar' }],
  action: 'editar el correo',
  start: { sinValidar: 0 },
  code: (k) =>
    k[K] === 1
      ? [
          { text: 'readonly f = form(this.modelo, (t) => email(t.correo));' },
          { text: 'readonly valido = computed(() => this.f().valid());', knob: K },
          { text: '' },
          { text: 'enviar() {' },
          { text: '  if (this.valido()) guardar(this.modelo());' },
          { text: '}' },
        ]
      : [
          { text: 'readonly f = form(this.modelo);' },
          { text: 'readonly valido = signal(false);', knob: K },
          { text: '' },
          { text: 'enviar() {' },
          { text: '  this.valido.set(esCorreo(this.modelo().correo));' },
          { text: '}' },
        ],
  // Nadie vuelve a validar hasta el próximo envío: cada edición queda con la validez anterior.
  settle: (s: SystemState) => ({ sinValidar: s.knobs[K] === 1 ? 0 : s.actions }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['sinValidar'] === 0,
};
