# Guion de textos: vista integrada

Sacado de los datos con `node scripts/guion.mjs` (tramo colina → final). 🔇 = la línea no tiene voz grabada en `voces-grabadas.ts`. ▸ = el renglón que cambia la perilla. ⏸ = la historia se frena y se abre una hoja.

## La colina

- `colina-presiente` **Angie:** Así que… Ellos ya están aquí… *(piensa)*
- `dentro-caotico` **Capitán:** Esto es demasiado caótico. *(el sol, por radio)*
- `voz-supongo` **Angie:** Supongo que sí… / Desde su perspectiva puede ser caótico.
- `colina-decide` **Angie:** Así que… La hora ha llegado… *(piensa)*

## El prólogo

- `casa-volver` **Capitán:** Al fin es hora de volver a casa.
- `casa-familia` **Nave A:** Extraño a mi familia.
- `casa-helado` **Nave B:** Yo quiero comer helado de chocolate.
- `casa-unas` **Nave A:** Y yo quiero unas papas fritas…
- `casa-apuren` **Exploradora:** ¡Oigan! Dejen de desear y apúrense, van muy lento.
- `linea-msxheigk` **Nave A:** Siempre tan aguafiestas.
- `anom-que-pasa` **Capitán:** Esperen… ¿qué está sucediendo?
- `anom-sin-control` **Nave A:** No tengo control de los sistemas.
- `anom-atraidos` **Nave B:** Estamos siendo atraídos.
- `anom-rxjs` **Capitán:** ¡Activen todos los operadores de RxJS, rápido! ⏸ **se abre: minijuego**

### ⏸ El minijuego de operadores

#### Capitán: Duplicar la velocidad (`map`)

- `v`: la velocidad que entra
- `v * 2`: el doble
- Encargo: Al motor tiene que llegar v * 2. · Meta: el doble
- Ayuda de Nave A al fallar:
  - con `tap`: tap hace la cuenta y la tira. Al motor llega la misma velocidad.
  - con `filter`: filter usa la cuenta para decidir si pasa. Pasa, pero igual que entró.
- **Desafío** · botón «leer la velocidad» · lecturas: entra, al motor
  - Arranca roto:

    ```ts
      const turbo$ = velocidad$.pipe(
    ▸   tap((v) => v * 2),
      );
      motor.acelerar(turbo$);
    ```

  - Se arregla con: mover hueco → mover hueco → leer la velocidad

    ```ts
      const turbo$ = velocidad$.pipe(
    ▸   map((v) => v * 2),
      );
      motor.acelerar(turbo$);
    ```
    Lecturas sanas: entra 10, al motor 20

#### Nave A: Ver la velocidad (`tap`)

- `panel.mostrar(v)`: la pone en el panel, y no devuelve nada
- Encargo: El panel la muestra y el motor la recibe igual. · Meta: los dos iguales
- Ayuda de Nave B al fallar:
  - con `map`: map manda al motor lo que devuelve mostrar, y no devuelve nada.
  - con `filter`: filter deja pasar si mostrar da verdadero, y no da nada: no pasa ninguna.
- **Desafío** · botón «leer la velocidad» · lecturas: panel, al motor
  - Arranca roto:

    ```ts
      const vista$ = velocidad$.pipe(
    ▸   map((v) => panel.mostrar(v)),
      );
      motor.acelerar(vista$);
    ```

  - Se arregla con: mover hueco → mover hueco → leer la velocidad

    ```ts
      const vista$ = velocidad$.pipe(
    ▸   tap((v) => panel.mostrar(v)),
      );
      motor.acelerar(vista$);
    ```
    Lecturas sanas: panel 10, al motor 10

#### Nave B: Sacar el agua (`filter`)

- `c`: lo que trae la carga: combustible o agua
- `c === 'combustible'`: verdadero si es combustible
- Encargo: Al motor tiene que llegar solo combustible. · Meta: agua 0
- Ayuda de Capitán al fallar:
  - con `tap`: tap mira la carga y la deja pasar entera, con agua y todo.
  - con `map`: map cambia cada carga por la respuesta: al motor llegan true y false.
- **Desafío** · botón «cargar el tanque» · lecturas: combustible, agua
  - Arranca roto:

    ```ts
      const limpio$ = carga$.pipe(
    ▸   tap((c) => c === 'combustible'),
      );
      motor.cargar(limpio$);
    ```

  - Se arregla con: mover hueco → mover hueco → cargar el tanque

    ```ts
      const limpio$ = carga$.pipe(
    ▸   filter((c) => c === 'combustible'),
      );
      motor.cargar(limpio$);
    ```
    Lecturas sanas: combustible 2, agua 0

- `anom-pipes` **Nave A:** Los pipes están recargando energía.
- `anom-lento` **Nave B:** No funcionará, es demasiado lento.
- `anom-fuerza` **Capitán:** ¿Qué es esta fuerza…?
- `anom-velocidad` **Capitán:** Esta velocidad…
- `anom-manual` **Capitán:** ¡Rápido, el manual de a bordo! ⏸ **se abre: manual**

### ⏸ El manual de a bordo

#### Página 1 · El HTML es un árbol de nodos.

- En la nave: «La pantalla de la nave es un árbol.»
- Desafío: dentro de la demo (no es de perilla)

#### Página 2 · El DOM está vivo.

- En la nave: «Cambiar un nodo cambia la pantalla.»
- Desafío: dentro de la demo (no es de perilla)

#### Página 3 · No todo cambio cuesta lo mismo.

- En la nave: «Algunos cambios frenan la pantalla.»
- Desafío: dentro de la demo (no es de perilla)

#### Página 4 · A mano, te olvidás un lugar.

- En la nave: «Por eso el panel marca la velocidad vieja.»
- Desafío: dentro de la demo (no es de perilla)

#### Página 5 · Zone.js revisa todo el árbol.

- En la nave: «Zone.js solo ve lo que parchea.»
- Desafío: dentro de la demo (no es de perilla)

- `anom-leyes` **Capitán:** Debería ser imposible. Esto contradice todas las leyes del espacio Zone.js.
- `expl-que-pasa` **Exploradora:** ¿Qué les pasa?
- `expl-no-responden` **Exploradora:** ¿Por qué no responden?
- `expl-hacia-ahi` **Exploradora:** ¿Por qué van hacia ahí?
- `expl-vuelvan` **Exploradora:** ¡No! Vuelvan al espacio de Zone.js, están yendo a un espacio desconocido.
- `anom-perdiendo` **Capitán:** Los sistemas no responden a tiempo. Estamos perdiendo el control.
- `anom-grito` **Todos:** ¡Ahhhh! 🔇
- `dentro-vivos` **Nave A:** Estamos vivos…
- `dentro-cuidado` **Nave B:** ¡Cuidado!
- `dentro-esquiva-ya` **Nave A:** ¡Esquivá, rápido!
- `dentro-que-es` **Nave B:** ¿Qué es esto?
- `dentro-nunca-visto` **Nave A:** No lo sé, nunca había visto nada como esto.
- `dentro-escapemos` **Capitán:** Sea lo que sea, debemos escapar. Rápido.
- `dentro-esquivar` **Nave A:** Apenas puedo esquivar las partículas. No me pidas escapar.
- `dentro-switchmap` **Nave B:** switchMap no funciona, tampoco puedo usar los pipes.
- `dentro-azar` **Capitán:** Ningún operador de RxJS sirve a este nivel.
- `dentro-rendicion` **Capitán:** Aunque intentemos escapar, con tantas moléculas será imposible.
- `dentro-caotico` **Capitán:** Esto es demasiado caótico.
- `voz-supongo` **La voz:** Supongo que sí… / Desde su perspectiva puede ser caótico.
- `react-escucharon` **Nave A:** ¿Escucharon eso?
- `react-quien` **Nave B:** ¿Quién ha hablado?
- `voz-armonia` **La voz:** Pero desde la mía… / todo está en armonía.
- `voz-circulos` **La voz:** Dos hermosos círculos de movimiento uniforme, / y una melodía espléndida.
- `reclamo-melodia` **Nave A:** ¿Melodía?
- `reclamo-circulos` **Nave B:** ¿Círculos?
- `reclamo-loco` **Capitán:** ¿Estás loco?
- `reclamo-quien-eres` **Capitán:** ¿Quién eres?
- `reclamo-casi-matan` **Nave A:** Esas moléculas casi nos matan.
- `reclamo-armonioso` **Capitán:** Es lo más caótico que vivimos en nuestras vidas…
- `reclamo-tranquilo` **Capitán:** …y tú, tan tranquilo, lo llamas armonioso.
- `orden-caos-es-orden` **Angie:** El caos es orden.
- `orden-no-comprenden` **Angie:** Un orden que no comprenden…
- `orden-malinterpretado` **Angie:** Lo que ustedes ven como caos es un orden malinterpretado.
- `leccion-entiendes` **Capitán:** ¿Tú entiendes este mundo?
- `leccion-sacanos` **Nave B:** Sácanos de aquí.
- `leccion-no-intervengo` **Angie:** No puedo intervenir con ustedes.
- `leccion-curso` **Angie:** Ustedes deben seguir su curso natural.
- `leccion-tirados` **Nave A:** ¿Y nos dejarás aquí tirados?
- `leccion-comprender` **Angie:** No… Los ayudaré a comprender el mundo.
- `leccion-depende` **Angie:** Pero si saldrán de aquí o no, dependerá de ustedes…
- `leccion-dejar-atras` **Angie:** Y de si tienen la capacidad de dejar atrás lo que conocen y creen correcto.
- `leccion-listos` **Capitán:** Estamos listos para lo que sea.
- `leccion-que-hacer` **Nave B:** ¿Qué debemos hacer?
- `leccion-reglas` **Angie:** Lo más importante es entender que este mundo sigue reglas.
- `leccion-armonia` **Angie:** Eso que ustedes llaman caos no era más que armonía…
- `leccion-particulas` **Angie:** …partículas siguiendo las reglas.
- `leccion-pantalla` **Capitán:** Nuestra pantalla sigue marcando la velocidad vieja.
- `leccion-pregunta` **Nave B:** ¿Y quién le avisó a la pantalla?
- `leccion-arbol` **Angie:** Aquí nadie revisa todo. Miren el árbol. ⏸ **se abre: arbol**

