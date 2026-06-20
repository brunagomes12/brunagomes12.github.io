# Resume Redesign — Swiss/Product Direction

**Date:** 2026-06-20
**Status:** approved
**Context:** Single-page resume for Bruna Gomes, Senior Product Manager (6yr, e-commerce/checkout/payments, LatAm). Current design is warm editorial (blush/berry, Fraunces serif) — being redesigned to a cleaner, Swiss/product-tool aesthetic that matches her tech/IT identity.

## Design tokens

### Color palette

| Token | Hex | CSS variable | Usage |
|--------|-----|-------------|-------|
| Background | `#FAFAFA` | `--bg` | Page background — cool off-white, never cream |
| Surface | `#FFFFFF` | `--surface` | Cards, elevated surfaces |
| Ink | `#171717` | `--ink` | Headlines, primary text |
| Ink soft | `#525252` | `--ink-soft` | Body text, descriptions |
| Muted | `#A3A3A3` | `--muted` | Meta info, dates, captions |
| Line | `#E5E5E5` | `--line` | Borders, dividers, horizontal rules |
| Accent | `#0D9488` | `--accent` | Links, action text, decorative elements |
| Accent hover | `#0F766E` | `--accent-hover` | Link hover state |
| Accent soft | `#CCFBF1` | `--accent-soft` | Subtle accent backgrounds (chips, bars) |

### Typography

| Role | Font | Weights | Usage |
|------|------|---------|-------|
| Display | Space Grotesk | 500, 600, 700 | h1, h2, section headlines |
| Body | Inter | 400, 500, 600 | Paragraphs, lists, labels, meta |
| Utility | Inter | 500 | Chips, badges, stat labels |

Both fonts from Google Fonts. Space Grotesk loaded with `wght@500;600;700`. Inter loaded with `wght@400;500;600`.

### Type scale

| Level | Size | Weight | Use |
|-------|------|--------|-----|
| h1 | `clamp(2.6rem, 7vw, 4.5rem)` | 700 | Name |
| h2 | `clamp(1.4rem, 3.5vw, 1.8rem)` | 600 | Section titles |
| h3 | `1rem` | 600 | Card titles |
| body | `0.95rem` | 400 | Body text |
| meta | `0.8rem` | 500 | Dates, locations, captions |
| eyebrow | `0.72rem` | 500 | Section eyebrow labels |

### Spacing & layout

| Token | Value | Use |
|-------|-------|-----|
| `--maxw` | `880px` | Content max-width (tighter than previous 1040px) |
| `--radius` | `10px` | Card/container border-radius |
| Section gap | `clamp(40px, 6vw, 64px)` | Vertical padding per section |
| Grid gap | `16px` | Card grid gap |

### Icons

Lucide via CDN (kept from current site). Sizes: 14px for eyebrow, 16px for buttons, 18px for section indicators.

## Layout structure

