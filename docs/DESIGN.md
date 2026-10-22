UI DESIGN DIRECTION (this overrides any generic styling choices)

Goal: a light-theme interface that feels like a premium design studio made it. It must not look like a government portal, a SaaS template, or a typical AI-generated page.

The one memorable idea: the Seal
- Every student token is shown as a unique, beautiful geometric seal, generated deterministically from the token (an SVG, mirrored or radial shapes, from 24px up to 160px).
- The same token always makes the identical seal everywhere. A duplicate student shows the same seal in two colleges, so a non-technical judge understands it at a glance without reading anything.
- In the UI, call tokens "stamps" or "seals". Never say "token" or "HMAC" on screen.

The one signature motion: the Sealing moment
- After an upload, the raw ID text dissolves row by row into seals, with the caption "IDs checked, sealed, and forgotten."
- Use motion only here and for direct responses to user actions (open, expand, confirm). No fade-and-slide on every section, no hover animations on every card. Respect reduced-motion.

Color (light only, no gradients, no purple or indigo, no gov blue or tricolour, no cream-and-terracotta)
- Paper #F5F6F8 (page)
- Ink #0F1217 (text and primary buttons)
- Slate #667085 (secondary text)
- Fog #E4E7EC (lines and surfaces)
- Seal crimson #C0153F (only for seals, flags, and the sealing moment)
- Verified jade #12805C (only for verified states)
Never rely on colour alone. Pair every status with an icon and a word.

Type
- Headlines: Bricolage Grotesque, large, tight tracking, set as a deliberate design element.
- Body: Hanken Grotesk, sentence case, lines under 75 characters.
- Hindi: Noto Sans Devanagari.
- No monospace labels, no ALL-CAPS eyebrows, no one-word accent in headlines, no "01 / 02" markers unless the content is truly a sequence.

Layout (Pinterest-grade, tactile, spacious)
- Home is a masonry "board" of live tiles in varied sizes: a large upload tile, the four story tiles, a seal-gallery tile, and a flags tile. No grid of identical cards.
- Vary the surfaces: flat paper with a hairline border, one lifted white tile, one inverted ink tile. Use only two elevation levels, and corner radius that scales with tile size.
- Replace the usual India map with a hex-tile state map, drawn by hand in SVG.
- Navigation is a floating pill dock at the bottom centre with five labelled icons. Use one icon set with a consistent 1.5px stroke. No emoji, no stock illustrations.
- Charts are custom-drawn and minimal: thin lines, direct labels, no gridlines, no default chart-library look.
- Generous whitespace and an 8px spacing scale. Each screen has one primary action and one line saying what it does.

Words
- Plain verbs, sentence case, specific button labels ("Upload admissions", not "Submit").
- Errors say what happened and how to fix it. Empty screens invite action.
- Explain with the sealed-envelope idea, never with technical terms.

Quality floor
- Responsive down to 390px, visible keyboard focus, AA contrast, large touch targets.

Process
- Before coding, post a short design plan (tokens, type scale, ASCII wireframe of the home board) and say what you changed to avoid generic defaults.
- After each screen, take screenshots at 1440px and 390px and critique them against this brief. Remove one decorative element before moving on.
- Implement with Tailwind and CSS variables for the tokens. Use Framer Motion only for the sealing moment.