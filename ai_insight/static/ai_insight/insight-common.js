// insight-common.js

const username = window.location.pathname.split("/")[2];
const repoName = window.location.pathname.split("/")[3];

$("#repo-name").text(repoName);

function appendMessage(sender, message) {
    const messageClass = sender === "You" ? "bg-blue-100" : "bg-green-100";
    const formattedMessage = formatMessage(message);

    const messageElement = $(`
        <div class="p-2 my-1 ${messageClass} rounded text-left w-full overflow-x-auto">
            <strong>${sender}:</strong> ${formattedMessage}
        </div>
    `);

    $("#chatbox").append(messageElement);
    Prism.highlightAllUnder($("#chatbox")[0]); // Apply syntax highlighting
    $("#chatbox").scrollTop($("#chatbox")[0].scrollHeight);
}

function formatMessage(message) {
    // Handle code blocks
    message = message.replace(/```(\w+)\n([\s\S]*?)```/g, function (match, lang, code) {
        const escapedCode = escapeHtml(code);
        const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;
        return `
            <div class="relative group">
                <button class="copy-btn absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-gray-700 text-white px-2 py-1 rounded" data-target="${codeId}" title="Copy">
                    <i class="fas fa-copy"></i> Copy
                </button>
                <pre class="bg-gray-800 text-white p-2 rounded overflow-x-auto"><code id="${codeId}" class="language-${lang}">${escapedCode}</code></pre>
            </div>
        `;
    });

    // Convert inline code `text` to <code>text</code>
    message = message.replace(/`([^`]+)`/g, '<code class="bg-gray-200 px-1 rounded text-sm">$1</code>');

    // Convert **bold text** to <strong>bold text</strong>
    message = message.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    return message;
}

function escapeHtml(str) {
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function setCurrentFilePath(filePath) {
    const isFileSelected = filePath !== null;
    localStorage.setItem("CURRENT_FILE_PATH", isFileSelected ? filePath : null);
    
    $("#file-name-heading").text(isFileSelected ? `./${filePath}` : "Welcome to RepoMind");
    $("#chat-input").prop("disabled", !isFileSelected).attr("placeholder", isFileSelected ? "Ask AI something..." : "Select a file to start...");
    $("#send-btn").prop("disabled", !isFileSelected);
    $("#chat-btns").toggleClass("hidden", !isFileSelected); // great logic ⭐, only toggles the class if isFileSelected is false
}

function getCurrentFilePath() {
    return localStorage.getItem("CURRENT_FILE_PATH");
}