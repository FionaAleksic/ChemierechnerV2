// ======================================================
// FiveM Chemie Rechner
// Version 3.0
// ======================================================

class ChemieRechner {

    constructor() {

        this.search = document.getElementById("search");
        this.recipeSelect = document.getElementById("recipeSelect");
        this.amount = document.getElementById("amount");
        this.sellPrice = document.getElementById("sellPrice");
        this.calculateButton = document.getElementById("calculate");
        this.copyButton = document.getElementById("copyList");

        this.output = document.getElementById("outputAmount");
        this.xp = document.getElementById("xpAmount");
        this.time = document.getElementById("timeAmount");
        this.glasses = document.getElementById("glassCount");
        this.statMaterialCost = document.getElementById("statMaterialCost");
        this.statRevenue = document.getElementById("statRevenue");
        this.statProfit = document.getElementById("statProfit");
        this.compareCost = document.getElementById("compareCost");
        this.compareRevenue = document.getElementById("compareRevenue");
        this.compareProfit = document.getElementById("compareProfit");
        this.profitHint = document.getElementById("profitHint");
        this.profitCompare = document.getElementById("profitCompare");

        this.ingredientTable = document.getElementById("ingredientTable");
        this.productionTree = document.getElementById("productionTree");
        this.rawMaterialTable = document.getElementById("rawMaterialTable");
        this.costTable = document.getElementById("costTable");
        this.totalCost = document.getElementById("totalCost");
        this.recipeDatabaseTable = document.getElementById("recipeDatabaseTable");
        this.recipeCount = document.getElementById("recipeCount");

        this.DEFAULT_OUTPUT = 3;
        this.MAX_GLASSES = 5;
        this.GLASS_SIZE = 10;
        this.recipeMap = new Map();
        this.lastResult = null;

        this.init();

    }

    init() {

        this.buildRecipeMap();
        this.loadRecipes();
        this.renderRecipeDatabase();
        this.restoreLastRecipe();
        this.registerEvents();
        this.calculate();

    }

    buildRecipeMap() {

        this.recipeMap.clear();

        recipes.forEach(recipe => {
            this.recipeMap.set(recipe.name, recipe);
        });

    }

    registerEvents() {

        if (this.search) {
            this.search.addEventListener("input", () => {
                this.filterRecipes(this.search.value);
            });
        }

        if (this.recipeSelect) {
            this.recipeSelect.addEventListener("change", () => {
                this.saveRecipe();
                this.calculate();
            });
        }

        if (this.amount) {
            this.amount.addEventListener("input", () => {
                this.calculate({ normalize: false });
            });

            this.amount.addEventListener("blur", () => {
                this.calculate({ normalize: true });
            });
        }

        if (this.sellPrice) {
            this.sellPrice.addEventListener("input", () => {
                this.saveSellPrice();
                this.calculate({ normalize: false });
            });

            this.sellPrice.addEventListener("blur", () => {
                this.calculate({ normalize: true });
            });
        }

        if (this.calculateButton) {
            this.calculateButton.addEventListener("click", () => {
                this.calculate({ normalize: true });
            });
        }

        if (this.copyButton) {
            this.copyButton.addEventListener("click", () => {
                this.copyProductionList();
            });
        }

    }

    getSortedRecipes(filterText = "") {

        return recipes
            .filter(recipe =>
                recipe.name
                    .toLowerCase()
                    .includes(filterText.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name));

    }

    loadRecipes() {

        if (!this.recipeSelect) {
            return;
        }

        this.recipeSelect.innerHTML = "";

        this.getSortedRecipes().forEach(recipe => {
            const option = document.createElement("option");
            option.value = recipe.id;
            option.textContent = recipe.name;
            this.recipeSelect.appendChild(option);
        });

    }

