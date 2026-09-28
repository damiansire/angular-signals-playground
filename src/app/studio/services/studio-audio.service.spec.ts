import { TestBed } from '@angular/core/testing';
import { sonido } from '../../libs/sonido';
import { StudioAudioService } from './studio-audio.service';
import { StudioStateService } from './studio-state.service';

/** Un nodo de audio que acepta todo lo que el Estudio le hace y anota lo que importa. */
function nodoFalso(contexto: unknown) {
  const parametro = () => ({
    value: 0,
    setValueAtTime: () => undefined,
    linearRampToValueAtTime: () => undefined,
    exponentialRampToValueAtTime: () => undefined,
  });
  return {
    context: contexto,
    type: '',
    gain: parametro(),
    frequency: parametro(),
    conectadoA: [] as unknown[],
    connect(destino: unknown) {
      this.conectadoA.push(destino);
      return destino;
    },
    disconnect: jasmine.createSpy('disconnect'),
    start: jasmine.createSpy('start'),
    stop: jasmine.createSpy('stop'),
  };
}

/** Lo justo de un AudioContext compartido para ver qué arma el Estudio encima y qué suelta. */
class ContextoFalso {
  currentTime = 0;
  sampleRate = 44100;
  osciladores: ReturnType<typeof nodoFalso>[] = [];
  close = jasmine.createSpy('close');
  createGain() {
    return nodoFalso(this);
  }
  createOscillator() {
    const n = nodoFalso(this);
    this.osciladores.push(n);
    return n;
  }
  createBiquadFilter() {
    return nodoFalso(this);
  }
}

/**
 * El Estudio previsualiza el prólogo, así que tiene que sonar por el mismo camino que el juego: el
 * director de sonido. Antes hablaba con la voz del sistema y abría su propio contexto de audio, y
 * lo que se oía dependía de las voces instaladas en la máquina de quien editaba.
 */
describe('StudioAudioService', () => {
  let audio: StudioAudioService;
  let state: StudioStateService;
  let salida: jasmine.Spy;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [StudioAudioService, StudioStateService] });
    audio = TestBed.inject(StudioAudioService);
    state = TestBed.inject(StudioStateService);
    // Sin gesto real no hay contexto que abrir, y sin contexto no hay salida: así ningún test
    // depende del hardware de audio. El que necesita una salida le pasa una falsa.
    spyOn(sonido(), 'desbloquear');
    salida = spyOn(sonido(), 'salida').and.returnValue(null);
  });

  afterEach(() => audio.destruir());

  /** Un instante adentro de la primera línea, con todo lo anterior ya pasado. */
  function enLaPrimeraLinea(): number {
    const primera = state.reloj()[0];
    audio.resetDichas(primera.t0 - 1);
    return primera.t0 + 10;
  }

  it('cada línea habla con la voz de su personaje, en la ventana que dura en pantalla', () => {
    const habla = spyOn(sonido(), 'hablar');
    const primera = state.reloj()[0];

    audio.actualizarCuadro(enLaPrimeraLinea(), state.anclajes(), state.reloj());

    expect(habla).toHaveBeenCalledOnceWith(primera.quien, primera.txt, primera.t1 - primera.t0);
  });

  it('a más velocidad la voz se aprieta en la ventana que de verdad queda', () => {
    const habla = spyOn(sonido(), 'hablar');
    state.setVelocidad(2);
    const primera = state.reloj()[0];

    audio.actualizarCuadro(enLaPrimeraLinea(), state.anclajes(), state.reloj());

    expect(habla.calls.first().args[2]).toBe((primera.t1 - primera.t0) / 2);
  });

  it('con la voz apagada en el Estudio no habla nadie', () => {
    const habla = spyOn(sonido(), 'hablar');
    state.setConVoz(false);

    audio.actualizarCuadro(enLaPrimeraLinea(), state.anclajes(), state.reloj());

    expect(habla).not.toHaveBeenCalled();
  });

  it('pausar calla lo que estaba agendado', () => {
    const calla = spyOn(sonido(), 'callar');
    audio.pausar();
    expect(calla).toHaveBeenCalled();
  });

  it('sin audio disponible el cuadro corre igual y no tira', () => {
    const T = state.anclajes();

    expect(() => {
      audio.asegurarAudio();
      audio.actualizarCuadro(T.choque + 10, T, state.reloj());
    }).not.toThrow();
  });

  it('arma el zumbido sobre la salida común y al destruir lo suelta sin cerrar el contexto', () => {
    const ctx = new ContextoFalso();
    salida.and.returnValue({
      ctx: ctx as unknown as AudioContext,
      salida: nodoFalso(ctx) as unknown as AudioNode,
    });

    audio.asegurarAudio();
    const [zumbido] = ctx.osciladores;
    expect(zumbido).withContext('armó el zumbido').toBeDefined();
    expect(zumbido.start).toHaveBeenCalled();

    audio.destruir();
    expect(zumbido.stop).toHaveBeenCalled();
    expect(ctx.close).not.toHaveBeenCalled();
  });
});
