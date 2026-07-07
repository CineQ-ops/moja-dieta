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
        ingredientsInputList.innerHTML = ''; 
        formTitle.innerText = "Dodaj nowy przepis";
        formButton.innerText = "Zapisz przepis";
        navAdd.innerText = "Dodaj nowy";

        displayRecipes(); 
    } else if (viewName === 'add') {
        viewBrowse.classList.add('hidden');
        viewAdd.classList.remove('hidden');
        navBrowse.classList.remove('active');
        navAdd.classList.add('active');
        
        if (ingredientsInputList.children.length === 0) {
            addIngredientRow();
        }
    }
}

// DYNAMICZNE DODAWANIE WIERSZA SKŁADNIKA
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

// WYŚWIETLANIE Z WYSZUKIWANIEM
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
        
        let totalKcal = 0, totalB = 0, totalT = 0, totalW = 0, hasAnyMakro = false;
        let ingredientsHTML = '';

        if (Array.isArray(recipe.ingredients)) {
    ingredientsHTML = '<ul class="ingredients-list">'; // TU DODAJEMY KLASĘ
    recipe.ingredients.forEach(ing => {
        ingredientsHTML += `<li>${ing.nazwa}: <strong>${ing.ilosc_g}g</strong>`;
        if (ing.kcal !== undefined && ing.kcal !== null && ing.kcal !== '') {
            hasAnyMakro = true;
            totalKcal += Math.round((parseFloat(ing.kcal) / 100) * ing.ilosc_g);
            totalB += ((parseFloat(ing.b || 0) / 100) * ing.ilosc_g);
            totalT += ((parseFloat(ing.t || 0) / 100) * ing.ilosc_g);
            totalW += ((parseFloat(ing.w || 0) / 100) * ing.ilosc_g);
            ingredientsHTML += `<br><span class="makro-detail-label">w 100g: ${ing.kcal} kcal, B: ${ing.b}g, T: ${ing.t}g, W: ${ing.w}g</span>`;
        }
        ingredientsHTML += `</li>`;
    });
    ingredientsHTML += '</ul>';
} else {
            ingredientsHTML = `<p>${recipe.ingredients.replace(/\n/g, '<br>')}</p>`;
        }

        let totalMakroHTML = hasAnyMakro ? `
            <div class="recipe-total-makro">
                <div class="makro-badge"><strong>${totalKcal}</strong><span>Kalorie</span></div>
                <div class="makro-badge"><strong>${totalB.toFixed(1)}g</strong><span>Białko</span></div>
                <div class="makro-badge"><strong>${totalW.toFixed(1)}g</strong><span>Węglo.</span></div>
                <div class="makro-badge"><strong>${totalT.toFixed(1)}g</strong><span>Tłuszcze</span></div>
            </div>` : '';

        recipeCard.innerHTML = `
    <div class="recipe-header">
        <h3>${recipe.name} <span class="badge">${recipe.category}</span></h3>
    </div>
    ${totalMakroHTML}
    
    <strong>Składniki</strong>
    ${ingredientsHTML}
    
    <strong>Przygotowanie</strong>
    <p>${recipe.description.replace(/(\d+\.)/g, '<br>$1')}</p>
    
    ${recipe.tips ? `<div class="tips-section"><strong>Wskazówki</strong><p>${recipe.tips.replace(/(\d+\.)/g, '<br>$1')}</p></div>` : ''}
    
    <div class="recipe-actions">
        <button onclick="editRecipe(${originalIndex})" class="btn-edit">Edytuj</button>
        <button onclick="deleteRecipe(${originalIndex})" class="btn-delete">Usuń</button>
    </div>
`;
        recipesContainer.appendChild(recipeCard);
    });
}

// OBSŁUGA ZAPISU
recipeForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const rows = ingredientsInputList.querySelectorAll('.ingredient-row');
    const ingredientsArray = [];
    rows.forEach(row => {
        const name = row.querySelector('.ing-name').value;
        const weight = parseFloat(row.querySelector('.ing-weight').value);
        const kcalVal = row.querySelector('.ing-kcal').value;
        const bVal = row.querySelector('.ing-b').value;
        const tVal = row.querySelector('.ing-t').value;
        const wVal = row.querySelector('.ing-w').value;
        const ingredientObj = { nazwa: name, ilosc_g: weight };
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
        tag: document.getElementById('recipeTag').value, // Dopisane
        ingredients: ingredientsArray,
        description: document.getElementById('recipeDescription').value,
        tips: document.getElementById('recipeTips').value // Dopisane
    };

    if (editIndex !== null) recipes[editIndex] = recipeData;
    else recipes.push(recipeData);

    localStorage.setItem('myRecipes', JSON.stringify(recipes));
    switchView('browse');
});

// FUNKCJA EDYCJI
window.editRecipe = function(index) {
    editIndex = index;
    const recipe = recipes[index];
    document.getElementById('recipeName').value = recipe.name;
    document.getElementById('recipeCategory').value = recipe.category;
    document.getElementById('recipeTag').value = recipe.tag || ''; // Dopisane
    document.getElementById('recipeDescription').value = recipe.description;
    document.getElementById('recipeTips').value = recipe.tips || ''; // Dopisane

    ingredientsInputList.innerHTML = '';
    if (Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(ing => {
            addIngredientRow(ing.nazwa, ing.ilosc_g, ing.kcal || '', ing.b || '', ing.t || '', ing.w || '');
        });
    } else {
        addIngredientRow(recipe.ingredients, 0);
    }
    switchView('add');
};

window.deleteRecipe = function(index) {
    if(confirm("Czy na pewno chcesz usunąć ten przepis?")) {
        recipes.splice(index, 1);
        localStorage.setItem('myRecipes', JSON.stringify(recipes));
        displayRecipes();
    }
};

window.exportRecipes = function() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(recipes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "moja_baza_przepisow.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

window.importRecipes = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (!Array.isArray(importedData)) throw new Error("Błędny format");

            // Pytanie o akcję
            const action = confirm("Czy chcesz DODAĆ zaimportowane przepisy do obecnej listy?\n(Kliknij 'Anuluj', aby całkowicie ZASTĄPIĆ obecną listę)");
            
            if (action) {
                recipes = [...recipes, ...importedData];
            } else {
                recipes = importedData;
            }
            
            localStorage.setItem('myRecipes', JSON.stringify(recipes));
            displayRecipes();
            alert("Operacja zakończona!");
        } catch (err) { alert("Błąd importu: plik jest nieprawidłowy."); }
    };
    reader.readAsText(file);
}
window.triggerImport = function() {
    document.getElementById('importFile').click();
}
displayRecipes();