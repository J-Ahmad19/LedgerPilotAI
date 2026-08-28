# LedgerPilot Design System

Based on the "Charm" theme guidelines, this document outlines the core design principles and tokens for LedgerPilot.

## Color Palette

LedgerPilot uses warm neutral surfaces with coral reserved for actions, links, focus, and intentional feature accents. Status colors are reserved for real success, danger, and warning states rather than decorative use.

| Token | Value | Purpose |
| :--- | :--- | :--- |
| **Section Surface** | `#F7F7F5` | Warm, matte content canvas |
| **Panel** | `#FBFAF9` | Cards and raised content surfaces |
| **Accent Band** | `#F1F2EA` | Hero and footer backgrounds |
| **Brand** | `#E4544B` | Primary actions and brand emphasis (Coral) |
| **Brand Text** | `#C9443A` | Accessible links and text accents |
| **Heading** | `#1C1917` | High-emphasis warm stone ink |
| **Body** | `#57534E` | Primary reading text |
| **Muted Body** | `#79716B` | Supporting copy and metadata |
| **Border** | `#E7E6E5` | Subtle component boundaries |

## Typography

The hierarchy ranges from compact product UI to 72px marketing display headings. Controls remain concise and readable, while long-form page copy keeps a comfortable reading size and line height.

- **Body/UI:** `Inter` (used for body text, navigation, controls, and button labels)
- **Headings:** `Circular` (Display slot), with `DM Sans` as fallback (bold with tight tracking)
- **Monospace:** `Fragment Mono` (used for uppercase labels, eyebrows, ticker text, and code-oriented details)

## Shape and Spacing

Spacing follows a 4px token scale. Content sits in centered containers up to 1280px wide with aligned side padding, generous section rhythm, and tighter spacing inside related control groups.

- **Pill-shaped (Fully rounded):** Buttons, inputs, and alerts
- **24px Corners:** Cards, widgets, modals, tables, and drawers
- **12px Corners:** Menus
- **4px Corners:** Checkboxes

## Surface and Depth

Charm separates surfaces with warm tone changes, hairline borders, and spacing instead of heavy shadows.

- **Buttons & Inputs:** Subtle control lift
- **Menus & Popovers:** Medium floating shadow
- **Brand Elements:** Optional coral glow (reserved for genuinely emphasized elements)

## Component Language

- **Primary Actions:** Coral gradient (`#E4544B`) with a white label, a restrained layered shadow, and accessible hover/focus states.
- **Cards:** Light (`#FBFAF9`) and quietly bordered (`#E7E6E5`).
- **Hero Sections:** May use one subtle line-pattern treatment behind its content, while the rest of the interface remains flat and untextured.
