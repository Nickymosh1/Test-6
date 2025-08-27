// main.js
import { state, DOMElements } from './state.js';
import { fetchData, filterAndRender } from './data-processing.js';
import { cacheDOMElements, renderRecentlyViewed } from './dom.js';
import { setupEventListeners, setupAdvancedFilters } from './event-listeners.js';
import { loadUserData, saveUserData } from './user-data.js';

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    cacheDOMElements();
    loadUserData();
    const success = await fetchData();
    if (!success) return;
    setupEventListeners();
    setupAdvancedFilters();
    document.querySelector('.filter-btn[data-filter="all"]').classList.add('active-filter');
    filterAndRender();
    renderRecentlyViewed();
}

// Export functions that are still needed by HTML event handlers
window.toggleFavorite = (id) => {
    if (state.favorites.has(id)) {
        state.favorites.delete(id);
    } else {
        state.favorites.add(id);
    }
    saveUserData();
    filterAndRender();
};
