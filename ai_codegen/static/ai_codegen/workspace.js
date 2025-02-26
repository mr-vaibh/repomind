$(document).ready(function () {
    const username = window.location.pathname.split("/")[2];
    const repoName = window.location.pathname.split("/")[3];
    const apiUrl = `/workspace/${username}/${repoName}/view/`;
    let activeFile = null;

    $.get(apiUrl, function (data) {
        if (data.error) {
            alert("Error: " + data.error);
            return;
        }

        $('#folder-tree').jstree({
            'core': {
                'data': data.tree,
                'themes': { 'dots': false, 'icons': true }
            },
            'types': {
                'default': { 'icon': 'jstree-file' },
                'folder': { 'icon': 'jstree-folder' }
            },
            'plugins': ["types"]
        });

        $('#folder-tree').on("select_node.jstree", function (e, data) {
            let selectedPath = data.node.original.path;
            activeFile = selectedPath; // Store active file

            // Fetch file content and start AI session
            $.get(`/workspace/get-file/?path=${selectedPath}`, function (response) {
                if (response.success) {
                    startGeminiSession(selectedPath, response.content);
                } else {
                    alert("Error: Could not load file content.");
                }
            });
        });
    }).fail(function () {
        alert("Failed to load repository structure.");
    });

    function startGeminiSession(filePath, fileContent) {
        $.post("/workspace/start-gemini-session/", { filePath, fileContent }, function (response) {
            if (response.success) {
                $("#chatbox").html(`<p class="text-green-600 font-bold">AI is analyzing <strong>${filePath}</strong>. You can now ask questions.</p>`);
            } else {
                alert("Error starting AI session: " + response.error);
            }
        });
    }
});
