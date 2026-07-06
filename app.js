const recipeForm = document.getElementById('recipeForm');
const recipesContainer = document.getElementById('recipesContainer');
const searchBar = document.getElementById('searchBar');
const ingredientsInputList = document.getElementById('ingredientsInputList');

let recipes = JSON.parse(localStorage.getItem('myRecipes')) || [];
let editIndex = null;

// FUNKCJA PRZEŁĄCZANIA WIDOKÓW
window.switchView = function(viewName) {
    const viewBrowse = document.getElementById('viewBrowse');
    const viewAdd = document.getElementById('viewAdd');
    const navBrowse = document.getElementById('navBrowse');
    const navAdd = document.getElementById('navAdd');
    const formTitle = document.querySelector('.form-section h2');
    const formButton = document.querySelector('#recipeForm button[type="submit"]');

    if (viewName === 'browse') {
        viewBrowse.classList.remove('hidden');
        viewAdd.classList.add('hidden');
        navBrowse.classList.add('active');
        navAdd.classList.remove('active');
        
        editIndex = null;
        recipeForm.reset();
        ingredientsInputList.innerHTML = ''; // Czyścimy listę składników
        formTitle.innerText = "Dodaj nowy przepis";
        formButton.innerText = "Zapisz przepis";
        navAdd.innerText = "Dodaj nowy";

        displayRecipes(); 
    } else if (viewName === 'add') {
        viewBrowse.classList.add('hidden');
        viewAdd.classList.remove('hidden');
        navBrowse.classList.remove('active');
        navAdd.classList.add('active');
        
        // Jeśli otwieramy czysty formularz i jest pusty, dodaj jeden pusty wiersz składnika na start
        if (ingredientsInputList.children.length === 0) {
            addIngredientRow();
        }
    }
}

// DYNAMICZNE DODAWANIE WIERSZA SKŁADNIKA DO FORMULARZA (Z POLAMI MAKRO NA 100g)
window.addIngredientRow = function(name = '', weight = '', kcal = '', b = '', t = '', w = '') {
    const row = document.createElement('div');
    row.className = 'ingredient-row';
    row.innerHTML = `
        <input type="text" class="ing-name" placeholder="Nazwa (np. Awokado)" value="${name}" required>
        <input type="number" class="ing-weight" placeholder="Waga (g)" step="any" value="${weight}" required>
        
        <div class="makro-inputs">
            <input type="number" class="ing-kcal" placeholder="kcal" step="any" value="${kcal}">
            <input type="number" class="ing-b" placeholder="B (g)" step="any" value="${b}">
            <input type="number" class="ing-t" placeholder="T (g)" step="any" value="${t}">
            <input type="number" class="ing-w" placeholder="W (g)" step="any" value="${w}">
        </div>
        
        <button type="button" class="btn-remove-ing" onclick="this.parentElement.remove()">×</button>
    `;
    ingredientsInputList.appendChild(row);
}

// WYŚWIETLANIE Z WYSZUKIWANIEM (Z PODSUMOWANIEM MAKRO DLA CAŁOŚCI I SKŁADNIKÓW)
function displayRecipes() {
    recipesContainer.innerHTML = '';
    const searchQuery = searchBar.value.toLowerCase();

    const filteredRecipes = recipes.filter(recipe => {
        const matchName = recipe.name.toLowerCase().includes(searchQuery);
        
        let matchIngredients = false;
        if (Array.isArray(recipe.ingredients)) {
            matchIngredients = recipe.ingredients.some(ing => ing.nazwa.toLowerCase().includes(searchQuery));
        } else if (typeof recipe.ingredients === 'string') {
            matchIngredients = recipe.ingredients.toLowerCase().includes(searchQuery);
        }
        
        return matchName || matchIngredients;
    });

    if (filteredRecipes.length === 0) {
        recipesContainer.innerHTML = '<p>Brak przepisów spełniających kryteria.</p>';
        return;
    }

    filteredRecipes.forEach((recipe) => {
        const originalIndex = recipes.indexOf(recipe);
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card';
        
        // Zmienne do liczenia łącznego makro całego posiłku
        let totalKcal = 0;
        let totalB = 0;
        let totalT = 0;
        let totalW = 0;
        let hasAnyMakro = false; // Flag, czy chociaż jeden składnik ma podane makro

        let ingredientsHTML = '';
        if (Array.isArray(recipe.ingredients)) {
            ingredientsHTML = '<ul>';
            recipe.ingredients.forEach(ing => {
                ingredientsHTML += `<li>${ing.nazwa}: <strong>${ing.ilosc_g}g</strong>`;
                
                // Sprawdzamy, czy składnik ma wprowadzone makro
                if (ing.kcal !== undefined && ing.kcal !== null && ing.kcal !== '') {
                    hasAnyMakro = true;
                    
                    // Liczymy wartości dla konkretnej wagi składnika (Wartość / 100 * waga)
                    const ingKcal = Math.round((parseFloat(ing.kcal) / 100) * ing.ilosc_g);
                    const ingB = ((parseFloat(ing.b || 0) / 100) * ing.ilosc_g);
                    const ingT = ((parseFloat(ing.t || 0) / 100) * ing.ilosc_g);
                    const ingW = ((parseFloat(ing.w || 0) / 100) * ing.ilosc_g);

                    // Sumujemy do ogólnej puli przepisu
                    totalKcal += ingKcal;
                    totalB += ingB;
                    totalT += ingT;
                    totalW += ingW;

                    // Szary dopisek wzorowany na Respo pod składnikiem
                    ingredientsHTML += `<br><span class="makro-detail-label">w 100g: ${ing.kcal} kcal, B: ${ing.b}g, T: ${ing.t}g, W: ${ing.w}g</span>`;
                }
                
                ingredientsHTML += `</li>`;
            });
            ingredientsHTML += '</ul>';
        } else {
            ingredientsHTML = `<p>${recipe.ingredients.replace(/\n/g, '<br>')}</p>`;
        }

        // Jeśli potrawa ma wyliczone makro, tworzymy dla niej ładny nagłówek z podsumowaniem
        let totalMakroHTML = '';
        if (hasAnyMakro) {
            totalMakroHTML = `
                <div class="recipe-total-makro">
                    <div class="makro-badge"><strong>${totalKcal}</strong><span>Kalorie</span></div>
                    <div class="makro-badge"><strong>${totalB.toFixed(1)}g</strong><span>Białko</span></div>
                    <div class="makro-badge"><strong>${totalW.toFixed(1)}g</strong><span>Węglo.</span></div>
                    <div class="makro-badge"><strong>${totalT.toFixed(1)}g</strong><span>Tłuszcze</span></div>
                </div>
            `;
        }

        recipeCard.innerHTML = `
            <div class="recipe-header">
                <h3>${recipe.name} <span class="badge">${recipe.category}</span></h3>
            </div>
            ${totalMakroHTML}
            <p><strong>Składniki:</strong></p>
            ${ingredientsHTML}
            <p><strong>Przygotowanie:</strong><br>${recipe.description.replace(/\n/g, '<br>')}</p>
            <div class="recipe-actions">
                <button onclick="editRecipe(${originalIndex})" class="btn-edit">Edytuj</button>
                <button onclick="deleteRecipe(${originalIndex})" class="btn-delete">Usuń</button>
            </div>
        `;
        recipesContainer.appendChild(recipeCard);
    });
}

