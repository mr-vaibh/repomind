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
});
