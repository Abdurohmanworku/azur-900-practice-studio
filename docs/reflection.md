# Project Reflection

## Introduction

AZ-900 Practice Studio was created as an interactive learning tool for people preparing for Microsoft Azure Fundamentals topics. The goal was to build more than a simple question-and-answer website. The application combines quizzes, flashcards, progress tracking, a study planner, and an AI Study Buddy so that learners can identify weak areas and practise consistently.

This project also focused on making cloud-learning support more understandable for beginners, including learners who may prefer simple explanations and locally relatable examples.

## What Was Achieved

The project successfully delivered the major planned features:

- A quiz system with original AZ-900-style practice questions.
- Instant feedback and explanations after quiz answers.
- Server-side answer grading.
- Flashcards with a simple spaced-repetition approach.
- A personalised study planner using exam date, weekly study time, and weak areas.
- A readiness dashboard showing overall and topic-level progress.
- An AI Study Buddy with an offline fallback option.
- A lightweight Node.js backend and vanilla JavaScript frontend.

The application is simple to run because it does not require a complex build process or large dependency installation. A learner can start the project using Node.js and access it through a browser.

## What Went Well

One strong part of the project was keeping the technology stack simple. Using Node.js, HTML, CSS, and vanilla JavaScript made the project easier to understand, develop, and deploy. This was a good decision because the project is intended as a practical study tool rather than a large enterprise system.

Another successful decision was placing quiz grading on the server. This improves the integrity of the learning experience because the correct answer logic is not handled only by the browser interface.

The project also combined several learning methods instead of depending only on multiple-choice questions. Quizzes help learners test knowledge, flashcards support recall, the planner encourages regular study, and the Study Buddy supports learners when they are confused. These features work together to create a more complete learning experience.

Including an offline fallback for the AI Study Buddy was also important. It means the application can still provide some learning support when an API key is unavailable or when the AI service cannot be used.

## Challenges Faced

A major challenge was balancing useful functionality with the limited scope of a prototype. Features such as accounts, a database, secure authentication, detailed analytics, and advanced spaced repetition would improve the product, but they would also make the first version much more complex.

Another challenge was data persistence. The application uses local JSON storage for learner progress. This is suitable for development and a small prototype, but it may not work reliably on every hosting platform. Some hosting services restart applications or remove temporary files, which can cause progress data to disappear.

The AI Study Buddy also creates technical and security considerations. API keys must be stored in environment variables and never pushed to GitHub. The application must also control request size and frequency to reduce misuse and unnecessary API costs.

## What I Learned

This project improved understanding of how frontend and backend parts of a web application communicate through REST APIs. For example, the frontend sends quiz answers to the server, and the server returns the result, feedback, and updated progress.

The project also showed the importance of designing for real users. A learner does not only need questions; they need feedback, revision tools, reminders of weak areas, and a clear sense of progress. Adding several small learning features created a better user experience than creating only one large feature.

Another important learning point was deployment planning. A project may work correctly on a local computer but still need additional configuration in production. Environment variables, persistent storage, server start commands, and API key security must all be considered before deployment.

## Improvements for the Future

The next version of AZ-900 Practice Studio could include:

- User registration and login.
- PostgreSQL or another cloud database instead of local JSON storage.
- More original practice questions across all AZ-900 skill areas.
- Question difficulty levels and topic filters.
- Detailed performance analytics.
- A review history showing repeated mistakes.
- Downloadable study plans.
- Improved mobile responsiveness.
- A teacher or administrator dashboard for managing questions.
- Automated unit and integration tests.
- Deployment with persistent cloud storage.

## Final Reflection

Overall, AZ-900 Practice Studio achieved its main aim: creating an accessible, practical, and beginner-friendly Azure learning tool. The project demonstrates how a small full-stack application can combine APIs, user interaction, progress tracking, and optional AI support in one product.

The current version is a strong prototype. The most valuable next step would be replacing local file storage with a database and deploying the system with persistent storage so that it can support real learners more reliably.
