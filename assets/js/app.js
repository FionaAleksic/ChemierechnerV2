import { rawMaterials, recipes, settings } from './data/catalog.js';
import { calculateRecipe, createRecipeIndex } from './core/calculator.js';
import {
  buildCopyText,
  renderRecipeDatabase,
  renderRecipeOptions,
  renderResult,
} from './ui/render.js';

const recipeIndex = createRecipeIndex(recipes);
const elements = {
  search: document.getElementById('search'),
  recipe: document.getElementById('recipeSelect'),
  amount: document.getElementById('amount'),
  sellPrice: document.getElementById('sellPrice'),
  copyButton: document.getElementById('copyButton'),
  copyStatus: document.getElementById('copyStatus'),
};

function getSelectedRecipe() {
  return recipeIndex.get(elements.recipe.value) || recipes[0];
}

function saveState() {
  localStorage.setItem('chemie-rechner.recipe', elements.recipe.value);
  localStorage.setItem('chemie-rechner.amount', elements.amount.value);
  localStorage.setItem('chemie-rechner.sellPrice', elements.sellPrice.value);
}

function restoreState() {
  return {
    recipeId: localStorage.getItem('chemie-rechner.recipe') || recipes[0]?.id,
    amount: localStorage.getItem('chemie-rechner.amount') || '3',
    sellPrice: localStorage.getItem('chemie-rechner.sellPrice') || settings.defaultSellPrice,
  };
}

function calculate({ normalizeInput = false } = {}) {
  const recipe = getSelectedRecipe();
  const result = calculateRecipe(
    recipe,
    elements.amount.value,
    recipeIndex,
    rawMaterials,
    elements.sellPrice.value,
  );

  if (normalizeInput) {
    elements.amount.value = result.stage.normalizedAmount;
  }

  renderResult(result, recipeIndex, rawMaterials, settings.currencySymbol);
  saveState();
  return result;
}

function updateRecipeList() {
  const selectedBeforeFilter = elements.recipe.value;
  const matches = renderRecipeOptions(
    elements.recipe,
    recipes,
    selectedBeforeFilter,
    elements.search.value,
  );

  if (matches.length === 0) {
    elements.recipe.disabled = true;
    elements.copyButton.disabled = true;
    return;
  }

  elements.recipe.disabled = false;
  elements.copyButton.disabled = false;
  calculate();
}

async function copyResult() {
  const result = calculate({ normalizeInput: true });
  const text = buildCopyText(result, rawMaterials, settings.currencySymbol);

  try {
    await navigator.clipboard.writeText(text);
    elements.copyStatus.textContent = 'Produktionsliste wurde kopiert.';
  } catch {
    window.prompt('Produktionsliste kopieren:', text);
    elements.copyStatus.textContent = 'Kopieren über Browser-Dialog geöffnet.';
  }

  window.setTimeout(() => {
    elements.copyStatus.textContent = '';
  }, 2500);
}

function registerEvents() {
  elements.search.addEventListener('input', updateRecipeList);
  elements.recipe.addEventListener('change', () => calculate({ normalizeInput: true }));
  elements.amount.addEventListener('input', () => calculate());
  elements.amount.addEventListener('blur', () => calculate({ normalizeInput: true }));
  elements.sellPrice.addEventListener('input', () => calculate());
  elements.copyButton.addEventListener('click', copyResult);
}

function init() {
  const state = restoreState();
  renderRecipeOptions(elements.recipe, recipes, state.recipeId);
  elements.amount.value = state.amount;
  elements.sellPrice.value = state.sellPrice;
  renderRecipeDatabase(recipes);
  registerEvents();
  calculate({ normalizeInput: true });
}

init();
