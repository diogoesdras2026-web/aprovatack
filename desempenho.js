/* ============================================================
   APROVATRACK
   DASHBOARD DE DESEMPENHO
   ============================================================ */

const SUPABASE_URL =
 "https://axxgqacfyrzgpgmqjxbp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
     "sb_publishable_A9ALAeK0ECKMwfrsMH_62g_x-viRpGK";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* ============================================================
   ELEMENTOS
   ============================================================ */

const examSelect =
    document.getElementById("examSelect");

const todayMinutes =
    document.getElementById("todayMinutes");

const weekMinutes =
    document.getElementById("weekMinutes");

const totalQuestionsEl =
    document.getElementById("totalQuestions");

const accuracy =
    document.getElementById("accuracy");

const accuracyDetail =
    document.getElementById("accuracyDetail");

const subjectPerformance =
    document.getElementById("subjectPerformance");

const diagnostic =
    document.getElementById("diagnostic");

const message =
    document.getElementById("message");


/* ============================================================
   FUNÇÕES AUXILIARES
   ============================================================ */

function showError(text) {

    message.className =
        "message error";

    message.textContent =
        text;
}


function clearError() {

    message.className =
        "message";

    message.textContent =
        "";
}


function formatMinutes(minutes) {

    const total =
        Number(minutes || 0);

    const hours =
        Math.floor(total / 60);

    const mins =
        total % 60;


    if (hours === 0) {

        return mins + " min";
    }


    if (mins === 0) {

        return hours + "h";
    }


    return hours +
        "h " +
        mins +
        "min";
}


/* ============================================================
   DATA DE HOJE
   ============================================================ */

function startOfToday() {

    const date =
        new Date();

    date.setHours(
        0,
        0,
        0,
        0
    );

    return date;
}


/* ============================================================
   INÍCIO DA SEMANA - SEGUNDA-FEIRA
   ============================================================ */

function startOfWeek() {

    const date =
        startOfToday();

    const day =
        date.getDay();

    const diff =
        day === 0
            ? 6
            : day - 1;


    date.setDate(
        date.getDate() -
        diff
    );


    return date;
}


/* ============================================================
   LIMPAR DASHBOARD
   ============================================================ */

function resetDashboard() {

    todayMinutes.textContent =
        "--";

    weekMinutes.textContent =
        "--";

    totalQuestionsEl.textContent =
        "--";

    accuracy.textContent =
        "--";

    accuracyDetail.textContent =
        "--";


    subjectPerformance.innerHTML =
        `
        <tr>
            <td
                colspan="6"
                class="empty"
            >
                Selecione um concurso.
            </td>
        </tr>
        `;


    diagnostic.textContent =
        "Quando houver dados suficientes, o AprovaTrack mostrará aqui suas disciplinas mais fortes e seus principais pontos de atenção.";
}


/* ============================================================
   VERIFICAR LOGIN
   ============================================================ */

async function verificarLogin() {

    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .getSession();


    if (
        error ||
        !data.session ||
        !data.session.user
    ) {

        window.location.href =
            "/";

        return false;
    }


    return true;
}


/* ============================================================
   CARREGAR CONCURSOS
   ============================================================ */

async function carregarConcursos() {

    const {
        data,
        error
    } =
        await supabaseClient

            .from("exams")

            .select(
                "id, name, position"
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        showError(
            "Não foi possível carregar seus concursos."
        );

        return;
    }


    examSelect.innerHTML =
        '<option value="">Selecione um concurso</option>';


    (data || []).forEach(
        function(exam) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                exam.id;


            option.textContent =
                exam.position

                    ? exam.name +
                      " — " +
                      exam.position

                    : exam.name;


            examSelect.appendChild(
                option
            );
        }
    );
}


/* ============================================================
   CARREGAR DESEMPENHO
   ============================================================ */

