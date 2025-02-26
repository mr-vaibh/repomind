$(document).ready(function () {
    const username = window.location.pathname.split("/")[2];
    const repoName = window.location.pathname.split("/")[3];
    const apiUrl = `/workspace/${username}/${repoName}/view/`;

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
            let selectedNode = data.node;
        
            if (selectedNode.children.length > 0) {
                // It's a folder: check if it's open, then toggle accordingly
                if ($('#folder-tree').jstree("is_open", selectedNode)) {
                    $('#folder-tree').jstree("close_node", selectedNode);
                } else {
                    $('#folder-tree').jstree("open_node", selectedNode);
                }
            } else {
                // It's a file: fetch content
                let selectedPath = selectedNode.original.path;
        
                $.get(`/workspace/get-file/?username=${username}&repo=${repoName}&path=${selectedPath}`, function (response) {
                    if (response.success) {
                        startGeminiSession(selectedPath, response.content);
                    } else {
                        alert("Error: Could not load file content.");
                    }
                });
            }
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
