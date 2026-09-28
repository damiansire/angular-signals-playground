import { CLAVE_SONIDO, crearSonido, leerPreferencia, PERFILES, planDeBlips } from './sonido';

/** Un parámetro de audio que acepta las rampas sin hacer nada. */
function parametro(): AudioParam {
  const p = {
    value: 0,
    setValueAtTime: () => p,
    linearRampToValueAtTime: () => p,
    exponentialRampToValueAtTime: () => p,
  };
  return p as unknown as AudioParam;
}

/** Lo justo de un AudioContext para contar qué se agendó, sin tocar hardware. */
class ContextoFalso {
  state: AudioContextState = 'suspended';
  currentTime = 0;
  destination = { connect: () => undefined } as unknown as AudioDestinationNode;
  osciladores: { hz: number; paradas: number }[] = [];
  resumidas = 0;
  suspendidas = 0;

  private nodo() {
    return { connect: (destino: unknown) => destino, gain: parametro() };
  }
  createGain() {
    return this.nodo() as unknown as GainNode;
  }
  createDynamicsCompressor() {
    return this.nodo() as unknown as DynamicsCompressorNode;
  }
  createOscillator() {
    const registro = { hz: 0, paradas: 0 };
    this.osciladores.push(registro);
    const frecuencia = parametro();
    frecuencia.setValueAtTime = ((hz: number) => {
      registro.hz = hz;
      return frecuencia;
    }) as AudioParam['setValueAtTime'];
    return {
      type: 'sine',
      frequency: frecuencia,
      connect: (destino: unknown) => destino,
      start: () => undefined,
      stop: () => {
        registro.paradas++;
      },
      onended: null,
    } as unknown as OscillatorNode;
  }
  resume() {
    this.resumidas++;
    this.state = 'running';
    return Promise.resolve();
  }
  suspend() {
    this.suspendidas++;
    this.state = 'suspended';
    return Promise.resolve();
  }
  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

function almacenEnMemoria(inicial: Record<string, string> = {}) {
  const datos = new Map(Object.entries(inicial));
  return {
    datos,
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
  };
}

describe('sonido', () => {
  describe('planDeBlips', () => {
    it('es determinista: la misma frase suena siempre igual', () => {
      const a = planDeBlips('Esto contradice las leyes.', 3000, PERFILES.cap);
      const b = planDeBlips('Esto contradice las leyes.', 3000, PERFILES.cap);
      expect(a).toEqual(b);
      expect(a.length).toBeGreaterThan(4);
    });

    it('cabe en la ventana de la línea: nunca sigue hablando cuando el texto ya se fue', () => {
      const largo = 'Una frase bastante larga que no entra en tan poco tiempo de pantalla';
      const plan = planDeBlips(largo, 1200, PERFILES.mascota);
      const ultimo = plan[plan.length - 1];
      expect(ultimo.t + ultimo.ms).toBeLessThanOrEqual(1200 * 0.85 + PERFILES.mascota.blip);
    });

    it('una sílaba por grupo de vocales, no una por letra', () => {
      // "a-ho-ra" → tres grupos de vocales.
      expect(planDeBlips('ahora', 2000, PERFILES.naveA).length).toBe(3);
      // "ae" es un solo grupo.
      expect(planDeBlips('ae', 2000, PERFILES.naveA).length).toBe(1);
    });

    it('la pregunta sube al final', () => {
      const afirma = planDeBlips('Es por acá', 2000, PERFILES.naveB);
      const pregunta = planDeBlips('¿Es por acá?', 2000, PERFILES.naveB);
      expect(pregunta[pregunta.length - 1].hz).toBeGreaterThan(afirma[afirma.length - 1].hz);
    });

    it('la puntuación agrega una pausa entre sílabas', () => {
      const corrido = planDeBlips('ya va', 3000, PERFILES.cap);
      const pausado = planDeBlips('ya. va', 3000, PERFILES.cap);
      expect(pausado[1].t).toBeGreaterThan(corrido[1].t);
    });

    it('sin texto o sin ventana no hay nada que decir', () => {
      expect(planDeBlips('', 2000, PERFILES.cap)).toEqual([]);
      expect(planDeBlips('   ', 2000, PERFILES.cap)).toEqual([]);
      expect(planDeBlips('hola', 0, PERFILES.cap)).toEqual([]);
      expect(planDeBlips('¡!', 2000, PERFILES.cap)).toEqual([]);
    });

    it('cada personaje tiene su altura: la exploradora es la más aguda y la voz la más grave', () => {
      const bases = Object.values(PERFILES).map((p) => p.base);
      expect(PERFILES.nave4.base).toBe(Math.max(...bases));
      expect(PERFILES.voz.base).toBe(Math.min(...bases));
    });
  });

  describe('preferencia', () => {
    it('arranca encendido salvo que se haya guardado apagado', () => {
      expect(leerPreferencia(null)).toBeTrue();
      expect(leerPreferencia(almacenEnMemoria())).toBeTrue();
      expect(leerPreferencia(almacenEnMemoria({ [CLAVE_SONIDO]: '0' }))).toBeFalse();
    });

    it('un almacén que tira no apaga el sonido ni rompe', () => {
      const roto = {
        getItem: () => {
          throw new Error('SecurityError');
        },
      };
      expect(leerPreferencia(roto)).toBeTrue();
    });
  });

  describe('director', () => {
    it('sin Web Audio todo es silencio y nada tira', () => {
      const s = crearSonido({ crearContexto: () => null, almacen: null, documento: null });
      expect(() => {
        s.desbloquear();
        s.efecto('titulo');
        s.hablar('cap', 'Hola', 1000);
        s.callar();
        s.alternar();
      }).not.toThrow();
      expect(s.disponible()).toBeFalse();
      expect(s.salida()).toBeNull();
    });

    it('si crear el contexto tira, queda en silencio para siempre en vez de reintentar', () => {
      let intentos = 0;
      const s = crearSonido({
        crearContexto: () => {
          intentos++;
          throw new Error('NotAllowedError');
        },
        documento: null,
      });
      s.desbloquear();
      s.desbloquear();
      expect(s.disponible()).toBeFalse();
      expect(intentos).toBe(1);
    });

    it('antes del primer gesto no agenda nada: lo pedido se descarta, no se acumula', () => {
      const ctx = new ContextoFalso();
      const s = crearSonido({
        crearContexto: () => ctx as unknown as AudioContext,
        documento: null,
      });
      s.hablar('naveA', 'Estamos vivos', 2000);
      s.efecto('titulo');
      expect(ctx.osciladores.length).toBe(0);
    });

    it('después del gesto habla con un blip por sílaba', () => {
      const ctx = new ContextoFalso();
      const s = crearSonido({
        crearContexto: () => ctx as unknown as AudioContext,
        documento: null,
      });
      s.desbloquear();
      expect(ctx.resumidas).toBe(1);
      s.hablar('naveA', 'ahora', 2000);
      expect(ctx.osciladores.length).toBe(3);
    });

    it('apagarlo guarda la preferencia, corta lo agendado y ya no suena', () => {
      const ctx = new ContextoFalso();
      const almacen = almacenEnMemoria();
      const s = crearSonido({
        crearContexto: () => ctx as unknown as AudioContext,
        almacen,
        documento: null,
      });
      s.desbloquear();
      s.hablar('cap', 'Esto contradice las leyes', 3000);
      const agendados = ctx.osciladores.length;
      expect(agendados).toBeGreaterThan(0);

      const avisos: boolean[] = [];
      s.alCambiar((activo) => avisos.push(activo));
      expect(s.alternar(false)).toBeFalse();
      expect(almacen.datos.get(CLAVE_SONIDO)).toBe('0');
      expect(ctx.osciladores.every((o) => o.paradas > 0)).toBeTrue();
      expect(avisos).toEqual([false]);

      s.hablar('cap', 'Otra vez', 3000);
      expect(ctx.osciladores.length).toBe(agendados);
    });

    it('con la preferencia guardada en apagado arranca callado', () => {
      const ctx = new ContextoFalso();
      const s = crearSonido({
        crearContexto: () => ctx as unknown as AudioContext,
        almacen: almacenEnMemoria({ [CLAVE_SONIDO]: '0' }),
        documento: null,
      });
      s.desbloquear();
      s.efecto('titulo');
      expect(s.activo()).toBeFalse();
      expect(ctx.osciladores.length).toBe(0);
    });

    it('se congela con la pestaña oculta y vuelve al mostrarse', () => {
      const ctx = new ContextoFalso();
      const escuchas = new Map<string, EventListener>();
      const documento = {
        visibilityState: 'visible' as DocumentVisibilityState,
        addEventListener: (tipo: string, fn: EventListener) => void escuchas.set(tipo, fn),
        removeEventListener: (tipo: string) => void escuchas.delete(tipo),
      };
      const s = crearSonido({ crearContexto: () => ctx as unknown as AudioContext, documento });

      escuchas.get('pointerdown')!(new Event('pointerdown'));
      expect(ctx.resumidas).toBe(1);

      documento.visibilityState = 'hidden';
      escuchas.get('visibilitychange')!(new Event('visibilitychange'));
      expect(ctx.suspendidas).toBe(1);

      documento.visibilityState = 'visible';
      escuchas.get('visibilitychange')!(new Event('visibilitychange'));
      expect(ctx.resumidas).toBe(2);

      s.destruir();
      expect(escuchas.size).toBe(0);
      expect(ctx.state).toBe('closed');
    });

    it('un contexto cerrado por el navegador deja de agendar sin tirar', () => {
      const ctx = new ContextoFalso();
      const s = crearSonido({
        crearContexto: () => ctx as unknown as AudioContext,
        documento: null,
      });
      s.desbloquear();
      ctx.state = 'closed';
      expect(() => s.hablar('mascota', 'El caos es orden', 2000)).not.toThrow();
      expect(ctx.osciladores.length).toBe(0);
    });
  });
});