```
┌──────────────────────────────────────────────────┐
│  [lang toggle: PT | EN]                         │ position: fixed, top-right
├──────────────────────────────────────────────────┤
│  HERO                                            │
│  ┌──────────────────────────────────────────┐    │
│  │  ◉ indicator (green dot) + "open to work" │   │ only if applicable — user said NO
│  └──────────────────────────────────────────┘    │
│  avatar (80px, circular, border 2px solid line)  │
│  Bruna Gomes                   h1, Space Grotesk  │
│  Senior Product Manager        role, accent color  │
│  · E-commerce, Checkout & Pagamentos              │ muted
│  · LatAm                                         │
│                                                   │
│  ┌──────────────┐┌──────────────┐┌──────────────┐│
│  │ 6 anos       ││ +2 dígitos  ││ BR & CO      ││
│  │ escalando... ││ conversão   ││ operações... ││
│  │ ████████░░ 85%││ █████████░ 92%││ ██████░░ 70%││
│  └──────────────┘└──────────────┘└──────────────┘│
├──────────────────────────────────────────────────┤
│  ◉ Sobre                                         │
│  Produto onde o impacto é financeiro...           │
│  [texto]                                         │
├──────────────────────────────────────────────────┤
│  ◉ Ecossistema Transacional     [funnel]         │
│  Carrinho → Login → Cadastro → Checkout → Pagam.  │
│  5 cards conectados horizontalmente com mini-     │
│  métricas do que ela melhorou em cada etapa        │
├──────────────────────────────────────────────────┤
│  ◉ Decisões de impacto     [decision log]         │
│  3 entradas formato changelog:                     │
│  2024-11-24  Rollback antifraude Black Friday      │
│  2024        Checkout Flutter + PIX               │
│  2023-2024   Correção de falhas criação pedidos    │
│  Cada: data | contexto | decisão | resultado      │
├──────────────────────────────────────────────────┤
│  ◉ Experiência                  [timeline]       │
│  thin line, job: role · company | dates · loc     │
│  bullets                                          │
├──────────────────────────────────────────────────┤
│  ◉ Radar de Competências      [spider chart]     │
│  SVG pentagon: 5 eixos — Estratégia, Execução,    │
│  Growth, Resposta a Incidentes, Modernização      │
│  + chips de skills + certs + formação              │
├──────────────────────────────────────────────────┤
│  Vamos conversar?                                 │
│  avatar (same as hero, 80px) + text + CTA buttons │
│  Light surface bg, no dark box                    │
├──────────────────────────────────────────────────┤
│  footer: "Feito com cuidado · © 2026 Bruna Gomes" │
└──────────────────────────────────────────────────┘
```

## Component specs

### Hero

- **Avatar:** `<img>` with `border-radius: 50%`, 80px × 80px, `border: 2px solid var(--line)`, `object-fit: cover`
- **Name:** h1, Space Grotesk 700, `letter-spacing: -0.02em`, ink color
- **Role:** p, Inter 600, 1.05rem, accent color
- **Context line:** p, Inter 400, 0.9rem, muted color, dot-separated items
- **KPI pills:** horizontal flex row, 3 cards with `background: var(--surface)`, `border: 1px solid var(--line)`, `border-radius: 10px`, `padding: 16px 20px`
  - Big number (Inter 700, 1.3rem, ink) + label (Inter 400, 0.82rem, ink-soft)
  - Micro progress bar: `height: 3px`, `background: var(--line)` as track, inner `div` with `background: var(--accent)` at the given width percentage, `border-radius: 999px`

### Section header

- Container: flex row, align-items center, gap 10px
- **Indicator dot:** 8px circle, `background: var(--accent)`, `border-radius: 50%`
- **Eyebrow label:** Inter 500, `0.72rem`, `text-transform: uppercase`, `letter-spacing: 0.1em`, muted color
- **Title:** h2, Space Grotesk 600, ink color

### Impact cards (grid)

- 2-column grid, 1 column on mobile (<700px)
- Card: `background: var(--surface)`, `border: 1px solid var(--line)`, `border-radius: var(--radius)`, `padding: 24px`
- No left accent border (remove the current `border-left: 3px solid berry`)
- **Tag:** small chip `font-size: 0.7rem`, `text-transform: uppercase`, `letter-spacing: 0.06em`, accent color, bg accent-soft, `border-radius: 999px`, `padding: 3px 10px`
- **Title:** h3, Inter 600, 1.05rem, ink
- **Rows (Challenge/Action/Result):** flex row, gap 8px, `font-size: 0.9rem`
  - Label: `font-weight: 600`, `font-size: 0.72rem`, `text-transform: uppercase`, `letter-spacing: 0.06em`, accent color, min-width `70px`, flex-shrink 0
  - Text: ink-soft
- Result row gets `border-top: 1px solid var(--line)`, `padding-top: 10px`, `margin-top: 10px`

### Experience timeline

