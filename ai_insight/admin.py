from django.contrib import admin
from .models import FileChat

@admin.register(FileChat)
class FileChatAdmin(admin.ModelAdmin):
    list_display = ("repo_name", "file_path", "updated_at")
    search_fields = ("username", "repo_name", "file_path")
    list_filter = ("username", "repo_name", "updated_at")
    readonly_fields = ("updated_at",)