# NotebookLM prompt — Delivaroo slide deck

**How to use**

1. Create a notebook → **Add source** → upload `docs/PROJECT-BRIEF.md`.
   Optionally also add `README.md`, `BACKENDPRD.md`, `docs/api-contract.md`, `docs/deployment.md`.
2. Paste everything under **THE PROMPT** below into the chat box (or into
   **Create → Slide deck → custom instructions**).
3. The prompt specifies each slide's exact content, so NotebookLM has no room to
   invent. Every figure in it is verified against the codebase.

---

# THE PROMPT

Create a premium, modern, presentation-ready slide deck about **Delivaroo**, a full-stack
multi-modal parcel delivery platform. Audience: software engineering instructors and peers
at a capstone review. 22 slides, ~15 minutes.

Follow the per-slide specification below **exactly** — the headline, the on-slide content,
the visual treatment and the speaker notes are all given. Do not add slides, drop slides,
reorder them, or substitute your own figures. Every number below is verified; if something
is not stated here or in my sources, leave it out rather than inventing it.

---

## GLOBAL DESIGN DIRECTION

**Palette** — dark editorial. Background `#0E0F12`. Primary text `#F5F5F3`. Secondary text
`#9A9AA0`. One accent, warm amber `#FF7A1A`, for emphasis, figures and section markers. One
cool secondary, `#4DA3FF`, used *only* inside diagrams for contrast. Never more than these five.

**Type** — a geometric or neo-grotesque sans (Inter, Söhne, Neue Haas Grotesk or similar).
Slide titles 44–56pt, tight leading, sentence case. Body 18–22pt. Big numeric callouts
90–140pt in accent amber. Captions 14pt in secondary grey, small caps.

**Layout** — generous margins (at least 8% of slide width). One idea per slide. Never more
than ~35 words of body text. Never more than 4 list items, each with a **bolded lead-in
phrase** followed by one clause. No bullet walls, no three-column text dumps.

**Headlines state a claim, not a topic.** "Pricing is computed server-side, always" — not
"Pricing". "The illegal transition is impossible, not unhandled" — not "State machine".

**Diagrams** — flat boxes and thin arrows, 1.5px strokes, right-angled or gently curved
connectors. No drop shadows, no gradients, no 3D, no isometric. No clip art, no stock
photography of delivery vans or smiling couriers, no generic "technology" imagery.

**Furniture** — consistent footer: slide number right, `DELIVAROO` in small caps left,
hairline rule above at 20% opacity.

**Speaker notes** — every slide gets 4–6 sentences of what the presenter actually says, in
plain spoken English, ending with the transition into the next slide. I have drafted these
below; expand them into natural speech, keep the substance and the figures exact.

---

## SLIDE-BY-SLIDE SPECIFICATION

### Slide 1 — Title

**On slide:** "Delivaroo" as the wordmark, very large. Beneath it: *"Book a pickup. The
platform prices it across five transport modes, dispatches it, and tracks it to the door."*
Then a thin rule, then: Bruce Mwendwa · Chariey · Dazed31 · Clyde Openda · Natasha Bhoke.
Then: Capstone Project · Moringa School · September 2026.

**Visual:** Near-black. The wordmark in off-white with the two "o"s in amber. Everything
left-aligned on a 12-column grid, occupying the left two-thirds. Right third empty.

**Speaker notes:** Open by naming the thing plainly — Delivaroo is a parcel delivery
platform, built as a full-stack capstone. Say the team is five people and the work ran two
weeks. Set the frame: this is a working system, not a prototype, and the talk will show the
engineering decisions behind it rather than a feature tour. Transition: "Start with why it
needed building."

---

### Slide 2 — The problem

**Headline:** "Parcel delivery here runs on WhatsApp and guesswork."

**On slide — two columns, no bullets, just two short paragraphs under bold labels:**
- **For the sender.** No price until a rider quotes one. No visibility once the parcel
  leaves. No record of who handled it.
- **For the operator.** Dispatch coordinated in group chats and spreadsheets. No audit
  trail, no capacity view, no single source of truth for what anything costs.

**Visual:** Two columns split 50/50 with a hairline between. Label in amber, body in
off-white. Bottom third empty.

