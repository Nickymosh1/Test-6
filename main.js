// main.js
import { state, DOMElements } from './state.js';
import { fetchData, filterAndRender } from './data-processing.js';
import { cacheDOMElements } from './dom.js';
import { setupEventListeners, setupAdvancedFilters } from './event-listeners.js';

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

function loadUserData() {
    try {
        const savedFavorites = localStorage.getItem('mhhs_favorites');
        if (savedFavorites) state.favorites = new Set(JSON.parse(savedFavorites));
        
        const savedRecent = localStorage.getItem('mhhs_recent');
        if (savedRecent) state.recentlyViewed = JSON.parse(savedRecent).slice(0, 5);
    } catch (e) {
        console.warn('Could not load user data:', e);
    }
}

function saveUserData() {
    try {
        localStorage.setItem('mhhs_favorites', JSON.stringify([...state.favorites]));
        localStorage.setItem('mhhs_recent', JSON.stringify(state.recentlyViewed));
    } catch (e) {
        console.warn('Could not save user data:', e);
    }
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

function escapeHtml(text) {
    if (text === null || typeof text === 'undefined') return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

function renderInterfaceDetails(id) {
    const item = state.interfaces.find(i => i.id === id);
    if (!item) return;

    state.currentInterfaceId = id;
    DOMElements.fillFormBtn.disabled = false;
    
    // Assuming these functions exist elsewhere or are part of the monolithic JS
    // hideRejectionCodes();
    // hideFormBuilder();
    DOMElements.welcomeMessage.classList.add('hidden');
    DOMElements.detailsContent.classList.remove('hidden');
    DOMElements.detailsContent.classList.add('details-fade-in');
    setTimeout(() => DOMElements.detailsContent.classList.remove('details-fade-in'), 500);

    const typeInfo = {
        supplier_send: { label: 'Supplier Send', classes: 'bg-gradient-to-r from-[var(--data-gas-off)] to-purple-600 text-white' },
        supplier_receive: { label: 'Supplier Receive', classes: 'bg-gradient-to-r from-[var(--data-sun)] to-yellow-400 text-[var(--dark-purple)]' },
        supplier_both: { label: 'Supplier Send & Receive', classes: 'bg-gradient-to-r from-[var(--data-leaf)] to-green-400 text-[var(--dark-purple)]' },
        none: { label: 'Supplier Not Involved', classes: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white' }
    };

    const isFavorite = state.favorites.has(id);
    const dataItemsHtml = `<!-- dataItemsHtml placeholder -->`; // Placeholder for the actual content
    const rejectionCodesHtml = `<!-- rejectionCodesHtml placeholder -->`; // Placeholder for the actual content

    DOMElements.detailsContent.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
            <div class="flex-1">
                <div class="flex items-center gap-3 mb-1">
                    <h2 class="text-2xl lg:text-3xl font-bold text-[var(--dark-purple)] leading-tight" tabindex="-1">${escapeHtml(item.name)}</h2>
                    <button onclick="window.toggleFavorite('${id}')" class="text-2xl ${isFavorite ? 'text-[var(--data-sun)]' : 'text-gray-400'} hover:scale-110 transition-transform" title="${isFavorite ? 'Remove from' : 'Add to'} favorites">
                        ${isFavorite ? '★' : '☆'}
                    </button>
                </div>
                <p class="text-base lg:text-lg text-[var(--purple)] opacity-90 font-medium">${escapeHtml(item.id)}</p>
            </div>
            <span class="text-xs font-semibold px-4 py-2 rounded-full shadow-md ${typeInfo[item.supplier_type].classes} whitespace-nowrap">${escapeHtml(typeInfo[item.supplier_type].label)}</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            <div class="bg-white/50 p-4 sm:p-5 rounded-2xl shadow-lg border border-gray-100">
                <h4 class="font-bold text-[var(--eon-red)] text-xs mb-2 uppercase tracking-wider">FROM</h4>
                <p class="font-semibold text-[var(--dark-purple)] text-sm md:text-base leading-relaxed">${escapeHtml(item.sender) || 'N/A'}</p>
            </div>
            <div class="bg-white/50 p-4 sm:p-5 rounded-2xl shadow-lg border border-gray-100">
                <h4 class="font-bold text-[var(--eon-red)] text-xs mb-2 uppercase tracking-wider">TO</h4>
                <p class="font-semibold text-[var(--dark-purple)] text-sm md:text-base leading-relaxed">${escapeHtml(item.receiver) || 'N/A'}</p>
            </div>
        </div>
        <div class="bg-white/50 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
            <h3 class="text-xl font-bold text-[var(--eon-red)] mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Context & Purpose
            </h3>
            <p class="text-[var(--dark-purple)] leading-relaxed text-sm md:text-base">${escapeHtml(item.context || "No context available.")}</p>
        </div>
        ${dataItemsHtml}
        ${rejectionCodesHtml}`;
    
    DOMElements.detailsContent.querySelector('h2').focus({ preventScroll: true });
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
