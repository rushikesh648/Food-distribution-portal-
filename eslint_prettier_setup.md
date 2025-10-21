# ESLint & Prettier Setup for Food Distribution Portal

## Files to Create

### 1. `.eslintrc.json`
Create this file in the root directory:

```json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": ["react", "react-hooks"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "warn",
    "no-unused-vars": "warn",
    "no-console": "warn",
    "prefer-const": "error",
    "no-var": "error"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

---

### 2. `.prettierrc`
Create this file in the root directory:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "jsxBracketSameLine": false
}
```

---

### 3. `.prettierignore`
Create this file in the root directory:

```
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Build outputs
build/
dist/
.next/
out/

# Cache
.cache/
.parcel-cache/

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Other
coverage/
.git/
```

---

### 4. `.eslintignore`
Create this file in the root directory:

```
# Dependencies
node_modules/

# Build outputs
build/
dist/
.next/
out/

# Configuration
*.config.js
vite.config.js
webpack.config.js

# Cache
.cache/

# Environment
.env*

# Other
coverage/
public/
*.min.js
```

---

### 5. Update `package.json`
Add these scripts and devDependencies to your `package.json`:

```json
{
  "scripts": {
    "lint": "eslint . --ext .js,.jsx",
    "lint:fix": "eslint . --ext .js,.jsx --fix",
    "format": "prettier --write \"**/*.{js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,json,css,md}\""
  },
  "devDependencies": {
    "eslint": "^8.50.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.0.3"
  }
}
```

---

### 6. `.vscode/settings.json` (Optional - for VS Code users)
Create this file to enable auto-formatting on save:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact"
  ]
}
```

---

## Installation Instructions

After creating these files, run:

```bash
npm install --save-dev eslint eslint-config-prettier eslint-plugin-react eslint-plugin-react-hooks prettier
```

Or with yarn:

```bash
yarn add --dev eslint eslint-config-prettier eslint-plugin-react eslint-plugin-react-hooks prettier
```

---

## Usage

### Lint your code:
```bash
npm run lint
```

### Auto-fix linting issues:
```bash
npm run lint:fix
```

### Format your code:
```bash
npm run format
```

### Check formatting (CI/CD):
```bash
npm run format:check
```

---

## Git Workflow

1. **Create a new branch:**
```bash
git checkout -b config/add-eslint-prettier
```

2. **Create all the configuration files** listed above

3. **Install dependencies:**
```bash
npm install --save-dev eslint eslint-config-prettier eslint-plugin-react eslint-plugin-react-hooks prettier
```

4. **Test the setup:**
```bash
npm run lint
npm run format:check
```

5. **Commit your changes:**
```bash
git add .
git commit -m "Add ESLint and Prettier configuration for code quality"
```

6. **Push to your fork:**
```bash
git push origin config/add-eslint-prettier
```

7. **Create Pull Request** on GitHub

---

## Pull Request Description Template

```markdown
## Description
This PR adds ESLint and Prettier configuration to establish code quality standards and consistent formatting across the project.

## Type of Change
- [x] Configuration/Setup
- [x] Code quality improvement

## Changes Made
- ✅ Added `.eslintrc.json` with React-specific rules
- ✅ Added `.prettierrc` for consistent code formatting
- ✅ Added `.prettierignore` and `.eslintignore` files
- ✅ Added lint and format scripts to `package.json`
- ✅ Added VS Code settings for auto-formatting (optional)
- ✅ Configured ESLint to work with Prettier (no conflicts)

## Benefits
- Ensures consistent code style across the project
- Catches common errors and bugs early
- Improves code readability and maintainability
- Provides auto-fix capabilities for common issues
- Integrates with popular IDEs

## Testing
- [x] Installed all dependencies successfully
- [x] Ran `npm run lint` - works correctly
- [x] Ran `npm run format` - formats code properly
- [x] No conflicts between ESLint and Prettier
- [x] Tested with VS Code integration

## Installation for Contributors
After pulling these changes, contributors should run:
\`\`\`bash
npm install
\`\`\`

## Usage
- `npm run lint` - Check for linting errors
- `npm run lint:fix` - Auto-fix linting errors
- `npm run format` - Format all code
- `npm run format:check` - Check formatting (useful for CI/CD)

## Additional Notes
- Configuration follows industry best practices for React projects
- ESLint rules are set to "warn" initially to avoid breaking existing code
- Prettier settings use common conventions (2 spaces, single quotes, semicolons)
- VS Code settings are optional and only affect local development

## Hacktoberfest
This PR is part of Hacktoberfest 2024 contributions.
```

---

## Next Steps

1. Create all the configuration files in your local repository
2. Install the dependencies
3. Test the setup
4. Commit and push to your fork
5. Create the pull request using the template above

Good luck with your contribution! 🚀
