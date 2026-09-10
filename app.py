from __future__ import annotations
from datetime import datetime, timedelta, timezone
import secrets, time
from flask import Flask, jsonify, render_template, request, abort
from agents import AGENTS, META, generate
from maze import make_maze, reachable, rotate
from bubble_agent import BUBBLE_META, generate as generate_bubble 


SESSIONS={}; DURATION=900
def now(): return datetime.now(timezone.utc)
def public_question(q): return {k:v for k,v in q.items() if k != "answer"}
def remaining(s):
    if not s.get("started_at"): return DURATION
    return max(0, int((s["expires_at"]-now()).total_seconds()))
def result(s):
    attempted=s["attempted"]; elapsed=DURATION-remaining(s) if s.get("started_at") else 0
    return {"session_id":s["id"],"status":s["status"],"score":s["score"],"attempted":attempted,"correct":s["correct"],"accuracy":round(100*s["correct"]/attempted,1) if attempted else 0,"average_response_seconds":round(s["response_total"]/attempted,1) if attempted else 0,"questions_per_minute":round(attempted/max(elapsed/60, .1),1),"remaining_seconds":remaining(s)}
def session_or_404(i):
    s=SESSIONS.get(i)
    if not s: abort(404, "Session not found")
    if s["status"]=="ACTIVE" and remaining(s)==0: s["status"]="TIMED_OUT"
    return s
def create_app():
  app=Flask(__name__)
  @app.get("/")
  def home(): return render_template("index.html")
  @app.get("/api/v1/health")
  def health(): return jsonify(status="ok", service="accenture-gamelab")
  @app.get("/api/v1/agents")
  def agents(): 
    all_agents = list(META.values())

    # Add Bubble Agent 
    all_agents.append(BUBBLE_META)

    return jsonify(
        agents=all_agents
    )
  @app.get("/api/v1/agents/<slug>")
  def agent(slug):

    if slug == "bubble-agent":

        return jsonify(
            BUBBLE_META | {
                "difficulties": [
                    "easy",
                    "medium",
                    "hard"
                ],
                "duration_seconds": DURATION,
                "minimum_questions": 50
            }
        )

    if slug not in META:
        abort(404)

    return jsonify(
        META[slug] | {
            "difficulties": [
                "easy",
                "medium",
                "hard"
            ],
            "duration_seconds": DURATION
        }
    )
  @app.post("/api/v1/sessions")
  def create_session():
    data=request.get_json(silent=True) or {}; slug=data.get("agent"); difficulty=data.get("difficulty","medium")
    if slug not in META or difficulty not in {"easy","medium","hard"}: abort(400, "Valid agent and difficulty required")
    ident="sess_"+secrets.token_urlsafe(12); SESSIONS[ident]={"id":ident,"agent":slug,"difficulty":difficulty,"status":"CREATED","score":0,"attempted":0,"correct":0,"response_total":0,"question":None,"presented":None}
    return jsonify(session_id=ident, agent=slug, duration_seconds=DURATION, status="CREATED"),201
  @app.post("/api/v1/sessions/<ident>/start")
  def start(ident):
    s=session_or_404(ident)
    if s["status"]=="CREATED": s["status"]="ACTIVE"; s["started_at"]=now(); s["expires_at"]=now()+timedelta(seconds=DURATION)
    return jsonify(result(s))
  def new_question(s):

    if s["agent"] == "pathfinder":

      puzzle = make_maze(
        s["difficulty"]
    )

      s["question"] = {

        "question_id":
            "launch_"
            + secrets.token_hex(5),

        "type":
            "launch",

        "agent":
            "pathfinder",

        "prompt":
            "Launch to Location",

        "payload": {
            k: v
            for k, v in puzzle.items()
            if k != "solution"
        },

        "answer":
            puzzle["solution"],
    }


    elif s["agent"] == "bubble-agent":

        s["question"] = generate_bubble(
            s["difficulty"]
        )


    else:

        s["question"] = generate(
            s["agent"],
            s["difficulty"]
        )


    s["presented"] = time.monotonic()

    return public_question(
        s["question"]
    )
  @app.get("/api/v1/sessions/<ident>/question")
  def question(ident):
    s=session_or_404(ident)
    if s["status"]!="ACTIVE": abort(409, "Session is not active")
    return jsonify(question=s["question"] and public_question(s["question"]) or new_question(s), remaining_seconds=remaining(s))
  @app.post("/api/v1/sessions/<ident>/answer")
  def answer(ident):
    s=session_or_404(ident); data=request.get_json(silent=True) or {}
    if s["status"]!="ACTIVE": abort(409, "Session is no longer active")
    q=s.get("question")
    if not q or data.get("question_id") != q["question_id"]: abort(400, "Current question_id required")
    if s["agent"] == "pathfinder":

      path = (
        data
        .get("action", {})
        .get("path")
    )


      payload = q["payload"]


      correct = reachable(
        path,
        q["answer"],
        payload
    )


    else:

      correct = (
        data.get("answer")
        == q["answer"]
    )
    s["attempted"]+=1; s["correct"]+=int(correct); s["score"]+=int(correct); s["response_total"]+=time.monotonic()-s["presented"]; s["question"]=None
    return jsonify(correct=correct, score_delta=int(correct), stats=result(s), next_question=new_question(s))
  @app.post("/api/v1/sessions/<ident>/finish")
  def finish(ident):
    s=session_or_404(ident)
    if s["status"] in {"ACTIVE","CREATED"}: s["status"]="COMPLETED"
    return jsonify(result(s))
  @app.get("/api/v1/sessions/<ident>/results")
  def results(ident): return jsonify(result(session_or_404(ident)))
  @app.errorhandler(400)
  @app.errorhandler(404)
  @app.errorhandler(409)
  def client_error(e): return jsonify(error=e.description), e.code
  return app
app=create_app()
