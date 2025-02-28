$(document).ready(function () {
    const folderTree = $('#folder-tree');
    const chatbox = $('#chatbox');

    let currentSessionId = null; // Track the current session

    // Clear last opened file on page load
    setCurrentFilePath(null);

    // Initialize repository structure
    $.get(`/workspace/${username}/${repoName}/view/`)
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
            loadFileSession(selectedNode.original.path, true);
        }
    }

    function loadFileSession(filePath, startAI = false) {
        // **End previous session before loading new file**
        if (currentSessionId) endCurrentSession();

        $.get(`/workspace/get-raw-file-content/?username=${username}&repo=${repoName}&path=${filePath}`)
            .done(response => {
                if (!response.success) return alert("Error: Could not load file content.");

                let fileContent = response.content;

                // Now load chat history
                $.get(`/workspace/get-file-chat-history/?repo=${repoName}&path=${filePath}`)
                    .done(chatResponse => {
                        let chatHistory = chatResponse.success ? chatResponse.conversation : [];
                        loadChatHistory(chatHistory);

                        if (startAI) {
                            let combinedContent = `This is the file content:\n${fileContent}\n\nPrevious chat history:\n${chatHistory.map(msg => msg.sender + ": " + msg.message).join("\n")}`;
                            startGeminiSession(filePath, combinedContent, chatHistory.length > 0);
                        }
                    });

                // Store last active file
                setCurrentFilePath(filePath);

                $.post("/workspace/set-last-active-file/", { file_path: filePath });
            })
            .fail(() => alert("Error: Could not load file content."));
    }

    function startGeminiSession(filePath, fileContent, hasChatHistory) {
        // Disable input and show "Generating response..."
        $("#chat-input").prop("disabled", true).attr("placeholder", "Generating response...");
        $("#send-btn").prop("disabled", true).text("...");
        // Show Notiflix loader
        Notiflix.Loading.standard("Starting AI session...");

        $.post("/workspace/start-gemini-session/", { username, repoName, filePath, fileContent })
            .done(response => {
                if (!response.success) return alert("Error starting AI session: " + response.error);

                currentSessionId = response.session_id; // Store session ID

                // Only show AI message if no previous chat exists
                if (!hasChatHistory) {
                    chatbox.append(`<p class="text-green-600 font-bold">AI is analyzing <strong>${filePath}</strong>. You can now ask questions.</p>`);
                }
            })
            .fail(() => alert("Error: Failed to start AI session."))
            .always(() => {
                // Re-enable input and button after response
                $("#chat-input").prop("disabled", false).attr("placeholder", "Ask AI something...");
                $("#send-btn").prop("disabled", false).text("Send");
                Notiflix.Loading.remove();
            });
    }

    function endCurrentSession() {
        $.post("/workspace/end-gemini-session/", { session_id: currentSessionId })
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
            loadFileSession(currentFile, true); // Re-analyze the file
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
                $.post("/workspace/clear-chat-history/", {
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
