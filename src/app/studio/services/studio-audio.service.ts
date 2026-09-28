import { Injectable, inject } from '@angular/core';
import { StudioStateService } from './studio-state.service';
import { Anclajes, LineaEnReloj } from '../../integrada-vista/prologo-guion';
import { sonido } from '../../libs/sonido';

/** Lo que el Estudio sintetiza por su cuenta, colgado de la salida común del director. */
interface RedDeAudio {
  readonly master: GainNode;
  readonly zumbido: OscillatorNode;
  readonly zumbidoGain: GainNode;
  readonly filtro: BiquadFilterNode;
}

/**
 * Motor de audio del Estudio de Cinemáticas. Suena por el mismo camino que el prólogo real, el
 * director de sonido de la app (`libs/sonido.ts`), porque el Estudio tiene que dejar oír lo que va a
 * oír el jugador y no lo que tenga instalado la máquina de quien edita:
 * 1. Las voces son los blips por personaje del director, no la voz del sistema, que dependía de
 *    que hubiera voces en español instaladas.
 * 2. El zumbido de la anomalía, las ráfagas de ruido del salto y del choque y el acorde final se
 *    sintetizan sobre la salida común, sin un `AudioContext` propio.
 */
@Injectable({
  providedIn: 'root',
})
export class StudioAudioService {
  private readonly state = inject(StudioStateService);

  private red: RedDeAudio | null = null;

  private dichas = new Set<string>();
  private timers = new Set<number>();

  /** Lo llama el gesto de reproducir: destraba el audio compartido y arma la red del Estudio. */
  asegurarAudio(): void {
    sonido().desbloquear();
    this.redLista();
  }

  /**
   * La red del Estudio sobre la salida común, armada la primera vez que hay dónde sonar. `null` sin
   * Web Audio, antes del primer gesto o con el sonido de la app apagado: el Estudio sigue andando.
   */
  private redLista(): RedDeAudio | null {
    const salida = sonido().salida();
    if (!salida) return null;
    if (this.red) return this.red;
    const ac = salida.ctx;
    const master = ac.createGain();
    master.gain.value = 0.45;
    master.connect(salida.salida);

    // Zumbido grave de la anomalía
    const zumbido = ac.createOscillator();
    zumbido.type = 'sawtooth';
    zumbido.frequency.value = 46;

    const filtro = ac.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 120;

    const zumbidoGain = ac.createGain();
    zumbidoGain.gain.value = 0;

    zumbido.connect(filtro).connect(zumbidoGain).connect(master);
    zumbido.start();
    this.red = { master, zumbido, zumbidoGain, filtro };
    return this.red;
  }

  /** Resetea los hitos disparados al pausar o hacer seek */
  resetDichas(nuevoT: number): void {
    this.dichas.clear();
    // Marcar como ya dichas las que ocurrieron antes de nuevoT
    const T = this.state.anclajes();
    if (nuevoT >= T.zoom) this.dichas.add('salto');
    if (nuevoT >= T.choque) this.dichas.add('choque');
    if (nuevoT >= T.orden + 2600) this.dichas.add('final');

    for (const d of this.state.reloj()) {
      if (nuevoT >= d.t1) {
        this.dichas.add(d.id);
      }
    }

    sonido().callar();
    this.limpiarTimers();
  }

  /** Actualiza el audio continuo (zumbido) y dispara efectos de sonido y voz para el tiempo `t`. */
  actualizarCuadro(t: number, anclajes: Anclajes, reloj: readonly LineaEnReloj[]): void {
    this.actualizarZumbido(t, anclajes);
    this.verificarEfectosSonoros(t, anclajes);
    this.verificarVoces(t, reloj);
  }

  private actualizarZumbido(t: number, T: Anclajes): void {
    const red = this.redLista();
    if (!red || !this.state.conSonido()) return;

    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
    const fondo = clamp01((t - T.orden) / 3400);
    const cerca = clamp01((t - T.temblor) / (T.zoom - T.temblor));
    const dentro = t > T.zoom && t < T.orden ? 0.5 : 0;

    const ganancia = t < T.zoom ? cerca * 0.16 : dentro * 0.1 * (1 - fondo);
    const ahora = red.master.context.currentTime;
    red.zumbidoGain.gain.setValueAtTime(ganancia, ahora);
    red.filtro.frequency.setValueAtTime(110 + cerca * 700, ahora);
  }

