from django.contrib import admin
from .models import RepoConversation

# Register your models here.

@admin.register(RepoConversation)
class RepoConversationAdmin(admin.ModelAdmin):
    list_display = ('username', 'repo_name', 'updated_at')
    search_fields = ('username', 'repo_name')
    list_filter = ('updated_at',)
    ordering = ('-updated_at',)
    date_hierarchy = 'updated_at'