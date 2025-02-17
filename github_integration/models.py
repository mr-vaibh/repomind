from django.contrib.auth.models import User
from django.db import models

class GitHubAccount(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    username = models.CharField(unique=True, max_length=100)
    api_key = models.CharField(unique=True, max_length=255)
    datetime = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} - {self.user.username}"
