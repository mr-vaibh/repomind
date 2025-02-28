from django.contrib import admin
from .models import FileChat

@admin.register(FileChat)
class FileChatAdmin(admin.ModelAdmin):
    list_display = ("repo_name", "file_path", "updated_at")  # Display these fields in the list view
    search_fields = ("repo_name", "file_path")  # Enable search by repo and file path
    list_filter = ("repo_name", "updated_at")  # Add filters for repo and date
    readonly_fields = ("updated_at",)  # Prevent modifying timestamps
