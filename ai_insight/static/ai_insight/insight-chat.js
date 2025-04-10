// insight-chat.js

$(document).ready(function () {
    const chatInput = $("#chat-input");
    const sendBtn = $("#send-btn");

    function sendMessage() {
        const message = chatInput.val().trim();
        if (!message) return;

        appendMessage("You", message);
        chatInput.val("");

        const filePath = localStorage.getItem("CURRENT_FILE_PATH") || "";
        $.post("/insight/chat-with-gemini/", { filePath, username, repoName, message })
            .done(response => {
                appendMessage("AI", response.success ? response.response : "Error processing your request.");
            })
            .fail(() => appendMessage("AI", "Error: Unable to connect to AI service."));
    }

    sendBtn.click(sendMessage);

    chatInput.on("keypress", function (e) {
        if (e.which === 13 && !e.shiftKey) { // Shift+Enter for new line, Enter to send
            e.preventDefault();
            sendMessage();
        }
    });

    $(document).on("click", ".copy-btn", function () {
        const $btn = $(this);
        const targetId = $btn.data("target");
        const codeElement = document.getElementById(targetId);

        if (codeElement) {
            const codeText = codeElement.textContent;

            navigator.clipboard.writeText(codeText).then(() => {
                $btn.html('<i class="fas fa-check"></i> Copied').attr("title", "Copied!");

                setTimeout(() => {
                    $btn.html('<i class="fas fa-copy"></i> Copy').attr("title", "Copy");
                }, 3000); // <-- 3 seconds delay
            });
        }
    });
});