  private verificarEfectosSonoros(t: number, T: Anclajes): void {
    if (!this.redLista() || !this.state.conSonido()) return;

    if (!this.dichas.has('salto') && t >= T.zoom) {
      this.dichas.add('salto');
      this.ruido(1.1, 220, 4200, 0.28);
      this.pip(70, 1.4, 'sine', 0.2);
    }

    if (!this.dichas.has('choque') && t >= T.choque) {
      this.dichas.add('choque');
      this.ruido(0.5, 1800, 160, 0.22);
      this.pip(58, 0.9, 'sine', 0.26);
    }

    if (!this.dichas.has('final') && t >= T.orden + 2600) {
      this.dichas.add('final');
      [220, 277, 330, 440].forEach((f, i) => {
        this.luego(() => this.pip(f, 2.2, 'sine', 0.07), i * 160);
      });
    }
  }

  private pip(freq: number, dur: number, tipo: OscillatorType = 'sine', vol = 0.12): void {
    const red = this.redLista();
    if (!red || !this.state.conSonido()) return;
    const ac = red.master.context;
    const o = ac.createOscillator();
    const gg = ac.createGain();
    o.type = tipo;
    o.frequency.value = freq;
    const n = ac.currentTime;
    gg.gain.setValueAtTime(0, n);
    gg.gain.linearRampToValueAtTime(vol, n + 0.012);
    gg.gain.exponentialRampToValueAtTime(0.0001, n + dur);
    o.connect(gg).connect(red.master);
    o.start(n);
    o.stop(n + dur + 0.05);
  }

  private ruido(dur: number, desde: number, hasta: number, vol: number): void {
    const red = this.redLista();
    if (!red || !this.state.conSonido()) return;
    const ac = red.master.context;
    const largo = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, largo, ac.sampleRate);
    const dat = buf.getChannelData(0);
    for (let i = 0; i < largo; i++) dat[i] = (Math.random() * 2 - 1) * (1 - i / largo);

    const src = ac.createBufferSource();
    src.buffer = buf;
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    const n = ac.currentTime;
    bp.frequency.setValueAtTime(desde, n);
    bp.frequency.exponentialRampToValueAtTime(hasta, n + dur);
    const gg = ac.createGain();
    gg.gain.value = vol;
    src.connect(bp).connect(gg).connect(red.master);
    src.start(n);
  }

  private verificarVoces(t: number, reloj: readonly LineaEnReloj[]): void {
    if (!this.state.conVoz()) return;

    for (const d of reloj) {
      if (t >= d.t0 && t < d.t1 && !this.dichas.has(d.id)) {
        this.dichas.add(d.id);
        this.hablar(d);
      }
    }
  }

  /**
   * La línea con la voz de su personaje, repartida en su ventana en pantalla. Se divide por la
   * velocidad igual que en el prólogo: a ×2 la línea dura la mitad y la voz tiene que caber igual.
   */
  hablar(d: LineaEnReloj): void {
    sonido().hablar(d.quien, d.txt, (d.t1 - d.t0) / this.state.velocidad());
  }

  private luego(fn: () => void, ms: number): void {
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      fn();
    }, ms);
    this.timers.add(id);
  }

  private limpiarTimers(): void {
    for (const id of this.timers) {
      clearTimeout(id);
    }
    this.timers.clear();
  }

  /**
   * El contexto es de toda la app y no se suspende: se callan las voces agendadas y el zumbido, que
   * es continuo y seguiría sonando sobre el cuadro quieto.
   */
  pausar(): void {
    sonido().callar();
    if (this.red) {
      this.red.zumbidoGain.gain.setValueAtTime(0, this.red.master.context.currentTime);
    }
    this.limpiarTimers();
  }

  /**
   * Suelta la red del Estudio. El contexto es compartido y NO se cierra: se corta el zumbido y se
   * desconecta todo de la salida común, así volver al Estudio arma una red nueva.
   */
  destruir(): void {
    this.pausar();
    if (!this.red) return;
    this.red.zumbido.stop();
    this.red.zumbido.disconnect();
    this.red.master.disconnect();
    this.red = null;
  }
}
