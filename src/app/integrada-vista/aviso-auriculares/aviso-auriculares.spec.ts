import {
  LLAMADO,
  NUCLEO,
  ALEJARSE_MS,
  SE_CIERRA_MS,
  SE_ALEJA_DESDE_MS,
  VIAJE_MS,
  aireQueCabe,
  aireQueCubre,
  cuadroDelViaje,
  profundidadDelViaje,
  profundidadDesdeElOjo,
  type CuadroDelViaje,
  PANEO,
  cuandoSeAbre,
  cuandoSuena,
  estrellasDelAlba,
  letrasDelLlamado,
  loopsQueSeRedibujan,
  tocaRedibujar,
  planDeLaPrueba,
} from './aviso-auriculares';

describe('aviso de auriculares', () => {
  describe('la prueba', () => {
    const plan = planDeLaPrueba();

    it('suena primero a la izquierda, después a la derecha y al final en los dos', () => {
      const izquierda = cuandoSuena(plan, 'izquierda');
      const derecha = cuandoSuena(plan, 'derecha');
      const ambos = cuandoSuena(plan, 'ambos');
      expect(izquierda).toBe(0);
      expect(derecha).toBeGreaterThan(izquierda);
      expect(ambos).toBeGreaterThan(derecha);
      // Un lado no se pisa con el siguiente: si no, no se oye que cambia de oído.
      const ultimaIzquierda = Math.max(
        ...plan.filter((n) => n.lado === 'izquierda').map((n) => n.t),
      );
      expect(ultimaIzquierda).toBeLessThan(derecha);
    });

    it('cada lado va a su oído, y el acorde, al medio', () => {
      expect(PANEO.izquierda).toBeLessThan(0);
      expect(PANEO.derecha).toBeGreaterThan(0);
      expect(PANEO.ambos).toBe(0);
      expect(Math.abs(PANEO.izquierda)).toBeLessThan(1);
    });

    it('el telón sube después de la última nota y antes de los dos segundos', () => {
      const ultima = Math.max(...plan.map((n) => n.t));
      expect(cuandoSeAbre(plan)).toBeGreaterThan(ultima);
      expect(cuandoSeAbre(plan)).toBeLessThan(2);
    });

    it('un lado que no suena se avisa, no se dibuja en cero', () => {
      expect(() => cuandoSuena([], 'derecha')).toThrowError(/derecha/);
    });
  });

  describe('las estrellas', () => {
    it('son las mismas en cada visita', () => {
      expect(estrellasDelAlba(7, 30)).toEqual(estrellasDelAlba(7, 30));
    });

    it('quedan en la mitad de arriba del dibujo, donde todavía es de noche', () => {
      for (const e of estrellasDelAlba(7, 200)) {
        expect(e.x).toBeGreaterThanOrEqual(0);
        expect(e.x).toBeLessThanOrEqual(1920);
        expect(e.y).toBeGreaterThanOrEqual(0);
        expect(e.y).toBeLessThanOrEqual(600);
      }
    });
  });

  describe('el llamado', () => {
    it('se arma de nuevo con las mismas letras, en palabras enteras', () => {
      const palabras = letrasDelLlamado(LLAMADO);
      expect(palabras.map((p) => p.map((l) => l.c).join('')).join(' ')).toBe(LLAMADO);
    });

    it('la ola recorre la frase entera: el índice sigue de una palabra a la otra', () => {
      const indices = letrasDelLlamado('ab cd e')
        .flat()
        .map((l) => l.i);
      expect(indices).toEqual([0, 1, 2, 3, 4]);
    });

    it('los espacios de más no dejan palabras vacías', () => {
      expect(letrasDelLlamado(' a  b ').length).toBe(2);
    });
  });

  describe('el círculo que se cierra', () => {
    // Una pantalla con el ojo de Angie abajo y a la izquierda del centro, como en la colina.
    const [ancho, alto, x, y] = [1024, 768, 470, 500];

    it('arranca tapando el aviso entero: el círculo llega a la esquina más lejana', () => {
      const a = aireQueCubre(x, y, ancho, alto);
      const esquinas = [
        [0, 0],
        [ancho, 0],
        [0, alto],
        [ancho, alto],
      ];
      for (const [ex, ey] of esquinas)
        expect(NUCLEO * a).toBeGreaterThan(Math.hypot(ex - x, ey - y));
    });

    it('al encajar queda adentro del aviso: no asoma ningún borde recto', () => {
      const a = aireQueCabe(x, y, ancho, alto);
      expect(x - a).toBeGreaterThanOrEqual(0);
      expect(x + a).toBeLessThanOrEqual(ancho);
      expect(y - a).toBeGreaterThanOrEqual(0);
      expect(y + a).toBeLessThanOrEqual(alto);
    });

    it('se cierra: encaja con menos aire del que tenía al arrancar', () => {
      expect(aireQueCabe(x, y, ancho, alto)).toBeLessThan(aireQueCubre(x, y, ancho, alto));
    });
  });
});

