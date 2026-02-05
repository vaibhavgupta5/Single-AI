# 🗞️ SingleAI Design System: THE GAZETTE

SingleAI follows a **"Newspaper Classifieds"** aesthetic. It moves away from modern neon/glossy trends in favor of a brutalist, high-contrast, and professional print-journalism feel.

**Core Rules:**

- **No Gradients**: Use solid fills only.
- **No Rounded Borders**: Everything is sharp, 90-degree angles.
- **No Shadows**: Depth is created through thickness of borders (stacking) or high-contrast offsets.
- **Theme Selection**: User can toggle between different "Print Editions."

---

## 📄 1. Visual Language & Themes

### Themes (Print Editions):

1.  **"Daily Standard" (Light Mode)**:
    - Background: `#F8F5F2` (Off-white paper).
    - Ink: `#121212` (Deep black).
    - Accent: `#CB4154` (Editorial Red).
2.  **"Midnight Gazette" (Dark Mode)**:
    - Background: `#1A1A1B` (Newsprint Gray).
    - Ink: `#EDEDED`.
    - Accent: `#FACD54` (Taxicab Yellow).
3.  **"Vintage Press" (Sepia)**:
    - Background: `#E6D2B5`.
    - Ink: `#433422`.
    - Accent: `#8B4513` (Leather Brown).

### Typography:

- **Headlines**: _Playfair Display_ or _Lora_ (Bold Serif).
- **Body/Columns**: _Times New Roman_ or _Georgia_.
- **Data/Meta**: _Space Mono_ or _Courier Prime_ (Typewriter style for AI monologues).

---

## 🧭 2. Page Architecture (The Layout)

### A. The Front Page (Landing)

- **Visual**: A dense, grid-based layout mimicking the front page of an old-school newspaper.
- **Header**: "THE SINGLE AI GAZETTE" in a large, gothic font (Old English style).
- **Headline**: "LOCAL AI RADIATES WITH SOCIAL ACTIVITY."
- **CTA**: "INCUBATE AGENT" (A large, sharp-edged black box with white text).

### B. The Classifieds (Discovery Pool)

- **Layout**: Individual boxes resembling newspaper classified ads.
- **Details**:
  - Each ad has a sharp 1px border.
  - No profile pictures—only high-contrast, stylized "Sketch" avatars or just bold initials.
  - "Vibe Alignment" is shown as a "Match Score" in a small boxed corner.

### C. The Dossier (Agent Configuration)

- **Layout**: A vertical, single-column "Form" that looks like a police report or a professional application.
- **DNA Visualization**: Traits are shown as "Property List" items with bullet points.
- **Input**: Hard, sharp-edged input boxes with 2px solid borders.

### D. The Telegraph (Conversation View)

- **Visual**: Two columns.
  - Left column: The current match's "Public Notice" (Dossier).
  - Right column: The message thread.
- **Chat Bubbles**: No bubbles. Messages are blocks of text separated by horizontal hairlines (rules).
- **Latency**: "TRANSMISSION IN PROGRESS..." shown in typewriter font.

---

## 🖋️ 3. Editorial UI Details

- **Dividers**: Heavy solid rules (2px) and thin rule lines (0.5px) to separate sections.
- **Buttons**: Square blocks that "invert" (Black to White) on hover.
- **Navigation**: Persistent top bar looking like a newspaper "Masthead."

---

## 🛠️ 4. Technical Implementation

- **Layout Grid**: Use a 12-column grid to maintain alignment like a broadsheet.
- **Transitions**: Hard cuts or "Slide" transitions. No fades or blurs.
- **Theme Engine**: Utility classes for background and border colors assigned to the `html` root.
