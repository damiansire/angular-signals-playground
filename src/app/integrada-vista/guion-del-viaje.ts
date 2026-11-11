import type { QuienDelViaje } from '../components-draw/tripulacion/tripulacion.component';

/** Una línea de la tripulación en una página del viaje. Sigue las reglas del guion (`REGLAS_GUION`). */
export interface LineaDelViaje {
  readonly quien: QuienDelViaje;
  readonly txt: string;
}

/**
 * Lo que dice la tripulación en cada página del viaje: al llegar, qué encontraron (el problema de la
 * pantalla, dicho en su nave y en su apuro), y al resolver el desafío, qué entendieron. Así cada
 * ejercicio es un momento de la historia y no una pantalla suelta, y pasar de uno al otro se siente
 * como seguir viaje. Las claves son los ids de página: capítulo y sub-nivel (`paginasDeEtapa`).
 */
export const GUION_DEL_VIAJE: Readonly<
  Record<string, { readonly llegada: LineaDelViaje; readonly resuelta: LineaDelViaje }>
> = {
  // 1 · La caja que avisa
  '1/1': {
    llegada: { quien: 'naveB', txt: 'Una caja común:\nguarda un número y calla.' },
    resuelta: { quien: 'cap', txt: 'Con signal, la caja ya avisa.' },
  },
  '1/2': {
    llegada: { quien: 'naveA', txt: 'Esta caja avisa cuando cambia.' },
    resuelta: { quien: 'naveB', txt: '¡Me avisó!\nY no le pregunté nada.' },
  },
  '1/3': {
    llegada: { quien: 'cap', txt: '¿Qué cosas entran en la caja?' },
    resuelta: { quien: 'naveA', txt: 'Número, texto o lista.\nTodas avisan igual.' },
  },
  '1/4': {
    llegada: { quien: 'cap', txt: 'Nunca la leí.\n¿Cómo se lee una caja?' },
    resuelta: { quien: 'naveB', txt: 'Con paréntesis.\nAsí sabe quién la lee.' },
  },
  '1/5': {
    llegada: { quien: 'naveA', txt: 'Esta caja la puedo escribir yo.' },
    resuelta: { quien: 'cap', txt: 'Con set cambia,\ny todos se enteran.' },
  },
  '1/6': {
    llegada: { quien: 'naveB', txt: '¿Y si sumo a lo que había?' },
    resuelta: { quien: 'naveA', txt: 'update parte del valor de antes.' },
  },
  '1/7': {
    llegada: { quien: 'cap', txt: 'Que la lean todos.\nQue la escriba uno.' },
    resuelta: { quien: 'naveB', txt: 'asReadonly: se mira, no se toca.' },
  },
  // 2 · La molécula punteada
  '2/1': {
    llegada: { quien: 'naveA', txt: 'Mi suma depende de otras cajas.' },
    resuelta: { quien: 'cap', txt: 'Cambió una caja.\nLa suma se rehízo sola.' },
  },
  '2/2': {
    llegada: { quien: 'naveB', txt: 'Según el camino,\nlee unas cajas u otras.' },
    resuelta: { quien: 'naveA', txt: 'Escucha solo lo que leyó\nla última vez.' },
  },
  '2/3': {
    llegada: { quien: 'cap', txt: '¿Calcula aunque nadie la mire?' },
    resuelta: { quien: 'naveB', txt: 'No. Calcula al leerla,\ny una sola vez.' },
  },
  // 3 · La baliza
  '3/1': {
    llegada: { quien: 'naveB', txt: 'Puse una baliza:\nsuena cuando cambia la caja.' },
    resuelta: { quien: 'naveA', txt: 'Sonó sola.\nSolo por lo que leyó.' },
  },
  '3/2': {
    llegada: { quien: 'cap', txt: 'Esta baliza suena cada tanto.' },
    resuelta: { quien: 'naveB', txt: 'Al irnos, se apaga con nosotros.' },
  },
  '3/3': {
    llegada: { quien: 'naveA', txt: 'Salir a hacer algo deja rastro.' },
    resuelta: { quien: 'cap', txt: 'onCleanup barre\nantes de repetir.' },
  },
  // 4 · Las coordenadas gemelas
  '4/1': {
    llegada: { quien: 'naveB', txt: 'Mismas coordenadas.\n¿Es la misma caja?' },
    resuelta: { quien: 'naveA', txt: 'Mismo valor, nadie se entera.\nOtro objeto, sí.' },
  },
  '4/2': {
    llegada: { quien: 'cap', txt: 'Que compare como yo quiero.' },
    resuelta: { quien: 'naveB', txt: 'Con equal,\nel criterio es nuestro.' },
  },
  // 5 · El mapa de rutas
  '5/1': {
    llegada: { quien: 'naveA', txt: 'El mapa propone la primera ruta.' },
    resuelta: { quien: 'cap', txt: 'Cambió la fuente:\nla ruta volvió a empezar.' },
  },
  '5/2': {
    llegada: { quien: 'naveB', txt: 'Si mi ruta sigue existiendo,\nla guardo.' },
    resuelta: { quien: 'naveA', txt: 'Si sigue valiendo,\nse queda la mía.' },
  },
  // 6 · La transmisión
  '6/1': {
    llegada: { quien: 'cap', txt: 'Pregunto afuera\ny espero la respuesta.' },
    resuelta: { quien: 'naveB', txt: 'Cargando, error o valor:\ntodo avisa.' },
  },
  '6/2': {
    llegada: { quien: 'naveA', txt: 'La respuesta llega por un stream.' },
    resuelta: { quien: 'cap', txt: 'Un stream también\nentra en la caja.' },
  },
  '6/3': {
    llegada: { quien: 'naveB', txt: 'Basta la dirección para preguntar.' },
    resuelta: { quien: 'naveA', txt: 'Cambió la dirección:\npreguntó de nuevo solo.' },
  },
  // 7 · El repetidor
  '7/1': {
    llegada: { quien: 'cap', txt: 'Armemos un repetidor\npara la exploradora.' },
    resuelta: { quien: 'naveB', txt: 'Entra por input,\nsale por output.' },
  },
  '7/2': {
    llegada: { quien: 'naveA', txt: 'Que el repetidor hable\npara los dos lados.' },
    resuelta: { quien: 'cap', txt: 'model: lo cambio yo,\no lo cambia ella.' },
  },
  '7/3': {
    llegada: { quien: 'naveB', txt: 'Sin frecuencia\nno tendría que encender.' },
    resuelta: { quien: 'naveA', txt: 'required lo exige.\ntransform lo traduce.' },
  },
  '7/4': {
    llegada: { quien: 'cap', txt: 'Cada campo del formulario\nes una caja.' },
    resuelta: { quien: 'naveB', txt: 'Escribo, y la validez\nse entera sola.' },
  },
  // 8 · Los pipes se traducen
  '8/1': {
    llegada: { quien: 'naveA', txt: 'Quiero ver la pieza de adentro.' },
    resuelta: { quien: 'cap', txt: 'viewChild la encuentra\ny avisa si cambia.' },
  },
  '8/2': {
    llegada: { quien: 'naveB', txt: 'Los pipes viejos\nhablan otro idioma.' },
    resuelta: { quien: 'naveA', txt: 'toSignal y toObservable\ntraducen de ida y vuelta.' },
  },
  '8/3': {
    llegada: { quien: 'cap', txt: 'Ahora son muchas piezas,\ny van y vienen.' },
    resuelta: { quien: 'naveB', txt: 'La lista se actualiza sola.' },
  },
  '8/4': {
    llegada: { quien: 'naveA', txt: 'Lo que nos mandan de afuera\ntambién cuenta.' },
    resuelta: { quien: 'cap', txt: 'contentChild mira\nlo que pusieron adentro.' },
  },
  // 9 · La antena
  '9/1': {
    llegada: { quien: 'naveB', txt: 'Necesito medir la antena\nya dibujada.' },
    resuelta: { quien: 'naveA', txt: 'Después de pintar, mide.\nNo antes.' },
  },
  '9/2': {
    llegada: { quien: 'cap', txt: 'Si la antena cambia,\napago la vieja.' },
    resuelta: { quien: 'naveB', txt: 'onCleanup corta lo anterior\nantes de seguir.' },
  },
  // 10 · La tormenta
  '10/1': {
    llegada: { quien: 'naveA', txt: 'Con la tormenta\nllegan mil avisos.' },
    resuelta: { quien: 'cap', txt: 'Espero a que pare,\ny leo uno solo.' },
  },
  '10/2': {
    llegada: { quien: 'naveB', txt: 'A mano: espero y cancelo.' },
    resuelta: { quien: 'naveA', txt: 'Un timer por cambio.\nEl viejo se borra.' },
  },
  '10/3': {
    llegada: { quien: 'cap', txt: 'Angular ya trae\nsu propio paraguas.' },
    resuelta: { quien: 'naveB', txt: 'debounced calma la caja,\nsin pipes.' },
  },
  // 11 · Quien lee, avisa
  '11/1': {
    llegada: { quien: 'naveA', txt: 'Sin Zone.js,\n¿quién revisa la pantalla?' },
    resuelta: { quien: 'cap', txt: 'Quien lee, avisa.\nNadie revisa de más.' },
  },
};

/** Las líneas de una página; `null` si la página no tiene guion (una pantalla nueva sin escribir). */
export function guionDe(
  id: string,
): { readonly llegada: LineaDelViaje; readonly resuelta: LineaDelViaje } | null {
  return GUION_DEL_VIAJE[id] ?? null;
}

/**
 * Las palabras de una línea, para que entren de a una como en las cinemáticas. `corte` marca la
 * primera de un renglón nuevo: el salto lo decide el guion, no el ancho de la caja.
 */
export function palabrasDeLinea(txt: string): { readonly txt: string; readonly corte: boolean }[] {
  return txt.split('\n').flatMap((renglon, r) =>
    renglon
      .split(/\s+/)
      .filter(Boolean)
      .map((palabra, k) => ({ txt: palabra, corte: r > 0 && k === 0 })),
  );
}
