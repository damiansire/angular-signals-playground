import { createFrameScheduler } from './frame-scheduler';

/**
 * El contrato que este módulo existe para sostener: después de cerrar, nada de lo agendado corre.
 * Adentro del motor esto solo se podía verificar montando la app entera; acá se prueba directo.
 */
describe('createFrameScheduler', () => {
  const unCuadro = () => new Promise((r) => requestAnimationFrame(() => r(null)));
  const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

  it('corre lo agendado mientras está abierto', async () => {
    const s = createFrameScheduler();
    let cuadros = 0;
    let timers = 0;

    s.raf(() => cuadros++);
    s.later(() => timers++, 5);
    await unCuadro();
    await dormir(30);

    expect(cuadros).toBe(1);
    expect(timers).toBe(1);
    s.dispose();
  });

  it('no corre lo que quedó agendado al cerrar', async () => {
    const s = createFrameScheduler();
    let corridas = 0;

    s.raf(() => corridas++);
    s.later(() => corridas++, 5);
    s.dispose();

    await unCuadro();
    await dormir(30);
    expect(corridas).toBe(0);
  });

  it('ignora lo que se agenda DESPUÉS de cerrar', async () => {
    const s = createFrameScheduler();
    s.dispose();

    let corridas = 0;
    s.raf(() => corridas++);
    s.later(() => corridas++, 5);

    await unCuadro();
    await dormir(30);
    expect(corridas).toBe(0);
  });

  it('un timer que se reagenda a sí mismo se corta al cerrar', async () => {
    // El caso que rompió de verdad: las ondas del nacimiento encadenaban timers.
    const s = createFrameScheduler();
    let vueltas = 0;
    const encadenar = (): void => {
      vueltas++;
      s.later(encadenar, 5);
    };
    encadenar();

    await dormir(40);
    const alCerrar = vueltas;
    expect(alCerrar).toBeGreaterThan(1);

    s.dispose();
    await dormir(40);
    expect(vueltas).toBe(alCerrar);
  });

  it('`cerrado()` avisa a los loops largos que corten', () => {
    const s = createFrameScheduler();
    expect(s.cerrado()).toBeFalse();

    s.dispose();
    expect(s.cerrado()).toBeTrue();
  });

  it('cerrar dos veces no tira', () => {
    const s = createFrameScheduler();
    s.raf(() => undefined);
    s.later(() => undefined, 5);

    expect(() => {
      s.dispose();
      s.dispose();
    }).not.toThrow();
  });

  it('no acumula ids de lo que ya corrió', async () => {
    const s = createFrameScheduler();
    for (let i = 0; i < 5; i++) s.later(() => undefined, 1);
    await dormir(40);

    // Si el Set no se limpiara solo, cerrar cancelaría ids ya consumidos. No es observable
    // directamente, pero sí que cerrar después de que todo corrió siga siendo inocuo.
    expect(() => s.dispose()).not.toThrow();
  });
});
