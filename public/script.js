// Cache for search results (5 minute TTL) and pagination (2 minute TTL)
const cache = new Map();
const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for search results
const PAGE_CACHE_TTL = 2 * 60 * 1000; // 2 minutes for pagination

function getCacheKey(type, value) {
    return `${type}_${value}`;
}

function isCacheValid(timestamp, ttl) {
    return Date.now() - timestamp < ttl;
}

// State
let currentPage = 1;
let isSearchMode = false;
let currentSearchTerm = '';
let nextToken = null;
let pageHistory = []; // Store page data for going back

// API calls
async function fetchPreprints(token = null) {
    // Cache pagination requests for 2 minutes
    const cacheKey = getCacheKey('page', token || 'first');
    const cached = cache.get(cacheKey);
    
    if (cached && isCacheValid(cached.timestamp, PAGE_CACHE_TTL)) {
        return cached.data;
    }
    
    try {
        let url = '/api/preprints';
        if (token) {
            url += `?next=${encodeURIComponent(token)}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        
        // Cache the result
        cache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
    } catch (error) {
        console.error('Failed to fetch preprints:', error);
        throw error;
    }
}

async function searchPreprints(searchTerm) {
    const cacheKey = getCacheKey('search', searchTerm);
    const cached = cache.get(cacheKey);
    
    if (cached && isCacheValid(cached.timestamp, SEARCH_CACHE_TTL)) {
        return cached.data;
    }
    
    try {
        const response = await fetch(`/api/preprints?search=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        
        // Cache the result
        cache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
    } catch (error) {
        console.error('Failed to search preprints:', error);
        throw error;
    }
}

async function fetchPreprintDetails(id) {
    try {
        const response = await fetch(`/api/preprints/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch preprint details:', error);
        throw error;
    }
}

// UI functions
function showLoading(message = 'Loading preprints...') {
    const preprintsList = document.getElementById('preprints-list');
    const statusText = document.getElementById('status-text');
    
    preprintsList.innerHTML = `<li class="loading"><span class="loading-spinner"></span>${message}</li>`;
    statusText.textContent = message;
}

function renderPreprints(preprints, statusMessage = '') {
    const preprintsList = document.getElementById('preprints-list');
    const statusText = document.getElementById('status-text');
    
    statusText.textContent = statusMessage;
    
    if (preprints.length === 0) {
        preprintsList.innerHTML = '<li class="no-results">No preprints found.</li>';
        return;
    }
    
    preprintsList.innerHTML = '';
    preprints.forEach(preprint => {
        const li = document.createElement('li');
        const title = document.createElement('a');
        title.href = `preprint.html?id=${preprint.id}`;
        title.textContent = preprint.title;
        title.className = 'preprint-link';
        
        const contributors = document.createElement('div');
        contributors.className = 'contributors';
        try {
            const contributorData = JSON.parse(preprint.contributors);
            const authorNames = contributorData.map(c => c.full_name).join(', ');
            contributors.textContent = authorNames || 'Unknown Authors';
        } catch (e) {
            contributors.textContent = 'Unknown Authors';
        }
        
        li.appendChild(title);
        li.appendChild(contributors);
        preprintsList.appendChild(li);
    });
}

function updatePagination(pagination) {
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    
    if (isSearchMode) {
        // Hide pagination in search mode
        document.querySelector('.pagination').style.display = 'none';
        return;
    }
    
    document.querySelector('.pagination').style.display = 'flex';
    prevButton.disabled = pageHistory.length === 0; // Can go back if we have history
    nextButton.disabled = !pagination.hasMore;
    pageInfo.textContent = `Page ${currentPage}`;
    
    // Store next token
    nextToken = pagination.nextToken;
}

async function loadFirstPage() {
    currentPage = 1;
    nextToken = null;
    pageHistory = []; // Clear history when starting fresh
    showLoading();
    
    try {
        const result = await fetchPreprints();
        renderPreprints(result.data, `Latest preprints (Page 1)`);
        updatePagination(result.pagination);
    } catch (error) {
        const preprintsList = document.getElementById('preprints-list');
        preprintsList.innerHTML = `<li class="error">Failed to load preprints. <a href="#" onclick="loadFirstPage()">Try again</a></li>`;
        document.getElementById('status-text').textContent = 'Error loading data';
    }
}

async function loadNextPage() {
    if (!nextToken) return;
    
    // Store current page data before moving forward
    const currentData = {
        page: currentPage,
        data: Array.from(document.querySelectorAll('#preprints-list li')).map(li => li.outerHTML)
    };
    pageHistory.push(currentData);
    
    currentPage++;
    showLoading();
    
    try {
        const result = await fetchPreprints(nextToken);
        renderPreprints(result.data, `Latest preprints (Page ${currentPage})`);
        updatePagination(result.pagination);
    } catch (error) {
        currentPage--; // Revert on error
        pageHistory.pop(); // Remove the stored data since we failed
        const preprintsList = document.getElementById('preprints-list');
        preprintsList.innerHTML = `<li class="error">Failed to load preprints. <a href="#" onclick="loadNextPage()">Try again</a></li>`;
        document.getElementById('status-text').textContent = 'Error loading data';
    }
}

async function loadPreviousPage() {
    if (pageHistory.length === 0) return;
    
    const previousPageData = pageHistory.pop();
    currentPage = previousPageData.page;
    
    // Restore the previous page from stored HTML
    const preprintsList = document.getElementById('preprints-list');
    preprintsList.innerHTML = previousPageData.data.join('');
    
    document.getElementById('status-text').textContent = `Latest preprints (Page ${currentPage})`;
    
    // Update pagination buttons
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    
    prevButton.disabled = pageHistory.length === 0;
    nextButton.disabled = false; // Can always go forward from a cached page
    document.getElementById('page-info').textContent = `Page ${currentPage}`;
}

async function performSearch(searchTerm) {
    if (!searchTerm.trim()) {
        // Return to browsing mode
        isSearchMode = false;
        currentSearchTerm = '';
        await loadFirstPage();
        return;
    }
    
    isSearchMode = true;
    currentSearchTerm = searchTerm;
    showLoading('Searching all preprints...');
    
    try {
        const result = await searchPreprints(searchTerm);
        renderPreprints(result.data, `Search results for "${searchTerm}" (${result.data.length} found)`);
        updatePagination({ hasMore: false });
    } catch (error) {
        const preprintsList = document.getElementById('preprints-list');
        preprintsList.innerHTML = `<li class="error">Search failed. <a href="#" onclick="performSearch('${searchTerm}')">Try again</a></li>`;
        document.getElementById('status-text').textContent = 'Search error';
    }
}

// Individual preprint page
async function displayPreprintDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const preprintId = urlParams.get('id');
    
    if (!preprintId) {
        document.getElementById('preprint-title').textContent = 'Error: No preprint ID provided';
        return;
    }
    
    // Show loading state
    document.getElementById('preprint-title').innerHTML = '<span class="loading-spinner"></span>Loading preprint details...';
    document.getElementById('preprint-authors').textContent = 'Loading authors...';
    document.getElementById('preprint-keywords').textContent = 'Loading keywords...';
    document.getElementById('preprint-abstract').textContent = 'Loading abstract...';
    
    try {
        const preprint = await fetchPreprintDetails(preprintId);
        
        document.getElementById('preprint-title').textContent = preprint.title;
        
        try {
            const contributorData = JSON.parse(preprint.contributors);
            const authorNames = contributorData.map(c => c.full_name).join(', ');
            document.getElementById('preprint-authors').textContent = 'Authors: ' + (authorNames || 'Unknown Authors');
        } catch (e) {
            document.getElementById('preprint-authors').textContent = 'Authors: Unknown Authors';
        }
        
        try {
            const tags = JSON.parse(preprint.tags);
            document.getElementById('preprint-keywords').textContent = 'Keywords: ' + (tags.length > 0 ? tags.join(', ') : 'None');
        } catch (e) {
            document.getElementById('preprint-keywords').textContent = 'Keywords: None';
        }
        
        document.getElementById('preprint-abstract').textContent = preprint.description;
        
        if (preprint.download_url) {
            document.getElementById('preprint-download').href = preprint.download_url;
        } else {
            document.getElementById('preprint-download').style.display = 'none';
        }
        
        document.getElementById('preprint-osf-link').href = `https://osf.io/preprints/psyarxiv/${preprintId}`;
    } catch (error) {
        document.getElementById('preprint-title').innerHTML = `Error loading preprint. <a href="#" onclick="window.location.reload()">Try again</a>`;
        document.getElementById('preprint-authors').textContent = 'Failed to load authors';
        document.getElementById('preprint-keywords').textContent = 'Failed to load keywords';
        document.getElementById('preprint-abstract').textContent = 'Failed to load abstract.';
    }
}

// Initialize
if (window.location.pathname.endsWith('preprint.html')) {
    displayPreprintDetails();
} else {
    // Search event listeners
    const searchInput = document.getElementById('search-input');
    const clearButton = document.getElementById('clear-search');
    
    searchInput.addEventListener('input', (e) => {
        clearButton.style.display = e.target.value ? 'block' : 'none';
    });
    
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch(e.target.value);
        }
    });
    
    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        clearButton.style.display = 'none';
        performSearch('');
    });
    
    // Pagination event listeners  
    document.getElementById('prev-page').addEventListener('click', () => {
        loadPreviousPage();
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        loadNextPage();
    });
    
    // Load initial data
    loadFirstPage();
}