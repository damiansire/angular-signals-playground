import {
  alcanceDelGolpe,
  asentar,
  avanzarMuelle,
  crearMotor,
  crearMuelle,
  enReposo,
  tironElastico,
} from './muelle';

function simular(m: ReturnType<typeof crearMuelle>, segundos: number, dt = 1 / 60): void {
  for (let t = 0; t < segundos; t += dt) avanzarMuelle(m, dt);
}

describe('muelle', () => {
  it('un toque suma velocidad y el muelle vuelve solo a su destino', () => {
    const m = crearMuelle(0, 180, 16);
    m.v += 300;
    avanzarMuelle(m, 1 / 60);
    expect(m.x).toBeGreaterThan(0);
    simular(m, 4);
    expect(enReposo(m)).toBeTrue();
    expect(Math.abs(m.x)).toBeLessThan(0.01);
  });

  it('veinte toques seguidos se acumulan y tampoco lo dejan a medio camino', () => {
    const m = crearMuelle(0, 260, 11);
    for (let i = 0; i < 20; i++) {
      m.v += i % 2 ? -200 : 300;
      simular(m, 0.05);
    }
    simular(m, 6);
    expect(enReposo(m)).toBeTrue();
  });

  it('con poca amortiguación oscila: cruza el destino antes de asentarse', () => {
    const m = crearMuelle(0, 260, 8);
    m.v = 100;
    let cruces = 0;
    let signo = 1;
    for (let t = 0; t < 2; t += 1 / 60) {
      avanzarMuelle(m, 1 / 60);
      if (Math.abs(m.x) > 0.01 && Math.sign(m.x) !== signo) {
        cruces++;
        signo = Math.sign(m.x);
      }
    }
    expect(cruces).toBeGreaterThan(2);
  });

  it('un cuadro larguísimo no le mete energía al sistema', () => {
    const m = crearMuelle(10, 260, 11);
    avanzarMuelle(m, 5);
    expect(Math.abs(m.x)).toBeLessThanOrEqual(10);
    expect(Number.isFinite(m.v)).toBeTrue();
  });

  it('asentar lo deja exacto en el destino', () => {
    const m = crearMuelle(0);
    m.destino = 5;
    m.v = 3;
    asentar(m);
    expect(m.x).toBe(5);
    expect(m.v).toBe(0);
  });
});

describe('alcanceDelGolpe', () => {
  it('cae con la distancia pero lo lejano también se entera', () => {
    expect(alcanceDelGolpe(0)).toBe(1);
    expect(alcanceDelGolpe(450)).toBeCloseTo(0.5);
    expect(alcanceDelGolpe(99999)).toBe(0.12);
  });
});

describe('tironElastico', () => {
  it('cuesta cada vez más y nunca pasa del tope', () => {
    expect(tironElastico(0)).toBe(0);
    expect(tironElastico(90)).toBeCloseTo(45);
    expect(tironElastico(100000)).toBeLessThan(90);
    expect(tironElastico(-90)).toBeCloseTo(-45);
  });
});

describe('crearMotor', () => {
  function motorManual() {
    let pendiente: ((ts: number) => void) | null = null;
    const motor = crearMotor((fn) => {
      pendiente = fn;
      return 1;
    });
    const cuadro = (ts: number) => {
      const fn = pendiente;
      pendiente = null;
      fn?.(ts);
    };
    return { motor, cuadro };
  }

  it('sin nada que mover no agenda ningún cuadro', () => {
    const { motor } = motorManual();
    motor.despertar();
    expect(motor.despierto()).toBeFalse();
  });

  it('agenda mientras algo se mueva y se duerme cuando todo quedó quieto', () => {
    const { motor, cuadro } = motorManual();
    let restantes = 2;
    motor.agregar(() => --restantes > 0);
    motor.despertar();
    expect(motor.despierto()).toBeTrue();
    cuadro(16);
    expect(motor.despierto()).toBeTrue();
    cuadro(32);
    expect(motor.despierto()).toBeFalse();
  });

  it('un cuerpo que se saca ya no corre', () => {
    const { motor, cuadro } = motorManual();
    let llamadas = 0;
    const sacar = motor.agregar(() => {
      llamadas++;
      return true;
    });
    motor.despertar();
    sacar();
    cuadro(16);
    expect(llamadas).toBe(0);
    expect(motor.despierto()).toBeFalse();
  });
});
