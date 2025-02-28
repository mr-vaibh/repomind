from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from google import genai
import requests

from ai_codegen.models import FileChat

from repomind.settings import GEMINI_API_KEY

# Create an instance of the Gemini client
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# Dictionary to store active chat sessions
active_chat_sessions = {}

# GitHub API base URL for raw file content
GITHUB_RAW_URL_TEMPLATE = "https://raw.githubusercontent.com/{username}/{repo}/main/{file_path}"

def get_raw_file_content(request):
    """Fetch content from a file in a GitHub repository."""
    username = request.GET.get("username")
    repo = request.GET.get("repo")
    file_path = request.GET.get("path")

    if not all([username, repo, file_path]):
        return JsonResponse({"success": False, "error": "Invalid parameters."})

    raw_url = GITHUB_RAW_URL_TEMPLATE.format(username=username, repo=repo, file_path=file_path)

    try:
        response = requests.get(raw_url)
        if response.status_code == 200:
            return JsonResponse({"success": True, "content": response.text})
        return JsonResponse({"success": False, "error": "File not found in repository."})
    except requests.RequestException as e:
        return JsonResponse({"success": False, "error": str(e)})


@csrf_exempt
def start_gemini_session(request):
    """Initialize a new Gemini chat session and analyze the provided file content."""
    username = request.POST.get("username")
    repo_name = request.POST.get("repoName")
    file_path = request.POST.get("filePath")
    file_content = request.POST.get("fileContent")

    if not file_content:
        return JsonResponse({"success": False, "error": "No file content provided."})

    # Retrieve or create a file chat entry in the database
    file_chat = get_or_create_file_chat_entry(username, repo_name, file_path)

    previous_code = file_chat.last_generated_code or ""

    # Create a new Gemini chat session
    chat = gemini_client.chats.create(model="gemini-2.0-flash")

    if previous_code:
        chat.send_message(f"Previous AI-generated code:\n\n{previous_code}")

    chat.send_message(f"Analyze this code:\n\n{file_content}")

    # Store session and associate it with the user's session
    session_id = request.session.session_key or request.session.create()
    active_chat_sessions[session_id] = chat
    request.session["active_gemini_session"] = session_id
    request.session.modified = True

    return JsonResponse({"success": True, "message": "AI session started!", "session_id": session_id})


@csrf_exempt
def chat_with_gemini(request):
    """Handle communication with Gemini AI during an active session."""
    message = request.POST.get("message")
    username = request.POST.get("username")
    repo_name = request.POST.get("repoName")
    file_path = request.POST.get("filePath")

    session_id = request.session.get("active_gemini_session")
    if not session_id or session_id not in active_chat_sessions:
        return JsonResponse({"success": False, "error": "No active chat session."})

    chat = active_chat_sessions[session_id]
    response = chat.send_message(message)

    # Update chat history in the database
    file_chat = get_or_create_file_chat_entry(username, repo_name, file_path)
    file_chat.conversation.extend([
        {"sender": "You", "message": message},
        {"sender": "AI", "message": response.text}
    ])
    file_chat.last_generated_code = response.text
    file_chat.save()

    return JsonResponse({"success": True, "response": response.text})


@csrf_exempt
def end_gemini_session(request):
    """Terminate the active Gemini session."""
    session_id = request.session.get("active_gemini_session")

    if session_id and session_id in active_chat_sessions:
        del active_chat_sessions[session_id]
        request.session.pop("active_gemini_session", None)
        request.session.modified = True

    return JsonResponse({"success": True, "message": "Session ended."})


def get_file_chat_history(request):
    """Retrieve the chat history for a specific file."""
    repo_name = request.GET.get("repo")
    file_path = request.GET.get("path")

    if not all([repo_name, file_path]):
        return JsonResponse({"success": False, "error": "Missing parameters."})

    file_chat = FileChat.objects.filter(repo_name=repo_name, file_path=file_path).first()
    conversation = file_chat.conversation if file_chat else []

    return JsonResponse({"success": True, "conversation": conversation})

@csrf_exempt
def clear_chat_history(request):
    if request.method == "POST":
        username = request.POST.get("username")
        repo_name = request.POST.get("repo_name")
        file_path = request.POST.get("file_path")

        if not username or not repo_name or not file_path:
            return JsonResponse({"success": False, "error": "Invalid parameters."})

        # Delete the chat history entry
        deleted, _ = FileChat.objects.filter(
            username=username, repo_name=repo_name, file_path=file_path
        ).delete()

        if deleted:
            return JsonResponse({"success": True})
        return JsonResponse({"success": False, "error": "No chat history found for this file."})

    return JsonResponse({"success": False, "error": "Invalid request method."})

@csrf_exempt
def set_last_active_file(request):
    """Set the last active file in the user's session."""
    file_path = request.POST.get("file_path")
    if file_path:
        request.session["last_active_file"] = file_path
        return JsonResponse({"success": True})

    return JsonResponse({"success": False, "error": "Invalid file path."})

def get_last_active_file(request):
    """Retrieve the last active file from the user's session."""
    file_path = request.session.get("last_active_file")
    return JsonResponse({"success": True, "file_path": file_path or None})


def get_or_create_file_chat_entry(username, repo_name, file_path):
    """Helper function to retrieve or create a FileChat entry."""
    return FileChat.objects.get_or_create(
        username=username,
        repo_name=repo_name,
        file_path=file_path,
        defaults={"conversation": [], "last_generated_code": ""}
    )[0]
