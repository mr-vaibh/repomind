from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.db import IntegrityError
from django.contrib.auth.models import User

def home(request):
    return render(request, 'dashboard.html')

def login_view(request):
    return render(request, 'login.html')

def login_user(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        print(username, password)

        user = authenticate(request, username=username, password=password)
        print(user)

        if user is not None:
            login(request, user)
            return redirect("github_integration:home")
        else:
            messages.error(request, "Invalid username or password.")

    return render(request, "accounts/login.html")

def register(request):
    if request.method == "POST":
        first_name = request.POST.get("first_name", "").strip()
        last_name = request.POST.get("last_name", "").strip()
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "").strip()
        confirm_password = request.POST.get("confirm_password", "").strip()

        if User.objects.filter(email=email).exists():
            messages.error(request, "Email is already in use.")
            return render(request, "accounts/register.html")

        if password != confirm_password:
            messages.error(request, "Passwords do not match.")
            return render(request, "accounts/register.html")

        try:
            user = User.objects.create_user(username=username, email=email, password=password)
            user.first_name = first_name
            user.last_name = last_name
            user.save()
            return redirect("accounts:login")

        except IntegrityError:
            messages.error(request, "Username or email already exists.")
        except Exception as e:
            messages.error(request, f"Registration failed: {str(e)}")

    return render(request, "accounts/register.html")

def logout_user(request):
    logout(request)
    return redirect("accounts:login")