/**
 * Hyperforge Labs Developer Tools Hub v2.0
 * Main Application Controller
 * 
 * This file orchestrates all tool functionality, UI interactions,
 * and integrates with the API service layer.
 */

class DevToolsHub {
    constructor() {
        this.currentTheme = 'light';
        this.favorites = JSON.parse(localStorage.getItem('tool-favorites') || '[]');
        this.searchIndex = new Map();
        this.analytics = {
            toolUsage: JSON.parse(localStorage.getItem('tool-usage') || '{}'),
            sessionStart: Date.now()
        };

        this.init();
    }

    async init() {
        try {
            // Show loading screen
            this.showLoadingScreen();

            // Initialize core systems
            await this.initializeAPI();
            await this.initializeThemes();
            this.initializeSearch();
            this.initializeCategories();
            this.initializeFavorites();
            this.initializeTooltips();
            this.initializeKeyboardShortcuts();
            this.initializeAnalytics();

            // Hide loading screen
            this.hideLoadingScreen();

            // Register service worker for PWA
            this.registerServiceWorker();

            console.log('🚀 Hyperforge Labs Developer Tools Hub v2.0 initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.showErrorMessage('Failed to initialize application. Please refresh the page.');
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            const progress = loadingScreen.querySelector('.loading-progress');
            let width = 0;
            const interval = setInterval(() => {
                width += Math.random() * 20;
                if (width >= 100) {
                    width = 100;
                    clearInterval(interval);
                }
                progress.style.width = width + '%';
            }, 100);
        }
    }

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 300);
            }
        }, 500);
    }

    async initializeAPI() {
        // API service is already initialized globally
        const apiStatus = document.getElementById('apiStatus');
        if (apiStatus) {
            try {
                const isHealthy = await window.hyperforgeAPI.healthCheck();
                if (isHealthy) {
                    apiStatus.querySelector('.status-indicator').className = 'status-indicator online';
                    apiStatus.querySelector('.status-text').textContent = 'API Online';
                } else {
                    throw new Error('API health check failed');
                }
            } catch (error) {
                apiStatus.querySelector('.status-indicator').className = 'status-indicator offline';
                apiStatus.querySelector('.status-text').textContent = 'API Offline';
                console.warn('API service unavailable, running in offline mode');
            }
        }
    }

    async initializeThemes() {
        // Theme manager is already initialized globally
        if (window.userPrefs) {
            await window.userPrefs.init();
        }
    }

    initializeSearch() {
        const searchInput = document.getElementById('toolSearch');
        const searchSuggestions = document.getElementById('searchSuggestions');

        if (!searchInput || !searchSuggestions) return;

        // Build search index
        this.buildSearchIndex();

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query.length < 2) {
                searchSuggestions.style.display = 'none';
                this.showAllTools();
                return;
            }

            const results = this.searchTools(query);
            this.displaySearchResults(results);
            this.showSearchSuggestions(results, searchSuggestions);
        });

        searchInput.addEventListener('focus', () => {
            if (searchInput.value.length >= 2) {
                searchSuggestions.style.display = 'block';
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
                searchSuggestions.style.display = 'none';
            }
        });
    }

    buildSearchIndex() {
        const tools = document.querySelectorAll('.tool-card');
        tools.forEach(tool => {
            const id = tool.dataset.toolId;
            const title = tool.querySelector('h2').textContent;
            const description = tool.querySelector('p').textContent;
            const category = tool.dataset.category;

            this.searchIndex.set(id, {
                element: tool,
                title: title.toLowerCase(),
                description: description.toLowerCase(),
                category: category.toLowerCase(),
                keywords: (title + ' ' + description + ' ' + category).toLowerCase()
            });
        });
    }

    searchTools(query) {
        const results = [];
        this.searchIndex.forEach((tool, id) => {
            let score = 0;

            // Exact title match gets highest score
            if (tool.title.includes(query)) score += 100;

            // Description match gets medium score
            if (tool.description.includes(query)) score += 50;

            // Category match gets lower score
            if (tool.category.includes(query)) score += 25;

            // Keyword match gets lowest score
            if (tool.keywords.includes(query)) score += 10;

            if (score > 0) {
                results.push({ id, tool, score });
            }
        });

        return results.sort((a, b) => b.score - a.score);
    }

    displaySearchResults(results) {
        const allTools = document.querySelectorAll('.tool-card');

        if (results.length === 0) {
            allTools.forEach(tool => tool.style.display = 'none');
            this.showNoResultsMessage();
            return;
        }

        const visibleIds = new Set(results.map(r => r.id));
        allTools.forEach(tool => {
            tool.style.display = visibleIds.has(tool.dataset.toolId) ? 'block' : 'none';
        });

        this.hideNoResultsMessage();
    }

    showSearchSuggestions(results, container) {
        container.innerHTML = '';

        const topResults = results.slice(0, 5);
        topResults.forEach(result => {
            const suggestion = document.createElement('div');
            suggestion.className = 'search-suggestion';
            suggestion.innerHTML = `
                <span class="suggestion-title">${result.tool.title}</span>
                <span class="suggestion-category">${result.tool.category}</span>
            `;

            suggestion.addEventListener('click', () => {
                document.getElementById('toolSearch').value = result.tool.title;
                container.style.display = 'none';
                this.scrollToTool(result.id);
            });

            container.appendChild(suggestion);
        });

        container.style.display = topResults.length > 0 ? 'block' : 'none';
    }

    showAllTools() {
        const allTools = document.querySelectorAll('.tool-card');
        allTools.forEach(tool => tool.style.display = 'block');
        this.hideNoResultsMessage();
    }

    showNoResultsMessage() {
        let message = document.getElementById('noResultsMessage');
        if (!message) {
            message = document.createElement('div');
            message.id = 'noResultsMessage';
            message.className = 'no-results';
            message.innerHTML = `
                <h3>🔍 No tools found</h3>
                <p>Try searching with different keywords or browse by category.</p>
            `;
            document.querySelector('.tools-grid').appendChild(message);
        }
        message.style.display = 'block';
    }

    hideNoResultsMessage() {
        const message = document.getElementById('noResultsMessage');
        if (message) {
            message.style.display = 'none';
        }
    }

    initializeCategories() {
        const categoryTabs = document.querySelectorAll('.category-tab');
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update active tab
                categoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Filter tools
                const category = tab.dataset.category;
                this.filterByCategory(category);

                // Clear search
                const searchInput = document.getElementById('toolSearch');
                if (searchInput) {
                    searchInput.value = '';
                }
            });
        });
    }

    filterByCategory(category) {
        const tools = document.querySelectorAll('.tool-card');

        tools.forEach(tool => {
            if (category === 'all') {
                tool.style.display = 'block';
            } else if (category === 'favorites') {
                tool.style.display = this.favorites.includes(tool.dataset.toolId) ? 'block' : 'none';
            } else {
                tool.style.display = tool.dataset.category === category ? 'block' : 'none';
            }
        });

        this.hideNoResultsMessage();
    }

    initializeFavorites() {
        const favoriteButtons = document.querySelectorAll('.tool-favorite');
        favoriteButtons.forEach(button => {
            const toolCard = button.closest('.tool-card');
            const toolId = toolCard.dataset.toolId;

            // Set initial state
            if (this.favorites.includes(toolId)) {
                button.classList.add('active');
                button.textContent = '⭐';
            }

            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(toolId, button);
            });
        });
    }

    toggleFavorite(toolId, button) {
        const index = this.favorites.indexOf(toolId);

        if (index > -1) {
            // Remove from favorites
            this.favorites.splice(index, 1);
            button.classList.remove('active');
            button.textContent = '⭐';
            this.showNotification('Removed from favorites', 'info');
        } else {
            // Add to favorites
            this.favorites.push(toolId);
            button.classList.add('active');
            button.textContent = '⭐';
            this.showNotification('Added to favorites', 'success');
        }

        // Save to localStorage
        localStorage.setItem('tool-favorites', JSON.stringify(this.favorites));

        // Update favorites tab if active
        const activeCategoryTab = document.querySelector('.category-tab.active');
        if (activeCategoryTab && activeCategoryTab.dataset.category === 'favorites') {
            this.filterByCategory('favorites');
        }
    }

    initializeTooltips() {
        const tooltipElements = document.querySelectorAll('[title]');
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', this.showTooltip);
            element.addEventListener('mouseleave', this.hideTooltip);
        });
    }

    showTooltip(e) {
        const title = e.target.getAttribute('title');
        if (!title) return;

        // Remove title to prevent default tooltip
        e.target.setAttribute('data-title', title);
        e.target.removeAttribute('title');

        // Create custom tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.textContent = title;
        document.body.appendChild(tooltip);

        // Position tooltip
        const rect = e.target.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';

        // Store reference for cleanup
        e.target._tooltip = tooltip;
    }

    hideTooltip(e) {
        // Restore title
        const title = e.target.getAttribute('data-title');
        if (title) {
            e.target.setAttribute('title', title);
            e.target.removeAttribute('data-title');
        }

        // Remove custom tooltip
        if (e.target._tooltip) {
            e.target._tooltip.remove();
            delete e.target._tooltip;
        }
    }

    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search focus
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('toolSearch');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }

            // Escape to clear search
            if (e.key === 'Escape') {
                const searchInput = document.getElementById('toolSearch');
                if (searchInput && document.activeElement === searchInput) {
                    searchInput.value = '';
                    searchInput.blur();
                    this.showAllTools();
                }
            }

            // Number keys for category switching
            if (e.key >= '1' && e.key <= '6' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const categories = ['all', 'encoding', 'security', 'generators', 'network', 'favorites'];
                const categoryIndex = parseInt(e.key) - 1;
                if (categoryIndex < categories.length) {
                    const tab = document.querySelector(`[data-category="${categories[categoryIndex]}"]`);
                    if (tab) {
                        tab.click();
                    }
                }
            }
        });
    }

    initializeAnalytics() {
        // Track tool usage
        const tools = document.querySelectorAll('.tool-card');
        tools.forEach(tool => {
            const toolId = tool.dataset.toolId;
            const buttons = tool.querySelectorAll('button');

            buttons.forEach(button => {
                button.addEventListener('click', () => {
                    this.trackToolUsage(toolId);
                });
            });
        });

        // Track session data
        this.trackPageView();

        // Save analytics periodically
        setInterval(() => {
            this.saveAnalytics();
        }, 30000); // Every 30 seconds

        // Save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveAnalytics();
        });
    }

    trackToolUsage(toolId) {
        if (!this.analytics.toolUsage[toolId]) {
            this.analytics.toolUsage[toolId] = 0;
        }
        this.analytics.toolUsage[toolId]++;
    }

    trackPageView() {
        const analytics = JSON.parse(localStorage.getItem('analytics') || '{}');
        if (!analytics.pageViews) {
            analytics.pageViews = 0;
        }
        analytics.pageViews++;
        analytics.lastVisit = new Date().toISOString();
        localStorage.setItem('analytics', JSON.stringify(analytics));
    }

    saveAnalytics() {
        localStorage.setItem('tool-usage', JSON.stringify(this.analytics.toolUsage));
    }

    scrollToTool(toolId) {
        const tool = document.querySelector(`[data-tool-id="${toolId}"]`);
        if (tool) {
            tool.scrollIntoView({ behavior: 'smooth', block: 'center' });
            tool.classList.add('highlight');
            setTimeout(() => {
                tool.classList.remove('highlight');
            }, 2000);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification container if it doesn't exist
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Add to container
        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('ServiceWorker registered successfully:', registration);
            } catch (error) {
                console.log('ServiceWorker registration failed:', error);
            }
        }
    }
}

