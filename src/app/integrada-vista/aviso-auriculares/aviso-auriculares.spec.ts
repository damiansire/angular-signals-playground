import {
  LLAMADO,
  NUCLEO,
  ALEJARSE_MS,
  SE_CIERRA_MS,
  SE_ALEJA_DESDE_MS,
  VIAJE_MS,
  aireQueCabe,
  aireQueCubre,
  corridaDeLaCamara,
  cuadroDelViaje,
  laGemaTapaLaPantalla,
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
  propiedadesAnimadas,
  marcaDelPseudo,
  HOLGURA_DE_DIBUJO,
  LA_COLINA_APARECE_MS,
  camaraSobreLoDibujado,
  escalaDeDibujo,
  esLoopQueCorre,
  laCapaTapaSuLugar,
  type Dibujada,
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

  it('los del aviso también son loops que corren: se aquietan aparte, mientras se cierra', () => {
    expect(esLoopQueCorre(animar(aviso, Infinity))).toBeTrue();
    expect(esLoopQueCorre(animar(aviso, 1)))
      .withContext('termina solo')
      .toBeFalse();
  });
});

describe('cuándo la gema de Angie tapa la pantalla', () => {
  let svg: SVGSVGElement;
  const pieza = (d: string): SVGPathElement => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    svg.appendChild(p);
    return p;
  };
  beforeEach(() => {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('style', 'position: fixed; left: 0; top: 0; width: 400px; height: 300px');
    document.body.appendChild(svg);
  });
  afterEach(() => svg.remove());
  const pantalla = { left: 100, top: 100, width: 100, height: 50 };

  it('la tapa cuando las cuatro esquinas, con margen, caen adentro', () => {
    expect(laGemaTapaLaPantalla([pieza('M0 0H400V300H0Z')], pantalla)).toBeTrue();
  });

  it('no la tapa si una esquina asoma, aunque el resto esté adentro', () => {
    expect(laGemaTapaLaPantalla([pieza('M0 0H195V300H0Z')], pantalla)).toBeFalse();
  });

  it('entre varias piezas: cada esquina en alguna alcanza', () => {
    const izquierda = pieza('M0 0H150V300H0Z');
    const derecha = pieza('M150 0H400V300H150Z');
    expect(laGemaTapaLaPantalla([izquierda, derecha], pantalla)).toBeTrue();
  });

  it('sin piezas a la vista no la tapa', () => {
    expect(laGemaTapaLaPantalla([], pantalla)).toBeFalse();
  });
});

describe('la cámara lleva el ojo al medio de la pantalla', () => {
  it('entero mientras se cierra el aviso, nada al llegar a la colina', () => {
    expect(corridaDeLaCamara(900, 900)).toBe(1);
    expect(corridaDeLaCamara(1, 900)).toBe(0);
  });

  it('va en escala: a la mitad del viaje en escala, a la mitad del camino', () => {
    expect(corridaDeLaCamara(30, 900)).toBeCloseTo(0.5, 5);
  });

  it('a lo largo del viaje solo vuelve, nunca se pasa ni va y viene', () => {
    let antes = Infinity;
    for (let t = 0; t <= VIAJE_MS; t += 50) {
      const k = corridaDeLaCamara(cuadroDelViaje(t, 900, 2000, 400).colina, 900);
      expect(k).toBeGreaterThanOrEqual(0);
      expect(k).toBeLessThanOrEqual(antes);
      antes = k;
    }
    expect(antes).toBe(0);
  });

  it('sin profundidad no corre nada', () => {
    expect(corridaDeLaCamara(1, 1)).toBe(0);
  });
});

describe('cuándo aparece la colina debajo del aviso', () => {
  const cubre = aireQueCubre(1720, 650, 3440, 1300);
  const cabe = aireQueCabe(1720, 650, 3440, 1300);

  it('antes de que arranque la cámara: cuando arranca, ya está dibujada', () => {
    expect(LA_COLINA_APARECE_MS).toBeLessThan(SE_ALEJA_DESDE_MS);
    expect(SE_ALEJA_DESDE_MS - LA_COLINA_APARECE_MS).toBeGreaterThanOrEqual(150);
  });

  it('con el aviso ya chico: el tirón de armarla no frena un aviso a pantalla entera', () => {
    const c = cuadroDelViaje(LA_COLINA_APARECE_MS, 520, cubre, cabe);
    const diametro = 2 * c.aire * c.aviso * c.colina;
    expect(diametro).withContext('px en una pantalla de 3440').toBeLessThan(60);
  });
});