- Container: `padding-left: 24px`, `position: relative`
- Vertical line: pseudo-element `::before`, `left: 5px`, `width: 1.5px`, `background: var(--line)`
- Each job: `position: relative`, `padding-bottom: 28px`
- Dot: pseudo-element `::before`, positioned on the line, `width: 10px`, `height: 10px`, `border-radius: 50%`, `background: var(--surface)`, `border: 2px solid var(--accent)`
- Job row: flex, align-items baseline, gap 8px, flex-wrap wrap
  - Company logo: 20px × 20px, `border-radius: 4px`, `object-fit: contain`
  - Role · Company: h3, Inter 600, 1rem
  - Dates: meta, muted
  - Location: meta, muted (preceded by ·)
- Bullets: `margin: 6px 0 0`, `padding-left: 16px`, `font-size: 0.9rem`, `color: var(--ink-soft)`, `line-height: 1.55`

### Skills section

- 2 columns, 1 on mobile (<700px)
- Competencies: chips with `background: var(--accent-soft)`, `color: var(--ink)`, no border, `border-radius: 999px`, `padding: 6px 14px`, `font-size: 0.85rem`
- Certifications: same chips but `background: var(--surface)`, `border: 1px solid var(--line)`
- Education items: `margin-top: 16px`
  - Degree: `font-weight: 600`, 0.95rem
  - Period: meta, 0.82rem

### Conversion Funnel

- **Concept:** Bruna owns the full transactional ecosystem. The funnel shows the journey she manages: Cart → Login → Sign-up → Checkout → Payment.
- **Layout:** Horizontal row, 5 cards connected by chevron/arrow icons. On mobile (<700px), vertical stack with downward arrows.
- **Each card:** `background: var(--surface)`, `border: 1px solid var(--line)`, `border-radius: var(--radius)`, `padding: 16px 20px`, flex 1, min-width 140px
  - Stage name: Inter 600, 0.85rem, ink
  - Mini-metric or note: Inter 400, 0.78rem, accent color. Real content per stage: Carrinho "redução de atrito", Login "SSO & social login", Cadastro "fluxo simplificado", Checkout "conversão +2 dígitos", Pagamento "PIX & múltiplos meios"
- **Connectors:** Lucide `chevron-right` between cards (desktop), `chevron-down` (mobile). Size 16px, muted color.
- **Translation:** Stage names in I18N data. Same visual in both languages.

### Decision Log

- **Concept:** A product changelog — the artifact a PM actually produces. Shows Bruna's thinking process, not just outcomes.
- **Layout:** 3 entries, chronological. Each entry is a horizontal block with date on the left, content on the right.
- **Structure per entry:**
  ```
  ┌──────┬──────────────────────────────────────┐
  │ DATE │ TITLE                                │
  │      │ Contexto: ...                        │
  │      │ Decisão: ...                         │
  │      │ Resultado: ...                       │
  └──────┴──────────────────────────────────────┘
  ```
- **Date column:** 80px wide, mono or tabular-nums Inter 500, 0.82rem, accent color. Format: `2024-11` or `Nov 2024`.
- **Content:** `padding-left: 20px`, `border-left: 1.5px solid var(--line)`
  - Title: Inter 600, 1rem, ink
  - Context/Decision/Result lines: 0.9rem, ink-soft
    - Label (Contexto/Decisão/Resultado): Inter 600, 0.75rem, uppercase, letter-spacing, accent
    - Text follows label inline or next line
- **3 entries:**
  1. `2024-11` — Rollback antifraude na Black Friday
  2. `2024` — Novo checkout Flutter + PIX
  3. `2023-2024` — Correção de falhas na criação de pedidos
- **I18N:** Full translation for both languages.

### Radar Chart

- **Concept:** SVG spider/radar chart showing Bruna's capability breadth across 5 dimensions.
- **5 axes (pentagon):** Estratégia, Execução, Growth, Resposta a Incidentes, Modernização de Legado
- **Implementation:** Single inline `<svg>` element, viewBox "0 0 200 200"
  - Background pentagon grid: 3 concentric pentagons at 33%, 66%, 100% radius (line color, 0.5px stroke)
  - Axis lines from center to each vertex (line color)
  - Labels at each vertex: Inter 500, 6px, muted
  - **Bruna's profile:** A semi-transparent filled pentagon at specific values:
    - Estratégia: 85
    - Execução: 90
    - Growth: 80
    - Resposta a Incidentes: 75
    - Modernização: 70
  - Fill: `var(--accent)` at 15% opacity, stroke: `var(--accent)` at 2px
  - Data points: small circles (3px, accent) at each vertex of the profile polygon
