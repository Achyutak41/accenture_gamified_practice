# Accenture GameLab

A free Flask practice platform for Accenture-style gamified assessments. It includes nine independent game agents, 15-minute server-enforced sessions, procedural question generation, scoring, and an interactive Path Finder maze.

## Run locally

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
flask --app app run --debug
```

Then open `http://127.0.0.1:5000`.

## Deploy and share

The project is ready for [Render](https://render.com). Push this folder to GitHub, sign in to Render with GitHub, choose **New > Blueprint**, select the repository, and deploy. Render reads `render.yaml` and gives you a public URL to share with friends.

For a different host, use the included `Procfile` or `Dockerfile`. The production health check is available at `/api/v1/health`.

## Test

```powershell
pytest
```

The API is available under `/api/v1`. Sessions are intentionally anonymous and stored in memory for this MVP.
