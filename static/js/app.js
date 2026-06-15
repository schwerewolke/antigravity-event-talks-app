// State Management
let notesData = null;
let selectedUpdate = null;
let activeFilters = {
    search: '',
    category: 'all'
};
let activeSort = 'newest';
let activeTemplateStyle = 'professional';

// DOM Elements
const notesContainer = document.getElementById('notes-container');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const feedStatus = document.getElementById('feed-status');

const refreshBtn = document.getElementById('refresh-btn');
const spinner = document.getElementById('spinner');
const retryBtn = document.getElementById('retry-btn');

const searchInput = document.getElementById('search-input');
const filterBtns = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sort-select');

// Stats Elements
const statTotal = document.querySelector('#stat-total .stat-num');
const statFeatures = document.querySelector('#stat-features .stat-num');
const statBreaking = document.querySelector('#stat-breaking .stat-num');
const statIssues = document.querySelector('#stat-issues .stat-num');

// Drawer Elements
const tweetDrawer = document.getElementById('tweet-drawer');
const closeDrawerBtn = document.getElementById('close-drawer-btn');
const previewCategory = document.getElementById('preview-category');
const previewDate = document.getElementById('preview-date');
const previewContent = document.getElementById('preview-content');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCount = document.getElementById('char-count');
const templateBtns = document.querySelectorAll('.template-btn');
const copyTweetBtn = document.getElementById('copy-tweet-btn');
const postTweetBtn = document.getElementById('post-tweet-btn');

// Toast Notification
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    fetchNotes(false);
});

// Setup Event Listeners
function initEventListeners() {
    // Refresh & Retry
    refreshBtn.addEventListener('click', () => fetchNotes(true));
    retryBtn.addEventListener('click', () => fetchNotes(true));

    // Search and Filters
    searchInput.addEventListener('input', (e) => {
        activeFilters.search = e.target.value.toLowerCase();
        renderNotes();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilters.category = btn.dataset.category;
            renderNotes();
        });
    });

    sortSelect.addEventListener('change', (e) => {
        activeSort = e.target.value;
        renderNotes();
    });

    // Drawer Controls
    closeDrawerBtn.addEventListener('click', closeDrawer);

    templateBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            templateBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeTemplateStyle = btn.dataset.style;
            if (selectedUpdate) {
                updateComposerText();
            }
        });
    });

    tweetTextarea.addEventListener('input', () => {
        updateCharCounter();
    });

    copyTweetBtn.addEventListener('click', copyTweetToClipboard);
    postTweetBtn.addEventListener('click', postToTwitter);
}

