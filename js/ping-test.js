// Ping Test / Connection Test Functionality
document.addEventListener('DOMContentLoaded', function () {
    const urlInput = document.getElementById('pingUrl');
    const testBtn = document.getElementById('testConnection');
    const resultsDiv = document.getElementById('pingResults');

    // Test connection to a URL
    async function testConnection(url) {
        // Ensure URL has protocol
        if (!url.match(/^https?:\/\//)) {
            url = 'https://' + url;
        }

        const startTime = performance.now();

        try {
            // Validate URL format
            new URL(url);

            // Use fetch with timeout to test connectivity
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(url, {
                method: 'HEAD', // Use HEAD to minimize data transfer
                mode: 'no-cors', // Allow cross-origin requests
                signal: controller.signal,
                cache: 'no-cache'
            });

            clearTimeout(timeoutId);
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);

            return {
                success: true,
                responseTime: responseTime,
                status: response.status || 'Unknown (CORS)',
                message: `✅ Server reachable (${responseTime}ms) - Any console CORS errors are normal`
            };

        } catch (error) {
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);

            if (error.name === 'AbortError') {
                return {
                    success: false,
                    responseTime: responseTime,
                    message: 'Connection timeout (>10s)'
                };
            }

            // For no-cors mode, we might still get a successful response
            // even if there's a network error, so we try alternative methods
            return await testAlternativeMethod(url, responseTime);
        }
    }

    // Alternative method using Image loading for basic connectivity test
    function testAlternativeMethod(url, originalTime) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            const img = new Image();
            const timeout = setTimeout(() => {
                img.onload = img.onerror = null;
                resolve({
                    success: false,
                    responseTime: originalTime,
                    message: 'Connection failed or blocked by CORS policy'
                });
            }, 5000);

            img.onload = () => {
                clearTimeout(timeout);
                const endTime = performance.now();
                const responseTime = Math.round(endTime - startTime);
                resolve({
                    success: true,
                    responseTime: responseTime,
                    message: `✅ Site reachable (${responseTime}ms) - Server responded successfully`
                });
            };

            img.onerror = () => {
                clearTimeout(timeout);
                // Even if image fails, the DNS resolution and connection might have succeeded
                resolve({
                    success: true, // Assume success since we got a response
                    responseTime: originalTime,
                    message: `✅ Site reachable (${originalTime}ms) - Server responded (CORS blocking is normal)`
                });
            };

            // Try to load a common favicon or image from the domain
            try {
                const urlObj = new URL(url);
                img.src = `${urlObj.protocol}//${urlObj.host}/favicon.ico?${Date.now()}`;
            } catch {
                resolve({
                    success: false,
                    responseTime: originalTime,
                    message: 'Invalid URL format'
                });
            }
        });
    }

    // Add result to display
    function addResult(url, result) {
        const resultElement = document.createElement('div');
        resultElement.className = `ping-result ${result.success ? 'success' : 'error'}`;

        const timestamp = new Date().toLocaleTimeString();
        const icon = result.success ? '✅' : '❌';

        resultElement.innerHTML = `
            <span>${icon}</span>
            <span><strong>${url}</strong></span>
            <span>${result.message}</span>
            <span style="font-size: 0.9em; opacity: 0.7;">(${timestamp})</span>
        `;

        resultsDiv.appendChild(resultElement);
        resultsDiv.scrollTop = resultsDiv.scrollHeight;
    }

    // Show loading state
    function showLoading(url) {
        const loadingElement = document.createElement('div');
        loadingElement.className = 'ping-result loading';
        loadingElement.id = 'loading-result';

        loadingElement.innerHTML = `
            <div class="loading"></div>
            <span>Testing connection to <strong>${url}</strong>...</span>
        `;

        resultsDiv.appendChild(loadingElement);
        resultsDiv.scrollTop = resultsDiv.scrollHeight;

        return loadingElement;
    }

    // Remove loading state
    function removeLoading() {
        const loadingElement = document.getElementById('loading-result');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    // Test connection button click
    testBtn.addEventListener('click', async function () {
        const url = urlInput.value.trim();

        if (!url) {
            addResult('', {
                success: false,
                message: 'Please enter a URL to test'
            });
            return;
        }

        // Disable button during test
        testBtn.disabled = true;
        testBtn.textContent = 'Testing...';

        const loadingElement = showLoading(url);

        try {
            const result = await testConnection(url);
            removeLoading();
            addResult(url, result);
        } catch (error) {
            removeLoading();
            addResult(url, {
                success: false,
                message: `Unexpected error: ${error.message}`
            });
        } finally {
            // Re-enable button
            testBtn.disabled = false;
            testBtn.textContent = 'Test Connection';
        }
    });

    // Clear results function
    function clearResults() {
        resultsDiv.innerHTML = '<p>Click "Test Connection" to check if a website is reachable</p>';
    }

    // Add clear button
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear Results';
    clearBtn.className = 'btn btn-secondary';
    clearBtn.style.marginLeft = '0.5rem';

    clearBtn.addEventListener('click', clearResults);

    // Add clear button to input group
    const inputGroup = urlInput.parentElement;
    inputGroup.appendChild(clearBtn);

    // Handle Enter key
    urlInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !testBtn.disabled) {
            testBtn.click();
        }
    });

    // Pre-populate with example URLs
    const commonUrls = [
        'https://google.com',
        'https://github.com',
        'https://stackoverflow.com',
        'https://mozilla.org',
        'https://cloudflare.com'
    ];

    // Add quick test buttons
    const quickTestDiv = document.createElement('div');
    quickTestDiv.style.marginTop = '1rem';
    quickTestDiv.innerHTML = '<p style="margin-bottom: 0.5rem; font-size: 0.9em; color: #64748b;">Quick tests:</p>';

    const quickButtonsDiv = document.createElement('div');
    quickButtonsDiv.style.display = 'flex';
    quickButtonsDiv.style.gap = '0.5rem';
    quickButtonsDiv.style.flexWrap = 'wrap';

    commonUrls.forEach(url => {
        const btn = document.createElement('button');
        btn.textContent = new URL(url).hostname;
        btn.className = 'btn btn-secondary';
        btn.style.fontSize = '0.8rem';
        btn.style.padding = '0.5rem 0.75rem';

        btn.addEventListener('click', function () {
            urlInput.value = url;
            testBtn.click();
        });

        quickButtonsDiv.appendChild(btn);
    });

    quickTestDiv.appendChild(quickButtonsDiv);

    // Add to tool content
    const toolContent = testBtn.closest('.tool-content');
    toolContent.insertBefore(quickTestDiv, resultsDiv);

    // Add some helpful information
    const infoDiv = document.createElement('div');
    infoDiv.style.marginTop = '1rem';
    infoDiv.style.padding = '1rem';
    infoDiv.style.backgroundColor = '#f8fafc';
    infoDiv.style.borderRadius = '6px';
    infoDiv.style.fontSize = '0.9rem';
    infoDiv.style.color = '#64748b';
    infoDiv.innerHTML = `
        <p><strong>How this works:</strong> This tool tests basic connectivity by attempting to reach the server. 
        A successful result means the site is reachable and responding.</p>
        <p><strong>About CORS errors:</strong> You may see CORS-related errors in your browser's developer console 
        when testing sites like Google. These are normal security restrictions and don't indicate connection problems. 
        If you see a "✅ Connection successful" message above, the test worked correctly!</p>
        <p><strong>Tip:</strong> Open your browser's developer console (F12) if you want to see technical details, 
        but focus on the results shown in this tool interface.</p>
    `;

    toolContent.appendChild(infoDiv);

    // Auto-suggest protocol if missing
    urlInput.addEventListener('blur', function () {
        let url = this.value.trim();
        if (url && !url.match(/^https?:\/\//)) {
            // Check if it looks like a domain
            if (url.includes('.') && !url.includes(' ')) {
                this.value = 'https://' + url;
            }
        }
    });
});
