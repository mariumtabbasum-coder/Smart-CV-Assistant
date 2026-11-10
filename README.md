# Smart CV Assistant

A responsive AI-powered resume and cover-letter assistant built with **Python, Flask, HTML, CSS, JavaScript, Bootstrap and the Gemini API**.

## Features

- Generate a professional resume summary.
- Turn listed skills into clear professional descriptions.
- Create a cover letter tailored to a target role and pasted job description.
- Receive practical resume improvement suggestions.
- Dedicated **Before → After** resume improvement view with an upgraded headline, summary, refined skills, project bullets and change highlights.
- Optional existing-resume text field so users can compare their actual original wording with the improved version.
- Request structured JSON output from Gemini.
- Loading, validation, retry and API error states.
- Responsive layout for desktop, tablet and mobile.
- No database: this starter version does not save candidate profiles.

## Tech stack

- Python + Flask — backend and API routes
- Google Gen AI Python SDK — Gemini integration
- HTML, CSS, JavaScript + Bootstrap 5 — responsive frontend
- JSON Schema — structured AI response

## Project structure

```text
smart-cv-assistant/
├── app.py
├── requirements.txt
├── .env.example
├── .gitignore
├── README.md
├── templates/
│   └── index.html
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

## Setup on Windows (PowerShell)

### 1. Open the project folder

```powershell
cd path\to\smart-cv-assistant
```

### 2. Create and activate a virtual environment

```powershell
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, run this once in the current terminal:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```

### 3. Install packages

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Add your Gemini API key

1. Open Google AI Studio and create an API key.
2. In the project root, copy `.env.example` and rename the copy to `.env`.
3. Put your key in `.env`:

```env
GEMINI_API_KEY=your_real_api_key
GEMINI_MODEL=gemini-3.8-flash
```

**Never share your API key or upload `.env` to GitHub.** The `.gitignore` file excludes it.

### 5. Run the app

```powershell
python app.py
```

Open this address in your browser:

```text
http://127.0.0.1:5000
```

## How to use

1. Enter your name, education and skills.
2. Add your projects or experience. Student projects are valid experience to describe accurately.
3. Add a target role and paste the job description for more relevant results.
4. Choose **Generate resume content**, **Write cover letter**, or **Improve my resume**.
5. Review the draft and use **Copy all** to copy the generated content.

## API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/` | Render the application |
| GET | `/api/health` | Basic backend health check |
| POST | `/api/generate` | Generate resume, cover-letter or improvement content |

Example request body:

```json
{
  "action": "resume",
  "full_name": "Alex Morgan",
  "education": "Software Engineering diploma student",
  "skills": "HTML, CSS, JavaScript",
  "experience": "Student project: responsive portfolio website",
  "job_title": "Frontend Developer Intern",
  "job_description": "Looking for HTML, CSS and JavaScript fundamentals",
  "tone": "Professional"
}
```

The response follows a defined JSON schema with `resume_summary`, `skills_descriptions`, `cover_letter`, `improvement_suggestions` and `notes`.

## Prompt engineering concepts demonstrated

- **System prompt:** sets the assistant's role and rules, including not inventing qualifications.
- **Few-shot prompting:** includes a short example of truthful beginner-level career writing.
- **JSON mode / structured output:** requests `application/json` and a response schema from Gemini.

## Before publishing to GitHub

- [ ] Confirm `.env` is not tracked (`git status`).
- [ ] Test all three generation actions.
- [ ] Test on a phone-sized screen.
- [ ] Add screenshots to a `screenshots/` folder.
- [ ] Record a short demo video showing form input, generation and results.
- [ ] Add your own GitHub repository URL to this README.

## Important

AI-generated career content must be reviewed. Verify names, dates, qualifications and every claim before sending a resume or cover letter. This project is a writing assistant, not a hiring or ATS-score guarantee.
