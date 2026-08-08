import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { CEILING, countProse, nextBaseline, offenders } from './prose-budget.mjs';

test('cuenta la prosa visible', () => {
  assert.equal(countProse('<p>Elegí qué tocaste.</p>'), 3);
});

test('no cuenta el código: es el material, no la explicación', () => {
  assert.equal(countProse('<p>Mirá esto.</p><app-code [lines]="l()"></app-code>'), 2);
  assert.equal(countProse('<pre>const c = count();</pre>'), 0);
});

test('no cuenta interpolaciones: son datos que cambian, no texto que se lee', () => {
  assert.equal(countProse('<p>{{ nombre() }} cambió</p>'), 1);
});

test('no cuenta el markup ni los comentarios del template', () => {
  assert.equal(
    countProse('<!-- nota para el que edita -->\n<div class="algo"><span></span></div>'),
    0,
  );
});

test('no cuenta la sintaxis de control flow', () => {
  assert.equal(countProse('@if (listo()) {<p>Ya está</p>}'), 2);
});

test('no cuenta las etiquetas de control: son verbos, no explicación', () => {
  assert.equal(countProse('<p>Mirá.</p><button class="x">Reiniciar el DOM</button>'), 1);
});

test('una pantalla nueva nace cumpliendo el techo', () => {
  const nueva = [{ screen: 'nueva.html', words: CEILING + 1 }];
  assert.equal(offenders(nueva, {}).length, 1);
});

test('una pantalla con deuda conocida no falla mientras no empeore', () => {
  const vieja = [{ screen: 'vieja.html', words: 60 }];
  assert.deepEqual(offenders(vieja, { 'vieja.html': 60 }), []);
});

test('falla apenas una pantalla con deuda empeora', () => {
  const peor = [{ screen: 'vieja.html', words: 61 }];
  assert.equal(offenders(peor, { 'vieja.html': 60 }).length, 1);
});

test('bajar por debajo del techo no rompe nada', () => {
  const mejor = [{ screen: 'vieja.html', words: 4 }];
  assert.deepEqual(offenders(mejor, { 'vieja.html': 60 }), []);
});

test('cuenta la prosa que se pasa por atributo: es lo que el usuario lee en la tarjeta', () => {
  const html = '<app-layout concept="El valor se preserva si sigue siendo válido." />';
  assert.equal(countProse(html), 8);
});

test('suma los tres atributos de la tarjeta, no solo uno', () => {
  const html = '<app-layout concept="Uno dos." action="Tres cuatro." observe="Cinco seis." />';
  assert.equal(countProse(html), 6);
});

test('el título no es prosa: es sustantivo para navegar', () => {
  assert.equal(countProse('<app-layout title="linkedSignal con fuente" />'), 0);
});

test('un binding no es prosa: es una expresión, no texto que se lee', () => {
  assert.equal(countProse('<app-layout [concept]="textoDelConcepto()" />'), 0);
});

test('la prosa del atributo no se cuenta dos veces', () => {
  assert.equal(countProse('<app-layout concept="Una dos tres." />'), 3);
});

test('un > dentro de un atributo no rompe el borrado del markup', () => {
  // El contador cortaba la etiqueta en ese `>` y contaba el resto como prosa.
  assert.equal(countProse('<app-l concept="una dos tres" /><p>cuatro cinco</p>'), 5);
  assert.equal(countProse('<app-l concept="una => dos tres" /><p>cuatro cinco</p>'), 5);
});

test('los nombres de clase no son prosa', () => {
  assert.equal(countProse('<div class="text-red-500 font-bold">x</div>'), 1);
  assert.equal(countProse('<div title="a > b" class="text-red-500 font-bold">x</div>'), 1);
});

test('una pantalla renombrada no blanquea su deuda: estrena con el techo, no con su conteo', () => {
  const renombrada = [{ screen: 'nuevo-nombre.html', words: 60 }];
  assert.deepEqual(nextBaseline(renombrada, { 'viejo-nombre.html': 60 }), {
    'nuevo-nombre.html': CEILING,
  });
});

test('una pantalla ya conocida solo puede bajar su línea base', () => {
  assert.deepEqual(nextBaseline([{ screen: 'v.html', words: 40 }], { 'v.html': 60 }), {
    'v.html': 40,
  });
  assert.deepEqual(nextBaseline([{ screen: 'v.html', words: 80 }], { 'v.html': 60 }), {
    'v.html': 60,
  });
});
