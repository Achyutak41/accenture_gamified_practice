"""
Path Finder / Launch to Location

The old Path Finder used rotatable connection tiles.

The new version uses directional arrows:

    🚀 Start → [→] [→] [↑] [→] ...
                                  ↓
                              [→] → 📍 Goal

The player must click the cells in the correct route order.

The generated puzzle always contains one guaranteed valid route.
Additional arrows are added as distractors.
"""

from __future__ import annotations

import random
import secrets


DIRECTIONS = {
    "up": (-1, 0),
    "right": (0, 1),
    "down": (1, 0),
    "left": (0, -1),
}


ARROWS = {
    "up": "↑",
    "right": "→",
    "down": "↓",
    "left": "←",
}


def _inside(row, col, rows, cols):
    return (
        0 <= row < rows
        and 0 <= col < cols
    )


def _direction_between(current, nxt):

    r1, c1 = current
    r2, c2 = nxt

    dr = r2 - r1
    dc = c2 - c1

    for direction, (drow, dcol) in DIRECTIONS.items():

        if (
            dr == drow
            and dc == dcol
        ):
            return direction

    return None


def _generate_route(rows, cols):

    """
    Generate a self-avoiding route.

    Start enters from the LEFT side.

    Goal exits through the RIGHT side.

    Therefore:

        start = (-1, start_row)

        first cell =
            (start_row, 0)

        last cell points RIGHT
            out of the grid.
    """

    start_row = random.randrange(rows)

    start = (
        start_row,
        -1
    )

    current = (
        start_row,
        0
    )

    route = [current]

    visited = {
        current
    }


    # We want a reasonably long path.
    target_length = random.randint(
        max(5, cols + 2),
        max(7, rows * cols // 2)
    )


    while len(route) < target_length:

        candidates = []


        for direction, (
            dr,
            dc
        ) in DIRECTIONS.items():

            nr = current[0] + dr
            nc = current[1] + dc


            if not _inside(
                nr,
                nc,
                rows,
                cols
            ):
                continue


            candidate = (
                nr,
                nc
            )


            if candidate in visited:
                continue


            # Avoid making the route
            # immediately go back toward
            # the left boundary too often.
            if (
                nc == 0
                and len(route) > 1
                and random.random() < 0.25
            ):
                continue


            candidates.append(
                candidate
            )


        if not candidates:
            break


        # Prefer movement toward the right
        # so the route naturally approaches
        # the goal.
        weighted = []


        for candidate in candidates:

            weight = 1


            if candidate[1] > current[1]:
                weight += 4


            if candidate[1] == cols - 1:
                weight += 5


            weighted.extend(
                [candidate] * weight
            )


        current = random.choice(
            weighted
        )


        route.append(current)

        visited.add(current)


    # Make sure the route reaches the
    # rightmost column.
    if route[-1][1] != cols - 1:

        candidates = [
            (r, cols - 1)
            for r in range(rows)
            if (
                (r, cols - 1)
                not in visited
            )
        ]


        if candidates:

            # Choose the closest row.
            endpoint = min(
                candidates,
                key=lambda pos:
                    abs(
                        pos[0]
                        - route[-1][0]
                    )
            )

            # We need a simple connection.
            # Rebuild with a guaranteed
            # right-side ending if necessary.
            route = _build_simple_route(
                start_row,
                endpoint[0],
                rows,
                cols
            )


    return route


def _build_simple_route(
    start_row,
    end_row,
    rows,
    cols
):
    """
    Guaranteed valid route.

    Example:

        🚀
         ↓
        → → ↓
              ↓
              → → 📍
    """

    route = []

    row = start_row
    col = 0

    route.append(
        (row, col)
    )


    # Move right through several cells.
    right_steps = max(
        1,
        cols // 2
    )


    for _ in range(right_steps):

        col += 1

        if col >= cols:
            break

        route.append(
            (row, col)
        )


    # Move vertically toward target.
    while row != end_row:

        if row < end_row:
            row += 1
        else:
            row -= 1


        if (
            row,
            col
        ) not in route:

            route.append(
                (row, col)
            )


    # Finish to the right edge.
    while col < cols - 1:

        col += 1

        route.append(
            (row, col)
        )


    return route


def _build_grid(
    rows,
    cols,
    route
):

    """
    Build arrow grid.

    None = empty cell
    "up/right/down/left" = arrow
    """

    grid = [
        [
            None
            for _ in range(cols)
        ]
        for _ in range(rows)
    ]


    # -----------------------------------------
    # Route arrows
    # -----------------------------------------

    for index, current in enumerate(route):

        row, col = current


        if index < len(route) - 1:

            nxt = route[index + 1]

            direction =_direction_between(
                    current,
                    nxt
                )

            grid[row][col] = direction

        else:

            # Last route cell must point
            # outside the grid toward Goal.
            grid[row][col] = "right"


    # -----------------------------------------
    # Distractor arrows
    # -----------------------------------------

    distractor_probability = 0.35


    for row in range(rows):

        for col in range(cols):

            if grid[row][col] is not None:
                continue


            if (
                random.random()
                > distractor_probability
            ):
                continue


            possible = []


            for direction, (
                dr,
                dc
            ) in DIRECTIONS.items():

                nr = row + dr
                nc = col + dc


                if _inside(
                    nr,
                    nc,
                    rows,
                    cols
                ):
                    possible.append(
                        direction
                    )


            if possible:

                grid[row][col] = random.choice(
                    possible
                )


    return grid


def make_maze(difficulty="medium"):
    """
    Keep the existing function name so
    app.py doesn't need a large rewrite.

    Returns the new Launch-to-Location puzzle.
    """

    sizes = {
        "easy": (4, 5),
        "medium": (5, 6),
        "hard": (6, 7),
    }


    rows, cols = sizes.get(
        difficulty,
        sizes["medium"]
    )


    # Generate until a sufficiently long
    # route is produced.
    for _ in range(20):

        route = _generate_route(
            rows,
            cols
        )


        if len(route) >= cols:

            break

    else:

        route = _build_simple_route(
            0,
            rows - 1,
            rows,
            cols
        )


    grid = _build_grid(
        rows,
        cols,
        route
    )


    return {

        "type": "launch",

        "rows": rows,

        "cols": cols,

        # Keep size for backward compatibility.
        "size": rows,

        "grid": grid,

        "start": {
            "row": route[0][0],
            "col": -1,
        },

        "goal": {
            "row": route[-1][0],
            "col": cols,
        },

        "solution": [
            {
                "row": row,
                "col": col
            }
            for row, col in route
        ],

        "puzzle_id":
            "launch_"
            + secrets.token_hex(5),
    }


def reachable(
    path,
    solution,
    payload=None
):
    """
    Validate the player's clicked route.

    The route must exactly match the
    generated solution.
    """

    if not isinstance(path, list):
        return False


    if not isinstance(
        solution,
        list
    ):
        return False


    if len(path) != len(solution):
        return False


    for player_cell, correct_cell in zip(
        path,
        solution
    ):

        if not isinstance(
            player_cell,
            dict
        ):
            return False


        if (
            player_cell.get("row")
            != correct_cell.get("row")
        ):
            return False


        if (
            player_cell.get("col")
            != correct_cell.get("col")
        ):
            return False


    return True


def rotate(grid, row, col):
    """
    Kept only for backward compatibility.

    The new Path Finder does not use
    tile rotation.
    """

    return grid