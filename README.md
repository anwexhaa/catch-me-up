# Catch Me Up

**An AI second-screen companion for cricket fans who can't watch every ball.**

Live demo: _add your Vercel URL here_

Most fans can't sit through a 3½-hour T20. They follow it in bursts: between meetings and classes, on the commute, from a different time zone. When they look back at the match, the scoreboard gives them numbers (`147/4 (15)`) but not the story: what happened, does it matter for my team, what should I watch now?

Catch Me Up notices when you've been away and, when you return, tells you what you missed in a few lines. The recap is personal: your team, your favourite player, your language and your level of cricket knowledge.

## What it does

- **"What did I miss?" recaps.** Leave the tab (or use the demo's _Step away_ buttons) and come back to a recap of exactly the overs you missed: a headline, three points that matter to _you_, and what to watch next. Joining late gives you the story so far.
- **In your language.** English, Hindi, Hinglish, Bengali, Tamil, Telugu or Marathi, with read-aloud using the device's built-in voices.
- **Pitched to your level.** Die-hard fans get the numbers; new fans get terms explained in plain words.
- **Ask the match.** Chat about the game so far ("Can South Africa still win this?", "Who's the danger man?"). Tapping a turning point on the momentum chart asks why it mattered.
- **Live match screen.** Score, required rate, win-chance bar, momentum chart with turning points, ball-by-ball feed and full scorecard.

The demo replays the real **ICC Men's T20 World Cup 2024 final (India vs South Africa)** ball by ball as if it were live, so it works on any day. You join during South Africa's chase, just before the game turns.

## How AI is used

| Where | What the AI does |
| --- | --- |
| Catch-up recap | Gemini reads the ball-by-ball log of the overs you missed, the match situation before and after, and your profile, then writes a structured recap (JSON: headline, 3 bullets, watch-next). |
| Ask the match | Gemini answers questions using the scorecard, the last few overs, turning points and the win-chance model, in your language and at your level. |

Guardrails:

- **No spoilers.** The model only ever sees deliveries up to the current ball, and the prompt forbids revealing or hinting at anything after "now". This matters because the model may know how the real match ended.
- **Grounded.** Prompts carry the actual data, and the model is told not to invent details (no made-up catches or crowd reactions).
- **Always works.** If no key is configured, the model is rate-limited or a call fails, the app falls back to a rule-based recap built from the event log. Responses are cached and requests are rate-limited per IP to protect the free-tier key.

## How it works

```
Cricsheet ball-by-ball JSON
        │  scripts/build-match-data.mjs  (drops the result, so nothing downstream can leak it)
        ▼
src/data/match.json
        │
        ▼
Browser ── replay clock (wall-clock based, so a background tab "misses" the right balls)
        │
        ├─ match engine  stateAt(n): scores, batting/bowling cards, required rate, events
        ├─ win-chance model (resources-style, explainable) → momentum chart, turning points
        └─ UI: Live · Ask · Scorecard
                │
                ▼
     /api/recap, /api/ask  (Next.js route handlers)
        │  prompt built from deliveries[0..n] + fan profile
        ▼
     Google Gemini (gemini-2.5-flash → flash-lite fallback)  ──fails──►  rule-based summary
```

Key files:

- `src/lib/match.ts`: replay engine, events and turning points
- `src/lib/winprob.ts`: the win-chance model
- `src/lib/prompts.ts`: spoiler-safe prompt construction
- `src/lib/gemini.ts`: Gemini REST client with model fallback
- `src/app/api/recap/route.ts`, `src/app/api/ask/route.ts`: API routes
- `src/components/CatchMeUpApp.tsx`: app shell, away detection, demo controls

## Run locally

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local   # then paste your key from https://aistudio.google.com/apikey
npm run dev
```

Open http://localhost:3000. Without a key the app still runs and shows rule-based summaries.

To rebuild the match data from Cricsheet:

```bash
node scripts/build-match-data.mjs data/cricsheet/1415755.json src/data/match.json
```

## Deploy

1. Push this repo to GitHub.
2. Import it at https://vercel.com/new (framework preset: Next.js).
3. Add the environment variable `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`).
4. Deploy.

## Trade-offs and what's next

- **Replay instead of a live feed.** It keeps the demo reliable on any day; the engine only needs a stream of deliveries, so a live scores API can replace the JSON file.
- **Simple win-chance model.** Duckworth-Lewis-style resources plus a normal approximation: good enough to show momentum and pick turning points, and easy to explain. A production version would use a model trained on historical ball-by-ball data.
- **Next steps:** push a "come back, it's getting tight" notification when the win chance swings; generate recaps in the background so they are instant; localise the whole UI (not just the AI text); measure recap open rate and return visits.

## AI tools used

- **Google Gemini API** (gemini-2.5-flash / flash-lite) powers the recaps and the chat in the product.
- **Claude Code** was used as a pair programmer to build the app.

## Credits

Ball-by-ball data from [Cricsheet](https://cricsheet.org), licensed under the Open Data Commons Attribution License (ODC-By 1.0).

Built by Anwesha for the Dream11 Forward Deployed Engineer Intern assignment.