    filterRecipes(text) {

        if (!this.recipeSelect) {
            return;
        }

        this.recipeSelect.innerHTML = "";

        this.getSortedRecipes(text).forEach(recipe => {
            const option = document.createElement("option");
            option.value = recipe.id;
            option.textContent = recipe.name;
            this.recipeSelect.appendChild(option);
        });

        if (this.recipeSelect.options.length > 0) {
            this.recipeSelect.selectedIndex = 0;
            this.saveRecipe();
            this.calculate();
        }

    }

    getRecipe() {

        const id = Number(this.recipeSelect.value);
        return recipes.find(recipe => recipe.id === id);

    }

    roundUpToStep(value, step = 3) {

        const parsed = parseInt(value, 10);

        if (isNaN(parsed) || parsed < 1) {
            return step;
        }

        if (parsed <= step) {
            return step;
        }

        return Math.ceil(parsed / step) * step;

    }

    normalizeAmount(value) {

        return this.roundUpToStep(value, this.DEFAULT_OUTPUT);

    }

    getCraftRuns(wanted, output) {

        return Math.ceil(wanted / output);

    }

    getDurchlaeufe(wanted) {

        // Pro Becherglas passen bis zu GLASS_SIZE (10) Endprodukte
        return Math.ceil(wanted / this.GLASS_SIZE);

    }

    calculate(options = { normalize: true }) {

        const recipe = this.getRecipe();

        if (!recipe) {
            console.warn("Kein Rezept gefunden.");
            return;
        }

        const rawValue = this.amount.value;
        const wanted = this.normalizeAmount(rawValue);

        if (options.normalize) {
            this.amount.value = wanted;
        }

        const output = recipe.output || this.DEFAULT_OUTPUT;
        const craftRuns = this.getCraftRuns(wanted, output);
        const durchlaeufe = this.getDurchlaeufe(wanted);
        const realOutput = craftRuns * output;
        const totalXP = craftRuns * recipe.xp;
        const totalTime = craftRuns * recipe.time;

        this.output.textContent = realOutput;
        this.xp.textContent = totalXP;
        this.time.textContent = this.formatTime(totalTime);
        this.glasses.textContent = durchlaeufe;

        const tree = this.buildProductionTree(recipe.name, craftRuns);
        const rawMaterials = this.collectRawMaterials(tree);

        this.renderIngredients(recipe, craftRuns);
        this.renderProductionTree(tree);
        this.renderRawMaterials(rawMaterials);

        const costSummary = this.calculateCostSummary(rawMaterials);
        this.renderCosts(costSummary);
        this.renderProfitSummary(costSummary, realOutput);

        this.lastResult = {
            recipe,
            wanted,
            craftRuns,
            durchlaeufe,
            realOutput,
            totalXP,
            totalTime,
            tree,
            rawMaterials,
            costSummary,
            profitSummary: this.getProfitSummary(costSummary.total, realOutput)
        };

    }

    buildProductionTree(recipeName, runs, visited = new Set()) {

        const recipe = this.recipeMap.get(recipeName);

        if (!recipe || visited.has(recipeName)) {
            return {
                name: recipeName,
                runs: 0,
                isRecipe: false,
                children: []
            };
        }

        visited.add(recipeName);

        const output = recipe.output || this.DEFAULT_OUTPUT;
        const children = (recipe.ingredients || []).map(ingredient => {
            const needed = ingredient.amount * runs;
            const subRecipe = this.recipeMap.get(ingredient.name);

            if (subRecipe && ingredient.name !== recipeName) {
                const subRuns = Math.ceil(needed / (subRecipe.output || this.DEFAULT_OUTPUT));
                return this.buildProductionTree(ingredient.name, subRuns, new Set(visited));
            }

            return {
                name: ingredient.name,
                runs: needed,
                isRecipe: false,
                children: []
            };
        });

        visited.delete(recipeName);

        return {
            name: recipeName,
            runs,
            isRecipe: true,
            children
        };

    }

