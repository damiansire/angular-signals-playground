# Voces de Gemini

El prólogo, las cinemáticas, las hojas del viaje y la charla de la colina hablan con voces grabadas
de Gemini TTS. Por qué se generan antes y no en vivo:
[ADR 0022](./adr/0022-el-prologo-habla-con-voces-grabadas.md); cómo se sumó el resto de la app y
por qué hay varias claves: [ADR 0023](./adr/0023-toda-la-app-habla-con-voces-grabadas.md).

## Qué hay

| Archivo                                     | Qué es                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| `scripts/voces.json`                        | Modelo, claves, grupos, acento elegido, voz y estilo de cada personaje   |
| `scripts/voces.mjs`                         | El generador                                                             |
| `public/voces/<grupo>/<id>.<hash>.mp3`      | Una voz por línea. El hash cambia si cambia el texto, la voz o el estilo |
| `src/app/integrada-vista/voces-grabadas.ts` | El índice que lee la app (id → archivo y duración). Generado             |

Los grupos y de dónde sale su texto (no se copia a mano):

| Grupo     | Guion                                                      | Id de cada línea                     |
| --------- | ---------------------------------------------------------- | ------------------------------------ |
| `prologo` | `src/app/integrada-vista/prologo-guion.ts`                 | el `id` de la línea                  |
| `cine`    | `src/app/integrada-vista/cinematicas/cinematicas-datos.ts` | el `id` de la línea                  |
| `viaje`   | `src/app/integrada-vista/guion-del-viaje.ts`               | `idDeLineaDelViaje(pagina, momento)` |

Un grupo puede sumarle un estilo a todas sus líneas (`grupos` en `voces.json`): las cinemáticas y el
viaje dicen en inglés las palabras de programación. Si una palabra se lee mal, `pronunciar` le da a
Gemini otra forma de escribirla para esa línea, sin tocar lo que se ve en pantalla.

## Cómo se usa

Hacen falta las claves de `claves` en `voces.json` (variables de entorno; en Windows el script
también las busca en las variables de usuario) y un ffmpeg en `FFMPEG`. Cada clave es de un
proyecto de Google Cloud distinto, con su propio cupo:

| Variable           | Proyecto                     | Nombre de la clave            |
| ------------------ | ---------------------------- | ----------------------------- |
| `GEMINI_API_KEY_2` | `angular-signals-playground` | la del proyecto original      |
| `GEMINI_API_KEY_3` | `angular-signals-voces-2`    | `angular-signals-voces-2-tts` |
| `GEMINI_API_KEY_4` | `angular-signals-voces-3`    | `angular-signals-voces-3-tts` |

Las claves nunca se imprimen ni se escriben en un archivo.

```bash
node scripts/voces.mjs               # qué falta y cuántos pedidos gastaría; no gasta nada
node scripts/voces.mjs --go          # genera lo que falta, reescribe el índice y borra lo viejo
node scripts/voces.mjs --muestras    # las líneas de "muestras" con cada acento, en pruebas/voces/
node scripts/voces.mjs --indice      # solo reescribe el índice con los mp3 que ya están
```

- **Gasta crédito real.** El cupo del modelo es de 100 pedidos cada 24 horas corridas por proyecto
  de Google Cloud (se va liberando de a poco, no de golpe) y 10 por minuto. El script corre un
  trabajador por clave sobre la misma cola, cada uno espera 7 s entre pedidos, y el que recibe un
  429 se detiene y deja seguir a los demás. Lo generado no se pierde: la próxima corrida sigue
  desde lo que falta.
- Cambiar una voz o un estilo en `voces.json` regenera todas las líneas de ese personaje.
- Después de generar, correr `npm run format:check` (el script ya formatea el índice) y probar con
  sonido lo que cambió.

## Cómo suena en la app

`sonido().precargar()` baja los mp3 antes de que hagan falta (si el sonido está apagado, recién
cuando lo prenden): el prólogo y cada cinemática al montarse, el viaje al llegar a una hoja y la
colina mientras suena la radio.

- **Prólogo, cinemáticas y colina:** `sonido().hablar(quien, texto, ventana, archivo)` usa la
  grabación si ya está lista y entra en la ventana; si no, los blips de ese personaje. El reloj
  (`armarReloj`) usa la duración del índice, así la línea queda en pantalla mientras se dice. La
  colina dice la charla con el sol con las voces de `dentro-caotico` y `voz-supongo` del prólogo.
- **Hojas del viaje:** `sonido().decirGrabada(archivo)` arranca la voz cuando aparece la línea
  (llegada o resuelta) y la corta cuando llega otra o la hoja se va. No hay blips de respaldo: sin
  voz, la línea es muda como antes.

## Voces

| Personaje   | En el guion      | Voz (neutro)          |
| ----------- | ---------------- | --------------------- |
| Capitán     | `cap`            | `es-419-podcaster-3`  |
| Nave A      | `naveA`          | `es-419-assistant-1`  |
| Nave B      | `naveB`          | `es-419-assistant-9`  |
| Exploradora | `nave4`          | `es-419-csagent-7`    |
| Angie       | `voz`, `mascota` | `es-419-commercial-6` |

La lista de voces de un idioma (no gasta cupo):
`GET https://generativelanguage.googleapis.com/v1beta/voices?language_code=es-419&page_size=200`
con el encabezado `x-goog-api-key`. En `es-419` hay voces argentinas y mexicanas; en `es-ES`,
castellanas.
