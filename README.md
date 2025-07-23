# Hyperforge Labs – Developer Tools Hub

A sleek, single-page developer utility site with essential tools for developers.

## 🔧 Tools Included

- **UUID Generator** - Generate unique identifiers for your applications
- **Base64 Encoder/Decoder** - Encode and decode Base64 strings
- **Password Strength Checker** - Check password security with strength indicators
- **JSON Formatter** - Format, validate, and beautify JSON data
- **Connection Test** - Test connectivity to websites and services

## 🚀 Features

- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Offline Capable** - All tools work without internet connection
- **Keyboard Shortcuts** - Quick access with keyboard shortcuts
- **Copy to Clipboard** - Easy copying of results
- **Real-time Validation** - Instant feedback as you type
- **Modern UI** - Clean, professional interface

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Deployment**: GitHub Pages
- **Domain**: tools.hyperforgestudios.org (optional)

## 📦 Installation & Development

1. Clone the repository:
   ```bash
   git clone https://github.com/hyperforge-labs/dev-tools-hub.git
   cd dev-tools-hub
   ```

2. Open `index.html` in your browser or serve with a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Or simply open index.html in your browser
   ```

## 🚀 Deployment

### GitHub Pages (Automatic)

1. Push to the `main` branch
2. GitHub Actions will automatically deploy to GitHub Pages
3. Access your site at `https://yourusername.github.io/dev-tools-hub`

### Custom Domain

1. Add your domain to the `CNAME` file
2. Configure DNS to point to GitHub Pages
3. Enable HTTPS in repository settings

## 📁 Project Structure

```
/dev-tools-hub
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Styles and responsive design
├── js/
│   ├── uuid.js            # UUID generation functionality
│   ├── base64.js          # Base64 encoding/decoding
│   ├── password-checker.js # Password strength checking
│   ├── json-formatter.js   # JSON formatting and validation
│   └── ping-test.js       # Connection testing
├── .github/
│   └── workflows/
│       └── pages-deploy.yml # GitHub Pages deployment
├── CNAME                   # Custom domain configuration
└── README.md              # This file
```

## ⌨️ Keyboard Shortcuts

- **UUID Generator**: Auto-generates on page load
- **Base64**: `Ctrl+Enter` to encode, `Shift+Enter` to decode
- **Password**: `Ctrl+G` to generate strong password
- **JSON**: `Ctrl+F` to format, `Ctrl+M` to minify, `Ctrl+K` to validate
- **Connection Test**: `Enter` to test connection

## 🎨 Customization

### Adding New Tools

1. Add HTML structure to `index.html`
2. Create corresponding CSS styles in `css/styles.css`
3. Implement functionality in a new JS file in `js/`
4. Include the script in `index.html`

### Styling

The CSS uses CSS custom properties (variables) for easy theming:

```css
:root {
    --primary-color: #2563eb;
    --primary-hover: #1d4ed8;
    --secondary-color: #64748b;
    /* ... more variables */
}
```

## 🔮 Future Enhancements

- [ ] Dark mode toggle
- [ ] PWA (Progressive Web App) support
- [ ] Additional tools (QR code generator, URL shortener, etc.)
- [ ] Local storage for user preferences
- [ ] Export/import functionality
- [ ] Batch processing capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-tool`)
3. Commit your changes (`git commit -am 'Add new tool'`)
4. Push to the branch (`git push origin feature/new-tool`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Icons and design inspiration from modern web standards
- Built with accessibility and performance in mind
- Designed for the developer community by Hyperforge Labs

---

**Hyperforge Labs** - Building tools for developers, by developers. ❤️
