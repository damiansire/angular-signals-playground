/**
 * El tiempo en los specs de la vista integrada, sin atarse al reloj real de la máquina. Una espera
 * fija (`setTimeout(250)`) alcanza con la máquina tranquila y se queda corta con la CPU tomada, y
 * un espía global de `requestAnimationFrame` contado durante esa espera le anota a uno los cuadros
 * que pide cualquier otro código de la página de Karma. Hay dos salidas, según quién da los cuadros.
 */

const unCuadro = (): Promise<void> => new Promise((r) => requestAnimationFrame(() => r()));

/**
 * Los da el navegador: se espera a que pase lo que el test va a mirar (una escena que cargó, un
 * aviso que llegó), sin dormir de más ni de menos. El tope solo corta si nunca pasa, y entonces
 * falla el `expect` que sigue. No se combina con `cuadrosFalsos`, que no da cuadros solo.
 */
export async function hasta(condicion: () => boolean, tope = 3000): Promise<void> {
  const inicio = performance.now();
  while (!condicion() && performance.now() - inicio < tope) await unCuadro();
}

/**
 * Los da el test: `requestAnimationFrame` pasa a ser una cola que se avanza a mano. Es síncrono,
 * así que entre un `avanzar` y el `expect` que lo sigue no corre nada ajeno ni pasa tiempo real.
 * Es un `spyOn`: Jasmine lo restaura al terminar el spec.
 */
export function cuadrosFalsos() {
  const pedidos = new Map<number, FrameRequestCallback>();
  let ultimoId = 0;
  let ahora = 0;
  spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
    pedidos.set(++ultimoId, cb);
    return ultimoId;
  });
  spyOn(window, 'cancelAnimationFrame').and.callFake((id: number) => {
    pedidos.delete(id);
  });
  return {
    /** Cuadros pedidos que todavía no corrieron. Cero es un loop dormido. */
    pendientes: () => pedidos.size,
    /** Lo que se pide durante un cuadro corre en el siguiente, como en el navegador. */
    avanzar(n: number): void {
      for (let i = 0; i < n; i++) {
        ahora += 16;
        const tanda = [...pedidos.values()];
        pedidos.clear();
        tanda.forEach((cb) => cb(ahora));
      }
    },
  };
}
