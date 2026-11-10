import { VIGENCIA_DEL_VUELO_MS, VueloDeLaNave } from './vuelo-de-la-nave';

describe('VueloDeLaNave', () => {
  let vuelo: VueloDeLaNave;

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 10, 11));
    vuelo = new VueloDeLaNave();
  });
  afterEach(() => jasmine.clock().uninstall());

  it('sin despegue, la nave de la página nueva ya está en su lugar', () => {
    expect(vuelo.llegaVolando()).toBeFalse();
  });

  it('despega la escena anotada y la página siguiente la recibe una sola vez', async () => {
    const despegue = jasmine.createSpy('despegue').and.resolveTo();
    vuelo.alDespegar(despegue);
    await vuelo.despegar();
    expect(despegue).toHaveBeenCalledTimes(1);
    expect(vuelo.llegaVolando()).toBeTrue();
    expect(vuelo.llegaVolando()).toBeFalse();
  });

  it('una página que tarda demasiado en montarse ya no la espera', async () => {
    await vuelo.despegar();
    jasmine.clock().tick(VIGENCIA_DEL_VUELO_MS + 1);
    expect(vuelo.llegaVolando()).toBeFalse();
  });

  it('una escena que se desmonta suelta su despegue, pero no el de la que llegó después', async () => {
    const vieja = jasmine.createSpy('vieja').and.resolveTo();
    const nueva = jasmine.createSpy('nueva').and.resolveTo();
    const soltarVieja = vuelo.alDespegar(vieja);
    vuelo.alDespegar(nueva);
    soltarVieja();
    await vuelo.despegar();
    expect(vieja).not.toHaveBeenCalled();
    expect(nueva).toHaveBeenCalledTimes(1);
  });
});
