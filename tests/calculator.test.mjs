import test from 'node:test';
import assert from 'node:assert/strict';
import { rawMaterials, recipes } from '../assets/js/data/catalog.js';
import {
  calculateCraftStage,
  calculateRecipe,
  createRecipeIndex,
} from '../assets/js/core/calculator.js';

const recipeIndex = createRecipeIndex(recipes);
const adrenaline = recipeIndex.get('adrenalin-spritze');

test('1 bis 5 Adrenalin-Crafts benötigen nur einen Prozess', () => {
  assert.equal(calculateCraftStage(adrenaline, 3).durationSeconds, 15);
  assert.equal(calculateCraftStage(adrenaline, 15).durationSeconds, 15);
});

test('6 Adrenalin-Crafts benötigen zwei Prozesse', () => {
  const result = calculateCraftStage(adrenaline, 18);
  assert.equal(result.craftCount, 6);
  assert.equal(result.processCount, 2);
  assert.equal(result.durationSeconds, 30);
});

test('unvollständige Endproduktmenge wird auf Craft-Output aufgerundet', () => {
  const result = calculateCraftStage(adrenaline, 16);
  assert.equal(result.normalizedAmount, 18);
  assert.equal(result.craftCount, 6);
});

test('Parallelität kann pro Rezept unterschiedlich sein', () => {
  const customRecipe = {
    ...adrenaline,
    crafting: { ...adrenaline.crafting, craftsPerProcess: 2 },
  };
  const result = calculateCraftStage(customRecipe, 9);
  assert.equal(result.craftCount, 3);
  assert.equal(result.processCount, 2);
  assert.equal(result.durationSeconds, 30);
});

test('Unterrezepte und Rohstoffe werden korrekt berechnet', () => {
  const result = calculateRecipe(adrenaline, 18, recipeIndex, rawMaterials, '10000');
  const raw = Object.fromEntries(result.rawMaterialAmounts);

  assert.equal(raw.adrenalin, 6);
  assert.equal(raw.natriumchlorid, 2);
  assert.equal(raw['destilliertes-wasser'], 2);
  assert.equal(result.stage.durationSeconds, 30);
  assert.equal(result.totalDurationSeconds, 38);
});
