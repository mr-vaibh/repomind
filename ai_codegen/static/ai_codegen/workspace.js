$(document).ready(function () {
    const username = window.location.pathname.split("/")[2];  // Get username from URL
    const repoName = window.location.pathname.split("/")[3]; // Get repo name from URL
    const apiUrl = `/workspace/${username}/${repoName}/view/`;
    console.log(username, repoName)

    $.get(apiUrl, function (data) {
        console.log(data);
        if (data.error) {
            alert("Error: " + data.error);
            return;
        }

        $('#folder-tree').jstree({
            'core': {
                'data': data.tree,
                'themes': {
                    'dots': false,
                    'icons': true
                }
            },
            'types': {
                'default': { 'icon': 'jstree-file' },  // Uses default jstree file icon
                'folder': { 'icon': 'jstree-folder' }  // Uses default jstree folder icon
            },
            'plugins': ["types"]
        });

        $('#folder-tree').on("select_node.jstree", function (e, data) {
            let selectedPath = data.node.original.path;
            alert("Selected file: " + selectedPath);  // Placeholder for now
        });
    }).fail(function () {
        alert("Failed to load repository structure.");
    });
});