// Fetch Notes from Backend API
async function fetchNotes(forceRefresh = false) {
    showLoading(true);
    showError(false);
    
    if (forceRefresh) {
        spinner.classList.add('spinning');
    }

    try {
        const url = forceRefresh ? '/api/notes?refresh=true' : '/api/notes';
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        notesData = data;
        
        // Update Feed Status message
        const lastUpdated = new Date(data.fetched_at * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        feedStatus.textContent = `Last synchronized today at ${lastUpdated}`;
        
        calculateStats();
        renderNotes();
        showLoading(false);
    } catch (err) {
        console.error('Error fetching release notes:', err);
        errorMessage.textContent = err.message || 'Could not connect to the server.';
        showError(true);
        showLoading(false);
    } finally {
        spinner.classList.remove('spinning');
    }
}

// Show/Hide Loading Overlay
function showLoading(show) {
    if (show) {
        loadingState.classList.remove('hidden');
        notesContainer.classList.add('hidden');
    } else {
        loadingState.classList.add('hidden');
        notesContainer.classList.remove('hidden');
    }
}

// Show/Hide Error State
function showError(show) {
    if (show) {
        errorState.classList.remove('hidden');
        notesContainer.classList.add('hidden');
    } else {
        errorState.classList.add('hidden');
    }
}

// Calculate Summary Statistics
function calculateStats() {
    if (!notesData || !notesData.entries) return;
    
    let total = 0;
    let features = 0;
    let breaking = 0;
    let issues = 0;

    notesData.entries.forEach(entry => {
        entry.updates.forEach(update => {
            total++;
            if (update.type === 'Feature') features++;
            else if (update.type === 'Breaking') breaking++;
            else if (update.type === 'Issue') issues++;
        });
    });

    // Animate numbers
    animateNumber(statTotal, total);
    animateNumber(statFeatures, features);
    animateNumber(statBreaking, breaking);
    animateNumber(statIssues, issues);
}

// Helper to Animate Stats Counter Numbers
function animateNumber(element, target) {
    let current = parseInt(element.textContent) || 0;
    if (current === target) return;
    
    const duration = 800; // ms
    const stepTime = Math.max(Math.floor(duration / Math.abs(target - current)), 15);
    const increment = target > current ? 1 : -1;
    
    const timer = setInterval(() => {
        current += increment;
        element.textContent = current;
        if (current === target) {
            clearInterval(timer);
        }
    }, stepTime);
}

// Filter and Sort the Notes
function getFilteredAndSortedNotes() {
    if (!notesData || !notesData.entries) return [];

    let processedEntries = [];

    notesData.entries.forEach(entry => {
        // Filter the individual updates in this entry
        const filteredUpdates = entry.updates.filter(update => {
            // Category filter
            if (activeFilters.category !== 'all' && update.type !== activeFilters.category) {
                return false;
            }
            
            // Search text filter
            if (activeFilters.search) {
                const searchLower = activeFilters.search;
                const matchType = update.type.toLowerCase().includes(searchLower);
                const matchText = update.text.toLowerCase().includes(searchLower);
                const matchDate = entry.date.toLowerCase().includes(searchLower);
                return matchType || matchText || matchDate;
            }
            
            return true;
        });

        // Only include entry if it contains updates matching the filters
        if (filteredUpdates.length > 0) {
            processedEntries.push({
                ...entry,
                updates: filteredUpdates
            });
        }
    });

    // Sort entries by date
    processedEntries.sort((a, b) => {
        const dateA = new Date(a.updated || a.date);
        const dateB = new Date(b.updated || b.date);
        return activeSort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return processedEntries;
}

// Render Release Notes to the DOM
function renderNotes() {
    const filteredEntries = getFilteredAndSortedNotes();
    notesContainer.innerHTML = '';

    if (filteredEntries.length === 0) {
        notesContainer.innerHTML = `
            <div class="error-state">
                <i class="fa-solid fa-magnifying-glass-minus error-icon" style="color: var(--text-muted)"></i>
                <h3>No Release Notes Found</h3>
                <p>Try clearing your search query or choosing another category filter.</p>
            </div>
        `;
        return;
    }

    filteredEntries.forEach(entry => {
        const dateGroup = document.createElement('div');
        dateGroup.className = 'date-group';
        
        // Date Header
        const dateHeading = document.createElement('div');
        dateHeading.className = 'date-heading';
        dateHeading.innerHTML = `<i class="fa-regular fa-calendar"></i> ${entry.date}`;
        dateGroup.appendChild(dateHeading);

        const cardList = document.createElement('div');
        cardList.className = 'update-card-list';

        // Render each update within the date
        entry.updates.forEach((update, idx) => {
            const card = document.createElement('div');
            card.className = 'update-card';
            
            // Unique key to identify update
            const updateKey = `${entry.id}-${idx}`;
            card.dataset.key = updateKey;
            
            // Check if currently selected
            if (selectedUpdate && selectedUpdate.key === updateKey) {
                card.classList.add('selected');
            }

            // Category badge CSS class
            const badgeClass = `badge-${update.type.toLowerCase()}-bg`;

            card.innerHTML = `
                <div class="card-selector">
                    <div class="custom-checkbox">
                        <i class="fa-solid fa-check"></i>
                    </div>
                </div>
                <div class="card-content-wrapper">
                    <div class="card-meta">
                        <span class="category-badge ${badgeClass}">${update.type}</span>
                    </div>
                    <div class="card-body">
                        ${update.html}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-card-tweet" title="Tweet this update">
                        <i class="fa-brands fa-x-twitter"></i>
                    </button>
                </div>
            `;

            // Click on card selects it
            card.addEventListener('click', (e) => {
                // Prevent trigger if clicking a link directly
                if (e.target.tagName === 'A') return;
                
                selectUpdate(update, entry.date, entry.link, updateKey);
            });

            // Prevent event propagation for the inner card tweet button
            const cardTweetBtn = card.querySelector('.btn-card-tweet');
            cardTweetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                selectUpdate(update, entry.date, entry.link, updateKey);
                openDrawer();
            });

            cardList.appendChild(card);
        });

        dateGroup.appendChild(cardList);
        notesContainer.appendChild(dateGroup);
    });
}

// Select specific update to populate drawer
function selectUpdate(update, date, link, key) {
    // Clear selection if clicking the same selected card
    if (selectedUpdate && selectedUpdate.key === key) {
        selectedUpdate = null;
        document.querySelectorAll('.update-card').forEach(c => c.classList.remove('selected'));
        closeDrawer();
        return;
    }

    selectedUpdate = {
        ...update,
        date: date,
        link: link,
        key: key
    };

    // Highlight card
    document.querySelectorAll('.update-card').forEach(c => {
        if (c.dataset.key === key) {
            c.classList.add('selected');
        } else {
            c.classList.remove('selected');
        }
    });

    // Populate drawer preview
    previewCategory.textContent = update.type;
    previewCategory.className = `preview-badge badge-${update.type.toLowerCase()}-bg`;
    previewDate.textContent = date;
    previewContent.textContent = update.text;

    // Generate tweet text
    updateComposerText();
    openDrawer();
}

// Generate the customized Tweet text based on active template
function generateTweetText(update, style) {
    if (!update) return '';

    const date = update.date;
    const type = update.type;
    const text = update.text;
    const link = update.link;
    
    // Clean up excessive whitespaces
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    let template = "";
    if (style === 'hype') {
        template = `🔥 Huge update for #BigQuery! [Snippet]\n\nDetails: ${link} #GoogleCloud #DataEngineering`;
    } else if (style === 'minimal') {
        template = `BQ Release (${date}) | ${type}:\n[Snippet]\n\n${link}`;
    } else { // professional
        template = `🚀 Google BigQuery Release notes - ${type} (${date}):\n[Snippet]\n\nRead more: ${link} #BigQuery #GoogleCloud`;
    }
    
    // Calculate remaining character count for the snippet
    const placeholder = "[Snippet]";
    const textWithoutSnippet = template.replace(placeholder, "");
    
    // Twitter link counts as 23 characters in real client, but we approximate here.
    // Standard URL length replacement for length calculations:
    const urlLengthFix = 23; 
    let baseLength = textWithoutSnippet.length - link.length + urlLengthFix;
    
    const availableLength = 280 - baseLength;
    
    let snippet = cleanText;
    if (snippet.length > availableLength) {
        // Truncate at word boundary
        let truncated = snippet.substring(0, availableLength - 3);
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > 0) {
            truncated = truncated.substring(0, lastSpace);
        }
        snippet = truncated + "...";
    }
    
    return template.replace(placeholder, snippet);
}