### ⏸ El árbol de Signal Space

#### 0/6 · El signal avisa quién lo lee.

- En la nave: «Aquí solo se entera quien lee.»
- Desafío: dentro de la demo (no es de perilla)

- `leccion-guarden` **Angie:** Guarden esa pregunta. Los acompaña todo el viaje.
- `frase-complejo` **Angie:** Hasta lo que parece más complejo e inalcanzable…
- `frase-angulo` **Angie:** …se vuelve fácil y predecible si lo miras desde el ángulo correcto.

## 1 · La caja que avisa (arco I)

### Cinemática 1: «El que avisa»

Ley: *Un valor avisa solo a quien lo lee.* · Apertura: titulo, naves, caja-ambar

- `c1-caja` **Nave B:** Encontré una caja. / Adentro hay un número.
- `c1-cambio` **Nave A:** Lo cambié… y mi panel se enteró. · beat `hilo-lectura`
- `c1-cero` **Capitán:** El mío no. Sigue en cero.
- `c1-ella` **Nave B:** ¿A ella le avisó y a vos no?
- `c1-grita` **Angie:** La caja no grita al espacio. · beat `mascota`
- `c1-leyo` **Angie:** Avisa a quien la leyó. · beat `aviso-pulso`
- `c1-como-leer` **Capitán:** Nunca la leí. / ¿Cómo se lee una caja?

### 1/1 · Variables (repaso pre-signals)

- `viaje-1-1-llegada` **Nave B:** Una caja común: / guarda un número y calla. *(al llegar)*
- Pista de Angie (concepto): Repaso pre-signals: en JS guardás un valor en una variable (var / const / let).
- Pista de Angie (qué hacer): Elegí un tipo y después un valor de ejemplo.
- Pista de Angie (qué observar): El valor elegido aparece en las tres declaraciones (var/const/let difieren en alcance y reasignación).
- **Desafío** · botón «cambiar» · lecturas: cambios, avisos
  - Arranca roto:

    ```ts
    ▸ let total = 0;
      
      total = total + 1;
    ```

  - Se arregla con: mover perilla → cambiar

    ```ts
    ▸ const total = signal(0);
      
      total.set(total() + 1);
    ```
    Lecturas sanas: cambios 1, avisos 1
- `viaje-1-1-resuelta` **Capitán:** Con signal, la caja ya avisa. *(al resolver)*

### 1/2 · Qué es un signal

- `viaje-1-2-llegada` **Nave A:** Esta caja avisa cuando cambia. *(al llegar)*
- Pista de Angie (concepto): Un signal es un envoltorio alrededor de un valor que avisa a sus consumidores cuando ese valor cambia.
- Pista de Angie (qué hacer): Clickeá las cajitas para convertirlas en contenedores.
- Pista de Angie (qué observar): Cualquier tipo de valor puede ir adentro de un signal.
- **Desafío** · botón «cambiar el valor» · lecturas: consumidores enterados
  - Arranca roto:

    ```ts
      const total = signal(0);
      
      effect(() => {
    ▸   mostrar(valorGuardado);
      });
    ```

  - Se arregla con: mover perilla → cambiar el valor

    ```ts
      const total = signal(0);
      
      effect(() => {
    ▸   mostrar(total());
      });
    ```
    Lecturas sanas: consumidores enterados 1
- `viaje-1-2-resuelta` **Nave B:** ¡Me avisó! / Y no le pregunté nada. *(al resolver)*

### 1/3 · Tipos de signal

- `viaje-1-3-llegada` **Capitán:** ¿Qué cosas entran en la caja? *(al llegar)*
- Pista de Angie (concepto): No todos los signals son iguales: hay escribibles (WritableSignal) y de solo lectura (Signal y computed).
- Pista de Angie (qué hacer): Tocá cada tipo para ver cómo se crea.
- Pista de Angie (qué observar): Solo el WritableSignal se puede escribir; los otros dos son de solo lectura.
- **Desafío** · botón «escribir» · lecturas: escrituras aceptadas
  - Arranca roto:

    ```ts
    ▸ const total = computed(() => a() + b());
      
      total.set(10);
    ```

  - Se arregla con: mover perilla → escribir

    ```ts
    ▸ const total = signal(0);
      
      total.set(10);
    ```
    Lecturas sanas: escrituras aceptadas 1
- `viaje-1-3-resuelta` **Nave A:** Número, texto o lista. / Todas avisan igual. *(al resolver)*

### 1/4 · Leer un signal: el getter ()

- `viaje-1-4-llegada` **Capitán:** Nunca la leí. / ¿Cómo se lee una caja? *(al llegar)*
- Pista de Angie (concepto): Un signal se LEE llamándolo como función: count(). Funciona igual en el TypeScript y en el template.
- Pista de Angie (qué observar): El paréntesis no es opcional: count es la función-getter, count() es el valor.
- **Desafío** · botón «leer» · lecturas: número leído
  - Arranca roto:

    ```ts
      const total = signal(7);
      
    ▸ const doble = total * 2;
    ```

  - Se arregla con: mover perilla → leer

    ```ts
      const total = signal(7);
      
    ▸ const doble = total() * 2;
    ```
    Lecturas sanas: número leído 14
- `viaje-1-4-resuelta` **Nave B:** Con paréntesis. / Así sabe quién la lee. *(al resolver)*

### 1/5 · Writable Signal

- `viaje-1-5-llegada` **Nave A:** Esta caja la puedo escribir yo. *(al llegar)*
- Pista de Angie (concepto): signal.set() reemplaza el valor de un writable signal por uno nuevo.
- Pista de Angie (qué hacer): Escribí un número y tocá Set.
- Pista de Angie (qué observar): El contador toma exactamente el valor que escribiste.
- **Desafío** · botón «sumar uno» · lecturas: valor
  - Arranca roto:

    ```ts
      const total = signal(0);
      
    ▸ total.set(total + 1);
    ```

  - Se arregla con: mover perilla → sumar uno → sumar uno

    ```ts
      const total = signal(0);
      
    ▸ total.set(total() + 1);
    ```
    Lecturas sanas: valor 2
- `viaje-1-5-resuelta` **Capitán:** Con set cambia, / y todos se enteran. *(al resolver)*

### 1/6 · Update Signal

