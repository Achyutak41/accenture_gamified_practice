"""
Accenture Bubble Agent.

Generates unlimited clickable-bubble questions.

The player is shown several expressions inside bubbles and must
select the bubble that satisfies the instruction.

Examples:
    - Select the smallest value.
    - Select the largest value.
    - Select the value closest to 12.5.

The answer is calculated programmatically, not guessed by an LLM.
"""

from __future__ import annotations

import random
import uuid


BUBBLE_META = {
    "slug": "bubble-agent",
    "name": "Bubble Agent",
    "skill": "Numerical comparison",
    "description": (
        "Choose the correct expression by clicking the matching bubble."
    ),
    "icon": "◯",
    "variants": "Unlimited",
}


DIFFICULTY = {
    "easy": {
        "min_number": 2,
        "max_number": 15,
        "decimal_places": 0,
    },
    "medium": {
        "min_number": 2,
        "max_number": 30,
        "decimal_places": 1,
    },
    "hard": {
        "min_number": 5,
        "max_number": 80,
        "decimal_places": 2,
    },
}


def _question_id():
    return f"bubble_{uuid.uuid4().hex[:10]}"


def _format_number(value):
    """
    Keep generated expressions readable.
    """
    if isinstance(value, int):
        return str(value)

    if float(value).is_integer():
        return str(int(value))

    return str(round(value, 2))


def _random_decimal(low, high, places=1):
    value = random.uniform(low, high)
    return round(value, places)


def _addition_expression(difficulty):
    config = DIFFICULTY[difficulty]

    a = _random_decimal(
        config["min_number"],
        config["max_number"],
        config["decimal_places"],
    )

    b = _random_decimal(
        1,
        config["max_number"] / 2,
        config["decimal_places"],
    )

    return {
        "expression": (
            f"{_format_number(a)} + {_format_number(b)}"
        ),
        "value": a + b,
    }


def _subtraction_expression(difficulty):
    config = DIFFICULTY[difficulty]

    a = _random_decimal(
        config["min_number"] + 5,
        config["max_number"],
        config["decimal_places"],
    )

    b = _random_decimal(
        1,
        max(1, a - 1),
        config["decimal_places"],
    )

    return {
        "expression": (
            f"{_format_number(a)} − {_format_number(b)}"
        ),
        "value": a - b,
    }


def _multiplication_expression(difficulty):
    config = DIFFICULTY[difficulty]

    a = _random_decimal(
        2,
        min(15, config["max_number"]),
        config["decimal_places"],
    )

    b = _random_decimal(
        1,
        min(10, config["max_number"] / 2),
        config["decimal_places"],
    )

    return {
        "expression": (
            f"{_format_number(a)} × {_format_number(b)}"
        ),
        "value": a * b,
    }


def _division_expression(difficulty):
    config = DIFFICULTY[difficulty]

    divisor = random.randint(2, 8)
    result = _random_decimal(
        2,
        min(20, config["max_number"]),
        config["decimal_places"],
    )

    dividend = divisor * result

    return {
        "expression": (
            f"{_format_number(dividend)} ÷ {divisor}"
        ),
        "value": result,
    }


def _square_root_expression(difficulty):
    config = DIFFICULTY[difficulty]

    root = random.randint(
        3,
        min(20, config["max_number"]),
    )

    divisor = random.randint(1, 5)
    addition = random.randint(1, 8)

    value = root / divisor + addition

    return {
        "expression": (
            f"√{root * root} ÷ {divisor} + {addition}"
        ),
        "value": value,
    }


def _make_expression(difficulty):
    generators = [
        _addition_expression,
        _subtraction_expression,
        _multiplication_expression,
        _division_expression,
        _square_root_expression,
    ]

    generator = random.choice(generators)

    return generator(difficulty)


def _generate_distinct_options(difficulty, count=3):
    """
    Generate expressions whose numerical results are different.
    """

    options = []
    seen_values = set()

    attempts = 0

    while len(options) < count and attempts < 100:
        attempts += 1

        item = _make_expression(difficulty)

        rounded_value = round(item["value"], 8)

        if rounded_value in seen_values:
            continue

        seen_values.add(rounded_value)

        options.append(item)

    return options


def _smallest(options):
    answer = min(
        options,
        key=lambda item: item["value"],
    )

    return {
        "instruction": "Select the smallest value.",
        "answer": answer,
    }


def _largest(options):
    answer = max(
        options,
        key=lambda item: item["value"],
    )

    return {
        "instruction": "Select the largest value.",
        "answer": answer,
    }


def _closest(options):
    values = [item["value"] for item in options]

    minimum = min(values)
    maximum = max(values)

    target = round(
        random.uniform(minimum, maximum),
        1,
    )

    answer = min(
        options,
        key=lambda item: abs(item["value"] - target),
    )

    return {
        "instruction": (
            f"Select the value closest to {_format_number(target)}."
        ),
        "answer": answer,
    }


def _greatest_difference(options):
    """
    Select the expression whose result is farthest from zero.
    """

    answer = max(
        options,
        key=lambda item: abs(item["value"]),
    )

    return {
        "instruction": (
            "Select the value with the greatest distance from zero."
        ),
        "answer": answer,
    }


def _smallest_difference(options):
    """
    Select the expression whose result is closest to zero.
    """

    answer = min(
        options,
        key=lambda item: abs(item["value"]),
    )

    return {
        "instruction": (
            "Select the value closest to zero."
        ),
        "answer": answer,
    }


TASKS = [
    _smallest,
    _largest,
    _closest,
    _greatest_difference,
    _smallest_difference,
]


def generate(difficulty="medium"):
    """
    Generate one Bubble Agent question.

    Returns a structure compatible with the existing Flask API.
    """

    if difficulty not in DIFFICULTY:
        difficulty = "medium"

    options = _generate_distinct_options(
        difficulty,
        count=3,
    )

    task_generator = random.choice(TASKS)

    task = task_generator(options)

    answer_expression = task["answer"]["expression"]

    return {
        "question_id": _question_id(),

        "agent": "bubble-agent",

        "type": "bubble",

        "prompt": task["instruction"],

        "options": [
            item["expression"]
            for item in options
        ],

        "answer": answer_expression,

        "metadata": {
            "estimated_seconds": 15,
            "difficulty": difficulty,
            "bubble_count": len(options),
        },
    }