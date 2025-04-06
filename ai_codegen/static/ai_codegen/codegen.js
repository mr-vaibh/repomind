$(document).ready(function () {
    const folderTree = $('#folder-tree');
    const chatbox = $('#chatbox');

    let currentSessionId = null; // Track the current session

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
        }
    }

    function loadRepoHistory() {
        // **End previous session before loading new file**
        if (currentSessionId) endCurrentSession();

        $.get(`/codegen/load-conversation/?username=${username}&repo=${repoName}`)
            .done(chatResponse => {
                let chatHistory = chatResponse.success ? chatResponse.conversation : [];
                loadChatHistory(chatHistory);
            });
    }
    function loadChatHistory(conversation) {
        conversation.forEach(msg => appendMessage(msg.sender, msg.message));
    }

    $("#clear-btn").click(function () {
        Notiflix.Confirm.show(
            "Clear Chat",
            "Are you sure you want to delete this chat history?",
            "Yes, Clear",
            "Cancel",
            function () {
                // Send a request to delete chat history from the database
                $.post("/codegen/clear-conversation/", {
                    username: username,
                    repo: repoName,
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

    // Automatically start Gemini context build on load
    Notiflix.Loading.standard('Analyzing repository...');
    $.post("/codegen/start-gemini-session/", { username, repoName })
        .done((res) => {

            currentSessionId = res.session_id; // Store session ID

            if (res.warning_texts) {
                res.warning_texts.forEach(warning => appendMessage("Warning", warning));
                chatbox.append('<hr><br>')
            }

            loadRepoHistory();

            Notiflix.Notify.success(res.message);
            $('#chat-btns').removeClass("hidden");
        })
        .fail(() => {
            Notiflix.Notify.failure("Failed to initialize Gemini session.");
        })
        .always(() => {
            Notiflix.Loading.remove();
        });

    function endCurrentSession() {
        $.post("/insight/end-gemini-session/", { session_id: currentSessionId })
            .done(() => {
                console.log("Previous session ended.");
                currentSessionId = null;
            })
            .fail(() => console.warn("Failed to end previous session."));
    }

    // Clear conversation
    $("#clear-btn").click(function () {
        Notiflix.Confirm.show(
            "Clear Chat",
            "Are you sure you want to clear the conversation?",
            "Yes", "Cancel",
            function () {
                $.post("/codegen/clear-conversation/", { username, repoName })
                    .done(() => {
                        $("#chatbox").html('<p class="text-gray-400 text-center">Start a conversation...</p>');
                        Notiflix.Notify.success("Conversation cleared.");
                    });
            }
        );
    });

    // **End session when the page is unloaded**
    $(window).on("beforeunload", function () {
        endCurrentSession();
    });
});
