# Design Guidelines - Gyllencreutz Family Heritage Website

## Overall Design Theme

The Gyllencreutz Family Heritage Website embodies **authentic 1500-1700s Swedish nobility aesthetics** with a focus on historical reverence and understated elegance. The design philosophy emphasizes:

- **Historical Authenticity**: Visual elements that honor the family's noble heritage without ostentation
- **Respectful Presentation**: Content takes precedence over decorative elements
- **Timeless Elegance**: Subtle sophistication that reflects the dignity of Swedish aristocracy
- **Accessibility**: Modern usability standards while maintaining period-appropriate atmosphere

The overall tone is scholarly, respectful, and dignified—appropriate for documenting one of Sweden's oldest noble families (Adliga ätten nr 54).

---

## Typography

### Primary Fonts
- **Headings**: Playfair Display (serif) - elegant, classical serif for titles and important text
- **Body Text**: Inter (sans-serif) - clean, readable for extended reading
- **Decorative**: Cinzel (serif) - used sparingly for ceremonial elements and heraldic text

### Typography Hierarchy
- **H1**: Large Playfair Display, used for page titles and main sections
- **H2**: Medium Playfair Display, for section headers
- **H3**: Small Playfair Display or large Inter, for subsections
- **Body**: Inter regular, optimized for readability
- **Captions**: Inter small, for image descriptions and metadata

### Typography Rules
- Maintain generous line spacing (1.6-1.8) for comfortable reading
- Use appropriate font weights (400-600) to avoid overwhelming the content
- Ensure sufficient contrast ratios for accessibility compliance

---

## Color Palette

### Primary Colors (Historically-Inspired Swedish Nobility)
- **Deep Forest**: `hsl(140, 20%, 25%)` - Primary dark tone, evokes Swedish forests
- **Antique Brass**: `hsl(45, 30%, 45%)` - Accent color, suggests aged metal and heraldry
- **Warm Stone**: `hsl(25, 15%, 85%)` - Light background, reminiscent of castle stonework
- **Parchment**: `hsl(45, 25%, 95%)` - Background color, evokes historical documents

### Secondary Colors
- **Charcoal**: `hsl(0, 0%, 20%)` - Primary text color
- **Slate**: `hsl(210, 10%, 50%)` - Secondary text and borders
- **Pearl**: `hsl(0, 0%, 98%)` - Pure background for content areas

### Color Usage Principles
- **Subtle Application**: Colors support content rather than dominating it
- **Historical Accuracy**: Palette reflects authentic period materials and pigments
- **Accessibility**: Maintain WCAG AA contrast ratios across all color combinations
- **Consistency**: Use defined color tokens throughout the application

---

## Component Styling

### Visual Elements
- **Border Radius**: Subtle rounded corners (4-8px) for modern usability without breaking period feel
- **Shadows**: Soft, minimal shadows (`box-shadow: 0 2px 8px rgba(0,0,0,0.1)`) for depth
- **Borders**: Thin, elegant borders in slate color for content separation
- **Spacing**: Generous whitespace using 8px grid system (8, 16, 24, 32, 48px)

### Interactive Elements
- **Buttons**: Minimal styling with subtle hover states, avoid modern gradients
- **Links**: Underlined in content, colored in navigation, with smooth transitions
- **Form Elements**: Clean, simple styling that doesn't distract from content
- **Cards**: Subtle elevation with soft shadows, maintaining content focus

### Content Presentation
- **Images**: Soft drop shadows and subtle frames to enhance historical photographs
- **Text Blocks**: Generous padding and line height for comfortable reading
- **Lists**: Clean, well-spaced with appropriate indentation