async function carregarDesempenho(
    examId
) {

    clearError();


    if (!examId) {

        resetDashboard();

        return;
    }


    todayMinutes.textContent =
        "...";

    weekMinutes.textContent =
        "...";

    totalQuestionsEl.textContent =
        "...";

    accuracy.textContent =
        "...";

    accuracyDetail.textContent =
        "Carregando...";


    subjectPerformance.innerHTML =
        `
        <tr>
            <td
                colspan="6"
                class="empty"
            >
                Carregando desempenho...
            </td>
        </tr>
        `;


    const [
        subjectsResult,
        sessionsResult,
        questionsResult
    ] =
        await Promise.all(
            [

                /* DISCIPLINAS */

                supabaseClient

                    .from(
                        "exam_subjects"
                    )

                    .select(
                        `
                        subject_id,
                        edital_order,

                        subject:subjects (
                            id,
                            name
                        )
                        `
                    )

                    .eq(
                        "exam_id",
                        examId
                    )

                    .order(
                        "edital_order",
                        {
                            ascending: true
                        }
                    ),


                /* ESTUDOS */

                supabaseClient

                    .from(
                        "study_sessions"
                    )

                    .select(
                        "subject_id, duration_minutes, ended_at, created_at"
                    )

                    .eq(
                        "exam_id",
                        examId
                    ),


                /* QUESTÕES */

                supabaseClient

                    .from(
                        "question_batches"
                    )

                    .select(
                        "subject_id, total_questions, correct_answers, wrong_answers, answered_at"
                    )

                    .eq(
                        "exam_id",
                        examId
                    )

            ]
        );


    if (
        subjectsResult.error ||
        sessionsResult.error ||
        questionsResult.error
    ) {

        console.error(
            subjectsResult.error,
            sessionsResult.error,
            questionsResult.error
        );


        showError(
            "Não foi possível carregar os dados de desempenho."
        );


        resetDashboard();

        return;
    }


    const subjectRows =
        subjectsResult.data ||
        [];


    const sessions =
        sessionsResult.data ||
        [];


    const questionBatches =
        questionsResult.data ||
        [];


/* ============================================================
   TEMPO DE ESTUDO
   ============================================================ */

    const todayStart =
        startOfToday();


    const weekStart =
        startOfWeek();


    let minutesToday =
        0;


    let minutesWeek =
        0;


    sessions.forEach(
        function(session) {

            const referenceDate =
                new Date(
                    session.ended_at ||
                    session.created_at
                );


            const minutes =
                Number(
                    session.duration_minutes ||
                    0
                );


            if (
                referenceDate >=
                todayStart
            ) {

                minutesToday +=
                    minutes;
            }


            if (
                referenceDate >=
                weekStart
            ) {

                minutesWeek +=
                    minutes;
            }
        }
    );


/* ============================================================
   QUESTÕES
   ============================================================ */

    let totalQuestions =
        0;


    let totalCorrect =
        0;


    let totalWrong =
        0;


    questionBatches.forEach(
        function(batch) {

            totalQuestions +=
                Number(
                    batch.total_questions ||
                    0
                );


            totalCorrect +=
                Number(
                    batch.correct_answers ||
                    0
                );


            totalWrong +=
                Number(
                    batch.wrong_answers ||
                    0
                );
        }
    );


    const overallAccuracy =

        totalQuestions > 0

            ? (
                totalCorrect /
                totalQuestions
              ) *
              100

            : 0;


/* ============================================================
   CARDS
   ============================================================ */

    todayMinutes.textContent =
        formatMinutes(
            minutesToday
        );


    weekMinutes.textContent =
        formatMinutes(
            minutesWeek
        );


    totalQuestionsEl.textContent =
        String(
            totalQuestions
        );


    accuracy.textContent =

        totalQuestions > 0

            ? overallAccuracy
                .toFixed(1) +
              "%"

            : "0%";


    accuracyDetail.textContent =

        totalQuestions > 0

            ? totalCorrect +
              " acertos • " +
              totalWrong +
              " erros"

            : "Nenhuma questão registrada";


/* ============================================================
   MAPA POR DISCIPLINA
   ============================================================ */

    const performanceMap =
        new Map();


    subjectRows.forEach(
        function(item) {

            const subject =

                Array.isArray(
                    item.subject
                )

                    ? item.subject[0]

                    : item.subject;


            if (!subject) {

                return;
            }


            performanceMap.set(
                subject.id,
                {

                    id:
                        subject.id,

                    name:
                        subject.name,

                    minutes:
                        0,

                    questions:
                        0,

                    correct:
                        0,

                    wrong:
                        0
                }
            );
        }
    );


/* ============================================================
   TEMPO POR DISCIPLINA
   ============================================================ */

    sessions.forEach(
        function(session) {

            const item =
                performanceMap.get(
                    session.subject_id
                );


            if (item) {

                item.minutes +=
                    Number(
                        session.duration_minutes ||
                        0
                    );
            }
        }
    );


/* ============================================================
   QUESTÕES POR DISCIPLINA
   ============================================================ */

    questionBatches.forEach(
        function(batch) {

            const item =
                performanceMap.get(
                    batch.subject_id
                );


            if (item) {

                item.questions +=
                    Number(
                        batch.total_questions ||
                        0
                    );


                item.correct +=
                    Number(
                        batch.correct_answers ||
                        0
                    );


                item.wrong +=
                    Number(
                        batch.wrong_answers ||
                        0
                    );
            }
        }
    );


    const performance =
        Array.from(
            performanceMap.values()
        );


/* ============================================================
   TABELA
   ============================================================ */

    if (
        performance.length ===
        0
    ) {

        subjectPerformance.innerHTML =
            `
            <tr>
                <td
                    colspan="6"
                    class="empty"
                >
                    Nenhuma disciplina importada para este concurso.
                </td>
            </tr>
            `;

    } else {


        subjectPerformance.innerHTML =
            "";


        performance.forEach(
            function(item) {

                const subjectAccuracy =

                    item.questions > 0

                        ? (
                            item.correct /
                            item.questions
                          ) *
                          100

                        : null;


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML =
                    `
                    <td>
                        ${item.name}
                    </td>

                    <td>
                        ${formatMinutes(item.minutes)}
                    </td>

                    <td>
                        ${item.questions}
                    </td>

                    <td>
                        ${item.correct}
                    </td>

                    <td>
                        ${item.wrong}
                    </td>

                    <td>
                        ${
                            subjectAccuracy === null

                                ? "--"

                                : subjectAccuracy
                                    .toFixed(1) +
                                  "%"
                        }
                    </td>
                    `;


                subjectPerformance
                    .appendChild(
                        row
                    );
            }
        );
    }


    atualizarDiagnostico(
        performance
    );
}


