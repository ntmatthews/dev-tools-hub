// Theme Management System for Hyperforge Labs Developer Tools Hub v2.0
class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'auto';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.createThemeToggle();
        this.setupSystemThemeListener();
        this.setupKeyboardShortcuts();
    }

    getStoredTheme() {
        return localStorage.getItem('hyperforge-theme');
    }

    setStoredTheme(theme) {
        localStorage.setItem('hyperforge-theme', theme);
    }

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    applyTheme(theme) {
        const html = document.documentElement;

        // Remove existing theme classes
        html.classList.remove('theme-light', 'theme-dark', 'theme-auto');

        // Apply new theme
        if (theme === 'auto') {
            const systemTheme = this.getSystemTheme();
            html.setAttribute('data-theme', systemTheme);
            html.classList.add('theme-auto');
        } else {
            html.setAttribute('data-theme', theme);
            html.classList.add(`theme-${theme}`);
        }

        this.currentTheme = theme;
        this.setStoredTheme(theme);
        this.updateThemeToggle();
        this.updateMetaThemeColor();

        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: this.getEffectiveTheme() }
        }));
    }

    getEffectiveTheme() {
        return this.currentTheme === 'auto' ? this.getSystemTheme() : this.currentTheme;
    }

    createThemeToggle() {
        const toggle = document.createElement('button');
        toggle.className = 'theme-toggle';
        toggle.setAttribute('aria-label', 'Toggle theme');
        toggle.setAttribute('title', 'Toggle between light, dark, and auto themes');

        document.body.appendChild(toggle);

        toggle.addEventListener('click', () => {
            this.cycleTheme();
        });

        this.themeToggle = toggle;
    }

    updateThemeToggle() {
        if (!this.themeToggle) return;

        const icons = {
            light: '☀️',
            dark: '🌙',
            auto: '🔄'
        };

        this.themeToggle.textContent = icons[this.currentTheme] || icons.auto;
        this.themeToggle.setAttribute('data-theme', this.currentTheme);
    }

    cycleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;

        this.applyTheme(themes[nextIndex]);

        // Show theme change notification
        this.showThemeNotification();
    }

    showThemeNotification() {
        const notification = document.createElement('div');
        notification.className = 'theme-notification';
        notification.textContent = `Theme: ${this.currentTheme.charAt(0).toUpperCase() + this.currentTheme.slice(1)}`;

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    updateMetaThemeColor() {
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeColorMeta) return;

        const colors = {
            light: '#2563eb',
            dark: '#3b82f6'
        };

        const effectiveTheme = this.getEffectiveTheme();
        themeColorMeta.setAttribute('content', colors[effectiveTheme] || colors.light);
    }

    setupSystemThemeListener() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        mediaQuery.addEventListener('change', () => {
            if (this.currentTheme === 'auto') {
                this.applyTheme('auto');
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + T to toggle theme
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.cycleTheme();
            }
        });
    }

    // Export theme settings
    exportThemeSettings() {
        return {
            theme: this.currentTheme,
            effectiveTheme: this.getEffectiveTheme(),
            timestamp: new Date().toISOString()
        };
    }

    // Import theme settings
    importThemeSettings(settings) {
        if (settings && settings.theme) {
            this.applyTheme(settings.theme);
        }
    }
}

// User Preferences Manager
class UserPreferences {
    constructor() {
        this.preferences = this.loadPreferences();
        this.init();
    }

    init() {
        this.setupAutoSave();
        this.createPreferencesPanel();
    }

    loadPreferences() {
        const stored = localStorage.getItem('hyperforge-preferences');
        const defaults = {
            theme: 'auto',
            autoSave: true,
            animations: true,
            notifications: true,
            compactMode: false,
            favoriteTools: [],
            recentTools: [],
            maxRecentTools: 10
        };

        try {
            return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
        } catch {
            return defaults;
        }
    }

    savePreferences() {
        localStorage.setItem('hyperforge-preferences', JSON.stringify(this.preferences));
        this.dispatchPreferencesChange();
    }

    dispatchPreferencesChange() {
        window.dispatchEvent(new CustomEvent('preferencesChanged', {
            detail: { preferences: this.preferences }
        }));
    }

    updatePreference(key, value) {
        this.preferences[key] = value;
        if (this.preferences.autoSave) {
            this.savePreferences();
        }
    }

    getPreference(key) {
        return this.preferences[key];
    }

    addFavoriteTool(toolId) {
        if (!this.preferences.favoriteTools.includes(toolId)) {
            this.preferences.favoriteTools.push(toolId);
            this.savePreferences();
        }
    }

    removeFavoriteTool(toolId) {
        const index = this.preferences.favoriteTools.indexOf(toolId);
        if (index > -1) {
            this.preferences.favoriteTools.splice(index, 1);
            this.savePreferences();
        }
    }