// Update Composer Text and character counter
function updateComposerText() {
    if (!selectedUpdate) return;
    
    const tweetText = generateTweetText(selectedUpdate, activeTemplateStyle);
    tweetTextarea.value = tweetText;
    updateCharCounter();
}

// Character Counter
function updateCharCounter() {
    const text = tweetTextarea.value;
    
    // Twitter counts any URL as 23 characters. We should account for this.
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];
    let displayLength = text.length;
    
    urls.forEach(url => {
        displayLength = displayLength - url.length + 23;
    });

    charCount.textContent = displayLength;

    if (displayLength > 280) {
        charCount.className = 'tweet-char-counter danger';
        postTweetBtn.disabled = true;
    } else if (displayLength > 240) {
        charCount.className = 'tweet-char-counter warning';
        postTweetBtn.disabled = false;
    } else {
        charCount.className = 'tweet-char-counter';
        postTweetBtn.disabled = false;
    }
}

// Drawer Visibility
function openDrawer() {
    tweetDrawer.classList.add('open');
}

function closeDrawer() {
    tweetDrawer.classList.remove('open');
}

// Action: Copy Tweet to Clipboard
function copyTweetToClipboard() {
    const text = tweetTextarea.value;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied tweet to clipboard!');
    }).catch(err => {
        console.error('Could not copy text: ', err);
        showToast('Failed to copy. Please copy manually.');
    });
}

// Action: Post to Twitter (opens Web Intent)
function postToTwitter() {
    const text = tweetTextarea.value;
    const encodedText = encodeURIComponent(text);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
}

// Show Floating Toast message
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
