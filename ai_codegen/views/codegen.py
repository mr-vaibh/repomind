import requests
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from google import genai
from ai_codegen.models import FileChat

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
    username = request.POST.get("username")
    repo_name = request.POST.get("repoName")
    file_path = request.POST.get("filePath")
    file_content = request.POST.get("fileContent")

    if not file_content:
        return JsonResponse({"success": False, "error": "No file content provided."})

    # Check if the file has a previous conversation
    file_chat, created = FileChat.objects.get_or_create(
        username=username, repo_name=repo_name, file_path=file_path,
        defaults={"conversation": [], "last_generated_code": ""}
    )

    previous_response = file_chat.last_generated_code if file_chat.last_generated_code else ""

    # Start Gemini AI session
    chat = client.chats.create(model="gemini-2.0-flash")

    if previous_response:
        chat.send_message(f"Previous AI-generated code:\n\n{previous_response}")

    chat.send_message(f"Analyze this code:\n\n{file_content}")

    # Store session
    session_id = request.session.session_key or request.session.create()
    chat_sessions[session_id] = chat
    request.session["active_gemini_session"] = session_id
    request.session.modified = True

    return JsonResponse({"success": True, "message": "AI session started!", "session_id": session_id})

@csrf_exempt
def chat_with_gemini(request):
    message = request.POST.get("message")
    username = request.POST.get("username")
    repo_name = request.POST.get("repoName")
    file_path = request.POST.get("filePath")
    print(file_path)

    session_id = request.session.get("active_gemini_session")
    if not session_id or session_id not in chat_sessions:
        return JsonResponse({"success": False, "error": "No active chat session."})

    chat = chat_sessions[session_id]
    response = chat.send_message(message)

    # Retrieve or create chat history for this file
    file_chat, created = FileChat.objects.get_or_create(
        username=username, repo_name=repo_name, file_path=file_path,
        defaults={"conversation": [], "last_generated_code": ""}
    )

    # Update chat history
    file_chat.conversation.append({"sender": "You", "message": message})
    file_chat.conversation.append({"sender": "AI", "message": response.text})
    file_chat.last_generated_code = response.text  # Store the latest AI-generated response

    file_chat.save()  # ✅ Save to DB

    return JsonResponse({"success": True, "response": response.text})


@csrf_exempt
def end_gemini_session(request):
    session_id = request.session.get("active_gemini_session")
    print(session_id)

    if session_id and session_id in chat_sessions:
        del chat_sessions[session_id]
        request.session.pop("active_gemini_session", None)
        request.session.modified = True

    return JsonResponse({"success": True, "message": "Session ended."})


@csrf_exempt
def get_file_chat(request):
    repo_name = request.GET.get("repo")
    file_path = request.GET.get("path")

    if not repo_name or not file_path:
        return JsonResponse({"success": False, "error": "Missing parameters."})

    try:
        file_chat = FileChat.objects.filter(repo_name=repo_name, file_path=file_path).first()
        if file_chat:
            return JsonResponse({"success": True, "conversation": file_chat.conversation})
        else:
            return JsonResponse({"success": True, "conversation": []})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})
@csrf_exempt
def set_last_active_file(request):
    file_path = request.POST.get("file_path")
    if file_path:
        request.session["last_active_file"] = file_path
        return JsonResponse({"success": True})
    return JsonResponse({"success": False, "error": "Invalid file path."})

def get_last_active_file(request):
    file_path = request.session.get("last_active_file")
    print(file_path)
    if file_path:
        return JsonResponse({"success": True, "file_path": file_path})
    return JsonResponse({"success": False, "file_path": None})