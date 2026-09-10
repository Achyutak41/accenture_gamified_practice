let session, question, selected, tick;
let mazeGrid;
let pathFinderPath = [];
const $=s=>document.querySelector(s), api=(url,opts={})=>fetch('/api/v1'+url,{headers:{'Content-Type':'application/json'},...opts}).then(async r=>{let d=await r.json();if(!r.ok)throw Error(d.error);return d});
async function load(){let {agents}=await api('/agents');$('#cards').innerHTML=agents.map(a=>`<article class="card"><div class="icon">${a.icon}</div><h3>${a.name}</h3><p>${a.description}</p><button aria-label="Start ${a.name}" onclick="start('${a.slug}')">→</button></article>`).join('')}
async function start(slug){try{let difficulty='medium';session=await api('/sessions',{method:'POST',body:JSON.stringify({agent:slug,difficulty})});await api(`/sessions/${session.session_id}/start`,{method:'POST'});$('#landing').classList.add('hidden');$('#games').classList.add('hidden');$('#play').classList.remove('hidden');let m=await api(`/agents/${slug}`);$('#gameName').textContent=m.name;$('#gameSkill').textContent=m.skill.toUpperCase();$('#score').textContent='0';$('#accuracy').textContent='0% accuracy';await next();tick=setInterval(updateClock,1000)}catch(e){alert(e.message)}}
async function next(){let data=await api(`/sessions/${session.session_id}/question`);question=data.question;selected=null;$('#feedback').textContent='';renderQuestion();updateClock(data.remaining_seconds)}
function renderQuestion(){

    let q = question;

    let el = $('#question');


    // ------------------------------------------------
    // Existing Path Finder
    // ------------------------------------------------

    if(q.type === 'launch'){

    pathFinderPath = [];

    renderPathFinder();

    return;
}


    // ------------------------------------------------
    // Bubble Agent
    // ------------------------------------------------

    if(q.agent === 'bubble-agent'){

        renderBubbleQuestion();

        return;
    }


    // ------------------------------------------------
    // Existing Games
    // ------------------------------------------------

    el.innerHTML =
        '<h3></h3><div class="options"></div>';


    el.querySelector('h3')
        .textContent = q.prompt;


    let options =
        el.querySelector('.options');


    q.options.forEach(
        value => {

            let button =
                document.createElement(
                    'button'
                );


            button.className =
                'option';


            button.type =
                'button';


            button.textContent =
                value;


            button.addEventListener(
                'click',
                () => select(
                    button,
                    value
                )
            );


            options.append(button);
        }
    );


    if(q.reveal_seconds){

        setTimeout(
            () =>
                el.querySelector('h3')
                    .textContent =
                    'Which sequence did you see?',

            q.reveal_seconds * 1000
        );
    }
}
function renderBubbleQuestion(){

    let q = question;

    let el = $('#question');


    el.innerHTML = '';


    const title =
        document.createElement('h3');


    title.textContent =
        q.prompt;


    el.appendChild(
        title
    );


    const options =
        document.createElement('div');


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
function select(el,value){selected=value;document.querySelectorAll('.option').forEach(x=>x.classList.remove('selected'));el.classList.add('selected')}
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
                style="
                    grid-row:
                    ${startRow + 1};
                "
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

                ${grid
                    .map(
                        (row, y) =>

                            row
                                .map(
                                    (direction, x) => {

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
                                                : "";


                                        return `

                                            <button
                                                type="button"

                                                class="
                                                    pathfinder-cell
                                                    ${direction ? "has-arrow" : "empty"}
                                                    ${isSelected ? "path-selected" : ""}
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
                                                            <span
                                                                class="
                                                                    path-step
                                                                "
                                                            >
                                                                ${index + 1}
                                                            </span>
                                                        `
                                                        : ""
                                                }

                                            </button>

                                        `;
                                    }
                                )
                                .join("")
                    )
                    .join("")}

            </div>


            <div
                class="pathfinder-goal"
                style="
                    grid-row:
                    ${goalRow + 1};
                "
            >
                📍
            </div>

        </div>


        <div class="pathfinder-help">

            Click the cells in the order indicated
            by the arrows, from 🚀 Start to 📍 Goal.

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
function arrowFor(direction) {

    const arrows = {

        up: "↑",

        right: "→",

        down: "↓",

        left: "←"

    };


    return arrows[direction] || "";
}
function selectPathCell(row, col) {

    const alreadySelected =
        pathFinderPath.findIndex(
            cell =>
                cell.row === row &&
                cell.col === col
        );


    // Clicking the most recently selected
    // cell again removes it.
    if (
        alreadySelected ===
        pathFinderPath.length - 1
    ) {

        pathFinderPath.pop();

        renderPathFinder();

        return;
    }


    // Don't allow clicking an older cell
    // out of sequence.
    if (alreadySelected !== -1) {
        return;
    }


    const payload =
        question.payload;


    const grid =
        payload.grid;


    const direction =
        grid[row][col];


    if (!direction) {

        $('#feedback').textContent =
            "That cell has no direction.";

        $('#feedback').className =
            "no";

        return;
    }


    // Determine whether this cell is the
    // correct next cell.
    const expected =
        question.answer[
            pathFinderPath.length
        ];


    if (
        !expected ||
        expected.row !== row ||
        expected.col !== col
    ) {

        $('#feedback').textContent =
            "Wrong path. Try again.";

        $('#feedback').className =
            "no";


        return;
    }


    pathFinderPath.push({
        row,
        col
    });


    $('#feedback').textContent =
        "Correct path!";

    $('#feedback').className =
        "ok";


    renderPathFinder();


    // Automatically complete when the
    // whole path has been found.
    if (
        pathFinderPath.length ===
        question.answer.length
    ) {

        submitPathFinder();
    }
}
function resetPathFinder() {

    pathFinderPath = [];

    $('#feedback').textContent = "";

    renderPathFinder();
}

async function submitPathFinder() {

    if (
        pathFinderPath.length === 0
    ) {

        $('#feedback').textContent =
            "Select the path first.";

        $('#feedback').className =
            "no";

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
                    method: "POST",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        $('#feedback').textContent =
            result.correct
                ? "Correct! Location reached! ✓"
                : "Incorrect path.";


        $('#feedback').className =
            result.correct
                ? "ok"
                : "no";


        $('#score').textContent =
            result.stats.score;


        $('#accuracy').textContent =
            result.stats.accuracy +
            "% accuracy";


        if (result.correct) {

            question =
                result.next_question;


            pathFinderPath = [];


            setTimeout(
                () => {

                    renderQuestion();

                },
                700
            );

        }


    }

    catch (error) {

        alert(
            error.message
        );

    }
}

async function submitAnswer(){if(question.type!=='maze'&&!selected){$('#feedback').textContent='Choose an answer first.';$('#feedback').className='no';return}try{let payload={question_id:question.question_id};if(question.type==='maze')payload.action={grid:mazeGrid};else payload.answer=selected;let r=await api(`/sessions/${session.session_id}/answer`,{method:'POST',body:JSON.stringify(payload)});$('#feedback').textContent=r.correct?'Correct - keep the momentum!':'Not quite - the next one is ready.';$('#feedback').className=r.correct?'ok':'no';$('#score').textContent=r.stats.score;$('#accuracy').textContent=r.stats.accuracy+'% accuracy';question=r.next_question;setTimeout(()=>{selected=null;renderQuestion()},650)}catch(e){alert(e.message)}}
async function updateClock(value){try{let sec=value; if(sec===undefined){let s=await api(`/sessions/${session.session_id}/results`);sec=s.remaining_seconds;if(s.status==='TIMED_OUT')return showResults(s)}$('#clock').textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;$('#progress').style.width=((900-sec)/900*100)+'%'}catch(e){clearInterval(tick)}}
async function finish(){try{showResults(await api(`/sessions/${session.session_id}/finish`,{method:'POST'}))}catch(e){alert(e.message)}}
function showResults(r){clearInterval(tick);$('#play').classList.add('hidden');$('#results').classList.remove('hidden');$('#resultGrid').innerHTML=[[''+r.score,'Score'],[r.accuracy+'%','Accuracy'],[r.attempted,'Attempts'],[r.average_response_seconds+'s','Avg. response']].map(x=>`<div class="metric"><strong>${x[0]}</strong><span>${x[1]}</span></div>`).join('')}
function goHome(){clearInterval(tick);$('#results').classList.add('hidden');$('#play').classList.add('hidden');$('#landing').classList.remove('hidden');$('#games').classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'})}load();
