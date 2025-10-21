# Contributing to Food Distribution Portal

Thank you for your interest in contributing to the Food Distribution Portal! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Community](#community)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone. Please:

- Be respectful and considerate in your communication
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **Git**
- A code editor (VS Code recommended)

### Fork and Clone the Repository

1. **Fork the repository** by clicking the "Fork" button on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/Food-distribution-portal-.git
   cd Food-distribution-portal-
   ```
3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/rushikesh648/Food-distribution-portal-.git
   ```

### Install Dependencies

```bash
npm install
```

### Run the Project Locally

```bash
npm start
```

The application should now be running on `http://localhost:3000`

## How to Contribute

### Types of Contributions We Welcome

- 🐛 **Bug fixes**
- ✨ **New features**
- 📝 **Documentation improvements**
- 🎨 **UI/UX enhancements**
- ♿ **Accessibility improvements**
- 🧪 **Test coverage**
- 🔧 **Configuration and tooling**
- 🌐 **Translations**

### Good First Issues

Look for issues labeled with:
- `good first issue` - Great for newcomers
- `help wanted` - We need your help!
- `documentation` - Documentation improvements
- `bug` - Bug fixes

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b type/short-description
```

Branch naming conventions:
- `feature/add-user-authentication`
- `fix/donor-form-validation`
- `docs/update-readme`
- `refactor/cleanup-api-calls`
- `style/improve-navbar-design`

### 2. Make Your Changes

- Write clean, readable code
- Follow the coding standards (see below)
- Add comments for complex logic
- Update documentation if needed
- Write/update tests if applicable

### 3. Test Your Changes

Before committing, ensure:
- The application runs without errors
- Your changes work as expected
- Existing functionality isn't broken
- Run linting: `npm run lint`

### 4. Commit Your Changes

```bash
git add .
git commit -m "Type: Brief description of changes"
```

See [Commit Guidelines](#commit-guidelines) for details.

### 5. Keep Your Branch Updated

```bash
git fetch upstream
git rebase upstream/main
```

### 6. Push to Your Fork

```bash
git push origin your-branch-name
```

### 7. Create a Pull Request

Go to GitHub and create a pull request from your fork to the original repository.

## Coding Standards

### JavaScript/React

- Use **functional components** with hooks
- Use **ES6+** syntax
- Follow **camelCase** for variables and functions
- Follow **PascalCase** for component names
- Use **meaningful variable names**
- Keep functions small and focused
- Avoid deeply nested code

### Example:

```javascript
// Good ✅
const handleUserSubmit = async (userData) => {
  try {
    const response = await submitUser(userData);
    return response;
  } catch (error) {
    console.error('Error submitting user:', error);
  }
};

// Bad ❌
function f(d) {
  submitUser(d);
}
```

### File Structure

```
src/
├── components/       # Reusable UI components
├── pages/           # Page components
├── services/        # API calls and services
├── utils/           # Utility functions
├── hooks/           # Custom React hooks
├── context/         # React context
├── styles/          # CSS/styling files
└── assets/          # Images, fonts, etc.
```

### CSS/Styling

- Use **CSS modules** or **styled-components**
- Follow **BEM naming convention** if using plain CSS
- Keep styles modular and reusable
- Use **responsive design** principles
- Ensure **accessibility** (proper contrast, focus states)

## Commit Guidelines

We follow the **Conventional Commits** specification:

### Format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples:

```bash
feat(auth): add user login functionality

fix(donor-form): resolve validation error on submit

docs(readme): update installation instructions

style(navbar): improve mobile responsiveness
```

## Pull Request Process

### Before Submitting

- ✅ Code follows the project's style guidelines
- ✅ Self-review of your code completed
- ✅ Comments added for complex code
- ✅ Documentation updated if needed
- ✅ No new warnings generated
- ✅ Tests pass locally
- ✅ Branch is up to date with main

### PR Title Format

```
[Type] Brief description
```

Examples:
- `[Feature] Add donor registration form`
- `[Fix] Resolve navigation menu issue`
- `[Docs] Update contributing guidelines`

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Performance improvement
- [ ] Other (please describe)

## Changes Made
- Added donor registration form
- Implemented form validation
- Connected to backend API
- Added unit tests

## Screenshots (if applicable)
[Add screenshots here]

## Testing
- [ ] Tested locally
- [ ] No breaking changes
- [ ] Tests pass

## Related Issues
Closes #123

## Additional Notes
[Any additional context]
```

### Review Process

1. A maintainer will review your PR
2. They may request changes or ask questions
3. Make requested changes and push updates
4. Once approved, your PR will be merged!

### After Your PR is Merged

- Delete your branch: `git branch -d your-branch-name`
- Update your local repository:
  ```bash
  git checkout main
  git pull upstream main
  ```

## Reporting Bugs

### Before Submitting a Bug Report

- Check existing issues to avoid duplicates
- Collect relevant information
- Test with the latest version

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 96]
- Node version: [e.g., 16.13.0]

**Additional context**
Any other relevant information.
```

## Suggesting Features

We welcome feature suggestions! Please:

1. Check if the feature has already been suggested
2. Clearly describe the feature and its benefits
3. Provide examples or mockups if possible
4. Explain why this feature would be useful

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context, screenshots, or mockups.
```

## Community

### Getting Help

- 💬 Ask questions in issue comments
- 📧 Contact maintainers
- 🤝 Join discussions in PRs and issues

### Recognition

Contributors will be recognized in:
- Project README
- Release notes
- Contributors list

## Additional Resources

- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)

## Questions?

If you have questions about contributing, feel free to:
- Open an issue with the `question` label
- Tag maintainers in discussions
- Check existing documentation

---

## Thank You! 🎉

Your contributions make this project better for everyone. We appreciate your time and effort!

Happy coding! 💻✨
