# 0007. El viaje recorre los capítulos, y la molécula queda como mapa

## Contexto

Con el árbol de Signal Space ([0006](./0006-la-introduccion-pasa-entera-a-la-historia.md)), la
Introducción pasó entera al prólogo. Quedaban once capítulos y 34 desafíos en la molécula, cada uno
con su cinemática. Damian pidió seguir con todo el recorrido (2026-11-09): la app es una historia
continua, sin niveles numerados, con puntos para retomar y un botón para empezar de cero
([0003](./0003-historia-continua-angie-es-la-exploradora.md),
[0005](./0005-la-partida-guarda-donde-quedo-la-historia.md)).

Las cinemáticas de los capítulos ya cuentan casi todo el cuerpo del recorrido: los giros, las
transmisiones de la exploradora y la pregunta del viaje. Faltaba encadenarlas con los desafíos y
escribir lo que el canon decidió y ningún guion tenía: las pistas de Angie y la revelación.

## Decisión

1. **Después del prólogo, visto o salteado, sigue el viaje.** Cada capítulo es una etapa: primero
   su cinemática, después sus pantallas como páginas de la hoja del manual. La hoja dice el nombre
   de la etapa ("La caja que avisa", "La transmisión", `integrada-vista/viaje.ts`) y cada página el
   título de su pantalla. Angie da pistas: ya pactaron, y desde ahí enseña.
2. **Lo resuelto en una hoja del viaje se anota como en la molécula**, con el mismo id.
3. **Cada paso se guarda.** El punto `{ lugar: 'viaje' }` dice que se estaba viajando y
   `Partida.viaje` dice dónde: el concepto y la página, con la página -1 para la cinemática. Al
   recargar, entrar desde la colina sigue ahí sin repetir el prólogo. Es un campo nuevo, así que la
   versión no sube: una partida sin él empieza el viaje del principio.
4. **Cerrar la hoja deja el viaje y abre el mapa:** la molécula, con la construcción de Tusi
   delante, como antes. El lugar del viaje queda guardado y la bitácora lo sigue con "Seguir el
   viaje". Escape en una cinemática la saltea y sigue la hoja. Nunca hay que resolver nada para
   seguir ([0002](./0002-capa-de-juego-cinematicas-partida-y-sonido.md)).
5. **La molécula no se retira.** Queda como el mapa para repasar o para ir directo a una pantalla,
   con sus links `?nivel=`. Retirarla sería una reescritura masiva, y el mapa sigue sirviendo.
6. **La revelación es una cinemática propia**, la 13, que va entre la última hoja y el final. Usa el
   borrador del recorrido pasado en limpio y el dibujo del final, con la nave de la exploradora
   entrando. En el capítulo 11 no entraba: el guion permite ocho líneas, y la revelación tiene
   nueve. El final se reescribe para que pase después: la exploradora ya entró, Angie dice "Ahora sí
   puedo intervenir." y les dice "lentos" sin esconderlo. En la molécula, el final también llega
   precedido por la revelación.
7. **Las pistas sembradas pasan al guion**: el helado de chocolate (`c4-helado`), "lentos" que se le
   escapa (`c5-lentos`) y la frecuencia que nadie le dijo (`c7-frecuencia`). El silencio ya estaba:
   Angie no habla desde la transmisión del capítulo 6 hasta `c6-no-valor`.

## Consecuencias

- Quien no ve el prólogo (sin movimiento o con menos de 700 px) igual hace el viaje: el prólogo se
  saltea solo y sigue la primera etapa. Cierra el hueco de T11.
- El mismo desafío vive en dos lugares, la hoja y el mapa, con un solo id.
- Las cinemáticas todavía dicen "Capítulo N" y tienen su propio estilo. Pasarlas al estilo del
  prólogo sigue pendiente.
- Entre la revelación y el final no hay desafío todavía: la salida (J4) sigue sin decidir.
