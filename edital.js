/* ============================================================
   APROVATRACK
   UPLOAD E CONTROLE DE EDITAIS
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


console.log(
    "Página de editais carregada"
);


/* ============================================================
   ELEMENTOS
   ============================================================ */

const noticeForm =
    document.getElementById(
        "noticeForm"
    );

const examSelect =
    document.getElementById(
        "examSelect"
    );

const noticeFile =
    document.getElementById(
        "noticeFile"
    );

const noticeMessage =
    document.getElementById(
        "noticeMessage"
    );

const noticeList =
    document.getElementById(
        "noticeList"
    );

const uploadButton =
    document.getElementById(
        "uploadButton"
    );


/* ============================================================
   VERIFICAR LOGIN
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

        window.location.href = "/";

        return null;
    }


    return data.session.user;
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


    const defaultOption =
        document.createElement(
            "option"
        );


    defaultOption.value = "";

    defaultOption.textContent =
        "Selecione um concurso";


    examSelect.appendChild(
        defaultOption
    );


    if (error) {

        console.error(error);

        noticeMessage.className =
            "message error";

        noticeMessage.textContent =
            "Não foi possível carregar seus concursos.";

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


            if (exam.position) {

                option.textContent =
                    exam.name +
                    " — " +
                    exam.position;

            } else {

                option.textContent =
                    exam.name;
            }


            examSelect.appendChild(
                option
            );
        }
    );
}


/* ============================================================
   LIMPAR NOME DO ARQUIVO
   ============================================================ */

function limparNomeArquivo(
    fileName
) {

    return fileName

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );
}


/* ============================================================
   UPLOAD
   ============================================================ */

noticeForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        noticeMessage.className =
            "message info";

        noticeMessage.textContent =
            "Preparando o envio...";


        uploadButton.disabled =
            true;


        try {

            const user =
                await verificarLogin();


            if (!user) {
                return;
            }


            const examId =
                examSelect.value;


            const file =
                noticeFile.files[0];


            if (!examId) {

                throw new Error(
                    "Selecione um concurso."
                );
            }


            if (!file) {

                throw new Error(
                    "Selecione o edital em PDF."
                );
            }


            if (
                file.type !==
                "application/pdf"
            ) {

                throw new Error(
                    "O arquivo precisa estar em formato PDF."
                );
            }


            const maxSize =
                50 *
                1024 *
                1024;


            if (
                file.size >
                maxSize
            ) {

                throw new Error(
                    "O PDF ultrapassa o limite de 50 MB."
                );
            }


            noticeMessage.textContent =
                "Enviando PDF...";


            const safeFileName =
                limparNomeArquivo(
                    file.name
                );


            const storagePath =
                user.id +
                "/" +
                examId +
                "/" +
                Date.now() +
                "-" +
                safeFileName;


            const {
                data: uploadData,
                error: uploadError
            } =
                await supabaseClient
                    .storage
                    .from(
                        "editais"
                    )
                    .upload(
                        storagePath,
                        file,
                        {
                            contentType:
                                "application/pdf",

                            upsert:
                                false
                        }
                    );


            if (uploadError) {

                throw uploadError;
            }


            noticeMessage.textContent =
                "Registrando edital...";


            const {
                data: noticeData,
                error: noticeError
            } =
                await supabaseClient
                    .from(
                        "notices"
                    )
                    .insert({
                        exam_id:
                            examId,

                        file_url:
                            uploadData.path,

                        file_name:
                            file.name,

                        version:
                            1,

                        analysis_status:
                            "pending"
                    })
                    .select()
                    .single();


            if (noticeError) {

                await supabaseClient
                    .storage
                    .from(
                        "editais"
                    )
                    .remove([
                        uploadData.path
                    ]);


                throw noticeError;
            }


            console.log(
                "Edital registrado:",
                noticeData
            );


            noticeMessage.className =
                "message success";

            noticeMessage.textContent =
                "Edital enviado com sucesso!";


            noticeFile.value =
                "";


            await carregarEditais(
                examId
            );


        } catch (error) {

            console.error(error);


            noticeMessage.className =
                "message error";


            noticeMessage.textContent =
                "Erro: " +
                error.message;

        } finally {

            uploadButton.disabled =
                false;
        }
    }
);


