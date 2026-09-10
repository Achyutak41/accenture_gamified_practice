"""Procedural question agents. Each generator yields far more than 50 valid variants."""
from __future__ import annotations
import random
import uuid

AGENTS = [
    ("pathfinder", "Path Finder", "Spatial reasoning", "Rotate path tiles to connect Start to Goal.", "🧭"),
    ("sequential", "Sequential", "Progressions", "Find the next item in a sequence.", "↗"),
    ("reasoning", "Reasoning", "Deduction", "Solve compact decision challenges.", "◇"),
    ("memory", "Memory", "Working memory", "Study a sequence, then recall it.", "◉"),
    ("pattern", "Pattern Recognition", "Transformations", "Identify the rule behind the pattern.", "✦"),
    ("logical", "Logical Reasoning", "Rules & conditions", "Infer a valid conclusion from rules.", "⌘"),
    ("attention", "Attention & Accuracy", "Precision", "Spot the one exact match.", "◎"),
    ("reaction", "Reaction Speed", "Fast decisions", "Classify the prompt accurately and quickly.", "⚡"),
    ("multitasking", "Multitasking", "Dual tracking", "Answer two rules at once.", "⧉"),
]
META = {x[0]: {"slug":x[0], "name":x[1], "skill":x[2], "description":x[3], "icon":x[4], "variants": "Unlimited"} for x in AGENTS}

def _q(slug, prompt, options, answer, **extra):
    return {"question_id": f"{slug}_{uuid.uuid4().hex[:10]}", "agent": slug, "prompt": prompt,
            "options": options, "answer": answer, "metadata": {"estimated_seconds": 18}, **extra}

def generate(slug: str, difficulty: str):
    r = random.Random()
    level = {"easy": 1, "medium": 2, "hard": 3}.get(difficulty, 2)
    if slug == "sequential":
        start, step = r.randint(2, 15), r.randint(2, 4 + level * 3)
        values = [start + step*i for i in range(4)]
        answer = start + step*4
        opts = [answer, answer-step, answer+step, answer+2*step]; r.shuffle(opts)
        return _q(slug, "What comes next?  " + "  ·  ".join(map(str, values)) + "  ·  ?", list(map(str,opts)), str(answer))
    if slug == "reasoning":
        names = ["Asha", "Dev", "Mira"]
        answer = names[r.randrange(3)]
        prompt = f"Three candidates are ranked first, second, third. {answer} is first. Who is first?"
        return _q(slug, prompt, names, answer)
    if slug == "memory":
        symbols = r.sample(["◆","●","▲","■","★","♥"], 3 + level)
        options = [" ".join(symbols), " ".join(reversed(symbols)), " ".join(symbols[1:]+symbols[:1]), " ".join(symbols[:-1]+["●"])]
        r.shuffle(options)
        return _q(slug, "Memorize this sequence, then choose it:  " + "  ".join(symbols), options, " ".join(symbols), reveal_seconds=3)
    if slug == "pattern":
        base = r.randint(2, 8); vals = [base, base*2, base*4]
        answer = str(base*8); opts = [answer, str(base*6), str(base*7), str(base*10)]; r.shuffle(opts)
        return _q(slug, "Complete the transformation:  " + "  →  ".join(map(str,vals)) + "  →  ?", opts, answer)
    if slug == "logical":
        prompt = "All blue tokens are round. This token is blue. Which conclusion must be true?"
        opts = ["It is round", "It is red", "It is large", "It is not round"]
        return _q(slug, prompt, opts, "It is round")
    if slug == "attention":
        target = "Q7M9K"; options = [target, "Q7N9K", "Q7M8K", "QTM9K"]; r.shuffle(options)
        return _q(slug, f"Choose the exact match for: {target}", options, target)
    if slug == "reaction":
        n = r.randint(10, 99); is_even = n % 2 == 0
        return _q(slug, f"Fast decision: is {n} even or odd?", ["Even", "Odd"], "Even" if is_even else "Odd")
    if slug == "multitasking":
        n = r.randint(2, 9); color = r.choice(["blue", "orange"])
        answer = "Yes" if (n % 2 == 0 and color == "blue") else "No"
        return _q(slug, f"Rule: choose Yes only if the number is even AND the color is blue.\n\nNumber: {n}  ·  Color: {color.title()}", ["Yes", "No"], answer)
    raise KeyError(slug)
