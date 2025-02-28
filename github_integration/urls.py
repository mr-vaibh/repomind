from django.urls import path
from .views import home, github_keys, edit_key, delete_key, get_keys, add_key, delete_key, get_repositories, repositories_view

app_name = "github_integration"
urlpatterns = [
    path('', home, name='home'),

    path("github-keys/", github_keys, name="github_keys"),
    path("github-keys/edit/<int:pk>/", edit_key, name="edit_key"),
    path("github-keys/delete/<int:pk>/", delete_key, name="delete_key"),

    path("get-keys/", get_keys, name="get_keys"),
    path("add-key/", add_key, name="add_key"),
    path("delete-key/", delete_key, name="delete_key"),

    path("<str:username>/get-repositories/", get_repositories, name="get_repositories"),
    path("<str:username>/repositories/", repositories_view, name="repositories_view"),
]
