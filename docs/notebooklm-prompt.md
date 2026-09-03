# NotebookLM prompt — Delivaroo slide deck

**How to use:** create a notebook, upload `docs/PROJECT-BRIEF.md` (and optionally
`README.md`, `BACKENDPRD.md`, `docs/api-contract.md`) as sources, then paste the prompt
below into the chat / "Create → Slide deck" custom-instruction box.

---

## THE PROMPT

Create a premium, modern, presentation-ready slide deck about **Delivaroo**, the full-stack
multi-modal parcel delivery platform described in my sources. This is a capstone software
engineering project presentation for a technical audience of instructors and peers. Target
length: 18–22 slides, roughly a 15-minute talk.

**Design direction — make it look expensive, not templated:**
- Dark, high-contrast editorial aesthetic. Deep charcoal or near-black background
  (#0E0F12), off-white text (#F5F5F3), and a single confident accent — warm amber/orange
  (#FF7A1A) for emphasis, data highlights and section markers. Use one cool secondary
  (#4DA3FF) only for contrast in diagrams.
- Generous whitespace. Big type hierarchy: 44–56pt slide titles, 18–22pt body, never more
  than ~35 words of body text on a slide.
- One idea per slide. Prefer a headline that states the *claim*, not the topic —
  "Pricing is computed server-side, always" beats "Pricing".
- Use large numeric callouts for statistics (a single figure at 90pt+ with a short caption).
- Include simple, clean diagrams rendered as boxes-and-arrows: the system architecture, the
  parcel status state machine, and the customer journey flow. Flat, thin strokes, no
  drop shadows, no clip art, no stock photography of delivery vans.
- Consistent footer with slide number and the project name in small caps.
- No bullet walls. Where a list is unavoidable, use at most 4 items with a bolded lead-in
  phrase per item.

**Deck structure — follow this order:**

1. **Title** — "Delivaroo" + the one-line description, team names, date.
2. **The problem** — fragmented, opaque parcel delivery; no visibility for senders, no audit
   trail or capacity view for operators.
3. **The solution** — one platform, two faces: customer app and operations portal.
4. **The customer journey** — the WHERE → WHAT → HOW → PRICE → TRACK → DELIVERED flow as a
   horizontal diagram.
5. **System architecture** — the React/Redux SPA ↔ Flask REST API ↔ PostgreSQL diagram with
   external services (Google Geocoding, Google Routes, SMTP) shown at the edge.
6. **Tech stack** — grouped by layer, as a clean table or a column-per-layer grid.
7. **Data model** — the 13 tables and how the core four (User → Parcel → StatusHistory →
   WeightCategory) relate. Keep the ERD simple.
8. **The pricing engine** — the formula, and why price is server-computed and client-supplied
   prices are discarded.
9. **Multi-modal transport** — the five modes and their tariff table; emphasise that
   ineligible modes are shown with a stated reason rather than hidden.
10. **Pricing nuance** — line-haul banding, volumetric weight, priority as a multiplier,
    declared vs. verified weight with under-declaration flagging.
11. **The status state machine** — the transition diagram, with DELIVERED and CANCELLED as
    terminal states, and the point that the illegal transition is *impossible*, not
    merely unhandled.
12. **Live tracking** — derived seven-stage journey, moving map marker, clock-driven ETA.
13. **Security model** — the strongest 5: bcrypt, hashed opaque refresh tokens, 404-not-403
    on cross-user reads, non-enumerating password reset, server-authoritative pricing.
14. **The admin portal** — the nine sections as a grid, plus the permission model
    (Customer / Dispatcher / Administrator) and the one-table-drives-nav-and-guard point.
15. **Notifications** — one logical event fanning out to IN_APP / EMAIL / SMS deliveries,
    with idempotency keys and user preferences.
16. **API surface** — the endpoint families and the consistent response envelope.
17. **Testing** — ~499 automated tests, real PostgreSQL in CI, authorization tested as a
    first-class concern. Make the numbers large.
18. **CI/CD & deployment** — the GitHub Actions pipeline and the Vercel + Render topology.
19. **Engineering process** — three-tier Git flow, 391 commits, 47 feature branches,
    5 contributors, documentation-first with a PRD written before code.
20. **Decisions worth defending** — pick the 4 sharpest from the sources and state each as
    a claim plus a one-line justification.
21. **Limitations & roadmap** — be honest: no WebSockets, SMS scaffolded but disabled, no
    payments yet. Then: M-Pesa, WebSocket tracking, courier mobile app with real GPS,
    automated dispatch.
22. **Closing numbers** — the metrics grid: 13 models, ~40 endpoints, 5 transport modes,
    9 portal sections, ~499 tests, 391 commits, ~28,700 lines.

**Tone and rules:**
- Confident and specific. Every claim must be traceable to my sources — do not invent
  metrics, features, dates, or names.
- Write speaker notes under every slide: 3–5 sentences of what the presenter should actually
  say, in plain spoken English, including the transition into the next slide.
- Prefer concrete engineering detail over marketing language. "Refresh tokens are stored only
  as SHA-256 hashes" is the kind of sentence I want; "enterprise-grade security" is not.
- Use British/Kenyan conventions: KES for currency, metric units.
- Where the sources note a limitation, keep it. A deck that admits its gaps is more credible
  than one that does not.
