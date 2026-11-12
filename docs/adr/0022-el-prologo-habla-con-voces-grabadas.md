# 0022. El prólogo habla con voces grabadas de Gemini; los blips quedan de respaldo

## Contexto

Desde [0002](./0002-capa-de-juego-cinematicas-partida-y-sonido.md) todo lo que suena se sintetiza,
sin archivos ni red, y los personajes hablan con blips. Damian quiere que se escuche a los
personajes de verdad, empezando por el prólogo (2026-11-12).

La app se publica en GitHub Pages, que es estático: no hay servidor donde guardar una clave de
Gemini, y una clave en el código del navegador quedaría a la vista de cualquiera. Una voz generada
en vivo necesitaría un backend propio (una función que reciba el texto, llame a Gemini con la clave
guardada del lado del servidor y devuelva el audio), con su costo por cada visita, su latencia y su
cupo compartido entre todos los que abren la app.

## Decisión

1. **Las voces se generan antes, no en vivo.** `scripts/voces.mjs` lee el guion del prólogo
   (`prologo-guion.ts`), le pide a Gemini TTS una voz por línea y deja los mp3 en
   `public/voces/prologo/`, que Pages sirve como cualquier archivo. La clave vive en la variable de
   entorno `GEMINI_API_KEY_2` de quien genera, nunca en el repositorio ni en el navegador.
2. **Español neutro**, elegido por Damian entre dos muestras (rioplatense y neutro). Gemini no tiene
   un neutro propio: son voces mexicanas con un estilo de doblaje. Cada personaje tiene su voz y su
   estilo en `scripts/voces.json`; Angie es la misma voz como `voz` y como `mascota`.
3. **La voz reemplaza a los blips** donde hay grabación. El grito de `todos` no tiene (una sola voz
   gritando sonaba a una persona, no a tres naves): sigue en blips.
4. **Los blips quedan de respaldo.** Una línea habla con blips si su grabación no llegó, no se pudo
   decodificar o no entra en su ventana (a velocidad ×2 la ventana se achica). Nada espera a que
   una grabación cargue.
5. **El reloj del prólogo mide la grabación.** El índice generado (`voces-del-prologo.ts`) guarda
   cuánto dura cada mp3, y `ventanaDe` usa eso si es más que el tiempo de lectura. La duración sale
   del archivo, no del navegador: el prólogo dura lo mismo con sonido o sin él, en cualquier máquina.

## Consecuencias

- La regla 1 de `docs/sonido.md` ("Todo se sintetiza") pasa a tener una excepción: las voces
  grabadas.
- El prólogo se alarga: una voz natural dice una frase más despacio de lo que se lee. Las líneas
  cortas son las que más crecen.
- Cambiar el texto de una línea, una voz o un estilo deja su mp3 viejo sin usar: hay que volver a
  correr `node scripts/voces.mjs --go`, que genera solo lo que cambió y borra lo que ya no se usa.
  Mientras tanto la línea habla con blips.
- Generar gasta crédito real y el cupo es de 100 pedidos cada 24 horas corridas por proyecto de
  Google Cloud.
- Las cinemáticas y las hojas del viaje siguen en blips; se pueden sumar con el mismo script.
