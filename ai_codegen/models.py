from django.db import models

class RepoConversation(models.Model):
    username = models.CharField(max_length=100)  # GitHub username
    repo_name = models.CharField(max_length=255)
    conversation = models.JSONField(default=list)

    updated_at = models.DateTimeField(auto_now=True)  # Track last update

    class Meta:
        ordering = ['updated_at']  # Order by last updated time
        unique_together = ('username', 'repo_name')  # Ensure one record per repo