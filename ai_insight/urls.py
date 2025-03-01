from django.urls import path
from .views import (
    insight, insight_view,
    get_raw_file_content,
    start_gemini_session, chat_with_gemini, end_gemini_session,
    set_last_active_file, get_last_active_file,
    get_file_chat_history, clear_chat_history
)

app_name = "ai_insight"
urlpatterns = [
    path("<str:username>/<str:repo>/", insight, name="insight"),
    path("<str:username>/<str:repo>/view/", insight_view, name="insight_view"),

    path("get-raw-file-content/", get_raw_file_content, name="get_file"),

    path("start-gemini-session/", start_gemini_session, name="start_gemini_session"),
    path("chat-with-gemini/", chat_with_gemini, name="chat_with_gemini"),
    path("end-gemini-session/", end_gemini_session, name="end_gemini_session"),

    path("set-last-active-file/", set_last_active_file, name="set_last_active_file"),
    path("get-last-active-file/", get_last_active_file, name="get_last_active_file"),

    path("get-file-chat-history/", get_file_chat_history, name="get_file_chat_history"),
    path("clear-chat-history/", clear_chat_history, name="clear_chat_history"),
]
