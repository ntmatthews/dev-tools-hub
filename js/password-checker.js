// Password Strength Checker Functionality
document.addEventListener('DOMContentLoaded', function () {
    const passwordInput = document.getElementById('passwordInput');
    const toggleBtn = document.getElementById('togglePassword');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const requirements = {
        length: document.getElementById('length'),
        uppercase: document.getElementById('uppercase'),
        lowercase: document.getElementById('lowercase'),
        number: document.getElementById('number'),
        special: document.getElementById('special')
    };

    // Password strength criteria
    const criteria = {
        length: (password) => password.length >= 8,
        uppercase: (password) => /[A-Z]/.test(password),
        lowercase: (password) => /[a-z]/.test(password),
        number: (password) => /\d/.test(password),
        special: (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    // Calculate password strength
    function calculateStrength(password) {
        if (!password) return { score: 0, text: 'Enter a password to check its strength' };

        let score = 0;
        const checks = Object.values(criteria).map(check => check(password));
        score = checks.filter(Boolean).length;

        // Additional scoring factors
        if (password.length >= 12) score += 0.5;
        if (password.length >= 16) score += 0.5;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{2,}/.test(password)) score += 0.5; // Multiple special chars
        if (!/(.)\1{2,}/.test(password)) score += 0.5; // No repeated characters
        if (!/012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) score += 0.5; // No sequential chars

        let strength, text;
        if (score < 2) {
            strength = 'weak';
            text = 'Very Weak - Add more character types';
        } else if (score < 3.5) {
            strength = 'fair';
            text = 'Weak - Missing some requirements';
        } else if (score < 5) {
            strength = 'good';
            text = 'Good - Consider making it longer';
        } else {
            strength = 'strong';
            text = 'Strong - Great password!';
        }

        return { score, strength, text };
    }

    // Update requirement indicators
    function updateRequirements(password) {
        for (const [key, element] of Object.entries(requirements)) {
            const isValid = criteria[key](password);
            element.classList.toggle('valid', isValid);
        }
    }

    // Update strength display
    function updateStrengthDisplay(password) {
        const { strength, text } = calculateStrength(password);

        // Update strength bar
        strengthBar.className = 'strength-bar';
        if (strength) {
            strengthBar.classList.add(strength);
        }

        // Update strength text
        strengthText.textContent = text;
        strengthText.className = 'strength-text';
        if (strength) {
            strengthText.classList.add(strength);
        }
    }

    // Toggle password visibility
    toggleBtn.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        toggleBtn.textContent = type === 'password' ? '👁️' : '🙈';
    });

    // Password input event listener
    passwordInput.addEventListener('input', function () {
        const password = this.value;
        updateRequirements(password);
        updateStrengthDisplay(password);
    });

    // Generate random password function
    function generateRandomPassword(length = 16) {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        const allChars = lowercase + uppercase + numbers + special;

        let password = '';

        // Ensure at least one character from each category
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += special[Math.floor(Math.random() * special.length)];

        // Fill the rest randomly
        for (let i = 4; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        // Shuffle the password
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    // Add generate password button
    const generateBtn = document.createElement('button');
    generateBtn.textContent = 'Generate Strong Password';
    generateBtn.className = 'btn btn-secondary';
    generateBtn.style.marginTop = '1rem';

    generateBtn.addEventListener('click', function () {
        const newPassword = generateRandomPassword();
        passwordInput.value = newPassword;
        passwordInput.type = 'text'; // Show generated password
        toggleBtn.textContent = '🙈';

        // Update displays
        updateRequirements(newPassword);
        updateStrengthDisplay(newPassword);

        // Visual feedback
        generateBtn.textContent = 'Generated!';
        generateBtn.style.backgroundColor = '#059669';

        setTimeout(() => {
            generateBtn.textContent = 'Generate Strong Password';
            generateBtn.style.backgroundColor = '';
        }, 1500);
    });

    // Add the generate button to the tool content
    const passwordCard = passwordInput.closest('.tool-card');
    const toolContent = passwordCard.querySelector('.tool-content');
    toolContent.appendChild(generateBtn);

    // Common password detection
    const commonPasswords = [
        'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
        'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'dragon',
        'master', 'login', 'pass', '1234567', 'princess', 'solo', 'hello'
    ];

    // Check for common passwords
    passwordInput.addEventListener('blur', function () {
        const password = this.value.toLowerCase();
        if (commonPasswords.includes(password)) {
            strengthText.textContent = 'Warning: This is a commonly used password!';
            strengthText.style.color = '#dc2626';
        }
    });

    // Keyboard shortcuts
    passwordInput.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.key === 'g') {
            e.preventDefault();
            generateBtn.click();
        }
    });
});
