// data-processing.js
import { state, DOMElements } from './state.js';
import { renderInterfaceList, renderRejectionCodesList, renderRecentlyViewed } from './dom.js';
import { fuzzySearch } from './utils.js';

// Enhanced data catalogue from Excel file
const enhancedDataItems = {
    "DI-015": { name: "Connection Type Indicator", cmo: "M", rule: "A code to indicate the type of connection at the metering point.", example: "W", enumerated: true, enumValues: "- W  Whole Current\n- L  LV with CT\n- H  HV with CT\n- E  EHV with CT\n- U  Unmetered" },
    "DI-017": { name: "Consent Granularity", cmo: "M", rule: "Describes the granularity of energy settlement data that a customer has deemed to have consented to.", example: "H", enumerated: true, enumValues: "- H  HH Consent Granted\n- D  Daily Reads Only\n- M  Monthly Reads Only\n- N No Consent" },
    "DI-025": { name: "DCC Service Flag", cmo: "M", rule: "A DCC provided flag to indicate the status of the services being provided by the DCC to a Metering Point.", example: "A", enumerated: true, enumValues: "- A  Active\n- I  Installed Not Commissioned\n- N  Non-Active" },
    "DI-030": { name: "Domestic Premise Indicator", cmo: "M", rule: "A flag that indicates if the MPAN of the registration appointment is used to identify a domestic premise.", example: "T", enumerated: true, enumValues: "- T  True (Domestic)\n- F  False (Non-Domestic)" },
    "DI-033": { name: "Energisation Status", cmo: "M", rule: "Indicates if the metering point is considered energised (i.e. connected to the distribution system) and therefore active for settlement purposes.", example: "D", enumerated: true, enumValues: "- D  De-Energised\n- E  Energised" },
    "DI-035": { name: "Energy Direction", cmo: "M", rule: "Indicates the direction of energy at a metering point. Values can be I = import / E = export.", example: "I", enumerated: true, enumValues: "- I  Import\n- E  Export" },
    "DI-037": { name: "GSP Group ID", cmo: "M", rule: "Identifies the distinct grid supply point group (physical region of the country) where the metering point is located.", example: "_K", enumerated: true, enumValues: "_A, _B, _C, _D, _E, _F, _G, _H, _J, _K, _L, _M, _N, _P" },
    "DI-050": { name: "Market Segment Indicator", cmo: "M", rule: "An enumeration of Smart/Advanced/Unmetered.", example: "S", enumerated: true, enumValues: "- U  Unmetered\n- S  Smart including Traditional\n- A  Advanced" },
    "DI-052": { name: "Measurement Quantity ID", cmo: "M", rule: "Identifies the type of the quantity that is measured by the UTC Period Consumption Value.", example: "AI", enumerated: true, enumValues: "- AI  Active Import\n- AE  Active Export\n- RI  Reactive Import\n- RE  Reactive Export" },
    "DI-076": { name: "Estimation Reason Code {e}", cmo: "C", rule: "Reason why Data Service had to provide Estimated/Zero Data", example: "4", enumerated: true, enumValues: "1=Opt Out\n2=Missing\n3=Invalid\n4=Comms Fault\n5=LTV\n6=Disabled\n7=De-Energised\n8=Disconnected\n9=Consumption Amendment\n10=Non-Smart" },
    "DI-083": { name: "Settlement Period Quality Indicator {q}", cmo: "M", rule: "Describes if the UTC Period Consumption Value is an actual or what estimation method was used to estimate it.", example: "A", enumerated: true, enumValues: "A = Actual\nE = Estimate (UMS Only)\nA1,A2,A3,AAE1,AAE2,AAE3,EAE1,EAE2,EAE3 (ADV Only)\nE0 --> E9 = Estimation Method 1 - 9\nEA1-->EA13 = ADS Estimation Methods\nZE = De-Energised (for use with Unmetered Supplies only)\nZE1--> ZE3 = Zero Estimation Method 1 -3" },
    "DI-090": { name: "Meter Location", cmo: "M", rule: "The actual location of the metering system within the site", example: "A", enumerated: true, enumValues: "- A  Attic\n- B  Bedroom\n- C  Cellar/Basement\n- D  Other not specified\n- E  Indoors\n- F  Not known\n- G  Garage/Greenhouse\n- H  Hall\n- I  Cupboard\n- J  Intake\n- K  Kitchen\n- L  Landing\n- M  Sub Station\n- N  TC Chamber\n- O  Outbuilding Barn\n- P  Pole\n- R  Ladder required\n- S  Understairs\n- T  Toilet\n- U  Upstairs\n- V  Vestry\n- W  Under Window\n- X  Outside Box\n- Y  O/S Box with restricted access\n- Z  Communal Cupboard" },
    "DI-094": { name: "Reading Method", cmo: "M", rule: "Indicates how the Cumulative meter reading was obtained/derived", example: "P", enumerated: true, enumValues: "- A  Actual Data Recovered from Meter\n- C  Customer\n- E  Estimate by SDS\n- S  Estimate by Supplier\n- X  Derived Reading (Based on Actual)\n- Y  Derived Reading (Based on Estimate)" },
    "DI-130": { name: "RMP Status (Registration)", cmo: "M", rule: "The MPAN RMP Status as held in the Registration Service", example: "O", enumerated: true, enumValues: "C = Created\nO = Operational\nT = Terminated" },
    "DI-131": { name: "MP Status", cmo: "M", rule: "The MP or Trading Status as held in the Registration Service", example: "T", enumerated: true, enumValues: "N = New\nR = Registered\nT = Traded\nX = Disconnected" },
    "DI-137": { name: "IHD Install Status", cmo: "M", rule: "Information regarding the In Home Display at a metering point.", example: "I", enumerated: true, enumValues: "- I  Installed\n- D  Declined\n- E  Existing\n- F  Failed" }
};

