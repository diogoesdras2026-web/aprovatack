/* ============================================================
   APROVATRACK - MODO PARETO POR URL
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
const paretoRankingSection =
    document.getElementById(
        "paretoRankingSection"
    );

const paretoRankingList =
    document.getElementById(
        "paretoRankingList"
    );
const examSelect =
    document.getElementById(
        "examSelect"
    );

const sourceUrl =
    document.getElementById(
        "sourceUrl"
    );

const analyzeUrlButton =
    document.getElementById(
        "analyzeUrlButton"
    );

const message =
    document.getElementById(
        "message"
    );

const summarySection =
    document.getElementById(
        "summarySection"
    );

const foundCount =
    document.getElementById(
        "foundCount"
    );

const highCount =
    document.getElementById(
        "highCount"
    );

const officialCount =
    document.getElementById(
        "officialCount"
    );

const approvedCount =
    document.getElementById(
        "approvedCount"
    );

const candidateList =
    document.getElementById(
        "candidateList"
    );


let currentCandidates =
    [];


/* ============================================================
   MENSAGENS
   ============================================================ */

function mostrarMensagem(
    tipo,
    texto
) {

    message.className =
        "message " +
        tipo;

    message.textContent =
        texto;
}


function limparMensagem() {

    message.className =
        "message";

    message.textContent =
        "";
}


/* ============================================================
   NORMALIZAÇÃO
   ============================================================ */

function normalizarTextoPareto(
    valor
) {

    return String(
        valor || ""
    )
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .trim()
        .toLowerCase();
}


/* ============================================================
   URL
   ============================================================ */

function urlValida(
    valor
) {

    try {

        const url =
            new URL(
                valor
            );


        return (
            url.protocol ===
            "http:"

            ||

            url.protocol ===
            "https:"
        );

    } catch {

        return false;
    }
}


