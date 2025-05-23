$(document).ready(function () {
    const folderTree = $('#folder-tree');
    const chatbox = $('#chatbox');

    let currentSessionId = null; // Track the current session

    // Clear last opened file on page load
    setCurrentFilePath(null);

    // Initialize repository structure
    $.get(`/insight/${username}/${repoName}/view/`)
        .done(initFileTree)
        .fail(() => alert("Failed to load repository structure."));

    function initFileTree(data) {
        if (data.error) return alert("Error: " + data.error);

        // Sort nodes in the folder structure - folders first, then files alphabetically
        // Code below is a speghetti mess, but it works
        // For reference - https://stackoverflow.com/questions/41061535/jstree-how-to-sort-jstree-nodes-with-folders-at-the-top
        // HAIL CHATGPT
        const sortNodes = (nodes) => nodes.sort((a, b) => {
            const aIsFolder = a.type === "folder";
            const bIsFolder = b.type === "folder";

            if (aIsFolder && !bIsFolder) return -1; // Folders first
            if (!aIsFolder && bIsFolder) return 1;  // Files after folders
            return a.text.localeCompare(b.text);    // Alphabetical order
        });

        const recursiveSort = (node) => {
            if (node.children) node.children = sortNodes(node.children).map(recursiveSort);
            return node;
        };

        data.tree = sortNodes(data.tree).map(recursiveSort);

        folderTree.jstree({
            core: { data: data.tree, themes: { dots: false, icons: true } },
            types: { default: { icon: 'jstree-file' }, folder: { icon: 'jstree-folder' } },
            plugins: ["types"]
        });

        folderTree.on("select_node.jstree", handleNodeSelection);
    }

    function handleNodeSelection(e, data) {
        let selectedNode = data.node;
        if (selectedNode.children.length > 0) {
            folderTree.jstree("toggle_node", selectedNode); // Toggle folders
        } else {
            console.log("Selected file:", selectedNode.original.path);
            loadFileHistory(selectedNode.original.path, true);
        }
    }

    function loadFileHistory(filePath, startAI = false) {
        // **End previous session before loading new file**
        if (currentSessionId) endCurrentSession();

        $.get(`/insight/get-raw-file-content/?username=${username}&repo=${repoName}&path=${filePath}`)
            .done(response => {
                if (!response.success) return alert("Error: Could not load file content.");

                let fileContent = response.content;

                // Now load chat history
                $.get(`/insight/get-file-chat-history/?repo=${repoName}&path=${filePath}`)
                    .done(chatResponse => {
                        let chatHistory = chatResponse.success ? chatResponse.conversation : [];
                        loadChatHistory(chatHistory);

                        if (startAI) {
                            let combinedContent = `This is the file content:\n${fileContent}\n\nPrevious chat history:\n${chatHistory.map(msg => msg.sender + ": " + msg.message).join("\n")}`;
                            startGeminiSession(filePath, combinedContent, chatHistory);
                        }
                    });

                // Store last active file
                setCurrentFilePath(filePath);

                $.post("/insight/set-last-active-file/", { file_path: filePath });
            })
            .fail(() => alert("Error: Could not load file content."));
    }

    function startGeminiSession(filePath, fileContent, chatHistory) {
        // Disable input
        const chatInput = $("#chat-input");
        const sendBtn = $("#send-btn");

        chatInput.prop("disabled", true).attr("placeholder", "Analyzing file...");
        sendBtn.prop("disabled", true).html(`<i class="fas fa-spinner fa-spin"></i> Analyzing...`);

        // TODO: this does not work
        $("#chatbox").scrollTop($("#chatbox")[0].scrollHeight);

        // Show loader bubble in chatbox
        chatbox.empty().append(`
            <div id="loading-overlay" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="bg-white bg-opacity-80 rounded-lg px-6 py-4 shadow-lg flex flex-col items-center gap-3">
                <div class="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                <p class="text-gray-700 text-sm font-medium animate-pulse">RepoMind is reading your code...</p>
                </div>
            </div>    
        `);

        $.post("/insight/start-gemini-session/", { username, repoName, filePath, fileContent })
            .done(response => {
                if (!response.success) {
                    alert("Error starting AI session: " + response.error);
                    return;
                }

                chatbox.empty(); // Clear loading overlay
                loadChatHistory(chatHistory); // Load chat history

                currentSessionId = response.session_id;

                if (chatHistory.length <= 0) {
                    $("#ai-loader").remove();
                    chatbox.append(`
                        <div class="bg-blue-100 text-gray-800 max-w-3xl p-4 rounded-lg shadow-md">
                            <p class="text-sm">Hi! I’ve loaded the full file context. Ask me about this file or the repo!</p>
                        </div>
                    `);
                }
            })
            .fail(() => {
                alert("Error: Failed to start AI session.");
            })
            .always(() => {
                // Re-enable input
                chatInput.prop("disabled", false).attr("placeholder", "Ask AI something...");
                sendBtn.prop("disabled", false).html(`<i class="fas fa-paper-plane"></i> Send`);
                $("#ai-loader").remove(); // Just in case
            });
    }

    function endCurrentSession() {
        $.post("/insight/end-gemini-session/", { session_id: currentSessionId })
            .done(() => {
                console.log("Previous session ended.");
                currentSessionId = null;
            })
            .fail(() => console.warn("Failed to end previous session."));
    }

    function loadChatHistory(conversation) {
        chatbox.empty();
        conversation.forEach(msg => appendMessage(msg.sender, msg.message));
    }

    $("#learn-btn").click(function () {
        let currentFile = getCurrentFilePath();
        if (currentFile) {
            loadFileHistory(currentFile, true); // Re-analyze the file
        } else {
            Notiflix.Notify.failure("No file selected.");
        }
    });

    $("#clear-btn").click(function () {
        let currentFile = getCurrentFilePath();

        if (!currentFile) {
            Notiflix.Notify.failure("No file selected.");
            return;
        }

        Notiflix.Confirm.show(
            "Clear Chat",
            "Are you sure you want to delete this chat history?",
            "Yes, Clear",
            "Cancel",
            function () {
                // Send a request to delete chat history from the database
                $.post("/insight/clear-chat-history/", {
                    username: username,
                    repo_name: repoName,
                    file_path: currentFile
                })
                    .done(response => {
                        if (response.success) {
                            $("#chatbox").empty().append(`<p class="text-gray-400 text-center">Start a conversation...</p>`);
                            location.reload(); // Refresh page to reset state
                        } else {
                            Notiflix.Notify.failure("Failed to clear chat history.");
                        }
                    })
                    .fail(() => Notiflix.Notify.failure("Error: Could not delete chat history."));
            }
        );
    });

    // **End session when the page is unloaded**
    $(window).on("beforeunload", function () {
        endCurrentSession();
    });
});