- `viaje-1-6-llegada` **Nave B:** ¿Y si sumo a lo que había? *(al llegar)*
- Pista de Angie (concepto): signal.update() calcula el nuevo valor a partir del anterior.
- Pista de Angie (qué hacer): Tocá Incrementar varias veces.
- Pista de Angie (qué observar): Cada click deriva del valor previo (value => value + 1).
- **Desafío** · botón «sumar uno» · lecturas: valor
  - Arranca roto:

    ```ts
      const total = signal(0);
      
    ▸ total.set(1);
    ```

  - Se arregla con: mover perilla → sumar uno → sumar uno

    ```ts
      const total = signal(0);
      
    ▸ total.update((n) => n + 1);
    ```
    Lecturas sanas: valor 2
- `viaje-1-6-resuelta` **Nave A:** update parte del valor de antes. *(al resolver)*

### 1/7 · Read-only signals: asReadonly()

- `viaje-1-7-llegada` **Capitán:** Que la lean todos. / Que la escriba uno. *(al llegar)*
- Pista de Angie (concepto): asReadonly() expone un signal que se lee pero no se escribe desde afuera.
- Pista de Angie (qué hacer): Incrementá (interno) y reseteá.
- Pista de Angie (qué observar): count() refleja los cambios; quien lo recibe no puede llamar .set().
- **Desafío** · botón «escribir desde afuera» · lecturas: escrituras ajenas
  - Arranca roto:

    ```ts
      private readonly _total = signal(0);
      
    ▸ readonly total = this._total;
    ```

  - Se arregla con: mover perilla → escribir desde afuera

    ```ts
      private readonly _total = signal(0);
      
    ▸ readonly total = this._total.asReadonly();
    ```
    Lecturas sanas: escrituras ajenas 0
- `viaje-1-7-resuelta` **Nave B:** asReadonly: se mira, no se toca. *(al resolver)*

## 2 · La molécula punteada (arco I)

### Cinemática 2: «El que se entera por otro»

Ley: *Un derivado no se toca: sigue a su fuente.* · Apertura: titulo, naves

- `c2-a-mano` **Capitán:** Rumbo es velocidad más viento. / Súmenlo a mano. · beat `suma-a-mano`
- `c2-vieja` **Nave A:** Cambió el viento. / Tu suma quedó vieja.
- `c2-punteada` **Nave B:** Esta molécula punteada / ya tiene la suma. · beat `molecula-punteada`
- `c2-quien` **Capitán:** ¿Quién la escribió? Nadie la tocó.
- `c2-por-otro` **Angie:** Nadie la toca. Se entera por otro. · beat `mascota`
- `c2-rehace` **Nave A:** ¿Se rehace con cada cambio del viento? · beat `hilos-fuente`
- `c2-nadie-lee` **Angie:** Fíjense qué pasa si nadie la lee. · beat `reposo`

### 2/1 · Computed signals

- `viaje-2-1-llegada` **Nave A:** Mi suma depende de otras cajas. *(al llegar)*
- Pista de Angie (concepto): computed() deriva un valor de otros signals y se recalcula solo cuando cambian.
- Pista de Angie (qué hacer): Escribí en Name y Surname.
- Pista de Angie (qué observar): El saludo se actualiza solo; nunca escribís fullName a mano.
- **Desafío** · botón «cambiar el precio» · lecturas: desfasado
  - Arranca roto:

    ```ts
      const precio = signal(100);
      
    ▸ let conIva = precio() * 1.21;
    ```

  - Se arregla con: mover perilla → cambiar el precio

    ```ts
      const precio = signal(100);
      
    ▸ const conIva = computed(() => precio() * 1.21);
    ```
    Lecturas sanas: desfasado 0
- `viaje-2-1-resuelta` **Capitán:** Cambió una caja. / La suma se rehízo sola. *(al resolver)*

### 2/2 · Dependencias dinámicas

- `viaje-2-2-llegada` **Nave B:** Según el camino, / lee unas cajas u otras. *(al llegar)*
- Pista de Angie (concepto): Un computed depende solo de lo que LEE en cada ejecución: las dependencias son dinámicas.
- Pista de Angie (qué hacer): Cambiá ShowCount e incrementá Count.
- Pista de Angie (qué observar): Con ShowCount en false, subir Count NO recomputa conditionalCount.
- **Desafío** · botón «cambiar la rama muerta» · lecturas: recálculos
  - Arranca roto:

    ```ts
      const total = computed(() => {
    ▸   const [x, y] = [a(), b()];
        return modo() === "a" ? x : y;
      });
    ```

  - Se arregla con: mover perilla → cambiar la rama muerta

    ```ts
      const total = computed(() => {
    ▸   return modo() === "a" ? a() : b();
        return modo() === "a" ? x : y;
      });
    ```
    Lecturas sanas: recálculos 0
- `viaje-2-2-resuelta` **Nave A:** Escucha solo lo que leyó / la última vez. *(al resolver)*

### 2/3 · Perezoso y memoizado

- `viaje-2-3-llegada` **Capitán:** ¿Calcula aunque nadie la mire? *(al llegar)*
- Pista de Angie (concepto): Un computed es perezoso (no corre hasta que se lo lee) y memoizado (no recalcula si sus deps no cambiaron).
- Pista de Angie (qué hacer): Editá los campos del formulario.
- Pista de Angie (qué observar): Solo recalcula cuando cambia algo de lo que realmente depende.
- **Desafío** · botón «leer el total» · lecturas: ejecuciones
  - Arranca roto:

    ```ts
      const items = signal(cargar());
      
    ▸ const total = () => caro(items());
    ```

  - Se arregla con: mover perilla → leer el total → leer el total → leer el total

    ```ts
      const items = signal(cargar());
      
    ▸ const total = computed(() => caro(items()));
    ```
    Lecturas sanas: ejecuciones 1
- `viaje-2-3-resuelta` **Nave B:** No. Calcula al leerla, / y una sola vez. *(al resolver)*

## 3 · La baliza (arco I)

### Cinemática 3: «El que sale a hacer algo»

Ley: *El que actúa repite cuando cambia lo que leyó.* · Apertura: titulo, naves, baliza-coral

- `c3-baliza` **Nave B:** Puse una baliza: / suena cuando cambia la caja.
- `c3-sono` **Nave A:** Cambié la caja. Sonó sola. · beat `hilo-lectura`
- `c3-viento` **Capitán:** Cambié el viento. No sonó.
- `c3-leyo` **Angie:** Solo vuelve por lo que leyó. · beat `mascota`
- `c3-dos` **Nave B:** Y ahora suenan dos. / La vieja no paró. · beat `baliza-doble`
- `c3-rastro` **Nave A:** Salir a hacer algo deja rastro. · beat `rastro`
- `c3-apagar` **Capitán:** ¿Cómo se apaga la anterior / antes de repetir?

### 3/1 · Dependencias del effect

- `viaje-3-1-llegada` **Nave B:** Puse una baliza: / suena cuando cambia la caja. *(al llegar)*
- Pista de Angie (concepto): Un effect() corre la primera vez y cada vez que cambia un signal que LEE.
- Pista de Angie (qué hacer): Tocá Count2. Count1 late solo con las animaciones activas.
- Pista de Angie (qué observar): Si Count1 late solo, su effect corre igual: reacciona a cualquier cambio del signal, no solo a tus clicks.
- **Desafío** · botón «count +1» · lecturas: count, último log
  - Arranca roto:

    ```ts
      const c = count();
      effect(() => {
    ▸   console.log(c);
      });
    ```

  - Se arregla con: mover lectura → count +1

    ```ts
      const c = count();
      effect(() => {
    ▸   console.log(count());
      });
    ```
    Lecturas sanas: count 1, último log 1
- `viaje-3-1-resuelta` **Nave A:** Sonó sola. / Solo por lo que leyó. *(al resolver)*

### 3/2 · Intervalo filtrado

- `viaje-3-2-llegada` **Capitán:** Esta baliza suena cada tanto. *(al llegar)*
- Pista de Angie (concepto): Un effect() se destruye con el componente, pero un setInterval que arrancó adentro NO se limpia solo.
- Pista de Angie (qué hacer): Prendé el intervalo y después destruí al hijo.
- Pista de Angie (qué observar): El reloj desaparece, pero los latidos SIGUEN subiendo: el intervalo quedó vivo (leak, a propósito).
- **Desafío** · botón «destruir el componente» · lecturas: intervalos vivos
  - Arranca roto:

    ```ts
      effect(() => {
        const id = setInterval(tick, 1000);
    ▸   // nadie lo apaga
      });
    ```

  - Se arregla con: mover limpieza → mover limpieza → destruir el componente

    ```ts
      effect((onCleanup) => {
        const id = setInterval(tick, 1000);
    ▸   onCleanup(() => clearInterval(id));
      });
    ```
    Lecturas sanas: intervalos vivos 0
