# Development Instructions for Guitar Fretboard Learning Tool

## Overview
You are tasked with implementing a static web application for guitar fretboard learning based on the provided Product Feature Document and Technical Requirements. Follow these instructions carefully to ensure successful delivery.

## Input Documents
1. **PRODUCT_FEATURE_DOCUMENT.md** - Provides business context, user needs, and feature overview
2. **TECHNICAL_REQUIREMENTS.md** - Contains detailed technical specifications in Intel EARS format with RFC 2119 language

## Technology Stack Requirements

### REQUIRED Technologies
- **HTML5** - Use semantic markup and modern HTML5 features
- **CSS3** - Use modern CSS features including Flexbox/Grid for layout
- **Vanilla JavaScript** - No external frameworks or libraries allowed
- **JSON** - For file import/export functionality

### PROHIBITED Technologies
- React, Vue, Angular, or any JavaScript frameworks
- jQuery or other JavaScript libraries
- Server-side technologies (Node.js, PHP, Python, etc.)
- External APIs or web services
- Canvas API or WebGL (use HTML/CSS for fretboard rendering)

### RECOMMENDED Approaches
- Use CSS Custom Properties (variables) for theming
- Implement ES6+ features (modules, classes, arrow functions)
- Use CSS Grid for complex layouts
- Implement drag-and-drop using HTML5 Drag and Drop API
- Use localStorage for session persistence if needed

## Implementation Guidelines

### 1. Architecture Principles
- **Component-based structure**: Organize code into logical modules (Canvas, Grid, Note, etc.)
- **Separation of concerns**: Keep HTML structure, CSS styling, and JavaScript behavior separate
- **Event-driven design**: Use proper event handling for user interactions
- **State management**: Implement clean state management for undo/redo functionality

### 2. Code Organization
```
/src
  /components
    - canvas.js
    - grid.js
    - note.js
    - controls.js
  /styles
    - main.css
    - canvas.css
    - grid.css
    - components.css
  /utils
    - file-operations.js
    - music-theory.js
    - state-management.js
  index.html
  main.js
```

### 3. Key Implementation Requirements

#### Color System Implementation
- Use the exact CSS named colors specified in the requirements
- Implement the chromatic note color mapping as defined
- Ensure all colors meet accessibility standards
- Create CSS custom properties for easy maintenance

#### Music Theory Calculations
- Implement accurate chromatic scale calculations
- Calculate intervals based on semitone distances
- Handle enharmonic equivalents correctly (A#/Bb)
- Ensure proper note naming for natural notes only

#### State Management
- Implement comprehensive undo/redo using command pattern
- Maintain immutable state snapshots for history
- Include all user actions in the undo stack
- Optimize memory usage for large state histories

#### File Operations
- Implement robust JSON serialization/deserialization
- Include complete application state in exports
- Validate imported JSON structure
- Handle file operation errors gracefully

## Testing Requirements

### Test Framework Setup
- **REQUIRED**: Use Jest as the primary testing framework
- **REQUIRED**: Set up test coverage reporting (minimum 80% coverage)
- **REQUIRED**: Include tests in CI/CD pipeline

### Test Categories Required
1. **Unit Tests**
   - Music theory calculations (note names, intervals)
   - State management functions
   - File operations
   - Individual component functionality

2. **Integration Tests**
   - Complete user workflows
   - Canvas and Grid interactions
   - File save/load roundtrip testing
   - Undo/redo functionality

3. **Visual Tests** (if possible)
   - Color accessibility validation
   - Layout responsiveness
   - Print-ready dimensions

### Test Structure
```
/tests
  /unit
    - music-theory.test.js
    - state-management.test.js
    - file-operations.test.js
  /integration
    - canvas-workflows.test.js
    - grid-manipulation.test.js
  /fixtures
    - sample-states.json
    - test-files.json
```

## Deployment Requirements

### GitHub Actions CI/CD
Create `.github/workflows/deploy.yml` with the following requirements:
- **Trigger**: On push to main branch and pull requests
- **Node.js version**: Use LTS version (18 or 20)
- **Test execution**: Run all tests and require passing
- **Coverage reporting**: Generate and store coverage reports
- **Build process**: If needed for asset optimization
- **Deployment**: Deploy to GitHub Pages on successful main branch builds

### GitHub Pages Configuration
- Enable GitHub Pages in repository settings
- Configure to deploy from GitHub Actions
- Ensure all assets use relative paths
- Test deployment URL accessibility

## Quality Assurance

### Code Quality Standards
- Use ESLint with recommended configuration
- Follow consistent naming conventions
- Include comprehensive JSDoc comments
- Maintain clean, readable code structure

### Performance Standards
- Optimize for fast initial load
- Implement efficient DOM manipulation
- Use CSS transforms for animations
- Minimize layout thrashing during interactions

### Accessibility Standards
- Meet WCAG 2.1 AA compliance
- Test with screen readers if possible
- Ensure keyboard navigation support
- Validate color contrast ratios

## Deliverables Checklist

### Core Application
- [ ] Functional static HTML application
- [ ] All requirements from TECHNICAL_REQUIREMENTS.md implemented
- [ ] Print-ready Canvas dimensions
- [ ] Complete note placement and visualization system
- [ ] Interval calculation and highlighting
- [ ] File save/load functionality
- [ ] Undo/redo implementation

### Testing Suite
- [ ] Comprehensive test coverage (80%+)
- [ ] All tests passing in CI/CD
- [ ] Integration tests for key workflows
- [ ] Test documentation

### Deployment
- [ ] GitHub Actions workflow configured
- [ ] Successful deployment to GitHub Pages
- [ ] Application accessible via GitHub Pages URL
- [ ] All functionality working in production

### Documentation
- [ ] README.md with setup and usage instructions
- [ ] Code documentation and comments
- [ ] Architecture documentation
- [ ] User guide for the application

## Success Criteria
1. All technical requirements marked as "SHALL" are implemented and tested
2. Application deploys successfully to GitHub Pages
3. All automated tests pass consistently
4. Application meets performance and accessibility standards
5. Code quality standards are maintained throughout

## Support and Clarification
If any requirements are ambiguous or conflicting:
1. Refer to the Intel EARS technical requirements as the authoritative source
2. Prioritize user experience and accessibility
3. Choose the most robust and maintainable implementation approach
4. Document any assumptions or interpretations made

Begin implementation by setting up the project structure, test framework, and CI/CD pipeline before implementing core functionality.