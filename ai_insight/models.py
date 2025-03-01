from django.db import models

class FileChat(models.Model):
    username = models.CharField(max_length=100)  # GitHub username
    repo_name = models.CharField(max_length=200)  # Repository name
    file_path = models.CharField(max_length=255)  # File path in the repo
    last_generated_code = models.TextField(blank=True, null=True)  # Store last AI response (if code/text)
    conversation = models.JSONField(default=list)  # Store chat messages efficiently

    updated_at = models.DateTimeField(auto_now=True)  # Track last update

    class Meta:
        unique_together = ("username", "repo_name", "file_path")  # Ensure one record per file