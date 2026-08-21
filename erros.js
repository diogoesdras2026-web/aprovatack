/* ============================================================
   APROVATRACK
   CADERNO DE ERROS
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


const examSelect =
    document.getElementById("examSelect");

const subjectSelect =
    document.getElementById("subjectSelect");

const topicSelect =
    document.getElementById("topicSelect");

const errorType =
    document.getElementById("errorType");

const description =
    document.getElementById("description");

const errorForm =
    document.getElementById("errorForm");

const errorMessage =
    document.getElementById("errorMessage");

const todayReviews =
    document.getElementById("todayReviews");


let currentUser =
    null;


/* ============================================================
   MENSAGEM
   ============================================================ */

function showMessage(
    type,
    text
) {

    errorMessage.className =
        "message " + type;

    errorMessage.textContent =
        text;
}


/* ============================================================
   LOGIN
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


    currentUser =
        data.session.user;


    return true;
}


/* ============================================================
   DATA LOCAL YYYY-MM-DD
   ============================================================ */

function dataLocal(
    date
) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        year +
        "-" +
        month +
        "-" +
        day
    );
}


/* ============================================================
   SOMAR DIAS
   ============================================================ */

function adicionarDias(
    quantidade
) {

    const date =
        new Date();


    date.setDate(
        date.getDate() +
        quantidade
    );


    return dataLocal(
        date
    );
}


/* ============================================================
   CONCURSOS
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


    examSelect.innerHTML =
        '<option value="">Selecione um concurso</option>';


    if (error) {

        console.error(error);

        return;
    }


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
   DISCIPLINAS
   ============================================================ */

