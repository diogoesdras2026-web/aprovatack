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


const examSelect =
    document.getElementById("examSelect");

const sourceUrl =
    document.getElementById("sourceUrl");

const analyzeUrlButton =
    document.getElementById("analyzeUrlButton");

const message =
    document.getElementById("message");

const summarySection =
    document.getElementById("summarySection");

const foundCount =
    document.getElementById("foundCount");

const highCount =
    document.getElementById("highCount");

const officialCount =
    document.getElementById("officialCount");

const approvedCount =
    document.getElementById("approvedCount");

const candidateList =
    document.getElementById("candidateList");


let currentCandidates = [];


/* ============================================================
   MENSAGENS
   ============================================================ */

function mostrarMensagem(tipo, texto) {

    message.className =
        "message " + tipo;

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
   VALIDAR URL
   ============================================================ */

function urlValida(valor) {

    try {

        const url =
            new URL(valor);

        return (
            url.protocol === "http:" ||
            url.protocol === "https:"
        );

    } catch {

        return false;
    }
}


/* ============================================================
   HABILITAR BOTÃO
   ============================================================ */

function atualizarBotaoAnalise() {

    const temConcurso =
        Boolean(
            examSelect.value
        );

    const temUrlValida =
        urlValida(
            sourceUrl.value.trim()
        );

    analyzeUrlButton.disabled =
        !(temConcurso && temUrlValida);
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
        !data.session
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


    examSelect.innerHTML =
        '<option value="">Selecione um concurso</option>';


    if (error) {

        console.error(error);

        mostrarMensagem(
            "error",
            "Erro ao carregar concursos."
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
   RESUMO
   ============================================================ */

function atualizarResumo() {

    const total =
        currentCandidates.length;


    const muitoSemelhantes =
        currentCandidates.filter(
            function(item) {

                return (
                    Number(
                        item.similarity_score || 0
                    ) >= 85
                );
            }
        ).length;


    const oficiais =
        currentCandidates.filter(
            function(item) {

                return (
                    item.is_official === true
                );
            }
        ).length;


    const aprovadas =
        currentCandidates.filter(
            function(item) {

                return (
                    item.status === "approved"
                );
            }
        ).length;


    foundCount.textContent =
        String(total);

    highCount.textContent =
        String(muitoSemelhantes);

    officialCount.textContent =
        String(oficiais);

    approvedCount.textContent =
        String(aprovadas);


    if (total > 0) {

        summarySection.classList.remove(
            "hidden"
        );

    } else {

        summarySection.classList.add(
            "hidden"
        );
    }
}


/* ============================================================
   MOSTRAR CONTEÚDO DA PROVA
   ============================================================ */

function badgeCobertura(
    coverage
) {

    const value =
        Number(
            coverage || 0
        );


    if (value >= 85) {

        return "✅ Excelente";
    }


    if (value >= 70) {

        return "⚠️ Parcial";
    }


    return "🔴 Baixa cobertura";
}


/* ============================================================
   MATÉRIAS DA PROVA
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
        reviews.length === 0
    ) {

        return `
            <div style="
                margin-top:16px;
                padding:15px;
                background:#f8fafc;
                border-radius:10px;
                color:#64748b;
            ">
                Nenhuma matéria disponível para revisão.
            </div>
        `;
    }


    let html =
        `
        <div style="
            margin-top:16px;
            padding:15px;
            background:#f8fafc;
            border-radius:10px;
        ">

        <strong>
            📊 Aprovação por matéria
        </strong>
        `;


    reviews.forEach(
        function(review) {

            const coverage =
                Number(
                    review.coverage_percent || 0
                );


            const status =
                review.status ||
                "pending";


            html +=
                `
                <div style="
                    margin-top:16px;
                    padding:14px;
                    background:white;
                    border:1px solid #e5e7eb;
                    border-radius:10px;
                ">

                    <div style="
                        font-weight:bold;
                        font-size:16px;
                    ">
                        ${review.subject_name}
                    </div>


                    <div style="
                        margin-top:7px;
                        color:#64748b;
                        line-height:1.6;
                    ">

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


                    <div style="
                        display:flex;
                        flex-wrap:wrap;
                        gap:8px;
                        margin-top:12px;
                    ">

                        <button
                            type="button"
                            class="action-button approve"
                            data-subject-action="approved"
                            data-review-id="${review.id}"
                            ${
                                status === "approved"
                                    ? "disabled"
                                    : ""
                            }
                        >
                            ${
                                status === "approved"
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
                                status === "approved_partial"
                                    ? "disabled"
                                    : ""
                            }
                        >
                            ${
                                status === "approved_partial"
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
   RENDERIZAR PROVAS
   ============================================================ */

function renderizarCandidatos() {

    candidateList.innerHTML =
        "";


    if (
        currentCandidates.length === 0
    ) {

        candidateList.innerHTML =
            `
            <div class="empty">
                Nenhuma prova analisada ainda.
            </div>
            `;

        atualizarResumo();

        return;
    }


    currentCandidates.sort(
        function(a, b) {

            return (
                Number(
                    b.similarity_score || 0
                )
                -
                Number(
                    a.similarity_score || 0
                )
            );
        }
    );


    currentCandidates.forEach(
        function(candidate) {

            const score =
                Math.round(
                    Number(
                        candidate.similarity_score || 0
                    )
                );


            let classificacao =
                "⚪ Baixa similaridade";


            if (score >= 85) {

                classificacao =
                    "🔥 Muito semelhante";

            } else if (score >= 70) {

                classificacao =
                    "🟢 Semelhante";

            } else if (score >= 55) {

                classificacao =
                    "🟡 Complementar";
            }


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "candidate";


            card.innerHTML =
                `
                <div class="candidate-top">

                    <div>

                        <div class="candidate-title">
                            ${candidate.title || "Prova anterior"}
                        </div>

                        <div class="candidate-meta">
                            ${candidate.board || "Banca não identificada"}
                            •
                            ${candidate.position || "Cargo não identificado"}
                            •
                            ${candidate.exam_year || "Ano não identificado"}
                        </div>

                    </div>

                    <div class="score">
                        ${score}/100
                    </div>

                </div>


                <div style="
                    margin-top:12px;
                    font-weight:bold;
                ">
                    ${classificacao}
                </div>


                <div class="tags">

                    ${
                        candidate.is_official
                            ? '<span class="tag official">✅ Fonte oficial</span>'
                            : ''
                    }

                    ${
                        candidate.has_exam
                            ? '<span class="tag">📄 Prova</span>'
                            : ''
                    }

                    ${
                        candidate.has_answer_key
                            ? '<span class="tag">✅ Gabarito</span>'
                            : ''
                    }

                    ${
                        candidate.status === "approved"
                            ? '<span class="tag official">👍 Aprovada</span>'
                            : ''
                    }

                </div>


                ${montarConteudo(candidate)}


                <a
                    class="link"
                    href="${candidate.source_url}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    🔗 Abrir fonte original
                </a>


                <div class="actions">

                    <button
                        class="action-button approve"
                        data-action="approve"
                        data-id="${candidate.id}"
                        ${
                            candidate.status === "approved"
                                ? "disabled"
                                : ""
                        }
                    >
                        ${
                            candidate.status === "approved"
                                ? "✅ Aprovada"
                                : "✅ Aprovar para o Pareto"
                        }
                    </button>


                    <button
                        class="action-button reject"
                        data-action="reject"
                        data-id="${candidate.id}"
                    >
                        ❌ Descartar
                    </button>

                </div>
                `;


            candidateList.appendChild(
                card
            );
        }
    );


    atualizarResumo();
}


/* ============================================================
   CARREGAR PROVAS ANALISADAS
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


    /* ========================================================
       BUSCAR PROVAS
       ======================================================== */

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
                    ascending: false
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
        data || [];


    /* ========================================================
       BUSCAR MATÉRIAS DE CADA PROVA
       ======================================================== */

    for (
        const candidate
        of currentCandidates
    ) {

        const {
            data: reviews,
            error: reviewsError
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
                        ascending: true
                    }
                );


        if (reviewsError) {

            console.error(
                "Erro ao carregar matérias do candidato:",
                candidate.id,
                reviewsError
            );


            candidate.subject_reviews =
                [];

        } else {

            console.log(
                "Matérias carregadas:",
                candidate.id,
                reviews
            );


            candidate.subject_reviews =
                reviews || [];
        }
    }


    /* ========================================================
       MOSTRAR RESULTADOS
       ======================================================== */

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


    if (!urlValida(url)) {

        mostrarMensagem(
            "error",
            "Informe uma URL válida."
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

            console.error(error);

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
                data.subjects_found || 0
            ) +
            " disciplina(s) e " +
            Number(
                data.topics_found || 0
            ) +
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
   APROVAR / DESCARTAR
   ============================================================ */

candidateList.addEventListener(
    "click",
    async function(event) {

        const button =
            event.target.closest(
                "[data-action][data-id]"
            );


        if (!button) {

            return;
        }


        const status =
            button.dataset.action ===
            "approve"
                ? "approved"
                : "rejected";


        const {
            error
        } =
            await supabaseClient

                .from(
                    "exam_research_candidates"
                )

                .update({
                    status: status
                })

                .eq(
                    "id",
                    button.dataset.id
                );


        if (error) {

            console.error(error);

            mostrarMensagem(
                "error",
                "Não foi possível atualizar a prova."
            );

            return;
        }


        mostrarMensagem(
            "success",
            status === "approved"
                ? "✅ Prova aprovada para o Pareto."
                : "Prova descartada."
        );


        await carregarCandidatos();
    }
);
/* ============================================================
   NORMALIZAR TEXTO
   ============================================================ */

function normalizarTextoPareto(valor) {

    return String(
        valor || ""
    )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .trim()
        .toLowerCase();
}


/* ============================================================
   LOCALIZAR DISCIPLINA DO NOSSO EDITAL
   ============================================================ */

async function localizarSubjectId(
    nomeMateria
) {

    const examId =
        examSelect.value;


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


    if (error) {

        console.error(
            "Erro ao localizar disciplina:",
            error
        );

        throw error;
    }


    const nomeNormalizado =
        normalizarTextoPareto(
            nomeMateria
        );


    for (
        const item
        of data || []
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
            ) ===
            nomeNormalizado
        ) {

            return subject.id;
        }
    }


    /*
     * Se o nome histórico for um pouco diferente,
     * fazemos uma segunda tentativa no catálogo.
     */

    const {
        data: subjects,
        error: subjectError
    } =
        await supabaseClient

            .from("subjects")

            .select(
                "id, name"
            );


    if (subjectError) {

        throw subjectError;
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


    return encontrado
        ?.id ||
        null;
}


/* ============================================================
   CRIAR OU REUTILIZAR PROVA HISTÓRICA
   ============================================================ */

async function obterPastExam(
    candidate
) {

    const {
        data: sessionData
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


    /*
     * Procura se essa URL já foi
     * transformada em prova histórica.
     */

    const {
        data: existing,
        error: searchError
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

            .limit(1)
            .maybeSingle();


    if (searchError) {

        throw searchError;
    }


    if (existing) {

        return existing.id;
    }


    /*
     * Soma o total de questões identificadas
     * nas matérias da prova.
     */

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
                    total +
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
        data: created,
        error: insertError
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
                        totalQuestions > 0
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


    if (insertError) {

        throw insertError;
    }


    return created.id;
}


/* ============================================================
   LOCALIZAR MATÉRIA NA ANÁLISE DA IA
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
            review.normalized_subject_name ||
            review.subject_name
        );


    return (
        subjects.find(
            function(subject) {

                return (
                    normalizarTextoPareto(
                        subject.name
                    ) ===
                    target
                );
            }
        )
        ||
        null
    );
}


/* ============================================================
   IMPORTAR MATÉRIA PARA BASE HISTÓRICA
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


    if (!analyzedSubject) {

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


    /*
     * Remove a versão anterior somente
     * dessa matéria/revisão.
     *
     * Isso permite mudar de aprovado para
     * aprovado com ressalva sem duplicações.
     */

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


    if (deleteError) {

        throw deleteError;
    }


    if (
        topics.length === 0
    ) {

        throw new Error(
            "Nenhum assunto classificado foi encontrado para esta matéria."
        );
    }


    const rows =
        topics

            .filter(
                function(topic) {

                    return (
                        topic &&
                        topic.name &&
                        Number(
                            topic.question_count ||
                            0
                        ) > 0
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
        rows.length === 0
    ) {

        throw new Error(
            "Nenhuma questão válida foi encontrada para importar."
        );
    }


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


    if (insertError) {

        throw insertError;
    }


    return rows.length;
}


/* ============================================================
   REMOVER MATÉRIA DA BASE HISTÓRICA
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


    if (error) {

        throw error;
    }
}
/* ============================================================
   APROVAÇÃO POR MATÉRIA
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


        /*
         * Descobre a prova e a matéria
         * correspondentes ao botão clicado.
         */

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


            if (review) {

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

            /*
             * APROVADA OU APROVADA COM RESSALVA
             */

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
                    error: updateError
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


                if (updateError) {

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


            /*
             * DESCARTADA
             */

            else if (
                action ===
                "rejected"
            ) {

                await removerMateriaHistorica(
                    reviewId
                );


                const {
                    error: rejectError
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


                if (rejectError) {

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


        if (!button) {

            return;
        }


        const reviewId =
            button.dataset.reviewId;


        const action =
            button.dataset.subjectAction;


        let statisticalWeight =
            0;


        if (
            action ===
            "approved"
        ) {

            statisticalWeight =
                1;
        }


        if (
            action ===
            "approved_partial"
        ) {

            statisticalWeight =
                0.5;
        }


        const approvedAt =

            action ===
            "rejected"

                ? null

                : new Date()
                    .toISOString();


        button.disabled =
            true;


        button.textContent =
            "Salvando...";


        const {
            error
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
                            approvedAt,

                        updated_at:
                            new Date()
                                .toISOString()
                    }
                )

                .eq(
                    "id",
                    reviewId
                );


        if (error) {

            console.error(
                "Erro ao atualizar matéria:",
                error
            );


            mostrarMensagem(
                "error",
                "Não foi possível atualizar a matéria."
            );


            button.disabled =
                false;


            return;
        }


        if (
            action ===
            "approved"
        ) {

            mostrarMensagem(
                "success",
                "✅ Matéria aprovada para o Pareto."
            );
        }


        else if (
            action ===
            "approved_partial"
        ) {

            mostrarMensagem(
                "success",
                "⚠️ Matéria aprovada com peso estatístico reduzido."
            );
        }


        else {

            mostrarMensagem(
                "success",
                "❌ Matéria descartada da estatística."
            );
        }


        await carregarCandidatos();
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
