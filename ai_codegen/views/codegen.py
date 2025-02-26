import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from google import genai

from repomind.settings import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)
chat_sessions = {}

GITHUB_API_BASE = "https://api.github.com/repos"

def get_file_content(request):
    username = request.GET.get("username")  # Get username from request
    repo = request.GET.get("repo")  # Get repo name from request
    file_path = request.GET.get("path")  # File path inside repo

    if not username or not repo or not file_path:
        return JsonResponse({"success": False, "error": "Invalid parameters."})

    # Construct the GitHub raw file URL
    raw_url = f"https://raw.githubusercontent.com/{username}/{repo}/main/{file_path}"

    try:
        response = requests.get(raw_url)

        if response.status_code == 200:
            return JsonResponse({"success": True, "content": response.text})
        else:
            return JsonResponse({"success": False, "error": "File not found in repository."})

    except requests.RequestException as e:
        return JsonResponse({"success": False, "error": str(e)})

@csrf_exempt
def start_gemini_session(request):
    file_path = request.POST.get("filePath")
    file_content = request.POST.get("fileContent")

    if not file_content:
        return JsonResponse({"success": False, "error": "No file content provided."})

    if not request.session.session_key:
        request.session.create()

    session_id = request.session.session_key
    request.session["active_gemini_session"] = session_id
    request.session.modified = True

    chat = client.chats.create(model="gemini-2.0-flash")
    chat.send_message(f"Analyze this code:\n\n{file_content}")

    chat_sessions[session_id] = chat

    return JsonResponse({"success": True, "message": "AI session started!"})

@csrf_exempt
def chat_with_gemini(request):
    message = request.POST.get("message")
    session_id = request.session.get("active_gemini_session")

    if not session_id or session_id not in chat_sessions:
        return JsonResponse({"success": False, "error": "No active chat session."})

    chat = chat_sessions[session_id]
    response = chat.send_message(message)

    return JsonResponse({"success": True, "response": response.text})

@csrf_exempt
def end_gemini_session(request):
    session_id = request.session.get("active_gemini_session")

    if session_id and session_id in chat_sessions:
        del chat_sessions[session_id]
        request.session.pop("active_gemini_session", None)
        request.session.modified = True

    return JsonResponse({"success": True, "message": "Session ended."})
