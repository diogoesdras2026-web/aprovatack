/* ============================================================
   APROVATRACK
   REVISÃO DA ANÁLISE DO EDITAL
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

const analysisArea =
    document.getElementById(
        "analysisArea"
    );

const analysisMessage =
    document.getElementById(
        "analysisMessage"
    );

const subjectsList =
    document.getElementById(
        "subjectsList"
    );


let currentAnalysis = null;


/* ============================================================
   LOGIN
   ============================================================ */

async function verificarLogin() {

    const {
        data,
        error
    } =
        await supabaseClient.auth
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


    examSelect.innerHTML = "";


    const option =
        document.createElement(
            "option"
        );


    option.value = "";

    option.textContent =
        "Selecione um concurso";


    examSelect.appendChild(
        option
    );


    if (error) {

        console.error(error);

        analysisMessage.className =
            "message error";

        analysisMessage.textContent =
            "Não foi possível carregar os concursos.";

        return;
    }


    data.forEach(
        function(exam) {

            const item =
                document.createElement(
                    "option"
                );


            item.value =
                exam.id;


            item.textContent =
                exam.position
                    ? exam.name +
                      " — " +
                      exam.position
                    : exam.name;


            examSelect.appendChild(
                item
            );
        }
    );
}


/* ============================================================
   BUSCAR ANÁLISE MAIS RECENTE
   ============================================================ */