async function carregarDisciplinas(
    examId
) {

    subjectSelect.innerHTML =
        '<option value="">Carregando...</option>';


    topicSelect.innerHTML =
        '<option value="">Selecione uma disciplina</option>';


    if (!examId) {

        subjectSelect.innerHTML =
            '<option value="">Selecione um concurso</option>';

        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient

            .from("exam_subjects")

            .select(
                `
                id,
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

        return;
    }


    subjectSelect.innerHTML =
        '<option value="">Selecione uma disciplina</option>';


    (data || []).forEach(
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


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                item.id;


            option.dataset.subjectId =
                subject.id;


            option.textContent =
                subject.name;


            subjectSelect.appendChild(
                option
            );
        }
    );
}


/* ============================================================
   TÓPICOS
   ============================================================ */

async function carregarTopicos(
    examSubjectId
) {

    topicSelect.innerHTML =
        '<option value="">Carregando...</option>';


    if (!examSubjectId) {

        topicSelect.innerHTML =
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

        topicSelect.innerHTML =
            '<option value="">Erro ao carregar assuntos</option>';

        return;
    }


    topicSelect.innerHTML =
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


            topicSelect.appendChild(
                option
            );
        }
    );
}


/* ============================================================
   SUBJECT ID
   ============================================================ */

function getSubjectId() {

    const selected =
        subjectSelect.options[
            subjectSelect.selectedIndex
        ];


    return (
        selected
            ?.dataset
            ?.subjectId
        ||
        null
    );
}


/* ============================================================
   CRIAR REVISÕES
   ============================================================ */

async function criarRevisoes(
    errorId,
    subjectId,
    topicId
) {

    const revisoes =
        [
            {
                dias: 1
            },

            {
                dias: 7
            },

            {
                dias: 30
            }
        ];


    const linhas =
        revisoes.map(
            function(item) {

                return {

                    user_id:
                        currentUser.id,

                    subject_id:
                        subjectId,

                    topic_id:
                        topicId,

                    source_type:
                        "error_log",

                    source_id:
                        errorId,

                    scheduled_date:
                        adicionarDias(
                            item.dias
                        ),

                    completed_date:
                        null,

                    status:
                        "pending"
                };
            }
        );


    const {
        error
    } =
        await supabaseClient

            .from("reviews")

            .insert(
                linhas
            );


    if (error) {

        throw error;
    }
}


/* ============================================================
   REGISTRAR ERRO
   ============================================================ */

errorForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const subjectId =
            getSubjectId();


        const topicId =
            topicSelect.value ||
            null;


        const text =
            description
                .value
                .trim();


        if (!subjectId) {

            showMessage(
                "error",
                "Selecione uma disciplina."
            );

            return;
        }


        if (!text) {

            showMessage(
                "error",
                "Descreva o erro cometido."
            );

            return;
        }


        const {
            data,
            error
        } =
            await supabaseClient

                .from("error_logs")

                .insert(
                    {

                        user_id:
                            currentUser.id,

                        subject_id:
                            subjectId,

                        topic_id:
                            topicId,

                        question_batch_id:
                            null,

                        error_type:
                            errorType.value,

                        description:
                            text,

                        reviewed:
                            false,

                        review_count:
                            0
                    }
                )

                .select("id")

                .single();


        if (error) {

            console.error(error);


            showMessage(
                "error",
                "Erro ao registrar: " +
                error.message
            );

            return;
        }


        try {

            await criarRevisoes(
                data.id,
                subjectId,
                topicId
            );


            showMessage(
                "success",
                "✅ Erro registrado! Revisões programadas para 1, 7 e 30 dias."
            );


            description.value =
                "";


            await carregarRevisoesHoje();


        } catch (reviewError) {

            console.error(
                reviewError
            );


            showMessage(
                "error",
                "O erro foi salvo, mas não foi possível criar as revisões."
            );
        }
    }
);


/* ============================================================
   REVISÕES DE HOJE
   ============================================================ */

async function carregarRevisoesHoje() {

    const hoje =
        dataLocal(
            new Date()
        );


    const {
        data,
        error
    } =
        await supabaseClient

            .from("reviews")

            .select(
                `
                id,
                subject_id,
                topic_id,
                scheduled_date,
                status,

                subject:subjects (
                    name
                ),

                topic:topics (
                    name
                )
                `
            )

            .eq(
                "scheduled_date",
                hoje
            )

            .eq(
                "status",
                "pending"
            )

            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);


        todayReviews.innerHTML =
            '<div class="empty">Não foi possível carregar as revisões.</div>';

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        todayReviews.innerHTML =
            '<div class="empty">Nenhuma revisão programada para hoje. ✅</div>';

        return;
    }


    todayReviews.innerHTML =
        "";


    data.forEach(
        function(review) {

            const subject =

                Array.isArray(
                    review.subject
                )

                    ? review.subject[0]

                    : review.subject;


            const topic =

                Array.isArray(
                    review.topic
                )

                    ? review.topic[0]

                    : review.topic;


            const container =
                document.createElement(
                    "div"
                );


            container.className =
                "review";


            container.innerHTML =
                `
                <div class="review-title">
                    ${subject?.name || "Disciplina"}
                </div>

                <div class="review-detail">
                    ${topic?.name || "Revisão geral"}
                </div>

                <div style="margin-top:12px;">
                    <button
                        type="button"
                        data-review-id="${review.id}"
                    >
                        ✅ Concluir revisão
                    </button>
                </div>
                `;


            todayReviews.appendChild(
                container
            );
        }
    );
}


/* ============================================================
   CONCLUIR REVISÃO
   ============================================================ */

todayReviews.addEventListener(
    "click",
    async function(event) {

        const button =
            event.target.closest(
                "[data-review-id]"
            );


        if (!button) {
            return;
        }


        const reviewId =
            button.dataset.reviewId;


        button.disabled =
            true;


        button.textContent =
            "Salvando...";


        const {
            error
        } =
            await supabaseClient

                .from("reviews")

                .update(
                    {

                        status:
                            "completed",

                        completed_date:
                            dataLocal(
                                new Date()
                            )
                    }
                )

                .eq(
                    "id",
                    reviewId
                );


        if (error) {

            console.error(error);


            button.disabled =
                false;


            button.textContent =
                "✅ Concluir revisão";


            return;
        }


        await carregarRevisoesHoje();
    }
);


/* ============================================================
   EVENTOS
   ============================================================ */

examSelect.addEventListener(
    "change",
    function() {

        carregarDisciplinas(
            examSelect.value
        );
    }
);


subjectSelect.addEventListener(
    "change",
    function() {

        carregarTopicos(
            subjectSelect.value
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


    await carregarConcursos();

    await carregarRevisoesHoje();
}


iniciarPagina();
