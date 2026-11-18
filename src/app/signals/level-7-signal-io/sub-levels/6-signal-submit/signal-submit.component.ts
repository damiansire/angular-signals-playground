import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  resource,
  signal,
} from '@angular/core';
import { debounce, form, FormField, required, submit, validateAsync } from '@angular/forms/signals';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { SIGNAL_SUBMIT_SYSTEM } from '../../io-systems';

interface Transmision {
  canal: string;
  mensaje: string;
}

type Etapa = 'quieta' | 'debounce' | 'pending' | 'submitting';

const VACIA: Transmision = { canal: '', mensaje: '' };
const ESPERA_DE_TECLAS_MS = 350;
const VERIFICAR_CANAL_MS = 800;
const CRUZAR_EL_ESPACIO_MS = 1100;
const CANAL_OCUPADO = 'ruido';
const CANAL_QUE_REBOTA = 'eco';

/** Always resolves: an aborted wait only has to stop its timer, nobody reads its result. */
function esperar(ms: number, corte: AbortSignal): Promise<void> {
  return new Promise((listo) => {
    const fin = () => {
      clearTimeout(id);
      corte.removeEventListener('abort', fin);
      listo();
    };
    const id = setTimeout(fin, ms);
    corte.addEventListener('abort', fin, { once: true });
  });
}

@Component({
  selector: 'app-signal-submit',
  templateUrl: './signal-submit.component.html',
  styleUrl: './signal-submit.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent, ColumnAndCodeLayoutComponent, FormField],
})
export class SignalSubmitComponent {
  readonly closingSystem = SIGNAL_SUBMIT_SYSTEM;
  readonly cruceMs = CRUZAR_EL_ESPACIO_MS;
  readonly canales = ['alfa', CANAL_OCUPADO, CANAL_QUE_REBOTA] as const;

  private readonly corte = new AbortController();

  readonly modelo = signal<Transmision>({ ...VACIA });

  readonly transmision = form(this.modelo, (t) => {
    required(t.canal, { message: 'Falta el canal' });
    required(t.mensaje, { message: 'Falta el mensaje' });
    debounce(t.canal, ESPERA_DE_TECLAS_MS);
    validateAsync(t.canal, {
      params: ({ value }) => value(),
      factory: (canal) =>
        resource({
          params: canal,
          loader: async ({ params, abortSignal }) => {
            await esperar(VERIFICAR_CANAL_MS, abortSignal);
            return params === CANAL_OCUPADO;
          },
        }),
      onSuccess: (ocupado) => (ocupado ? { kind: 'ocupado', message: 'Canal ocupado' } : undefined),
      onError: () => ({ kind: 'sin-respuesta', message: 'No se pudo verificar' }),
    });
  });

  readonly enviados = signal<readonly string[]>([]);
  readonly retenidos = signal(0);
  readonly retenciones = computed(() => (this.retenidos() > 0 ? [this.retenidos()] : []));
  readonly vaARebotar = computed(() => this.modelo().canal === CANAL_QUE_REBOTA);

  readonly etapa = computed<Etapa>(() => {
    const canal = this.transmision.canal();
    if (this.transmision().submitting()) return 'submitting';
    if (canal.controlValue() !== canal.value()) return 'debounce';
    return canal.pending() ? 'pending' : 'quieta';
  });

  readonly rebote = computed(() =>
    this.transmision
      .canal()
      .errors()
      .some((error) => error.kind === 'rebote'),
  );

  readonly lines = computed<CodeLine[]>(() => {
    const etapa = this.etapa();
    return [
      { line: 'f = form(this.modelo, (t) => {', active: false },
      { line: '  debounce(t.canal, 350);', active: etapa === 'debounce' },
      { line: '  validateAsync(t.canal, { ... });', active: etapa === 'pending' },
      { line: '});', active: false },
      { line: '', active: false },
      { line: 'submit(this.f, {', active: etapa === 'submitting' },
      { line: '  ignoreValidators: "none",', active: etapa === 'pending' },
      { line: '  action: () => transmitir(this.modelo()),', active: etapa === 'submitting' },
      { line: '});', active: etapa === 'submitting' },
    ];
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.corte.abort());
  }

  elegirCanal(canal: string) {
    this.transmision.canal().value.set(canal);
    this.transmision.canal().markAsTouched();
  }

  enviar(evento: Event) {
    evento.preventDefault();
    void this.transmitir();
  }

  transmitir(): Promise<boolean> {
    return submit(this.transmision, {
      // The default, 'pending', would send while the channel is still being checked.
      ignoreValidators: 'none',
      action: async (f) => {
        const { canal, mensaje } = this.modelo();
        await esperar(CRUZAR_EL_ESPACIO_MS, this.corte.signal);
        if (canal === CANAL_QUE_REBOTA) {
          return { kind: 'rebote', fieldTree: f.canal, message: 'La señal rebotó' };
        }
        this.enviados.update((lista) => [...lista, mensaje]);
        f().reset({ ...VACIA });
        return undefined;
      },
      onInvalid: (f) => {
        this.retenidos.update((n) => n + 1);
        f().errorSummary()[0]?.fieldTree().focusBoundControl();
      },
    });
  }
}
