# UI/UX Brief

## Design Direction

Text Pad should feel like a premium writing desk: calm, warm, tactile, and focused. It should not feel like a generic dashboard. The design should help users write and organize without visual noise.

## Principles

- Writing stays calm.
- Workspace controls stay discoverable.
- Mobile layouts must not hide important controls.
- Motion should guide attention, not entertain.
- Dark mode must preserve contrast.
- Script writing should feel first-class, not like an add-on.

## Visual Personality

- Warm paper surfaces.
- Soft glass panels.
- Rounded controls.
- Editorial typography.
- Copper/amber accents.
- Restrained gradients.
- Subtle shadows and inner highlights.

## Color System

### Core Tokens

- Background: `--tp-bg: #f6efe3`
- Ink: `--tp-ink: #1c2738`
- Muted ink: `--tp-ink-muted: #4b5563`
- Soft ink: `--tp-ink-soft: #6b7280`
- Accent: `--tp-accent: #bc7441`
- Strong accent: `--tp-accent-strong: #955123`
- Border: `--tp-border: rgba(104, 84, 58, 0.16)`
- Strong border: `--tp-border-strong: rgba(104, 84, 58, 0.24)`
- Surface: `--tp-surface: rgba(255, 252, 247, 0.78)`
- Strong surface: `--tp-surface-strong: rgba(255, 255, 255, 0.9)`

### Paper Colors

Notes support warm paper tones such as ivory, rose, sage, sky, and cream. Custom note colors must be valid six-digit hex values.

### Dark Mode

Dark mode uses deep slate surfaces with muted borders and warm amber accent states. Avoid pure black. Preserve editor readability and make active controls clearly visible.

## Typography

### UI Font

`Inter`, `Segoe UI`, `Helvetica Neue`, Arial, sans-serif.

Used for:

- buttons
- chips
- sidebar labels
- settings
- body UI copy

### Display Font

`Playfair Display`, `Times New Roman`, Georgia, serif.

Used for:

- major headings
- empty states
- workspace title moments

### Note Fonts

English:

- Literary: Libre Baskerville
- Editorial: IBM Plex Serif
- Modern: Sora

Telugu:

- Literary: Noto Serif Telugu
- Editorial: Mandali
- Modern: Noto Sans Telugu

Hindi:

- Literary: Noto Serif Devanagari
- Editorial: Tiro Devanagari Hindi
- Modern: Hind

Tamil:

- Literary: Noto Serif Tamil
- Editorial: Hind Madurai
- Modern: Noto Sans Tamil

Malayalam:

- Literary: Noto Serif Malayalam
- Editorial: Manjari
- Modern: Noto Sans Malayalam

Code:

- Studio: JetBrains Mono
- Technical: IBM Plex Mono
- Clean: Source Code Pro

## Components

### Panel

Primary app surface. Rounded, bordered, blurred, warm gradient background, soft shadow.

Use for:

- editor shell
- sidebar
- workspace gate sections
- mobile drawers

### Panel Muted

Secondary surface. Slightly quieter and less prominent.

Use for:

- support cards
- empty states
- settings cards

### Panel Inset

Nested control surface with soft inner highlights.

Use for:

- toolbars
- filters
- note header
- script layout

### Buttons

Types:

- `btn-primary`: primary action, amber/copper gradient.
- `btn-soft`: secondary warm action.
- `btn-ghost`: low-emphasis action.
- `btn-danger`: destructive action.

Buttons should use rounded pills and smooth hover/focus states.

### Icon Buttons

Circular controls for compact actions such as close, rename, pin, delete, menu, dark mode.

### Chips

Small rounded labels for metadata:

- word count
- save status
- language
- pinned
- sort status

### Sidebar Library Item

Cards with:

- title
- preview
- updated date
- pinned state
- dirty dot
- rename, pin, delete actions

Active items show an accent left bar and warm highlighted background.

### Note Editor

Must prioritize reading/writing:

- title first
- optional script layout below title
- paper editor below
- Note Studio available but not dominant
- no distracting animation while typing

### Script Layout

Position:

- below note title

Behavior:

- horizontally scrollable sections
- smaller keys on mobile
- larger browse area on mobile
- visible scroll affordance

### Note Studio

Desktop:

- right-side panel integrated into editor layout.

Mobile:

- rounded floating popup.
- invisible until opened.
- same rounded, bordered visual language as desktop.

### Navbar

Desktop:

- pill navigation with moving gradient indicator.

Mobile:

- menu opens below navbar.
- active/hover item uses moving gradient indicator.
- active text must only be white when gradient is behind it.

### Footer

Footer is compact and anchored. The `Nikhil` link is highlighted as a clickable pill. Hover/focus tooltip should suggest portfolio.

## Motion System

Use shared classes:

- `motion-fade-in`
- `motion-rise-in`
- `motion-scale-in`
- `motion-slide-left-in`
- `motion-soft-pop`
- `motion-stagger`
- `motion-script-reveal`

Motion rules:

- no animation on each keystroke
- use subtle route and panel entrance
- use moving indicators for nav and mode selectors
- use toast slide-in
- respect `prefers-reduced-motion`

## Responsive Behavior

### Desktop

- Two-column workspace: sidebar and editor.
- Sidebar can resize and collapse.
- Note Studio opens as side panel.

### Mobile

- Main editor is primary.
- Sidebar becomes drawer.
- Note Studio becomes floating popup.
- Script layout sits below title.
- Editor font is slightly reduced to fit ruled lines.
- Toasts slide up from bottom.

## Accessibility Requirements

- All icon-only buttons need labels or titles.
- Interactive items need keyboard focus visibility.
- Dark mode contrast must be checked.
- Reduced motion must disable nonessential animations.
- Inputs should support Enter and Escape where appropriate.
- External links must use `target="_blank"` and `rel="noreferrer"`.
