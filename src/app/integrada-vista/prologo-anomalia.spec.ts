import { initPrologoAnomalia } from './prologo-anomalia';

/**
 * El prólogo es el paso intermedio entre elegir el clima y que arranque la construcción de Tusi.
 * `alTerminar` es lo único que destraba la landing, así que todo camino de salida tiene que
 * llamarlo, y exactamente una vez.
 *
 * Antes acá solo estaba cubierto el camino DEGRADADO (el prólogo que no puede ni arrancar). Que
 * alguna vez TERMINE y ceda la posta no lo verificaba nadie, en 1.400 líneas de cinemática.
 */
describe('initPrologoAnomalia', () => {
  /** Markup mínimo que el prólogo exige para inicializar. Si falta uno solo, degrada. */
  function hostCompleto(): HTMLElement {
    const host = document.createElement('div');
    host.innerHTML = `
      <div class="prologo">
        <div class="prologo__stage">
          <canvas class="prologo__canvas" width="640" height="360"></canvas>
          <div class="prologo__mascot"></div>
        </div>
        <div class="prologo__hud">
          <button class="prologo__pause" type="button"></button>
          <button class="prologo__voice" type="button"></button>
          <button class="prologo__sound" type="button"></button>
          <button class="prologo__speed" type="button"></button>
          <button class="prologo__full" type="button"></button>
          <button class="prologo__skip" type="button"></button>
        </div>
      </div>`;
    document.body.appendChild(host);
    return host;
  }

  const cerrar: (() => void)[] = [];
  const hosts: HTMLElement[] = [];

  afterEach(() => {
    cerrar.splice(0).forEach((fn) => fn());
    hosts.splice(0).forEach((h) => h.remove());
  });

  function arrancar() {
    const host = hostCompleto();
    hosts.push(host);
    let terminado = 0;
    const dispose = initPrologoAnomalia(host, {
      alTerminar: () => (terminado += 1),
      conSonido: false,
    });
    cerrar.push(dispose);
    return {
      host,
      skip: host.querySelector<HTMLButtonElement>('.prologo__skip')!,
      raiz: host.querySelector<HTMLElement>('.prologo')!,
      veces: () => terminado,
    };
  }

  it('con su markup completo NO cede la posta de entrada: el prólogo corre', () => {
    const p = arrancar();
    expect(p.veces()).toBe(0);
    expect(p.raiz.hidden).toBeFalse();
  });

  it('saltar cede la posta exactamente una vez y oculta el prólogo', () => {
    const p = arrancar();

    p.skip.click();

    expect(p.veces()).toBe(1);
    expect(p.raiz.hidden).toBeTrue();
  });

  it('saltar dos veces sigue cediendo la posta una sola vez', () => {
    const p = arrancar();

    p.skip.click();
    p.skip.click();
    p.skip.click();

    expect(p.veces()).toBe(1);
  });

  it('cerrar después de haber salteado no vuelve a llamar ni tira', () => {
    const p = arrancar();
    p.skip.click();

    expect(() => cerrar.splice(0).forEach((fn) => fn())).not.toThrow();
    expect(p.veces()).toBe(1);
  });

  it('cerrar sin haber salteado tampoco tira', () => {
    arrancar();
    expect(() => cerrar.splice(0).forEach((fn) => fn())).not.toThrow();
  });

  it('cede la posta aunque no encuentre su markup: la landing no puede quedar trabada', () => {
    const host = document.createElement('div');
    let terminado = 0;

    const dispose = initPrologoAnomalia(host, { alTerminar: () => (terminado += 1) });

    expect(terminado).toBe(1);
    expect(typeof dispose).toBe('function');
    expect(() => dispose()).not.toThrow();
  });
});
