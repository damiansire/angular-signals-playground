import { DestroyRef, signal } from '@angular/core';
import { HistoryElement } from '../../components/component.interface';

/** Tope del historial: el reloj late cada segundo y sin límite la lista estiraría la card sin fin.
 *  Que el leak "sigue creciendo" no lo prueba la lista sino `latidos`, que sí sube para siempre. */
const MAX_HISTORIAL = 5;

type IdDeIntervalo = ReturnType<typeof setInterval>;

/**
 * Los relojes que arranca el hijo en 3/2 y 3/3. Lo crea el PADRE y se lo pasa al hijo, así que vive
 * lo que dura la lección y no lo que dura el hijo.
 *
 * Existe por el leak que 3/2 enseña a propósito: el intervalo del hijo sobrevive al hijo. Antes cada
 * latido salía por un output() del hijo, y con el hijo ya destruido ese emit caía en un OutputRef
 * muerto: NG0953 en consola cada segundo, uno más por visita. Latir sobre algo del padre deja que el
 * leak se siga VIENDO sin tocar nada muerto, y le da al padre los ids para apagarlo cuando se va.
 */
export class RelojesDelHijo {
  /** Latidos de todos los relojes del hijo, esté vivo o no. Que suba tras destruirlo ES el leak. */
  readonly latidos = signal(0);
  readonly historial = signal<HistoryElement[]>([]);
  private readonly ids = new Set<IdDeIntervalo>();

  /**
   * Se ata al ciclo de vida de quien lo crea (el padre), no del hijo. El leak es la lección mientras
   * la pantalla está; cuando el usuario se va, lo filtrado se apaga con ella. Si no, cada pasada del
   * recorrido (que monta y desmonta sub-niveles por proximidad) dejaba un reloj más latiendo.
   */
  constructor(padre: Pick<DestroyRef, 'onDestroy'>) {
    padre.onDestroy(() => this.apagarTodos());
  }

  /** El hijo anota cada intervalo que arranca: es lo único que el padre necesita para apagarlo. */
  registrar(id: IdDeIntervalo): void {
    this.ids.add(id);
  }

  latir(hora: Date): void {
    this.latidos.update((n) => n + 1);
    const latido: HistoryElement = {
      date: hora,
      trigger: hhmmss(hora),
      newState: this.latidos(),
      isCountIncrement: false,
    };
    this.historial.update((previos) => [...previos, latido].slice(-MAX_HISTORIAL));
  }

  // Limpiar un id que el hijo ya apagó no hace nada, así que no hace falta distinguir cuáles
  // quedaron filtrados: se apagan todos.
  private apagarTodos(): void {
    this.ids.forEach((id) => clearInterval(id));
    this.ids.clear();
  }
}

function hhmmss(date: Date): string {
  const dosCifras = (n: number) => String(n).padStart(2, '0');
  return `${dosCifras(date.getHours())}:${dosCifras(date.getMinutes())}:${dosCifras(date.getSeconds())}`;
}