**Speaker notes:** Ground this in something the room recognises — sending a parcel across
Nairobi today means calling someone, being quoted a number you cannot check, and then
phoning to ask where it is. Point out that the operator's side is just as bad: no record of
who moved what, so a dispute has no evidence. Say the two problems are the same problem —
there is no system of record. Transition: "So we built one."

---

### Slide 3 — The solution

**Headline:** "One system of record, two faces."

**On slide:**
- **Customer app.** Say where a parcel is going and what it is. The platform computes the
  real driving route, prices every eligible transport mode against it, assigns an agent, and
  streams live tracking.
- **Operations portal.** Nine gated sections: dispatch board, courier roster, transport
  capacity, accounts, reports, notification outbox, audit trail, settings.

**Visual:** Two large rounded rectangles side by side, thin amber stroke, dark fill. Each
holds an icon (a phone outline, a console outline) drawn in the same thin-line style, a
bolded label, and the paragraph. A single vertical connector between them labelled "one
database, one price, one status".

**Speaker notes:** Emphasise the phrase "one system of record" — the customer and the
dispatcher are looking at the same row in the same table, which is what makes the price and
the status agree. Say the customer side is deliberately narrow: four decisions and a map.
The operations side is broad because operations is broad. Transition: "Walk the customer
path first."

---

### Slide 4 — The customer journey

**Headline:** "Four decisions, then a map that moves."

**On slide — one horizontal flow, seven nodes:**
`WHERE → WHAT → HOW → PRICE → REQUEST PICKUP → AGENT ASSIGNED → TRACK LIVE → DELIVERED`

**Beneath it, four short annotations tied to the first four nodes:**
- **WHERE** — type-ahead place search, "use my location", or tap the map.
- **WHAT** — weight, parcel type, optional dimensions.
- **HOW** — every eligible mode priced live against *this* route and *this* parcel.
- **PRICE** — an estimate until an admin weighs it, and labelled as one.

**Visual:** The flow as connected pills across the full slide width, the first four in amber
stroke and the last three in grey stroke, arrows between. Annotations hang below the first
four on thin leader lines.

**Speaker notes:** Walk the flow left to right in one breath, then slow down on the fourth
node. Make the point that the price shown is honest about its own uncertainty — it says
"estimated" until someone has put the parcel on a scale. Mention that the route drawn is the
actual driving route from the Google Routes API, not a straight line between two pins.
Transition: "Here is what sits behind that."

---

### Slide 5 — System architecture

**Headline:** "A React SPA, a Flask REST API, and one Postgres database."

**On slide — a three-tier diagram:**
- **Left box:** React 18 + Vite SPA · Redux Toolkit, 6 slices · React Router 6 · Leaflet ·
  deployed on Vercel
- **Middle box:** Flask 3 REST API · Flask-RESTful resources · 15 service modules ·
  SQLAlchemy 2 ORM · Gunicorn on Render
- **Right box:** PostgreSQL 16 · 13 models · 16 Alembic migrations
- **Arrows:** left→middle labelled `HTTPS · JWT bearer`, middle→left labelled `JSON`,
  middle↔right labelled `SQLAlchemy`
- **Below, detached:** External services — Google Geocoding API · Google Routes API · SMTP

**Visual:** Three boxes left to right, thin amber strokes, external services in a dashed
`#4DA3FF` box hanging below the middle tier. Keep it flat.

**Speaker notes:** Name each tier and what it owns. The important detail is the middle box:
the API is layered internally — resources handle HTTP and validation, services hold the
business rules, models handle persistence — so no business logic lives in a route handler.
Say the external calls are all server-side except the map tiles, which matters for the API
key. Transition: "The stack in one table."

---

### Slide 6 — Tech stack

**Headline:** "Chosen for boring reliability."

**On slide — a table, one row per layer:**

| Layer | Choice |
|---|---|
| Frontend | React 18.3 · Vite 5 · React Router 6.30 |
| State | Redux Toolkit 2.2 — `ui`, `auth`, `booking`, `orders`, `fleet`, `admin` |
| Maps | Leaflet 1.9 client-side · Google Geocoding + Routes server-side |
| Backend | Python 3.12 · Flask 3.1.3 · Flask-RESTful |
| Data | SQLAlchemy 2.0 · Flask-Migrate / Alembic · PostgreSQL 16 |
| Auth | Flask-JWT-Extended 4.7 · bcrypt 5.0 |
| Testing | pytest 9.1 + pytest-cov · Jest 29 + React Testing Library 16 |
| CI/CD | GitHub Actions · Vercel · Render + Gunicorn 23 |

