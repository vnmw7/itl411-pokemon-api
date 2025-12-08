# ITL411 Pokémon API - Team Handoff Guidelines

## 🎯 Project Overview

This document provides specific guidelines for each team member to integrate their UI/CSS work with the robust logic layer that has been implemented.

**Architecture**: Decoupled Event-Driven Architecture
- Components communicate via DOM Events (`pokemon-search`, `pokemon-selected`)
- No global state management libraries
- Error handling using Result Pattern
- Accessibility-first approach with ARIA roles

---

## 👤 Isaiah (Search Component)

### 📍 File Location
`frontend/src/sections/isaiah/search-bar.js`

### 🔧 Logic Notes
- **Debouncing**: 300ms delay prevents API spam when users type fast
- **Event Dispatch**: Emits `pokemon-search` event with search term
- **Keyboard Support**: Enter key triggers immediate search
- **Accessibility**: Uses `role="search"` and proper ARIA labels

### 🎨 Design Tasks
1. **Style the search input**:
   ```css
   #search-input {
     /* Your styling here */
   }
   ```

2. **Style the search button**:
   ```css
   #search-button {
     /* Your styling here */
   }
   ```

3. **Position search icon** (if you add one):
   ```css
   .search-wrapper {
     position: relative;
   }
   .search-icon {
     position: absolute;
     left: 15px;
     top: 50%;
     transform: translateY(-50%);
   }
   ```

### 📋 Implementation Checklist
- [ ] Style search input with hover/focus states
- [ ] Style search button with hover/active states
- [ ] Add search icon (optional)
- [ ] Ensure responsive design on mobile
- [ ] Test keyboard navigation (Tab, Enter)

---

## 👤 Gerome (Grid Component)

### 📍 File Location
`frontend/src/sections/gerome/pokemon-grid.js`

### 🔧 Logic Notes
- **Result Pattern**: Robust error handling with user-friendly messages
- **Real API Integration**: Fetches from live backend at `https://lionfish-app-ff29q.ondigitalocean.app`
- **Accessibility**: Cards have `tabindex="0"` and keyboard support
- **Loading States**: Shows spinner during data fetch
- **Error Recovery**: Retry button on API failures

### 🎨 Design Tasks
1. **Style Pokémon cards**:
   ```css
   .poke-card {
     /* Your styling here */
     transition: transform 0.2s, box-shadow 0.2s;
   }
   
   .poke-card:hover {
     /* Hover styling */
   }
   
   .poke-card:focus {
     /* Must match hover for keyboard users */
   }
   ```

2. **Adjust grid responsiveness**:
   - Current: `grid-template-columns: repeat(auto-fill, minmax(140px, 1fr))`
   - Modify `140px` in `config.js` if cards need to be wider

3. **Style loading spinner**:
   ```css
   @keyframes spin {
     0% { transform: rotate(0deg); }
     100% { transform: rotate(360deg); }
   }
   ```

### 📋 Implementation Checklist
- [ ] Style card hover effects
- [ ] Style card focus states (match hover)
- [ ] Adjust grid card width if needed
- [ ] Style loading spinner
- [ ] Style error messages
- [ ] Test responsive grid layout
- [ ] Test keyboard navigation (Tab, Enter, Space)

---

## 👤 Nicole (Overview Component)

### 📍 File Location
`frontend/src/sections/nicole/pokemon-overview.js`

### 🔧 Logic Notes
- **Pure Presentation**: No API fetching logic
- **Data Source**: Receives full Pokémon object from Gerome's click event
- **Semantic HTML**: Uses `<article>`, `<header>`, `<section>` tags
- **Type Colors**: Dynamic type coloring with `getTypeColor()` function
- **Additional Data**: Shows height, weight, and abilities if available

### 🎨 Design Tasks
1. **Style Pokémon name**:
   ```css
   #pokemon-name {
     /* Your styling here */
   }
   ```

2. **Style type badges**:
   ```css
   .type-badge {
     /* Your styling here */
   }
   ```

3. **Handle image overflow**:
   ```css
   #pokemon-image {
     max-width: 100%;
     height: auto;
   }
   ```

4. **Style additional sections** (height/weight/abilities):
   ```css
   section[aria-label="Physical Attributes"],
   section[aria-label="Abilities"] {
     /* Your styling here */
   }
   ```

### 📋 Implementation Checklist
- [ ] Style Pokémon name display
- [ ] Style type badges with proper colors
- [ ] Ensure image doesn't overflow on mobile
- [ ] Style physical attributes section
- [ ] Style abilities section
- [ ] Test responsive layout
- [ ] Verify semantic HTML structure

