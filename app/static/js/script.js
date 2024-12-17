// Add at the beginning of your script.js file
const WEATHER_API_KEY = '53acbccdccbb46dcbdd65d17a45a988e';

// Map functionality
class App {
    #map;
    #mapZoomLevel = 13;
    #markers = [];

    constructor() {
        // Get user's position
        this._getPosition();
        this._initializeSearch();
        this._initializeBookmarks();
        this._initializeBookmarkHandlers();
    }

    _initializeBookmarks() {
        const bookmarkBtn = document.querySelector('.bookmark__button');
        const bookmarksDropdown = document.querySelector('.bookmarks');

        // Toggle bookmarks dropdown
        bookmarkBtn.addEventListener('click', function () {
            bookmarksDropdown.classList.toggle('hidden');
        });

        // Close bookmarks dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!bookmarkBtn.contains(e.target) && !bookmarksDropdown.contains(e.target)) {
                bookmarksDropdown.classList.add('hidden');
            }
        });
    }

    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),
                function () {
                    alert('Could not get your position');
                }
            );
        }  else {
            alert('Geolocation is not supported by your browser.');
        }
    }

    _loadMap(position) {
        const { latitude } = position.coords;
        const { longitude } = position.coords;
        const coords = [latitude, longitude];

        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map);
    }

    async _searchCity(cityName) {
        try {
            // Check if map is initialized
            if (!this.#map) {
                alert('Please wait for the map to initialize');
                return;
            }

            const response = await fetch(`/api/restaurants?city=${cityName}`);
            const data = await response.json();

            if (data.restaurants) {
                // Clear existing markers
                this.#markers.forEach(marker => this.#map.removeLayer(marker));
                this.#markers = [];

                // Clear existing sidebar content
                const sidebarList = document.querySelector('.sidebar');
                sidebarList.innerHTML = `
                    <h2>Top Restaurants</h2>
                    <ul class="restaurants__list"></ul>
                    <div class="pagination"></div>
                `;
                const restaurantsList = document.querySelector('.restaurants__list');
                const paginationContainer = document.querySelector('.pagination');

                // Create markers for all restaurants
                data.restaurants.forEach((restaurant, index) => {
                    const marker = L.marker([
                        restaurant.coordinates.lat,
                        restaurant.coordinates.lng
                    ])
                        .addTo(this.#map)
                        .bindPopup(
                            L.popup({
                                maxWidth: 250,
                                minWidth: 100,
                                autoClose: false,
                                closeOnClick: false,
                                className: 'restaurant-popup',
                            })
                        )
                        .setPopupContent(`
                        <div class="popup">
                            <div class="popup__header">
                                <h3>${restaurant.name}</h3>
                                <button class="popup__bookmark" data-restaurant="${encodeURIComponent(JSON.stringify(restaurant))}">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="popup__bookmark-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                    </svg>
                                </button>
                            </div>
                            <div class="popup__content">
                                ${restaurant.image_url ? `<img src="${restaurant.image_url}" alt="${restaurant.name}" class="popup__img">` : ''}
                                <p class="popup__description">${restaurant.description}</p>
                                <div class="popup__details">
                                    <p>Rating: ${restaurant.rating} ⭐</p>
                                    <p>Reviews: ${restaurant.review_count}</p>
                                    <p>Price: ${restaurant.price}</p>
                                    <p>${restaurant.address}</p>
                                </div>
                                <a href="${restaurant.url}" target="_blank" class="popup__link">View on Yelp</a>
                            </div>
                        </div>
                    `);

                    this.#markers.push(marker);
                });

                // Setup pagination
                const itemsPerPage = 5;
                const totalPages = Math.ceil(data.restaurants.length / itemsPerPage);
                let currentPage = 1;

                const displayPage = (page) => {
                    // Clear current list
                    restaurantsList.innerHTML = '';

                    // Calculate start and end indices
                    const start = (page - 1) * itemsPerPage;
                    const end = start + itemsPerPage;

                    // Display restaurants for current page
                    data.restaurants.slice(start, end).forEach((restaurant, index) => {
                        const absoluteIndex = start + index; // Index in the full array
                        const html = `
                            <li class="restaurant__item" data-index="${absoluteIndex}">
                                <h3 class="restaurant__name">${restaurant.name}</h3>
                                <div class="restaurant__details">
                                    <span class="restaurant__rating">⭐ ${restaurant.rating}</span>
                                    <span class="restaurant__reviews">${restaurant.review_count} reviews</span>
                                    <span class="restaurant__price">${restaurant.price}</span>
                                </div>
                                <p class="restaurant__address">${restaurant.address}</p>
                            </li>
                        `;
                        restaurantsList.insertAdjacentHTML('beforeend', html);
                    });

                    // Add click handlers to sidebar items
                    document.querySelectorAll('.restaurant__item').forEach(item => {
                        item.addEventListener('click', (e) => {
                            const index = e.currentTarget.dataset.index;
                            const marker = this.#markers[index];
                            const restaurant = data.restaurants[index];

                            // Remove active class from all items
                            document.querySelectorAll('.restaurant__item').forEach(item =>
                                item.classList.remove('restaurant__item--active'));

                            // Add active class to clicked item
                            e.currentTarget.classList.add('restaurant__item--active');

                            // Close all popups first
                            this.#markers.forEach(marker => marker.closePopup());

                            // Center map on restaurant and zoom in
                            this.#map.setView(
                                [restaurant.coordinates.lat, restaurant.coordinates.lng],
                                16
                            );

                            // Open popup for selected restaurant only
                            marker.openPopup();
                        });
                    });

                    // Update pagination UI
                    paginationContainer.innerHTML = `
                        <button class="pagination-btn prev" ${page === 1 ? 'disabled' : ''}>Previous</button>
                        <span class="pagination-info">Page ${page} of ${totalPages}</span>
                        <button class="pagination-btn next" ${page === totalPages ? 'disabled' : ''}>Next</button>
                    `;

                    // Add pagination button handlers
                    const prevButton = paginationContainer.querySelector('.prev');
                    const nextButton = paginationContainer.querySelector('.next');

                    prevButton?.addEventListener('click', () => {
                        if (currentPage > 1) {
                            currentPage--;
                            displayPage(currentPage);
                        }
                    });

                    nextButton?.addEventListener('click', () => {
                        if (currentPage < totalPages) {
                            currentPage++;
                            displayPage(currentPage);
                        }
                    });
                };

                // Display first page
                displayPage(1);

                // Fit map bounds to show all markers
                if (this.#markers.length > 0) {
                    const group = L.featureGroup(this.#markers);
                    this.#map.fitBounds(group.getBounds().pad(0.1));
                }
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Could not find restaurants. Please try again!');
        }
    }

    _initializeSearch() {
        const searchInput = document.querySelector('.search__input');
        const searchButton = document.querySelector('.search__button');

        searchButton.addEventListener('click', () => {
            const cityName = searchInput.value.trim();
            if (cityName) this._searchCity(cityName);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const cityName = searchInput.value.trim();
                if (cityName) this._searchCity(cityName);
            }
        });
    }

    _initializeBookmarkHandlers() {
        // Get stored bookmarks or initialize empty array
        this.bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];

        // Add event delegation for bookmark buttons
        document.addEventListener('click', e => {
            const bookmarkBtn = e.target.closest('.popup__bookmark');
            const removeBtn = e.target.closest('.bookmark__remove');

            if (bookmarkBtn) {
                const restaurantData = JSON.parse(decodeURIComponent(bookmarkBtn.dataset.restaurant));

                // Check if restaurant is already bookmarked
                const bookmarkIndex = this.bookmarks.findIndex(
                    bookmark => bookmark.name === restaurantData.name
                );

                // Toggle bookmark
                if (bookmarkIndex === -1) {
                    // Add bookmark
                    this.bookmarks.push(restaurantData);
                    bookmarkBtn.classList.add('popup__bookmark--active');
                } else {
                    // Remove bookmark
                    this.bookmarks.splice(bookmarkIndex, 1);
                    bookmarkBtn.classList.remove('popup__bookmark--active');
                }

                // Save to localStorage
                localStorage.setItem('bookmarks', JSON.stringify(this.bookmarks));

                // Update bookmarks list
                this._updateBookmarksList();
            }

            if (removeBtn) {
                const restaurantData = JSON.parse(decodeURIComponent(removeBtn.dataset.restaurant));

                // Remove from bookmarks
                const bookmarkIndex = this.bookmarks.findIndex(
                    bookmark => bookmark.name === restaurantData.name
                );

                if (bookmarkIndex !== -1) {
                    this.bookmarks.splice(bookmarkIndex, 1);

                    // Update localStorage
                    localStorage.setItem('bookmarks', JSON.stringify(this.bookmarks));

                    // Update bookmarks list
                    this._updateBookmarksList();

                    // Update popup button if it exists
                    const popup = document.querySelector(`.popup__bookmark[data-restaurant="${encodeURIComponent(JSON.stringify(restaurantData))}"]`);
                    if (popup) {
                        popup.classList.remove('popup__bookmark--active');
                    }
                }
            }
        });
    }

    _updateBookmarksList() {
        const bookmarksList = document.querySelector('.bookmarks__list');

        if (this.bookmarks.length === 0) {
            bookmarksList.innerHTML = `
                <div class="message">
                    <div class="message__icon">
                        <svg xmlns="http://www.w3.org/2000/svg" class="smile__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p class="message__text">
                        No bookmarks yet. Find a nice restaurant and bookmark it :)
                    </p>
                </div>
            `;
            return;
        }

        bookmarksList.innerHTML = this.bookmarks
            .map(restaurant => `
                <li class="bookmark__item">
                    <div class="bookmark__content">
                        <h4 class="bookmark__name">${restaurant.name}</h4>
                        <div class="bookmark__details">
                            <span>⭐ ${restaurant.rating}</span>
                            <span>${restaurant.price}</span>
                        </div>
                        <p class="bookmark__address">${restaurant.address}</p>
                    </div>
                    <button class="bookmark__remove" data-restaurant="${encodeURIComponent(JSON.stringify(restaurant))}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="bookmark__remove-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </li>
            `)
            .join('');
    }
}

// Initialize app
const app = new App(); 