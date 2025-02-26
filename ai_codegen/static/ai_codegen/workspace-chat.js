$(document).ready(function () {
    const chatbox = $("#chatbox");
    const chatInput = $("#chat-input");
    const sendBtn = $("#send-btn");

    function appendMessage(sender, message) {
        const messageClass = sender === "You" ? "bg-blue-100" : "bg-green-100";
        const formattedMessage = formatMessage(message);

        const messageElement = $(`
            <div class="p-2 my-1 ${messageClass} rounded text-left w-full overflow-x-auto">
                <strong>${sender}:</strong> ${formattedMessage}
            </div>
        `);

        chatbox.append(messageElement);
        Prism.highlightAllUnder(chatbox[0]); // Apply syntax highlighting
        chatbox.scrollTop(chatbox[0].scrollHeight);
    }

    function formatMessage(message) {
        // Handle code blocks first
        message = message.replace(/```(\w+)\n([\s\S]*?)```/g, function (match, lang, code) {
            return `<pre class="bg-gray-800 text-white p-2 rounded overflow-x-auto"><code class="language-${lang}">${escapeHtml(code)}</code></pre>`;
        });

        // Convert inline code `text` to <code>text</code>
        message = message.replace(/`([^`]+)`/g, '<code class="bg-gray-200 px-1 rounded text-sm">$1</code>');

        // Convert **bold text** to <strong>bold text</strong> (outside code blocks)
        message = message.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

        return message;
    }

    function escapeHtml(str) {
        return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    sendBtn.click(() => {
        const message = chatInput.val().trim();
        if (!message) return;

        appendMessage("You", message);
        chatInput.val("");

        // Send to Gemini AI
        $.post("/workspace/chat-with-gemini/", { message: message }, function (response) {
            if (response.success) {
                appendMessage("AI", response.response);
            } else {
                appendMessage("AI", "Error processing your request.");
            }
        });
    });

    chatInput.keypress((e) => {
        if (e.which === 13) sendBtn.click();
    });
});
