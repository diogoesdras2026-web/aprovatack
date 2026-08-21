/* ============================================================
   APROVATRACK
   MODO PARETO
   PESQUISA DE PROVAS SEMELHANTES
   ============================================================ */


/* ============================================================
   SUPABASE
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

const searchButton =
    document.getElementById(
        "searchButton"
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


let currentUser =
    null;

let currentExamId =
    null;

let currentCandidates =
    [];


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
                `
                id,
                name,
                organization,
                position,
                board,
                exam_date,
                position_family,
                area
                `
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

        console.error(
            "Erro ao carregar concursos:",
            error
        );


        showMessage(
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
   CLASSIFICAÇÃO VISUAL DA SIMILARIDADE
   ============================================================ */

function getScoreClass(
    score
) {

    const value =
        Number(
            score ||
            0
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


/* ============================================================
   TEXTO DA SIMILARIDADE
   ============================================================ */

function getScoreLabel(
    score
) {

    const value =
        Number(
            score ||
            0
        );


    if (
        value >=
        85
    ) {

        return "Muito semelhante";
    }


    if (
        value >=
        70
    ) {

        return "Semelhante";
    }


    if (
        value >=
        55
    ) {

        return "Complementar";
    }


    return "Baixa similaridade";
}


/* ============================================================
   CRIAR TAG
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
   RAZÕES DA PONTUAÇÃO
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
        "14px";


    container.style.fontSize =
        "13px";


    container.style.color =
        "#64748b";


    const title =
        document.createElement(
            "strong"
        );


    title.textContent =
        "Por que recebeu esta nota?";


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


            const points =
                Number(
                    reason?.points ||
                    0
                );


            line.textContent =

                "+" +
                points +
                " — " +
                (
                    reason?.label ||
                    reason?.criterion ||
                    "Critério de similaridade"
                );


            container.appendChild(
                line
            );
        }
    );


    return container;
}


/* ============================================================
   CRIAR CARD
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


    /* TOPO */

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
        "Prova encontrada";


    left.appendChild(
        title
    );


    const meta =
        document.createElement(
            "div"
        );


    meta.className =
        "candidate-meta";


    const metaParts =
        [];


    if (
        candidate.board
    ) {

        metaParts.push(
            candidate.board
        );
    }


    if (
        candidate.position
    ) {

        metaParts.push(
            candidate.position
        );
    }


    if (
        candidate.organization
    ) {

        metaParts.push(
            candidate.organization
        );
    }


    if (
        candidate.exam_year
    ) {

        metaParts.push(
            String(
                candidate.exam_year
            )
        );
    }


    meta.textContent =
        metaParts.join(
            " • "
        );


    left.appendChild(
        meta
    );


    top.appendChild(
        left
    );


    /* SCORE */

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


    /* LABEL DA NOTA */

    const similarityLabel =
        document.createElement(
            "div"
        );


    similarityLabel.style.marginTop =
        "10px";


    similarityLabel.style.fontWeight =
        "bold";


    similarityLabel.textContent =
        getScoreLabel(
            candidate.similarity_score
        );


    container.appendChild(
        similarityLabel
    );


    /* TAGS */

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


    if (
        candidate.status ===
        "approved"
    ) {

        tags.appendChild(
            criarTag(
                "👍 Aprovada",
                "official"
            )
        );
    }


    if (
        candidate.status ===
        "rejected"
    ) {

        tags.appendChild(
            criarTag(
                "❌ Descartada"
            )
        );
    }


    container.appendChild(
        tags
    );


    /* RAZÕES */

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


    /* LINK */

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
            "🔗 Abrir fonte";


        container.appendChild(
            link
        );
    }


    /* AÇÕES */

    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "actions";


    const approveButton =
        document.createElement(
            "button"
        );


    approveButton.type =
        "button";


    approveButton.className =
        "action-button approve";


    approveButton.dataset.action =
        "approve";


    approveButton.dataset.id =
        candidate.id;


    approveButton.textContent =

        candidate.status ===
        "approved"

            ? "✅ Aprovada"

            : "✅ Aprovar para análise";


    if (
        candidate.status ===
        "approved"
    ) {

        approveButton.disabled =
            true;
    }


    const rejectButton =
        document.createElement(
            "button"
        );


    rejectButton.type =
        "button";


    rejectButton.className =
        "action-button reject";


    rejectButton.dataset.action =
        "reject";


    rejectButton.dataset.id =
        candidate.id;


    rejectButton.textContent =

        candidate.status ===
        "rejected"

            ? "❌ Descartada"

            : "❌ Descartar";


    if (
        candidate.status ===
        "rejected"
    ) {

        rejectButton.disabled =
            true;
    }


    actions.appendChild(
        approveButton
    );


    actions.appendChild(
        rejectButton
    );


    container.appendChild(
        actions
    );


    return container;
}


/* ============================================================
   ATUALIZAR RESUMO
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
        )
        .length;


    const official =
        currentCandidates.filter(
            function(candidate) {

                return (
                    candidate.is_official ===
                    true
                );
            }
        )
        .length;


    const approved =
        currentCandidates.filter(
            function(candidate) {

                return (
                    candidate.status ===
                    "approved"
                );
            }
        )
        .length;


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
            approved
        );


    if (
        total >
        0
    ) {

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
   RENDERIZAR CANDIDATOS
   ============================================================ */

