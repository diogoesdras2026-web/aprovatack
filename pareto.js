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
   COBERTURA
   ============================================================ */

function badgeCobertura(
    coverage
) {

    const value =
        Number(
            coverage || 0
        );


    if (
        value >=
        85
    ) {

        return "✅ Excelente";
    }


    if (
        value >=
        70
    ) {

        return "⚠️ Parcial";
    }


    return "🔴 Baixa cobertura";
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
        value >=
        85
    ) {

        return "score-high";
    }


    if (
        value >=
        70
    ) {

        return "score-medium";
    }


    return "score-low";
}


function getScoreLabel(
    score
) {

    const value =
        Number(
            score || 0
        );


    if (
        value >=
        85
    ) {

        return "🔥 Muito semelhante";
    }


    if (
        value >=
        70
    ) {

        return "🟢 Semelhante";
    }


    if (
        value >=
        55
    ) {

        return "🟡 Complementar";
    }


    return "⚪ Baixa similaridade";
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


    if (
        reviews.length ===
        0
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
                            ${review.question_count}
                        </strong>

                        <br>

                        Questões classificadas:
                        <strong>
                            ${review.classified_questions}
                        </strong>

                        <br>

                        Cobertura:
                        <strong>
                            ${coverage.toFixed(1)}%
                        </strong>

                        —
                        ${badgeCobertura(coverage)}

                    </div>


                    <div
                        style="
                            display:flex;
                            flex-wrap:wrap;
                            gap:8px;
                            margin-top:12px;
                        "
                    >
<button
    type="button"
    class="action-button approve"
    data-subject-action="approved"
    data-review-id="${review.id}"
    ${
        coverage < 85 ||
        status === "approved"

            ? "disabled"

            : ""
    }
>
    ${
        status === "approved"

            ? "✅ Aprovada"

            : coverage < 85

                ? "🔒 Cobertura insuficiente"

                : "✅ Aprovar"
    }
</button>
                            data-review-id="${review.id}"
                            ${
                                status ===
                                "approved"

                                    ? "disabled"

                                    : ""
                            }
                        >
                            ${
                                status ===
                                "approved"

                                    ? "✅ Aprovada"

                                    : "✅ Aprovar"
                            }
                        </button>


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
                                status ===
                                "approved_partial"

                                    ? "disabled"

                                    : ""
                            }
                        >
                            ${
                                status ===
                                "approved_partial"

                                    ? "⚠️ Aprovada com ressalva"

                                    : "⚠️ Aprovar com ressalva"
                            }
                        </button>


                        <button
                            type="button"
                            class="action-button reject"
                            data-subject-action="rejected"
                            data-review-id="${review.id}"
                            ${
                                status ===
                                "rejected"

                                    ? "disabled"

                                    : ""
                            }
                        >
                            ${
                                status ===
                                "rejected"

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
            data.ok !==
            true
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
   CRIAR / REUTILIZAR PAST_EXAM
   ============================================================ */

async function obterPastExam(
    candidate
) {

    const {
        data:
            sessionData
    } =
        await supabaseClient
            .auth
            .getSession();


    const userId =
        sessionData
            ?.session
            ?.user
            ?.id;


    if (!userId) {

        throw new Error(
            "Usuário não identificado."
        );
    }


    const {
        data:
            existing,
        error:
            searchError
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

            .limit(
                1
            )

            .maybeSingle();


    if (
        searchError
    ) {

        throw searchError;
    }


    if (
        existing
    ) {

        return existing.id;
    }


    const subjects =

        Array.isArray(
            candidate
                ?.source_metadata
                ?.subjects
        )

            ? candidate.source_metadata.subjects

            : [];


    const totalQuestions =
        subjects.reduce(
            function(
                total,
                subject
            ) {

                return (

                    total

                    +

                    Number(
                        subject
                            ?.question_count ||
                        0
                    )
                );
            },
            0
        );


    const {
        data:
            created,
        error:
            insertError
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
                        "Não identificada",

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

                        totalQuestions >
                        0

                            ? totalQuestions

                            : null,

                    source_name:
                        candidate.title ||
                        "Prova anterior",

                    source_url:
                        candidate.source_url,

                    verified:
                        true,

                    notes:
                        "Importada pelo Modo Pareto do AprovaTrack."
                }
            )

            .select(
                "id"
            )

            .single();


    if (
        insertError
    ) {

        throw insertError;
    }


    return created.id;
}


/* ============================================================
   LOCALIZAR MATÉRIA ANALISADA
   ============================================================ */

function localizarMateriaAnalisada(
    candidate,
    review
) {

    const subjects =

        Array.isArray(
            candidate
                ?.source_metadata
                ?.subjects
        )

            ? candidate.source_metadata.subjects

            : [];


    const target =
        normalizarTextoPareto(
            review
                .normalized_subject_name
            ||
            review
                .subject_name
        );


    return (

        subjects.find(
            function(subject) {

                return (

                    normalizarTextoPareto(
                        subject.name
                    )

                    ===

                    target
                );
            }
        )

        ||

        null
    );
}


/* ============================================================
   IMPORTAR MATÉRIA HISTÓRICA
   ============================================================ */

async function importarMateriaHistorica(
    candidate,
    review,
    statisticalWeight
) {

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


    const analyzedSubject =
        localizarMateriaAnalisada(
            candidate,
            review
        );


    if (
        !analyzedSubject
    ) {

        throw new Error(

            "Não encontrei os assuntos de '" +

            review.subject_name +

            "' na análise da prova."
        );
    }


    const pastExamId =
        await obterPastExam(
            candidate
        );


    const topics =

        Array.isArray(
            analyzedSubject.topics
        )

            ? analyzedSubject.topics

            : [];


    const {
        error:
            deleteError
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


    const rows =
        topics

            .filter(
                function(topic) {

                    return (

                        topic

                        &&

                        topic.name

                        &&

                        Number(
                            topic.question_count ||
                            0
                        ) >
                        0
                    );
                }
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
                            topic.name,

                        normalized_topic_name:
                            normalizarTextoPareto(
                                topic.normalized_name ||
                                topic.name
                            ),

                        question_count:
                            Number(
                                topic.question_count ||
                                0
                            ),

                        statistical_weight:
                            statisticalWeight,

                        reference:
                            candidate.source_url
                    };
                }
            );


    if (
        rows.length ===
        0
    ) {

        throw new Error(
            "Nenhuma questão válida foi encontrada para importar."
        );
    }


    const {
        error:
            insertError
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


    return rows.length;
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
   CLIQUES DAS MATÉRIAS
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


        button.disabled =
            true;


        button.textContent =
            "Processando...";


        try {

            if (
                action ===
                "approved"

                ||

                action ===
                "approved_partial"
            ) {

                const importedTopics =
                    await importarMateriaHistorica(

                        candidateEncontrado,

                        reviewEncontrado,

                        statisticalWeight
                    );


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
                                    new Date()
                                        .toISOString(),

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
                    updateError
                ) {

                    throw updateError;
                }


                if (
                    action ===
                    "approved"
                ) {

                    mostrarMensagem(
                        "success",

                        "✅ " +

                        reviewEncontrado.subject_name +

                        " aprovada. " +

                        importedTopics +

                        " assunto(s) adicionados à base Pareto."
                    );


                } else {

                    mostrarMensagem(
                        "success",

                        "⚠️ " +

                        reviewEncontrado.subject_name +

                        " aprovada com ressalva. " +

                        importedTopics +

                        " assunto(s) adicionados com peso 0,50."
                    );
                }
            }


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