### Generation Timeline Styling
- **Timeline Cards**: Gradient backgrounds from parchment to white with rounded corners (12px)
- **Interactive States**: Hover effects with scale transforms (105%) and enhanced shadows
- **Selected States**: Antique brass borders with ring effects and gradient highlights
- **Typography Mix**: Playfair Display for generation numbers, Inter for statistics, monospace for dates
- **Visual Hierarchy**: Color-coded dots, enhanced crown icons with sparkles for multiple succession sons
- **Background Elements**: Subtle gradient timeline connecting all cards with warm stone to antique brass
- **Responsive Design**: Cards maintain consistent visual appeal across all screen sizes (2-8 columns)
- **Tables**: Minimal styling with alternating row colors for readability

---

## Layout Conventions

### Grid System
- **Desktop**: 12-column grid with appropriate gutters
- **Tablet**: 8-column grid with responsive breakpoints
- **Mobile**: Single column with appropriate margins
- **Container**: Maximum width of 1200px with centered alignment

### Responsive Design
- **Mobile-First**: Design for smaller screens first, then enhance for larger displays
- **Breakpoints**: 
  - Small: 640px
  - Medium: 768px
  - Large: 1024px
  - Extra Large: 1280px
- **Flexible Images**: All images scale appropriately across devices
- **Touch Targets**: Minimum 44px touch targets for mobile usability

### Navigation
- **Header**: Fixed or sticky navigation with family name/crest
- **Menu**: Clean, horizontal navigation on desktop, collapsible on mobile
- **Breadcrumbs**: For deep content hierarchy navigation
- **Footer**: Minimal footer with essential links and family information

---

## UI Behavior

### Hover States
- **Subtle Transitions**: 200-300ms ease-in-out for smooth interactions
- **Color Changes**: Slight darkening or lightening of elements
- **Text Links**: Gentle color transition, maintain underlines
- **Images**: Slight opacity or scale changes for gallery interactions

### Animations
- **Page Transitions**: Smooth, minimal transitions between sections
- **Content Loading**: Elegant loading states that don't interrupt reading flow
- **Interactive Elements**: Gentle feedback for clicks and taps
- **Family Tree**: Smooth zoom and pan interactions for genealogical visualization

### Interactive Features
- **Search**: Real-time search with smooth result appearance
- **Language Toggle**: Seamless switching between Swedish and English
- **Family Tree Navigation**: 
  - Dual view modes: Detail View (collapsible list) and Tree View (interactive D3.js)
  - Zoom, pan, and selection interactions in Tree View
  - Authentic family coat of arms for succession son indicators
- **Image Gallery**: Elegant lightbox or modal presentations for portraits
- **Tree Controls**: Zoom in/out, reset view, and fit-to-screen functionality

### Accessibility Behaviors
- **Keyboard Navigation**: Full keyboard accessibility for all interactive elements
- **Focus Indicators**: Clear, visible focus states that respect the design aesthetic
- **Screen Readers**: Proper ARIA labels and semantic HTML structure
- **Reduced Motion**: Respect user preferences for reduced motion

---

## Content Guidelines

### Image Treatment
- **Historical Portraits**: Maintain authentic aspect ratios with subtle framing
- **Family Coat of Arms**: Use authentic heraldic image for succession son indicators with amber/gold styling
- **Royal Portraits**: High-quality circular masking with royal blue borders for monarch timeline
- **Family Crests**: Display with appropriate reverence and sizing
- **Document Scans**: Present clearly with zoom capabilities when needed
- **Modern Photos**: Style consistently with historical content

### Text Presentation
- **Historical Names**: Use appropriate formatting and diacritical marks
- **Dates**: Consistent formatting across Swedish and English versions
- **Genealogical Information**: Clear hierarchy and relationship indicators
- **Bilingual Content**: Seamless language switching without layout disruption

### Visual Hierarchy
- **Content Priority**: Family information takes precedence over decorative elements
- **Readability**: Ensure all text is easily readable across devices
- **Scanning**: Support both detailed reading and quick information scanning
- **Cultural Sensitivity**: Present noble heritage with appropriate dignity and respect

---