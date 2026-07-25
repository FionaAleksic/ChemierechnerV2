const materialPrices = {

    "Destilliertes Wasser": 500,
    "Natriumchlorid": 1000,
    "Ethanol": 1500,
    "Natriumbicarbonat": 1500,
    "Ammoniak": 1500,
    "Methanol": 2000,
    "Essigsäure": 2000,
    "Natriumhydroxid": 2500,
    "Salzsäure": 2500,
    "Chloroform": 2500,
    "Aceton": 3000,
    "Schwefelsäure": 3000,
    "Diethylether": 4500,
    "Adrenalin": 5000,
    "Fentanylcitrat": 5000

};

const recipes = [

{
id: 1,
name: "Kochsalzlösung",
output: 3,
ingredients: [
    { name: "Natriumchlorid", amount: 1 },
    { name: "Destilliertes Wasser", amount: 1 }
],
xp: 12,
time: 8,
level: 0,
quality: false
},

{
id: 2,
name: "Sterilisationsmittel",
output: 3,
ingredients: [
    { name: "Ethanol", amount: 1 },
    { name: "Essigsäure", amount: 1 }
],
xp: 15,
time: 10,
level: 0,
quality: false
},

{
id: 3,
name: "Pufferlösung",
output: 3,
ingredients: [
    { name: "Natriumbicarbonat", amount: 1 },
    { name: "Essigsäure", amount: 1 }
],
xp: 18,
time: 12,
level: 0,
quality: false
},

{
id: 4,
name: "Anästhetikum",
output: 3,
ingredients: [
    { name: "Diethylether", amount: 1 },
    { name: "Aceton", amount: 1 }
],
xp: 20,
time: 14,
level: 0,
quality: false
},

{
id: 5,
name: "Chloroform",
output: 3,
ingredients: [
    { name: "Aceton", amount: 1 },
    { name: "Natriumhydroxid", amount: 1 }
],
xp: 22,
time: 15,
level: 0,
quality: false
},

{
id: 6,
name: "Adrenalin Spritze",
output: 3,
ingredients: [
    { name: "Adrenalin", amount: 1 },
    { name: "Kochsalzlösung", amount: 1 }
],
xp: 25,
time: 15,
level: 0,
quality: false
},

{
id: 7,
name: "Antibiotikum",
output: 3,
ingredients: [
    { name: "Pufferlösung", amount: 1 },
    { name: "Sterilisationsmittel", amount: 1 }
],
xp: 22,
time: 16,
level: 0,
quality: false
},

{
id: 8,
name: "Schmerzmittel",
output: 3,
ingredients: [
    { name: "Kodein", amount: 1 },
    { name: "Sterilisationsmittel", amount: 1 }
],
xp: 35,
time: 18,
level: 2,
quality: false
},

{
id: 9,
name: "Veredelungsmittel",
output: 3,
ingredients: [
    { name: "Ammoniak", amount: 1 },
    { name: "Ethanol", amount: 1 }
],
xp: 45,
time: 25,
level: 3,
quality: true
},

{
id: 10,
name: "Medizinische Base",
output: 3,
ingredients: [
    { name: "Kodein", amount: 1 },
    { name: "Pufferlösung", amount: 1 }
],
xp: 42,
time: 20,
level: 4,
quality: false
},

{
id: 11,
name: "Alkaloidextrakt",
output: 3,
ingredients: [
    { name: "Morpium", amount: 1 },
    { name: "Ammoniak", amount: 1 }
],
xp: 50,
time: 22,
level: 5,
quality: false
},

{
id: 12,
name: "Beruhigungsspritze",
output: 3,
ingredients: [
    { name: "Anästhetikum", amount: 1 },
    { name: "Chloroform", amount: 1 },
    { name: "Kochsalzlösung", amount: 1 }
],
xp: 70,
time: 30,
level: 7,
quality: false
},

{
id: 13,
name: "Prekursor",
output: 3,
ingredients: [
    { name: "Schwefelsäure", amount: 1 },
    { name: "Methanol", amount: 1 },
    { name: "Natriumchlorid", amount: 1 }
],
xp: 72,
time: 30,
level: 9,
quality: false
},

{
id: 14,
name: "Erweitertes Med Kit",
output: 3,
ingredients: [
    { name: "Alkaloidextrakt", amount: 1 },
    { name: "Adrenalin Spritze", amount: 1 },
    { name: "Destilliertes Wasser", amount: 1 }
],
xp: 85,
time: 35,
level: 10,
quality: false
},

{
id: 15,
name: "Reiner Katalysator",
output: 3,
ingredients: [
    { name: "Salzsäure", amount: 1 },
    { name: "Aceton", amount: 1 },
    { name: "Medizinische Base", amount: 1 }
],
xp: 100,
time: 40,
level: 12,
quality: false
},

{
id: 16,
name: "Rehydration Infusion",
output: 3,
ingredients: [
    { name: "Kochsalzlösung", amount: 1 },
    { name: "Schmerzmittel", amount: 1 },
    { name: "Destilliertes Wasser", amount: 1 }
],
xp: 120,
time: 44,
level: 13,
quality: false
},

{
id: 17,
name: "Wahrheitsserum",
output: 3,
ingredients: [
    { name: "Anästhetikum", amount: 1 },
    { name: "Prekursor", amount: 1 },
    { name: "Chloroform", amount: 1 }
],
xp: 125,
time: 45,
level: 14,
quality: false
},

{
id: 18,
name: "Fentanylcitrat",
output: 3,
ingredients: [
    { name: "Prekursor", amount: 1 },
    { name: "Pufferlösung", amount: 1 },
    { name: "Destilliertes Wasser", amount: 1 }
],
xp: 130,
time: 46,
level: 15,
quality: false
},

{
id: 19,
name: "Zyanid",
output: 3,
ingredients: [
    { name: "Kaliumcyanid", amount: 1 },
    { name: "Reiner Katalysator", amount: 1 },
    { name: "Ethanol", amount: 1 }
],
xp: 180,
time: 52,
level: 18,
quality: false
}

];
