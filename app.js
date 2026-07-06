// 1. Pobieramy elementy z widoku HTML, żeby móc nimi sterować
const recipeForm = document.getElementById('recipeForm');
const recipesContainer = document.getElementById('recipesContainer');

// 2. Ładujemy przepisy z LocalStorage na starcie aplikacji. Jeśli szuflada jest pusta, tworzymy pustą listę []
let recipes = JSON.parse(localStorage.getItem('myRecipes')) || [];

// Funkcja, która rysuje przepisy na ekranie
function displayRecipes() {
    // Czyścimy kontener, żeby nie dublować wpisów
    recipesContainer.innerHTML = '';

    if (recipes.length === 0) {
        recipesContainer.innerHTML = '<p>Brak przepisów w bazie. Dodaj swój pierwszy przepis powyżej!</p>';
        return;
    }

    // Przechodzimy przez każdy przepis i tworzymy dla niego kawałek kodu HTML
    recipes.forEach((recipe, index) => {
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card';
        
        recipeCard.innerHTML = `
            <h3>${recipe.name} <span class="badge">${recipe.category}</span></h3>
            <p><strong>Składniki:</strong><br>${recipe.ingredients.replace(/\n/g, '<br>')}</p>
            <p><strong>Przygotowanie:</strong><br>${recipe.description.replace(/\n/g, '<br>')}</p>
            <button onclick="deleteRecipe(${index})" class="btn-delete">Usuń</button>
        `;
        
        recipesContainer.appendChild(recipeCard);
    });
}

// Funkcja obsługująca dodawanie nowego przepisu
recipeForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Powstrzymujemy przeładowanie strony po kliknięciu przycisku

    // Pobieramy wartości z formularza
    const newRecipe = {
        name: document.getElementById('recipeName').value,
        category: document.getElementById('recipeCategory').value,
        ingredients: document.getElementById('recipeIngredients').value,
        description: document.getElementById('recipeDescription').value
    };

    // Dodajemy nowy przepis do naszej tablicy
    recipes.push(newRecipe);

    // Zapisujemy zaktualizowaną listę do LocalStorage (musimy zamienić obiekt na tekst za pomocą JSON.stringify)
    localStorage.setItem('myRecipes', JSON.stringify(recipes));

    // Odświeżamy widok na ekranie
    displayRecipes();

    // Resetujemy formularz, żeby pola były czyste
    recipeForm.reset();
});

// Funkcja do usuwania przepisu
window.deleteRecipe = function(index) {
    recipes.splice(index, 1); // Usuwamy 1 element z wybranej pozycji
    localStorage.setItem('myRecipes', JSON.stringify(recipes)); // Zapisujemy zmiany w pamięci
    displayRecipes(); // Odświeżamy ekran
};

// Uruchamiamy wyświetlanie przepisów zaraz po włączeniu aplikacji
displayRecipes();