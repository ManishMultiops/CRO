from django.urls import path
from .views import *
from .views import RefreshTokenAPI
from rest_framework_simplejwt.views import TokenVerifyView

urlpatterns = [
    path('signup/', RegisterAPI.as_view(), name='signup'),
    path('login/', LoginAPI.as_view(), name='login'),
    path('logout/', LogoutAPI.as_view(), name='logout'),
    path('user/', UserAPI.as_view(), name='user'),
    path('token/refresh/', RefreshTokenAPI.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    path('forgot-password/', ForgotPasswordRequestAPI.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordAPI.as_view(), name='reset_password'),
    path('generate-otp/', GenerateOTPAPI.as_view(), name='generate_otp'),
    path('verify-otp-reset-password/', VerifyOTPAndResetPasswordAPI.as_view(), name='verify_otp_reset_password'),

]
