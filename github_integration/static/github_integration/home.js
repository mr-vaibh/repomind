$(document).ready(function () {
    // Function to format datetime
    function formatDateTime(dateString) {
        let date = new Date(dateString);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });
    }

    // Fetch API Keys
    function loadApiKeys() {
        $.get("/get-keys/")
            .done(function (data) {
                let rows = "";
                data?.keys?.forEach(key => {
                    rows += `
                        <tr class="hover:bg-gray-100 transition" id="row-${key.id}">
                            <td class="py-3 px-4">
                                <span class="select-github text-blue-500 cursor-pointer hover:underline" data-api-user="${key.username}">
                                    ${key.username}
                                </span>
                            </td>
                            <td class="py-3 px-4">
                                <span class="hidden-key" data-id="${key.id}">••••••••••••</span>
                                <span class="full-key hidden" data-id="${key.id}">${key.api_key}</span>
                                <button class="toggle-key text-blue-500 ml-2" data-id="${key.id}">Show</button>
                            </td>
                            <td class="py-3 px-4">${formatDateTime(key.datetime)}</td>
                            <td class="py-3 px-4 text-center">
                                <button class="delete-key px-3 py-1 bg-red-500 text-white rounded-md shadow hover:bg-red-600 transition" data-id="${key.id}">Delete</button>
                            </td>
                        </tr>
                    `;
                });
                $("#api-keys-list").html(rows);
            })
            .fail(function (xhr) {
                alert("Error fetching API keys: " + (xhr.responseJSON?.error || "Something went wrong."));
            });
    }
    loadApiKeys();

    // Show/Hide API Key
    $(document).on("click", ".toggle-key", function () {
        let id = $(this).data("id");
        let hiddenKey = $(`.hidden-key[data-id="${id}"]`);
        let fullKey = $(`.full-key[data-id="${id}"]`);
        if (hiddenKey.is(":visible")) {
            hiddenKey.hide();
            fullKey.show();
            $(this).text("Hide");
        } else {
            hiddenKey.show();
            fullKey.hide();
            $(this).text("Show");
        }
    });

    // Add API Key
    $("#add-api-key-form").submit(function (e) {
        e.preventDefault();
        $.post("/add-key/", {
            csrfmiddlewaretoken: $("input[name=csrfmiddlewaretoken]").val(),
            username: $("#github-username").val(),
            api_key: $("#github-api-key").val()
        })
        .done(function () {
            loadApiKeys();
            $("#modal").addClass("hidden");
        })
        .fail(function (xhr) {
            alert("Error adding API key: " + (xhr.responseJSON?.error || "Something went wrong."));
        });
    });

    // Delete API Key
    $(document).on("click", ".delete-key", function () {
        let id = $(this).data("id");
        $.post("/delete-key/", {
            csrfmiddlewaretoken: $("input[name=csrfmiddlewaretoken]").val(),
            id: id
        })
        .done(function () {
            $(`#row-${id}`).fadeOut();
        })
        .fail(function (xhr) {
            alert("Error deleting API key: " + (xhr.responseJSON?.error || "Something went wrong."));
        });
    });

    // Open & Close Modal
    $("#open-modal").click(() => $("#modal").removeClass("hidden"));
    $("#close-modal").click(() => $("#modal").addClass("hidden"));
});

$(document).on("click", ".select-github", function () {
    let apiUser = $(this).data("api-user");
    window.location.href = `/${apiUser}/repositories/`;
});