    collectRawMaterials(node, materials = new Map()) {

        if (!node.isRecipe) {
            materials.set(node.name, (materials.get(node.name) || 0) + node.runs);
            return materials;
        }

        node.children.forEach(child => {
            this.collectRawMaterials(child, materials);
        });

        return materials;

    }

    renderIngredients(recipe, runs) {

        if (!this.ingredientTable) {
            return;
        }

        this.ingredientTable.innerHTML = "";

        if (!recipe.ingredients || recipe.ingredients.length === 0) {
            this.ingredientTable.innerHTML =
                "<tr><td colspan=\"2\">Keine Zutaten definiert.</td></tr>";
            return;
        }

        recipe.ingredients.forEach(item => {
            const row = document.createElement("tr");
            const nameCell = document.createElement("td");
            const amountCell = document.createElement("td");

            nameCell.textContent = item.name;
            amountCell.textContent = item.amount * runs;

            row.appendChild(nameCell);
            row.appendChild(amountCell);
            this.ingredientTable.appendChild(row);
        });

    }

    renderProductionTree(tree) {

        if (!this.productionTree) {
            return;
        }

        this.productionTree.innerHTML = "";

        if (!tree || !tree.isRecipe) {
            this.productionTree.innerHTML =
                "<p class=\"placeholderText\">Keine Berechnung durchgeführt.</p>";
            return;
        }

        this.productionTree.appendChild(this.createTreeNode(tree));

    }

    createTreeNode(node) {

        const wrapper = document.createElement("div");
        wrapper.className = "treeNode";

        const title = document.createElement("div");
        title.className = "treeTitle";

        if (node.isRecipe) {
            const recipe = this.recipeMap.get(node.name);
            const output = recipe ? (recipe.output || this.DEFAULT_OUTPUT) : this.DEFAULT_OUTPUT;
            title.textContent = `${node.name} — ${node.runs} Durchlauf${node.runs === 1 ? "" : "e"} (${node.runs * output} Stück)`;
        } else {
            title.textContent = `${node.name} — ${node.runs}x`;
        }

        wrapper.appendChild(title);

        if (node.children.length > 0) {
            const list = document.createElement("ul");

            node.children.forEach(child => {
                const item = document.createElement("li");
                item.appendChild(this.createTreeNode(child));
                list.appendChild(item);
            });

            wrapper.appendChild(list);
        }

        return wrapper;

    }

    formatPrice(amount) {

        return "$" + amount.toLocaleString("de-DE");

    }

    buildCostItems(rawMaterials) {

        return [...rawMaterials.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([name, amount]) => ({
                name,
                amount,
                unitPrice: materialPrices[name] ?? null
            }));

    }

    calculateCostSummary(rawMaterials) {

        const items = this.buildCostItems(rawMaterials);
        let total = 0;
        let hasUnknown = false;

        items.forEach(item => {
            if (item.unitPrice == null) {
                hasUnknown = true;
                return;
            }

            total += item.amount * item.unitPrice;
        });

        return { items, total, hasUnknown };

    }

    getSellPrice() {

        if (!this.sellPrice) {
            return null;
        }

        const parsed = parseInt(this.sellPrice.value, 10);

        if (isNaN(parsed) || parsed < 0) {
            return null;
        }

        return parsed;

    }

    getProfitSummary(totalCost, realOutput) {

        const sellPrice = this.getSellPrice();

        if (sellPrice == null) {
            return null;
        }

        const revenue = realOutput * sellPrice;
        const profit = revenue - totalCost;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return { sellPrice, revenue, profit, margin };

    }

