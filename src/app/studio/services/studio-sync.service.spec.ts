import { TestBed } from '@angular/core/testing';
import { StudioSyncService } from './studio-sync.service';
import { MARCADOR_GUION } from './guion-serializer';

interface VentanaConPicker {
  showOpenFilePicker?: () => Promise<FileSystemFileHandle[]>;
}

const ANTES = '/** Comentario de diseño que el Estudio no conoce. */\n\n';
const DESPUES = '\n\nexport function anclajesDe(): number {\n  return 42;\n}\n';
const ARCHIVO = `${ANTES}${MARCADOR_GUION}\n  { id: 'vieja', quien: 'cap', txt: 'Vieja.' },\n];${DESPUES}`;

/** Un handle de File System Access en memoria: guarda lo que se le escribe. */
function archivoFalso(contenido: string): { handle: FileSystemFileHandle; escrito: string[] } {
  const escrito: string[] = [];
  const handle = {
    getFile: () => Promise.resolve(new File([contenido], 'prologo-guion.ts')),
    createWritable: () =>
      Promise.resolve({
        write: (texto: string) => {
          escrito.push(texto);
          return Promise.resolve();
        },
        close: () => Promise.resolve(),
      }),
  } as unknown as FileSystemFileHandle;
  return { handle, escrito };
}

describe('StudioSyncService con un archivo vinculado', () => {
  const ventana = window as unknown as VentanaConPicker;
  let pickerOriginal: VentanaConPicker['showOpenFilePicker'];
  let fetchEspia: jasmine.Spy;
  let service: StudioSyncService;

  function vincular(contenido: string): { escrito: string[] } {
    const falso = archivoFalso(contenido);
    ventana.showOpenFilePicker = () => Promise.resolve([falso.handle]);
    return falso;
  }

  beforeEach(() => {
    localStorage.clear();
    pickerOriginal = ventana.showOpenFilePicker;
    // Si en la máquina corre el sync-server de verdad, un test no puede escribir el guion real.
    fetchEspia = spyOn(window, 'fetch').and.rejectWith(new TypeError('sin servidor'));
    TestBed.configureTestingModule({});
    service = TestBed.inject(StudioSyncService);
  });

  afterEach(() => {
    if (pickerOriginal) ventana.showOpenFilePicker = pickerOriginal;
    else delete ventana.showOpenFilePicker;
  });

  it('empalma el guion sobre el texto actual del archivo y preserva el resto', async () => {
    const { escrito } = vincular(ARCHIVO);

    expect(await service.vincularArchivoDirecto()).toBeTrue();

    expect(escrito.length).toBe(1);
    expect(escrito[0].startsWith(`${ANTES}${MARCADOR_GUION}\n`)).toBeTrue();
    expect(escrito[0].endsWith(`];${DESPUES}`)).toBeTrue();
    expect(escrito[0]).toContain("id: 'casa-volver'");
    expect(escrito[0]).not.toContain("id: 'vieja'");
    expect(service.saveStatus()).toBe('guardado');
  });

  it('un archivo sin el marcador no se escribe, queda en error y no se vincula', async () => {
    const { escrito } = vincular('export const OTRA_COSA = 1;\n');

    expect(await service.vincularArchivoDirecto()).toBeFalse();

    expect(escrito).toEqual([]);
    expect(service.saveStatus()).toBe('error');
    expect(service.errorMessage()).toMatch(/aparece 0 veces/);

    // Desvinculado: el guardado siguiente ya no intenta el mismo archivo, va al servidor.
    fetchEspia.calls.reset();
    await service.guardarEnDisco();
    expect(escrito).toEqual([]);
    expect(fetchEspia).toHaveBeenCalledOnceWith(
      'http://127.0.0.1:4201/api/save-guion',
      jasmine.objectContaining({ method: 'POST' }),
    );
  });
});
