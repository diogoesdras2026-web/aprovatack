/* ============================================================
   APROVATRACK
   REGISTRO DE ESTUDOS E QUESTÕES
   ============================================================ */


/* ============================================================
   CONFIGURAÇÃO SUPABASE
   ============================================================ */

const SUPABASE_URL =
   "https://axxgqacfyrzgpgmqjxbp.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_A9ALAeK0ECKMwfrsMH_62g_x-viRpGK";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL="https://axxgqacfyrzgpgmqjxbp.supabase.co";
        SUPABASE_PUBLISHABLE_KEY= "sb_publishable_A9ALAeK0ECKMwfrsMH_62g_x-viRpGK";
    


/* ============================================================
   ELEMENTOS
   ============================================================ */

const examSelect =
    document.getElementById(
        "examSelect"
    );

const subjectSelect =
    document.getElementById(
        "subjectSelect"
    );

const topicSelect =
    document.getElementById(
        "topicSelect"
    );

const activityType =
    document.getElementById(
        "activityType"
    );

const durationMinutes =
    document.getElementById(
        "durationMinutes"
    );

const studyNotes =
    document.getElementById(
        "studyNotes"
    );

const studyMessage =
    document.getElementById(
        "studyMessage"
    );

const studyForm =
    document.getElementById(
        "studyForm"
    );


const questionSubjectSelect =
    document.getElementById(
        "questionSubjectSelect"
    );

const questionTopicSelect =
    document.getElementById(
        "questionTopicSelect"
    );

const totalQuestions =
    document.getElementById(
        "totalQuestions"
    );

const correctAnswers =
    document.getElementById(
        "correctAnswers"
    );

const wrongAnswers =
    document.getElementById(
        "wrongAnswers"
    );

const questionBoard =
    document.getElementById(
        "questionBoard"
    );

const questionSource =
    document.getElementById(
        "questionSource"
    );

const questionDifficulty =
    document.getElementById(
        "questionDifficulty"
    );

const questionMessage =
    document.getElementById(
        "questionMessage"
    );

const questionForm =
    document.getElementById(
        "questionForm"
    );


let currentUser =
    null;

let currentExam =
    null;

let currentExamSubjects =
    [];


/* ============================================================
   MENSAGENS
   ============================================================ */

function showMessage(
    element,
    type,
    text
) {

    element.className =
        "message " +
        type;

    element.textContent =
        text;
}


function clearMessage(
    element
) {

    element.className =
        "message";

    element.textContent =
        "";
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

        return null;
    }


    currentUser =
        data.session.user;


    return currentUser;
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
                "id, name, position, board"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    examSelect.innerHTML =
        '<option value="">Selecione um concurso</option>';


    if (error) {

        console.error(error);

        showMessage(
            studyMessage,
            "error",
            "Não foi possível carregar seus concursos."
        );

        return;
    }


    data.forEach(
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


            option.dataset.board =
                exam.board ||
                "";


            examSelect.appendChild(
                option
            );
        }
    );
}


/* ============================================================
   CARREGAR DISCIPLINAS DO CONCURSO
   ============================================================ */