/* ============================================================
   DIAGNÓSTICO
   ============================================================ */

function atualizarDiagnostico(
    performance
) {

    const withQuestions =
        performance.filter(
            function(item) {

                return (
                    item.questions >
                    0
                );
            }
        );


    if (
        withQuestions.length ===
        0
    ) {

        diagnostic.textContent =
            "Ainda não há questões suficientes para calcular pontos fortes e pontos de atenção.";

        return;
    }


    withQuestions.forEach(
        function(item) {

            item.accuracy =

                (
                    item.correct /
                    item.questions
                )
                *
                100;
        }
    );


    const ordered =
        [
            ...withQuestions
        ]
        .sort(
            function(
                a,
                b
            ) {

                return (
                    b.accuracy -
                    a.accuracy
                );
            }
        );


    const best =
        ordered[0];


    const worst =
        ordered[
            ordered.length -
            1
        ];


    if (
        ordered.length ===
        1
    ) {

        diagnostic.textContent =

            "Você já possui dados em " +

            best.name +

            ", com " +

            best.accuracy
                .toFixed(1) +

            "% de aproveitamento. " +

            "Registre questões nas outras disciplinas para obter um diagnóstico comparativo.";


        return;
    }


    diagnostic.textContent =

        "Melhor desempenho: " +

        best.name +

        " (" +

        best.accuracy
            .toFixed(1) +

        "%). Principal ponto de atenção: " +

        worst.name +

        " (" +

        worst.accuracy
            .toFixed(1) +

        "%).";
}


/* ============================================================
   TROCAR CONCURSO
   ============================================================ */

examSelect.addEventListener(
    "change",
    function() {

        carregarDesempenho(
            examSelect.value
        );
    }
);


/* ============================================================
   INICIAR
   ============================================================ */

async function iniciarPagina() {

    const logged =
        await verificarLogin();


    if (!logged) {

        return;
    }


    resetDashboard();


    await carregarConcursos();
}


iniciarPagina();
