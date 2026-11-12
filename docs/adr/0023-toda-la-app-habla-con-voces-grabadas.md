# 0023. Las cinemáticas, las hojas del viaje y la colina también hablan; una clave por proyecto

## Contexto

[0022](./0022-el-prologo-habla-con-voces-grabadas.md) le dio voz al prólogo y dejó las cinemáticas
y las hojas del viaje en blips. Damian pidió terminar las voces de toda la app (2026-11-12): son
174 líneas más (106 de las cinemáticas y 68 de las hojas del viaje).

El cupo del modelo es de 100 pedidos cada 24 horas corridas por proyecto de Google Cloud, y el
proyecto de 0022 ya había gastado 76 ese día. Damian creó dos proyectos más en su cuenta de
facturación (que admite hasta cinco), cada uno con su clave: `angular-signals-voces-2` y
`angular-signals-voces-3`.

## Decisión

1. **Un solo generador para toda la app, por grupos.** `scripts/voces.mjs` lee los tres guiones
   (`prologo-guion.ts`, `cinematicas-datos.ts` y `guion-del-viaje.ts`) y deja cada mp3 en
   `public/voces/<grupo>/`. El índice pasa a llamarse `voces-grabadas.ts` y tiene las tres; los ids
   son únicos en toda la app (los de las hojas del viaje salen de `idDeLineaDelViaje`).
2. **Las palabras de programación se dicen en inglés** en las cinemáticas y en el viaje (`signal`,
   `computed`, `effect`): un estilo propio de esos grupos en `voces.json`. El prólogo no lo tiene y
   sus voces no cambian.
3. **Varias claves, una por proyecto.** `claves` en `voces.json` dice cuáles; el script corre un
   trabajador por clave sobre la misma cola, cada uno a su ritmo de 10 por minuto, y cuando uno se
   queda sin cupo siguen los demás. Cada clave lleva el nombre de su proyecto y su uso
   (`angular-signals-voces-2-tts`) y vive solo en las variables de entorno de quien genera.
4. **Las cinemáticas miden la grabación**, como el prólogo: usan el mismo reloj (`armarReloj`), así
   que la ventana de cada línea dura lo que su voz si es más larga que el tiempo de lectura.
5. **Las hojas del viaje no tienen reloj.** Hasta ahora su línea era muda; ahora su voz arranca
   cuando la línea aparece y se corta cuando llega otra o la hoja se va (`sonido().decirGrabada`).
   Si la voz todavía no bajó, suena apenas baja, salvo que la línea ya se haya ido.
6. **La colina reusa las voces del prólogo.** La charla con el sol es la misma, palabra por palabra
   (`intercambio-del-sol.ts`), así que suena con los mp3 de `dentro-caotico` y `voz-supongo`, y su
   globo espera a que termine la voz.

## Consecuencias

- Las cinemáticas se alargan, como pasó con el prólogo.
- Con tres proyectos se pueden generar hasta 300 voces por día. Cambiar el estilo de un grupo o una
  voz regenera todas las líneas afectadas: conviene ver cuántas son con la corrida sin `--go`.
- Si cambia el texto de la charla con el sol, cambia en la colina y en el prólogo a la vez, y las
  dos vuelven a los blips hasta regenerar.
- Una línea sin voz sigue en blips (las cinemáticas) o muda (las hojas del viaje).
