import requests
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from .models import GitHubAccount
from .forms import GitHubAccountForm

@login_required(login_url="/admin/login/")
def home(request):
    return render(request, 'github_integration/home.html')

@login_required
def github_keys(request):
    accounts = GitHubAccount.objects.filter(user=request.user)  # Fetch only the current user's keys
    form = GitHubAccountForm()

    if request.method == "POST":
        form = GitHubAccountForm(request.POST)
        if form.is_valid():
            github_account = form.save(commit=False)
            github_account.user = request.user
            github_account.save()
            return redirect("github_keys")

    return render(request, "github_integration/github_keys.html", {"accounts": accounts, "form": form})

@login_required
def edit_key(request, pk):
    account = get_object_or_404(GitHubAccount, pk=pk, user=request.user)  # Ensure the user owns it
    if request.method == "POST":
        form = GitHubAccountForm(request.POST, instance=account)
        if form.is_valid():
            form.save()
            return redirect("github_keys")

    return render(request, "github_integration/edit_key.html", {"form": form, "account": account})

@login_required
def delete_key(request, pk):
    account = get_object_or_404(GitHubAccount, pk=pk, user=request.user)
    account.delete()
    return redirect("github_keys")


@login_required
def get_keys(request):
    keys = GitHubAccount.objects.filter(user=request.user).values("id", "username", "api_key", "datetime")
    return JsonResponse({"keys": list(keys)})

@csrf_exempt
@login_required
def add_key(request):
    if request.method == "POST":
        username = request.POST.get("username")
        api_key = request.POST.get("api_key")
        GitHubAccount.objects.create(user=request.user, username=username, api_key=api_key)
        return JsonResponse({"status": "success"})

@csrf_exempt
@login_required
def delete_key(request):
    if request.method == "POST":
        key_id = request.POST.get("id")
        GitHubAccount.objects.filter(id=key_id, user=request.user).delete()
        GitHubAccount.objects.filter(id=key_id, user=request.user).delete()
        return JsonResponse({"status": "deleted"})

@login_required
def repositories_view(request, username):
    return render(request, "github_integration/repositories.html")

@login_required
def get_repositories(request, username):
    github_account = get_object_or_404(GitHubAccount, user=request.user, username=username)
    username = github_account.username
    api_key = github_account.api_key

    headers = {"Authorization": f"Bearer {api_key}"}
    response = requests.get("https://api.github.com/users/" + username + "/repos?per_page=100", headers=headers)

    if response.status_code == 200:
        repos = response.json()
    else:
        repos = []

    return JsonResponse({"repos": repos, "github_user": username})
