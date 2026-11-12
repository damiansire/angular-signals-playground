# Sonido y música: requisitos

Lo que tiene que cumplir todo lo que suena en la app. Sirve para la revisión de sonido que vamos a
hacer más adelante: cada requisito dice dónde vive, así se puede comprobar de oído y en el código.

La plomería (un solo contexto, todo sintetizado, nada tira) la decidió el
[ADR 0002](./adr/0002-capa-de-juego-cinematicas-partida-y-sonido.md). Acá van los requisitos de
**qué** suena y **cómo se tiene que sentir**.

## Reglas para toda la app

1. **Todo se sintetiza, salvo las voces grabadas.** Sin archivos ni red (`libs/sonido.ts`). La
   excepción son las voces de Gemini (prólogo, cinemáticas, hojas del viaje y colina), que se bajan como mp3 ([`voces.md`](./voces.md),
   [ADR 0022](./adr/0022-el-prologo-habla-con-voces-grabadas.md)); sin ellas, la línea habla con blips.
2. **Nada depende de que suene.** Sin Web Audio, con el sonido apagado o si el audio se rompe, todo
   sigue igual y en silencio.
3. **Un solo interruptor.** Apagar el sonido en cualquier botón lo apaga en todos, y la preferencia
   se guarda (`signals-sonido`).
4. **Si se prende tarde, la música entra ahí.** Una música que estaba esperando sin sonido empieza
   cuando lo prenden. Un efecto que ya pasó no se dispara tarde.
5. **Pestaña oculta, silencio.** El audio se congela y vuelve con la pestaña.
6. **Silencio al acertar** (ADR 0002): resolver algo no suena a premio.
7. **Un mismo mundo, una misma tonalidad.** La colina, la despedida y el prólogo están en re menor:
   pasar de una escena a la otra no se oye como un corte.
8. **Nada sostenido que canse.** Un sonido de tensión (zumbido, estática) es para un momento corto.
   Donde quien mira se queda un rato (leyendo, esperando, jugando) va música, y la música no se
   repite idéntica de forma que se note.
9. **Entradas y salidas con fundido.** Ningún sonido sostenido entra ni se va de golpe: chasquea y
   sobresalta.

## Por momento

| Momento                     | Qué suena                                                                                | Requisitos                                                                                                          | Dónde                                        |
| --------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Pantalla de inicio (Tusi)   | Notas con el timbre del video original al trazar los círculos                            | No se rediseña (ADR 0002): solo cambió la plomería                                                                  | `intro-tusi.ts`                              |
| La colina, esperando        | Bucle de 16 s en re menor, cuatro acordes y una cajita que baja                          | Melancólica; más baja que la despedida; Angie la escucha en sus auriculares al compás                               | `musica-de-la-colina.ts`                     |
| La lamparita                | Radio: estática, chasquidos y el silbido del dial                                        | Va antes de hablar, para que el comienzo respire; cuando se apaga, la voz llega limpia                              | `ruido-de-radio.ts`                          |
| Las ondas del sol           | Un tono que cae por anillo                                                               | Con interferencia tiembla; sintonizada, sale limpia y más suave, debajo de la voz                                   | `ruido-de-radio.ts`                          |
| La despedida de Angie       | Fondo en re, un acorde por pensamiento y la cajita                                       | Una fase por pensamiento, sin horario (los pasa quien mira); al volverse luz queda sin resolver                     | `musica-del-presentimiento.ts`               |
| El prólogo                  | Zumbido de la anomalía que tira de la nave, tirones, salto, choque, voces y acorde final | El zumbido crece al acercarse la anomalía; cada golpe suena una sola vez                                            | `prologo-anomalia.ts`                        |
| El manual de a bordo        | Música para estudiar (2026-11-11)                                                        | Ver abajo                                                                                                           | `musica-del-manual.ts`                       |
| Las voces grabadas          | La voz de Gemini de cada personaje (2026-11-12, español neutro)                          | Reemplaza a los blips donde hay grabación; si no llegó o no entra en la ventana, blips; la línea dura lo que su voz | `libs/sonido.ts`, `voces-grabadas.ts`        |
| Las voces de los personajes | Blips con un timbre por personaje                                                        | Se distingue quién habla sin leer; la misma frase suena siempre igual; nunca sigue hablando cuando el texto se fue  | `libs/sonido.ts` (`PERFILES`, `planDeBlips`) |
| Las cinemáticas             | Toque, título, beats, transmisión y cierre                                               | El título en la menor, como la intro                                                                                | `cinematica.component.ts`, `libs/sonido.ts`  |

## El manual de a bordo

Pedido de Damian (2026-11-11): mientras se lee el manual, seguir con el sonido de la atracción "es
cansador"; tiene que haber otra música, "compatible con el estudio".

- [x] Con el manual abierto, el zumbido de la anomalía se va con un fundido (1,2 s) y vuelve igual
      al cerrarlo.
- [x] Suena una música propia mientras el manual está abierto: en el prólogo y también suelto,
      desde la bitácora. Se apaga con un fundido al dejar la hoja.
- [x] Es música para estudiar: lenta y pareja (acordes de 6 s), sin percusión ni golpes, sin una
      melodía que se pegue.
- [x] Cambia de ánimo sin cambiar de mundo: fa mayor, vecina del re menor del resto.
- [x] No cansa al repetirse: las notas sueltas cambian en cada vuelta (a veces no hay ninguna).
- [x] Más baja que la música de la colina, en cada voz.
- [ ] **A revisar de oído:** que se pueda leer un rato largo sin que moleste, y que el paso del
      zumbido a la música (y de vuelta) se sienta natural.
- [x] Es solo del manual de a bordo (decidido con Damian el 2026-11-11): las hojas de las etapas
      del viaje y el árbol de Signal Space no la llevan.

## Para la revisión

Al revisar el sonido, por cada momento de la tabla: escucharlo entero con sonido, apagarlo y
prenderlo a mitad de camino, ocultar la pestaña y volver, y quedarse en él más tiempo del que
dura su bucle. Lo que falle se anota acá, con fecha, junto al requisito que rompe.
