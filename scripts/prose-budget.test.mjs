import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { CEILING, countProse, offenders } from './prose-budget.mjs';

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