    addRecentTool(toolId) {
        // Remove if already exists
        const index = this.preferences.recentTools.indexOf(toolId);
        if (index > -1) {
            this.preferences.recentTools.splice(index, 1);
        }

        // Add to beginning
        this.preferences.recentTools.unshift(toolId);

        // Limit to max recent tools
        if (this.preferences.recentTools.length > this.preferences.maxRecentTools) {
            this.preferences.recentTools = this.preferences.recentTools.slice(0, this.preferences.maxRecentTools);
        }

        this.savePreferences();
    }

    setupAutoSave() {
        if (this.preferences.autoSave) {
            // Auto-save preferences every 30 seconds if changed
            setInterval(() => {
                this.savePreferences();
            }, 30000);
        }
    }

    createPreferencesPanel() {
        // Create floating preferences button
        const prefsButton = document.createElement('button');
        prefsButton.className = 'preferences-toggle';
        prefsButton.innerHTML = '⚙️';
        prefsButton.setAttribute('aria-label', 'Open preferences');
        prefsButton.style.cssText = `
            position: fixed;
            top: 1rem;
            right: 4rem;
            z-index: 999;
            background: var(--card-background);
            border: 1px solid var(--border-color);
            border-radius: 50%;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: var(--theme-transition);
            box-shadow: var(--shadow);
            font-size: 1.2rem;
        `;

        document.body.appendChild(prefsButton);

        prefsButton.addEventListener('click', () => {
            this.showPreferencesModal();
        });
    }

    showPreferencesModal() {
        const modal = document.createElement('div');
        modal.className = 'preferences-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content preferences-content">
                <div class="modal-header">
                    <h2>⚙️ Preferences</h2>
                    <button class="modal-close" onclick="this.closest('.preferences-modal').remove()">×</button>
                </div>
                <div class="preferences-body">
                    <div class="preference-section">
                        <h3>Appearance</h3>
                        <div class="preference-item">
                            <label>
                                <input type="checkbox" ${this.preferences.animations ? 'checked' : ''} 
                                       onchange="userPrefs.updatePreference('animations', this.checked)">
                                Enable animations
                            </label>
                        </div>
                        <div class="preference-item">
                            <label>
                                <input type="checkbox" ${this.preferences.compactMode ? 'checked' : ''} 
                                       onchange="userPrefs.updatePreference('compactMode', this.checked)">
                                Compact mode
                            </label>
                        </div>
                    </div>
                    
                    <div class="preference-section">
                        <h3>Behavior</h3>
                        <div class="preference-item">
                            <label>
                                <input type="checkbox" ${this.preferences.autoSave ? 'checked' : ''} 
                                       onchange="userPrefs.updatePreference('autoSave', this.checked)">
                                Auto-save preferences
                            </label>
                        </div>
                        <div class="preference-item">
                            <label>
                                <input type="checkbox" ${this.preferences.notifications ? 'checked' : ''} 
                                       onchange="userPrefs.updatePreference('notifications', this.checked)">
                                Show notifications
                            </label>
                        </div>
                    </div>
                    
                    <div class="preference-section">
                        <h3>Data</h3>
                        <div class="preference-actions">
                            <button class="btn btn-secondary" onclick="userPrefs.exportData()">Export Data</button>
                            <button class="btn btn-secondary" onclick="userPrefs.importData()">Import Data</button>
                            <button class="btn btn-warning" onclick="userPrefs.clearData()">Clear All Data</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    exportData() {
        const data = {
            preferences: this.preferences,
            theme: themeManager.exportThemeSettings(),
            timestamp: new Date().toISOString(),
            version: '2.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hyperforge-settings-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);

                if (data.preferences) {
                    this.preferences = { ...this.preferences, ...data.preferences };
                    this.savePreferences();
                }

                if (data.theme) {
                    themeManager.importThemeSettings(data.theme);
                }

                // Show success notification
                this.showNotification('Settings imported successfully!', 'success');

            } catch (error) {
                this.showNotification('Failed to import settings. Invalid file format.', 'error');
            }
        };

        input.click();
    }

    clearData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            localStorage.removeItem('hyperforge-preferences');
            localStorage.removeItem('hyperforge-theme');
            localStorage.removeItem('hyperforge_api_key');

            // Reload page to reset state
            window.location.reload();
        }
    }

    showNotification(message, type = 'info') {
        if (!this.preferences.notifications) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Initialize theme and preferences management
let themeManager, userPrefs;

document.addEventListener('DOMContentLoaded', function () {
    themeManager = new ThemeManager();
    userPrefs = new UserPreferences();

    // Make globally available
    window.themeManager = themeManager;
    window.userPrefs = userPrefs;

    // Apply user preferences
    if (userPrefs.getPreference('compactMode')) {
        document.body.classList.add('compact-mode');
    }

    if (!userPrefs.getPreference('animations')) {
        document.body.classList.add('no-animations');
    }
});

// Export for use in other modules
window.ThemeManager = ThemeManager;
window.UserPreferences = UserPreferences;
