# 0029. Angie tiene un modelo 3D propio

## Contexto

[ADR 0003](./0003-historia-continua-angie-es-la-exploradora.md) dejó que las poses de Angie que no
son de frente salen de su modelo 3D, nunca a mano: las poses dibujadas se leían como otra gema. El
modelo oficial es un OBJ de 100 MB, una sola malla de 415.000 polígonos. Cada pose nueva pedía
renderizarlo, vectorizar el resultado y proyectar la cara encima. Los scripts de la única pose que
salió así (la sentada de perfil) se perdieron.

Damian propuso rehacerla como nos convenga.

## Decisión

1. **Angie tiene un modelo propio, en código:** `src/app/libs/angie-3d.ts`. Tiene tres partes:
   - **La gema:** 13 facetas con nombre (25 caras, con los espejos). Cada faceta se escribe como
     dirección y distancia, y los vértices se calculan solos.
   - **El visor:** un panel curvo hundido en la gema, con visera arriba y un borde inclinado a los
     costados y abajo.
   - **La cara:** apoyada sobre el panel.

   `proyectar({ yaw, pitch })` da el SVG de la gema desde cualquier ángulo.
2. **Se ajusta al oficial, y se mide contra él.** El oficial sigue siendo la referencia, pero fuera
   del repo. `scripts/angie-3d/` lo compara en cada grado: la silueta coincide en un 98 % y el
   hueco del visor en un 88 %. Un cambio de forma vuelve a pasar por esa medición y por la página
   de 360°.
3. **Las poses que no son de frente salen de este modelo.** Sigue valiendo que nunca se dibujan a
   mano; ahora no hace falta el OBJ para hacer una.

## Consecuencias

- Reemplaza en parte a 0003: «su modelo 3D» pasa a ser este, que se derivó del oficial.
- La pose sentada de perfil (`mv__perfil` en `mascota-viva`) sigue siendo la vectorizada del OBJ.
  Rehacerla con `proyectar` es trabajo aparte.
- Lo que el modelo propio no tiene: brazos, piernas y el relieve fino de la cara. A 70°–90° el
  marco del oficial sobresale un poco de la silueta y el nuestro no, porque la gema es convexa.
- Cómo correr la medición y sus trampas: [`scripts/angie-3d/README.md`](../../scripts/angie-3d/README.md).
