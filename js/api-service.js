// API Service Layer for Hyperforge Labs Developer Tools Hub v2.0
class HyperforgeAPI {
    constructor() {
        this.baseURL = 'https://api.hyperforgestudios.org';
        this.fallbackURL = 'https://httpbin.org'; // Fallback for demo purposes
        this.apiKey = this.getApiKey();
        this.rateLimiter = new RateLimiter();
        this.cache = new APICache();
    }

    // Get API key from localStorage or generate session key
    getApiKey() {
        let apiKey = localStorage.getItem('hyperforge_api_key');
        if (!apiKey) {
            apiKey = 'session_' + this.generateSessionId();
            localStorage.setItem('hyperforge_api_key', apiKey);
        }
        return apiKey;
    }

    // Generate session ID for API requests
    generateSessionId() {
        return 'xxxx-xxxx-xxxx'.replace(/[x]/g, () =>
            (Math.random() * 16 | 0).toString(16)
        );
    }

    // Generic API request method with retry and error handling
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const requestId = this.generateRequestId();

        // Check rate limiting
        if (!this.rateLimiter.canMakeRequest()) {
            throw new APIError('Rate limit exceeded. Please wait before making more requests.', 429);
        }

        // Check cache first
        const cacheKey = this.getCacheKey(endpoint, options);
        if (options.cache !== false) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }

        const requestOptions = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKey,
                'X-Request-ID': requestId,
                'X-Client-Version': '2.0',
                ...options.headers
            },
            ...options
        };

        if (requestOptions.body && typeof requestOptions.body === 'object') {
            requestOptions.body = JSON.stringify(requestOptions.body);
        }

        try {
            const response = await fetch(url, requestOptions);

            // Update rate limiter
            this.rateLimiter.recordRequest();

            if (!response.ok) {
                throw new APIError(`API request failed: ${response.statusText}`, response.status);
            }

            const data = await response.json();

            // Cache successful responses
            if (response.ok && options.cache !== false) {
                this.cache.set(cacheKey, data, options.cacheDuration);
            }

            return data;
        } catch (error) {
            if (error instanceof APIError) throw error;

            // Try fallback for certain endpoints
            if (this.hasFallback(endpoint)) {
                return await this.requestFallback(endpoint, options);
            }

            throw new APIError(`Network error: ${error.message}`, 0);
        }
    }

    // Fallback API requests for demo purposes
    async requestFallback(endpoint, options) {
        const fallbackEndpoints = {
            '/tools/ip': '/ip',
            '/tools/user-agent': '/user-agent',
            '/tools/headers': '/headers'
        };

        const fallbackEndpoint = fallbackEndpoints[endpoint];
        if (!fallbackEndpoint) {
            throw new APIError('Service temporarily unavailable', 503);
        }

        const response = await fetch(`${this.fallbackURL}${fallbackEndpoint}`);
        return await response.json();
    }

    hasFallback(endpoint) {
        return ['/tools/ip', '/tools/user-agent', '/tools/headers'].includes(endpoint);
    }

    getCacheKey(endpoint, options) {
        return `api_${endpoint}_${JSON.stringify(options.body || {})}`;
    }

    generateRequestId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Specific API methods
    async validateEmail(email) {
        return await this.request('/tools/validate-email', {
            method: 'POST',
            body: { email },
            cacheDuration: 300000 // 5 minutes
        });
    }

    async shortenURL(url) {
        return await this.request('/tools/shorten-url', {
            method: 'POST',
            body: { url },
            cache: false
        });
    }

    async getIPInfo() {
        return await this.request('/tools/ip', { cacheDuration: 60000 });
    }

    async getUserAgent() {
        return await this.request('/tools/user-agent', { cacheDuration: 300000 });
    }

    async getHeaders() {
        return await this.request('/tools/headers', { cacheDuration: 60000 });
    }

    async hashText(text, algorithm = 'sha256') {
        return await this.request('/tools/hash', {
            method: 'POST',
            body: { text, algorithm },
            cacheDuration: 86400000 // 24 hours
        });
    }

    async checkPasswordBreach(hash) {
        return await this.request('/tools/password-breach', {
            method: 'POST',
            body: { hash },
            cacheDuration: 86400000
        });
    }
}

// Rate Limiter Class
class RateLimiter {
    constructor(maxRequests = 100, windowMs = 60000) { // 100 requests per minute
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = [];
    }

    canMakeRequest() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        return this.requests.length < this.maxRequests;
    }

    recordRequest() {
        this.requests.push(Date.now());
    }

    getRemainingRequests() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        return Math.max(0, this.maxRequests - this.requests.length);
    }

    getResetTime() {
        if (this.requests.length === 0) return 0;
        const oldestRequest = Math.min(...this.requests);
        return oldestRequest + this.windowMs;
    }
}

// API Cache Class
class APICache {
    constructor() {
        this.cache = new Map();
        this.defaultDuration = 300000; // 5 minutes
    }

    set(key, data, duration = this.defaultDuration) {
        const expiry = Date.now() + duration;
        this.cache.set(key, { data, expiry });
    }

    get(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() > cached.expiry) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    clear() {
        this.cache.clear();
    }

    cleanup() {
        const now = Date.now();
        for (const [key, cached] of this.cache.entries()) {
            if (now > cached.expiry) {
                this.cache.delete(key);
            }
        }
    }
}

// Custom API Error Class
class APIError extends Error {
    constructor(message, status = 0) {
        super(message);
        this.name = 'APIError';
        this.status = status;
    }
}

// Security utilities
class SecurityUtils {
    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;

        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    static validateURL(url) {
        try {
            const parsedURL = new URL(url);
            return ['http:', 'https:'].includes(parsedURL.protocol);
        } catch {
            return false;
        }
    }

    static generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    static async hashPassword(password, salt) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}

// Export for use in other modules
window.HyperforgeAPI = HyperforgeAPI;
window.SecurityUtils = SecurityUtils;
window.APIError = APIError;