describe('cuándo el aviso deja de dibujarse', () => {
  const profundidad = 520;
  const cubre = aireQueCubre(1720, 650, 3440, 1300);
  const cabe = aireQueCabe(1720, 650, 3440, 1300);

  it('cuando arranca la cámara ya es una mota de pocos píxeles: que desaparezca no se ve', () => {
    const c = cuadroDelViaje(SE_ALEJA_DESDE_MS, profundidad, cubre, cabe);
    const diametro = 2 * c.aire * c.aviso * c.colina;
    expect(diametro).withContext('px en una pantalla de 3440').toBeLessThan(12);
  });

  it('y falta para el primer escalón de la colina: su memoria de video ya volvió', () => {
    const primerEscalon = escalaDeDibujo(profundidad);
    let t = SE_ALEJA_DESDE_MS;
    while (cuadroDelViaje(t, profundidad, cubre, cabe).colina > primerEscalon) t += 4;
    expect(t - SE_ALEJA_DESDE_MS)
      .withContext('ms entre que se va el aviso y el escalón')
      .toBeGreaterThan(200);
  });
});

describe('la colina dibujada por escalones', () => {
  /** Un viaje del ojo a la colina, cuadro a cuadro: cuántos escalones y la mayor escala de la capa. */
  const viaje = (desde: number): { escalones: number; mayor: number; menor: number } => {
    let dibujadaA = escalaDeDibujo(desde);
    let escalones = 1;
    let mayor = 0;
    let menor = Infinity;
    for (let escala = desde; escala >= 1; escala *= 0.985) {
      if (tocaRedibujar(escala, dibujadaA)) {
        dibujadaA = escalaDeDibujo(escala);
        escalones++;
      }
      mayor = Math.max(mayor, escala / dibujadaA);
      menor = Math.min(menor, escala / dibujadaA);
    }
    return { escalones, mayor, menor };
  };

  it('se dibuja a la escala del final del escalón: la capa pone la holgura que falta', () => {
    expect(escalaDeDibujo(900)).toBeCloseTo(900 / HOLGURA_DE_DIBUJO, 6);
  });

  it('el último escalón ya es la colina en su lugar: no se dibuja a menos de 1', () => {
    expect(escalaDeDibujo(1.1)).toBe(1);
    expect(escalaDeDibujo(1)).toBe(1);
  });

  it('toca otro cuando la cámara llega a la escala dibujada, y no en cada cuadro', () => {
    expect(tocaRedibujar(800, 714)).withContext('a mitad del escalón').toBeFalse();
    expect(tocaRedibujar(714, 714)).withContext('llegó').toBeTrue();
  });

  it('dibujada a escala 1 no toca más: la capa la lleva hasta la colina', () => {
    expect(tocaRedibujar(1.2, 1)).toBeFalse();
    expect(tocaRedibujar(1, 1)).toBeFalse();
  });

  it('la capa nunca achica lo dibujado ni lo agranda más que la holgura', () => {
    const { mayor, menor } = viaje(960);
    expect(menor).withContext('achicada, asomaría lo de atrás por los bordes').toBeGreaterThan(1);
    expect(mayor)
      .withContext('agrandada de más, el navegador la vuelve a dibujar en cada cuadro')
      .toBeLessThanOrEqual(HOLGURA_DE_DIBUJO + 1e-9);
  });

  it('nunca más de 1,6 veces los píxeles de la pantalla: con 2× no entraba con poca memoria', () => {
    expect(HOLGURA_DE_DIBUJO ** 2).toBeLessThan(1.6);
  });

  it('del ojo a la colina son unas treinta veces, no cientos', () => {
    const { escalones } = viaje(960);
    expect(escalones).toBeGreaterThan(24);
    expect(escalones).toBeLessThan(34);
  });
});

