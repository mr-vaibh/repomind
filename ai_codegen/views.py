import requests
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from github_integration.models import GitHubAccount  # Ensure you have this model

# Create your views here.

GITHUB_API_URL = "https://api.github.com/repos/{username}/{repo}/contents/"

@login_required
def workspace(request, username, repo):
    return render(request, 'ai_codegen/workspace.html', { 'username': username, 'repo': repo })

@login_required
def workspace_view(request, username, repo):
    if not username or not repo:
        return JsonResponse({"error": "Missing username or repository name"}, status=400)

    github_account = request.user.githubaccount_set.filter(username=username).first()
    if not github_account:
        return JsonResponse({"error": "GitHub API key not found"}, status=403)

    api_key = github_account.api_key
    url = f"https://api.github.com/repos/{username}/{repo}/git/trees/main?recursive=1"

    headers = {"Authorization": f"token {api_key}"}
    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        return JsonResponse({"error": "Failed to fetch repository structure"}, status=response.status_code)

    github_tree = response.json().get("tree", [])

    # Convert GitHub API tree format to jstree format
    tree_data = []
    for item in github_tree:
        item_type = "folder" if item["type"] == "tree" else "default"
        tree_data.append({
            "id": item["path"],
            "parent": "#" if "/" not in item["path"] else "/".join(item["path"].split("/")[:-1]),
            "text": item["path"].split("/")[-1],
            "path": item["path"],
            "type": item_type,
        })

    return JsonResponse({"tree": tree_data})
