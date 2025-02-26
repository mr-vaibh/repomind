$(document).ready(function () {
    const chatbox = $("#chatbox");
    const chatInput = $("#chat-input");
    const sendBtn = $("#send-btn");

    function appendMessage(sender, message) {
        const messageClass = sender === "You" ? "bg-blue-100" : "bg-green-100";
        chatbox.append(`
            <div class="p-2 my-1 ${messageClass} rounded text-left w-max max-w-xs">
                <strong>${sender}:</strong> ${message}
            </div>
        `);
        chatbox.scrollTop(chatbox[0].scrollHeight);
    }

    sendBtn.click(() => {
        const message = chatInput.val().trim();
        if (!message) return;

        appendMessage("You", message);
        chatInput.val("");

        $.post("/workspace/start-gemini-session/", { message: message }, function (response) {
            if (response.success) {
                appendMessage("AI", response.response);
            } else {
                appendMessage("AI", "Error: " + response.error);
            }
        });
    });

    chatInput.keypress((e) => {
        if (e.which === 13) sendBtn.click();
    });

    // End AI session when the page is refreshed or closed
    window.addEventListener("beforeunload", function () {
        navigator.sendBeacon("/workspace/end-gemini-session/");
    });
});