    renderProfitSummary(costSummary, realOutput) {

        const { total, hasUnknown } = costSummary;
        const profitSummary = this.getProfitSummary(total, realOutput);

        if (this.statMaterialCost) {
            this.statMaterialCost.textContent = this.formatPrice(total);
        }

        if (this.compareCost) {
            this.compareCost.textContent = this.formatPrice(total);
        }

        if (this.totalCost) {
            this.totalCost.textContent = this.formatPrice(total);
        }

        const setProfitState = (element, value, formattedValue) => {
            if (!element) {
                return;
            }

            element.textContent = formattedValue;
            element.classList.remove("positive", "negative");

            if (value != null) {
                element.classList.add(value >= 0 ? "positive" : "negative");
            }
        };

        if (!profitSummary) {
            if (this.statRevenue) {
                this.statRevenue.textContent = "—";
            }

            if (this.statProfit) {
                this.statProfit.textContent = "—";
                this.statProfit.classList.remove("positive", "negative");
            }

            if (this.compareRevenue) {
                this.compareRevenue.textContent = "—";
            }

            if (this.compareProfit) {
                this.compareProfit.textContent = "—";
                this.compareProfit.classList.remove("positive", "negative");
            }

            if (this.profitHint) {
                this.profitHint.textContent = "Verkaufspreis eingeben, um Gewinn und Marge zu sehen.";
                this.profitHint.hidden = false;
            }

            if (this.profitCompare) {
                this.profitCompare.classList.remove("hasProfit");
            }

            return;
        }

        const { revenue, profit, margin } = profitSummary;
        const revenueText = this.formatPrice(revenue);
        const profitText = `${this.formatPrice(profit)} (${margin.toFixed(1)} %)`;

        if (this.statRevenue) {
            this.statRevenue.textContent = revenueText;
        }

        setProfitState(this.statProfit, profit, profitText);
        setProfitState(this.compareProfit, profit, profitText);

        if (this.compareRevenue) {
            this.compareRevenue.textContent = revenueText;
        }

        if (this.profitHint) {
            if (hasUnknown) {
                this.profitHint.textContent =
                    `Gewinn basiert auf bekannten Preisen (${realOutput} × ${this.formatPrice(profitSummary.sellPrice)}). Einige Materialien haben keinen Apothekenpreis.`;
                this.profitHint.hidden = false;
            } else {
                this.profitHint.hidden = true;
            }
        }

        if (this.profitCompare) {
            this.profitCompare.classList.add("hasProfit");
        }

    }

    renderCosts(costSummary) {

        if (!this.costTable) {
            return;
        }

        const { items, total } = costSummary;

        this.costTable.innerHTML = "";

        if (items.length === 0) {
            this.costTable.innerHTML =
                "<tr><td colspan=\"4\">Keine Materialkosten berechenbar.</td></tr>";
            return;
        }

        items.forEach(item => {
            const row = document.createElement("tr");
            const nameCell = document.createElement("td");
            const amountCell = document.createElement("td");
            const unitCell = document.createElement("td");
            const sumCell = document.createElement("td");

            nameCell.textContent = item.name;
            amountCell.textContent = item.amount;

            if (item.unitPrice == null) {
                unitCell.textContent = "—";
                sumCell.textContent = "—";
            } else {
                const lineTotal = item.amount * item.unitPrice;
                unitCell.textContent = this.formatPrice(item.unitPrice);
                sumCell.textContent = this.formatPrice(lineTotal);
            }

            row.appendChild(nameCell);
            row.appendChild(amountCell);
            row.appendChild(unitCell);
            row.appendChild(sumCell);
            this.costTable.appendChild(row);
        });

    }

