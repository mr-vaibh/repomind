# Generated by Django 5.1.6 on 2025-04-06 19:33

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ai_codegen', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='repoconversation',
            options={'ordering': ['updated_at']},
        ),
        migrations.AlterUniqueTogether(
            name='repoconversation',
            unique_together={('username', 'repo_name')},
        ),
        migrations.AddField(
            model_name='repoconversation',
            name='conversation',
            field=models.JSONField(default=list),
        ),
        migrations.AddField(
            model_name='repoconversation',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.RemoveField(
            model_name='repoconversation',
            name='prompt',
        ),
        migrations.RemoveField(
            model_name='repoconversation',
            name='response',
        ),
        migrations.RemoveField(
            model_name='repoconversation',
            name='session_id',
        ),
        migrations.RemoveField(
            model_name='repoconversation',
            name='timestamp',
        ),
    ]
