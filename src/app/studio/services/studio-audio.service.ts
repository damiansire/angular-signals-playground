import { Injectable, inject } from '@angular/core';
import { StudioStateService } from './studio-state.service';
import { Anclajes, LineaEnReloj } from '../../integrada-vista/prologo-guion';

/**
 * Motor de audio y síntesis sonora para el Estudio de Cinemáticas.
 * Provee:
 * 1. Síntesis de voz (SpeechSynthesis) con detección de voces en español y modulación de tono por personaje.
 * 2. Sintetizador Web Audio en tiempo real (zumbido de la anomalía, ráfagas de ruido para saltos y choques, acordes armónicos).
 */
@Injectable({
  providedIn: 'root',
})
export class StudioAudioService {
  private readonly state = inject(StudioStateService);

  private ac: AudioContext | null = null;
  private master: GainNode | null = null;
  private zumbido: OscillatorNode | null = null;
  private zumbidoGain: GainNode | null = null;
  private filtro: BiquadFilterNode | null = null;

  private dichas = new Set<string>();
  private timers = new Set<number>();
  private vocesEs: SpeechSynthesisVoice[] = [];

  constructor() {
    this.cargarVoces();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => this.cargarVoces();
    }
  }

  /** Inicializa el AudioContext en el primer gesto de reproducción del usuario. */
  asegurarAudio(): void {
    if (this.ac) {
      if (this.ac.state === 'suspended') {
        void this.ac.resume();
      }
      return;
    }
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;

    this.ac = new Ctor();
    this.master = this.ac.createGain();
    this.master.gain.value = 0.45;
    this.master.connect(this.ac.destination);

    // Zumbido grave de la anomalía
    this.zumbido = this.ac.createOscillator();
    this.zumbido.type = 'sawtooth';
    this.zumbido.frequency.value = 46;

    this.filtro = this.ac.createBiquadFilter();
    this.filtro.type = 'lowpass';
    this.filtro.frequency.value = 120;

    this.zumbidoGain = this.ac.createGain();
    this.zumbidoGain.gain.value = 0;

    this.zumbido.connect(this.filtro).connect(this.zumbidoGain).connect(this.master);
    this.zumbido.start();
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

    if (window.speechSynthesis && speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    this.limpiarTimers();
  }

  /** Actualiza el audio continuo (zumbido) y dispara efectos de sonido y voz para el tiempo `t`. */
  actualizarCuadro(t: number, anclajes: Anclajes, reloj: readonly LineaEnReloj[]): void {
    this.actualizarZumbido(t, anclajes);
    this.verificarEfectosSonoros(t, anclajes);
    this.verificarVoces(t, reloj);
  }

  private actualizarZumbido(t: number, T: Anclajes): void {
    if (!this.ac || !this.state.conSonido() || !this.zumbidoGain || !this.filtro) return;

    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
    const fondo = clamp01((t - T.orden) / 3400);
    const cerca = clamp01((t - T.temblor) / (T.zoom - T.temblor));
    const dentro = t > T.zoom && t < T.orden ? 0.5 : 0;

    const ganancia = t < T.zoom ? cerca * 0.16 : dentro * 0.1 * (1 - fondo);
    this.zumbidoGain.gain.setValueAtTime(ganancia, this.ac.currentTime);
    this.filtro.frequency.setValueAtTime(110 + cerca * 700, this.ac.currentTime);
  }

  private verificarEfectosSonoros(t: number, T: Anclajes): void {
    if (!this.ac || !this.state.conSonido()) return;

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
    if (!this.ac || !this.master || !this.state.conSonido()) return;
    const o = this.ac.createOscillator();
    const gg = this.ac.createGain();
    o.type = tipo;
    o.frequency.value = freq;
    const n = this.ac.currentTime;
    gg.gain.setValueAtTime(0, n);
    gg.gain.linearRampToValueAtTime(vol, n + 0.012);
    gg.gain.exponentialRampToValueAtTime(0.0001, n + dur);
    o.connect(gg).connect(this.master);
    o.start(n);
    o.stop(n + dur + 0.05);
  }

  private ruido(dur: number, desde: number, hasta: number, vol: number): void {
    if (!this.ac || !this.master || !this.state.conSonido()) return;
    const largo = Math.floor(this.ac.sampleRate * dur);
    const buf = this.ac.createBuffer(1, largo, this.ac.sampleRate);
    const dat = buf.getChannelData(0);
    for (let i = 0; i < largo; i++) dat[i] = (Math.random() * 2 - 1) * (1 - i / largo);

    const src = this.ac.createBufferSource();
    src.buffer = buf;
    const bp = this.ac.createBiquadFilter();
    bp.type = 'bandpass';
    const n = this.ac.currentTime;
    bp.frequency.setValueAtTime(desde, n);
    bp.frequency.exponentialRampToValueAtTime(hasta, n + dur);
    const gg = this.ac.createGain();
    gg.gain.value = vol;
    src.connect(bp).connect(gg).connect(this.master);
    src.start(n);
  }

  private verificarVoces(t: number, reloj: readonly LineaEnReloj[]): void {
    if (!this.state.conVoz() || !window.speechSynthesis) return;

    for (const d of reloj) {
      if (t >= d.t0 && t < d.t1 && !this.dichas.has(d.id)) {
        this.dichas.add(d.id);
        this.hablar(d);
      }
    }
  }

  hablar(d: LineaEnReloj): void {
    if (!window.speechSynthesis) return;
    const textoLimpio = d.txt.replace(/\n/g, ' ');
    const u = new SpeechSynthesisUtterance(textoLimpio);

    if (this.vocesEs.length > 0) {
      u.voice = this.vocesEs[0];
    }
    u.lang = 'es-ES';
    u.rate = this.state.velocidad();

    if (d.quien === 'cap') {
      u.pitch = 0.85;
    } else if (d.quien === 'naveA') {
      u.pitch = 1.05;
    } else if (d.quien === 'naveB') {
      u.pitch = 0.95;
    } else if (d.quien === 'nave4') {
      u.pitch = 1.25;
    } else if (d.quien === 'mascota') {
      u.pitch = 1.15;
    }

    speechSynthesis.speak(u);
  }

  private cargarVoces(): void {
    if (!window.speechSynthesis) return;
    const todas = speechSynthesis.getVoices();
    this.vocesEs = todas.filter((v) => /^es/i.test(v.lang));
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

  pausar(): void {
    if (window.speechSynthesis && speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    if (this.zumbidoGain && this.ac) {
      this.zumbidoGain.gain.setValueAtTime(0, this.ac.currentTime);
    }
    this.limpiarTimers();
  }

  destruir(): void {
    this.pausar();
    if (this.ac) {
      try {
        void this.ac.close();
      } catch {
        // Ignorar si ya estaba cerrado
      }
      this.ac = null;
    }
  }
}