async function carregarDisciplinas(
    examId
) {

    currentExamSubjects =
        [];


    subjectSelect.innerHTML =
        '<option value="">Carregando disciplinas...</option>';

    questionSubjectSelect.innerHTML =
        '<option value="">Carregando disciplinas...</option>';

    topicSelect.innerHTML =
        '<option value="">Selecione primeiro uma disciplina</option>';

    questionTopicSelect.innerHTML =
        '<option value="">Selecione primeiro uma disciplina</option>';


    if (!examId) {

        subjectSelect.innerHTML =
            '<option value="">Selecione um concurso</option>';

        questionSubjectSelect.innerHTML =
            '<option value="">Selecione um concurso</option>';

        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "exam_subjects"
            )
            .select(
                `
                id,
                exam_id,
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
            );


    if (error) {

        console.error(error);


        subjectSelect.innerHTML =
            '<option value="">Erro ao carregar disciplinas</option>';

        questionSubjectSelect.innerHTML =
            '<option value="">Erro ao carregar disciplinas</option>';

        return;
    }


    currentExamSubjects =
        data ||
        [];


    subjectSelect.innerHTML =
        '<option value="">Selecione uma disciplina</option>';

    questionSubjectSelect.innerHTML =
        '<option value="">Selecione uma disciplina</option>';


    currentExamSubjects.forEach(
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


            const option1 =
                document.createElement(
                    "option"
                );


            option1.value =
                item.id;


            option1.dataset.subjectId =
                subject.id;


            option1.textContent =
                subject.name;


            subjectSelect.appendChild(
                option1
            );


            const option2 =
                option1.cloneNode(
                    true
                );


            questionSubjectSelect
                .appendChild(
                    option2
                );
        }
    );
}


/* ============================================================
   CARREGAR ASSUNTOS
   ============================================================ */

async function carregarTopicos(
    examSubjectId,
    selectElement
) {

    selectElement.innerHTML =
        '<option value="">Carregando assuntos...</option>';


    if (!examSubjectId) {

        selectElement.innerHTML =
            '<option value="">Assunto opcional</option>';

        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient

            .from("topics")

            .select(
                "id, name, parent_id, order_index"
            )

            .eq(
                "exam_subject_id",
                examSubjectId
            )

            .is(
                "parent_id",
                null
            )

            .order(
                "order_index",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);


        selectElement.innerHTML =
            '<option value="">Erro ao carregar assuntos</option>';

        return;
    }


    selectElement.innerHTML =
        '<option value="">Assunto opcional</option>';


    (data || []).forEach(
        function(topic) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                topic.id;


            option.textContent =
                topic.name;


            selectElement.appendChild(
                option
            );
        }
    );
}


/* ============================================================
   PEGAR SUBJECT_ID
   ============================================================ */

function getSubjectIdFromSelect(
    selectElement
) {

    const selected =
        selectElement.options[
            selectElement.selectedIndex
        ];


    return selected
        ?.dataset
        ?.subjectId
        ||
        null;
}


/* ============================================================
   CALCULAR ERROS
   ============================================================ */

function atualizarErros() {

    const total =
        Number(
            totalQuestions.value ||
            0
        );


    const correct =
        Number(
            correctAnswers.value ||
            0
        );


    if (
        correct >
        total
    ) {

        correctAnswers.value =
            total;
    }


    const safeCorrect =
        Math.min(
            Number(
                correctAnswers.value ||
                0
            ),
            total
        );


    wrongAnswers.value =
        Math.max(
            total -
            safeCorrect,
            0
        );
}


/* ============================================================
   TROCAR CONCURSO
   ============================================================ */

examSelect.addEventListener(
    "change",
    async function() {

        const examId =
            examSelect.value;


        const selected =
            examSelect.options[
                examSelect.selectedIndex
            ];


        currentExam =
            examId
                ? {
                    id:
                        examId,

                    board:
                        selected
                            ?.dataset
                            ?.board
                        ||
                        ""
                }
                : null;


        questionBoard.value =
            currentExam
                ?.board
            ||
            "";


        await carregarDisciplinas(
            examId
        );
    }
);


/* ============================================================
   TROCAR DISCIPLINA
   ============================================================ */

subjectSelect.addEventListener(
    "change",
    function() {

        carregarTopicos(
            subjectSelect.value,
            topicSelect
        );
    }
);


questionSubjectSelect.addEventListener(
    "change",
    function() {

        carregarTopicos(
            questionSubjectSelect.value,
            questionTopicSelect
        );
    }
);


/* ============================================================
   QUESTÕES / ERROS
   ============================================================ */

totalQuestions.addEventListener(
    "input",
    atualizarErros
);


correctAnswers.addEventListener(
    "input",
    atualizarErros
);


/* ============================================================
   SALVAR SESSÃO DE ESTUDO
   ============================================================ */

studyForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        clearMessage(
            studyMessage
        );


        const examId =
            examSelect.value;


        const examSubjectId =
            subjectSelect.value;


        const subjectId =
            getSubjectIdFromSelect(
                subjectSelect
            );


        const topicId =
            topicSelect.value
            ||
            null;


        const minutes =
            Number(
                durationMinutes.value ||
                0
            );


        if (
            !examId ||
            !examSubjectId ||
            !subjectId
        ) {

            showMessage(
                studyMessage,
                "error",
                "Selecione concurso e disciplina."
            );

            return;
        }


        if (
            !minutes ||
            minutes < 1
        ) {

            showMessage(
                studyMessage,
                "error",
                "Informe um tempo de estudo válido."
            );

            return;
        }


        const endedAt =
            new Date();


        const startedAt =
            new Date(
                endedAt.getTime()
                -
                minutes *
                60000
            );


        const {
            error
        } =
            await supabaseClient

                .from(
                    "study_sessions"
                )

                .insert(
                    {

                        user_id:
                            currentUser.id,

                        exam_id:
                            examId,

                        subject_id:
                            subjectId,

                        topic_id:
                            topicId,

                        activity_type:
                            activityType.value,

                        started_at:
                            startedAt
                                .toISOString(),

                        ended_at:
                            endedAt
                                .toISOString(),

                        duration_minutes:
                            minutes,

                        notes:
                            studyNotes
                                .value
                                .trim()
                            ||
                            null
                    }
                );


        if (error) {

            console.error(error);


            showMessage(
                studyMessage,
                "error",
                "Erro ao salvar estudo: " +
                error.message
            );

            return;
        }


        showMessage(
            studyMessage,
            "success",
            "✅ Sessão de estudo salva com sucesso!"
        );


        durationMinutes.value =
            "";

        studyNotes.value =
            "";
    }
);


/* ============================================================
   SALVAR QUESTÕES
   ============================================================ */

questionForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        clearMessage(
            questionMessage
        );


        const examId =
            examSelect.value;


        const examSubjectId =
            questionSubjectSelect.value;


        const subjectId =
            getSubjectIdFromSelect(
                questionSubjectSelect
            );


        const topicId =
            questionTopicSelect.value
            ||
            null;


        const total =
            Number(
                totalQuestions.value ||
                0
            );


        const correct =
            Number(
                correctAnswers.value ||
                0
            );


        const wrong =
            total -
            correct;


        if (
            !examId ||
            !examSubjectId ||
            !subjectId
        ) {

            showMessage(
                questionMessage,
                "error",
                "Selecione concurso e disciplina."
            );

            return;
        }


        if (
            total <
            1
        ) {

            showMessage(
                questionMessage,
                "error",
                "Informe pelo menos 1 questão."
            );

            return;
        }


        if (
            correct < 0 ||
            correct > total
        ) {

            showMessage(
                questionMessage,
                "error",
                "O número de acertos deve ficar entre 0 e o total de questões."
            );

            return;
        }


        const {
            data,
            error
        } =
            await supabaseClient

                .from(
                    "question_batches"
                )

                .insert(
                    {

                        user_id:
                            currentUser.id,

                        exam_id:
                            examId,

                        subject_id:
                            subjectId,

                        topic_id:
                            topicId,

                        board:
                            questionBoard
                                .value
                                .trim()
                            ||
                            null,

                        source:
                            questionSource
                                .value
                                .trim()
                            ||
                            null,

                        difficulty:
                            questionDifficulty
                                .value
                            ||
                            null,

                        total_questions:
                            total,

                        correct_answers:
                            correct,

                        wrong_answers:
                            wrong,

                        answered_at:
                            new Date()
                                .toISOString()
                    }
                )

                .select(
                    "id"
                )

                .single();


        if (error) {

            console.error(error);


            showMessage(
                questionMessage,
                "error",
                "Erro ao salvar questões: " +
                error.message
            );

            return;
        }


        const accuracy =
            (
                (
                    correct /
                    total
                )
                *
                100
            )
            .toFixed(
                1
            );


        showMessage(
            questionMessage,
            "success",
            "✅ Questões salvas! " +
            correct +
            "/" +
            total +
            " acertos — " +
            accuracy +
            "%."
        );


        console.log(
            "Lote de questões salvo:",
            data
        );


        totalQuestions.value =
            "";

        correctAnswers.value =
            "";

        wrongAnswers.value =
            "";

        questionSource.value =
            "";

        questionDifficulty.value =
            "";
    }
);


/* ============================================================
   INICIAR
   ============================================================ */

async function iniciarPagina() {

    const user =
        await verificarLogin();


    if (!user) {
        return;
    }


    await carregarConcursos();
}


iniciarPagina();