    renderRawMaterials(materials) {

        if (!this.rawMaterialTable) {
            return;
        }

        this.rawMaterialTable.innerHTML = "";

        if (materials.size === 0) {
            this.rawMaterialTable.innerHTML =
                "<tr><td colspan=\"2\">Keine Rohstoffe benötigt.</td></tr>";
            return;
        }

        [...materials.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .forEach(([name, amount]) => {
                const row = document.createElement("tr");
                const nameCell = document.createElement("td");
                const amountCell = document.createElement("td");

                nameCell.textContent = name;
                amountCell.textContent = amount;

                row.appendChild(nameCell);
                row.appendChild(amountCell);
                this.rawMaterialTable.appendChild(row);
            });

    }

    renderRecipeDatabase() {

        if (!this.recipeDatabaseTable) {
            return;
        }

        if (this.recipeCount) {
            this.recipeCount.textContent = `${recipes.length} Rezepte`;
        }

        this.recipeDatabaseTable.innerHTML = "";

        this.getSortedRecipes().forEach(recipe => {
            const row = document.createElement("tr");
            const cells = [
                recipe.name,
                recipe.level,
                recipe.xp,
                this.formatTime(recipe.time),
                recipe.quality ? "Ja" : "Nein"
            ];

            cells.forEach(text => {
                const cell = document.createElement("td");
                cell.textContent = text;
                row.appendChild(cell);
            });

            this.recipeDatabaseTable.appendChild(row);
        });

    }

    formatTime(sec) {

        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        let txt = "";

        if (h > 0) {
            txt += h + "h ";
        }

        if (m > 0) {
            txt += m + "m ";
        }

        txt += s + "s";

        return txt;

    }

    copyProductionList() {

        if (!this.lastResult) {
            return;
        }

        const { recipe, realOutput, craftRuns, durchlaeufe, totalXP, totalTime, rawMaterials, costSummary, profitSummary } = this.lastResult;
        const { items: costItems, total: totalCost } = costSummary;

        let text = `FiveM Chemie Rechner\n`;
        text += `Produkt: ${recipe.name}\n`;
        text += `Output: ${realOutput} (${durchlaeufe} Durchläufe, ${craftRuns} Herstellungen)\n`;
        text += `XP: ${totalXP}\n`;
        text += `Zeit: ${this.formatTime(totalTime)}\n\n`;
        text += `Direkte Zutaten:\n`;

        recipe.ingredients.forEach(item => {
            text += `- ${item.name}: ${item.amount * craftRuns}\n`;
        });

        text += `\nRohstoffe gesamt:\n`;

        [...rawMaterials.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .forEach(([name, amount]) => {
                text += `- ${name}: ${amount}\n`;
            });

        text += `\nMaterialkosten:\n`;

        costItems.forEach(item => {
            if (item.unitPrice == null) {
                text += `- ${item.name}: ${item.amount}x (Preis unbekannt)\n`;
                return;
            }

            const lineTotal = item.amount * item.unitPrice;
            text += `- ${item.name}: ${item.amount}x ${this.formatPrice(item.unitPrice)} = ${this.formatPrice(lineTotal)}\n`;
        });

        text += `\nGesamtkosten: ${this.formatPrice(totalCost)}\n`;

        if (profitSummary) {
            text += `\nErlös: ${this.formatPrice(profitSummary.revenue)} (${realOutput} × ${this.formatPrice(profitSummary.sellPrice)})\n`;
            text += `Gewinn: ${this.formatPrice(profitSummary.profit)} (${profitSummary.margin.toFixed(1)} %)\n`;
        }

        navigator.clipboard.writeText(text).then(() => {
            const originalText = this.copyButton.textContent;
            this.copyButton.textContent = "✓ Kopiert!";
            setTimeout(() => {
                this.copyButton.textContent = originalText;
            }, 2000);
        }).catch(() => {
            window.prompt("Produktionsliste kopieren:", text);
        });

    }

    saveRecipe() {

        localStorage.setItem("recipe", this.recipeSelect.value);

    }

    saveSellPrice() {

        if (!this.sellPrice) {
            return;
        }

        localStorage.setItem("sellPrice", this.sellPrice.value);

    }

    restoreLastRecipe() {

        const last = localStorage.getItem("recipe");

        if (last) {
            this.recipeSelect.value = last;
        }

        if (this.recipeSelect.selectedIndex === -1) {
            this.recipeSelect.selectedIndex = 0;
        }

        const savedSellPrice = localStorage.getItem("sellPrice");

        if (savedSellPrice && this.sellPrice) {
            this.sellPrice.value = savedSellPrice;
        }

    }

}

window.addEventListener("DOMContentLoaded", () => {
    new ChemieRechner();
});
