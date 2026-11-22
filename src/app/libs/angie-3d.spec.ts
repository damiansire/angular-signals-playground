import { camara, construirGema, geometria, MODELO, proyectar, VISOR } from './angie-3d';

describe('angie-3d', () => {
  const { gema } = MODELO;

  it('la gema es un poliedro cerrado: V - A + C = 2 y cada vértice cumple todos los planos', () => {
    const aristas = new Set<string>();
    for (const c of gema.caras)
      c.v.forEach((v, i) => {
        const w = c.v[(i + 1) % c.v.length];
        aristas.add(v < w ? `${v}-${w}` : `${w}-${v}`);
      });
    expect(gema.verts.length - aristas.size + gema.caras.length).toBe(2);
    for (const p of gema.verts)
      for (const c of gema.caras)
        expect(c.n[0] * p[0] + c.n[1] * p[1] + c.n[2] * p[2]).toBeLessThanOrEqual(c.d + 1e-3);
  });

  it('cada faceta de la lista aparece, con su espejo, y ninguna se pierde al cortarse', () => {
    expect(gema.caras.length).toBe(25);
    expect(construirGema().caras.map((c) => c.nombre)).toEqual(gema.caras.map((c) => c.nombre));
  });

  it('es simétrica: cada vértice tiene su espejo del otro lado', () => {
    for (const [x, y, z] of gema.verts) {
      const espejo = gema.verts.some((w) => Math.hypot(w[0] + x, w[1] - y, w[2] - z) < 1e-6);
      expect(espejo).toBeTrue();
    }
  });

  it('mide lo que el modelo oficial: la gema va de y 16 a 164', () => {
    const ys = gema.verts.map((v) => v[1]);
    expect(Math.min(...ys)).toBeCloseTo(16, -1);
    expect(Math.max(...ys)).toBeCloseTo(164, -1);
  });

  it('el panel del visor queda siempre bajo el casco, y dentro de la abertura', () => {
    for (let i = 0; i <= 20; i++)
      for (let j = 0; j <= 10; j++) {
        const [x, y] = MODELO.panelXY(-1 + i / 10, j / 10);
        const [, , z] = MODELO.enVisor([x, y]);
        expect(z).toBeLessThanOrEqual(MODELO.sobreCasco(x, y)[0] - VISOR.holgura + 1e-9);
        // the opening is widest at its top: the panel stays a margin inside it
        const [xb] = MODELO.visorXY(-1 + i / 10, 1);
        expect(Math.abs(x)).toBeLessThanOrEqual(
          Math.abs(xb) - VISOR.margenLado * Math.abs(-1 + i / 10) + 1e-9,
        );
      }
  });

  it('la visera tapa el panel arriba: su borde baja más en el centro que a los costados', () => {
    expect(MODELO.panelXY(0, 1)[1]).toBeLessThan(MODELO.visorXY(0, 1)[1] - 10);
    expect(MODELO.panelXY(1, 1)[1]).toBeGreaterThan(MODELO.panelXY(0, 1)[1]);
  });

  it('la cámara gira hacia la derecha de quien mira y mira desde arriba con pitch', () => {
    const frente: [number, number, number] = [0, 0, 1];
    expect(camara({ yaw: 90 }).dir(frente)[0]).toBeCloseTo(1, 6);
    expect(camara({ pitch: 90 }).dir([0, 1, 0])[2]).toBeCloseTo(1, 6);
    expect(camara({ escala: 2, cx: 100, cy: 100 }).pantalla([10, 81, 0])).toEqual([120, 100]);
  });

  it('de frente se ven la cara y el visor; de espaldas, ninguno de los dos', () => {
    const frente = proyectar({ escala: 2 }, 'f');
    expect(frente).toContain('f-abertura');
    expect(frente).toContain('#0f0f11');
    const espalda = proyectar({ yaw: 180, escala: 2 }, 'e');
    expect(espalda).not.toContain('clipPath');
    expect(geometria({ yaw: 180 }).hueco).toEqual([]);
  });

  it('girar a la izquierda es el espejo de girar a la derecha', () => {
    for (const yaw of [30, 85, 120]) {
      const contorno = (a: number) =>
        geometria({ yaw: a })
          .caras.flatMap((c) => c.pts)
          .map(([x]) => x);
      const der = contorno(yaw);
      const izq = contorno(-yaw);
      expect(Math.max(...der)).toBeCloseTo(-Math.min(...izq), 6);
      expect(Math.min(...der)).toBeCloseTo(-Math.max(...izq), 6);
    }
  });

  it('dos proyecciones en una página no comparten ids', () => {
    const ids = (svg: string) => [...svg.matchAll(/id="([^"]+)"/g)].map((r) => r[1]);
    const a = ids(proyectar({ yaw: 80 }, 'a'));
    const b = ids(proyectar({ yaw: 80 }, 'b'));
    expect(a.length).toBeGreaterThan(0);
    expect(a.filter((id) => b.includes(id))).toEqual([]);
  });
});
