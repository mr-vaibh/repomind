from django.urls import path
from .views import workspace, workspace_view

app_name = 'ai_codegen'
urlpatterns = [
    path('<str:username>/<str:repo>/', workspace, name='workspace'),
    path("<str:username>/<str:repo>/view/", workspace_view, name="workspace_view"),
]
