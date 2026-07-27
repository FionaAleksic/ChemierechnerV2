export function createRecipeIndex(recipes) {
  return new Map(recipes.map((recipe) => [recipe.id, recipe]));
}

export function parsePositiveInteger(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function normalizeRequestedAmount(requestedAmount, outputPerCraft) {
  const output = parsePositiveInteger(outputPerCraft, 1);
  const requested = parsePositiveInteger(requestedAmount, output);
  return Math.ceil(requested / output) * output;
}

export function calculateCraftStage(recipe, requestedAmount) {
  const outputPerCraft = parsePositiveInteger(recipe.crafting?.outputPerCraft, 1);
  const secondsPerProcess = parsePositiveInteger(recipe.crafting?.secondsPerProcess, 1);
  const craftsPerProcess = parsePositiveInteger(recipe.crafting?.craftsPerProcess, 1);
  const normalizedAmount = normalizeRequestedAmount(requestedAmount, outputPerCraft);
  const craftCount = Math.ceil(normalizedAmount / outputPerCraft);
  const processCount = Math.ceil(craftCount / craftsPerProcess);

  return {
    requestedAmount: parsePositiveInteger(requestedAmount, outputPerCraft),
    normalizedAmount,
    craftCount,
    processCount,
    outputPerCraft,
    craftsPerProcess,
    secondsPerProcess,
    durationSeconds: processCount * secondsPerProcess,
    xp: craftCount * (Number(recipe.xpPerCraft) || 0),
  };
}

export function buildProductionTree(recipeId, craftCount, recipeIndex, stack = new Set()) {
  const recipe = recipeIndex.get(recipeId);

  if (!recipe) {
    throw new Error(`Unbekanntes Rezept: ${recipeId}`);
  }

  if (stack.has(recipeId)) {
    throw new Error(`Zyklische Rezeptabhängigkeit bei: ${recipe.name}`);
  }

  const nextStack = new Set(stack);
  nextStack.add(recipeId);

  const outputPerCraft = parsePositiveInteger(recipe.crafting?.outputPerCraft, 1);
  const craftsPerProcess = parsePositiveInteger(recipe.crafting?.craftsPerProcess, 1);
  const secondsPerProcess = parsePositiveInteger(recipe.crafting?.secondsPerProcess, 1);
  const processCount = Math.ceil(craftCount / craftsPerProcess);

  const children = (recipe.ingredients || []).map((ingredient) => {
    const amountNeeded = ingredient.amountPerCraft * craftCount;
    const subRecipe = recipeIndex.get(ingredient.itemId);

    if (!subRecipe) {
      return {
        type: 'raw',
        itemId: ingredient.itemId,
        amount: amountNeeded,
      };
    }

    const subOutput = parsePositiveInteger(subRecipe.crafting?.outputPerCraft, 1);
    const subCraftCount = Math.ceil(amountNeeded / subOutput);
    const child = buildProductionTree(
      ingredient.itemId,
      subCraftCount,
      recipeIndex,
      nextStack,
    );

    return {
      ...child,
      amountNeededByParent: amountNeeded,
    };
  });

  return {
    type: 'recipe',
    recipeId,
    name: recipe.name,
    craftCount,
    processCount,
    outputPerCraft,
    producedAmount: craftCount * outputPerCraft,
    craftsPerProcess,
    secondsPerProcess,
    durationSeconds: processCount * secondsPerProcess,
    xp: craftCount * (Number(recipe.xpPerCraft) || 0),
    children,
  };
}

export function collectRawMaterials(node, result = new Map()) {
  if (node.type === 'raw') {
    result.set(node.itemId, (result.get(node.itemId) || 0) + node.amount);
    return result;
  }

  node.children.forEach((child) => collectRawMaterials(child, result));
  return result;
}

export function sumRecipeMetric(node, key) {
  if (node.type !== 'recipe') {
    return 0;
  }

  return node[key] + node.children.reduce(
    (sum, child) => sum + sumRecipeMetric(child, key),
    0,
  );
}

export function calculateCostSummary(rawMaterialAmounts, rawMaterials) {
  const items = [...rawMaterialAmounts.entries()]
    .map(([itemId, amount]) => {
      const material = rawMaterials[itemId] || { name: itemId, price: null };
      const lineTotal = material.price == null ? null : material.price * amount;

      return {
        itemId,
        name: material.name,
        amount,
        unitPrice: material.price,
        lineTotal,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));

  return {
    items,
    total: items.reduce((sum, item) => sum + (item.lineTotal || 0), 0),
    hasUnknownPrices: items.some((item) => item.unitPrice == null),
  };
}

export function calculateProfit(totalCost, outputAmount, sellPrice) {
  const parsedPrice = Number.parseInt(sellPrice, 10);

  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return null;
  }

  const revenue = parsedPrice * outputAmount;
  const profit = revenue - totalCost;

  return {
    sellPrice: parsedPrice,
    revenue,
    profit,
    margin: revenue === 0 ? 0 : (profit / revenue) * 100,
  };
}

export function calculateRecipe(recipe, requestedAmount, recipeIndex, rawMaterials, sellPrice) {
  const stage = calculateCraftStage(recipe, requestedAmount);
  const tree = buildProductionTree(recipe.id, stage.craftCount, recipeIndex);
  const rawMaterialAmounts = collectRawMaterials(tree);
  const costs = calculateCostSummary(rawMaterialAmounts, rawMaterials);

  return {
    recipe,
    stage,
    tree,
    rawMaterialAmounts,
    costs,
    totalDurationSeconds: sumRecipeMetric(tree, 'durationSeconds'),
    totalXp: sumRecipeMetric(tree, 'xp'),
    profit: calculateProfit(costs.total, stage.normalizedAmount, sellPrice),
  };
}