**Visual:** Two-column table, no vertical rules, hairline horizontal rules at 15% opacity.
Layer names in amber small caps, choices in off-white.

**Speaker notes:** Do not read the table. Pick three things and justify them: Redux Toolkit
because the admin portal and the customer tracking screen need to react to the same state
change; PostgreSQL because UUID keys, numeric money columns and JSON metadata are all
first-class; and Flask-RESTful because the resource class maps cleanly onto the layering.
Transition: "The data model is where the design actually lives."

---

### Slide 7 — Data model

**Headline:** "Thirteen tables, one of which matters most."

**On slide — a simplified ERD with the four core entities and their relations:**
`User —1:N→ Parcel`, `WeightCategory —1:N→ Parcel`, `Parcel —1:N→ StatusHistory`,
`DeliveryAgent —1:N→ Parcel`

**Beside it, the remaining nine listed compactly in grey:** Profile · Address ·
RefreshToken · PasswordResetToken · Notification · NotificationDelivery ·
NotificationPreference · AuditLog

**One line beneath, in amber:** "Every primary key is a UUID — resources are not
enumerable by construction."

**Visual:** ERD on the left two-thirds as labelled boxes with crow's-foot connectors, thin
strokes. The nine supporting tables as a plain grey list on the right third. Parcel's box
highlighted with an amber fill at 10%.

**Speaker notes:** Say Parcel is the centre of the system and everything else is either
about who owns it, what it costs, or what happened to it. Call out StatusHistory as
append-only — it is never updated or deleted, so the delivery's history is evidence. Explain
the UUID choice in one sentence: sequential integer IDs let anyone walk the table by adding
one. Transition: "Pricing is the first place we had to be strict."

---

### Slide 8 — The pricing engine

**Headline:** "Pricing is computed server-side, always."

**On slide — the formula, large and centred:**
`price = base_price + (price_per_km × measured_route_distance)`

**Beneath it, three short points:**
- **The client cannot set a fare.** The API explicitly discards any client-supplied `price`,
  `distance` or `duration` when coordinates are present.
- **Distance is the driving route,** from the Google Routes API — not straight-line.
- **A haversine fallback** covers provider failure, so a quote still returns.

**Visual:** The formula in mono at 40pt, amber for the operators, off-white for the terms,
centred with a lot of air. The three points below in a single column, left-aligned.

**Speaker notes:** This is the slide to be emphatic on. Say that if the browser could name
its own price, the system would have no integrity — so the API recomputes from the weight
category and the measured distance and throws away whatever the client sent. Mention that
this is enforced and covered by tests, not just documented. Transition: "The tariff itself
varies by how the parcel travels."

---

### Slide 9 — Multi-modal transport

**Headline:** "Five ways to move a parcel, priced against the same route."

**On slide — the tariff table:**

| Mode | Base | Per km | Per kg | Floor | Eligible when |
|---|---|---|---|---|---|
| Road | — | 40 → 6 | 50 | 200 | ≤ 1,500 km · ≤ 2,000 kg |
| Motorbike | 60 | 28 | 22 | 150 | ≤ 45 km · ≤ 20 kg · ≤ 70 cm |
| Air | 1,500 | 11 | 240 | 2,000 | ≥ 120 km · ≤ 250 kg |
| Ship | 900 | 4.5 | 28 | 1,400 | ≥ 200 km · an end ≤ 90 km from a port |
| Drone | 350 | 60 | 110 | 700 | ≤ 30 km · ≤ 5 kg · ≤ 45 cm |

**One line beneath, in amber:** "An ineligible mode is shown, disabled, **with its reason** —
'Sea freight starts at 200 km'. A greyed-out card with no explanation is a dead end."

**Visual:** Table with amber column headers, hairline rules, figures right-aligned. All
currency KES. Small thin-line vehicle glyphs at the left of each row.

