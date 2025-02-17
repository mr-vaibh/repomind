$(document).ready(function () {
    let apiUser = window.location.pathname.split("/")[1]; // Extract API key from URL

    function loadRepositories() {
        $.ajax({
            url: `/${apiUser}/get-repositories/`,
            type: "GET",
            success: function (data) {
                let repos = "";

                console.log(data);
                
                data?.repos?.forEach(repo => {
                    repos += `
                        <div class="bg-white p-4 rounded-lg shadow hover:shadow-md transition cursor-pointer border border-gray-200">
                            <h3 class="text-lg font-semibold text-gray-700">${repo.name}</h3>
                            <p class="text-sm text-gray-500">${repo.description || "No description"}</p>
                            <div class="mt-2 flex justify-between items-center">
                                <span class="text-sm text-gray-400">${repo.updated_at}</span>
                                <a href="/workspace/${apiUser}/${repo.name}/" class="select-repo">
                                    <button class="bg-blue-500 text-white px-3 py-1 rounded-md shadow hover:bg-blue-600 transition">
                                        Open
                                    </button>
                                </a>
                            </div>
                        </div>
                    `;
                });
                $("#repo-list").html(repos);
            },
            error: function () {
                alert("Failed to load repositories. Please try again.");
            }
        });
    }

    loadRepositories();
});