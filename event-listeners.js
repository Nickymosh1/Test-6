// event-listeners.js
import { state, DOMElements } from './state.js';
import { filterAndRender, buildSearchableContent } from './data-processing.js';
import { generateInterfaceForm, hideFormBuilder, showFormBuilder, hideRejectionCodes, showRejectionCodes } from './dom.js';

export function setupEventListeners() {
    let debounceTimer;
    DOMElements.searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            state.currentSearchTerm = e.target.value;
            updateSearchSuggestions();
            filterAndRender();
        }, 200);
    });

    DOMElements.searchInput.addEventListener('focus', updateSearchSuggestions);
    DOMElements.searchInput.addEventListener('blur', () => {
        setTimeout(() => DOMElements.searchSuggestions.classList.add('hidden'), 200);
    });

    DOMElements.filterButtons.forEach(button =>
        button.addEventListener('click', () => handleFilterClick(button))
    );

    DOMElements.advancedToggle.addEventListener('click', toggleAdvancedFilters);
    ['senderFilter', 'receiverFilter', 'minDataItems', 'maxDataItems', 'hasRejectionCodes', 'favoritesOnly'].forEach(id => {
        DOMElements[id].addEventListener('change', handleAdvancedFilterChange);
        DOMElements[id].addEventListener('input', handleAdvancedFilterChange);
    });
    DOMElements.clearFilters.addEventListener('click', clearAllFilters);

    DOMElements.interfaceList.addEventListener('click', handleInterfaceClick);
    DOMElements.interfaceList.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleInterfaceClick(e);
        }
    });

    DOMElements.rejectionCodesBtn.addEventListener('click', showRejectionCodes);
    DOMElements.fillFormBtn.addEventListener('click', showFormBuilder);

    DOMElements.closeRejectionCodes.addEventListener('click', hideRejectionCodes);
    DOMElements.closeFormBuilder.addEventListener('click', hideFormBuilder);

    DOMElements.exportFormBtn.addEventListener('click', exportFormData);

    DOMElements.searchSuggestions.addEventListener('click', (e) => {
        if (e.target.dataset.suggestion) {
            DOMElements.searchInput.value = e.target.dataset.suggestion;
            state.currentSearchTerm = e.target.dataset.suggestion;
            DOMElements.searchSuggestions.classList.add('hidden');
            filterAndRender();
        }
    });

    DOMElements.rejectionCodeSearch.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            filterRejectionCodes(e.target.value);
        }, 200);
    });
}

function handleFilterClick(button) {
    state.currentFilter = button.dataset.filter;
    DOMElements.filterButtons.forEach(btn => {
        btn.classList.remove('active-filter');
        btn.setAttribute('aria-pressed', 'false');
    });
    button.classList.add('active-filter');
    button.setAttribute('aria-pressed', 'true');
    filterAndRender();
}

function handleInterfaceClick(e) {
    const element = e.target.closest('[data-id]');
    if (!element) return;
    
    const id = element.dataset.id;
    
    if (e.detail === 2) {
        toggleFavorite(id);
        return;
    }
    
    renderInterfaceDetails(id);
    addToRecentlyViewed(id);
}

export function toggleFavorite(id) {
    if (state.favorites.has(id)) {
        state.favorites.delete(id);
    } else {
        state.favorites.add(id);
    }
    saveUserData();
    renderInterfaceList();
}

function updateSearchSuggestions() {
    if (state.currentSearchTerm.length < 2) {
        DOMElements.searchSuggestions.classList.add('hidden');
        return;
    }

    const suggestions = generateSearchSuggestions(state.currentSearchTerm);
    
    if (suggestions.length === 0) {
        DOMElements.searchSuggestions.classList.add('hidden');
        return;
    }

    const html = suggestions.map(suggestion =>
        `<div class="p-2 hover:bg-gray-50 cursor-pointer text-sm" data-suggestion="${escapeHtml(suggestion)}">${escapeHtml(suggestion)}</div>`
    ).join('');

    DOMElements.searchSuggestions.innerHTML = html;
    DOMElements.searchSuggestions.classList.remove('hidden');
}

function generateSearchSuggestions(query) {
    const suggestions = new Set();
    const queryLower = query.toLowerCase();

    state.interfaces.forEach(item => {
        if (item.name.toLowerCase().includes(queryLower)) suggestions.add(item.name);
        if (item.id.toLowerCase().includes(queryLower)) suggestions.add(item.id);
        
        if (item.composition) {
            item.composition.forEach(comp => {
                if (comp.type === 'block' && state.dataBlocksCatalogue[comp.id]) {
                    state.dataBlocksCatalogue[comp.id].items.forEach(itemId => {
                        const dataItem = state.dataItemsCatalogue[itemId];
                        if (dataItem && dataItem.name.toLowerCase().includes(queryLower)) {
                            suggestions.add(dataItem.name);
                        }
                    });
                }
            });
        }
    });

    return Array.from(suggestions).slice(0, 8).sort();
}

function toggleAdvancedFilters() {
    const panel = DOMElements.advancedFilters;
    const icon = DOMElements.advancedToggle.querySelector('svg');
    
    if (panel.classList.contains('expanded')) {
        panel.classList.remove('expanded');
        icon.style.transform = 'rotate(0deg)';
    } else {
        panel.classList.add('expanded');
        icon.style.transform = 'rotate(180deg)';
    }
}

function handleAdvancedFilterChange() {
    state.advancedFilters = {
        sender: DOMElements.senderFilter.value,
        receiver: DOMElements.receiverFilter.value,
        minDataItems: parseInt(DOMElements.minDataItems.value) || 0,
        maxDataItems: parseInt(DOMElements.maxDataItems.value) || Infinity,
        hasRejectionCodes: DOMElements.hasRejectionCodes.checked,
        favoritesOnly: DOMElements.favoritesOnly.checked
    };
    filterAndRender();
}

function clearAllFilters() {
    DOMElements.senderFilter.value = '';
    DOMElements.receiverFilter.value = '';
    DOMElements.minDataItems.value = '';
    DOMElements.maxDataItems.value = '';
    DOMElements.hasRejectionCodes.checked = false;
    DOMElements.favoritesOnly.checked = false;
    DOMElements.searchInput.value = '';
    state.currentSearchTerm = '';
    state.advancedFilters = {};
    filterAndRender();
}

function addToRecentlyViewed(id) {
    state.recentlyViewed = state.recentlyViewed.filter(item => item !== id);
    state.recentlyViewed.unshift(id);
    state.recentlyViewed = state.recentlyViewed.slice(0, 5);
    saveUserData();
    renderRecentlyViewed();
}

function renderRecentlyViewed() {
    const html = state.recentlyViewed.map(id => {
        const item = state.interfaces.find(i => i.id === id);
        if (!item) return '';
        return `<div class="text-xs p-2 bg-white/50 rounded-lg cursor-pointer hover:bg-white/80 transition-colors" data-id="${id}">${escapeHtml(item.id)}</div>`;
    }).join('');
    
    DOMElements.recentList.innerHTML = html;
    
    DOMElements.recentList.addEventListener('click', (e) => {
        const element = e.target.closest('[data-id]');
        if (element) renderInterfaceDetails(element.dataset.id);
    });
}