**Speaker notes:** Explain that the eligibility rules are data, not `if` statements
scattered through components — they live in one pure module that the UI queries. The rule
worth defending is the last line: the app never silently hides an option, because a customer
who cannot see why a choice is unavailable assumes the app is broken. Transition: "Three
refinements make these numbers behave sensibly at the edges."

---

### Slide 10 — Pricing nuance

**Headline:** "Four refinements that stop the tariff being naive."

**On slide:**
- **Line-haul banding.** 40/km is a cross-town courier rate and absurd over 400 km, so
  distance past the first 50 km is charged at 6/km.
- **Volumetric weight.** L×W×H ÷ 5000 — a big light parcel is charged on the space it
  occupies, and dimensions are also what disqualify a drone.
- **Priority as a multiplier.** Express is ×1.45 price and ×0.72 time applied to whichever
  vehicle was chosen — not a separate tariff of its own.
- **Declared vs. verified weight.** The typed weight buys an estimate. The billable weight
  is what the admin put on the scale; under-declaration beyond 0.5 kg or 20% is flagged.

**Visual:** Four rows, each a bolded amber lead-in and one clause. A small thin-line icon per
row (a road curving away, a box outline, a chevron, a scale). No boxes around them.

**Speaker notes:** Take the last one slowly — it is the one that shows commercial thinking.
Nothing stops a customer typing 2 kg for a 9 kg parcel, so the declared weight only ever
buys an estimate, and every customer-facing figure is labelled as one until it is weighed.
The tolerance is deliberately generous because scales and honest mistakes both exist.
Transition: "Status is the other place we refused to be loose."

---

### Slide 11 — The status state machine

**Headline:** "The illegal transition is impossible, not unhandled."

**On slide — the state diagram:**
`PENDING → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED`
with `CANCELLED` reachable from each of the first four.

**Three points beneath:**
- **DELIVERED and CANCELLED are terminal** — both have empty outgoing transition sets.
- **One explicit map,** `VALID_TRANSITIONS`, in `status_history_service.py` — not scattered
  conditionals.
- **Every transition writes a StatusHistory row** with who, when, where and any notes.

**Visual:** Five nodes in a horizontal chain, amber arrows. `CANCELLED` sits below in a
`#4DA3FF` node, with four thin arrows dropping into it. Terminal nodes drawn with a double
stroke.

**Speaker notes:** Make the distinction the headline makes: it is not that the code checks
for a bad transition and rejects it in a dozen places — it is that there is exactly one
table saying what may follow what, and a move that is not in the table cannot be made
anywhere. Say cancellation is a *soft* cancel: the row is kept with status CANCELLED,
because destroying operational history is how disputes become unwinnable. Add that
cancelling twice returns 200, not an error — retries are safe. Transition: "The customer
never sees these words."

---

### Slide 12 — Live tracking

**Headline:** "One vocabulary for the API, another for the human — derived, not duplicated."

**On slide:**
- **Seven stages, derived.** `journeyStages()` turns the API status plus journey progress
  into requested → agent assigned → picked up → dispatched → in transit → arriving →
  delivered.
- **A marker that moves.** The vehicle is interpolated along the measured polyline, frame by
  frame, from one clock.
- **An ETA that counts down** on its own, because progress advances with time in transit.
- **The word follows the vehicle.** A motorbike sends a *rider*; everything else sends a
  *pickup agent* — and the timeline, the console and the notifications all read that one
  definition.

**Visual:** Left half, a stylised vertical timeline of the seven stages with the third
marked complete and the fourth active in amber. Right half, a simplified route line with a
marker part-way along and a dashed remainder.

**Speaker notes:** Explain why the two vocabularies exist — "OUT_FOR_DELIVERY" is a
database value, not something you say to a person. Rather than storing both, the human-facing
stages are computed from the machine state, so they can never drift apart. Mention the
agent-noun detail as an example of a small consistency rule enforced in one place.
Transition: "Now the part that has to be right."

---

### Slide 13 — Security model

**Headline:** "Five decisions, each defensible on its own."

**On slide:**
- **bcrypt for passwords, SHA-256 for refresh tokens.** Refresh tokens are stored *only* as
  hashes — a database leak yields nothing usable. Seven-day expiry, revocable.
- **404, not 403, on cross-user reads.** Asking for someone else's parcel returns exactly
  what a nonexistent parcel returns, so ownership cannot be enumerated.
