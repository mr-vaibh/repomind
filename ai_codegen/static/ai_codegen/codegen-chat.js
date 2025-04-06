// codegen-chat.js

$(document).ready(function () {
    const chatInput = $("#chat-input");
    const sendBtn = $("#send-btn");

    function sendMessage() {
        const message = $("#chat-input").val().trim();
        if (!message) return;

        appendMessage("You", message);
        chatInput.val("");

        $.post("/codegen/chat-with-gemini/", {
            username,
            repoName,
            prompt: message
        }).done((response) => {
            console.log(response);
            appendMessage("AI", response.success ? response.response : "Error processing your request.");
        }).fail(() => {
            appendMessage("AI", "Failed to get Gemini response.");
        })
    }

    sendBtn.click(sendMessage);

    chatInput.on("keypress", function (e) {
        if (e.which === 13 && !e.shiftKey) { // Shift+Enter for new line, Enter to send
            e.preventDefault();
            sendMessage();
        }
    });
});
