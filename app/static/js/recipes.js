class RecipeManager {
    constructor() {
        this.recipes = window.initialRecipes || [];
        this.currentRecipe = null;
        this.bookmarkedRecipes = new Set((window.initialBookmarks || []).map(b => b.title));
        this._initializeRecipeHandlers();
        // Initialize bookmarks list with initial data
        this._updateBookmarksList(window.initialBookmarks || []);
        if (this.recipes.length > 0) {
            this._displayRecipeDetails(this.recipes[0]);
            document.querySelector('.recipe__item')?.classList.add('recipe__item--active');
        }
    }

    async _loadBookmarks() {
        if (document.body.dataset.authenticated === 'true') {
            try {
                const response = await fetch('/get_bookmarked_recipes');
                const data = await response.json();

                if (data.bookmarks) {
                    this.bookmarkedRecipes = new Set(data.bookmarks.map(b => b.title));
                    this._updateBookmarksList(data.bookmarks);
                    if (this.currentRecipe) {
                        this._updateBookmarkButton(this.currentRecipe);
                    }
                }
            } catch (err) {
                console.error('Error loading bookmarks:', err);
            }
        }
    }

    _updateBookmarkButton(recipe) {
        const bookmarkBtn = document.querySelector('.bookmark-button');
        if (bookmarkBtn) {
            const isBookmarked = this.bookmarkedRecipes.has(recipe.title);
            bookmarkBtn.classList.toggle('bookmark-button--active', isBookmarked);
            bookmarkBtn.querySelector('span').textContent = isBookmarked ? 'Bookmarked' : 'Bookmark Recipe';
        }
    }

    _updateBookmarksList(bookmarks) {
        const bookmarksList = document.querySelector('.bookmarks__list');
        if (!bookmarksList) return;

        if (bookmarks.length === 0) {
            bookmarksList.innerHTML = `
                <div class="message">
                    <div class="message__icon">
                        <svg xmlns="http://www.w3.org/2000/svg" class="smile__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p class="message__text">No bookmarks yet. Find a nice recipe and bookmark it :)</p>
                </div>
            `;
            return;
        }

        bookmarksList.innerHTML = bookmarks.map(recipe => `
            <li class="bookmark__item" data-recipe='${JSON.stringify(recipe)}'>
                <div class="bookmark__content">
                    <h4 class="bookmark__name">${recipe.title}</h4>
                    <div class="bookmark__details">
                        <span>⏱️ ${recipe.readyInMinutes}m</span>
                        <span>👥 ${recipe.servings}</span>
                    </div>
                </div>
            </li>
        `).join('');

        bookmarksList.querySelectorAll('.bookmark__item').forEach(item => {
            item.addEventListener('click', () => {
                const recipe = JSON.parse(item.dataset.recipe);
                this._displayRecipeDetails(recipe);
                document.querySelector('.bookmarks').classList.add('hidden');
            });
        });
    }

    _initializeRecipeHandlers() {
        // Add click handlers to recipe items in sidebar
        document.querySelectorAll('.recipe__item').forEach(item => {
            item.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                const recipe = this.recipes[index];

                // Remove active class from all items
                document.querySelectorAll('.recipe__item').forEach(item =>
                    item.classList.remove('recipe__item--active'));

                // Add active class to clicked item
                e.currentTarget.classList.add('recipe__item--active');

                // Display recipe details
                this._displayRecipeDetails(recipe);
            });
        });

        // Initialize bookmark handlers if user is authenticated
        if (document.body.dataset.authenticated === 'true') {
            this._initializeBookmarkHandlers();
        }
    }

    _displayRecipeDetails(recipe) {
        this.currentRecipe = recipe;
        const recipesGrid = document.querySelector('.recipes-grid');

        const escapedRecipeData = encodeURIComponent(JSON.stringify(recipe));

        const isBookmarked = this.bookmarkedRecipes.has(recipe.title);
        const bookmarkButton = document.body.dataset.authenticated === 'true'
            ? `<button class="bookmark-button ${isBookmarked ? 'bookmark-button--active' : ''}" data-recipe="${escapedRecipeData}">
                <svg xmlns="http://www.w3.org/2000/svg" class="bookmark-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span>${isBookmarked ? 'Bookmarked' : 'Bookmark Recipe'}</span>
               </button>`
            : '';

        recipesGrid.innerHTML = `
            <div class="recipe-details">
                <h2 class="recipe-details__title">${recipe.title}</h2>
                <div class="recipe-details__content">
                    <p class="recipe-details__description">${recipe.description}</p>
                    <div class="recipe-details__info">
                        <p>Ready in: ${recipe.readyInMinutes} minutes</p>
                        <p>Servings: ${recipe.servings}</p>
                    </div>
                    <div class="recipe-details__actions">
                        <a href="${recipe.url}" target="_blank" class="recipe-details__link">View Full Recipe</a>
                        ${bookmarkButton}
                    </div>
                </div>
            </div>
        `;
    }

    _initializeBookmarkHandlers() {
        document.addEventListener('click', async (e) => {
            const bookmarkBtn = e.target.closest('.bookmark-button');
            if (!bookmarkBtn) return;

            try {
                const recipeData = JSON.parse(decodeURIComponent(bookmarkBtn.dataset.recipe));
                const response = await fetch('/bookmark_recipe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(recipeData)
                });

                const data = await response.json();

                if (response.ok) {
                    if (data.action === 'added') {
                        this.bookmarkedRecipes.add(recipeData.title);
                        bookmarkBtn.classList.add('bookmark-button--active');
                        bookmarkBtn.querySelector('span').textContent = 'Bookmarked';
                    } else {
                        this.bookmarkedRecipes.delete(recipeData.title);
                        bookmarkBtn.classList.remove('bookmark-button--active');
                        bookmarkBtn.querySelector('span').textContent = 'Bookmark Recipe';
                    }

                    // Refresh bookmarks list
                    this._loadBookmarks();
                } else {
                    throw new Error('Failed to bookmark recipe');
                }
            } catch (err) {
                console.error('Error:', err);
                alert('Failed to bookmark recipe. Please try again.');
            }
        });
    }
}

// Initialize recipe manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RecipeManager();
});
