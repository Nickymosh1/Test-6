// state.js
export const state = {
    interfaces: [],
    dataItemsCatalogue: {},
    dataBlocksCatalogue: {},
    rejectionCodesCatalogue: {},
    filteredInterfaces: [],
    currentFilter: 'all',
    currentSearchTerm: '',
    advancedFilters: {},
    favorites: new Set(),
    recentlyViewed: [],
    searchCache: new Map(),
    currentInterfaceId: null
};

export const DOMElements = {};
