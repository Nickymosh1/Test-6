// utils.js
export function escapeHtml(text) {
    if (text === null || typeof text === 'undefined') return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

export function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function fuzzySearch(query, text, threshold = 0.6) {
    if (!query || !text) return { matches: false, score: 0 };
    
    query = query.toLowerCase();
    text = text.toLowerCase();
    
    if (text.includes(query)) return { matches: true, score: 1 };
    
    const score = calculateSimilarity(query, text);
    return { matches: score >= threshold, score };
}

function calculateSimilarity(a, b) {
    const matrix = Array(a.length + 1).fill().map(() => Array(b.length + 1).fill(0));
    
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    
    const maxLen = Math.max(a.length, b.length);
    return maxLen > 0 ? 1 - (matrix[a.length][b.length] / maxLen) : 1;
}

export function highlightSearchTerms(text, searchTerm) {
    if (!searchTerm || !text) return escapeHtml(text);
    
    const terms = searchTerm.toLowerCase().split(' ').filter(t => t.trim());
    let highlighted = escapeHtml(text);
    
    terms.forEach(term => {
        const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
        highlighted = highlighted.replace(regex, '<span class="highlight">$1</span>');
    });
    
    return highlighted;
}

export function downloadFile(data, filename, mimeType) {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