export async function fetchData() {
    try {
        const response = await fetch('interfaceData.json');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const fetchedData = await response.json();
        
        // Merge enhanced data items with existing catalogue
        const mergedCatalogue = { ...fetchedData.dataItemsCatalogue };
        Object.keys(enhancedDataItems).forEach(key => {
            if (mergedCatalogue[key]) {
                mergedCatalogue[key] = { ...mergedCatalogue[key], ...enhancedDataItems[key] };
                if (enhancedDataItems[key].enumValues) {
                    mergedCatalogue[key].populationNotes = enhancedDataItems[key].enumValues;
                }
            } else {
                mergedCatalogue[key] = enhancedDataItems[key];
                if (enhancedDataItems[key].enumValues) {
                    mergedCatalogue[key].populationNotes = enhancedDataItems[key].enumValues;
                }
            }
        });
        
        Object.assign(state, {
            interfaces: fetchedData.interfaces || [],
            dataItemsCatalogue: mergedCatalogue,
            dataBlocksCatalogue: fetchedData.dataBlocksCatalogue || {},
            rejectionCodesCatalogue: fetchedData.rejectionCodesCatalogue || {},
            filteredInterfaces: fetchedData.interfaces || [],
        });
        return true;
    } catch (error) {
        console.error("Could not load interface data:", error);
        DOMElements.interfaceList.innerHTML = `<p class="text-center text-red-600 p-4">Error: Could not load data.</p>`;
        return false;
    }
}

export function filterAndRender() {
    const cacheKey = JSON.stringify({
        filter: state.currentFilter,
        search: state.currentSearchTerm,
        advanced: state.advancedFilters
    });

    if (state.searchCache.has(cacheKey)) {
        state.filteredInterfaces = state.searchCache.get(cacheKey);
    } else {
        const searchTerms = state.currentSearchTerm.toLowerCase().split(' ').filter(term => term.trim() !== '');
        
        state.filteredInterfaces = state.interfaces.filter(item => {
            // Basic filter
            const matchesFilter = state.currentFilter === 'all' ||
                                item.supplier_type === state.currentFilter ||
                                (state.currentFilter === 'supplier_send' && item.supplier_type === 'supplier_both') ||
                                (state.currentFilter === 'supplier_receive' && item.supplier_type === 'supplier_both');
            
            if (!matchesFilter) return false;

            // Advanced filters
            if (state.advancedFilters.sender && !item.sender?.includes(state.advancedFilters.sender)) return false;
            if (state.advancedFilters.receiver && !item.receiver?.includes(state.advancedFilters.receiver)) return false;
            if (state.advancedFilters.hasRejectionCodes && (!item.rejectionCodeIds || item.rejectionCodeIds.length === 0)) return false;
            if (state.advancedFilters.favoritesOnly && !state.favorites.has(item.id)) return false;
            
            // Data items count filter
            const dataItemsCount = getDataItemsCount(item);
            if (dataItemsCount < state.advancedFilters.minDataItems || dataItemsCount > state.advancedFilters.maxDataItems) return false;

            // Search
            if (searchTerms.length === 0) return true;
            
            const searchableContent = buildSearchableContent(item);
            return searchTerms.some(term => {
                const fuzzyResult = fuzzySearch(term, searchableContent, 0.3);
                return fuzzyResult.matches;
            });
        });

        state.searchCache.set(cacheKey, state.filteredInterfaces);
        
        if (state.searchCache.size > 50) {
            const firstKey = state.searchCache.keys().next().value;
            state.searchCache.delete(firstKey);
        }
    }

    renderInterfaceList();
    renderRecentlyViewed();
}

export function buildSearchableContent(interfaceItem) {
    let content = [interfaceItem.id, interfaceItem.name, interfaceItem.description,
                  interfaceItem.sender, interfaceItem.receiver, interfaceItem.context].join(' ').toLowerCase();
    
    if (interfaceItem.composition) {
        interfaceItem.composition.forEach(comp => {
            const items = (comp.type === 'block' && state.dataBlocksCatalogue[comp.id]) ?
                         state.dataBlocksCatalogue[comp.id].items :
                         (comp.type === 'item' ? [comp.id] : []);
            
            items.forEach(itemId => {
                const dataItem = state.dataItemsCatalogue[itemId];
                if (dataItem) {
                    content += ` ${itemId} ${dataItem.name} ${dataItem.rule}`;
                }
            });
        });
    }
    
    return content.toLowerCase();
}

export function getDataItemsCount(interfaceItem) {
    if (!interfaceItem.composition) return 0;
    let count = 0;
    interfaceItem.composition.forEach(comp => {
        if (comp.type === 'block' && state.dataBlocksCatalogue[comp.id]) {
            count += state.dataBlocksCatalogue[comp.id].items.length;
        } else if (comp.type === 'item') {
            count += 1;
        }
    });
    return count;
}
