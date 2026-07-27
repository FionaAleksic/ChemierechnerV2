export function formatTime(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  const parts = [];

  if (hours > 0) parts.push(`${hours} h`);
  if (minutes > 0) parts.push(`${minutes} min`);
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds} s`);

  return parts.join(' ');
}

export function formatPrice(amount, currencySymbol = '$') {
  const value = Number(amount) || 0;
  return `${currencySymbol}${value.toLocaleString('de-DE')}`;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function clearElement(element) {
  while (element.firstChild) element.removeChild(element.firstChild);
}

function appendCell(row, text, className = '') {
  const cell = document.createElement('td');
  cell.textContent = text;
  if (className) cell.className = className;
  row.appendChild(cell);
}

function createTreeNode(node, recipeIndex, rawMaterials, currencySymbol) {
  const wrapper = document.createElement('li');
  wrapper.className = `tree-entry tree-entry--${node.type}`;

  const line = document.createElement('div');
  line.className = 'tree-line';

  if (node.type === 'raw') {
    const material = rawMaterials[node.itemId] || { name: node.itemId, price: null };
    line.innerHTML = `
      <span class="tree-name"></span>
      <span class="tree-meta"></span>
    `;
    line.querySelector('.tree-name').textContent = material.name;
    line.querySelector('.tree-meta').textContent = `${node.amount} Stück${material.price == null ? ' · Preis fehlt' : ` · ${formatPrice(material.price * node.amount, currencySymbol)}`}`;
    wrapper.appendChild(line);
    return wrapper;
  }

  const recipe = recipeIndex.get(node.recipeId);
  const neededText = node.amountNeededByParent == null
    ? ''
    : ` · benötigt: ${node.amountNeededByParent}`;

  line.innerHTML = `
    <span class="tree-name"></span>
    <span class="tree-meta"></span>
  `;
  line.querySelector('.tree-name').textContent = recipe?.name || node.name;
  line.querySelector('.tree-meta').textContent =
    `${node.craftCount} Herstellung(en) · ${node.processCount} Prozess(e) · ${formatTime(node.durationSeconds)} · Output ${node.producedAmount}${neededText}`;
  wrapper.appendChild(line);

  if (node.children.length > 0) {
    const list = document.createElement('ul');
    node.children.forEach((child) => {
      list.appendChild(createTreeNode(child, recipeIndex, rawMaterials, currencySymbol));
    });
    wrapper.appendChild(list);
  }

  return wrapper;
}

export function renderRecipeOptions(select, recipes, selectedId, filter = '') {
  const normalizedFilter = filter.trim().toLocaleLowerCase('de');
  const filteredRecipes = recipes
    .filter((recipe) => recipe.name.toLocaleLowerCase('de').includes(normalizedFilter))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));

  clearElement(select);

  filteredRecipes.forEach((recipe) => {
    const option = document.createElement('option');
    option.value = recipe.id;
    option.textContent = recipe.name;
    select.appendChild(option);
  });

  if (filteredRecipes.some((recipe) => recipe.id === selectedId)) {
    select.value = selectedId;
  }

  return filteredRecipes;
}

export function renderResult(result, recipeIndex, rawMaterials, currencySymbol) {
  const { recipe, stage, tree, costs, totalDurationSeconds, totalXp, profit } = result;

  setText('resultProduct', recipe.name);
  setText('outputAmount', stage.normalizedAmount);
  setText('craftCount', stage.craftCount);
  setText('processCount', stage.processCount);
  setText('stageTime', formatTime(stage.durationSeconds));
  setText('totalTime', formatTime(totalDurationSeconds));
  setText('stageXp', stage.xp.toLocaleString('de-DE'));
  setText('totalXp', totalXp.toLocaleString('de-DE'));
  setText('materialCost', formatPrice(costs.total, currencySymbol));

  /*setText(
    'batchExplanation',
    `Ein Prozess fasst bis zu ${stage.craftsPerProcess} Herstellungen. ` +
      `${stage.craftCount} Herstellungen benötigen daher ${stage.processCount} Prozess(e) ` +
      `zu je ${formatTime(stage.secondsPerProcess)}.`,
  );*/

  setText(
    'outputExplanation',
    `${stage.craftCount} × ${stage.outputPerCraft} Stück = ${stage.normalizedAmount} Endprodukte`,
  );

  const directIngredientsTable = document.getElementById('directIngredientsTable');
  clearElement(directIngredientsTable);
  recipe.ingredients.forEach((ingredient) => {
    const row = document.createElement('tr');
    const subRecipe = recipeIndex.get(ingredient.itemId);
    const rawMaterial = rawMaterials[ingredient.itemId];
    appendCell(row, subRecipe?.name || rawMaterial?.name || ingredient.itemId);
    appendCell(row, String(ingredient.amountPerCraft));
    appendCell(row, String(ingredient.amountPerCraft * stage.craftCount), 'numeric');
    directIngredientsTable.appendChild(row);
  });

  const rawMaterialsTable = document.getElementById('rawMaterialsTable');
  clearElement(rawMaterialsTable);
  costs.items.forEach((item) => {
    const row = document.createElement('tr');
    appendCell(row, item.name);
    appendCell(row, String(item.amount), 'numeric');
    appendCell(row, item.unitPrice == null ? 'nicht eingetragen' : formatPrice(item.unitPrice, currencySymbol), 'numeric');
    appendCell(row, item.lineTotal == null ? '—' : formatPrice(item.lineTotal, currencySymbol), 'numeric');
    rawMaterialsTable.appendChild(row);
  });

  const priceWarning = document.getElementById('priceWarning');
  priceWarning.hidden = !costs.hasUnknownPrices;

  const productionTree = document.getElementById('productionTree');
  clearElement(productionTree);
  productionTree.appendChild(createTreeNode(tree, recipeIndex, rawMaterials, currencySymbol));

  const revenue = document.getElementById('revenue');
  const profitElement = document.getElementById('profit');
  const margin = document.getElementById('margin');
  const profitHint = document.getElementById('profitHint');

  profitElement.classList.remove('value-positive', 'value-negative');

  if (!profit) {
    revenue.textContent = '—';
    profitElement.textContent = '—';
    margin.textContent = '—';
    profitHint.textContent = 'Verkaufspreis eintragen, um Erlös und Gewinn zu berechnen.';
  } else {
    revenue.textContent = formatPrice(profit.revenue, currencySymbol);
    profitElement.textContent = formatPrice(profit.profit, currencySymbol);
    margin.textContent = `${profit.margin.toFixed(1)} %`;
    profitElement.classList.add(profit.profit >= 0 ? 'value-positive' : 'value-negative');
    profitHint.textContent = costs.hasUnknownPrices
      ? 'Der Gewinn verwendet nur Rohstoffe mit eingetragenem Preis.'
      : `${stage.normalizedAmount} Stück × ${formatPrice(profit.sellPrice, currencySymbol)}`;
  }
}

export function renderRecipeDatabase(recipes) {
  const table = document.getElementById('recipeDatabaseTable');
  clearElement(table);

  [...recipes]
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
    .forEach((recipe) => {
      const row = document.createElement('tr');
      appendCell(row, recipe.name);
      appendCell(row, String(recipe.crafting.outputPerCraft), 'numeric');
      appendCell(row, String(recipe.crafting.craftsPerProcess), 'numeric');
      appendCell(row, formatTime(recipe.crafting.secondsPerProcess), 'numeric');
      appendCell(row, String(recipe.xpPerCraft), 'numeric');
      appendCell(row, String(recipe.level), 'numeric');
      appendCell(row, recipe.quality ? 'Ja' : 'Nein');
      table.appendChild(row);
    });

  setText('recipeCount', `${recipes.length} Rezepte`);
}

export function buildCopyText(result, rawMaterials, currencySymbol) {
  const { recipe, stage, costs, totalDurationSeconds, totalXp, profit } = result;
  const lines = [
    'Chemie-Rechner',
    `Produkt: ${recipe.name}`,
    `Endprodukte: ${stage.normalizedAmount}`,
    `Herstellungen: ${stage.craftCount}`,
    `Prozesse: ${stage.processCount} (max. ${stage.craftsPerProcess} Herstellungen pro Prozess)`,
    `Zeit Endprodukt: ${formatTime(stage.durationSeconds)}`,
    `Gesamtzeit aller Stufen: ${formatTime(totalDurationSeconds)}`,
    `XP Endprodukt: ${stage.xp}`,
    `XP aller Stufen: ${totalXp}`,
    '',
    'Rohstoffe:',
  ];

  costs.items.forEach((item) => {
    const priceText = item.lineTotal == null
      ? 'Preis nicht eingetragen'
      : formatPrice(item.lineTotal, currencySymbol);
    lines.push(`- ${item.name}: ${item.amount} (${priceText})`);
  });

  lines.push('', `Materialkosten: ${formatPrice(costs.total, currencySymbol)}`);

  if (profit) {
    lines.push(`Erlös: ${formatPrice(profit.revenue, currencySymbol)}`);
    lines.push(`Gewinn: ${formatPrice(profit.profit, currencySymbol)} (${profit.margin.toFixed(1)} %)`);
  }

  return lines.join('\n');
}
