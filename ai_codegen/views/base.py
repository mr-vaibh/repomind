import requests
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

# Create your views here.

GITHUB_API_URL = "https://api.github.com/repos/{username}/{repo}/contents/"

@login_required
def codegen(request, username, repo):
    return render(request, 'ai_codegen/codegen.html', { 'username': username, 'repo': repo })
