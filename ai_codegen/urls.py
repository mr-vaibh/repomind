from django.urls import path
from .views import (
    workspace, workspace_view, get_raw_file_content, start_gemini_session, chat_with_gemini,
    end_gemini_session, set_last_active_file, get_file_chat_history, get_last_active_file
)

app_name = 'ai_codegen'
urlpatterns = [
    path('<str:username>/<str:repo>/', workspace, name='workspace'),
    path("<str:username>/<str:repo>/view/", workspace_view, name="workspace_view"),

    path("get-file/", get_raw_file_content, name="get_file"),
    path("start-gemini-session/", start_gemini_session, name="start_gemini_session"),
    path("chat-with-gemini/", chat_with_gemini, name="chat_with_gemini"),
    path("end-gemini-session/", end_gemini_session, name="end_gemini_session"),

    path('set-last-active-file/', set_last_active_file, name='set_last_active_file'),
    path('get-last-active-file/', get_last_active_file, name='get_last_active_file'),
    path('get-file-chat-history/', get_file_chat_history, name='get_file_chat_history'),
]