- `viaje-3-2-resuelta` **Nave B:** Al irnos, se apaga con nosotros. *(al resolver)*

### 3/3 · Limpieza con onCleanup

- `viaje-3-3-llegada` **Nave A:** Salir a hacer algo deja rastro. *(al llegar)*
- Pista de Angie (concepto): Con onCleanup, la limpieza corre al apagar el intervalo y también al destruirse el hijo.
- Pista de Angie (qué hacer): Prendé el intervalo y después destruí al hijo.
- Pista de Angie (qué observar): Los latidos se frenan: onCleanup apagó el intervalo del hijo.
- **Desafío** · botón «prender y apagar» · lecturas: relojes vivos, esperado
  - Arranca roto:

    ```ts
      const ref = inject(DestroyRef);
      effect(() => {
        const id = setInterval(tick, 1000);
    ▸   ref.onDestroy(() => clearInterval(id));
      });
    ```

  - Se arregla con: mover limpieza → mover limpieza → prender y apagar → prender y apagar

    ```ts
      effect((onCleanup) => {
        const id = setInterval(tick, 1000);
    ▸   onCleanup(() => clearInterval(id));
      });
    ```
    Lecturas sanas: relojes vivos 1, esperado 1
- `viaje-3-3-resuelta` **Capitán:** onCleanup barre / antes de repetir. *(al resolver)*

## 4 · Las coordenadas gemelas (arco I)

### Cinemática 4: «¿Cambió, o solo se parece?»

Ley: *Antes de avisar, el valor compara: ¿cambió de verdad?* · Apertura: titulo, naves

- `c4-siete` **Nave A:** Escribí siete. Y siete otra vez. · beat `siete-dos-veces`
- `c4-nadie` **Nave B:** La segunda vez nadie se enteró.
- `c4-igual` **Angie:** Si no cambió, no hay aviso. · beat `mascota`
- `c4-coordenadas` **Capitán:** Copié las coordenadas, idénticas. / Y todos se enteraron. · beat `coordenadas-gemelas`
- `c4-quien` **Nave A:** ¿Idénticas para quién? · beat `balanza`
- `c4-helado` **Angie:** Dos helados de chocolate / también parecen idénticos.
- `c4-criterio` **Angie:** Y el criterio se puede elegir. · beat `criterio`
- `c4-cual` **Capitán:** ¿Con qué criterio comparó mis coordenadas?

### 4/1 · Igualdad por defecto (Object.is)

- `viaje-4-1-llegada` **Nave B:** Mismas coordenadas. / ¿Es la misma caja? *(al llegar)*
- Pista de Angie (concepto): Por defecto un signal usa Object.is: compara por referencia, no por contenido.
- Pista de Angie (qué hacer): Probá los tres botones y mirá el contador de notificaciones.
- Pista de Angie (qué observar): Un objeto NUEVO con el mismo contenido igual notifica; la misma referencia no.
- **Desafío** · botón «renombrar» · lecturas: cambios, avisos
  - Arranca roto:

    ```ts
      user.update((u) => {
    ▸   u.name = nextName();
        return u;
      });
    ```

  - Se arregla con: mover escritura → renombrar

    ```ts
      user.update((u) => {
    ▸   return { ...u, name: nextName() };
      });
    ```
    Lecturas sanas: cambios 1, avisos 1
- `viaje-4-1-resuelta` **Nave A:** Mismo valor, nadie se entera. / Otro objeto, sí. *(al resolver)*

### 4/2 · Función equal custom

- `viaje-4-2-llegada` **Capitán:** Que compare como yo quiero. *(al llegar)*
- Pista de Angie (concepto): Con la opción equal definís cuándo dos valores se consideran iguales (por valor).
- Pista de Angie (qué hacer): Tocá 'Mismo name' varias veces y comparalo con el sub-nivel 1.
- Pista de Angie (qué observar): Acá un objeto nuevo con el mismo name NO notifica: equal lo considera igual.
- **Desafío** · botón «recargar lo mismo» · lecturas: cargas, recálculos
  - Arranca roto:

    ```ts
    ▸ const items = signal(cargar());
      
      const total = computed(() => items().length);
    ```

  - Se arregla con: mover comparacion → recargar lo mismo → recargar lo mismo

    ```ts
    ▸ const items = signal(cargar(), {
        equal: mismoContenido,
      });
      
      const total = computed(() => items().length);
    ```
    Lecturas sanas: cargas 2, recálculos 1
- `viaje-4-2-resuelta` **Nave B:** Con equal, / el criterio es nuestro. *(al resolver)*

## 5 · El mapa de rutas (arco II)

### Cinemática 5: «Cuando el observador interviene»

Ley: *Podés pisar un derivado; su fuente lo reinicia.* · Apertura: titulo, naves, mapa-rutas

- `c5-primera` **Nave A:** El mapa propone la primera ruta.
- `c5-tercera` **Nave B:** Yo prefiero la tercera. / La marco a mano. · beat `mano-pisa`
- `c5-no-tocaba` **Capitán:** Lo derivado no se tocaba.
- `c5-pisar` **Angie:** Este sí se deja pisar. · beat `mascota`
- `c5-sector` **Nave A:** Cambió el sector. / El mapa trae rutas nuevas. · beat `sector-nuevo`
- `c5-mi-tercera` **Nave B:** ¿Y mi tercera? No está en la lista. · beat `marcador-suspenso`
- `c5-huerfana` **Capitán:** ¿Queda huérfana o vuelve a la fuente?
- `c5-lentos` **Angie:** Vamos, lentos… Perdón. / Tómense su tiempo.

### 5/1 · linkedSignal: reinicio con la fuente

- `viaje-5-1-llegada` **Nave A:** El mapa propone la primera ruta. *(al llegar)*
- Pista de Angie (concepto): linkedSignal() es estado editable que se reinicia cuando cambia su fuente.
- Pista de Angie (qué hacer): Elegí una opción y después cambiá la lista.
- Pista de Angie (qué observar): Tu selección se reinicia a la primera opción de la nueva lista.
- **Desafío** · botón «cambiar de categoría» · lecturas: selecciones inválidas
  - Arranca roto:

    ```ts
      const categoria = signal("bebidas");
      
    ▸ const elegido = signal(primero(categoria()));
    ```

  - Se arregla con: mover perilla → cambiar de categoría

    ```ts
      const categoria = signal("bebidas");
      
    ▸ const elegido = linkedSignal(() => primero(categoria()));
    ```
    Lecturas sanas: selecciones inválidas 0
- `viaje-5-1-resuelta` **Capitán:** Cambió la fuente: / la ruta volvió a empezar. *(al resolver)*

### 5/2 · linkedSignal: preservar si sigue válida

- `viaje-5-2-llegada` **Nave B:** Si mi ruta sigue existiendo, / la guardo. *(al llegar)*
- Pista de Angie (concepto): linkedSignal con source+computation preserva el valor si sigue siendo válido.
- Pista de Angie (qué hacer): Elegí una opción y cambiá la lista.
- Pista de Angie (qué observar): Si tu opción sigue disponible se mantiene; si no, cae a la primera.
- **Desafío** · botón «recargar la lista» · lecturas: selecciones perdidas
  - Arranca roto:

    ```ts
      const elegido = linkedSignal({
        source: items,
    ▸   computation: (l) => l[0],
      });
    ```

  - Se arregla con: mover perilla → recargar la lista

    ```ts
      const elegido = linkedSignal({
        source: items,
    ▸   computation: (l, p) => l.includes(p?.value) ? p.value : l[0],
      });
    ```
    Lecturas sanas: selecciones perdidas 0
- `viaje-5-2-resuelta` **Nave A:** Si sigue valiendo, / se queda la mía. *(al resolver)*

## 6 · La transmisión (arco II)

### Cinemática 6: «El dato que todavía viaja»

Ley: *Un dato que viaja tiene estado: cargando, error, valor.* · Apertura: titulo, naves, estado-en-viaje

