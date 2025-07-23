// Base64 Encoder/Decoder Functionality
document.addEventListener('DOMContentLoaded', function () {
    const inputTextarea = document.getElementById('base64Input');
    const resultTextarea = document.getElementById('base64Result');
    const encodeBtn = document.getElementById('encodeBase64');
    const decodeBtn = document.getElementById('decodeBase64');
    const clearBtn = document.getElementById('clearBase64');
    const copyBtn = document.getElementById('copyBase64');

    // Encode to Base64
    function encodeToBase64(text) {
        try {
            return btoa(unescape(encodeURIComponent(text)));
        } catch (error) {
            throw new Error('Failed to encode: Invalid characters detected');
        }
    }

    // Decode from Base64
    function decodeFromBase64(base64) {
        try {
            return decodeURIComponent(escape(atob(base64)));
        } catch (error) {
            throw new Error('Failed to decode: Invalid Base64 string');
        }
    }

    // Show error message
    function showError(message) {
        resultTextarea.value = `Error: ${message}`;
        resultTextarea.style.color = '#dc2626';
    }

    // Clear error styling
    function clearError() {
        resultTextarea.style.color = '';
    }

    // Encode button click
    encodeBtn.addEventListener('click', function () {
        const inputText = inputTextarea.value.trim();

        if (!inputText) {
            showError('Please enter text to encode');
            return;
        }

        try {
            const encoded = encodeToBase64(inputText);
            resultTextarea.value = encoded;
            clearError();

            // Visual feedback
            encodeBtn.textContent = 'Encoded!';
            encodeBtn.style.backgroundColor = '#059669';

            setTimeout(() => {
                encodeBtn.textContent = 'Encode';
                encodeBtn.style.backgroundColor = '';
            }, 1000);
        } catch (error) {
            showError(error.message);
        }
    });

    // Decode button click
    decodeBtn.addEventListener('click', function () {
        const inputText = inputTextarea.value.trim();

        if (!inputText) {
            showError('Please enter Base64 text to decode');
            return;
        }

        try {
            const decoded = decodeFromBase64(inputText);
            resultTextarea.value = decoded;
            clearError();

            // Visual feedback
            decodeBtn.textContent = 'Decoded!';
            decodeBtn.style.backgroundColor = '#059669';

            setTimeout(() => {
                decodeBtn.textContent = 'Decode';
                decodeBtn.style.backgroundColor = '';
            }, 1000);
        } catch (error) {
            showError(error.message);
        }
    });

    // Clear button click
    clearBtn.addEventListener('click', function () {
        inputTextarea.value = '';
        resultTextarea.value = '';
        clearError();
        inputTextarea.focus();
    });

    // Copy result to clipboard
    copyBtn.addEventListener('click', async function () {
        if (resultTextarea.value && !resultTextarea.value.startsWith('Error:')) {
            try {
                await navigator.clipboard.writeText(resultTextarea.value);
                copyBtn.textContent = 'Copied!';
                copyBtn.style.backgroundColor = '#059669';

                setTimeout(() => {
                    copyBtn.textContent = 'Copy Result';
                    copyBtn.style.backgroundColor = '';
                }, 1000);
            } catch (err) {
                // Fallback for older browsers
                resultTextarea.select();
                document.execCommand('copy');
                copyBtn.textContent = 'Copied!';

                setTimeout(() => {
                    copyBtn.textContent = 'Copy Result';
                }, 1000);
            }
        }
    });

    // Auto-resize textareas
    function autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    inputTextarea.addEventListener('input', function () {
        autoResize(this);
    });

    resultTextarea.addEventListener('input', function () {
        autoResize(this);
    });

    // Handle Enter key for quick encoding
    inputTextarea.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.key === 'Enter') {
            encodeBtn.click();
        } else if (e.shiftKey && e.key === 'Enter') {
            decodeBtn.click();
        }
    });
});
