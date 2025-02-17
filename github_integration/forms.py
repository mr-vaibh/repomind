from django import forms
from .models import GitHubAccount

class GitHubAccountForm(forms.ModelForm):
    class Meta:
        model = GitHubAccount
        fields = ["username", "api_key"]
