// insight-common.js

const username = window.location.pathname.split("/")[2];
const repoName = window.location.pathname.split("/")[3];

$("#repo-name").text(repoName);

function appendMessage(sender, message) {
    const isUser = sender === "You";
    const formattedMessage = formatMessage(message);
    let messageElement;

    if (isUser) {
        // User bubble: right aligned, dark
        messageElement = $(`
            <div class="flex justify-end">
                <div class="bg-gray-800 text-white max-w-xl p-4 rounded-lg shadow-md text-sm">
                    ${formattedMessage}
                </div>
            </div>
        `);
    } else {
        // AI bubble: left aligned, blue
        messageElement = $(`
            <div class="bg-blue-100 text-gray-800 max-w-3xl p-4 rounded-lg shadow-md text-sm">
                ${formattedMessage}
            </div>
        `);
    }

    $("#chatbox").append(messageElement);
    Prism.highlightAllUnder($("#chatbox")[0]);
    $("#chatbox").scrollTop($("#chatbox")[0].scrollHeight);
}


function formatMessage(message) {
    // Escape HTML characters
    const escapeHtml = (str) =>
        str.replace(/&/g, "&amp;")
           .replace(/</g, "&lt;")
           .replace(/>/g, "&gt;")
           .replace(/"/g, "&quot;")
           .replace(/'/g, "&#039;");

    let segments = [];
    let regex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(message)) !== null) {
        const [fullMatch, lang = '', codeContent] = match;

        // Push plain text before the code block
        const textBefore = message.slice(lastIndex, match.index);
        if (textBefore.trim()) {
            segments.push({
                type: 'text',
                content: textBefore
            });
        }

        // Push code block
        segments.push({
            type: 'code',
            lang,
            code: codeContent
        });

        lastIndex = match.index + fullMatch.length;
    }

    // Push remaining text after the last code block
    if (lastIndex < message.length) {
        segments.push({
            type: 'text',
            content: message.slice(lastIndex)
        });
    }

    // Format all segments
    return segments.map(segment => {
        if (segment.type === 'code') {
            const escapedCode = escapeHtml(segment.code);
            const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;
            return `
                <div class="relative group mt-2">
                    <button class="copy-btn absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-gray-700 text-white px-2 py-1 rounded text-xs z-10" data-target="${codeId}" title="Copy">
                        <i class="fas fa-copy"></i>
                    </button>
                    <pre class="bg-gray-900 text-white p-3 rounded-xl overflow-x-auto text-sm"><code id="${codeId}" class="language-${segment.lang}">${escapedCode}</code></pre>
                </div>
            `;
        } else {
            // Text segment: handle inline formatting
            let text = escapeHtml(segment.content);

            // Bold **text**
            text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

            // Inline code `code`
            text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-200 px-1 rounded text-sm">$1</code>');

            // Line breaks
            text = text.replace(/\n/g, "<br>");

            return `<p class="text-sm leading-relaxed">${text}</p>`;
        }
    }).join('');
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

// When the Select a file button is clicked
$("#select-file-btn").on("click", function () {
    const sidebar = $("aside"); // Targeting the sidebar

    // Apply light blue background for the blip effect
    sidebar.css("background-color", "#d0e7ff"); // Light blue background

    // Set a quick reset to the original background after 1 second (blip effect)
    setTimeout(() => {
        sidebar.css("background-color", "white"); // Reset to original color
    }, 1000); // 1 second for the blip effect

    // Optionally, you can add a quick fade effect by using a transition
    sidebar.css("transition", "background-color 1s ease-out");
});
