import {
  LLAMADO,
  NUCLEO,
  ALEJARSE_MS,
  BOCANADA_MS,
  CHICO,
  VIAJE_MS,
  aireQueCabe,
  aireQueCubre,
  cuadroDelViaje,
  profundidadDelViaje,
  type CuadroDelViaje,
  PANEO,
  cuandoSeAbre,
  cuandoSuena,
  estrellasDelAlba,
  letrasDelLlamado,
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

  describe('la bocanada', () => {
    // Una pantalla con la boca de Angie abajo y a la izquierda del centro, como en la colina.
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

describe('el viaje de la cámara, de la boca a la colina', () => {
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
    expect(c.bocaAbierta).toBeTrue();
  });

  it('el aviso no se achica hasta que la bocanada cabe adentro: no asoman sus bordes', () => {
    for (let t = 0; t < BOCANADA_MS; t += 20) {
      const c = en(t);
      if (enPantalla(c) < 0.999) expect(c.aire).toBe(cabe);
    }
  });

  it('termina la bocanada como un circulito, con el aviso ilegible', () => {
    const c = en(BOCANADA_MS);
    expect(enPantalla(c)).toBeCloseTo(CHICO, 3);
    expect(c.colina).toBeCloseTo(S0, 3);
  });

  it('la cámara solo se aleja, y llega a la colina sin saltos', () => {
    let antes = Infinity;
    for (let t = 0; t <= VIAJE_MS; t += 10) {
      const c = en(t);
      expect(c.colina).toBeLessThanOrEqual(antes + 1e-9);
      antes = c.colina;
    }
    expect(en(BOCANADA_MS + ALEJARSE_MS - 1).colina).toBeCloseTo(1, 1);
    expect(en(VIAJE_MS).colina).toBe(1);
  });

  it('como en Powers of Ten: a mitad de camino, tiempos iguales dividen la escala por lo mismo', () => {
    const t = (f: number) => BOCANADA_MS + ALEJARSE_MS * f;
    const r1 = en(t(0.4)).colina / en(t(0.5)).colina;
    const r2 = en(t(0.5)).colina / en(t(0.6)).colina;
    expect(r1).toBeCloseTo(r2, 1);
    expect(r1).toBeGreaterThan(1.2);
  });

  it('el circulito se achica más despacio que el mundo: llega a la colina todavía visible', () => {
    const llegando = en(BOCANADA_MS + ALEJARSE_MS);
    expect(enPantalla(llegando)).toBeGreaterThan(1 / S0);
    expect(enPantalla(llegando)).toBeLessThan(CHICO);
  });

  it('la boca queda abierta todo el viaje y se cierra cuando el circulito entra', () => {
    for (let t = 0; t < BOCANADA_MS + ALEJARSE_MS; t += 50) expect(en(t).bocaAbierta).toBeTrue();
    expect(en(VIAJE_MS).bocaAbierta).toBeFalse();
    expect(en(VIAJE_MS).aviso).toBe(0);
  });

  it('la profundidad pone la boca en media pantalla, con tope', () => {
    expect(profundidadDelViaje(10, 1440, 900)).toBe(45);
    expect(profundidadDelViaje(1, 1440, 900)).toBe(60);
    expect(profundidadDelViaje(200, 1440, 900)).toBe(6);
  });
});
