document.addEventListener('DOMContentLoaded', function () {
    // User menu dropdown functionality
    const userMenuButton = document.querySelector('.user-menu__button');
    const userMenuDropdown = document.querySelector('.user-menu__dropdown');

    if (userMenuButton && userMenuDropdown) {
        userMenuButton.addEventListener('click', function (e) {
            e.stopPropagation();
            userMenuDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', function (e) {
            if (!userMenuButton.contains(e.target)) {
                userMenuDropdown.classList.add('hidden');
            }
        });
    }

    // Bookmark dropdown functionality
    const bookmarkBtn = document.querySelector('.bookmark__button');
    const bookmarksDropdown = document.querySelector('.bookmarks');

    if (bookmarkBtn && bookmarksDropdown) {
        bookmarkBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            bookmarksDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', function (e) {
            if (!bookmarkBtn.contains(e.target) && !bookmarksDropdown.contains(e.target)) {
                bookmarksDropdown.classList.add('hidden');
            }
        });
    }
}); 