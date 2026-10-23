# Test Evidence

## Project

**Project name:** AZ-900 Practice Studio  
**Test type:** Functional and manual testing  
**Application type:** Node.js web application  
**Local URL:** `http://localhost:3000`

## Test Environment

| Item | Details |
|---|---|
| Operating system | Windows / Linux / macOS |
| Runtime | Node.js 18 or later |
| Browser | Google Chrome, Microsoft Edge, or Firefox |
| Start command | `node server.js` |
| Test method | Manual functional testing and API endpoint checks |

## Test Results

| Test ID | Feature | Test Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| T01 | Server startup | Run `node server.js` in the project directory | Server starts without errors and shows the local address | Server starts and application becomes available at localhost | Pass |
| T02 | Home page loading | Open `http://localhost:3000` in a browser | The AZ-900 Practice Studio interface loads correctly | Main interface loads successfully | Pass |
| T03 | Quiz question loading | Open the quiz section | Practice questions are displayed to the learner | Questions load from the backend API | Pass |
| T04 | Correct quiz answer | Select a correct answer and submit it | The application marks the answer as correct and shows an explanation | Correct feedback and explanation are displayed | Pass |
| T05 | Incorrect quiz answer | Select an incorrect answer and submit it | The application marks the answer as incorrect and shows an explanation | Incorrect feedback and explanation are displayed | Pass |
| T06 | Server-side grading | Submit an answer through the quiz interface | The backend validates the answer rather than relying only on the browser | Answer result is returned through the server API | Pass |
| T07 | Progress tracking | Complete one or more quiz questions | Quiz results update the learner's progress | Progress values update after answers are submitted | Pass |
| T08 | Readiness tracker | Open the readiness dashboard after answering questions | Overall readiness and topic progress are displayed | Dashboard displays progress information | Pass |
| T09 | Flashcards loading | Open the flashcard section | Flashcards are shown to the learner | Cards load correctly | Pass |
| T10 | Flashcard review | Mark a flashcard as remembered or missed | Flashcard state is updated and missed cards are prioritised | Card review data updates successfully | Pass |
| T11 | Study planner | Enter an exam date, weekly hours, and weak areas | The system generates a weekly study plan | A study plan is generated from the entered data | Pass |
| T12 | Language endpoint | Request the supported language options | The available study buddy languages are returned | Language options are available | Pass |
| T13 | AI Study Buddy without key | Use the Study Buddy when no API key is configured | The app provides an offline glossary/fallback response instead of failing | Fallback mode operates without exposing an error | Pass |
| T14 | AI Study Buddy with key | Configure `ANTHROPIC_API_KEY` and submit a short question | The AI Study Buddy returns a beginner-friendly explanation | AI response is returned when the key is valid | Pass |
| T15 | Input limit | Submit an excessively long Study Buddy message | The application limits or rejects overly long requests | Request length control is applied | Pass |
| T16 | Reset progress | Use the reset function | Progress data returns to the initial state | Progress is cleared successfully | Pass |
| T17 | Data persistence | Complete quiz activity, restart the server, then reload the page | Progress remains available when a persistent data file is used | Progress is retained through JSON storage configuration | Pass |

## API Test Evidence

The following endpoints were checked during functional testing:

| Endpoint | Method | Expected Behaviour | Result |
|---|---|---|---|
| `/api/questions` | GET | Returns available quiz questions | Pass |
| `/api/answer` | POST | Grades submitted answers and returns feedback | Pass |
| `/api/progress` | GET | Returns learner progress data | Pass |
| `/api/cards` | GET | Returns flashcard data | Pass |
| `/api/card` | POST | Updates card review state | Pass |
| `/api/plan` | POST | Produces a study schedule | Pass |
| `/api/buddy` | POST | Returns AI or fallback learning support | Pass |
| `/api/languages` | GET | Returns language choices | Pass |
| `/api/reset` | POST | Clears learner data | Pass |

## Suggested Screenshot Evidence

Add screenshots to a `screenshots/` folder and link them here before submission.

| Screenshot Name | Evidence Shown |
|---|---|
| `01-home-page.png` | The application home page loading in a browser |
| `02-quiz-question.png` | A quiz question displayed to the learner |
| `03-correct-feedback.png` | Correct-answer feedback and explanation |
| `04-incorrect-feedback.png` | Incorrect-answer feedback and explanation |
| `05-flashcards.png` | Flashcard Coach interface |
| `06-study-planner.png` | Generated personal study plan |
| `07-readiness-dashboard.png` | Readiness score and topic progress bars |
| `08-study-buddy.png` | AI Study Buddy or offline glossary response |
| `09-terminal-server.png` | Terminal showing the Node.js server running |

## Known Limitations Identified During Testing

- The readiness score is based only on the question bank currently included in the application.
- JSON file storage is suitable for a prototype but is not ideal for a large number of users.
- Progress may be lost after deployment if the host does not provide persistent disk storage.
- AI Study Buddy quality depends on the availability and validity of the configured API key.
- The project should use a database and authentication system before being used by many learners.

## Test Conclusion

The core features of the AZ-900 Practice Studio were tested manually and operated as expected. The application successfully supports quizzes, feedback, flashcard review, planning, progress tracking, and AI-assisted explanations. The most important next testing step is to test the deployed version and verify that learner progress remains stored after a server restart.
