from django.urls import path
from django.http import HttpResponse
from . import views
from .views import *

urlpatterns = [
    # CRO Report Generation
    path('generate-cro-audit/', upload_csv_files_with_token, name='generate_cro_audit'),
    path('chat/', chat_with_assistant, name='chat_with_assistant'),
    path('chat/history/', get_chat_history, name='get_chat_history'),
    path('chat/threads/', get_chat_threads_with_messages, name='get_chat_threads'),
    path('chat/current_thread/', get_or_create_chat_thread, name='get_or_create_chat_thread'),

    # CRO Report Management
    path('reports/', views.list_cro_reports, name='list_cro_reports'),
    path('reports/get/', views.get_cro_report, name='get_cro_report'),
    path('reports/all/', views.get_all_reports, name='get_all_reports'),

    # Individual Analysis Functions (if needed separately)
    path('analyze/ga4/', views.ga4_function_sync, name='analyze_ga4'),
    path('analyze/shopify/', views.shopify_function_sync, name='analyze_shopify'),
    path('analyze/hotjar/', views.hotjar_function_sync, name='analyze_hotjar'),

    # Comprehensive Analysis
    path('analyze/comprehensive/', views.comprehensive_cro_audit_sync, name='comprehensive_analysis'),

    # Test endpoint for API keys
    path('test-api-keys/', views.test_api_keys, name='test_api_keys'),

    # Debug endpoint for provider parsing
    path('debug-provider/', views.debug_provider, name='debug_provider'),

    # Test endpoint for comprehensive audit
    path('test-comprehensive-audit/', views.test_comprehensive_audit, name='test_comprehensive_audit'),

    path('profile/', views.manage_profile, name='manage_profile'),
    path('profile/change-password/', views.change_password, name='change_password'),

    # User Settings Management
    path('user/settings/', views.user_settings, name='user_settings'),
    path('user/update_profile_picture/', views.update_profile_picture, name='update_profile_picture'),

    # Health Check for Docker/Kubernetes
    path('health/', lambda request: HttpResponse("OK"), name='health_check'),
]