---

## 👤 Kia (Stats & Evolution Component)

### 📍 File Location
`frontend/src/sections/kia/stats-evolution.js`

### 🔧 Logic Notes
- **Parallel Fetching**: Loads stats and evolution data simultaneously
- **Recursive Evolution**: Complex evolution tree rendering with `renderChain()`
- **Dynamic Stats**: Color-coded stat bars based on values
- **Feature Flags**: Evolution can be toggled via `enableEvolutionChain`
- **Loading States**: Shows spinner during data fetch

### 🎨 Design Tasks
1. **Style progress bars**:
   ```css
   /* Stat bars with gradients or animations */
   .stat-bar {
     /* Your styling here */
   }
   
   .stat-bar::after {
     /* Add gradient overlay */
   }
   ```

2. **Style evolution chain**:
   ```css
   /* Evolution container styling */
   .evolution-chain {
     display: flex;
     align-items: center;
     justify-content: center;
     /* Your styling here */
   }
   
   .evolution-pokemon {
     /* Individual evolution stage styling */
   }
   ```

3. **Enhance stat bar animations**:
   ```css
   @keyframes fillBar {
     from { width: 0; }
     to { width: var(--stat-percentage); }
   }
   ```

### 📋 Implementation Checklist
- [ ] Style stat progress bars with gradients
- [ ] Add animations to stat bars
- [ ] Style evolution chain layout
- [ ] Style evolution stage images
- [ ] Style evolution details (level, items)
- [ ] Test responsive evolution display
- [ ] Verify color-coded stats are accessible

---

## 🔄 Event Communication Flow

```
Isaiah (Search) ── pokemon-search ──> Gerome (Grid)
                                                    │
                                                    └── pokemon-selected ──> Nicole (Overview)
                                                                          │
                                                                          └── pokemon-selected ──> Kia (Stats)
```

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 API Endpoints

- **Base URL**: `https://lionfish-app-ff29q.ondigitalocean.app`
- **Pokémon List**: `GET /api/v1/pokemon`
- **Pokémon Details**: `GET /api/v1/pokemon/{id}`
- **Evolution Chain**: `GET /api/v1/pokemon/{id}/evolution`
- **Search**: `GET /api/v1/pokemon/search?name={name}`

## 🎨 CSS Architecture Guidelines

### File Structure
```
frontend/src/
├── config.js              # Configuration constants
├── main.js                 # Main application entry
├── style.css              # Global styles and CSS variables
└── sections/
    ├── isaiah/
    │   └── search-bar.js  # Search component
    ├── gerome/
    │   └── pokemon-grid.js # Grid component
    ├── nicole/
    │   └── pokemon-overview.js # Overview component
    └── kia/
        └── stats-evolution.js   # Stats component
```

### CSS Variables (Recommended)
```css
:root {
  /* Colors */
  --primary-color: #EA5D60;
  --secondary-color: #2B2F42;
  --background-color: #f6f8fc;
  --text-color: #333;
  --border-color: #eee;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Typography */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;
  
  /* Border Radius */
  --border-radius-sm: 6px;
  --border-radius-md: 12px;
  --border-radius-lg: 15px;
  
  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 15px rgba(0,0,0,0.05);
  --shadow-lg: 0 10px 25px rgba(0,0,0,0.1);
}
```

## 🧪 Testing Checklist

Before submitting your work, ensure:

1. **Functionality Tests**:
   - [ ] Search works with debouncing
   - [ ] Grid loads and filters correctly
   - [ ] Card selection updates overview and stats
   - [ ] Error states display properly

2. **Accessibility Tests**:
   - [ ] Keyboard navigation works (Tab, Enter, Space)
   - [ ] Screen reader announces changes
   - [ ] ARIA labels are descriptive
   - [ ] Focus states are visible

3. **Responsive Tests**:
   - [ ] Mobile layout (320px+)
   - [ ] Tablet layout (768px+)
   - [ ] Desktop layout (1024px+)

4. **Performance Tests**:
   - [ ] No console errors
   - [ ] Images load efficiently
   - [ ] Animations are smooth

## 📞 Support

If you encounter issues with the logic layer:
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Test with different Pokémon data
4. Contact the backend team for API issues

---

**Remember**: Focus only on CSS/UI styling. The logic layer is complete and robust. Your task is to make it beautiful and user-friendly! 🎨✨