// Global utility functions
window.showAbout = function () {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>About Hyperforge Labs Developer Tools Hub</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p><strong>Version:</strong> 2.0</p>
                <p><strong>Built with:</strong> Vanilla JavaScript, CSS3, HTML5</p>
                <p><strong>Features:</strong></p>
                <ul>
                    <li>7 Developer Tools with API Integration</li>
                    <li>Dark/Light Theme Support</li>
                    <li>PWA Capabilities</li>
                    <li>Advanced Security Features</li>
                    <li>Offline Support</li>
                    <li>Keyboard Shortcuts</li>
                </ul>
                <p><strong>Created by:</strong> Hyperforge Labs</p>
                <p><strong>License:</strong> MIT</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
};

window.showKeyboardShortcuts = function () {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Keyboard Shortcuts</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="shortcuts-grid">
                    <div class="shortcut-item">
                        <kbd>Ctrl/Cmd + K</kbd>
                        <span>Focus search</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Escape</kbd>
                        <span>Clear search</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>1</kbd>
                        <span>All tools</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>2</kbd>
                        <span>Encoding tools</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>3</kbd>
                        <span>Security tools</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>4</kbd>
                        <span>Generators</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>5</kbd>
                        <span>Network tools</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>6</kbd>
                        <span>Favorites</span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
};