- **Below radar:** Skills chips (2 columns) + certifications + education (compact)
- **Responsive:** SVG scales with container width, min 280px, max 400px. On mobile (<700px), radar above chips.
- **Animation:** Profile polygon draws on scroll-enter (stroke-dasharray/dashoffset, 800ms). Skip if reduced motion.

- No dark box. `background: var(--surface)`, `border: 1px solid var(--line)`, `border-radius: var(--radius)`, `padding: clamp(32px, 5vw, 48px)`, text-align center
- Avatar: same as hero avatar (80px, circular), centered
- Title: h2, Space Grotesk, ink
- Body: p, 0.95rem, ink-soft, max-width 44ch, centered
- CTAs: flex row, justify-content center, gap 10px
  - Primary button: `background: var(--accent)`, `color: #fff`, `border-radius: 999px`, `padding: 11px 22px`, Inter 600, 0.9rem
  - Secondary button: ghost, `background: transparent`, `border: 1px solid var(--line)`, ink color

### Language toggle

- Position: fixed, top 16px, right 16px, z-index 50
- Pill shape: `border-radius: 999px`, `border: 1px solid var(--line)`, `background: var(--surface)`, `padding: 3px`
- Buttons: `border: none`, `background: transparent`, Inter 600, 0.78rem, `padding: 4px 12px`, `border-radius: 999px`
- Active: `background: var(--accent)`, `color: #fff`

### Footer

- `text-align: center`, `padding: 32px 0 40px`, `font-size: 0.8rem`, ink-soft

## Animations & interactions

- **Scroll reveal:** Keep IntersectionObserver pattern from current site. Elements with `.reveal` class get `opacity: 0; transform: translateY(12px)` and transition to `opacity: 1; transform: none` when intersecting. Reduced motion: instant reveal.
- **Hover states:** Cards get subtle `border-color` transition on hover. Links get accent → accent-hover color shift. Buttons get background shift.
- **Progress bars:** Animate on scroll-into-view from 0% to target width (600ms ease-out, slight delay per bar). Only if `prefers-reduced-motion: reduce` is NOT set.

## Responsive behavior

| Breakpoint | Behavior |
|------------|----------|
| Default (>780px) | 2-col impact grid, 2-col skills, max-width 880px |
| ≤780px | Single-column impact grid, single-column skills |
| ≤600px | Hero avatar 64px, KPI pills stack vertically, timeline dots smaller, section padding reduced |
| All | `clamp()` for type sizes throughout — no fixed px at large sizes |

## I18N

- Keep existing PT/EN system: `I18N` object with both languages, `data-k` attributes, `setLang()` with localStorage
- The KPI micro-bars are abstract percentages — same visual in both languages, only labels change
- Section eyebrows, headings, body text, labels all via I18N keys

## What stays from current site

- Single-file HTML + inline CSS + inline JS approach (no build step, no framework)
- Lucide icons via CDN
- IntersectionObserver scroll reveal
- SEO metadata (JSON-LD, OG, Twitter cards, robots.txt, sitemap)
- I18N data structure and `data-k` / `setLang()` pattern
- Company logos in `assets/`
- `assets/bruna.jpg` as the portrait

## Migration notes

- Replace `--berry`, `--blush`, `--berry-dk`, `--ink`, `--ink-soft`, `--line`, `--bg` tokens with new palette
- Swap Fraunces for Space Grotesk in Google Fonts URL and CSS `font-family` declarations
- Remove `.hero-portrait` fixed-width logic; add avatar styling instead
- Remove dark `.contact-box` styles; replace with surface-toned contact
- Remove `border-left: 3px solid berry` from cards
- Remove `.stats` pill styling; add KPI card styling with progress bars
- Timeline: simplify, reduce visual weight