/* ============================================================
   CARREGAR EDITAIS
   ============================================================ */

async function carregarEditais(
    examId
) {

    if (!examId) {

        noticeList.innerHTML =
            "<p class='empty'>Escolha um concurso para visualizar seus editais.</p>";

        return;
    }


    noticeList.innerHTML =
        "<p class='empty'>Carregando...</p>";


    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "notices"
            )
            .select(
                "id, file_name, version, analysis_status, created_at"
            )
            .eq(
                "exam_id",
                examId
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);


        noticeList.innerHTML =
            "<p class='empty'>Não foi possível carregar os editais.</p>";

        return;
    }


    noticeList.innerHTML = "";


    if (
        !data ||
        data.length === 0
    ) {

        noticeList.innerHTML =
            "<p class='empty'>Nenhum edital enviado para este concurso.</p>";

        return;
    }


    data.forEach(
        function(notice) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "notice-card";


            const name =
                document.createElement(
                    "div"
                );


            name.className =
                "notice-name";


            name.textContent =
                "📄 " +
                notice.file_name;


            const detail =
                document.createElement(
                    "div"
                );


            detail.className =
                "notice-detail";


            let statusText =
                notice.analysis_status;


            if (
                notice.analysis_status ===
                "pending"
            ) {

                statusText =
                    "Aguardando análise";
            }


            if (
                notice.analysis_status ===
                "processing"
            ) {

                statusText =
                    "Em análise";
            }


            if (
                notice.analysis_status ===
                "completed"
            ) {

                statusText =
                    "Análise concluída";
            }


            detail.textContent =
                "Versão " +
                notice.version +
                " • " +
                statusText;


            card.appendChild(
                name
            );


            card.appendChild(
                detail
            );


            noticeList.appendChild(
                card
            );
        }
    );
}


/* ============================================================
   ALTERAR CONCURSO
   ============================================================ */

examSelect.addEventListener(
    "change",
    function() {

        carregarEditais(
            examSelect.value
        );
    }
);


/* ============================================================
   INICIAR PÁGINA
   ============================================================ */
/* ============================================================
   TESTAR EDGE FUNCTION / IA
   ============================================================ */

const testAiButton =
    document.getElementById(
        "testAiButton"
    );


testAiButton.addEventListener(
    "click",
    async function() {

        noticeMessage.className =
            "message info";

        noticeMessage.textContent =
            "Testando conexão com a inteligência artificial...";


        testAiButton.disabled =
            true;


        try {

            const user =
                await verificarLogin();


            if (!user) {
                return;
            }


            const {
                data,
                error
            } =
                await supabaseClient
                    .functions
                    .invoke(
                        "analisar-edital",
                        {
                            body: {
                                notice_id:
                                    "teste"
                            }
                        }
                    );


            if (error) {
                throw error;
            }


            console.log(
                "Resposta da IA:",
                data
            );


            if (
                data &&
                data.ok === true &&
                data.gemini_configured === true
            ) {

                noticeMessage.className =
                    "message success";

                noticeMessage.textContent =
                    "✅ Conexão com a IA funcionando! Edge Function e chave Gemini estão configuradas corretamente.";

            } else {

                throw new Error(
                    "A função respondeu, mas a configuração da IA não foi confirmada."
                );
            }


        } catch (error) {

            console.error(
                error
            );


            noticeMessage.className =
                "message error";

            noticeMessage.textContent =
                "Erro ao testar IA: " +
                error.message;

        } finally {

            testAiButton.disabled =
                false;
        }
    }
);
async function iniciarPagina() {

    const user =
        await verificarLogin();


    if (!user) {
        return;
    }


    await carregarConcursos();
}


iniciarPagina();
