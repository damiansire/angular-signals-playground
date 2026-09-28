import { TestBed } from '@angular/core/testing';
import { StudioStateService } from './studio-state.service';
import { GUION } from '../../integrada-vista/prologo-guion';

describe('StudioStateService', () => {
  let service: StudioStateService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [StudioStateService],
    });
    service = TestBed.inject(StudioStateService);
  });

  it('debe inicializarse con el guion por defecto', () => {
    expect(service.guion().length).toBe(GUION.length);
    expect(service.canUndo()).toBeFalse();
    expect(service.canRedo()).toBeFalse();
  });

  it('debe calcular reactivamente el reloj y anclajes al modificar el guion', () => {
    const relojInicial = service.reloj();
    const duracionInicial = service.duracionTotal();
    expect(relojInicial.length).toBe(GUION.length);
    expect(duracionInicial).toBeGreaterThan(10000);

    // Modificar una línea agregando pausa
    service.actualizarLinea('casa-volver', { hueco: 2000 });
    const relojModificado = service.reloj();
    const lineaModificada = relojModificado.find((l) => l.id === 'casa-volver');

    expect(lineaModificada?.hueco).toBe(2000);
    expect(service.canUndo()).toBeTrue();
  });

  it('debe permitir Deshacer (Undo) y Rehacer (Redo) correctamente', () => {
    const textoOriginal = service.guion()[0].txt;

    // Modificación 1
    service.actualizarLinea(service.guion()[0].id, { txt: 'Texto editado 1' });
    expect(service.guion()[0].txt).toBe('Texto editado 1');
    expect(service.canUndo()).toBeTrue();
    expect(service.canRedo()).toBeFalse();

    // Deshacer
    service.undo();
    expect(service.guion()[0].txt).toBe(textoOriginal);
    expect(service.canUndo()).toBeFalse();
    expect(service.canRedo()).toBeTrue();

    // Rehacer
    service.redo();
    expect(service.guion()[0].txt).toBe('Texto editado 1');
    expect(service.canUndo()).toBeTrue();
    expect(service.canRedo()).toBeFalse();
  });

  it('debe agregar y eliminar líneas correctamente actualizando el historial', () => {
    const totalInicial = service.guion().length;

    service.agregarLinea('casa-volver');
    expect(service.guion().length).toBe(totalInicial + 1);
    expect(service.canUndo()).toBeTrue();

    const idCreado = service.selectedLineId();
    expect(idCreado).toBeTruthy();

    if (idCreado) {
      service.eliminarLinea(idCreado);
      expect(service.guion().length).toBe(totalInicial);
    }
  });

  it('debe controlar el tiempo seek y stepFrame con clamp a los límites', () => {
    service.seek(5000);
    expect(service.tActual()).toBe(5000);

    service.stepFrame(-2000);
    expect(service.tActual()).toBe(3000);

    service.stepFrame(-10000);
    expect(service.tActual()).toBe(0);

    service.seek(999999);
    expect(service.tActual()).toBe(service.duracionTotal());
  });
});
