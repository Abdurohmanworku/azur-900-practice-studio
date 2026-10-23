# AZ-900 Practice Studio (unofficial)

A community study tool built for the #1MillionDevs AZ-900 vibe coding hackathon. Not affiliated with or endorsed by Microsoft. All questions are original and based on the public AZ-900 skills outline. No exam questions, no Microsoft logos.

## Features (one per hackathon challenge)
| Challenge | Feature |
|---|---|
| Smart Quiz Builder | 60 original questions (20 per topic), instant feedback, explanation for every answer, graded on the server |
| Flashcard Coach | 20 cards, spaced-repetition boxes, missed cards come back first |
| Personal Study Planner | Exam date + weekly hours + weak areas become a week-by-week plan |
| AI Study Buddy | Claude explains concepts simply with African examples, in 8 languages (offline glossary if no API key) |
| Readiness Tracker | Dashboard ring and per-topic bars, weighted by the published exam topic weights |

## Run it
```
node server.js            # Node 18+, no npm install needed
# open http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-... node server.js    # turns on the full AI buddy
```
Optional: `PORT`, `DATA_FILE` (progress file location), `ANTHROPIC_MODEL`.

## Structure
- `server.js` backend: REST API, grading, readiness maths, planner, buddy, JSON storage
- `public/` frontend: `index.html`, `app.js`, `style.css` (vanilla JS, no build step)

## API
`GET /api/questions` `POST /api/answer` `GET /api/progress` `GET /api/cards` `POST /api/card` `POST /api/plan` `POST /api/buddy` `GET /api/languages` `POST /api/reset`

## Prompt engineering (AI Study Buddy)
The system prompt in `server.js` (`BUDDY_PROMPT`) sets: audience (beginners in Africa), length cap (120 words), one real African example, a final check question without the answer, scope limited to the public AZ-900 outline, no exam questions, no invented facts, and reply language. Requests are capped at 500 characters and 20 per hour per learner.

## Honest limits
Readiness is an estimate from this app's 60 questions only. Add more questions in `BANK` (server.js) before relying on it. Learner progress is stored in a local JSON file, so use a host with persistent disk or swap in a database.

## Deploy
Any Node 18+ host works (Render, Railway, Azure App Service). Start command: `node server.js`. Set `ANTHROPIC_API_KEY` as a secret in the host dashboard, never in the repo. Use a persistent disk (or set `DATA_FILE` to one) so progress survives restarts.

## Disclaimer
Unofficial community project for the #1MillionDevs AZ-900 hackathon. Not affiliated with or endorsed by Microsoft. Practice questions are original and are not real exam questions.
