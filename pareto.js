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

function montarConteudo(candidate) {

    const subjects =
        Array.isArray(
            candidate
                ?.source_metadata
                ?.subjects
        )
            ? candidate.source_metadata.subjects
            : [];


    if (subjects.length === 0) {

        return "";
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
            📊 Conteúdo identificado
        </strong>
        `;


    subjects.forEach(
        function(subject) {

            html +=
                `
                <div style="margin-top:12px;">
                    <strong>
                        ${subject.name}
                    </strong>
                </div>
                `;


            const topics =
                Array.isArray(
                    subject.topics
                )
                    ? subject.topics
                    : [];


            topics
                .slice(0, 10)
                .forEach(
                    function(topic) {

                        html +=
                            `
                            <div style="
                                margin-top:4px;
                                color:#64748b;
                            ">
                                • ${topic.name}
                                — ${topic.question_count || 0}
                                questão(ões)
                            </div>
                            `;
                    }
                );
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

        currentCandidates = [];

        renderizarCandidatos();

        return;
    }


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

        console.error(error);

        mostrarMensagem(
            "error",
            "Erro ao carregar provas analisadas."
        );

        return;
    }


    currentCandidates =
        data || [];


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
