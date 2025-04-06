$(document).ready(function () {
    let apiUser = window.location.pathname.split("/")[1]; // Extract API key from URL
    let allRepos = [];  // Store all repositories
    let filteredRepos = []; // Store filtered repositories

    // Function to load repositories from the API
    function loadRepositories() {
        $.ajax({
            url: `/${apiUser}/get-repositories/`,
            type: "GET",
            success: function (data) {
                console.log(data);

                allRepos = data?.repos || []; // Store all repositories
                
                // Initially display all repositories
                filteredRepos = allRepos;
                displayRepositories(filteredRepos);
            },
            error: function () {
                alert("Failed to load repositories. Please try again.");
            }
        });
    }

    // Function to display the repositories
    function displayRepositories(repositories) {
        let reposHTML = "";

        repositories.forEach(repo => {
            reposHTML += `
                <div class="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer border border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-800 truncate">${repo.name}</h3>
                    <p class="text-sm text-gray-600 mt-2">${repo.description || "No description available"}</p>
                    <div class="mt-3 flex justify-between items-center">
                        <span class="text-xs text-gray-500">${new Date(repo.updated_at).toLocaleDateString()}</span>
                        <div>
                            <a href="/insight/${apiUser}/${repo.name}/" class="inline-block">
                                <button class="bg-blue-600 text-white px-3 py-1 rounded-lg shadow-md hover:bg-blue-700 transition">
                                    Insight
                                </button>
                            </a>
                            <a href="/codegen/${apiUser}/${repo.name}/" class="inline-block">
                                <button class="bg-blue-600 text-white px-3 py-1 rounded-lg shadow-md hover:bg-blue-700 transition">
                                    Codegen
                                </button>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        });

        // Clear the repo list and append the new repos
        $("#repo-list").html(reposHTML);
    }

    // Function to handle the search input
    $("#repo-search").on("input", function () {
        let searchQuery = $(this).val().toLowerCase();

        // Filter repositories based on search query
        filteredRepos = allRepos.filter(repo => 
            repo.name.toLowerCase().includes(searchQuery)
        );

        // Display filtered repositories
        displayRepositories(filteredRepos);
    });

    // Initial call to load repositories
    loadRepositories();
});