async function carregarAnalise(
    examId
) {

    analysisArea.style.display =
        "none";


    analysisMessage.className =
        "message info";

    analysisMessage.textContent =
        "Carregando análise...";


    const {
        data,
        error
    } =
        await supabaseClient
            .from("ai_analyses")
            .select(
                "id, exam_id, result, input_snapshot, created_at"
            )
            .eq(
                "exam_id",
                examId
            )
            .eq(
                "analysis_type",
                "notice_analysis"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(1)
            .maybeSingle();


    if (error) {

        console.error(error);

        analysisMessage.className =
            "message error";

        analysisMessage.textContent =
            "Não foi possível carregar a análise.";

        return;
    }


    if (!data) {

        analysisMessage.className =
            "message error";

        analysisMessage.textContent =
            "Nenhuma análise encontrada para este concurso.";

        return;
    }


    currentAnalysis =
        data;


    analysisMessage.className =
        "message";

    analysisMessage.textContent =
        "";


    renderizarAnalise(
        data.result
    );


    analysisArea.style.display =
        "block";
}


/* ============================================================
   RENDERIZAR RESUMO
   ============================================================ */

function renderizarAnalise(
    result
) {

    document.getElementById(
        "cargo"
    ).textContent =
        result.cargo ||
        "Não identificado";


    document.getElementById(
        "banca"
    ).textContent =
        result.banca ||
        "Não identificada";


    document.getElementById(
        "orgao"
    ).textContent =
        result.orgao ||
        "Não identificado";


    document.getElementById(
        "dataProva"
    ).textContent =
        formatarData(
            result.data_prova
        );


    const cargoEncontrado =
        document.getElementById(
            "cargoEncontrado"
        );


    if (
        result.cargo_alvo_encontrado ===
        true
    ) {

        cargoEncontrado.textContent =
            "✅ Sim";

        cargoEncontrado.className =
            "summary-value success";

    } else {

        cargoEncontrado.textContent =
            "⚠ Não confirmado";

        cargoEncontrado.className =
            "summary-value warning";
    }


    const disciplinas =
        Array.isArray(
            result.disciplinas
        )
            ? result.disciplinas
            : [];


    document.getElementById(
        "totalDisciplinas"
    ).textContent =
        disciplinas.length;


    renderizarAlertas(
        result.alertas
    );


    renderizarDisciplinas(
        disciplinas
    );
}


/* ============================================================
   DATA
   ============================================================ */

function formatarData(
    value
) {

    if (!value) {
        return "Não identificada";
    }


    const date =
        new Date(
            value +
            "T00:00:00"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;
    }


    return date.toLocaleDateString(
        "pt-BR"
    );
}


/* ============================================================
   ALERTAS
   ============================================================ */

function renderizarAlertas(
    alertas
) {

    const area =
        document.getElementById(
            "alerts"
        );


    area.innerHTML = "";


    if (
        !Array.isArray(alertas) ||
        alertas.length === 0
    ) {

        return;
    }


    const box =
        document.createElement(
            "div"
        );


    box.className =
        "alert-box";


    const title =
        document.createElement(
            "strong"
        );


    title.textContent =
        "⚠ Observações da IA";


    box.appendChild(
        title
    );


    const list =
        document.createElement(
            "ul"
        );


    alertas.forEach(
        function(alerta) {

            const item =
                document.createElement(
                    "li"
                );


            item.textContent =
                alerta;


            list.appendChild(
                item
            );
        }
    );


    box.appendChild(
        list
    );


    area.appendChild(
        box
    );
}


/* ============================================================
   DISCIPLINAS
   ============================================================ */

function renderizarDisciplinas(
    disciplinas
) {

    subjectsList.innerHTML = "";


    if (
        disciplinas.length === 0
    ) {

        subjectsList.innerHTML =
            "<p class='empty'>Nenhuma disciplina identificada.</p>";

        return;
    }


    disciplinas.forEach(
        function(subject, subjectIndex) {

            const box =
                document.createElement(
                    "div"
                );


            box.className =
                "subject";


            const header =
                document.createElement(
                    "div"
                );


            header.className =
                "subject-header";


            const checkbox =
                document.createElement(
                    "input"
                );


            checkbox.type =
                "checkbox";

            checkbox.checked =
                true;

            checkbox.className =
                "subject-checkbox";

            checkbox.dataset.index =
                subjectIndex;


            const title =
                document.createElement(
                    "div"
                );


            title.className =
                "subject-title";


            title.textContent =
                subject.nome;


            header.appendChild(
                checkbox
            );


            header.appendChild(
                title
            );


            const body =
                document.createElement(
                    "div"
                );


            body.className =
                "subject-body";


            if (
                subject.quantidade_questoes !==
                null &&
                subject.quantidade_questoes !==
                undefined
            ) {

                const meta =
                    document.createElement(
                        "div"
                    );


                meta.className =
                    "meta";


                meta.textContent =
                    "Questões: " +
                    subject.quantidade_questoes;


                body.appendChild(
                    meta
                );
            }


            if (
                subject.peso !== null &&
                subject.peso !== undefined
            ) {

                const meta =
                    document.createElement(
                        "div"
                    );


                meta.className =
                    "meta";


                meta.textContent =
                    "Peso: " +
                    subject.peso;


                body.appendChild(
                    meta
                );
            }


            const assuntos =
                Array.isArray(
                    subject.assuntos
                )
                    ? subject.assuntos
                    : [];


            assuntos.forEach(
                function(topic) {

                    const topicBox =
                        document.createElement(
                            "div"
                        );


                    topicBox.className =
                        "topic";


                    const topicName =
                        document.createElement(
                            "div"
                        );


                    topicName.className =
                        "topic-name";


                    topicName.textContent =
                        "• " +
                        topic.nome;


                    topicBox.appendChild(
                        topicName
                    );


                    const subtopics =
                        Array.isArray(
                            topic.subassuntos
                        )
                            ? topic.subassuntos
                            : [];


                    if (
                        subtopics.length >
                        0
                    ) {

                        const list =
                            document.createElement(
                                "div"
                            );


                        list.className =
                            "subtopics";


                        subtopics.forEach(
                            function(subtopic) {

                                const line =
                                    document.createElement(
                                        "div"
                                    );


                                line.textContent =
                                    "– " +
                                    subtopic;


                                list.appendChild(
                                    line
                                );
                            }
                        );


                        topicBox.appendChild(
                            list
                        );
                    }


                    body.appendChild(
                        topicBox
                    );
                }
            );


            box.appendChild(
                header
            );


            box.appendChild(
                body
            );


            subjectsList.appendChild(
                box
            );
        }
    );
}


/* ============================================================
   SELECIONAR TODAS
   ============================================================ */

document
    .getElementById(
        "selectAllButton"
    )
    .addEventListener(
        "click",
        function() {

            document
                .querySelectorAll(
                    ".subject-checkbox"
                )
                .forEach(
                    function(item) {

                        item.checked =
                            true;
                    }
                );
        }
    );

/* ============================================================
   IMPORTAR DISCIPLINA
   ============================================================ */

async function obterOuCriarDisciplina(nome) {

    const {
        data: existente,
        error: searchError
    } =
        await supabaseClient
            .from("subjects")
            .select("id, name")
            .eq("name", nome)
            .limit(1)
            .maybeSingle();


    if (searchError) {
        throw searchError;
    }


    if (existente) {
        return existente;
    }


    const {
        data: criada,
        error: insertError
    } =
        await supabaseClient
            .from("subjects")
            .insert({
                name: nome,
                area: null
            })
            .select("id, name")
            .single();


    if (insertError) {
        throw insertError;
    }


    return criada;
}


/* ============================================================
   VINCULAR DISCIPLINA AO CONCURSO
   ============================================================ */

async function obterOuCriarExamSubject(
    examId,
    subjectId,
    disciplina,
    ordem
) {

    const {
        data: existente,
        error: searchError
    } =
        await supabaseClient
            .from("exam_subjects")
            .select("id")
            .eq("exam_id", examId)
            .eq("subject_id", subjectId)
            .limit(1)
            .maybeSingle();


    if (searchError) {
        throw searchError;
    }


    const valores = {

        question_count:
            disciplina.quantidade_questoes ??
            null,

        weight:
            disciplina.peso ??
            null,

        edital_order:
            ordem
    };


    if (existente) {

        const {
            error: updateError
        } =
            await supabaseClient
                .from("exam_subjects")
                .update(valores)
                .eq(
                    "id",
                    existente.id
                );


        if (updateError) {
            throw updateError;
        }


        return existente.id;
    }


    const {
        data: criado,
        error: insertError
    } =
        await supabaseClient
            .from("exam_subjects")
            .insert({
                exam_id:
                    examId,

                subject_id:
                    subjectId,

                question_count:
                    valores.question_count,

                weight:
                    valores.weight,

                priority:
                    null,

                edital_order:
                    valores.edital_order
            })
            .select("id")
            .single();


    if (insertError) {
        throw insertError;
    }


    return criado.id;
}


/* ============================================================
   IMPORTAR TÓPICOS DE UMA DISCIPLINA
   ============================================================ */

async function importarTopicos(
    examSubjectId,
    subjectId,
    disciplina
) {

    /*
     * Remove somente tópicos anteriormente
     * importados automaticamente pela IA.
     */

    const {
        error: deleteError
    } =
        await supabaseClient
            .from("topics")
            .delete()
            .eq(
                "exam_subject_id",
                examSubjectId
            )
            .eq(
                "source",
                "ai_edital"
            );


    if (deleteError) {
        throw deleteError;
    }


    const assuntos =
        Array.isArray(
            disciplina.assuntos
        )
            ? disciplina.assuntos
            : [];


    let totalCriado =
        0;


    for (
        let topicIndex = 0;
        topicIndex < assuntos.length;
        topicIndex++
    ) {

        const assunto =
            assuntos[topicIndex];


        /*
         * Cria o assunto principal.
         */

        const {
            data: parentTopic,
            error: parentError
        } =
            await supabaseClient
                .from("topics")
                .insert({

                    subject_id:
                        subjectId,

                    exam_subject_id:
                        examSubjectId,

                    parent_id:
                        null,

                    name:
                        assunto.nome,

                    description:
                        null,

                    edital_reference:
                        assunto.referencia ??
                        null,

                    source:
                        "ai_edital",

                    order_index:
                        topicIndex + 1

                })
                .select("id")
                .single();


        if (parentError) {
            throw parentError;
        }


        totalCriado++;


        /*
         * Agora cria os subassuntos,
         * vinculados pelo parent_id.
         */

        const subassuntos =
            Array.isArray(
                assunto.subassuntos
            )
                ? assunto.subassuntos
                : [];


        if (
            subassuntos.length >
            0
        ) {

            const linhas =
                subassuntos.map(
                    function(
                        subassunto,
                        subIndex
                    ) {

                        return {

                            subject_id:
                                subjectId,

                            exam_subject_id:
                                examSubjectId,

                            parent_id:
                                parentTopic.id,

                            name:
                                subassunto,

                            description:
                                null,

                            edital_reference:
                                assunto.referencia ??
                                null,

                            source:
                                "ai_edital",

                            order_index:
                                subIndex + 1
                        };
                    }
                );


            const {
                error: childrenError
            } =
                await supabaseClient
                    .from("topics")
                    .insert(
                        linhas
                    );


            if (childrenError) {
                throw childrenError;
            }


            totalCriado +=
                linhas.length;
        }
    }


    return totalCriado;
}


/* ============================================================
   IMPORTAÇÃO COMPLETA
   ============================================================ */

async function importarAnalise(
    indicesSelecionados
) {

    if (
        !currentAnalysis ||
        !currentAnalysis.result
    ) {

        throw new Error(
            "Nenhuma análise carregada."
        );
    }


    const examId =
        currentAnalysis.exam_id;


    if (!examId) {

        throw new Error(
            "O concurso da análise não foi identificado."
        );
    }


    const disciplinas =
        Array.isArray(
            currentAnalysis
                .result
                .disciplinas
        )
            ? currentAnalysis
                .result
                .disciplinas
            : [];


    let disciplinasImportadas =
        0;

    let topicosImportados =
        0;


    for (
        const indice
        of indicesSelecionados
    ) {

        const disciplina =
            disciplinas[indice];


        if (
            !disciplina ||
            !disciplina.nome
        ) {

            continue;
        }


        /*
         * 1. subjects
         */

        const subject =
            await obterOuCriarDisciplina(
                disciplina.nome
            );


        /*
         * 2. exam_subjects
         */

        const examSubjectId =
            await obterOuCriarExamSubject(

                examId,

                subject.id,

                disciplina,

                indice + 1
            );


        /*
         * 3. topics
         */

        const quantidadeTopicos =
            await importarTopicos(

                examSubjectId,

                subject.id,

                disciplina
            );


        disciplinasImportadas++;

        topicosImportados +=
            quantidadeTopicos;
    }


    return {

        disciplinas:
            disciplinasImportadas,

        topicos:
            topicosImportados
    };
}
/* ============================================================
   CONFIRMAR
   ============================================================ */

document
    .getElementById(
        "confirmButton"
    )
    .addEventListener(
        "click",
        async function() {

            const button =
                document.getElementById(
                    "confirmButton"
                );


            const selecionadas =
                [];


            document
                .querySelectorAll(
                    ".subject-checkbox"
                )
                .forEach(
                    function(item) {

                        if (
                            item.checked
                        ) {

                            selecionadas.push(
                                Number(
                                    item.dataset.index
                                )
                            );
                        }
                    }
                );


            if (
                selecionadas.length === 0
            ) {

                analysisMessage.className =
                    "message error";

                analysisMessage.textContent =
                    "Selecione pelo menos uma disciplina.";

                return;
            }


            /*
             * Segurança extra:
             * não importa se a IA não confirmou o cargo.
             */

            if (
                currentAnalysis
                    ?.result
                    ?.cargo_alvo_encontrado
                !== true
            ) {

                analysisMessage.className =
                    "message error";

                analysisMessage.textContent =
                    "O cargo-alvo ainda não foi confirmado. A importação foi bloqueada.";

                return;
            }


            button.disabled =
                true;


            button.textContent =
                "Importando...";


            analysisMessage.className =
                "message info";


            analysisMessage.textContent =
                "Importando disciplinas, assuntos e subassuntos...";


            try {

                const resultado =
                    await importarAnalise(
                        selecionadas
                    );


                analysisMessage.className =
                    "message info";


                analysisMessage.textContent =
                    "✅ Análise importada com sucesso! " +
                    resultado.disciplinas +
                    " disciplina(s) e " +
                    resultado.topicos +
                    " tópico(s)/subtópico(s) importados.";


                button.textContent =
                    "✅ Importação concluída";


            } catch (error) {

                console.error(
                    "Erro de importação:",
                    error
                );


                analysisMessage.className =
                    "message error";


                analysisMessage.textContent =
                    "Erro ao importar: " +
                    error.message;


                button.textContent =
                    "✅ Confirmar e importar";


            } finally {

                button.disabled =
                    false;
            }
        }
    );


/* ============================================================
   EVENTO DO CONCURSO
   ============================================================ */

examSelect.addEventListener(
    "change",
    function() {

        if (!examSelect.value) {

            analysisArea.style.display =
                "none";

            return;
        }


        carregarAnalise(
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


    await carregarConcursos();
}


iniciarPagina();