// OBSŁUGA ZAPISU FORMULARZA (ZBIERANIE NOWYCH DANYCH)
recipeForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const rows = ingredientsInputList.querySelectorAll('.ingredient-row');
    const ingredientsArray = [];
    
    rows.forEach(row => {
        const name = row.querySelector('.ing-name').value;
        const weight = parseFloat(row.querySelector('.ing-weight').value);
        
        // Pobieramy opcjonalne wartości makro
        const kcalVal = row.querySelector('.ing-kcal').value;
        const bVal = row.querySelector('.ing-b').value;
        const tVal = row.querySelector('.ing-t').value;
        const wVal = row.querySelector('.ing-w').value;

        const ingredientObj = { 
            nazwa: name, 
            ilosc_g: weight 
        };

        // Zapisujemy wartości makro tylko, jeśli pole kcal nie jest puste
        if (kcalVal !== '') {
            ingredientObj.kcal = kcalVal;
            ingredientObj.b = bVal || '0';
            ingredientObj.t = tVal || '0';
            ingredientObj.w = wVal || '0';
        }

        ingredientsArray.push(ingredientObj);
    });

    const recipeData = {
        name: document.getElementById('recipeName').value,
        category: document.getElementById('recipeCategory').value,
        ingredients: ingredientsArray,
        description: document.getElementById('recipeDescription').value
    };

    if (editIndex !== null) {
        recipes[editIndex] = recipeData;
    } else {
        recipes.push(recipeData);
    }

    localStorage.setItem('myRecipes', JSON.stringify(recipes));
    switchView('browse');
});

// FUNKCJA EDYCJI (UZUPEŁNIA POLA MAKRO JEŚLI ISTNIEJĄ)
window.editRecipe = function(index) {
    editIndex = index;
    const recipe = recipes[index];

    document.getElementById('recipeName').value = recipe.name;
    document.getElementById('recipeCategory').value = recipe.category;
    document.getElementById('recipeDescription').value = recipe.description;

    ingredientsInputList.innerHTML = '';
    
    if (Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(ing => {
            addIngredientRow(
                ing.nazwa, 
                ing.ilosc_g, 
                ing.kcal || '', 
                ing.b || '', 
                ing.t || '', 
                ing.w || ''
            );
        });
    } else {
        addIngredientRow(recipe.ingredients, 0);
    }

    document.querySelector('.form-section h2').innerText = "Edytuj przepis";
    document.querySelector('#recipeForm button[type="submit"]').innerText = "Zatwierdź zmiany";
    document.getElementById('navAdd').innerText = "✍️ Edycja";

    switchView('add');
};

// USUWANIE PRZEPISU
window.deleteRecipe = function(index) {
    if(confirm("Czy na pewno chcesz usunąć ten przepis?")) {
        recipes.splice(index, 1);
        localStorage.setItem('myRecipes', JSON.stringify(recipes));
        displayRecipes();
    }
};

// ================= EKSPORT I IMPORT PLIKU JSON =================

window.exportRecipes = function() {
    if (recipes.length === 0) {
        alert("Baza jest pusta, nie masz czego eksportować!");
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(recipes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "moja_baza_przepisow.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

window.triggerImport = function() {
    document.getElementById('importFile').click();
}

window.importRecipes = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (Array.isArray(importedData)) {
                if (confirm("Czy chcesz DOPISAĆ zaimportowane przepisy do obecnych? (Kliknij 'Anuluj' jeśli wolisz całkowicie zastąpić swoją bazę).")) {
                    recipes = recipes.concat(importedData);
                } else {
                    recipes = importedData;
                }
                localStorage.setItem('myRecipes', JSON.stringify(recipes));
                displayRecipes();
                alert("Import zakończony sukcesem!");
            } else {
                alert("Błędny format pliku!");
            }
        } catch (err) {
            alert("Nie udało się odczytać pliku JSON.");
        }
    };
    reader.readAsText(file);
}

// Pierwsze uruchomienie
displayRecipes();