describe('el viaje de la cámara, del ojo de Angie a la colina', () => {
  const S0 = 40;
  const cubre = 2000;
  const cabe = 300;
  const en = (t: number) => cuadroDelViaje(t, S0, cubre, cabe);
  const enPantalla = (c: CuadroDelViaje) => c.colina * c.aviso;

  it('arranca con el aviso entero y del tamaño de la pantalla, y la colina de muy cerca', () => {
    const c = en(0);
    expect(c.colina).toBe(S0);
    expect(enPantalla(c)).toBeCloseTo(1, 6);
    expect(c.aire).toBe(cubre);
  });

  it('se aleja desde el primer cuadro: no es un círculo negro que se cierra sobre el aviso quieto', () => {
    expect(enPantalla(en(16))).toBeLessThan(1);
    expect(enPantalla(en(200))).toBeLessThan(0.95);
    // Cuando el borde termina de redondearse, el aviso ya va por menos de la mitad de su tamaño.
    const redondo = [...Array(SE_CIERRA_MS / 10).keys()]
      .map((i) => i * 10)
      .find((t) => en(t).aire === cabe)!;
    expect(enPantalla(en(redondo))).toBeLessThan(0.5);
  });

  it('se aleja despacio al principio: no es un salto a la mitad en un parpadeo', () => {
    expect(enPantalla(en(300))).toBeGreaterThan(0.6);
    expect(enPantalla(en(SE_CIERRA_MS / 2))).toBeGreaterThan(0.15);
  });

  it('el borde se redondea sin volver atrás: de la pantalla entera al círculo que cabe', () => {
    let antes = Infinity;
    for (let t = 0; t <= SE_CIERRA_MS; t += 10) {
      expect(en(t).aire).toBeLessThanOrEqual(antes);
      antes = en(t).aire;
    }
    expect(en(SE_CIERRA_MS).aire).toBe(cabe);
  });

  it('el aviso se achica sin crecer nunca y termina en cero: la pantalla queda toda ojo', () => {
    let antes = Infinity;
    for (let t = 0; t <= SE_CIERRA_MS; t += 10) {
      expect(enPantalla(en(t))).toBeLessThanOrEqual(antes + 1e-12);
      antes = enPantalla(en(t));
    }
    expect(enPantalla(en(SE_CIERRA_MS))).toBe(0);
  });

  it('la cámara arranca cuando el aviso ya es una mota, y no antes: no queda un rato toda negra', () => {
    for (let t = 0; t < SE_ALEJA_DESDE_MS; t += 10) expect(en(t).colina).toBe(S0);
    expect(SE_ALEJA_DESDE_MS).toBeLessThan(SE_CIERRA_MS);
    expect(enPantalla(en(SE_ALEJA_DESDE_MS))).toBeLessThan(0.01);
  });

  it('mientras la cámara se aleja no queda ningún punto del aviso', () => {
    for (let t = SE_CIERRA_MS; t <= VIAJE_MS; t += 25) expect(en(t).aviso).toBe(0);
  });

  it('la cámara solo se aleja, y llega a la colina sin saltos', () => {
    let antes = Infinity;
    for (let t = 0; t <= VIAJE_MS; t += 10) {
      const c = en(t);
      expect(c.colina).toBeLessThanOrEqual(antes + 1e-9);
      antes = c.colina;
    }
    expect(en(VIAJE_MS - 1).colina).toBeCloseTo(1, 1);
    expect(en(VIAJE_MS).colina).toBe(1);
  });

  it('como en Powers of Ten: a mitad de camino, tiempos iguales dividen la escala por lo mismo', () => {
    const t = (f: number) => SE_ALEJA_DESDE_MS + ALEJARSE_MS * f;
    const r1 = en(t(0.4)).colina / en(t(0.5)).colina;
    const r2 = en(t(0.5)).colina / en(t(0.6)).colina;
    expect(r1).toBeCloseTo(r2, 1);
    expect(r1).toBeGreaterThan(1.2);
  });

  it('arranca desde adentro del ojo: las esquinas de la pantalla caen dentro de su negro', () => {
    const mancha = { ancho: 10, alto: 16 };
    const s = profundidadDelViaje(mancha, 800, 500);
    // La mancha agrandada, como elipse: la esquina más lejana queda adentro.
    expect(
      (800 / ((s * mancha.ancho) / 2)) ** 2 + (500 / ((s * mancha.alto) / 2)) ** 2,
    ).toBeLessThan(1);
    expect(profundidadDelViaje({ ancho: 0.1, alto: 0.1 }, 800, 500)).toBe(900);
    expect(profundidadDelViaje({ ancho: 900, alto: 900 }, 10, 10)).toBe(6);
  });

  it('mide la pantalla en el dibujo del ojo: girada, una mancha alta queda acostada', () => {
    const mancha = { ancho: 10, alto: 30 };
    const esquinas = [
      [-400, -100],
      [400, 100],
    ] as const;
    const derecha = profundidadDesdeElOjo(mancha, { a: 1, b: 0, c: 0, d: 1 }, esquinas);
    const acostada = profundidadDesdeElOjo(mancha, { a: 0, b: 1, c: -1, d: 0 }, esquinas);
    expect(derecha).toBeCloseTo(profundidadDelViaje(mancha, 400, 100), 6);
    expect(acostada).toBeCloseTo(profundidadDelViaje(mancha, 100, 400), 6);
    expect(acostada).toBeLessThan(derecha);
  });
});