function atualizarBotaoAnalise() {

    const temConcurso =
        Boolean(
            examSelect.value
        );


    const temUrlValida =
        urlValida(
            sourceUrl
                .value
                .trim()
        );


    analyzeUrlButton.disabled =
        !(
            temConcurso &&
            temUrlValida
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


    return true;
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
            .from(
                "exams"
            )
            .select(
                "id, name, position"
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    examSelect.innerHTML =
        '<option value="">Selecione um concurso</option>';


    if (error) {

        console.error(
            "Erro ao carregar concursos:",
            error
        );


        mostrarMensagem(
            "error",
            "Não foi possível carregar seus concursos."
        );

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        mostrarMensagem(
            "info",
            "Cadastre um concurso antes de usar o Modo Pareto."
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
                    ? (
                        exam.name +
                        " — " +
                        exam.position
                    )
                    : exam.name;


            examSelect.appendChild(
                option
            );
        }
    );


    if (
        data.length === 1
    ) {

        examSelect.value =
            data[0].id;

/* ============================================================
   CARREGAR RANKING PARETO
   ============================================================ */

async function carregarRankingPareto() {

    const examId =
        examSelect.value;


    if (!examId) {

        paretoRankingSection
            .classList
            .add(
                "hidden"
            );

        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "exam_topic_priorities"
            )
            .select(
                `
                historical_questions,
                sample_exams,
                frequency_percent,
                cumulative_percent,
                pareto_class,
                priority_score,

                topic:topics (
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
                "cumulative_percent",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Erro ao carregar ranking Pareto:",
            error
        );

        paretoRankingSection
            .classList
            .add(
                "hidden"
            );

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        paretoRankingList.innerHTML =
            `
            <div
                style="
                    color:#64748b;
                "
            >
                Nenhum ranking Pareto calculado ainda.
            </div>
            `;


        paretoRankingSection
            .classList
            .remove(
                "hidden"
            );

        return;
    }


    let html =
        "";


    data.forEach(
        function(item, index) {

            const topic =
                Array.isArray(
                    item.topic
                )
                    ? item.topic[0]
                    : item.topic;


            const classe =
                item.pareto_class ||
                "C";


            let classeLabel =
                "Menor incidência";


            let classeIcon =
                "🟢";


            if (
                classe === "A"
            ) {

                classeLabel =
                    "Alta prioridade";

                classeIcon =
                    "🔥";
            }


            else if (
                classe === "B"
            ) {

                classeLabel =
                    "Prioridade média";

                classeIcon =
                    "🟡";
            }


            html +=
                `
                <div
                    style="
                        padding:14px 0;
                        border-bottom:1px solid #e5e7eb;
                    "
                >

                    <div
                        style="
                            display:flex;
                            justify-content:space-between;
                            gap:15px;
                            align-items:flex-start;
                        "
                    >

                        <div>

                            <div
                                style="
                                    font-weight:700;
                                    line-height:1.4;
                                "
                            >
                                ${index + 1}.
                                ${topic?.name || "Assunto"}
                            </div>

                            <div
                                style="
                                    margin-top:5px;
                                    color:#64748b;
                                    font-size:13px;
                                "
                            >
                                ${classeIcon}
                                Classe ${classe}
                                —
                                ${classeLabel}
                            </div>

                        </div>


                        <div
                            style="
                                font-weight:700;
                                white-space:nowrap;
                            "
                        >
                            ${Number(
                                item.frequency_percent ||
                                0
                            ).toFixed(2)}%
                        </div>

                    </div>


                    <div
                        style="
                            margin-top:8px;
                            font-size:13px;
                            color:#64748b;
                        "
                    >
                        Acumulado:
                        ${Number(
                            item.cumulative_percent ||
                            0
                        ).toFixed(2)}%

                        ·

                        Provas:
                        ${Number(
                            item.sample_exams ||
                            0
                        )}

                        ·

                        Questões ponderadas:
                        ${Number(
                            item.historical_questions ||
                            0
                        ).toFixed(2)}
                    </div>

                </div>
                `;
        }
    );


    paretoRankingList.innerHTML =
        html;


    paretoRankingSection
        .classList
        .remove(
            "hidden"
        );
}
        await carregarCandidatos();
    }


    atualizarBotaoAnalise();
}


/* ============================================================
   BADGE DE COBERTURA
   ============================================================ */

function badgeCobertura(
    coverage
) {

    const valor =
        Number(
            coverage || 0
        );


    if (
        valor >= 85
    ) {

        return `
            <span
                style="
                    color:#166534;
                    font-weight:bold;
                "
            >
                🟢 Excelente
            </span>
        `;
    }


    if (
        valor >= 70
    ) {

        return `
            <span
                style="
                    color:#b45309;
                    font-weight:bold;
                "
            >
                🟡 Parcial
            </span>
        `;
    }


    return `
        <span
            style="
                color:#b91c1c;
                font-weight:bold;
            "
        >
            🔴 Baixa cobertura
        </span>
    `;
}


/* ============================================================
   SIMILARIDADE
   ============================================================ */

function getScoreClass(
    score
) {

    const value =
        Number(
            score || 0
        );


    if (
        value >= 85
    ) {

        return "very-high";
    }


    if (
        value >= 70
    ) {

        return "high";
    }


    if (
        value >= 55
    ) {

        return "medium";
    }


    return "low";
}


function getScoreLabel(
    score
) {

    const value =
        Number(
            score || 0
        );


    if (
        value >= 85
    ) {

        return "Muito semelhante";
    }


    if (
        value >= 70
    ) {

        return "Semelhante";
    }


    if (
        value >= 55
    ) {

        return "Complementar";
    }


    return "Baixa similaridade";
}


/* ============================================================
   TAGS
   ============================================================ */

function criarTag(
    texto,
    classeExtra = ""
) {

    const tag =
        document.createElement(
            "span"
        );


    tag.className =
        "tag " +
        classeExtra;


    tag.textContent =
        texto;


    return tag;
}


/* ============================================================
   RAZÕES DA SIMILARIDADE
   ============================================================ */

function criarRazoes(
    candidate
) {

    const reasons =

        Array.isArray(
            candidate.similarity_reasons
        )

            ? candidate.similarity_reasons

            : [];


    if (
        reasons.length ===
        0
    ) {

        return null;
    }


    const container =
        document.createElement(
            "div"
        );


    container.style.marginTop =
        "15px";


    container.style.fontSize =
        "13px";


    container.style.color =
        "#64748b";


    const title =
        document.createElement(
            "strong"
        );


    title.textContent =
        "Critérios de similaridade:";


    container.appendChild(
        title
    );


    reasons.forEach(
        function(reason) {

            const line =
                document.createElement(
                    "div"
                );


            line.style.marginTop =
                "5px";


            line.textContent =

                "+" +

                Number(
                    reason?.points ||
                    0
                )

                +

                " — "

                +

                (
                    reason?.label ||
                    "Critério"
                );


            container.appendChild(
                line
            );
        }
    );


    return container;
}

/* ============================================================
   APROVAÇÃO POR MATÉRIA
   ============================================================ */

function montarConteudo(
    candidate
) {

    const reviews =
        Array.isArray(
            candidate.subject_reviews
        )
            ? candidate.subject_reviews
            : [];


    /* --------------------------------------------------------
       NENHUMA MATÉRIA ENCONTRADA
       -------------------------------------------------------- */

    if (
        reviews.length === 0
    ) {

        return `
            <div
                style="
                    margin-top:16px;
                    padding:15px;
                    background:#f8fafc;
                    border-radius:10px;
                    color:#64748b;
                "
            >
                Nenhuma matéria disponível para revisão.
            </div>
        `;
    }


    /* --------------------------------------------------------
       CABEÇALHO DA ÁREA DE MATÉRIAS
       -------------------------------------------------------- */

    let html =
        `
        <div
            style="
                margin-top:16px;
                padding:15px;
                background:#f8fafc;
                border-radius:10px;
            "
        >

            <strong>
                📊 Aprovação por matéria
            </strong>
        `;


    /* --------------------------------------------------------
       PERCORRER MATÉRIAS
       -------------------------------------------------------- */

    reviews.forEach(
        function(review) {

            const coverage =
                Number(
                    review.coverage_percent ||
                    0
                );


            const status =
                review.status ||
                "pending";


            /* =================================================
               REGRAS DE APROVAÇÃO
               ================================================= */

            const podeAprovar =
                coverage >= 85;


            const podeRessalva =
                coverage >= 70 &&
                coverage < 85;


            const podeRefinar =
                coverage < 85;


            /* =================================================
               AVISO DE COBERTURA BAIXA
               ================================================= */

            let avisoCobertura =
                "";


            if (
                coverage < 70
            ) {

                avisoCobertura =
                    `
                    <div
                        style="
                            margin-top:10px;
                            padding:10px;
                            border-radius:8px;
                            background:#fef2f2;
                            color:#991b1b;
                            font-size:13px;
                            line-height:1.5;
                        "
                    >
                        A classificação quantitativa desta matéria
                        ainda não é confiável o suficiente para
                        entrar no Pareto.

                        Use o refinamento questão por questão
                        antes de aprovar.
                    </div>
                    `;
            }


            /* =================================================
               BOTÃO DE REFINAMENTO
               ================================================= */

            let botaoRefinamento =
                "";


            if (
                podeRefinar
            ) {

                botaoRefinamento =
                    `
                    <div
                        style="
                            margin-top:12px;
                        "
                    >

                        <button
                            type="button"
                            class="action-button"
                            style="
                                background:#7c3aed;
                                color:white;
                            "
                            data-refine-review-id="${review.id}"
                        >
                            🎯 Refinar questão por questão
                        </button>

                    </div>
                    `;
            }


            /* =================================================
               CARD DA MATÉRIA
               ================================================= */

            html +=
                `
                <div
                    style="
                        margin-top:16px;
                        padding:14px;
                        background:white;
                        border:1px solid #e5e7eb;
                        border-radius:10px;
                    "
                >

                    <div
                        style="
                            font-weight:bold;
                            font-size:16px;
                        "
                    >
                        ${review.subject_name}
                    </div>


                    <div
                        style="
                            margin-top:7px;
                            color:#64748b;
                            line-height:1.6;
                        "
                    >

                        Questões da matéria:
                        <strong>
                            ${Number(
                                review.question_count ||
                                0
                            )}
                        </strong>

                        <br>

                        Questões classificadas:
                        <strong>
                            ${Number(
                                review.classified_questions ||
                                0
                            )}
                        </strong>

                        <br>

                        Cobertura:
                        <strong>
                            ${coverage.toFixed(1)}%
                        </strong>

                        —

                        ${badgeCobertura(
                            coverage
                        )}

                    </div>


                    ${avisoCobertura}


                    ${botaoRefinamento}


                    <div
                        style="
                            display:flex;
                            flex-wrap:wrap;
                            gap:8px;
                            margin-top:12px;
                        "
                    >

                        <!-- ===================================
                             APROVAR
                             =================================== -->

                        <button
                            type="button"
                            class="action-button approve"
                            data-subject-action="approved"
                            data-review-id="${review.id}"
                            ${
                                !podeAprovar ||
                                status === "approved"
                                    ? "disabled"
                                    : ""
                            }
                        >
                            ${
                                status === "approved"
                                    ? "✅ Aprovada"
                                    : podeAprovar
                                        ? "✅ Aprovar"
                                        : "🔒 Cobertura insuficiente"
                            }
                        </button>


                        <!-- ===================================
                             APROVAR COM RESSALVA
                             =================================== -->

                        <button
                            type="button"
                            class="action-button"
                            style="
                                background:#fff7ed;
                                color:#c2410c;
                            "
                            data-subject-action="approved_partial"
                            data-review-id="${review.id}"
                            ${
                                !podeRessalva ||
                                status === "approved_partial"
                                    ? "disabled"
                                    : ""
                            }
                        >
                            ${
                                status === "approved_partial"
                                    ? "⚠️ Aprovada com ressalva"
                                    : podeRessalva
                                        ? "⚠️ Aprovar com ressalva"
                                        : "🔒 Ressalva indisponível"
                            }
                        </button>


                        <!-- ===================================
                             DESCARTAR
                             =================================== -->

                        <button
                            type="button"
                            class="action-button reject"
                            data-subject-action="rejected"
                            data-review-id="${review.id}"
                            ${
                                status === "rejected"
                                    ? "disabled"
                                    : ""
                            }
                        >
                            ${
                                status === "rejected"
                                    ? "❌ Descartada"
                                    : "❌ Descartar"
                            }
                        </button>

                    </div>

                </div>
                `;
        }
    );


    html +=
        "</div>";


    return html;
}
/* ============================================================
   CARD DA PROVA
   ============================================================ */

function criarCandidateCard(
    candidate
) {

    const container =
        document.createElement(
            "div"
        );


    container.className =
        "candidate";


    const top =
        document.createElement(
            "div"
        );


    top.className =
        "candidate-top";


    const left =
        document.createElement(
            "div"
        );


    const title =
        document.createElement(
            "div"
        );


    title.className =
        "candidate-title";


    title.textContent =
        candidate.title ||
        "Prova anterior";


    left.appendChild(
        title
    );


    const meta =
        document.createElement(
            "div"
        );


    meta.className =
        "candidate-meta";


    const parts =
        [];


    if (
        candidate.board
    ) {

        parts.push(
            candidate.board
        );
    }


    if (
        candidate.position
    ) {

        parts.push(
            candidate.position
        );
    }


    if (
        candidate.organization
    ) {

        parts.push(
            candidate.organization
        );
    }


    if (
        candidate.exam_year
    ) {

        parts.push(
            String(
                candidate.exam_year
            )
        );
    }


    meta.textContent =
        parts.join(
            " • "
        );


    left.appendChild(
        meta
    );


    top.appendChild(
        left
    );


    const score =
        document.createElement(
            "div"
        );


    score.className =

        "score " +

        getScoreClass(
            candidate.similarity_score
        );


    score.textContent =

        Math.round(
            Number(
                candidate.similarity_score ||
                0
            )
        )

        +

        "/100";


    top.appendChild(
        score
    );


    container.appendChild(
        top
    );


    const scoreLabel =
        document.createElement(
            "div"
        );


    scoreLabel.style.marginTop =
        "10px";


    scoreLabel.style.fontWeight =
        "bold";


    scoreLabel.textContent =
        getScoreLabel(
            candidate.similarity_score
        );


    container.appendChild(
        scoreLabel
    );


    const tags =
        document.createElement(
            "div"
        );


    tags.className =
        "tags";


    if (
        candidate.is_official
    ) {

        tags.appendChild(
            criarTag(
                "✅ Fonte oficial",
                "official"
            )
        );
    }


    if (
        candidate.has_exam
    ) {

        tags.appendChild(
            criarTag(
                "📄 Prova"
            )
        );
    }


    if (
        candidate.has_answer_key
    ) {

        tags.appendChild(
            criarTag(
                "✅ Gabarito"
            )
        );
    }


    if (
        candidate.source_domain
    ) {

        tags.appendChild(
            criarTag(
                candidate.source_domain
            )
        );
    }


    container.appendChild(
        tags
    );


    const reasons =
        criarRazoes(
            candidate
        );


    if (
        reasons
    ) {

        container.appendChild(
            reasons
        );
    }


    const contentWrapper =
        document.createElement(
            "div"
        );


    contentWrapper.innerHTML =
        montarConteudo(
            candidate
        );


    while (
        contentWrapper.firstChild
    ) {

        container.appendChild(
            contentWrapper.firstChild
        );
    }


    if (
        candidate.source_url
    ) {

        const link =
            document.createElement(
                "a"
            );


        link.className =
            "link";


        link.href =
            candidate.source_url;


        link.target =
            "_blank";


        link.rel =
            "noopener noreferrer";


        link.textContent =
            "🔗 Abrir fonte original";


        container.appendChild(
            link
        );
    }


    return container;
}
/* ============================================================
   RESUMO
   ============================================================ */

function atualizarResumo() {

    const total =
        currentCandidates.length;


    const high =
        currentCandidates.filter(
            function(candidate) {

                return (
                    Number(
                        candidate.similarity_score ||
                        0
                    ) >=
                    85
                );
            }
        ).length;


    const official =
        currentCandidates.filter(
            function(candidate) {

                return (
                    candidate.is_official ===
                    true
                );
            }
        ).length;


    const approvedSubjects =
        currentCandidates.reduce(
            function(
                totalApproved,
                candidate
            ) {

                const reviews =

                    Array.isArray(
                        candidate.subject_reviews
                    )

                        ? candidate.subject_reviews

                        : [];


                return (

                    totalApproved

                    +

                    reviews.filter(
                        function(review) {

                            return (
                                review.status ===
                                "approved"

                                ||

                                review.status ===
                                "approved_partial"
                            );
                        }
                    ).length
                );
            },
            0
        );


    foundCount.textContent =
        String(
            total
        );


    highCount.textContent =
        String(
            high
        );


    officialCount.textContent =
        String(
            official
        );


    approvedCount.textContent =
        String(
            approvedSubjects
        );


    if (
        total >
        0
    ) {

        summarySection
            .classList
            .remove(
                "hidden"
            );

    } else {

        summarySection
            .classList
            .add(
                "hidden"
            );
    }
}


/* ============================================================
   RENDERIZAÇÃO
   ============================================================ */

function renderizarCandidatos() {

    candidateList.innerHTML =
        "";


    if (
        currentCandidates.length ===
        0
    ) {

        candidateList.innerHTML =
            `
            <div class="empty">
                Nenhuma prova foi analisada para este concurso.

                <br><br>

                Cole acima a URL pública de uma prova anterior.
            </div>
            `;


        atualizarResumo();


        return;
    }


    currentCandidates.sort(
        function(
            a,
            b
        ) {

            return (

                Number(
                    b.similarity_score ||
                    0
                )

                -

                Number(
                    a.similarity_score ||
                    0
                )
            );
        }
    );


    currentCandidates.forEach(
        function(candidate) {

            candidateList.appendChild(
                criarCandidateCard(
                    candidate
                )
            );
        }
    );


    atualizarResumo();
}


/* ============================================================
   CARREGAR PROVAS + MATÉRIAS
   ============================================================ */

async function carregarCandidatos() {

    const examId =
        examSelect.value;


    if (!examId) {

        currentCandidates =
            [];


        renderizarCandidatos();
await carregarRankingPareto();

        return;
    }


    candidateList.innerHTML =
        `
        <div class="empty">
            Carregando provas analisadas...
        </div>
        `;


    const {
        data,
        error
    } =
        await supabaseClient

            .from(
                "exam_research_candidates"
            )

            .select("*")

            .eq(
                "exam_id",
                examId
            )

            .order(
                "similarity_score",
                {
                    ascending:
                        false
                }
            );


    if (error) {

        console.error(
            "Erro ao carregar provas:",
            error
        );


        mostrarMensagem(
            "error",
            "Erro ao carregar provas analisadas."
        );


        currentCandidates =
            [];


        renderizarCandidatos();


        return;
    }


    currentCandidates =
        data ||
        [];


    /* ========================================================
       CARREGAR AS MATÉRIAS DE CADA PROVA
       ======================================================== */

    for (
        const candidate
        of currentCandidates
    ) {

        const {
            data: reviews,
            error:
                reviewsError
        } =
            await supabaseClient

                .from(
                    "past_exam_subject_reviews"
                )

                .select(
                    `
                    id,
                    candidate_id,
                    subject_name,
                    normalized_subject_name,
                    question_count,
                    classified_questions,
                    coverage_percent,
                    status,
                    statistical_weight,
                    approved_at
                    `
                )

                .eq(
                    "candidate_id",
                    candidate.id
                )

                .order(
                    "subject_name",
                    {
                        ascending:
                            true
                    }
                );


        if (
            reviewsError
        ) {

            console.error(
                "Erro ao carregar matérias:",
                reviewsError
            );


            candidate.subject_reviews =
                [];

        } else {

            candidate.subject_reviews =
                reviews ||
                [];
        }
    }


    renderizarCandidatos();
}
/* ============================================================
   ANALISAR URL
   ============================================================ */

async function analisarUrl() {

    const examId =
        examSelect.value;


    const url =
        sourceUrl
            .value
            .trim();


    if (!examId) {

        mostrarMensagem(
            "error",
            "Selecione um concurso."
        );


        return;
    }


    if (
        !urlValida(
            url
        )
    ) {

        mostrarMensagem(
            "error",
            "Informe uma URL pública válida."
        );


        return;
    }


    analyzeUrlButton.disabled =
        true;


    analyzeUrlButton.textContent =
        "🤖 Analisando...";


    mostrarMensagem(
        "info",
        "A IA está analisando a prova. Aguarde..."
    );


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .functions
                .invoke(
                    "analisar-prova-url",
                    {
                        body: {

                            exam_id:
                                examId,

                            source_url:
                                url
                        }
                    }
                );


        if (error) {

            console.error(
                "Erro na Edge Function:",
                error
            );


            throw new Error(
                error.message ||
                "Falha ao chamar a função."
            );
        }


        if (
            !data ||
            data.ok !== true
        ) {

            throw new Error(
                data?.error ||
                "A análise não foi concluída."
            );
        }


        mostrarMensagem(
            "success",

            "✅ Prova analisada! " +

            Number(
                data.subjects_found ||
                0
            )

            +

            " disciplina(s) e " +

            Number(
                data.topics_found ||
                0
            )

            +

            " assunto(s) identificados."
        );


        sourceUrl.value =
            "";


        await carregarCandidatos();


    } catch (error) {

        console.error(
            "Erro análise URL:",
            error
        );


        mostrarMensagem(
            "error",

            "Erro ao analisar a prova: " +

            (
                error?.message ||
                "erro desconhecido"
            )
        );


    } finally {

        analyzeUrlButton.textContent =
            "🤖 Analisar prova pela URL";


        atualizarBotaoAnalise();
    }
}
/* ============================================================
   LOCALIZAR SUBJECT_ID
   ============================================================ */

async function localizarSubjectId(
    nomeMateria
) {

    const examId =
        examSelect.value;


    const nomeNormalizado =
        normalizarTextoPareto(
            nomeMateria
        );


    /* ========================================================
       1. TENTAR NOME EXATO NAS DISCIPLINAS DO EDITAL
       ======================================================== */

    const {
        data: examSubjects,
        error: examSubjectsError
    } =
        await supabaseClient

            .from(
                "exam_subjects"
            )

            .select(
                `
                subject_id,

                subject:subjects (
                    id,
                    name
                )
                `
            )

            .eq(
                "exam_id",
                examId
            );


    if (
        examSubjectsError
    ) {

        throw examSubjectsError;
    }


    for (
        const item
        of examSubjects || []
    ) {

        const subject =

            Array.isArray(
                item.subject
            )

                ? item.subject[0]

                : item.subject;


        if (!subject) {

            continue;
        }


        if (
            normalizarTextoPareto(
                subject.name
            )

            ===

            nomeNormalizado
        ) {

            return subject.id;
        }
    }


    /* ========================================================
       2. PROCURAR MAPEAMENTO DE EQUIVALÊNCIA
       ======================================================== */

    const {
        data: mapping,
        error: mappingError
    } =
        await supabaseClient

            .from(
                "subject_mappings"
            )

            .select(
                `
                target_subject_id,
                confidence,
                source
                `
            )

            .eq(
                "exam_id",
                examId
            )

            .eq(
                "historical_subject_normalized",
                nomeNormalizado
            )

            .maybeSingle();


    if (
        mappingError
    ) {

        throw mappingError;
    }


    if (
        mapping?.target_subject_id
    ) {

        console.log(
            "Mapeamento Pareto utilizado:",
            nomeMateria,
            "→",
            mapping.target_subject_id
        );


        return mapping.target_subject_id;
    }


    /* ========================================================
       3. ÚLTIMA TENTATIVA NO CATÁLOGO GLOBAL
       ======================================================== */

    const {
        data: subjects,
        error: subjectsError
    } =
        await supabaseClient

            .from(
                "subjects"
            )

            .select(
                "id, name"
            );


    if (
        subjectsError
    ) {

        throw subjectsError;
    }


    const encontrado =
        (subjects || [])
            .find(
                function(subject) {

                    return (

                        normalizarTextoPareto(
                            subject.name
                        )

                        ===

                        nomeNormalizado
                    );
                }
            );


    if (
        encontrado
    ) {

        return encontrado.id;
    }


    return null;
}
/* ============================================================
   OBTER OU CRIAR PROVA HISTÓRICA
   ============================================================ */

async function obterPastExam(
    candidate
) {

    const {
        data: userData,
        error: userError
    } =
        await supabaseClient
            .auth
            .getUser();


    if (
        userError ||
        !userData?.user
    ) {

        throw new Error(
            "Usuário não autenticado."
        );
    }


    const userId =
        userData.user.id;


    /* ========================================================
       TENTAR REUTILIZAR PROVA JÁ CADASTRADA
       ======================================================== */

    const {
        data: existing,
        error: existingError
    } =
        await supabaseClient

            .from(
                "past_exams"
            )

            .select(
                "id"
            )

            .eq(
                "user_id",
                userId
            )

            .eq(
                "source_url",
                candidate.source_url
            )

            .maybeSingle();


    if (
        existingError
    ) {

        throw existingError;
    }


    if (
        existing?.id
    ) {

        return {
            id:
                existing.id
        };
    }


    /* ========================================================
       CALCULAR TOTAL DE QUESTÕES
       ======================================================== */

    const metadata =
        candidate.source_metadata &&
        typeof candidate.source_metadata ===
            "object"

            ? candidate.source_metadata

            : {};


    const subjects =
        Array.isArray(
            metadata.subjects
        )

            ? metadata.subjects

            : [];


    const totalQuestions =
        subjects.reduce(
            function(
                total,
                subject
            ) {

                return (
                    total +

                    Number(
                        subject?.question_count ||
                        0
                    )
                );
            },
            0
        );


    /* ========================================================
       CRIAR PROVA HISTÓRICA
       ======================================================== */

    const {
        data: created,
        error: createError
    } =
        await supabaseClient

            .from(
                "past_exams"
            )

            .insert(
                {
                    user_id:
                        userId,

                    board:
                        candidate.board ||
                        "Não informada",

                    organization:
                        candidate.organization ||
                        null,

                    position:
                        candidate.position ||
                        null,

                    position_family:
                        candidate.position_family ||
                        null,

                    area:
                        candidate.area ||
                        null,

                    exam_year:
                        candidate.exam_year ||
                        null,

                    exam_date:
                        candidate.exam_date ||
                        null,

                    total_questions:
                        totalQuestions > 0
                            ? totalQuestions
                            : null,

                    source_name:
                        candidate.title ||
                        "Prova anterior",

                    source_url:
                        candidate.source_url,

                    verified:
                        false,

                    notes:
                        "Importada pelo Modo Pareto"
                }
            )

            .select(
                "id"
            )

            .single();


    if (
        createError
    ) {

        throw createError;
    }


    return created;
}
/* ============================================================
   IMPORTAR MATÉRIA HISTÓRICA
   FONTE: CLASSIFICAÇÃO INDIVIDUAL DAS QUESTÕES
   ============================================================ */

async function importarMateriaHistorica(
    candidate,
    review,
    statisticalWeight
) {

    /* ========================================================
       1. LOCALIZAR DISCIPLINA DO EDITAL ATUAL
       ======================================================== */

    const subjectId =
        await localizarSubjectId(
            review.subject_name
        );


    if (!subjectId) {

        throw new Error(
            "Não encontrei '" +
            review.subject_name +
            "' entre as disciplinas cadastradas."
        );
    }


    /* ========================================================
       2. OBTER OU CRIAR PROVA HISTÓRICA
       ======================================================== */

    const pastExam =
        await obterPastExam(
            candidate
        );


    const pastExamId =
        typeof pastExam === "object"
            ? pastExam.id
            : pastExam;


    if (!pastExamId) {

        throw new Error(
            "Não foi possível identificar a prova histórica."
        );
    }


    /* ========================================================
       3. BUSCAR CLASSIFICAÇÕES INDIVIDUAIS
       ======================================================== */

    const {
        data: classifications,
        error: classificationsError
    } =
        await supabaseClient

            .from(
                "past_exam_question_classifications"
            )

            .select(
                `
                id,
                question_number,
                topic_name,
                normalized_topic_name,
                confidence,
                verified
                `
            )

            .eq(
                "subject_review_id",
                review.id
            )

            .order(
                "question_number",
                {
                    ascending:
                        true
                }
            );


    if (
        classificationsError
    ) {

        throw classificationsError;
    }


    if (
        !classifications ||
        classifications.length === 0
    ) {

        throw new Error(
            "Nenhuma classificação individual foi encontrada para esta matéria. Use primeiro o refinamento questão por questão."
        );
    }


    /* ========================================================
       4. CONFERIR QUANTIDADE DE QUESTÕES
       ======================================================== */

    const expectedQuestions =
        Number(
            review.question_count ||
            0
        );


    if (
        expectedQuestions <= 0
    ) {

        throw new Error(
            "A quantidade de questões da matéria é inválida."
        );
    }


    if (
        classifications.length !==
        expectedQuestions
    ) {

        throw new Error(
            "A matéria possui " +
            expectedQuestions +
            " questões, mas somente " +
            classifications.length +
            " classificações individuais foram encontradas. A importação foi bloqueada."
        );
    }


    /* ========================================================
       5. CONFERIR NÚMEROS REPETIDOS
       ======================================================== */

    const questionNumbers =
        classifications.map(
            function(item) {

                return Number(
                    item.question_number
                );
            }
        );


    const uniqueQuestionNumbers =
        new Set(
            questionNumbers
        );


    if (
        uniqueQuestionNumbers.size !==
        classifications.length
    ) {

        throw new Error(
            "Foram encontradas questões repetidas na classificação. A importação foi bloqueada."
        );
    }


    /* ========================================================
       6. VALIDAR ASSUNTOS
       ======================================================== */

    const invalidClassification =
        classifications.find(
            function(item) {

                return (
                    !item.topic_name

                    ||

                    !String(
                        item.topic_name
                    ).trim()

                    ||

                    !item.normalized_topic_name

                    ||

                    !String(
                        item.normalized_topic_name
                    ).trim()
                );
            }
        );


    if (
        invalidClassification
    ) {

        throw new Error(
            "Existe pelo menos uma questão sem assunto válido. A importação foi bloqueada."
        );
    }


    /* ========================================================
       7. AGRUPAR QUESTÕES POR ASSUNTO
       ======================================================== */

    const groupedTopics =
        new Map();


    classifications.forEach(
        function(item) {

        const normalizedName =
    normalizarTextoPareto(
        item.topic_name
    );


            if (
                !groupedTopics.has(
                    normalizedName
                )
            ) {

                groupedTopics.set(
                    normalizedName,
                    {
                        topic_name:
                            String(
                                item.topic_name
                            ).trim(),

                        normalized_topic_name:
                            normalizedName,

                        question_count:
                            0
                    }
                );
            }


            groupedTopics.get(
                normalizedName
            ).question_count +=
                1;
        }
    );


    /* ========================================================
       8. MONTAR LINHAS PARA O PARETO
       ======================================================== */

    const rows =
        Array.from(
            groupedTopics.values()
        )
        .map(
            function(topic) {

                return {

                    past_exam_id:
                        pastExamId,

                    subject_id:
                        subjectId,

                    subject_review_id:
                        review.id,

                    topic_name:
                        topic.topic_name,

                    normalized_topic_name:
                        topic.normalized_topic_name,

                    question_count:
                        topic.question_count,

                    statistical_weight:
                        statisticalWeight,

                    reference:
                        candidate.source_url
                };
            }
        );


    /* ========================================================
       9. VALIDAR SOMA FINAL
       ======================================================== */

    const importedQuestions =
        rows.reduce(
            function(
                total,
                row
            ) {

                return (
                    total +
                    Number(
                        row.question_count ||
                        0
                    )
                );
            },
            0
        );


    if (
        importedQuestions !==
        expectedQuestions
    ) {

        throw new Error(
            "Erro de consistência: eram esperadas " +
            expectedQuestions +
            " questões, mas o agrupamento resultou em " +
            importedQuestions +
            ". Nenhum dado foi importado."
        );
    }


    /* ========================================================
       10. APAGAR IMPORTAÇÃO ANTIGA DA MATÉRIA
       ======================================================== */

    const {
        error: deleteError
    } =
        await supabaseClient

            .from(
                "past_exam_topic_counts"
            )

            .delete()

            .eq(
                "subject_review_id",
                review.id
            );


    if (
        deleteError
    ) {

        throw deleteError;
    }


    /* ========================================================
       11. INSERIR NOVA DISTRIBUIÇÃO
       ======================================================== */

    const {
        error: insertError
    } =
        await supabaseClient

            .from(
                "past_exam_topic_counts"
            )

            .insert(
                rows
            );


    if (
        insertError
    ) {

        throw insertError;
    }


    console.log(
        "Matéria importada para o Pareto:",
        {
            subject:
                review.subject_name,

            questions:
                importedQuestions,

            topics:
                rows.length,

            weight:
                statisticalWeight
        }
    );


    return {
        topics:
            rows.length,

        questions:
            importedQuestions
    };
}
/* ============================================================
   REMOVER MATÉRIA HISTÓRICA
   ============================================================ */

async function removerMateriaHistorica(
    reviewId
) {

    const {
        error
    } =
        await supabaseClient

            .from(
                "past_exam_topic_counts"
            )

            .delete()

            .eq(
                "subject_review_id",
                reviewId
            );


    if (
        error
    ) {

        throw error;
    }
}


/* ============================================================
   CLIQUES:
   APROVAR / RESSALVA / DESCARTAR
   ============================================================ */

candidateList.addEventListener(
    "click",
    async function(event) {

        const button =
            event.target.closest(
                "[data-subject-action][data-review-id]"
            );


        if (!button) {

            return;
        }


        const reviewId =
            button.dataset.reviewId;


        const action =
            button.dataset.subjectAction;


        /* ====================================================
           LOCALIZAR PROVA E MATÉRIA
           ==================================================== */

        let candidateEncontrado =
            null;


        let reviewEncontrado =
            null;


        for (
            const candidate
            of currentCandidates
        ) {

            const reviews =

                Array.isArray(
                    candidate.subject_reviews
                )

                    ? candidate.subject_reviews

                    : [];


            const review =
                reviews.find(
                    function(item) {

                        return (
                            item.id ===
                            reviewId
                        );
                    }
                );


            if (
                review
            ) {

                candidateEncontrado =
                    candidate;


                reviewEncontrado =
                    review;


                break;
            }
        }


        if (
            !candidateEncontrado ||
            !reviewEncontrado
        ) {

            mostrarMensagem(
                "error",
                "Não foi possível identificar a matéria selecionada."
            );


            return;
        }


        /* ====================================================
           SEGURANÇA DE COBERTURA
           ==================================================== */

        const coverage =
            Number(
                reviewEncontrado.coverage_percent ||
                0
            );


        if (
            action === "approved" &&
            coverage < 85
        ) {

            mostrarMensagem(
                "error",
                "Esta matéria não possui cobertura suficiente para aprovação completa."
            );


            return;
        }


        if (
            action === "approved_partial" &&
            (
                coverage < 70 ||
                coverage >= 85
            )
        ) {

            mostrarMensagem(
                "error",
                "A aprovação com ressalva é permitida somente para cobertura entre 70% e 84,9%."
            );


            return;
        }


        /* ====================================================
           DEFINIR PESO ESTATÍSTICO
           ==================================================== */

        let statisticalWeight =
            0;


        if (
            action ===
            "approved"
        ) {

            statisticalWeight =
                1;
        }


        else if (
            action ===
            "approved_partial"
        ) {

            statisticalWeight =
                0.5;
        }


        /* ====================================================
           PROCESSAMENTO
           ==================================================== */

        const textoOriginal =
            button.textContent;


        button.disabled =
            true;


        button.textContent =
            "Processando...";


        try {

            /* =================================================
               APROVAR
               ================================================= */

            if (
                action ===
                    "approved"

                ||

                action ===
                    "approved_partial"
            ) {

                const importResult =
                    await importarMateriaHistorica(

                        candidateEncontrado,

                        reviewEncontrado,

                        statisticalWeight
                    );


                /* =============================================
                   ATUALIZAR STATUS DA REVISÃO
                   ============================================= */

                const agora =
                    new Date()
                        .toISOString();


                const {
                    error:
                        updateError
                } =
                    await supabaseClient

                        .from(
                            "past_exam_subject_reviews"
                        )

                        .update(
                            {
                                status:
                                    action,

                                statistical_weight:
                                    statisticalWeight,

                                approved_at:
                                    agora,

                                updated_at:
                                    agora
                            }
                        )

                        .eq(
                            "id",
                            reviewId
                        );


                if (
                    updateError
                ) {

                    /*
                     * Evita deixar os dados na base Pareto
                     * caso o status da matéria não possa
                     * ser atualizado.
                     */

                    await removerMateriaHistorica(
                        reviewId
                    );


                    throw updateError;
                }


                /* =============================================
                   MENSAGEM DE SUCESSO
                   ============================================= */

                if (
                    action ===
                    "approved"
                ) {

                    mostrarMensagem(
                        "success",

                        "✅ " +

                        reviewEncontrado.subject_name +

                        " aprovada. " +

                        importResult.questions +

                        " questão(ões) distribuída(s) em " +

                        importResult.topics +

                        " assunto(s) na base Pareto."
                    );

                } else {

                    mostrarMensagem(
                        "success",

                        "⚠️ " +

                        reviewEncontrado.subject_name +

                        " aprovada com ressalva. " +

                        importResult.questions +

                        " questão(ões) distribuída(s) em " +

                        importResult.topics +

                        " assunto(s), com peso estatístico 0,50."
                    );
                }
            }


            /* =================================================
               DESCARTAR
               ================================================= */

            else if (
                action ===
                "rejected"
            ) {

                await removerMateriaHistorica(
                    reviewId
                );


                const {
                    error:
                        rejectError
                } =
                    await supabaseClient

                        .from(
                            "past_exam_subject_reviews"
                        )

                        .update(
                            {
                                status:
                                    "rejected",

                                statistical_weight:
                                    0,

                                approved_at:
                                    null,

                                updated_at:
                                    new Date()
                                        .toISOString()
                            }
                        )

                        .eq(
                            "id",
                            reviewId
                        );


                if (
                    rejectError
                ) {

                    throw rejectError;
                }


                mostrarMensagem(
                    "success",

                    "❌ " +

                    reviewEncontrado.subject_name +

                    " foi retirada da base Pareto."
                );
            }


            /* =================================================
               AÇÃO DESCONHECIDA
               ================================================= */

            else {

                throw new Error(
                    "Ação de matéria inválida."
                );
            }


            /* =================================================
               RECARREGAR INTERFACE
               ================================================= */

            await carregarCandidatos();


        } catch (error) {

            console.error(
                "Erro ao processar matéria Pareto:",
                error
            );


            mostrarMensagem(
                "error",

                "Erro ao processar " +

                reviewEncontrado.subject_name +

                ": " +

                (
                    error?.message ||
                    "erro desconhecido"
                )
            );


            button.disabled =
                false;


            button.textContent =
                textoOriginal;
        }
    }
);
/* ============================================================
   REFINAR QUESTÕES INDIVIDUALMENTE
   ============================================================ */

candidateList.addEventListener(
    "click",
    async function(event) {

        const button =
            event.target.closest(
                "[data-refine-review-id]"
            );


        if (!button) {

            return;
        }


        const reviewId =
            button.dataset.refineReviewId;


        if (!reviewId) {

            return;
        }


        const textoOriginal =
            button.textContent;


        button.disabled =
            true;


        button.textContent =
            "🎯 Classificando questões...";


        mostrarMensagem(
            "info",
            "A IA está analisando cada questão individualmente. Isso pode levar alguns segundos."
        );


        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .functions
                    .invoke(
                        "analisar-questoes-prova",
                        {
                            body: {
                                subject_review_id:
                                    reviewId
                            }
                        }
                    );


            if (error) {

                console.error(
                    "Erro na função de refinamento:",
                    error
                );


                throw new Error(
                    error.message ||
                    "Falha ao analisar as questões."
                );
            }


            if (
                !data ||
                data.ok !== true
            ) {

                console.error(
                    "Resposta do refinamento:",
                    data
                );


                throw new Error(
                    data?.error ||
                    "A classificação das questões não pôde ser concluída."
                );
            }


            /* =================================================
               VALIDAÇÃO EXTRA DA RESPOSTA
               ================================================= */

            const expected =
                Number(
                    data.expected_questions ||
                    0
                );


            const classified =
                Number(
                    data.classified_questions ||
                    0
                );


            if (
                expected <= 0
                ||
                classified !== expected
            ) {

                throw new Error(
                    "O refinamento retornou " +
                    classified +
                    " classificação(ões), mas eram esperadas " +
                    expected +
                    "."
                );
            }


            mostrarMensagem(
                "success",

                "✅ Refinamento concluído! " +

                classified +

                "/" +

                expected +

                " questões classificadas. Cobertura: " +

                Number(
                    data.coverage_percent ||
                    0
                ).toFixed(1) +

                "%."
            );


            /*
             * Atualiza a tela.
             * Depois do refinamento, uma matéria como
             * Direito Tributário deve passar de:
             *
             * 19 / 0 / 0%
             *
             * para:
             *
             * 19 / 19 / 100%
             */

            await carregarCandidatos();


        } catch (error) {

            console.error(
                "Erro ao refinar matéria:",
                error
            );


            mostrarMensagem(
                "error",

                "Erro ao refinar a matéria: " +

                (
                    error?.message ||
                    "erro desconhecido"
                )
            );


            button.disabled =
                false;


            button.textContent =
                textoOriginal;
        }
    }
);
/* ============================================================
   EVENTOS
   ============================================================ */

examSelect.addEventListener(
    "change",
    async function() {

        limparMensagem();


        atualizarBotaoAnalise();


        await carregarCandidatos();
    }
);


sourceUrl.addEventListener(
    "input",
    atualizarBotaoAnalise
);


analyzeUrlButton.addEventListener(
    "click",
    analisarUrl
);


/* ============================================================
   INICIAR
   ============================================================ */

async function iniciarPagina() {

    const login =
        await verificarLogin();


    if (!login) {

        return;
    }


    await carregarConcursos();


    atualizarBotaoAnalise();
}


iniciarPagina();
