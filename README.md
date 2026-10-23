# AZ-900 Practice Studio

AZ-900 Practice Studio is an unofficial web-based study tool designed to help beginners prepare for the Microsoft Azure Fundamentals (AZ-900) exam topics.

It was created for the #1MillionDevs AZ-900 vibe coding hackathon and is not affiliated with, endorsed by, or connected to Microsoft.

## Purpose

The project helps learners practise core Azure Fundamentals concepts through:

- Topic-based multiple-choice quizzes
- Instant answer feedback and explanations
- Flashcards with simple spaced-repetition behaviour
- A personal study planner based on exam date, weekly study hours, and weak topics
- A readiness dashboard that tracks progress by topic
- An AI Study Buddy that explains Azure concepts in simple language and African contexts
- Support for multiple languages, with an offline glossary fallback when no AI API key is available

## Main Features

### Smart Quiz Builder

- Includes 60 original practice questions.
- Questions are grouped into three AZ-900 topic areas.
- Answers are graded by the server.
- Learners receive immediate feedback and explanations.
- The questions are original practice material, not real Microsoft exam questions.

### Flashcard Coach

- Includes 20 study flashcards.
- Uses simple spaced-repetition boxes.
- Missed cards are prioritised so learners can review difficult concepts more often.

### Personal Study Planner

- Learners enter their exam date.
- Learners select the number of hours available per week.
- Learners identify weak areas.
- The system generates a week-by-week study plan.

### AI Study Buddy

- Explains concepts in beginner-friendly language.
- Uses relatable African examples where appropriate.
- Supports multiple languages.
- Provides an offline glossary mode if an API key is not configured.

### Readiness Tracker

- Displays overall study readiness.
- Shows topic-level progress bars.
- Uses the AZ-900 topic weighting approach to estimate readiness.
- Readiness is an estimate based only on the questions included in this application.

## Technology Stack

- Node.js
- Vanilla JavaScript
- HTML
- CSS
- REST API
- JSON file storage
- Anthropic API (optional, for the AI Study Buddy)

## Project Structure

```text
Azur-900-study/
├── public/
│   ├── index.html
│   ├── app.js
│   └── style.css
├── .env.example
├── .gitignore
├── LICENSE
├── README.md
├── package.json
└── server.js
```

## Installation and Running Locally

### Requirements

- Node.js version 18 or later
- A web browser

### Steps

1. Clone the repository:

```bash
git clone [https://github.com/Abdurohmanworku/Azur-900-study.git](https://github.com/Abdurohmanworku/Azur-900-study.git)
```

2. Move into the project folder:

```bash
cd Azur-900-study
```

3. Start the application:

```bash
node server.js
```

4. Open the application in a browser:

```text
http://localhost:3000
```

No `npm install` command is required for the basic version of this project.

## Environment Variables

The project can run without an AI API key. To enable the full AI Study Buddy, configure an Anthropic API key as an environment variable.

```bash
ANTHROPIC_API_KEY=your_api_key_here node server.js
```

Optional environment variables:

```text
PORT=3000
DATA_FILE=progress.json
ANTHROPIC_MODEL=model_name
```

Important: Never upload API keys to GitHub. Store them as secrets or environment variables.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/questions` | Retrieves quiz questions |
| POST | `/api/answer` | Submits and grades an answer |
| GET | `/api/progress` | Retrieves learner progress |
| GET | `/api/cards` | Retrieves flashcards |
| POST | `/api/card` | Updates flashcard progress |
| POST | `/api/plan` | Creates a personal study plan |
| POST | `/api/buddy` | Sends a request to the AI Study Buddy |
| GET | `/api/languages` | Retrieves supported languages |
| POST | `/api/reset` | Resets learner progress |

## Deployment

The project can be deployed on any hosting platform that supports Node.js 18 or later, such as:

- Render
- Railway
- Azure App Service

Use the following start command:

```bash
node server.js
```

For production deployment:

- Add `ANTHROPIC_API_KEY` through the platform's secret/environment-variable settings.
- Do not commit credentials to the repository.
- Use persistent storage or configure `DATA_FILE` so learner progress is not lost when the server restarts.

## Limitations

- Readiness scores are estimates and do not guarantee exam performance.
- The app currently uses only its built-in question bank.
- Learner data is stored in a local JSON file unless the storage system is replaced with a database.
- The tool is for learning and practice; it does not provide official Microsoft certification content.

## Future Improvements

- Add more original practice questions.
- Add user accounts and secure authentication.
- Replace JSON storage with PostgreSQL or another database.
- Add detailed analytics for quiz attempts and weak areas.
- Add an admin dashboard for managing questions.
- Add question filtering by AZ-900 topic and difficulty.
- Add a mobile-friendly progressive web app version.

## Disclaimer

This is an unofficial community learning project. It is not affiliated with, sponsored by, or endorsed by Microsoft. All practice questions are original and are not copied from the AZ-900 certification examination.