- **Non-enumerating password reset.** Always answers "if the email exists, a link will be
  sent". A successful reset revokes every refresh token on the account.
- **Server-side role checks.** An `@admin_required` decorator reads the JWT role claim; the
  frontend guard is convenience, the backend guard is the control.

**Beneath, in grey:** Also — server-authoritative pricing · explicit CORS allow-list with its
own regression test · config validation refusing to boot without secrets · split
server/browser Google Maps keys · AuditLog capturing IP on every privileged mutation.

**Visual:** Four rows with amber bolded lead-ins. The supporting line as a single grey
paragraph in a lower band, 14pt.

**Speaker notes:** Take the second point as the one to dwell on, because it is the least
obvious. If an unauthorised request returned 403, that response would confirm the parcel
exists — so an attacker could map the whole table by watching which IDs return 403 versus
404. Returning 404 for both makes the two cases indistinguishable. Say the reset flow uses
the same reasoning applied to email addresses. Transition: "Notifications had the same
concern about repeat effects."

---

### Slide 14 — Notifications

**Headline:** "One event, three channels, exactly once."

**On slide — a fan-out diagram:**
`Notification (one row, unique idempotency_key)` → `NotificationDelivery: IN_APP` ·
`NotificationDelivery: EMAIL` · `NotificationDelivery: SMS`

**Three points beneath:**
- **Idempotency key is a unique column** — the same event physically cannot notify twice.
- **Each channel tracks its own state** — status, attempt count (max 3), provider reference,
  last error.
- **SMS is safe-disabled by default** — it needs `SMS_ENABLED=true` *and* a configured
  provider. No provider call ever runs in tests.

**Events listed in grey:** WELCOME · PARCEL_CREATED · PARCEL_STATUS_CHANGED ·
PARCEL_LOCATION_UPDATED · PARCEL_CANCELLED · PARCEL_DESTINATION_UPDATED ·
PARCEL_AGENT_ASSIGNED

**Visual:** One amber node at the left fanning into three `#4DA3FF` nodes. The SMS node
drawn with a dashed stroke and a small "off by default" tag.

**Speaker notes:** Explain the split: one *logical* notification, several *delivery attempts*,
because email can fail while the in-app one succeeded and you need to know which. The
idempotency key is a database constraint rather than application logic, so a retried request
cannot double-send. Note the SMS decision honestly — the plumbing is real, the provider is
not wired, and it defaults off so nobody is surprised by a bill. Transition: "Operations get
their own application."

---

### Slide 15 — The admin portal

**Headline:** "Nine sections, one table that drives all three of navigation, heading and guard."

**On slide — a 3×3 grid of the sections with one-line purposes:**
Overview · Deliveries · Couriers · Capacity · Accounts · Reports · Notifications ·
Audit trail · Settings

**Beneath, the role model:**
- **Customer** — own deliveries only, no portal.
- **Dispatcher** — the board, roster and capacity. No accounts, no settings, **including by
  URL**.
- **Administrator** — everything.

**One line in amber:** "A section cannot appear in the sidebar while being closed to the
person looking at it — the same `SECTIONS` table renders the nav, titles the page and gates
the route."

**Visual:** 3×3 grid of small cards, thin strokes, an icon and a label each. The role model
as three horizontal bars of increasing length beneath, amber for Administrator.

**Speaker notes:** The point worth making is the last line. In most admin UIs the sidebar is
one list and the route guard is another, so they drift and eventually a link appears that
403s when clicked. Here they read from one array, so drift is structurally impossible. Add
that admin actions are live — change a status in the portal and the customer's tracking tab
updates without a reload, through the same cross-tab subscription. Transition: "The API
underneath it."

---

### Slide 16 — API surface

**Headline:** "Thirty-one resources, forty-nine routes, one response shape."

**On slide — endpoint families, grouped:**
- **Auth** — register · login · refresh · logout · me · forgot-password · reset-password ·
  change-password
- **Parcels** — create · list · detail · update destination · cancel · track by number ·
  status history
- **Admin** — list all (filter by status, tracking number, transport mode; paginated) ·
  update status · update location · assign delivery agent
- **Supporting** — weight categories · addresses · profile · notifications ·
  notification preferences · maps (geocode, reverse, route) · health

