// JSON Formatter Functionality
document.addEventListener('DOMContentLoaded', function () {
    const jsonInput = document.getElementById('jsonInput');
    const jsonResult = document.getElementById('jsonResult');
    const formatBtn = document.getElementById('formatJson');
    const minifyBtn = document.getElementById('minifyJson');
    const validateBtn = document.getElementById('validateJson');
    const clearBtn = document.getElementById('clearJson');
    const copyBtn = document.getElementById('copyJson');
    const errorDiv = document.getElementById('jsonError');

    // Show error message
    function showError(message, line = null) {
        errorDiv.textContent = line ? `Error at line ${line}: ${message}` : `Error: ${message}`;
        errorDiv.classList.add('show');
    }

    // Clear error message
    function clearError() {
        errorDiv.classList.remove('show');
        errorDiv.textContent = '';
    }

    // Validate JSON
    function validateJSON(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            return { valid: true, data: parsed };
        } catch (error) {
            const match = error.message.match(/position (\d+)/);
            let line = null;

            if (match) {
                const position = parseInt(match[1]);
                line = jsonString.substring(0, position).split('\n').length;
            }

            return {
                valid: false,
                error: error.message,
                line: line
            };
        }
    }

    // Format JSON with proper indentation
    function formatJSON(jsonString, indent = 2) {
        const validation = validateJSON(jsonString);

        if (!validation.valid) {
            throw new Error(validation.error);
        }

        return JSON.stringify(validation.data, null, indent);
    }

    // Minify JSON
    function minifyJSON(jsonString) {
        const validation = validateJSON(jsonString);

        if (!validation.valid) {
            throw new Error(validation.error);
        }

        return JSON.stringify(validation.data);
    }

    // Get JSON statistics
    function getJSONStats(jsonString) {
        const validation = validateJSON(jsonString);

        if (!validation.valid) {
            return null;
        }

        const data = validation.data;

        function countItems(obj) {
            let objects = 0;
            let arrays = 0;
            let strings = 0;
            let numbers = 0;
            let booleans = 0;
            let nulls = 0;

            function traverse(item) {
                if (item === null) {
                    nulls++;
                } else if (typeof item === 'boolean') {
                    booleans++;
                } else if (typeof item === 'number') {
                    numbers++;
                } else if (typeof item === 'string') {
                    strings++;
                } else if (Array.isArray(item)) {
                    arrays++;
                    item.forEach(traverse);
                } else if (typeof item === 'object') {
                    objects++;
                    Object.values(item).forEach(traverse);
                }
            }

            traverse(obj);
            return { objects, arrays, strings, numbers, booleans, nulls };
        }

        const stats = countItems(data);
        const originalSize = jsonString.length;
        const minifiedSize = JSON.stringify(data).length;
        const formattedSize = JSON.stringify(data, null, 2).length;

        return {
            ...stats,
            originalSize,
            minifiedSize,
            formattedSize,
            compressionRatio: ((originalSize - minifiedSize) / originalSize * 100).toFixed(1)
        };
    }

    // Format button click
    formatBtn.addEventListener('click', function () {
        const input = jsonInput.value.trim();

        if (!input) {
            showError('Please enter JSON to format');
            return;
        }

        try {
            const formatted = formatJSON(input);
            jsonResult.value = formatted;
            clearError();

            // Visual feedback
            formatBtn.textContent = 'Formatted!';
            formatBtn.style.backgroundColor = '#059669';

            setTimeout(() => {
                formatBtn.textContent = 'Format';
                formatBtn.style.backgroundColor = '';
            }, 1000);

        } catch (error) {
            const validation = validateJSON(input);
            showError(error.message, validation.line);
            jsonResult.value = '';
        }
    });

    // Minify button click
    minifyBtn.addEventListener('click', function () {
        const input = jsonInput.value.trim();

        if (!input) {
            showError('Please enter JSON to minify');
            return;
        }

        try {
            const minified = minifyJSON(input);
            jsonResult.value = minified;
            clearError();

            // Show compression stats
            const stats = getJSONStats(input);
            if (stats) {
                showError(`Minified! Reduced size by ${stats.compressionRatio}% (${stats.originalSize} → ${stats.minifiedSize} characters)`);
                errorDiv.style.color = '#059669';
                errorDiv.style.backgroundColor = '#f0f9f4';
                errorDiv.style.borderColor = '#bbf7d0';
            }

            // Visual feedback
            minifyBtn.textContent = 'Minified!';
            minifyBtn.style.backgroundColor = '#059669';

            setTimeout(() => {
                minifyBtn.textContent = 'Minify';
                minifyBtn.style.backgroundColor = '';
            }, 1000);

        } catch (error) {
            const validation = validateJSON(input);
            showError(error.message, validation.line);
            jsonResult.value = '';
        }
    });

    // Validate button click
    validateBtn.addEventListener('click', function () {
        const input = jsonInput.value.trim();

        if (!input) {
            showError('Please enter JSON to validate');
            return;
        }

        const validation = validateJSON(input);

        if (validation.valid) {
            const stats = getJSONStats(input);
            let message = '✅ Valid JSON!';

            if (stats) {
                message += ` Contains: ${stats.objects} objects, ${stats.arrays} arrays, ${stats.strings} strings, ${stats.numbers} numbers`;
            }

            showError(message);
            errorDiv.style.color = '#059669';
            errorDiv.style.backgroundColor = '#f0f9f4';
            errorDiv.style.borderColor = '#bbf7d0';
            jsonResult.value = 'JSON is valid! ✅';
        } else {
            showError(validation.error, validation.line);
            jsonResult.value = '';
        }

        // Visual feedback
        validateBtn.textContent = validation.valid ? 'Valid!' : 'Invalid';
        validateBtn.style.backgroundColor = validation.valid ? '#059669' : '#dc2626';

        setTimeout(() => {
            validateBtn.textContent = 'Validate';
            validateBtn.style.backgroundColor = '';
        }, 2000);
    });

    // Clear button click
    clearBtn.addEventListener('click', function () {
        jsonInput.value = '';
        jsonResult.value = '';
        clearError();
        jsonInput.focus();
    });

    // Copy result to clipboard
    copyBtn.addEventListener('click', async function () {
        if (jsonResult.value) {
            try {
                await navigator.clipboard.writeText(jsonResult.value);
                copyBtn.textContent = 'Copied!';
                copyBtn.style.backgroundColor = '#059669';

                setTimeout(() => {
                    copyBtn.textContent = 'Copy Result';
                    copyBtn.style.backgroundColor = '';
                }, 1000);
            } catch (err) {
                // Fallback for older browsers
                jsonResult.select();
                document.execCommand('copy');
                copyBtn.textContent = 'Copied!';

                setTimeout(() => {
                    copyBtn.textContent = 'Copy Result';
                }, 1000);
            }
        }
    });

    // Auto-validate on input (with debounce)
    let validateTimeout;
    jsonInput.addEventListener('input', function () {
        clearError();
        clearTimeout(validateTimeout);

        if (this.value.trim()) {
            validateTimeout = setTimeout(() => {
                const validation = validateJSON(this.value.trim());
                if (!validation.valid) {
                    showError(validation.error, validation.line);
                }
            }, 1000);
        }
    });

    // Keyboard shortcuts
    jsonInput.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'f':  // Format
                    e.preventDefault();
                    formatBtn.click();
                    break;
                case 'm':  // Minify
                    e.preventDefault();
                    minifyBtn.click();
                    break;
                case 'k':  // Validate
                    e.preventDefault();
                    validateBtn.click();
                    break;
            }
        }

        // Auto-indent on Enter
        if (e.key === 'Enter') {
            const cursorPos = this.selectionStart;
            const textBefore = this.value.substring(0, cursorPos);
            const lastLine = textBefore.split('\n').pop();
            const indent = lastLine.match(/^\s*/)[0];
            const lastChar = textBefore.trim().slice(-1);

            // Add extra indent for opening braces/brackets
            const extraIndent = (lastChar === '{' || lastChar === '[') ? '  ' : '';

            setTimeout(() => {
                const newCursorPos = this.selectionStart;
                const beforeCursor = this.value.substring(0, newCursorPos);
                const afterCursor = this.value.substring(newCursorPos);

                this.value = beforeCursor + indent + extraIndent + afterCursor;
                this.selectionStart = this.selectionEnd = newCursorPos + indent.length + extraIndent.length;
            }, 0);
        }
    });

    // Sample JSON for testing
    const sampleJSON = {
        "name": "Hyperforge Labs",
        "type": "Developer Tools",
        "tools": [
            "UUID Generator",
            "Base64 Encoder/Decoder",
            "Password Checker",
            "JSON Formatter"
        ],
        "features": {
            "responsive": true,
            "darkMode": false,
            "version": 1.0
        }
    };

    // Add sample button
    const sampleBtn = document.createElement('button');
    sampleBtn.textContent = 'Load Sample';
    sampleBtn.className = 'btn btn-secondary';
    sampleBtn.style.marginLeft = 'auto';

    sampleBtn.addEventListener('click', function () {
        jsonInput.value = JSON.stringify(sampleJSON, null, 2);
        clearError();

        sampleBtn.textContent = 'Loaded!';
        sampleBtn.style.backgroundColor = '#059669';

        setTimeout(() => {
            sampleBtn.textContent = 'Load Sample';
            sampleBtn.style.backgroundColor = '';
        }, 1000);
    });

    // Add sample button to button group
    const buttonGroup = document.querySelector('#formatJson').parentNode;
    buttonGroup.appendChild(sampleBtn);
});
