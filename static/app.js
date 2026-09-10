    let session;
    let question;
    let selected;
    let tick;

    let pathFinderPath = [];


    const $ = s =>
        document.querySelector(s);


    const api = (
        url,
        opts = {}
    ) =>
        fetch(
            '/api/v1' + url,
            {
                headers: {
                    'Content-Type':
                        'application/json'
                },

                ...opts
            }
        )
        .then(
            async r => {

                let d =
                    await r.json();

                if (!r.ok) {

                    throw Error(
                        d.error
                    );
                }

                return d;
            }
        );


    // =========================================================
    // Load agents
    // =========================================================

    async function load() {

        let {
            agents
        } = await api(
            '/agents'
        );


        $('#cards').innerHTML =
            agents
                .map(
                    a => `

                        <article class="card">

                            <div class="icon">
                                ${a.icon}
                            </div>

                            <h3>
                                ${a.name}
                            </h3>

                            <p>
                                ${a.description}
                            </p>

                            <button
                                aria-label="Start ${a.name}"
                                onclick="start('${a.slug}')"
                            >
                                →
                            </button>

                        </article>

                    `
                )
                .join('');
    }


    // =========================================================
    // Start session
    // =========================================================

    async function start(slug) {

        try {

            let difficulty =
                'medium';


            session =
                await api(
                    '/sessions',
                    {
                        method:
                            'POST',

                        body:
                            JSON.stringify(
                                {
                                    agent:
                                        slug,

                                    difficulty:
                                        difficulty
                                }
                            )
                    }
                );


            await api(
                `/sessions/${session.session_id}/start`,
                {
                    method:
                        'POST'
                }
            );


            $('#landing')
                .classList
                .add('hidden');


            $('#games')
                .classList
                .add('hidden');


            $('#play')
                .classList
                .remove('hidden');


            let m =
                await api(
                    `/agents/${slug}`
                );


            $('#gameName')
                .textContent =
                m.name;


            $('#gameSkill')
                .textContent =
                m.skill.toUpperCase();


            $('#score')
                .textContent =
                '0';


            $('#accuracy')
                .textContent =
                '0% accuracy';


            await next();


            tick =
                setInterval(
                    updateClock,
                    1000
                );

        }

        catch (e) {

            alert(
                e.message
            );

        }
    }


    // =========================================================
    // Next question
    // =========================================================

    async function next() {

        let data =
            await api(
                `/sessions/${session.session_id}/question`
            );


        question =
            data.question;


        selected =
            null;


        $('#feedback')
            .textContent =
            '';


        $('#feedback')
            .className =
            '';


        renderQuestion();


        updateClock(
            data.remaining_seconds
        );
    }


    // =========================================================
    // Render question
    // =========================================================

    function renderQuestion() {

        let q = question;

        let el = $('#question');

        const gameActions =
            $('#gameActions');


        // =====================================================
        // PATH FINDER
        // =====================================================

        if (q.type === 'launch') {

            pathFinderPath = [];

            // Hide normal Submit answer buttons.
            gameActions.classList.add('hidden');

            renderPathFinder();

            return;
        }


        // =====================================================
        // BUBBLE AGENT
        // =====================================================

        if (q.agent === 'bubble-agent') {

            // Bubble Agent automatically submits
            // when a bubble is clicked.
            gameActions.classList.add('hidden');

            renderBubbleQuestion();

            return;
        }


        // =====================================================
        // EXISTING GAMES
        // =====================================================

        gameActions.classList.remove('hidden');


        el.innerHTML =
            '<h3></h3><div class="options"></div>';


        el.querySelector('h3')
            .textContent = q.prompt;


        let options =
            el.querySelector('.options');


        q.options.forEach(
            value => {

                let button =
                    document.createElement('button');


                button.className =
                    'option';


                button.type =
                    'button';


                button.textContent =
                    value;


                button.addEventListener(
                    'click',
                    () =>
                        select(
                            button,
                            value
                        )
                );


                options.append(button);
            }
        );


        if (q.reveal_seconds) {

            setTimeout(
                () => {

                    let title =
                        el.querySelector('h3');

                    if (title) {

                        title.textContent =
                            'Which sequence did you see?';

                    }

                },
                q.reveal_seconds * 1000
            );
        }
    }
    // =========================================================
    // Bubble Agent
    // =========================================================

    function renderBubbleQuestion() {

        let q =
            question;


        let el =
            $('#question');


        el.innerHTML =
            '';


        const title =
            document.createElement(
                'h3'
            );


        title.textContent =
            q.prompt;


        el.appendChild(
            title
        );


        const options =
            document.createElement(
                'div'
            );


        options.className =
            'options bubble-options';


        q.options.forEach(
            value => {

                const bubble =
                    document.createElement(
                        'button'
                    );


                bubble.type =
                    'button';


                bubble.className =
                    'option bubble-option';


                bubble.textContent =
                    value;


                bubble.addEventListener(
                    'click',
                    () => {

                        select(
                            bubble,
                            value
                        );


                        submitAnswer();

                    }
                );


                options.appendChild(
                    bubble
                );
            }
        );


        el.appendChild(
            options
        );
    }


    // =========================================================
    // Generic option selection
    // =========================================================

    function select(
        el,
        value
    ) {

        selected =
            value;


        document
            .querySelectorAll(
                '.option'
            )
            .forEach(
                x =>
                    x.classList.remove(
                        'selected'
                    )
            );


        el.classList.add(
            'selected'
        );
    }


    // =========================================================
    // PATH FINDER
    // =========================================================

    function renderPathFinder() {

        const payload =
            question.payload;


        const rows =
            payload.rows;


        const cols =
            payload.cols;


        const grid =
            payload.grid;


        const startRow =
            payload.start.row;


        const goalRow =
            payload.goal.row;


        const questionElement =
            $('#question');


        questionElement.innerHTML = `

            <div class="pathfinder-title">

                <span class="pathfinder-objective">
                    OBJECTIVE
                </span>

                <h3>
                    Launch to Location
                </h3>

            </div>


            <div class="pathfinder-board-wrapper">

                <div
                    class="pathfinder-start"
                    style="grid-row:${startRow + 1};"
                >
                    🚀
                </div>


                <div
                    class="pathfinder-board"
                    style="
                        grid-template-columns:
                            repeat(${cols}, 1fr);

                        grid-template-rows:
                            repeat(${rows}, 1fr);
                    "
                >

                    ${
                        grid
                            .map(
                                (row, y) =>

                                    row
                                        .map(
                                            (
                                                direction,
                                                x
                                            ) => {

                                                const index =
                                                    pathFinderPath.findIndex(
                                                        cell =>
                                                            cell.row === y &&
                                                            cell.col === x
                                                    );


                                                const isSelected =
                                                    index !== -1;


                                                const arrow =
                                                    direction
                                                        ? arrowFor(
                                                            direction
                                                        )
                                                        : '';


                                                return `

                                                    <button
                                                        type="button"

                                                        class="
                                                            pathfinder-cell
                                                            ${direction ? 'has-arrow' : 'empty'}
                                                            ${isSelected ? 'path-selected' : ''}
                                                        "

                                                        data-row="${y}"

                                                        data-col="${x}"

                                                        onclick="
                                                            selectPathCell(
                                                                ${y},
                                                                ${x}
                                                            )
                                                        "
                                                    >

                                                        <span class="pathfinder-arrow">
                                                            ${arrow}
                                                        </span>


                                                        ${
                                                            isSelected
                                                                ? `
                                                                    <span class="path-step">
                                                                        ${index + 1}
                                                                    </span>
                                                                `
                                                                : ''
                                                        }

                                                    </button>

                                                `;
                                            }
                                        )
                                        .join('')
                            )
                            .join('')
                    }

                </div>


                <div
                    class="pathfinder-goal"
                    style="grid-row:${goalRow + 1};"
                >
                    📍
                </div>

            </div>


            <div class="pathfinder-help">

                Follow the arrows from
                🚀 Start to 📍 Goal.
                Click each cell as you move.

            </div>


            <div class="pathfinder-actions">

                <button
                    type="button"
                    class="pathfinder-reset"
                    onclick="resetPathFinder()"
                >
                    Reset
                </button>


                <button
                    type="button"
                    class="pathfinder-submit"
                    onclick="submitPathFinder()"
                >
                    Launch
                </button>

            </div>

        `;
    }


    // =========================================================
    // Arrow character
    // =========================================================

    function arrowFor(
        direction
    ) {

        const arrows = {

            up:
                '↑',

            right:
                '→',

            down:
                '↓',

            left:
                '←'

        };


        return (
            arrows[direction]
            || ''
        );
    }


    // =========================================================
    // Path Finder cell selection
    // =========================================================

    function selectPathCell(
        row,
        col
    ) {

        const payload =
            question.payload;


        const grid =
            payload.grid;


        const direction =
            grid[row][col];


        // -----------------------------------------------------
        // Empty cell
        // -----------------------------------------------------

        if (!direction) {

            $('#feedback')
                .textContent =
                'This cell has no direction.';


            $('#feedback')
                .className =
                'no';


            return;
        }


        // -----------------------------------------------------
        // Check whether cell was already selected
        // -----------------------------------------------------

        const alreadySelected =
            pathFinderPath.findIndex(
                cell =>
                    cell.row === row &&
                    cell.col === col
            );


        // -----------------------------------------------------
        // Clicking latest selected cell removes it
        // -----------------------------------------------------

        if (
            alreadySelected ===
            pathFinderPath.length - 1
        ) {

            pathFinderPath.pop();


            $('#feedback')
                .textContent =
                '';


            $('#feedback')
                .className =
                '';


            renderPathFinder();


            return;
        }


        // -----------------------------------------------------
        // Don't allow old cells to be selected again
        // -----------------------------------------------------

        if (
            alreadySelected !== -1
        ) {

            return;
        }


        // -----------------------------------------------------
        // Determine expected next cell
        // -----------------------------------------------------

        let expectedRow;
        let expectedCol;


        // First cell is directly inside
        // the rocket.

        if (
            pathFinderPath.length === 0
        ) {

            expectedRow =
                payload.start.row;


            expectedCol =
                0;

        }

        else {

            const previous =
                pathFinderPath[
                    pathFinderPath.length - 1
                ];


            const previousDirection =
                grid[
                    previous.row
                ][
                    previous.col
                ];


            const delta = {

                up:
                    [-1, 0],

                right:
                    [0, 1],

                down:
                    [1, 0],

                left:
                    [0, -1]

            };


            const movement =
                delta[
                    previousDirection
                ];


            if (!movement) {

                $('#feedback')
                    .textContent =
                    'Invalid direction.';


                $('#feedback')
                    .className =
                    'no';


                return;
            }


            expectedRow =
                previous.row
                + movement[0];


            expectedCol =
                previous.col
                + movement[1];

        }


        // -----------------------------------------------------
        // Validate clicked cell
        // -----------------------------------------------------

        if (
            row !== expectedRow
            ||
            col !== expectedCol
        ) {

            $('#feedback')
                .textContent =
                'Follow the arrow from the previous cell.';


            $('#feedback')
                .className =
                'no';


            return;
        }


        // -----------------------------------------------------
        // Add cell to path
        // -----------------------------------------------------

        pathFinderPath.push({

            row:
                row,

            col:
                col

        });


        $('#feedback')
            .textContent =
            'Correct path!';


        $('#feedback')
            .className =
            'ok';


        renderPathFinder();


        // -----------------------------------------------------
        // Check if goal reached
        // -----------------------------------------------------

        const isLastColumn =
            col === payload.cols - 1;


        const pointsRight =
            direction === 'right';


        const reachesGoalRow =
            row === payload.goal.row;


        if (
            isLastColumn
            &&
            pointsRight
            &&
            reachesGoalRow
        ) {

            setTimeout(
                () => {

                    submitPathFinder();

                },
                200
            );
        }
    }


    // =========================================================
    // Reset Path Finder
    // =========================================================

    function resetPathFinder() {

        pathFinderPath = [];


        $('#feedback')
            .textContent =
            '';


        $('#feedback')
            .className =
            '';


        renderPathFinder();
    }


    // =========================================================
    // Submit Path Finder
    // =========================================================

    async function submitPathFinder() {

        if (
            pathFinderPath.length === 0
        ) {

            $('#feedback')
                .textContent =
                'Select the path first.';


            $('#feedback')
                .className =
                'no';


            return;
        }


        try {

            const payload = {

                question_id:
                    question.question_id,

                action: {

                    path:
                        pathFinderPath

                }

            };


            const result =
                await api(
                    `/sessions/${session.session_id}/answer`,
                    {
                        method:
                            'POST',

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            $('#score')
                .textContent =
                result.stats.score;


            $('#accuracy')
                .textContent =
                result.stats.accuracy
                + '% accuracy';


            if (
                result.correct
            ) {

                $('#feedback')
                    .textContent =
                    'Correct! Location reached! ✓';


                $('#feedback')
                    .className =
                    'ok';


                question =
                    result.next_question;


                pathFinderPath = [];


                setTimeout(
                    () => {

                        selected =
                            null;


                        renderQuestion();

                    },
                    700
                );

            }

            else {

                $('#feedback')
                    .textContent =
                    'Incorrect path.';


                $('#feedback')
                    .className =
                    'no';

            }

        }

        catch (error) {

            alert(
                error.message
            );

        }
    }


    // =========================================================
    // Generic answer submission
    // =========================================================

    async function submitAnswer() {

        // Path Finder uses its own submission.
        if (
            question.type === 'launch'
        ) {

            return submitPathFinder();
        }


        if (!selected) {

            $('#feedback')
                .textContent =
                'Choose an answer first.';


            $('#feedback')
                .className =
                'no';


            return;
        }


        try {

            const payload = {

                question_id:
                    question.question_id,

                answer:
                    selected

            };


            const r =
                await api(
                    `/sessions/${session.session_id}/answer`,
                    {
                        method:
                            'POST',

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            $('#feedback')
                .textContent =
                r.correct
                    ? 'Correct - keep the momentum!'
                    : 'Not quite - the next one is ready.';


            $('#feedback')
                .className =
                r.correct
                    ? 'ok'
                    : 'no';


            $('#score')
                .textContent =
                r.stats.score;


            $('#accuracy')
                .textContent =
                r.stats.accuracy
                + '% accuracy';


            question =
                r.next_question;


            setTimeout(
                () => {

                    selected =
                        null;

                    renderQuestion();

                },
                650
            );

        }

        catch (e) {

            alert(
                e.message
            );

        }
    }


    // =========================================================
    // Clock
    // =========================================================

    async function updateClock(
        value
    ) {

        try {

            let sec =
                value;


            if (
                sec === undefined
            ) {

                let s =
                    await api(
                        `/sessions/${session.session_id}/results`
                    );


                sec =
                    s.remaining_seconds;


                if (
                    s.status === 'TIMED_OUT'
                ) {

                    return showResults(s);
                }
            }


            $('#clock')
                .textContent =
                `${String(
                    Math.floor(sec / 60)
                ).padStart(2, '0')}:${String(
                    sec % 60
                ).padStart(2, '0')}`;


            $('#progress')
                .style
                .width =
                (
                    (900 - sec)
                    / 900
                    * 100
                )
                + '%';

        }

        catch (e) {

            clearInterval(
                tick
            );

        }
    }


    // =========================================================
    // Finish
    // =========================================================

    async function finish() {

        try {

            showResults(
                await api(
                    `/sessions/${session.session_id}/finish`,
                    {
                        method:
                            'POST'
                    }
                )
            );

        }

        catch (e) {

            alert(
                e.message
            );

        }
    }


    // =========================================================
    // Results
    // =========================================================

    function showResults(r) {

        clearInterval(
            tick
        );


        $('#play')
            .classList
            .add('hidden');


        $('#results')
            .classList
            .remove('hidden');


        $('#resultGrid')
            .innerHTML = [

                [
                    '' + r.score,
                    'Score'
                ],

                [
                    r.accuracy + '%',
                    'Accuracy'
                ],

                [
                    r.attempted,
                    'Attempts'
                ],

                [
                    r.average_response_seconds + 's',
                    'Avg. response'
                ]

            ]
                .map(
                    x => `

                        <div class="metric">

                            <strong>
                                ${x[0]}
                            </strong>

                            <span>
                                ${x[1]}
                            </span>

                        </div>

                    `
                )
                .join('');
    }


    // =========================================================
    // Go home
    // =========================================================

    function goHome() {

        clearInterval(
            tick
        );


        $('#results')
            .classList
            .add('hidden');


        $('#play')
            .classList
            .add('hidden');


        $('#landing')
            .classList
            .remove('hidden');


        $('#games')
            .classList
            .remove('hidden');


        window.scrollTo(
            {
                top: 0,
                behavior: 'smooth'
            }
        );
    }


    // =========================================================
    // Start
    // =========================================================

    load();