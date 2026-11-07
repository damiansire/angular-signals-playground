import { IMPACTO } from '../libs/muelle';
import {
  ANCHO,
  alturaDeColina,
  azar,
  caminoDeColina,
  dispersion,
  estela,
  estrellas,
  floresDeLadera,
  initInicioAngie,
  juncos,
  matasDePasto,
} from './inicio-angie';

/**
 * La pantalla de inicio es dibujo, pero lo que la sostiene son cuentas: el paisaje sale con semilla
 * (la misma escena en cada visita), Angie tiene que pisar la cima que el CSS supone, y cada pieza
 * tiene que salir hacia afuera y la luz apuntar al cielo. Eso se prueba como función pura.
 */
describe('inicio-angie', () => {
  describe('azar con semilla', () => {
    it('la misma semilla da la misma serie', () => {
      const a = azar(7);
      const b = azar(7);
      expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    });

    it('semillas distintas dan series distintas, siempre en [0, 1)', () => {
      const a = azar(1);
      const b = azar(2);
      const serie = Array.from({ length: 50 }, () => a());
      expect(serie).not.toEqual(Array.from({ length: 50 }, () => b()));
      expect(serie.every((v) => v >= 0 && v < 1)).toBeTrue();
    });
  });

  describe('la colina', () => {
    it('la cima está donde la pisa Angie: el CSS supone ~282 unidades desde abajo', () => {
      // `.ini__angie` usa `bottom: 282u`; si la colina cambia de forma, Angie flota o se hunde.
      expect(1080 - alturaDeColina(ANCHO / 2)).toBeCloseTo(282, -1);
    });

    it('el centro es lo más alto: Angie no queda en un pozo', () => {
      const cima = alturaDeColina(ANCHO / 2);
      for (const x of [200, 500, 1400, 1700]) {
        expect(alturaDeColina(x)).withContext(`x = ${x}`).toBeGreaterThan(cima);
      }
    });

    it('el contorno cubre la pantalla de borde a borde y cierra por abajo', () => {
      const d = caminoDeColina();
      expect(d.startsWith('M-40 ')).toBeTrue();
      expect(d.endsWith('Z')).toBeTrue();
      expect(d).toContain(`L${ANCHO + 40} 1080`);
    });
  });

  describe('el pasto', () => {
    it('es el mismo en cada visita', () => {
      expect(matasDePasto(11, 20)).toEqual(matasDePasto(11, 20));
    });

    it('no crece donde pisa Angie: le taparía los pies', () => {
      for (const mata of matasDePasto(11, 70)) {
        const x = Number(/^M(-?[\d.]+)/.exec(mata.d)![1]);
        expect(Math.abs(x - ANCHO / 2))
          .withContext(mata.d.slice(0, 20))
          .toBeGreaterThan(140);
      }
    });

    it('cada mata nace en el borde de la colina, no flotando en el cielo', () => {
      for (const mata of matasDePasto(11, 30)) {
        const [, x, y] = /^M(-?[\d.]+) (-?[\d.]+)/.exec(mata.d)!.map(Number);
        // El `M` es la base de la primera hoja, unas 8 unidades a la izquierda del centro de la mata.
        expect(y).toBeCloseTo(alturaDeColina(x + 8) + 6, -1);
      }
    });

    it('las flores quedan en la ladera, por debajo del borde', () => {
      for (const f of floresDeLadera(23, 40)) {
        expect(f.y).toBeGreaterThan(alturaDeColina(f.x));
      }
    });
  });

  it('los juncos de cada costado nacen en su borde', () => {
    for (const j of juncos(31, 9, -1)) expect(Number(/^M([\d.]+)/.exec(j.d)![1])).toBeLessThan(320);
    for (const j of juncos(47, 9, 1)) {
      expect(Number(/^M([\d.]+)/.exec(j.d)![1])).toBeGreaterThan(ANCHO - 320);
    }
  });

  it('las estrellas caen dentro de la pantalla', () => {
    for (const e of estrellas(59, 70)) {
      expect(e.x).toBeGreaterThanOrEqual(0);
      expect(e.x).toBeLessThanOrEqual(100);
      expect(e.y).toBeGreaterThanOrEqual(0);
      expect(e.y).toBeLessThanOrEqual(100);
    }
  });

  describe('el desarme', () => {
    const centro = { x: 200, y: 300 };

    it('cada pieza sale hacia su lado, lejos del centro', () => {
      const derecha = dispersion(centro, { x: 260, y: 300 }, 0, 300);
      const izquierda = dispersion(centro, { x: 140, y: 300 }, 1, 300);
      expect(derecha.dx).toBeGreaterThan(0);
      expect(izquierda.dx).toBeLessThan(0);
    });

    it('las de los costados también suben: el viaje sigue hacia el cielo', () => {
      for (let i = 0; i < 12; i++) {
        const lado = i % 2 ? 1 : -1;
        const d = dispersion(centro, { x: 200 + lado * 80, y: 300 }, i, 300);
        expect(d.dy).withContext(`pieza ${i}`).toBeLessThan(0);
      }
    });

    it('el salto escala con Angie: en un celular no la saca de la pantalla', () => {
      const chica = dispersion(centro, { x: 300, y: 300 }, 3, 100);
      const grande = dispersion(centro, { x: 300, y: 300 }, 3, 400);
      expect(Math.abs(grande.dx)).toBeCloseTo(Math.abs(chica.dx) * 4, -1);
      expect(Math.hypot(grande.dx, grande.dy)).toBeLessThan(400 * 0.4);
    });

    it('una pieza justo en el centro igual tiene adónde ir', () => {
      const d = dispersion(centro, centro, 5, 300);
      expect(Number.isFinite(d.dx) && Number.isFinite(d.dy)).toBeTrue();
      expect(d.dy).toBeLessThan(0);
    });
  });

  describe('la estela', () => {
    it('apunta hacia arriba (0°) cuando el cielo está justo encima', () => {
      const e = estela({ x: 100, y: 500 }, { x: 100, y: -50 });
      expect(e.angulo).toBe(0);
      expect(e.largo).toBe(550);
    });

    it('se inclina hacia el lado del punto donde convergen', () => {
      expect(estela({ x: 100, y: 500 }, { x: 400, y: 0 }).angulo).toBeGreaterThan(0);
      expect(estela({ x: 700, y: 500 }, { x: 400, y: 0 }).angulo).toBeLessThan(0);
    });
  });

  describe('en pantalla', () => {
    const hosts: HTMLElement[] = [];
    const cerrar: (() => void)[] = [];
    afterEach(() => {
      cerrar.splice(0).forEach((fn) => fn());
      hosts.splice(0).forEach((h) => h.remove());
    });

    function montar(): { host: HTMLElement; escena: HTMLElement } {
      const host = document.createElement('div');
      host.innerHTML = `
        <div class="tusi__overlay ini" style="position:fixed;inset:0">
          <svg width="400" height="300"><rect data-material="cielo" width="400" height="150"/>
            <rect data-material="pasto" y="150" width="400" height="150"/></svg>
          <div class="ini__angie"></div>
          <div class="ini__luces"></div>
        </div>`;
      document.body.appendChild(host);
      hosts.push(host);
      return { host, escena: host.querySelector<HTMLElement>('.ini')! };
    }

    it('sin la escena avisa en vez de dejar un Entrar que no hace nada', () => {
      expect(() => initInicioAngie(document.createElement('div'))).toThrowError(/\.tusi__overlay/);
    });

    it('tocar el pasto o el cielo le pega al mundo, y tocar fuera de ellos no', () => {
      const { host, escena } = montar();
      cerrar.push(initInicioAngie(host).dispose);
      const golpes: string[] = [];
      const oir = (e: Event): void => {
        golpes.push(String((e as CustomEvent<{ fuerza: number }>).detail.fuerza));
      };
      window.addEventListener(IMPACTO, oir);
      const tocar = (el: Element): void => {
        el.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, button: 0, clientX: 50, clientY: 50 }),
        );
      };

      tocar(escena.querySelector('[data-material="pasto"]')!);
      tocar(escena.querySelector('[data-material="cielo"]')!);
      tocar(escena.querySelector('.ini__angie')!);
      window.removeEventListener(IMPACTO, oir);

      // El pasto pega más fuerte que el cielo; Angie responde sola a su propio toque.
      expect(golpes).toEqual(['0.5', '0.3']);
    });

    it('con movimiento reducido la salida termina enseguida, sin viaje', async () => {
      spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
      const { host, escena } = montar();
      const inicio = initInicioAngie(host);
      cerrar.push(inicio.dispose);

      await inicio.despedir();

      expect(escena.classList).toContain('ini--saliendo');
      expect(escena.classList).not.toContain('ini--noche');
      expect(escena.querySelector('.ini__luces')!.children.length).toBe(0);
    });

    it('cerrar a mitad de la salida no deja luces colgadas', async () => {
      const { host, escena } = montar();
      const inicio = initInicioAngie(host);

      const salida = inicio.despedir();
      inicio.dispose();
      await salida;

      expect(escena.querySelector('.ini__luces')!.children.length).toBe(0);
    });
  });
});
