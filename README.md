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

## Test

```powershell
pytest
```

The API is available under `/api/v1`. Sessions are intentionally anonymous and stored in memory for this MVP.
