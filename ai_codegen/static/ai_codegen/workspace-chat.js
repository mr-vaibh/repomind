$(document).ready(function () {
    const chatbox = $("#chatbox");
    const chatInput = $("#chat-input");
    const sendBtn = $("#send-btn");

    // Function to append messages
    function appendMessage(sender, message) {
        const messageClass = sender === "You" ? "bg-blue-100" : "bg-green-100";
        chatbox.append(`
            <div class="p-2 my-1 ${messageClass} rounded text-left w-max max-w-xs">
                <strong>${sender}:</strong> ${message}
            </div>
        `);
        chatbox.scrollTop(chatbox[0].scrollHeight); // Auto-scroll
    }

    // Handle Send Button Click
    sendBtn.click(() => {
        const message = chatInput.val().trim();
        if (!message) return;

        appendMessage("You", message);
        chatInput.val("");

        // Simulate AI response
        setTimeout(() => {
            appendMessage("AI", "I'm analyzing your query...");
        }, 1000);
    });

    // Handle Enter Key Press
    chatInput.keypress((e) => {
        if (e.which === 13) sendBtn.click();
    });
});
