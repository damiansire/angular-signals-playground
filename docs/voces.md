# Voces de Gemini

El prólogo habla con voces grabadas de Gemini TTS; el resto de la app sigue con blips. Por qué se
generan antes y no en vivo: [ADR 0022](./adr/0022-el-prologo-habla-con-voces-grabadas.md).

## Qué hay

| Archivo                                        | Qué es                                                           |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| `scripts/voces.json`                           | Modelo, acento elegido, voz y estilo de cada personaje           |
| `scripts/voces.mjs`                            | El generador                                                     |
| `public/voces/prologo/<id>.<hash>.mp3`         | Una voz por línea del prólogo. El hash cambia si cambia el texto |
| `src/app/integrada-vista/voces-del-prologo.ts` | El índice que lee la app (id → archivo y duración). Generado     |

El texto sale de `src/app/integrada-vista/prologo-guion.ts`: no se copia a mano. Si una palabra se
lee mal, `pronunciar` en `voces.json` le da a Gemini otra forma de escribirla para esa línea, sin
tocar lo que se ve en pantalla.

## Cómo se usa

Hace falta la clave en `GEMINI_API_KEY_2` (variable de entorno; en Windows el script también la
busca en las variables de usuario) y un ffmpeg en `FFMPEG`.

```bash
node scripts/voces.mjs               # qué falta y cuántos pedidos gastaría; no gasta nada
node scripts/voces.mjs --go          # genera lo que falta, reescribe el índice y borra lo viejo
node scripts/voces.mjs --muestras    # las líneas de "muestras" con cada acento, en pruebas/voces/
node scripts/voces.mjs --indice      # solo reescribe el índice con los mp3 que ya están
```

- **Gasta crédito real.** El cupo del modelo es de 100 pedidos cada 24 horas corridas por proyecto
  de Google Cloud (se va liberando de a poco, no de golpe) y 10 por minuto: el script espera 7 s
  entre pedidos y se detiene solo con el primer 429. Lo generado no se pierde: la próxima corrida
  sigue desde lo que falta.
- Cambiar una voz o un estilo en `voces.json` regenera todas las líneas de ese personaje.
- Después de generar, correr `npm run format:check` (el script ya formatea el índice) y probar el
  prólogo con sonido.

## Cómo suena en la app

`sonido().precargar()` baja los mp3 al montar el prólogo (si el sonido está apagado, recién cuando
lo prenden) y `sonido().hablar(quien, texto, ventana, archivo)` usa la grabación si ya está lista y
entra en la ventana; si no, los blips de ese personaje. El reloj del prólogo usa la duración del
índice, así la línea queda en pantalla mientras se dice.

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
