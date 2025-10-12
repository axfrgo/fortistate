# Inspector Help Modal

## Overview
Added a comprehensive help modal to the Fortistate Inspector to guide users through all features and functionality.

## Implementation Details

### UI Components
- **Help Button**: Added to the topbar navbar with `❓ Help` label
- **Modal Overlay**: Semi-transparent backdrop with blur effect
- **Modal Content**: Scrollable container with organized sections

### Modal Sections
1. **Getting Started** - Introduction to the inspector and ontogenetic laws
2. **Auto-Configuration** - Explains automatic token and store detection
3. **Working with Stores** - How to interact with store cards and filtering
4. **Ontogenetic Laws** - Detailed guide on law validation, presets, and enforcement
5. **Presets & Configuration** - Using the presets panel
6. **Timeline** - Understanding state change history
7. **Telemetry** - Monitoring law enforcement metrics
8. **Pro Tips** - Best practices and advanced usage patterns
9. **Learn More** - Links to additional documentation

### Law Presets Explained
The help modal documents all five law presets:
- `strict` - Maximum validation with all laws enforced
- `production` - Production-safe rules without debugging
- `development` - Balanced rules for active development
- `minimal` - Essential laws only for prototyping
- `none` - Disable all law enforcement

### User Experience
- **Easy Access**: Help button in the main navbar
- **Beautiful Design**: Matches inspector's purple gradient theme with glassmorphism
- **Multiple Close Options**:
  - Close button (×) in header
  - Click outside modal to dismiss
  - Escape key support (via standard browser behavior)
- **Animations**: Smooth fade-in and slide-up transitions

### CSS Features
- Glassmorphism with backdrop blur
- Purple accent gradient matching overall theme
- Responsive max-width (800px) with mobile padding
- Scrollable content with max-height (90vh)
- Syntax highlighting for code snippets with purple background
- Help sections with subtle borders and backgrounds for organization

## Usage
Users can click the "❓ Help" button at any time to:
1. Learn about inspector features
2. Understand how laws and presets work
3. Get quick tips for efficient workflow
4. Find additional documentation resources

## Technical Notes
- Modal uses flexbox for centering
- Z-index: 9999 ensures it appears above all content
- Event listeners handle open/close behavior
- No external dependencies - pure vanilla JavaScript
- Fully integrated with existing inspector color scheme and design system