// Footer Tech Functionality
class TechFooter {
    constructor() {
        this.startTime = Date.now();
        this.init();
    }

    init() {
        // Initialize footer when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupFooter());
        } else {
            this.setupFooter();
        }
    }

    setupFooter() {
        this.updateBuildInfo();
        this.startRealTimeUpdates();
        this.simulateMetrics();
    }

    updateBuildInfo() {
        // Set build hash (simulate from git commit)
        const buildHash = document.getElementById('buildHash');
        if (buildHash) {
            // Generate a realistic commit hash
            const hash = Math.random().toString(36).substring(2, 9);
            buildHash.textContent = hash;
        }

        // Set deploy time to current time
        const deployTime = document.getElementById('deployTime');
        if (deployTime) {
            const now = new Date();
            deployTime.textContent = now.toISOString();
        }
    }

    startRealTimeUpdates() {
        // Update metrics every 5 seconds
        setInterval(() => {
            this.updateUptime();
            this.updateLatency();
            this.updateActiveUsers();
        }, 5000);

        // Update every second for smooth animations
        setInterval(() => {
            this.animateTerminalCursor();
        }, 1000);
    }

    updateUptime() {
        const uptimeElement = document.getElementById('uptime');
        if (uptimeElement) {
            // Calculate uptime percentage (simulate high uptime)
            const baseUptime = 99.9;
            const variation = (Math.random() - 0.5) * 0.02; // ±0.01%
            const uptime = Math.max(99.0, Math.min(100.0, baseUptime + variation));
            uptimeElement.textContent = uptime.toFixed(2) + '%';
        }
    }

    updateLatency() {
        const latencyElement = document.getElementById('latency');
        if (latencyElement) {
            // Simulate realistic API latency
            const baseLatency = 45;
            const variation = Math.floor(Math.random() * 30) - 15; // ±15ms
            const latency = Math.max(15, Math.min(100, baseLatency + variation));
            latencyElement.textContent = `~${latency}ms`;
        }
    }

    updateActiveUsers() {
        const usersElement = document.getElementById('activeUsers');
        if (usersElement) {
            // Simulate active user count
            const baseUsers = 2300;
            const variation = Math.floor(Math.random() * 200) - 100; // ±100 users
            const users = Math.max(1000, baseUsers + variation);
            
            if (users >= 1000) {
                usersElement.textContent = (users / 1000).toFixed(1) + 'k';
            } else {
                usersElement.textContent = users.toString();
            }
        }
    }

    animateTerminalCursor() {
        const cursor = document.querySelector('.terminal-cursor');
        if (cursor) {
            // Add random terminal activity
            const commands = [
                'npm run build',
                'git status',
                'docker ps',
                'curl -s api/health',
                'tail -f access.log',
                'htop',
                'ps aux | grep node'
            ];
            
            // Occasionally change the cursor to show "activity"
            if (Math.random() < 0.1) { // 10% chance every second
                const originalText = cursor.textContent;
                const randomCommand = commands[Math.floor(Math.random() * commands.length)];
                
                // Simulate typing
                cursor.textContent = '';
                let i = 0;
                const typeInterval = setInterval(() => {
                    if (i < randomCommand.length) {
                        cursor.textContent += randomCommand[i];
                        i++;
                    } else {
                        clearInterval(typeInterval);
                        // Return to cursor after 2 seconds
                        setTimeout(() => {
                            cursor.textContent = originalText;
                        }, 2000);
                    }
                }, 100);
            }
        }
    }

    simulateMetrics() {
        // Add hover effects to tech items
        const techItems = document.querySelectorAll('.tech-item');
        techItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                const version = item.querySelector('.tech-version');
                if (version && Math.random() < 0.3) { // 30% chance to show update
                    const originalText = version.textContent;
                    version.textContent = 'UPDATING...';
                    version.style.color = '#f59e0b';
                    
                    setTimeout(() => {
                        version.textContent = originalText;
                        version.style.color = '#00ff41';
                    }, 1500);
                }
            });
        });

        // Animate performance metrics on page load
        setTimeout(() => {
            const metrics = document.querySelectorAll('.metric-value');
            metrics.forEach((metric, index) => {
                const finalValue = metric.textContent;
                metric.textContent = '0';
                
                setTimeout(() => {
                    this.animateCountUp(metric, finalValue);
                }, index * 500);
            });
        }, 2000);
    }

    animateCountUp(element, finalValue) {
        const isPercentage = finalValue.includes('%');
        const isPlus = finalValue.includes('+');
        const numericValue = parseInt(finalValue);
        
        let current = 0;
        const increment = numericValue / 50; // 50 steps
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= numericValue) {
                current = numericValue;
                clearInterval(timer);
            }
            
            let displayValue = Math.floor(current).toString();
            if (isPlus) displayValue += '+';
            if (isPercentage) displayValue += '%';
            
            element.textContent = displayValue;
        }, 30);
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.devToolsHub = new DevToolsHub();
    window.techFooter = new TechFooter();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DevToolsHub;
}
