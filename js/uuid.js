// UUID Generator Functionality
document.addEventListener('DOMContentLoaded', function () {
    const generateBtn = document.getElementById('generateUuid');
    const uuidResult = document.getElementById('uuidResult');
    const copyBtn = document.getElementById('copyUuid');

    // Generate UUID v4
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Generate UUID on button click
    generateBtn.addEventListener('click', function () {
        const uuid = generateUUID();
        uuidResult.value = uuid;

        // Add visual feedback
        generateBtn.textContent = 'Generated!';
        generateBtn.style.backgroundColor = '#059669';

        setTimeout(() => {
            generateBtn.textContent = 'Generate UUID';
            generateBtn.style.backgroundColor = '';
        }, 1000);
    });

    // Copy UUID to clipboard
    copyBtn.addEventListener('click', async function () {
        if (uuidResult.value) {
            try {
                await navigator.clipboard.writeText(uuidResult.value);
                copyBtn.textContent = 'Copied!';
                copyBtn.style.backgroundColor = '#059669';

                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                    copyBtn.style.backgroundColor = '';
                }, 1000);
            } catch (err) {
                // Fallback for older browsers
                uuidResult.select();
                document.execCommand('copy');
                copyBtn.textContent = 'Copied!';

                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                }, 1000);
            }
        }
    });

    // Generate a UUID on page load
    generateBtn.click();
});