**Beneath, the envelope, as a code block:**
```json
{ "message": "Parcel created successfully",
  "data":    { … },
  "parcel":  { … } }
```

**One line in grey:** Errors always answer `{ "message": "..." }`, written for the end user.
Every route is served at both `/…` and `/api/…`. Tracking numbers are `DLV-` plus ten
cryptographically random characters, with a uniqueness re-roll.

**Visual:** Four labelled groups as columns or stacked bands, endpoints as small mono pills.
The JSON block in mono on a slightly lighter panel.

**Speaker notes:** Explain the envelope choice: `data` gives clients one predictable key to
read, while the named key (`parcel`, `user`, `parcels`) keeps responses readable when you are
debugging by eye. The dual route aliases exist because frontend and backend were built on
separate branches — both path shapes work, so neither team blocked the other. Transition:
"All of which is only a claim until it is tested."

---

### Slide 17 — Testing

**Headline:** "502 automated tests, against a real database."

**On slide — three large figures across:**
`186` backend tests, 27 files · `316` frontend tests, 29 files · `502` total

**Three points beneath:**
- **Real PostgreSQL 16 in CI,** as a service container with `create_all()` per test — not an
  in-memory stand-in, so schema behaviour is genuinely exercised.
- **Authorization is tested as its own concern** — four dedicated files:
  `test_admin_parcel_authorization`, `test_address_authorization`,
  `test_profile_authorization`, `test_admin_status_authorization`.
- **The contract between halves is pinned** — `test_frontend_api_compat.py` and
  `test_frontend_parcel_routes.py` fail if the backend changes a shape the client relies on.

**Visual:** Three numerals at 130pt in amber, evenly spaced, captions beneath in grey small
caps. The three points as a single column below.

**Speaker notes:** Lead with the middle claim, not the count — plenty of projects have a lot
of tests that all run against SQLite and prove nothing about production. Say the
authorization files exist separately on purpose: it is easy to test that a feature works and
never test that it is closed to the wrong person. The contract tests are what let two people
work on opposite sides of the API without breaking each other. Transition: "And all of it
runs on every push."

---

### Slide 18 — CI/CD and deployment

**Headline:** "Every push runs the whole thing."

**On slide — two columns:**
- **Pipeline (GitHub Actions, on push and PR to `develop` and `main`).**
  *Frontend job* — Node, `npm ci`, ESLint, Jest, Vite production build.
  *Backend job* — Python 3.12, PostgreSQL 16 service container, full pytest suite, plus
  `compileall` as a syntax gate.
- **Topology.**
  *Vercel* builds `frontend/` → `dist/`.
  *Render* runs `flask db upgrade && gunicorn run:app` from `backend/`, health check at
  `/api/health`.

**Visual:** Left, a vertical pipeline of stages as connected pills, green-free — use amber
for pass states. Right, a small deployment diagram: GitHub → Vercel and GitHub → Render →
PostgreSQL.

**Speaker notes:** Note that migrations run as part of the start command, so a deploy that
changes the schema cannot serve traffic against the old one. Mention the health check path
because it is what lets Render restart a bad instance. The `compileall` step is a cheap
belt-and-braces catch for syntax errors in files no test happens to import. Transition:
"Process mattered as much as the code."

---

### Slide 19 — Engineering process

**Headline:** "399 commits, 48 branches, nobody pushing to main."

**On slide:**
- **Three-tier Git flow.** `main` ← `develop` ← `feature/*`. Direct pushes to `main` are
  prohibited; everything arrives by reviewed PR with passing CI.
- **One branch per feature** — `feature/auth`, `feature/parcel-crud`, `feature/parcel-cancel`,
  `feature/status-history`, `feature/admin-status`, `feature/maps-route`,
  `feature/notification-system`, `feature/audit-logs`, `feature/refresh-token`,
  `feature/password-reset-flow`, and more.
- **Conventional Commits** — `feat:` `fix:` `test:` `docs:` `refactor:` `chore:` `ci:`.
- **Documentation first.** A backend PRD written before implementation, plus an API contract,
  a deployment runbook and a QA checklist.

**Visual:** A simplified git graph across the top — one `main` line, a `develop` line, three
feature branches arcing off and merging back. Amber for `main`, grey for the rest. Points
listed beneath.