function renderizarCandidatos() {

    candidateList.innerHTML =
        "";


    if (
        currentCandidates.length ===
        0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "empty";


        empty.textContent =
            "Nenhuma prova semelhante foi encontrada ainda.";


        candidateList.appendChild(
            empty
        );


        atualizarResumo();


        return;
    }


    currentCandidates
        .sort(
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
   CARREGAR CANDIDATOS JÁ SALVOS
   ============================================================ */

async function carregarCandidatos(
    examId
) {

    currentCandidates =
        [];


    if (!examId) {

        renderizarCandidatos();

        return;
    }


    candidateList.innerHTML =
        '<div class="empty">Carregando pesquisas anteriores...</div>';


    const {
        data,
        error
    } =
        await supabaseClient

            .from(
                "exam_research_candidates"
            )

            .select(
                `
                id,
                exam_id,
                title,
                source_url,
                source_domain,
                source_type,
                board,
                organization,
                position,
                position_family,
                area,
                exam_year,
                exam_date,
                similarity_score,
                similarity_reasons,
                is_official,
                has_exam,
                has_answer_key,
                status,
                discovered_at
                `
            )

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
            "Erro ao carregar candidatos:",
            error
        );


        showMessage(
            "error",
            "Não foi possível carregar as provas pesquisadas anteriormente."
        );


        return;
    }


    currentCandidates =
        data ||
        [];


    renderizarCandidatos();
}


/* ============================================================
   PESQUISAR PROVAS
   ============================================================ */

async function pesquisarProvas() {

    const examId =
        examSelect.value;


    if (!examId) {

        showMessage(
            "error",
            "Selecione um concurso."
        );


        return;
    }


    searchButton.disabled =
        true;


    searchButton.textContent =
        "🔎 Pesquisando na internet...";


    showMessage(
        "info",
        "Pesquisando provas semelhantes. Essa etapa pode levar alguns segundos."
    );


    candidateList.innerHTML =
        `
        <div class="empty">
            🤖 O AprovaTrack está procurando provas,
            páginas oficiais e gabaritos semelhantes...
        </div>
        `;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .functions
                .invoke(
                    "buscar-provas-pareto",
                    {
                        body: {
                            exam_id:
                                examId
                        }
                    }
                );


        if (error) {

            console.error(
                "Erro ao chamar função Pareto:",
                error
            );


            throw new Error(
                error.message ||
                "A função de pesquisa falhou."
            );
        }


        if (
            !data ||
            data.ok !==
            true
        ) {

            console.error(
                "Resposta da pesquisa:",
                data
            );


            throw new Error(
                data?.error ||
                "A pesquisa não pôde ser concluída."
            );
        }


        showMessage(
            "success",
            "✅ " +
            (
                data.message ||
                "Pesquisa concluída."
            )
        );


        /*
         * Carregamos novamente do banco,
         * porque ele é nossa fonte oficial de dados.
         */

        await carregarCandidatos(
            examId
        );


    } catch (error) {

        console.error(
            "Erro na pesquisa:",
            error
        );


        showMessage(
            "error",
            "Erro ao pesquisar provas: " +
            (
                error?.message ||
                "erro desconhecido"
            )
        );


        await carregarCandidatos(
            examId
        );


    } finally {

        searchButton.disabled =
            false;


        searchButton.textContent =
            "🔎 Pesquisar provas semelhantes";
    }
}


/* ============================================================
   ALTERAR STATUS
   ============================================================ */

async function alterarStatus(
    candidateId,
    novoStatus
) {

    if (
        !candidateId ||
        !novoStatus
    ) {

        return;
    }


    const {
        error
    } =
        await supabaseClient

            .from(
                "exam_research_candidates"
            )

            .update(
                {
                    status:
                        novoStatus
                }
            )

            .eq(
                "id",
                candidateId
            );


    if (error) {

        console.error(
            "Erro ao atualizar candidato:",
            error
        );


        showMessage(
            "error",
            "Não foi possível atualizar esta prova."
        );


        return;
    }


    const candidate =
        currentCandidates.find(
            function(item) {

                return (
                    item.id ===
                    candidateId
                );
            }
        );


    if (
        candidate
    ) {

        candidate.status =
            novoStatus;
    }


    if (
        novoStatus ===
        "approved"
    ) {

        showMessage(
            "success",
            "✅ Prova aprovada para a próxima etapa de análise."
        );

    } else {

        showMessage(
            "success",
            "Prova descartada da análise Pareto."
        );
    }


    renderizarCandidatos();
}


/* ============================================================
   CLIQUE NOS CANDIDATOS
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


        const candidateId =
            button.dataset.id;


        const action =
            button.dataset.action;


        if (
            !candidateId
        ) {

            return;
        }


        button.disabled =
            true;


        if (
            action ===
            "approve"
        ) {

            button.textContent =
                "Salvando...";


            await alterarStatus(
                candidateId,
                "approved"
            );


            return;
        }


        if (
            action ===
            "reject"
        ) {

            button.textContent =
                "Salvando...";


            await alterarStatus(
                candidateId,
                "rejected"
            );
        }
    }
);


/* ============================================================
   TROCAR CONCURSO
   ============================================================ */

examSelect.addEventListener(
    "change",
    async function() {

        clearMessage();


        currentExamId =
            examSelect.value ||
            null;


        searchButton.disabled =
            !currentExamId;


        if (
            !currentExamId
        ) {

            currentCandidates =
                [];


            renderizarCandidatos();


            return;
        }


        await carregarCandidatos(
            currentExamId
        );
    }
);


/* ============================================================
   BOTÃO PESQUISAR
   ============================================================ */

searchButton.addEventListener(
    "click",
    pesquisarProvas
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
}


iniciarPagina();
