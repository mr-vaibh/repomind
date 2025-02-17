# Generated by Django 5.1.6 on 2025-02-16 16:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('github_integration', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='githubaccount',
            name='api_key',
            field=models.CharField(max_length=255, unique=True),
        ),
        migrations.AlterField(
            model_name='githubaccount',
            name='username',
            field=models.CharField(max_length=100, unique=True),
        ),
    ]
