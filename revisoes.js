/* ============================================================
   APROVATRACK
   CENTRAL DE REVISÕES
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

const message =
    document.getElementById(
        "message"
    );

const overdueCount =
    document.getElementById(
        "overdueCount"
    );

const todayCount =
    document.getElementById(
        "todayCount"
    );

const futureCount =
    document.getElementById(
        "futureCount"
    );

const overdueReviews =
    document.getElementById(
        "overdueReviews"
    );

const todayReviews =
    document.getElementById(
        "todayReviews"
    );

const futureReviews =
    document.getElementById(
        "futureReviews"
    );


let currentUser =
    null;


/* ============================================================
   MENSAGENS
   ============================================================ */

function showMessage(
    type,
    text
) {

    message.className =
        "message " +
        type;

    message.textContent =
        text;
}


function clearMessage() {

    message.className =
        "message";

    message.textContent =
        "";
}


/* ============================================================
   DATA LOCAL
   ============================================================ */

function dataLocal(
    date = new Date()
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
   FORMATAR DATA
   ============================================================ */

function formatarData(
    value
) {

    if (!value) {

        return "--";
    }


    const parts =
        value.split("-");


    if (
        parts.length !==
        3
    ) {

        return value;
    }


    return (
        parts[2] +
        "/" +
        parts[1] +
        "/" +
        parts[0]
    );
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
   NORMALIZAR RELACIONAMENTO
   ============================================================ */

function normalizarRelacionamento(
    value
) {

    if (
        Array.isArray(
            value
        )
    ) {

        return value[0] ||
            null;
    }


    return value ||
        null;
}


/* ============================================================
   CRIAR CARD DE REVISÃO
   ============================================================ */

function criarCardRevisao(
    review,
    tipo
) {

    const subject =
        normalizarRelacionamento(
            review.subject
        );


    const topic =
        normalizarRelacionamento(
            review.topic
        );


    const container =
        document.createElement(
            "div"
        );


    container.className =
        "review";


    /* CABEÇALHO */

    const header =
        document.createElement(
            "div"
        );


    header.className =
        "review-header";


    const left =
        document.createElement(
            "div"
        );


    const title =
        document.createElement(
            "div"
        );


    title.className =
        "review-title";


    title.textContent =
        subject?.name ||
        "Disciplina";


    const topicElement =
        document.createElement(
            "div"
        );


    topicElement.className =
        "review-topic";


    topicElement.textContent =
        topic?.name ||
        "Revisão geral";


    left.appendChild(
        title
    );


    left.appendChild(
        topicElement
    );


    /* BADGE */

    const badge =
        document.createElement(
            "span"
        );


    badge.className =
        "badge " +
        tipo;


    if (
        tipo ===
        "overdue"
    ) {

        badge.textContent =
            "Atrasada";
    }

    else if (
        tipo ===
        "today"
    ) {

        badge.textContent =
            "Hoje";
    }

    else {

        badge.textContent =
            "Próxima";
    }


    header.appendChild(
        left
    );


    header.appendChild(
        badge
    );


    container.appendChild(
        header
    );


    /* META */

    const meta =
        document.createElement(
            "div"
        );


    meta.className =
        "review-meta";


    const origem =

        review.source_type ===
        "error_log"

            ? "Caderno de erros"

            : review.source_type ||
              "Revisão";


    meta.textContent =

        "Data: " +

        formatarData(
            review.scheduled_date
        )

        +

        " • Origem: " +

        origem;


    container.appendChild(
        meta
    );


    /* BOTÃO */

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.dataset.reviewId =
        review.id;


    button.textContent =
        "✅ Concluir revisão";


    container.appendChild(
        button
    );


    return container;
}


/* ============================================================
   RENDERIZAR LISTA
   ============================================================ */

function renderizarLista(
    element,
    reviews,
    tipo,
    emptyText
) {

    element.innerHTML =
        "";


    if (
        reviews.length ===
        0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "empty";


        empty.textContent =
            emptyText;


        element.appendChild(
            empty
        );


        return;
    }


    reviews.forEach(
        function(review) {

            element.appendChild(
                criarCardRevisao(
                    review,
                    tipo
                )
            );
        }
    );
}


/* ============================================================
   CARREGAR REVISÕES
   ============================================================ */

async function carregarRevisoes() {

    clearMessage();


    overdueCount.textContent =
        "...";

    todayCount.textContent =
        "...";

    futureCount.textContent =
        "...";


    const {
        data,
        error
    } =
        await supabaseClient

            .from("reviews")

            .select(
                `
                id,
                user_id,
                subject_id,
                topic_id,
                source_type,
                source_id,
                scheduled_date,
                status,

                subject:subjects (
                    id,
                    name
                ),

                topic:topics (
                    id,
                    name
                )
                `
            )

            .eq(
                "status",
                "pending"
            )

            .order(
                "scheduled_date",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Erro ao carregar revisões:",
            error
        );


        showMessage(
            "error",
            "Não foi possível carregar suas revisões."
        );


        overdueCount.textContent =
            "0";

        todayCount.textContent =
            "0";

        futureCount.textContent =
            "0";


        return;
    }


    const hoje =
        dataLocal();


    const atrasadas =
        [];

    const hojeLista =
        [];

    const futuras =
        [];


    (data || []).forEach(
        function(review) {

            if (
                review.scheduled_date <
                hoje
            ) {

                atrasadas.push(
                    review
                );
            }

            else if (
                review.scheduled_date ===
                hoje
            ) {

                hojeLista.push(
                    review
                );
            }

            else {

                futuras.push(
                    review
                );
            }
        }
    );


    overdueCount.textContent =
        String(
            atrasadas.length
        );


    todayCount.textContent =
        String(
            hojeLista.length
        );


    futureCount.textContent =
        String(
            futuras.length
        );


    renderizarLista(

        overdueReviews,

        atrasadas,

        "overdue",

        "Nenhuma revisão atrasada. ✅"
    );


    renderizarLista(

        todayReviews,

        hojeLista,

        "today",

        "Nenhuma revisão programada para hoje."
    );


    renderizarLista(

        futureReviews,

        futuras,

        "future",

        "Nenhuma revisão futura."
    );
}


/* ============================================================
   ATUALIZAR CADERNO DE ERROS
   ============================================================ */

async function atualizarErrorLog(
    sourceId
) {

    if (!sourceId) {

        return;
    }


    const {
        data: errorLog,
        error: searchError
    } =
        await supabaseClient

            .from("error_logs")

            .select(
                "id, review_count"
            )

            .eq(
                "id",
                sourceId
            )

            .single();


    if (searchError) {

        console.error(
            "Erro ao localizar error_log:",
            searchError
        );


        throw searchError;
    }


    const novoReviewCount =

        Number(
            errorLog.review_count ||
            0
        )

        +

        1;


    const {
        error: updateError
    } =
        await supabaseClient

            .from("error_logs")

            .update(
                {

                    reviewed:
                        true,

                    review_count:
                        novoReviewCount
                }
            )

            .eq(
                "id",
                sourceId
            );


    if (updateError) {

        console.error(
            "Erro ao atualizar error_log:",
            updateError
        );


        throw updateError;
    }
}


/* ============================================================
   CONCLUIR REVISÃO
   ============================================================ */

async function concluirRevisao(
    reviewId,
    button
) {

    clearMessage();


    button.disabled =
        true;


    button.textContent =
        "Salvando...";


    /*
     * Primeiro buscamos a revisão,
     * porque precisamos saber a origem.
     */

    const {
        data: review,
        error: reviewError
    } =
        await supabaseClient

            .from("reviews")

            .select(
                `
                id,
                source_type,
                source_id,
                status
                `
            )

            .eq(
                "id",
                reviewId
            )

            .single();


    if (
        reviewError ||
        !review
    ) {

        console.error(
            reviewError
        );


        showMessage(
            "error",
            "Não foi possível localizar a revisão."
        );


        button.disabled =
            false;


        button.textContent =
            "✅ Concluir revisão";


        return;
    }


    /*
     * Segurança contra clique duplicado.
     */

    if (
        review.status ===
        "completed"
    ) {

        await carregarRevisoes();

        return;
    }


    const {
        error: updateReviewError
    } =
        await supabaseClient

            .from("reviews")

            .update(
                {

                    status:
                        "completed",

                    completed_date:
                        dataLocal()
                }
            )

            .eq(
                "id",
                reviewId
            );


    if (updateReviewError) {

        console.error(
            updateReviewError
        );


        showMessage(
            "error",
            "Não foi possível concluir a revisão."
        );


        button.disabled =
            false;


        button.textContent =
            "✅ Concluir revisão";


        return;
    }


    /*
     * Se a revisão nasceu do Caderno de Erros,
     * atualizamos também error_logs.
     */

    if (
        review.source_type ===
        "error_log" &&
        review.source_id
    ) {

        try {

            await atualizarErrorLog(
                review.source_id
            );

        } catch (errorLogError) {

            console.error(
                errorLogError
            );


            showMessage(
                "error",
                "A revisão foi concluída, mas o contador do Caderno de Erros não pôde ser atualizado."
            );


            await carregarRevisoes();

            return;
        }
    }


    showMessage(
        "success",
        "✅ Revisão concluída com sucesso!"
    );


    await carregarRevisoes();
}


/* ============================================================
   CLIQUES NOS BOTÕES
   ============================================================ */

async function tratarCliqueRevisao(
    event
) {

    const button =
        event.target.closest(
            "[data-review-id]"
        );


    if (!button) {

        return;
    }


    const reviewId =
        button.dataset.reviewId;


    if (!reviewId) {

        return;
    }


    await concluirRevisao(
        reviewId,
        button
    );
}


overdueReviews.addEventListener(
    "click",
    tratarCliqueRevisao
);


todayReviews.addEventListener(
    "click",
    tratarCliqueRevisao
);


futureReviews.addEventListener(
    "click",
    tratarCliqueRevisao
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


    await carregarRevisoes();
}


iniciarPagina();
