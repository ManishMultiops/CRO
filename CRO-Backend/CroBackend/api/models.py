from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.validators import RegexValidator
from django.core.validators import FileExtensionValidator
# Create your models here.

class CROReport(models.Model):
    """Model to store CRO audit reports"""

    REPORT_STATUS_CHOICES = [
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('inactive', 'Inactive'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cro_reports')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=REPORT_STATUS_CHOICES, default='processing')

    # Store the individual reports
    ga4_report = models.TextField(blank=True, null=True, help_text="Google Analytics report")
    hotjar_report = models.TextField(blank=True, null=True, help_text="Hotjar analysis report")
    shopify_report = models.TextField(blank=True, null=True, help_text="Shopify data report")

    # Store the comprehensive report
    comprehensive_report = models.TextField(blank=True, null=True, help_text="Combined CRO audit report")

    # Store file information
    uploaded_files_info = models.JSONField(default=dict, help_text="Information about uploaded CSV files")

    # API provider used
    api_provider = models.CharField(max_length=100, default='openai/gpt-4')

    # Report name field
    report_name = models.CharField(max_length=255, null=True, blank=True, help_text="A name for the report")

    # Processing details
    processing_time_seconds = models.FloatField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'CRO Report'
        verbose_name_plural = 'CRO Reports'

    def __str__(self):
        return f"CRO Report for {self.user.username} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

    @property
    def has_ga4_data(self):
        return bool(self.ga4_report)

    @property
    def has_hotjar_data(self):
        return bool(self.hotjar_report)

    @property
    def has_shopify_data(self):
        return bool(self.shopify_report)

    @property
    def completion_percentage(self):
        """Calculate completion percentage based on available reports"""
        total_steps = 4  # ga4, hotjar, shopify, comprehensive
        completed = 0

        if self.ga4_report:
            completed += 1
        if self.hotjar_report:
            completed += 1
        if self.shopify_report:
            completed += 1
        if self.comprehensive_report:
            completed += 1

        return (completed / total_steps) * 100


@receiver(post_save, sender=User)
def create_user_settings(sender, instance, created, **kwargs):
    """
    Automatically create default user settings when a new user is created

    Args:
        sender: User model
        instance: The user instance being saved
        created: Boolean indicating if this is a new user
    """
    if created:
        UserSettings.objects.create(
            user=instance,
            agent_type='RAG',
            ai_provider='OpenAI',
            ai_model='openai/gpt-4',
            temperature=0.7,
            max_tokens=4096
        )


class UserSettings(models.Model):
    """Model to store user preferences for AI agent and provider settings"""

    AI_TYPE_CHOICES = [
        ('RAG', 'Retrieval Augmented Generation'),
        ('MEMO', 'Memory-Based Generation')
    ]

    AI_PROVIDER_CHOICES = [
        ('OpenAI', 'OpenAI'),
        ('Google Gemini', 'Google Gemini')
    ]

    AI_MODEL_CHOICES = [
        ('openai/gpt-4', 'OpenAI GPT-4'),
        ('openai/gpt-3.5-turbo', 'OpenAI GPT-3.5 Turbo'),
        ('gemini/gemini-pro', 'Google Gemini Pro'),
        ('gemini/gemini-1.5-pro', 'Google Gemini 1.5 Pro'),
        ('gemini-2.0-flash', 'Google Gemini 2.0 Flash')
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='ai_settings',
        help_text='User whose settings these are'
    )

    agent_type = models.CharField(
        max_length=10,
        choices=AI_TYPE_CHOICES,
        default='RAG',
        help_text='Type of AI agent to use for analysis'
    )

    ai_provider = models.CharField(
        max_length=20,
        choices=AI_PROVIDER_CHOICES,
        default='OpenAI',
        help_text='AI service provider for generating reports'
    )

    ai_model = models.CharField(
        max_length=50,
        choices=AI_MODEL_CHOICES,
        default='openai/gpt-4',
        help_text='Specific AI model to use for generating reports'
    )

    temperature = models.FloatField(
        default=0.7,
        help_text='Creativity/randomness of AI output (0.0-1.0)',
        validators=[
            RegexValidator(
                regex=r'^(0(\.\d+)?|1(\.0)?)$',
                message='Temperature must be between 0.0 and 1.0'
            )
        ]
    )

    max_tokens = models.PositiveIntegerField(
        default=4096,
        help_text='Maximum number of tokens for AI response'
    )
    openai_key = models.CharField(max_length=255, blank=True, null=True)
    google_key = models.CharField(max_length=255, blank=True, null=True)

    # User profile information
    job_title = models.CharField(max_length=100, blank=True, null=True, help_text='User job title')
    company_name = models.CharField(max_length=100, blank=True, null=True, help_text='User company name')

from django.conf import settings
from django.db import models


class UserToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_tokens')
    token = models.TextField(unique=True)
    refresh_token = models.TextField(unique=True,null=True,blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"UserToken(user={self.user.username}, token={self.token[:10]}...)"

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    job_title = models.CharField(max_length=100, null=True, blank=True)
    company_name = models.CharField(max_length=100, null=True, blank=True)
    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        null=True,
        blank=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=['jpg', 'jpeg', 'png', 'gif']
            )
        ],
        help_text='Profile picture (max 5MB, jpg/png/gif)'
    )

    # Account preferences
    receive_email_updates = models.BooleanField(default=True)
    show_online_status = models.BooleanField(default=False)
    enable_dark_mode = models.BooleanField(default=False)
    def __str__(self):
        return f"{self.user.username}'s AI Settings"

    def save(self, *args, **kwargs):
            # Optional: Add file size validation
            if self.profile_picture and self.profile_picture.size > 5 * 1024 * 1024:  # 5MB
                raise ValidationError("Profile picture must be less than 5MB")

            super().save(*args, **kwargs)
    class Meta:
        verbose_name = 'User AI Settings'
        verbose_name_plural = 'User AI Settings'


class ChatMessage(models.Model):
    """Model to store chat messages for conversations"""

    SENDER_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_messages')
    chat_id = models.CharField(max_length=255, db_index=True, help_text="Identifier for the chat session")
    report = models.ForeignKey(CROReport, null=True, blank=True, on_delete=models.SET_NULL, related_name='chat_messages')
    sender = models.CharField(max_length=20, choices=SENDER_CHOICES)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']
        verbose_name = 'Chat Message'
        verbose_name_plural = 'Chat Messages'

    def __str__(self):
        return f"{self.user.username} - {self.sender} @ {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"
