// Advanced Hash Calculator with Multiple Algorithms
document.addEventListener('DOMContentLoaded', function () {
    const textInput = document.getElementById('hashInput');
    const fileInput = document.getElementById('hashFileInput');
    const algorithmSelect = document.getElementById('hashAlgorithm');
    const resultContainer = document.getElementById('hashResults');
    const calculateBtn = document.getElementById('calculateHash');
    const clearBtn = document.getElementById('clearHash');
    const compareBtn = document.getElementById('compareHash');
    const api = new HyperforgeAPI();

    // Supported hash algorithms
    const algorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512', 'MD5'];

    // Initialize algorithm selector
    algorithms.forEach(algo => {
        const option = document.createElement('option');
        option.value = algo.toLowerCase().replace('-', '');
        option.textContent = algo;
        algorithmSelect.appendChild(option);
    });

    // Set default algorithm
    algorithmSelect.value = 'sha256';

    // Calculate hash for text input
    async function calculateTextHash() {
        const text = textInput.value.trim();
        const algorithm = algorithmSelect.value;

        if (!text) {
            showError('Please enter text to hash');
            return;
        }

        try {
            showLoading();

            // Use Web Crypto API for client-side hashing
            const result = await hashWithWebCrypto(text, algorithm);

            // Also try API for additional validation if available
            try {
                const apiResult = await api.hashText(text, algorithm);
                if (apiResult.hash && apiResult.hash !== result) {
                    console.warn('Hash mismatch between client and server');
                }
            } catch (apiError) {
                console.log('API hashing unavailable, using client-side only');
            }

            displayHashResult(text, algorithm, result, 'text');

        } catch (error) {
            showError(`Hashing failed: ${error.message}`);
        }
    }

    // Calculate hash for file input
    async function calculateFileHash() {
        const file = fileInput.files[0];
        const algorithm = algorithmSelect.value;

        if (!file) {
            showError('Please select a file to hash');
            return;
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            showError('File too large. Maximum size is 50MB.');
            return;
        }

        try {
            showLoading();

            const arrayBuffer = await file.arrayBuffer();
            const result = await hashArrayBuffer(arrayBuffer, algorithm);

            displayHashResult(`${file.name} (${formatFileSize(file.size)})`, algorithm, result, 'file');

        } catch (error) {
            showError(`File hashing failed: ${error.message}`);
        }
    }

    // Hash text using Web Crypto API
    async function hashWithWebCrypto(text, algorithm) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        return await hashArrayBuffer(data, algorithm);
    }

    // Hash ArrayBuffer using Web Crypto API
    async function hashArrayBuffer(data, algorithm) {
        const algorithmMap = {
            'sha1': 'SHA-1',
            'sha256': 'SHA-256',
            'sha384': 'SHA-384',
            'sha512': 'SHA-512'
        };

        const cryptoAlgorithm = algorithmMap[algorithm];

        if (!cryptoAlgorithm) {
            // Fallback for MD5 and other algorithms not supported by Web Crypto
            return await fallbackHash(data, algorithm);
        }

        const hashBuffer = await crypto.subtle.digest(cryptoAlgorithm, data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback hash implementation for unsupported algorithms
    async function fallbackHash(data, algorithm) {
        // This would typically use a crypto library like crypto-js
        // For now, return a placeholder
        throw new Error(`${algorithm.toUpperCase()} not supported in this browser`);
    }

    // Display hash result
    function displayHashResult(input, algorithm, hash, type) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'hash-result';

        const timestamp = new Date().toLocaleString();
        const icon = type === 'file' ? '📁' : '📝';

        resultDiv.innerHTML = `
            <div class="hash-header">
                <span class="hash-icon">${icon}</span>
                <div class="hash-meta">
                    <div class="hash-input">${SecurityUtils.sanitizeInput(input)}</div>
                    <div class="hash-info">${algorithm.toUpperCase()} • ${timestamp}</div>
                </div>
                <div class="hash-actions">
                    <button class="btn btn-sm btn-secondary copy-hash" data-hash="${hash}">Copy</button>
                    <button class="btn btn-sm btn-secondary verify-hash" data-hash="${hash}">Verify</button>
                </div>
            </div>
            <div class="hash-value">
                <code>${hash}</code>
            </div>
            <div class="hash-details">
                <span>Length: ${hash.length} characters</span>
                <span>Entropy: ${calculateEntropy(hash).toFixed(2)} bits</span>
            </div>
        `;

        resultContainer.appendChild(resultDiv);
        resultContainer.scrollTop = resultContainer.scrollHeight;

        // Add event listeners for actions
        resultDiv.querySelector('.copy-hash').addEventListener('click', function () {
            copyToClipboard(this.dataset.hash, this);
        });

        resultDiv.querySelector('.verify-hash').addEventListener('click', function () {
            showHashVerification(this.dataset.hash);
        });

        hideLoading();
    }

    // Calculate Shannon entropy of a string
    function calculateEntropy(str) {
        const len = str.length;
        const frequencies = {};

        for (let i = 0; i < len; i++) {
            frequencies[str[i]] = (frequencies[str[i]] || 0) + 1;
        }

        let entropy = 0;
        for (const freq of Object.values(frequencies)) {
            const p = freq / len;
            entropy -= p * Math.log2(p);
        }

        return entropy * len;
    }

    // Show hash verification modal
    function showHashVerification(originalHash) {
        const modal = document.createElement('div');
        modal.className = 'hash-verify-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <h3>Hash Verification</h3>
                <p>Compare the calculated hash with another hash:</p>
                <div class="hash-compare">
                    <div class="hash-input-group">
                        <label>Original Hash:</label>
                        <input type="text" readonly value="${originalHash}" class="original-hash">
                    </div>
                    <div class="hash-input-group">
                        <label>Compare With:</label>
                        <input type="text" placeholder="Enter hash to compare" class="compare-hash">
                    </div>
                    <div class="hash-match-result"></div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="verifyHashes(this)">Compare</button>
                    <button class="btn btn-secondary" onclick="this.closest('.hash-verify-modal').remove()">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector('.compare-hash').focus();
    }

    // Global function for hash verification
    window.verifyHashes = function (btn) {
        const modal = btn.closest('.hash-verify-modal');
        const originalHash = modal.querySelector('.original-hash').value.toLowerCase();
        const compareHash = modal.querySelector('.compare-hash').value.toLowerCase().trim();
        const resultDiv = modal.querySelector('.hash-match-result');

        if (!compareHash) {
            resultDiv.innerHTML = '<div class="hash-error">Please enter a hash to compare</div>';
            return;
        }

        const isMatch = originalHash === compareHash;
        const icon = isMatch ? '✅' : '❌';
        const status = isMatch ? 'MATCH' : 'NO MATCH';
        const className = isMatch ? 'hash-match' : 'hash-no-match';

        resultDiv.innerHTML = `
            <div class="hash-result ${className}">
                ${icon} ${status}
            </div>
        `;
    };

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Show loading state
    function showLoading() {
        calculateBtn.disabled = true;
        calculateBtn.innerHTML = '<div class="loading"></div> Calculating...';
    }

    // Hide loading state
    function hideLoading() {
        calculateBtn.disabled = false;
        calculateBtn.textContent = 'Calculate Hash';
    }

    // Show error message
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'hash-error';
        errorDiv.innerHTML = `❌ ${message}`;
        resultContainer.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);

        hideLoading();
    }

    // Copy to clipboard utility
    async function copyToClipboard(text, btn) {
        try {
            await navigator.clipboard.writeText(text);
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            btn.style.backgroundColor = '#059669';

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '';
            }, 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    }

    // Event listeners
    calculateBtn.addEventListener('click', function () {
        if (textInput.value.trim()) {
            calculateTextHash();
        } else if (fileInput.files.length > 0) {
            calculateFileHash();
        } else {
            showError('Please enter text or select a file to hash');
        }
    });

    clearBtn.addEventListener('click', function () {
        textInput.value = '';
        fileInput.value = '';
        resultContainer.innerHTML = '<p>Hash results will appear here</p>';
    });

    // Auto-calculate on text input (debounced)
    let hashTimeout;
    textInput.addEventListener('input', function () {
        clearTimeout(hashTimeout);
        if (this.value.trim()) {
            hashTimeout = setTimeout(() => {
                calculateTextHash();
            }, 1000);
        }
    });

    // Handle file selection
    fileInput.addEventListener('change', function () {
        if (this.files.length > 0) {
            textInput.value = ''; // Clear text input when file is selected
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            calculateBtn.click();
        }
    });
});
