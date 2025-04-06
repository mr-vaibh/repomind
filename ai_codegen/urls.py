from django.urls import path
from .views import (
    codegen,
    start_gemini_session, chat_with_gemini, end_gemini_session,
    load_conversation, clear_conversation
)

app_name = "ai_codegen"
urlpatterns = [
    path("<str:username>/<str:repo>/", codegen, name="codegen"),
    # path("<str:username>/<str:repo>/view/", codegen_view, name="codegen_view"),

    # path("get-raw-file-content/", get_raw_file_content, name="get_file"),

    path("start-gemini-session/", start_gemini_session, name="start_gemini_session"),
    path("chat-with-gemini/", chat_with_gemini, name="chat_with_gemini"),
    path("end-gemini-session/", end_gemini_session, name="end_gemini_session"),

    path("load-conversation/", load_conversation, name="load-conversation"),
    path("clear-conversation/", clear_conversation, name="clear-conversation"),
]