- `c6-banda` **Nave A:** ¿Escucharon? Hay algo en la banda vieja. · beat `transmision`
- `c6-reciben` **Exploradora:** …cap… ¿me… reciben?… · beat `onda-debil`
- `c6-exploradora` **Nave B:** ¡Es la exploradora! Sigue afuera.
- `c6-donde` **Capitán:** ¡Exploradora! ¿Dónde estás?
- `c6-de-nuevo` **Capitán:** No contesta. Preguntá de nuevo, / más fuerte.
- `c6-llega` **Nave B:** Llega 'sector ocho'… / y ahora 'sector siete'. · beat `dos-paquetes`
- `c6-cual-vieja` **Capitán:** ¿Cuál es la vieja? / Dos preguntas, dos respuestas. · beat `cruce`
- `c6-no-valor` **Angie:** Lo que viaja todavía no es un valor. · beat `mascota`
- `c6-estado` **Angie:** Pregunten en qué estado está.
- `c6-cancela` **Capitán:** Si pregunto de nuevo, / ¿la anterior se cancela?

### 6/1 · resource(): loader con Promise

- `viaje-6-1-llegada` **Capitán:** Pregunto afuera / y espero la respuesta. *(al llegar)*
- Pista de Angie (concepto): resource() conecta una petición reactiva con una carga async basada en Promise.
- Pista de Angie (qué hacer): Elegí un usuario (el #4 no existe).
- Pista de Angie (qué observar): El estado pasa por loading → resolved, o error con el #4.
- **Desafío** · botón «buscar otra cosa» · lecturas: respuestas viejas
  - Arranca roto:

    ```ts
    ▸ effect(() => {
        traer(id()).then((u) => user.set(u));
      });
    ```

  - Se arregla con: mover perilla → buscar otra cosa → buscar otra cosa

    ```ts
    ▸ const user = resource({
        params: () => ({ id: id() }),
        loader: ({ params }) => traer(params.id),
      });
    ```
    Lecturas sanas: respuestas viejas 0
- `viaje-6-1-resuelta` **Nave B:** Cargando, error o valor: / todo avisa. *(al resolver)*

### 6/2 · rxResource(): stream de RxJS

- `viaje-6-2-llegada` **Nave A:** La respuesta llega por un stream. *(al llegar)*
- Pista de Angie (concepto): rxResource() es como resource() pero el loader es un Observable de RxJS.
- Pista de Angie (qué hacer): Elegí un usuario (el #4 no existe).
- Pista de Angie (qué observar): Mismos estados (loading/resolved/error) alimentados por un stream.
- **Desafío** · botón «cambiar el filtro» · lecturas: suscripciones vivas
  - Arranca roto:

    ```ts
    ▸ effect(() => {
        http.get(filtro()).subscribe(set);
      });
    ```

  - Se arregla con: mover perilla → cambiar el filtro → cambiar el filtro

    ```ts
    ▸ const lista = rxResource({
        params: () => ({ q: filtro() }),
        stream: ({ params }) => http.get(params.q),
      });
    ```
    Lecturas sanas: suscripciones vivas 1
- `viaje-6-2-resuelta` **Capitán:** Un stream también / entra en la caja. *(al resolver)*

### 6/3 · httpResource(): pedir por URL

- `viaje-6-3-llegada` **Nave B:** Basta la dirección para preguntar. *(al llegar)*
- Pista de Angie (concepto): Sin loader ni abortSignal: solo la URL.
- **Desafío** · botón «pedir el siguiente» · lecturas: statusCode, excepciones
  - Arranca roto:

    ```ts
      const t = httpResource<Tripulante>(
        () => `datos/tripulacion/${id()}.json`,
      );
    ▸ const nombre = computed(() => t.value()?.nombre);
    ```

  - Se arregla con: mover lectura → mover lectura → pedir el siguiente

    ```ts
      const t = httpResource<Tripulante>(
        () => `datos/tripulacion/${id()}.json`,
      );
    ▸ const nombre = computed(() => t.hasValue() ? t.value().nombre : '');
    ```
    Lecturas sanas: statusCode 404, excepciones 0
- `viaje-6-3-resuelta` **Nave A:** Cambió la dirección: / preguntó de nuevo solo. *(al resolver)*

## 7 · El repetidor (arco II)

### Cinemática 7: «Los bordes del aparato»

Ley: *Un aparato recibe por un borde, avisa por otro.* · Apertura: titulo, naves

- `c7-repetidor` **Capitán:** Armemos un repetidor / para la exploradora.
- `c7-frecuencia` **Angie:** Pásenle la ciento cuarenta y dos. · beat `repetidor`
- `c7-vieja` **Nave B:** Cambié la frecuencia / y sigue en la vieja. · beat `frecuencia-vieja`
- `c7-vivo` **Angie:** Lo que entra sigue vivo adentro. · beat `mascota`
- `c7-avisa` **Nave A:** ¿Y cuando encuentre algo, / cómo nos avisa?
- `c7-borde` **Angie:** Por otro borde, hacia afuera. · beat `borde-salida`
- `c7-sin` **Capitán:** Lo encendí sin frecuencia. · beat `vacio`
- `c7-exigir` **Nave B:** Está escuchando la nada. / ¿Se puede exigir?

### 7/1 · input() y output() basados en signals

- `viaje-7-1-llegada` **Capitán:** Armemos un repetidor / para la exploradora. *(al llegar)*
- Pista de Angie (concepto): input() y output() reemplazan a @Input()/@Output() con signals.
- Pista de Angie (qué hacer): Tocá el contador y cambiá el paso del input.
- Pista de Angie (qué observar): El hijo recibe step por input y avisa al padre por output.
- **Desafío** · botón «cambiar desde el padre» · lecturas: desfasado
  - Arranca roto:

    ```ts
      readonly precio = input(0);
      
    ▸ readonly conIva = this.precio() * 1.21;
    ```

  - Se arregla con: mover perilla → cambiar desde el padre

    ```ts
      readonly precio = input(0);
      
    ▸ readonly conIva = computed(() => this.precio() * 1.21);
    ```
    Lecturas sanas: desfasado 0
- `viaje-7-1-resuelta` **Nave B:** Entra por input, / sale por output. *(al resolver)*

### 7/2 · model(): binding two-way con [(value)]

- `viaje-7-2-llegada` **Nave A:** Que el repetidor hable / para los dos lados. *(al llegar)*
- Pista de Angie (concepto): model() habilita el binding two-way con [(value)].
- Pista de Angie (qué hacer): Tocá las estrellas o reseteá desde el padre.
- Pista de Angie (qué observar): El valor se sincroniza hijo↔padre en ambos sentidos.
- **Desafío** · botón «editar en el hijo» · lecturas: cambios perdidos
  - Arranca roto:

    ```ts
    ▸ readonly valor = input(0);
      readonly valorChange = output<number>();
      
      this.valorChange.emit(nuevo);
    ```

  - Se arregla con: mover perilla → editar en el hijo

    ```ts
    ▸ readonly valor = model(0);
      
      this.valor.set(nuevo);
    ```
    Lecturas sanas: cambios perdidos 0
- `viaje-7-2-resuelta` **Capitán:** model: lo cambio yo, / o lo cambia ella. *(al resolver)*

### 7/3 · input.required() y transform

- `viaje-7-3-llegada` **Nave B:** Sin frecuencia / no tendría que encender. *(al llegar)*
- Pista de Angie (concepto): input.required() obliga a pasar el valor (error en build con strictTemplates si falta, y NG0950 en runtime si se lee antes de setearse); transform convierte el atributo (string) al tipo correcto.
- Pista de Angie (qué hacer): Sumá al contador y alterná el resaltado.
- Pista de Angie (qué observar): count llega como número (numberAttribute) y highlight como booleano (booleanAttribute).
- **Desafío** · botón «usar sin pasarlo» · lecturas: undefined leídos
  - Arranca roto:

    ```ts
    ▸ readonly userId = input<string>();
      
      cargar(this.userId());
    ```

  - Se arregla con: mover perilla → usar sin pasarlo

    ```ts
    ▸ readonly userId = input.required<string>();
      
      cargar(this.userId());
    ```
    Lecturas sanas: undefined leídos 0
- `viaje-7-3-resuelta` **Nave A:** required lo exige. / transform lo traduce. *(al resolver)*

### 7/4 · Formularios con signals

- `viaje-7-4-llegada` **Capitán:** Cada campo del formulario / es una caja. *(al llegar)*
- Pista de Angie (concepto): El modelo manda; el form deriva.
- **Desafío** · botón «editar el correo» · lecturas: sin validar
  - Arranca roto:

    ```ts
      readonly f = form(this.modelo);
    ▸ readonly valido = signal(false);
      
      enviar() {
        this.valido.set(esCorreo(this.modelo().correo));
      }
    ```

  - Se arregla con: mover perilla → editar el correo

    ```ts
      readonly f = form(this.modelo, (t) => email(t.correo));
    ▸ readonly valido = computed(() => this.f().valid());
      
      enviar() {
        if (this.valido()) guardar(this.modelo());
      }
    ```
    Lecturas sanas: sin validar 0
- `viaje-7-4-resuelta` **Nave B:** Escribo, y la validez / se entera sola. *(al resolver)*

### 7/5 · Reglas que reaccionan

- `viaje-7-5-llegada` **Nave A:** El panel cambia / según lo que elijo. *(al llegar)*
- Pista de Angie (concepto): Las reglas leen el modelo.
- **Desafío** · botón «cambiar el modo» · lecturas: regla vieja
  - Arranca roto:

    ```ts
      const automatica = this.modelo().automatica;
      readonly f = form(this.modelo, (r) => {
    ▸   disabled(r.frecuencia, () => automatica);
      });
    ```

  - Se arregla con: mover perilla → cambiar el modo

    ```ts
      readonly f = form(this.modelo, (r) => {
    ▸   disabled(r.frecuencia, (c) => c.valueOf(r.automatica));
      });
    ```
    Lecturas sanas: regla vieja 0
- `viaje-7-5-resuelta` **Capitán:** Cambia el modelo, / y las reglas se acomodan. *(al resolver)*

### 7/6 · Transmitir con submit()

- `viaje-7-6-llegada` **Nave B:** ¿Y si transmito / antes de verificar el canal? *(al llegar)*
- Pista de Angie (concepto): submit() retiene lo no verificado.
- **Desafío** · botón «transmitir ya» · lecturas: sin verificar
  - Arranca roto:

    ```ts
      submit(this.f, {
    ▸   ignoreValidators: 'pending',
        action: () => transmitir(this.modelo()),
      });
    ```

  - Se arregla con: mover perilla → transmitir ya

    ```ts
      submit(this.f, {
    ▸   ignoreValidators: 'none',
        action: () => transmitir(this.modelo()),
      });
    ```
    Lecturas sanas: sin verificar 0
- `viaje-7-6-resuelta` **Nave A:** Sin verificar, no sale. / submit la retiene. *(al resolver)*

## 8 · Los pipes se traducen (arco II)

### Cinemática 8: «Mirar la pantalla misma»

Ley: *Pantalla y streams también se leen como valores.* · Apertura: titulo, naves

- `c8-pipes` **Nave B:** Tiro los pipes de RxJS. / Acá no sirven. · beat `pipes-esclusa`
- `c8-traducen` **Angie:** No los tiren. Se traducen. · beat `mascota`
- `c8-stream` **Nave A:** ¿Un stream puede volverse / un valor que avisa? · beat `puente`
- `c8-reves` **Angie:** Y al revés. Nada de lo suyo sobra.
- `c8-pantalla` **Capitán:** Ahora el repetidor. / Quiero mirar su pantalla.
- `c8-no-estaba` **Nave B:** La busqué apenas encendió. No estaba. · beat `pantalla-vacia`
- `c8-valor` **Angie:** Miren la pantalla como un valor más. · beat `pantalla-aparece`
- `c8-cuando` **Nave A:** Ahora sí está. / ¿Desde cuándo se puede leer?

### 8/1 · viewChild() como signal

- `viaje-8-1-llegada` **Nave A:** Quiero ver la pieza de adentro. *(al llegar)*
- Pista de Angie (concepto): viewChild() entrega un elemento de la vista como signal.
- Pista de Angie (qué hacer): Escribí y usá Enfocar / Limpiar.
- Pista de Angie (qué observar): El componente opera el input a través del signal de la query.
- **Desafío** · botón «montar» · lecturas: encontrado
  - Arranca roto:

    ```ts
      readonly caja = viewChild<ElementRef>("caja");
      
    ▸ const alto = this.caja()!.nativeElement.offsetHeight;
    ```

  - Se arregla con: mover perilla → montar

    ```ts
      readonly caja = viewChild<ElementRef>("caja");
      
    ▸ afterRenderEffect(() => medir(this.caja()));
    ```
    Lecturas sanas: encontrado 1
- `viaje-8-1-resuelta` **Capitán:** viewChild la encuentra / y avisa si cambia. *(al resolver)*

### 8/2 · toSignal() · toObservable() · untracked()

- `viaje-8-2-llegada` **Nave B:** Los pipes viejos / hablan otro idioma. *(al llegar)*
- Pista de Angie (concepto): toSignal()/toObservable() puentean RxJS y signals; untracked() lee sin crear dependencia.
- Pista de Angie (qué hacer): Tocá count+1, base+1 y multiplier+1.
- Pista de Angie (qué observar): multiplier+1 NO recalcula result (untracked); base+1 sí.
- **Desafío** · botón «cambiar el auxiliar» · lecturas: corridas sobrantes
  - Arranca roto:

    ```ts
      effect(() => {
        const q = consulta();
    ▸   enviar(q, pagina());
      });
    ```

  - Se arregla con: mover perilla → cambiar el auxiliar

    ```ts
      effect(() => {
        const q = consulta();
    ▸   enviar(q, untracked(pagina));
      });
    ```
    Lecturas sanas: corridas sobrantes 0
- `viaje-8-2-resuelta` **Nave A:** toSignal y toObservable / traducen de ida y vuelta. *(al resolver)*

### 8/3 · viewChildren() como signal

- `viaje-8-3-llegada` **Capitán:** Ahora son muchas piezas, / y van y vienen. *(al llegar)*
- Pista de Angie (concepto): viewChildren() entrega TODOS los elementos que matchean, como un signal que se actualiza solo.
- Pista de Angie (qué hacer): Agregá y quitá nombres.
- Pista de Angie (qué observar): El conteo de elementos queriados sigue a la lista sin que lo actualices a mano.
- **Desafío** · botón «agregar una fila» · lecturas: vistos, reales
  - Arranca roto:

    ```ts
      readonly filas = viewChildren<ElementRef>("fila");
      
    ▸ const total = this.filas().length;
    ```

  - Se arregla con: mover perilla → agregar una fila

    ```ts
      readonly filas = viewChildren<ElementRef>("fila");
      
    ▸ const total = computed(() => this.filas().length);
    ```
    Lecturas sanas: vistos 4, reales 4
- `viaje-8-3-resuelta` **Nave B:** La lista se actualiza sola. *(al resolver)*

### 8/4 · contentChild() y contentChildren()

- `viaje-8-4-llegada` **Nave A:** Lo que nos mandan de afuera / también cuenta. *(al llegar)*
- Pista de Angie (concepto): Las queries de contenido buscan en lo que el PADRE proyecta dentro del hijo (ng-content), como signals.
- Pista de Angie (qué hacer): Agregá y quitá tags.
- Pista de Angie (qué observar): El hijo cuenta los elementos proyectados sin recibir nada por input: los descubre del contenido.
- **Desafío** · botón «proyectar dos items» · lecturas: encontrados
  - Arranca roto:

    ```ts
      // el padre proyecta <app-item> con ng-content
      
    ▸ readonly items = viewChildren(ItemComponent);
    ```

  - Se arregla con: mover perilla → proyectar dos items

    ```ts
      // el padre proyecta <app-item> con ng-content
      
    ▸ readonly items = contentChildren(ItemComponent);
    ```
    Lecturas sanas: encontrados 2
- `viaje-8-4-resuelta` **Capitán:** contentChild mira / lo que pusieron adentro. *(al resolver)*

## 9 · La antena (arco III)

### Cinemática 9: «Medir después de pintar»

Ley: *Para medir la pantalla, esperá a que esté pintada.* · Apertura: titulo, naves, antena-boceto

- `c9-midan` **Capitán:** Midan la antena del repetidor. Exacta.
- `c9-cero` **Nave A:** Mide cero. Pero la estoy viendo. · beat `regla-cero`
- `c9-antes` **Nave B:** ¿La mediste antes o después de pintarla?
- `c9-pinta` **Angie:** Este mundo primero pinta. / Después se mide. · beat `mascota`
- `c9-oido` **Nave A:** Le puse un oído a la antena. · beat `pintado`
- `c9-tres` **Nave B:** Repintaron dos veces. / Ahora hay tres oídos. · beat `oidos-apilados`
- `c9-rastro` **Capitán:** Otra vez el rastro. Como la baliza.
- `c9-cuando` **Nave A:** ¿Y cuándo sé que ya pintó?

### 9/1 · afterRenderEffect(): medir el DOM

- `viaje-9-1-llegada` **Nave B:** Necesito medir la antena / ya dibujada. *(al llegar)*
- Pista de Angie (concepto): afterRenderEffect() corre después del render: es el lugar para leer o medir el DOM real.
- Pista de Angie (qué hacer): Editá el texto del campo.
- Pista de Angie (qué observar): El ancho en píxeles se mide del elemento ya renderizado y se actualiza tras cada render.
- **Desafío** · botón «sumar una fila» · lecturas: alto medido, alto real
  - Arranca roto:

    ```ts
    ▸ effect(() => {
        filas(); // re-mide al crecer
        const alto = panel().nativeElement.offsetHeight;
        acomodar(alto);
      });
    ```

  - Se arregla con: mover perilla → sumar una fila

    ```ts
    ▸ afterRenderEffect(() => {
        filas(); // re-mide al crecer
        const alto = panel().nativeElement.offsetHeight;
        acomodar(alto);
      });
    ```
    Lecturas sanas: alto medido 240, alto real 240
- `viaje-9-1-resuelta` **Nave A:** Después de pintar, mide. / No antes. *(al resolver)*

### 9/2 · effect((onCleanup) => …)

- `viaje-9-2-llegada` **Capitán:** Si la antena cambia, / apago la vieja. *(al llegar)*
- Pista de Angie (concepto): onCleanup() limpia un effect antes de que vuelva a correr o cuando el componente se destruye: así no quedan leaks.
- Pista de Angie (qué hacer): Prendé y apagá el cronómetro varias veces.
- Pista de Angie (qué observar): Al apagar, onCleanup hace clearInterval: el tick se detiene y se cuenta una limpieza.
- **Desafío** · botón «cambiar de panel» · lecturas: listeners vivos, esperado
  - Arranca roto:

    ```ts
      afterRenderEffect((onCleanup) => {
        const off = escuchar(panel());
    ▸   // el listener queda
      });
    ```

  - Se arregla con: mover perilla → cambiar de panel → cambiar de panel

    ```ts
      afterRenderEffect((onCleanup) => {
        const off = escuchar(panel());
    ▸   onCleanup(off);
      });
    ```
    Lecturas sanas: listeners vivos 1, esperado 1
- `viaje-9-2-resuelta` **Nave B:** onCleanup corta lo anterior / antes de seguir. *(al resolver)*

## 10 · La tormenta (arco III)

### Cinemática 10: «Esperar a que se estabilice»

Ley: *Ante una ráfaga de avisos, actuá cuando se calme.* · Apertura: titulo, naves

- `c10-tormenta` **Nave A:** ¡Tormenta en la banda! Es ella. · beat `transmision`
- `c10-sector` **Exploradora:** …sec… sector… sector oc… / ¡sector ocho! · beat `rafaga`
- `c10-pedacito` **Nave B:** El repetidor contesta cada pedacito. · beat `eco-multiple`
- `c10-cuatro` **Capitán:** Cuatro respuestas para un solo mensaje.
- `c10-fundir` **Nave A:** Se va a fundir contestando a medias. · beat `temperatura`
- `c10-no-termino` **Angie:** Ella todavía no terminó de hablar. · beat `mascota`
- `c10-calme` **Angie:** Esperen a que la banda se calme. · beat `calma`
- `c10-cuanto` **Capitán:** ¿Cuánto? ¿Y si vuelve a hablar / mientras esperamos?

### 10/1 · Debounce con RxJS

- `viaje-10-1-llegada` **Nave A:** Con la tormenta / llegan mil avisos. *(al llegar)*
- Pista de Angie (concepto): toObservable lleva el signal a RxJS, debounceTime espera, y toSignal lo trae de vuelta.
- Pista de Angie (qué hacer): Escribí rápido en el buscador.
- Pista de Angie (qué observar): 'Inmediato' cambia con cada tecla; 'Debounced' recién se actualiza 400ms después de que parás.
- **Desafío** · botón «tipear una letra» · lecturas: búsquedas
  - Arranca roto:

    ```ts
      const resultados = toSignal(
        toObservable(consulta).pipe(
    ▸     // sin espera
          switchMap(buscar),
        ),
      );
    ```

  - Se arregla con: mover perilla → tipear una letra → tipear una letra → tipear una letra

    ```ts
      const resultados = toSignal(
        toObservable(consulta).pipe(
    ▸     debounceTime(300),
          switchMap(buscar),
        ),
      );
    ```
    Lecturas sanas: búsquedas 1
- `viaje-10-1-resuelta` **Capitán:** Espero a que pare, / y leo uno solo. *(al resolver)*

### 10/2 · Debounce a mano (effect + onCleanup)

- `viaje-10-2-llegada` **Nave B:** A mano: espero y cancelo. *(al llegar)*
- Pista de Angie (concepto): Sin RxJS: un effect arma un setTimeout y onCleanup cancela el anterior en cada tecla.
- Pista de Angie (qué hacer): Escribí rápido y después frená.
- Pista de Angie (qué observar): El valor debounced solo aparece 400ms después de la última tecla (igual que con RxJS).
- **Desafío** · botón «tipear una letra» · lecturas: timers vivos
  - Arranca roto:

    ```ts
      effect((onCleanup) => {
        const q = consulta();
        const id = setTimeout(() => buscar(q), 300);
    ▸   // el timer anterior sigue
      });
    ```

  - Se arregla con: mover perilla → tipear una letra → tipear una letra → tipear una letra

    ```ts
      effect((onCleanup) => {
        const q = consulta();
        const id = setTimeout(() => buscar(q), 300);
    ▸   onCleanup(() => clearTimeout(id));
      });
    ```
    Lecturas sanas: timers vivos 1
- `viaje-10-2-resuelta` **Nave A:** Un timer por cambio. / El viejo se borra. *(al resolver)*

### 10/3 · debounced() nativo

- `viaje-10-3-llegada` **Capitán:** Angular ya trae / su propio paraguas. *(al llegar)*
- Pista de Angie (concepto): Experimental en v22. Sin RxJS ni timers.
- **Desafío** · botón «tipear una letra» · lecturas: búsquedas
  - Arranca roto:

    ```ts
      const q = debounced(consulta, 300);
      const resultados = resource({
    ▸   params: () => consulta(),
        loader: ({ params }) => buscar(params),
      });
    ```

  - Se arregla con: mover perilla → tipear una letra → tipear una letra → tipear una letra

    ```ts
      const q = debounced(consulta, 300);
      const resultados = resource({
    ▸   params: () => q.value(),
        loader: ({ params }) => buscar(params),
      });
    ```
    Lecturas sanas: búsquedas 1
- `viaje-10-3-resuelta` **Nave B:** debounced calma la caja, / sin pipes. *(al resolver)*

## 11 · Quien lee, avisa (arco III)

### Cinemática 11: «Quien lee, avisa»

Ley: *Nadie revisa todo el árbol: quien lee, avisa.* · Apertura: titulo, naves, arbol-completo

- `c11-repasemos` **Capitán:** Repasemos. Nadie revisó el árbol entero.
- `c11-igual` **Nave A:** Y la pantalla se repintó igual.
- `c11-donde` **Nave B:** Solo donde alguien leía algo que cambió. · beat `lectores-encendidos`
- `c11-casa` **Capitán:** En casa, Zone.js lo revisaba / todo por nosotros.
- `c11-atras` **Angie:** Dejar atrás lo que conocen. / ¿Se acuerdan? · beat `mascota`
- `c11-quien` **Nave B:** Entonces, ¿quién le avisó a la pantalla? · beat `pregunta-brilla`
- `c11-sabemos` **Nave A:** Creo que ya lo sabemos.
- `c11-comprobar` **Capitán:** Sin Zone.js, entonces. Comprobémoslo. · beat `zone-se-apaga`

### 11/1 · Change detection sin Zone.js

- `viaje-11-1-llegada` **Nave A:** Sin Zone.js, / ¿quién revisa la pantalla? *(al llegar)*
- Pista de Angie (concepto): Con signals + OnPush, Angular se entera de los cambios sin Zone.js: desde v21 arranca así.
- Pista de Angie (qué hacer): Incrementá el contador.
- Pista de Angie (qué observar): La vista se actualiza porque el signal avisa a Angular, no porque Zone.js parchee setInterval/eventos.
- **Desafío** · botón «cambiar un valor» · lecturas: nodos revisados
  - Arranca roto:

    ```ts
      bootstrapApplication(App, {
        providers: [
    ▸     provideZoneChangeDetection(),
        ],
      });
    ```

  - Se arregla con: mover perilla → cambiar un valor

    ```ts
      bootstrapApplication(App, {
        providers: [
    ▸     // zoneless por defecto desde v21
        ],
      });
    ```
    Lecturas sanas: nodos revisados 1
- `viaje-11-1-resuelta` **Capitán:** Quien lee, avisa. / Nadie revisa de más. *(al resolver)*

## La revelación

### Cinemática 13: «Porque entré»

Ley: *Quien espera sabe cómo termina el mensaje.* · Apertura: titulo, naves, molecula-entera

- `r-entrar` **Exploradora:** No los encuentro. Voy a entrar. · beat `transmision`
- `r-afuera` **Nave A:** ¡No! ¡Quedate afuera!
- `r-igual` **Angie:** Va a entrar igual. · beat `mascota`
- `r-como` **Capitán:** ¿Cómo lo sabés?
- `r-entre` **Angie:** Porque entré. · beat `nave4-entra`
- `r-exploradora` **Nave A:** ¿Exploradora?
- `r-antes` **Angie:** Llegué antes que ustedes. / Mucho antes.
- `r-tenia` **Angie:** No podía decirlo. / Ella tenía que entrar.
- `r-aguafiestas` **Nave A:** Siempre tan aguafiestas.

## El final

### Cinemática 12: «Quien lee, vuelve»

Ley: *No se escapa de un mundo: se lo entiende.* · Apertura: titulo, naves, molecula-entera

- `c12-banda` **Nave A:** La banda está limpia. / Ya nadie transmite.
- `c12-intervenir` **Angie:** Ahora sí puedo intervenir. · beat `mascota`
- `c12-juntos` **Capitán:** Sus signals y nuestros operadores. / Juntos.
- `c12-salida` **Nave B:** Todos los enlaces encendidos. / Se abrió la salida. · beat `salida-iris` · solo si completo
- `c12-lentos` **Angie:** Salgan de una vez, lentos. · solo si completo
- `c12-helado` **Nave B:** Y después, helado de chocolate. · beat `regreso` · solo si completo
- `c12-punteados` **Nave B:** Quedan enlaces punteados. / La salida está a medias. · beat `salida-iris` · solo si incompleto
- `c12-medias` **Angie:** Los espero. Tengo práctica. · solo si incompleto
- `c12-casa` **Capitán:** Todavía no. / Este mundo también es casa. · beat `regreso` · solo si incompleto
- `c12-suyas` **Angie:** Este mundo sigue reglas. / Ahora son suyas. · beat `mascota`

## Qué aprendes en cada paso

| Paso | Qué es nuevo | Qué te toca hacer |
| --- | --- | --- |
| La colina | Nada todavía: presentación de Angie | Tocar para pasar cada globo |
| Prólogo (líneas) | La historia: vuelven a casa, la anomalía, Angie | Mirar |
| Minijuego · Duplicar la velocidad | Qué hace `map` (frente a los otros dos) | Elegir el operador del hueco y accionar |
| Minijuego · Ver la velocidad | Qué hace `tap` (frente a los otros dos) | Elegir el operador del hueco y accionar |
| Minijuego · Sacar el agua | Qué hace `filter` (frente a los otros dos) | Elegir el operador del hueco y accionar |
| Manual 1 · html-to-tree | El HTML es un árbol de nodos. | la demo |
| Manual 2 · dom-is-alive | El DOM está vivo. | la demo |
| Manual 3 · dom-to-pixel | No todo cambio cuesta lo mismo. | la demo |
| Manual 4 · manual-sync-pain | A mano, te olvidás un lugar. | la demo |
| Manual 5 · old-change-detection | Zone.js revisa todo el árbol. | la demo |
| 0/6 · signals-change-detection | El signal avisa quién lo lee. | la demo |
| 1/1 | Variables (repaso pre-signals) | Elegí un tipo y después un valor de ejemplo. · «cambiar» con la perilla |
| 1/2 | Qué es un signal | Clickeá las cajitas para convertirlas en contenedores. · «cambiar el valor» con la perilla |
| 1/3 | Tipos de signal | Tocá cada tipo para ver cómo se crea. · «escribir» con la perilla |
| 1/4 | Leer un signal: el getter () | «leer» con la perilla |
| 1/5 | Writable Signal | Escribí un número y tocá Set. · «sumar uno» con la perilla |
| 1/6 | Update Signal | Tocá Incrementar varias veces. · «sumar uno» con la perilla |
| 1/7 | Read-only signals: asReadonly() | Incrementá (interno) y reseteá. · «escribir desde afuera» con la perilla |
| 2/1 | Computed signals | Escribí en Name y Surname. · «cambiar el precio» con la perilla |
| 2/2 | Dependencias dinámicas | Cambiá ShowCount e incrementá Count. · «cambiar la rama muerta» con la perilla |
| 2/3 | Perezoso y memoizado | Editá los campos del formulario. · «leer el total» con la perilla |
| 3/1 | Dependencias del effect | Tocá Count2. Count1 late solo con las animaciones activas. · «count +1» con la perilla |
| 3/2 | Intervalo filtrado | Prendé el intervalo y después destruí al hijo. · «destruir el componente» con la perilla |
| 3/3 | Limpieza con onCleanup | Prendé el intervalo y después destruí al hijo. · «prender y apagar» con la perilla |
| 4/1 | Igualdad por defecto (Object.is) | Probá los tres botones y mirá el contador de notificaciones. · «renombrar» con la perilla |
| 4/2 | Función equal custom | Tocá 'Mismo name' varias veces y comparalo con el sub-nivel 1. · «recargar lo mismo» con la perilla |
| 5/1 | linkedSignal: reinicio con la fuente | Elegí una opción y después cambiá la lista. · «cambiar de categoría» con la perilla |
| 5/2 | linkedSignal: preservar si sigue válida | Elegí una opción y cambiá la lista. · «recargar la lista» con la perilla |
| 6/1 | resource(): loader con Promise | Elegí un usuario (el #4 no existe). · «buscar otra cosa» con la perilla |
| 6/2 | rxResource(): stream de RxJS | Elegí un usuario (el #4 no existe). · «cambiar el filtro» con la perilla |
| 6/3 | httpResource(): pedir por URL | «pedir el siguiente» con la perilla |
| 7/1 | input() y output() basados en signals | Tocá el contador y cambiá el paso del input. · «cambiar desde el padre» con la perilla |
| 7/2 | model(): binding two-way con [(value)] | Tocá las estrellas o reseteá desde el padre. · «editar en el hijo» con la perilla |
| 7/3 | input.required() y transform | Sumá al contador y alterná el resaltado. · «usar sin pasarlo» con la perilla |
| 7/4 | Formularios con signals | «editar el correo» con la perilla |
| 7/5 | Reglas que reaccionan | «cambiar el modo» con la perilla |
| 7/6 | Transmitir con submit() | «transmitir ya» con la perilla |
| 8/1 | viewChild() como signal | Escribí y usá Enfocar / Limpiar. · «montar» con la perilla |
| 8/2 | toSignal() · toObservable() · untracked() | Tocá count+1, base+1 y multiplier+1. · «cambiar el auxiliar» con la perilla |
| 8/3 | viewChildren() como signal | Agregá y quitá nombres. · «agregar una fila» con la perilla |
| 8/4 | contentChild() y contentChildren() | Agregá y quitá tags. · «proyectar dos items» con la perilla |
| 9/1 | afterRenderEffect(): medir el DOM | Editá el texto del campo. · «sumar una fila» con la perilla |
| 9/2 | effect((onCleanup) => …) | Prendé y apagá el cronómetro varias veces. · «cambiar de panel» con la perilla |
| 10/1 | Debounce con RxJS | Escribí rápido en el buscador. · «tipear una letra» con la perilla |
| 10/2 | Debounce a mano (effect + onCleanup) | Escribí rápido y después frená. · «tipear una letra» con la perilla |
| 10/3 | debounced() nativo | «tipear una letra» con la perilla |
| 11/1 | Change detection sin Zone.js | Incrementá el contador. · «cambiar un valor» con la perilla |
| Revelación | Quien espera sabe cómo termina el mensaje. | Mirar |
| Final | No se escapa de un mundo: se lo entiende. | Mirar |

## Líneas sin voz grabada

`anom-grito`
