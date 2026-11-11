# 0020. Las escenas pasan de noche; lo que se lee y se toca, en papel

## Contexto

Las cinemáticas de capítulo tenían el papel crema del recorrido, y arriba "Capítulo N". El prólogo,
en cambio, pasa en un cielo de noche, y Damian pidió que las cinemáticas se vieran como la intro
(T12 en `docs/historia/pendientes.md`). Al mismo tiempo, la hoja del viaje, el manual y la práctica son para leer y tocar: código,
inputs y desafíos se leen mejor sobre papel. Damian aprobó la regla el 2026-11-11.

## Decisión

1. **Las escenas (el prólogo y las cinemáticas) pasan en el cielo del prólogo.** El reproductor
   toma el mismo degradado, las nebulosas y las estrellas, pintados una vez y sin rAF.
2. **Lo que se lee y se toca (la hoja del viaje, el manual y la práctica) sigue en papel.**
3. **El nombre de la etapa reemplaza a "Capítulo N"** en la barra y en la tarjeta del título; la
   revelación y el final conservan su rótulo.
4. De noche, todo trazo suelto de una escena va claro. La tinta oscura queda solo como contorno de
   algo relleno.

## Consecuencias

- Cerrar una página para abrir una cinemática cambia de papel a noche. El iris de la View
  Transition ya marca ese corte.
- Una escena nueva se dibuja pensando en la noche: cualquier hilo o etiqueta oscura que flote en
  el cielo se pierde.