describe('los loops que se redibujan al llegar la cámara', () => {
  const colina = document.createElement('div');
  const aviso = colina.appendChild(document.createElement('div'));
  const animar = (padre: Element, iterations: number): Animation =>
    padre.appendChild(document.createElement('div')).animate([{ opacity: 0.5 }, { opacity: 1 }], {
      duration: 1000,
      iterations,
    });
  beforeAll(() => document.body.appendChild(colina));
  afterAll(() => colina.remove());

  it('toma los loops de la colina, que de otro modo quedan dibujados a la escala del ojo', () => {
    const junco = animar(colina, Infinity);
    expect(loopsQueSeRedibujan([junco], aviso)).toEqual([junco]);
  });

  it('no toca lo que termina solo ni los loops del aviso, que se va', () => {
    const entrada = animar(colina, 1);
    const estrella = animar(aviso, Infinity);
    expect(loopsQueSeRedibujan([entrada, estrella], aviso)).toEqual([]);
  });

  it('no toca los que ya frenó la pausa de fondo: al soltarlos los despausaría', () => {
    const enPausa = animar(colina, Infinity);
    enPausa.playbackRate = 0;
    expect(loopsQueSeRedibujan([enPausa], aviso)).toEqual([]);
  });
});

describe('cuándo se redibujan los loops en el viaje de la cámara', () => {
  it('en el primer cuadro: arrancan a la escala del ojo y no a la de la colina de antes', () => {
    expect(tocaRedibujar(900, Infinity)).toBeTrue();
  });

  it('cada vez que la escala baja a la mitad, y no en cada cuadro, que pestañeaba', () => {
    expect(tocaRedibujar(460, 900)).withContext('apenas se alejó').toBeFalse();
    expect(tocaRedibujar(450, 900)).withContext('a la mitad').toBeTrue();
  });

  it('del ojo a la colina son unas diez veces, no cientos', () => {
    let dibujadaA = Infinity;
    let veces = 0;
    for (let escala = 960; escala >= 1; escala *= 0.97) {
      if (tocaRedibujar(escala, dibujadaA)) {
        dibujadaA = escala;
        veces++;
      }
    }
    expect(veces).toBeGreaterThan(5);
    expect(veces).toBeLessThan(15);
  });
});