**Speaker notes:** Say the PRD is the detail worth noting: the backend was specified in
writing — models, fields, statuses, transitions — before anyone wrote a route, which is why
five people could build against each other without constant renegotiation. Mention that
18 August to 3 September is roughly two weeks. Transition: "If you take four things from
this talk."

---

### Slide 20 — Decisions worth defending

**Headline:** "Four we would make again."

**On slide — four numbered claims, each with one line of justification:**
1. **Server-authoritative pricing.** The client renders a quote; it never sets one. Without
   this the system has no commercial integrity.
2. **404 instead of 403 on cross-user reads.** A 403 confirms the resource exists. Making
   the two cases indistinguishable prevents enumeration.
3. **Pure logic modules, free of React and Leaflet.** Pricing, transport eligibility,
   journey geometry and permissions are unit-testable and mirror-able server-side.
4. **One explicit transition map.** The illegal move is absent from the table, so it is
   impossible everywhere rather than rejected in a dozen places.

**Visual:** Four large numerals in amber down the left, claims in bold off-white,
justifications in grey beneath each. Plenty of vertical space.

**Speaker notes:** This is the slide the questions will come from, so state each as a
position rather than a description. On the third, mention the one-directional dependency —
`pricing.js` imports `transport.js` and never the reverse — as evidence that the boundary is
real and enforced, not aspirational. Transition: "And what it does not do yet."

---

### Slide 21 — Limitations and roadmap

**Headline:** "What it does not do yet."

**On slide — two columns:**

**Honest gaps**
- **No WebSockets.** Live tracking uses a cross-tab subscription and clock-derived
  interpolation, not real GPS telemetry from a courier device.
- **SMS is scaffolded, not wired.** Model, preference and delivery record exist; no provider.
- **No payments.** Fares are calculated and recorded, not collected.
- **Assignment is manual.** An admin picks the courier; there is no dispatch optimisation.

**Next**
- M-Pesa Daraja integration
- WebSocket live tracking
- Courier mobile app with real GPS
- Automated dispatch assignment
- Multi-stop route optimisation
- Proof of delivery — signature or photo

**Visual:** Left column in off-white with amber lead-ins; right column as a simple
forward-arrow list in `#4DA3FF`. A hairline between.

**Speaker notes:** Deliver this without apology — being precise about what is simulated is
more credible than claiming everything is production-grade. Say the M-Pesa integration is the
obvious first addition for this market, and that the data model already has the fare recorded
per parcel, so payment is an integration rather than a redesign. Transition: "To close, the
shape of it in numbers."

---

### Slide 22 — Closing numbers

**Headline:** "Delivaroo, in figures."

**On slide — a metrics grid, 3 across × 3 down, each a large amber numeral with a grey caption:**

| | | |
|---|---|---|
| **13** models | **15** services | **49** routes |
| **5** transport modes | **9** portal sections | **6** Redux slices |
| **502** tests | **399** commits | **~28,800** lines |

**Beneath, small:** 48 branches · 5 contributors · 16 migrations · 64 components ·
18 Aug – 3 Sep 2026

**Visual:** 3×3 grid, numerals at 90pt amber, captions 14pt grey small caps beneath each.
Generous gutters. Footer line centred at the bottom.

**Speaker notes:** Do not read the grid — let it sit while you say one closing sentence.
Something like: the point was never the line count, it was that a parcel booked on a phone
and a parcel on a dispatcher's board are the same row in the same table, priced by the same
rule, with every hand that touched it on the record. Then invite questions.

---

## RULES

- **Every figure above is verified against the codebase.** Use them exactly. Do not round,
  inflate, or invent additional metrics, features, dates or names.
- **Write speaker notes on every slide,** expanding my drafts into natural spoken English —
  keep the substance and the numbers exact, and keep the closing transition line.
- **Prefer concrete engineering detail over marketing language.** "Refresh tokens are stored
  only as SHA-256 hashes" is the register I want. "Enterprise-grade security" is not.
  Never use: robust, seamless, cutting-edge, leverage, best-in-class, game-changing.
- **Currency is KES throughout. Units are metric.**
- **Keep the limitations slide.** A deck that names its gaps is more credible than one that
  does not.
- **No stock photography and no clip art anywhere in the deck.**
