from django.contrib import admin
from .models import *


@admin.register(CROReport)
class CROReportAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'status', 'created_at',
        'processing_time_seconds'
    ]
    list_filter = ['status', 'created_at', 'api_provider']
    search_fields = ['user__username', 'user__email']
    readonly_fields = [
        'id', 'created_at', 'updated_at', 'processing_time_seconds'
    ]

    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'user', 'status', 'api_provider')
        }),
        ('File Information', {
            'fields': ('uploaded_files_info',)
        }),
        ('Reports', {
            'fields': ('ga4_report', 'hotjar_report', 'shopify_report'),
            'classes': ('collapse',)
        }),
        ('Final Report', {
            'fields': ('comprehensive_report',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': (
                'created_at', 'updated_at', 'processing_time_seconds',
                'error_message'
            )
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(UserToken)
class UserTokenAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'created_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['id', 'created_at']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

admin.site.register(ChatMessage)
admin.site.register(UserSettings)
# class ChatMessageAdmin(admin.ModelAdmin):
