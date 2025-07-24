// QR Code Generator with Advanced Features
document.addEventListener('DOMContentLoaded', function () {
    const textInput = document.getElementById('qrTextInput');
    const typeSelect = document.getElementById('qrType');
    const sizeSelect = document.getElementById('qrSize');
    const errorCorrectionSelect = document.getElementById('qrErrorCorrection');
    const colorForeground = document.getElementById('qrColorFg');
    const colorBackground = document.getElementById('qrColorBg');
    const logoInput = document.getElementById('qrLogoInput');
    const generateBtn = document.getElementById('generateQR');
    const downloadBtn = document.getElementById('downloadQR');
    const clearBtn = document.getElementById('clearQR');
    const qrPreview = document.getElementById('qrPreview');
    const qrInfo = document.getElementById('qrInfo');

    let currentQRCode = null;

    // QR Code types with templates
    const qrTypes = {
        text: { label: 'Plain Text', placeholder: 'Enter any text' },
        url: { label: 'Website URL', placeholder: 'https://example.com' },
        email: { label: 'Email', placeholder: 'user@example.com' },
        phone: { label: 'Phone Number', placeholder: '+1234567890' },
        sms: { label: 'SMS', placeholder: '+1234567890' },
        wifi: { label: 'WiFi Network', placeholder: 'SSID:password:security' },
        location: { label: 'Location', placeholder: 'latitude,longitude' },
        vcard: { label: 'Contact Card', placeholder: 'Name|Phone|Email|Company' }
    };

    // Initialize type selector
    Object.entries(qrTypes).forEach(([value, config]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = config.label;
        typeSelect.appendChild(option);
    });

    // Update placeholder based on selected type
    typeSelect.addEventListener('change', function () {
        const selectedType = qrTypes[this.value];
        textInput.placeholder = selectedType.placeholder;
        textInput.value = '';

        // Show type-specific help
        showTypeHelp(this.value);
    });

    // Generate QR Code
    async function generateQRCode() {
        const text = textInput.value.trim();
        const type = typeSelect.value;
        const size = parseInt(sizeSelect.value);
        const errorCorrection = errorCorrectionSelect.value;

        if (!text) {
            showError('Please enter content for the QR code');
            return;
        }

        try {
            showLoading();

            // Process input based on type
            const qrData = processQRData(text, type);

            // Validate data
            if (!validateQRData(qrData, type)) {
                showError('Invalid data format for selected type');
                return;
            }

            // Generate QR code using a QR library (we'll use a CDN)
            await loadQRLibrary();

            const qrCode = new QRCode(document.createElement('div'), {
                text: qrData,
                width: size,
                height: size,
                colorDark: colorForeground.value,
                colorLight: colorBackground.value,
                correctLevel: getErrorCorrectionLevel(errorCorrection)
            });

            currentQRCode = qrCode;
            displayQRCode(qrCode, qrData, type, size);

        } catch (error) {
            showError(`QR generation failed: ${error.message}`);
        }
    }

    // Process input data based on QR type
    function processQRData(text, type) {
        switch (type) {
            case 'url':
                return text.startsWith('http') ? text : `https://${text}`;

            case 'email':
                return `mailto:${text}`;

            case 'phone':
                return `tel:${text}`;

            case 'sms':
                return `sms:${text}`;

            case 'wifi':
                const [ssid, password, security = 'WPA'] = text.split(':');
                return `WIFI:T:${security};S:${ssid};P:${password};;`;

            case 'location':
                const [lat, lng] = text.split(',');
                return `geo:${lat.trim()},${lng.trim()}`;

            case 'vcard':
                const [name, phone, email, company] = text.split('|');
                return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nORG:${company}\nEND:VCARD`;

            default:
                return text;
        }
    }

    // Validate QR data based on type
    function validateQRData(data, type) {
        switch (type) {
            case 'url':
                return SecurityUtils.validateURL(data);

            case 'email':
                return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data);

            case 'phone':
            case 'sms':
                return /^(tel:|sms:)\+?[\d\-\(\)\s]+$/.test(data);

            case 'location':
                return /^geo:-?\d+\.?\d*,-?\d+\.?\d*$/.test(data);

            default:
                return data.length > 0 && data.length <= 4296; // Max QR capacity
        }
    }

    // Get error correction level
    function getErrorCorrectionLevel(level) {
        const levels = {
            'L': QRCode.CorrectLevel.L,
            'M': QRCode.CorrectLevel.M,
            'Q': QRCode.CorrectLevel.Q,
            'H': QRCode.CorrectLevel.H
        };
        return levels[level] || levels.M;
    }

    // Display generated QR code
    function displayQRCode(qrCode, data, type, size) {
        qrPreview.innerHTML = '';

        // Clone the QR code canvas
        const canvas = qrCode._el.querySelector('canvas');
        if (canvas) {
            const clonedCanvas = canvas.cloneNode(true);
            qrPreview.appendChild(clonedCanvas);

            // Add logo if provided
            if (logoInput.files.length > 0) {
                addLogoToQR(clonedCanvas);
            }
        }

        // Show QR info
        const capacity = calculateQRCapacity(size, errorCorrectionSelect.value);
        const dataLength = data.length;
        const usagePercent = ((dataLength / capacity) * 100).toFixed(1);

        qrInfo.innerHTML = `
            <div class="qr-stats">
                <div class="qr-stat">
                    <span class="stat-label">Type:</span>
                    <span class="stat-value">${qrTypes[type].label}</span>
                </div>
                <div class="qr-stat">
                    <span class="stat-label">Size:</span>
                    <span class="stat-value">${size}×${size}px</span>
                </div>
                <div class="qr-stat">
                    <span class="stat-label">Data:</span>
                    <span class="stat-value">${dataLength} / ${capacity} chars (${usagePercent}%)</span>
                </div>
                <div class="qr-stat">
                    <span class="stat-label">Error Correction:</span>
                    <span class="stat-value">${errorCorrectionSelect.value}</span>
                </div>
            </div>
            <div class="qr-data-preview">
                <strong>Encoded Data:</strong>
                <code>${SecurityUtils.sanitizeInput(data.substring(0, 100))}${data.length > 100 ? '...' : ''}</code>
            </div>
        `;

        downloadBtn.disabled = false;
        hideLoading();
    }

    // Add logo to QR code
    async function addLogoToQR(canvas) {
        const file = logoInput.files[0];
        if (!file) return;

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    const ctx = canvas.getContext('2d');
                    const logoSize = Math.min(canvas.width * 0.2, 60); // 20% of QR size, max 60px
                    const x = (canvas.width - logoSize) / 2;
                    const y = (canvas.height - logoSize) / 2;

                    // Add white background circle for logo
                    ctx.fillStyle = colorBackground.value;
                    ctx.beginPath();
                    ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2 + 5, 0, 2 * Math.PI);
                    ctx.fill();

                    // Draw logo
                    ctx.drawImage(img, x, y, logoSize, logoSize);
                    resolve();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // Calculate approximate QR capacity
    function calculateQRCapacity(size, errorLevel) {
        // Simplified capacity calculation (actual depends on QR version)
        const baseCapacity = {
            'L': 4296, 'M': 3391, 'Q': 2420, 'H': 1852
        };
        return baseCapacity[errorLevel] || baseCapacity.M;
    }

    // Show type-specific help
    function showTypeHelp(type) {
        const helpTexts = {
            wifi: 'Format: NetworkName:Password:Security (e.g., MyWiFi:mypassword:WPA)',
            location: 'Format: latitude,longitude (e.g., 40.7128,-74.0060)',
            vcard: 'Format: Name|Phone|Email|Company (e.g., John Doe|+1234567890|john@example.com|Acme Corp)',
            email: 'Enter email address (e.g., user@example.com)',
            phone: 'Enter phone number with country code (e.g., +1234567890)',
            sms: 'Enter phone number to send SMS to',
            url: 'Enter website URL (http/https will be added if missing)'
        };

        if (helpTexts[type]) {
            // Show help tooltip or info box
            console.log(`Help: ${helpTexts[type]}`);
        }
    }

    // Download QR code
    function downloadQRCode() {
        if (!currentQRCode) return;

        const canvas = qrPreview.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = `qr-code-${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
    }

    // Load QR library dynamically
    async function loadQRLibrary() {
        if (window.QRCode) return;

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
            script.onload = () => {
                // Fallback if qrious doesn't work, load alternative
                if (!window.QRious) {
                    const altScript = document.createElement('script');
                    altScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.3/qrcode.min.js';
                    altScript.onload = resolve;
                    altScript.onerror = reject;
                    document.head.appendChild(altScript);
                } else {
                    // Create QRCode class compatible interface
                    window.QRCode = function (element, options) {
                        this._el = element;
                        this.qr = new QRious({
                            element: element,
                            value: options.text,
                            size: options.width,
                            foreground: options.colorDark,
                            background: options.colorLight,
                            level: options.correctLevel
                        });
                    };

                    window.QRCode.CorrectLevel = {
                        L: 'L', M: 'M', Q: 'Q', H: 'H'
                    };

                    resolve();
                }
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Show loading state
    function showLoading() {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<div class="loading"></div> Generating...';
    }

    // Hide loading state
    function hideLoading() {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate QR Code';
    }

    // Show error
    function showError(message) {
        qrPreview.innerHTML = `<div class="qr-error">❌ ${message}</div>`;
        qrInfo.innerHTML = '';
        hideLoading();
    }

    // Event listeners
    generateBtn.addEventListener('click', generateQRCode);
    downloadBtn.addEventListener('click', downloadQRCode);

    clearBtn.addEventListener('click', function () {
        textInput.value = '';
        qrPreview.innerHTML = '<p>QR code will appear here</p>';
        qrInfo.innerHTML = '';
        downloadBtn.disabled = true;
        currentQRCode = null;
    });

    // Auto-generate on input change (debounced)
    let qrTimeout;
    textInput.addEventListener('input', function () {
        clearTimeout(qrTimeout);
        if (this.value.trim()) {
            qrTimeout = setTimeout(generateQRCode, 1500);
        }
    });

    // Color change triggers regeneration
    [colorForeground, colorBackground].forEach(input => {
        input.addEventListener('change', function () {
            if (currentQRCode && textInput.value.trim()) {
                generateQRCode();
            }
        });
    });

    // Size and error correction changes
    [sizeSelect, errorCorrectionSelect].forEach(select => {
        select.addEventListener('change', function () {
            if (currentQRCode && textInput.value.trim()) {
                generateQRCode();
            }
        });
    });
});
