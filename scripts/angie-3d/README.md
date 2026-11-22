# Modelo 3D de Angie

Angie tiene un modelo 3D propio en [`src/app/libs/angie-3d.ts`](../../src/app/libs/angie-3d.ts):
una gema convexa de 25 caras con nombre, el visor hundido con su marco y la cara. `proyectar({ yaw,
pitch })` devuelve el SVG de la gema vista desde ese ángulo, sin dibujar nada a mano
([ADR 0029](../../docs/adr/0029-angie-tiene-un-modelo-3d-propio.md)).

Estos scripts lo comparan con el modelo oficial y lo ajustan. El oficial es un OBJ de 100 MB que no
está en el repo: se lo pide a Damian. Todo lo que generan va a `tmp/angie-3d/`, que git ignora.

## Pasos

1. `node scripts/angie-3d/leer-obj.mjs <default_01_waterTight.obj>`: pasa el OBJ a binario, una vez.
2. `node scripts/angie-3d/oficial-360.mjs`: saca el oficial en cada grado, de 0 a 359, como máscara
   (gema, visor hundido, brazos y piernas) y como miniatura gris. Tarda unos dos minutos.
3. `node scripts/angie-3d/evaluar.mjs`: cuánto coinciden los dos en cada grado. Hoy la silueta da
   98 % y el hueco del visor 88 %. Lo que tapan los brazos y las piernas del oficial no se mide.
4. `node scripts/angie-3d/pagina-360.mjs`: arma `tmp/angie-3d/angie-360.html`, una página para girar
   los dos grado por grado, uno sobre otro, con la curva de coincidencia.

Para ajustar:

- `node scripts/angie-3d/optimizar.mjs`: busca facetas y abertura del visor que coincidan más y
  las imprime, para pegarlas en `FACETAS` y `VISOR`. No toca el archivo. Tarda varios minutos.
- `node scripts/angie-3d/ajustar-visor.mjs`: ajusta la curva del panel al oficial e imprime cuánto
  se hunde el oficial bajo nuestro casco, celda por celda; ahí se ve el marco.
- `node scripts/angie-3d/render.mjs <salida.png> [lado] [yaws] [pitch]`: el oficial en gris desde
  varios ángulos, para mirarlo al lado del nuestro.

Node avisa `MODULE_TYPELESS_PACKAGE_JSON` al importar el `.ts`: es inofensivo, y `--no-warnings` lo
calla.

## Trampas

- **Brazos y piernas.** El OBJ es una sola malla. Si se borran los brazos, quedan agujeros en la
  gema donde se unían; por eso se marcan como «no se mide» y siguen tapando lo que tienen detrás.
- **Lo que mide la coincidencia.** El hueco del visor es todo lo hundido: el panel, el marco y los
  ojos. Cambiar la profundidad del panel o del marco no mueve ese número. Eso se juzga mirando la
  página, sobre todo entre 60° y 120°.
- **De costado el panel se dobla sobre sí mismo.** `proyectar` lo dibuja en franjas y cada una con su
  propio degradé. Con un solo contorno el relleno se anula, y con un solo degradé queda una raya.
