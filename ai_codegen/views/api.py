import os
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from google import genai

from ..models import RepoConversation

GITHUB_API_URL = "https://api.github.com/repos/{username}/{repo}/contents/"
active_chat_sessions = {}

# Initialize Gemini client (use your actual key or set it via env var)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai_client = genai.Client(api_key=GEMINI_API_KEY)

def fetch_github_files(username, repo, path=""):
    url = GITHUB_API_URL.format(username=username, repo=repo) + path
    print(url)
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Error fetching files: {response.status_code} - {response.text}")
        return []

    contents = response.json()
    files = []

    for item in contents:
        if item["type"] == "file":
            file_content = requests.get(item["download_url"]).text
            files.append({
                "path": item["path"],
                "content": file_content
            })
        elif item["type"] == "dir":
            files += fetch_github_files(username, repo, item["path"])

    return files

def batch_files(files, batch_size=5):
    for i in range(0, len(files), batch_size):
        yield files[i:i + batch_size]

@csrf_exempt
@login_required
def start_gemini_session(request):
    username = request.POST.get("username")
    repo = request.POST.get("repoName")
    session_id = f"{username}_{repo}"

    files = fetch_github_files(username, repo)
    file_batches = list(batch_files(files, 5))

    chat = genai_client.chats.create(model="gemini-2.0-flash")

    for i, batch in enumerate(file_batches):
        formatted_code = ""
        for file in batch:
            formatted_code += f"// {file['path']}\n{file['content']}\n\n"

        prompt = f"""
You're an expert software engineer reviewing code.

Below are {len(batch)} files from a GitHub repo. Read and understand them carefully.

This is batch {i+1} out of {len(file_batches)}. More may follow.

Once you have full context, you’ll be asked questions about the entire project.

-------------
{formatted_code}
-------------
"""
        response = chat.send_message(prompt)
        print(response.text)  # Debugging output

        # Store session and associate it with the user's session
        session_id = request.session.session_key or request.session.create()
        active_chat_sessions[session_id] = chat
        request.session["active_gemini_session"] = session_id
        request.session.modified = True

        # Ensure conversation entry exists
        RepoConversation.objects.get_or_create(username=username, repo_name=repo)

    return JsonResponse({ "message": "Gemini context loaded successfully!", "session_id": session_id })


@csrf_exempt
@login_required
def chat_with_gemini(request):
    username = request.POST.get("username")
    repo = request.POST.get("repoName")
    prompt = request.POST.get("prompt")

    session_id = request.session.get("active_gemini_session")
    if not session_id or session_id not in active_chat_sessions:
        return JsonResponse({"success": False, "error": "No active chat session."})

    chat = active_chat_sessions[session_id]
    if not chat:
        return JsonResponse({ "error": "No active Gemini session." }, status=400)

    response = chat.send_message(prompt)
    # Fetch or create the conversation record
    convo, _ = RepoConversation.objects.get_or_create(username=username, repo_name=repo)
    convo.conversation.append({ "sender": "You", "message": prompt })
    convo.conversation.append({ "sender": "AI", "message": response.text })
    convo.save()

    return JsonResponse({"success": True, "response": response.text })


@csrf_exempt
@login_required
def end_gemini_session(request):
    session_key = request.session.get("active_gemini_session")
    if session_key and session_key in active_chat_sessions:
        del active_chat_sessions[session_key]
    return JsonResponse({ "message": "Session ended." })


@csrf_exempt
@login_required
def load_conversation(request):
    username = request.GET.get("username")
    repo_name = request.GET.get("repo")

    if not all([username, repo_name]):
        return JsonResponse({"success": False, "error": "Missing parameters."})

    try:
        conversation = RepoConversation.objects.get(username=username, repo_name=repo_name)
        return JsonResponse({ "success": True, "conversation": conversation.conversation })
    except RepoConversation.DoesNotExist:
        return JsonResponse({ "success": True, "conversation": [] })


@csrf_exempt
@login_required
def clear_conversation(request):
    username = request.POST.get("username")
    repo_name = request.POST.get("repo")
    session_key = request.session.get("active_gemini_session")

    if not username or not repo_name:
        return JsonResponse({"success": False, "error": "Invalid parameters."})

    RepoConversation.objects.filter(username=username, repo_name=repo_name).update(conversation=[])

    if session_key in active_chat_sessions:
        del active_chat_sessions[session_key]

    return JsonResponse({ "success": True, "message": "Conversation cleared." })
