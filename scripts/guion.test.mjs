import { test } from 'node:test';
import assert from 'node:assert/strict';
import { armarGuion, TRAMOS } from './guion.mjs';

// One bundle for every assertion: building the skeleton compiles a dozen TypeScript modules.
const entero = armarGuion();

test('the whole journey lists every stretch in play order', async () => {
  const md = await entero;
  const titulos = [...md.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.equal(titulos[0], 'La colina');
  assert.equal(titulos[1], 'El prólogo');
  assert.ok(titulos.indexOf('La revelación') < titulos.indexOf('El final'));
  for (let cap = 1; cap <= 11; cap++) {
    assert.ok(
      titulos.some((t) => t.startsWith(`${cap} · `)),
      `chapter ${cap} is missing`,
    );
  }
});

test('every knob challenge has a solution', async () => {
  assert.doesNotMatch(await entero, /no tiene solución/);
});

test('a stretch keeps only its stages', async () => {
  const md = await armarGuion({ desde: '5', hasta: '5' });
  assert.match(md, /^## 5 · /m);
  assert.doesNotMatch(md, /^## (La colina|El prólogo|4 · |6 · )/m);
});

test('an unknown stretch key fails with the valid ones', async () => {
  await assert.rejects(armarGuion({ desde: 'nope' }), new RegExp(TRAMOS.join(', ')));
});