describe('lo que la capa agrega sobre la colina dibujada', () => {
  const dibujada: Dibujada = { escala: 400, ojo: { x: 1700, y: 620 }, corrida: { x: 12, y: 18 } };
  /** Dónde cae en pantalla un punto de la colina, con la colina dibujada y la capa encima. */
  const enPantalla = (
    p: { x: number; y: number },
    capa: { escala: number; corrida: { x: number; y: number } },
  ): { x: number; y: number } => {
    const eje = (v: number, o: number, t: number, c: number): number => {
      const dibujado = o + dibujada.escala * (v - o) + t;
      return o + capa.escala * (dibujado - o) + c;
    };
    return {
      x: eje(p.x, dibujada.ojo.x, dibujada.corrida.x, capa.corrida.x),
      y: eje(p.y, dibujada.ojo.y, dibujada.corrida.y, capa.corrida.y),
    };
  };

  it('recién dibujada no agrega nada: escala 1 y sin corrida', () => {
    const capa = camaraSobreLoDibujado(dibujada, 400, dibujada.ojo, dibujada.corrida);
    expect(capa.escala).toBe(1);
    expect(capa.corrida.x).toBeCloseTo(0, 9);
    expect(capa.corrida.y).toBeCloseTo(0, 9);
  });

  it('entre las dos dejan cada punto donde lo pone la cámara: escala y corrida del momento', () => {
    const corrida = { x: 15, y: 22 };
    const capa = camaraSobreLoDibujado(dibujada, 500, dibujada.ojo, corrida);
    expect(capa.escala).toBeCloseTo(1.25, 9);
    const punto = { x: 1701.5, y: 619 };
    const visto = enPantalla(punto, capa);
    expect(visto.x).toBeCloseTo(1700 + 500 * 1.5 + 15, 6);
    expect(visto.y).toBeCloseTo(620 + 500 * -1 + 22, 6);
  });

  it('si el ojo se movió desde el escalón, sigue en su lugar: la corrida lo compensa', () => {
    const ojo = { x: 1700.2, y: 620.1 };
    const corrida = { x: 15, y: 22 };
    const capa = camaraSobreLoDibujado(dibujada, 500, ojo, corrida);
    const visto = enPantalla(ojo, capa);
    expect(visto.x)
      .withContext('el ojo es el punto fijo de la cámara')
      .toBeCloseTo(ojo.x + 15, 6);
    expect(visto.y).toBeCloseTo(ojo.y + 22, 6);
  });
});

describe('la capa de la cámara tapa su lugar', () => {
  const caja = { x: 0, y: 0, ancho: 3440, alto: 1300 };
  const ojo = { x: 1700, y: 620 };

  it('agrandada alrededor de un punto de adentro, lo tapa', () => {
    expect(laCapaTapaSuLugar(1.26, { x: 0, y: 0 }, ojo, caja)).toBeTrue();
    expect(laCapaTapaSuLugar(1, { x: 0, y: 0 }, ojo, caja)).toBeTrue();
  });

  it('achicada no: asoma lo de atrás por los cuatro bordes', () => {
    expect(laCapaTapaSuLugar(0.98, { x: 0, y: 0 }, ojo, caja)).toBeFalse();
  });

  it('corrida de más deja un borde al aire, aunque esté agrandada', () => {
    expect(laCapaTapaSuLugar(1.05, { x: 30, y: 0 }, ojo, caja))
      .withContext('a 30 px')
      .toBeTrue();
    expect(laCapaTapaSuLugar(1.05, { x: 90, y: 0 }, ojo, caja))
      .withContext('a 90 px')
      .toBeFalse();
    expect(laCapaTapaSuLugar(1.05, { x: 0, y: -40 }, ojo, caja))
      .withContext('hacia arriba')
      .toBeFalse();
  });

  it('medio píxel de menos no cuenta: es redondeo, no un borde', () => {
    expect(laCapaTapaSuLugar(1, { x: 0.4, y: 0 }, ojo, caja)).toBeTrue();
  });
});

describe('lo que queda fijo mientras un loop va quieto', () => {
  it('las propiedades que mueve, como se escriben en CSS', () => {
    const cuadros = [
      { offset: 0, computedOffset: 0, easing: 'ease', composite: 'auto', transform: 'none' },
      { offset: 1, computedOffset: 1, easing: 'ease', composite: 'auto', transformOrigin: '50% 0' },
    ];
    expect(propiedadesAnimadas(cuadros).sort()).toEqual(['transform', 'transform-origin']);
  });

  it('cada una una sola vez, aunque aparezca en todos los cuadros', () => {
    expect(propiedadesAnimadas([{ opacity: '0' }, { opacity: '1' }])).toEqual(['opacity']);
  });
});

describe('los pulsos de los pseudo-elementos mientras viaja la cámara', () => {
  it('cada pseudo-elemento con su marca, para apagar solo ese', () => {
    expect(marcaDelPseudo('::before')).toBe('antes');
    expect(marcaDelPseudo('::after')).toBe('despues');
  });

  it('un loop de un elemento no lleva marca: se aquieta con commitStyles', () => {
    expect(marcaDelPseudo(null)).toBeNull();
  });
});
