from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer
import random
import string
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
# from rest_framework import generics, permissions, status
# from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User


# Register API
from django.conf import settings
from api.models import UserToken

class RegisterAPI(generics.GenericAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        # Store the access token in UserToken model
        UserToken.objects.create(user=user, token=str(refresh.access_token),refresh_token=str(refresh))

        return Response({

            "message": "User registered successfully"
        }, status=status.HTTP_201_CREATED)

# Login API
from django.conf import settings
from api.models import UserToken

class LoginAPI(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']  # get user instance from validated_data

        refresh_token = None
        access_token = None
        try:
            u = UserToken.objects.get(user=user)
            refresh_token = u.refresh_token
            access_token = u.token
        except UserToken.DoesNotExist:
            refresh = RefreshToken.for_user(user)
            u = UserToken.objects.create(user=user, token=str(refresh.access_token), refresh_token=str(refresh))
            refresh_token: str(refresh)
            access_token: str(refresh.access_token)
        # Store the access token in UserToken model
        # UserToken.objects.create(user=user, token=str(refresh.access_token))

        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "refresh": refresh_token,
            "access": access_token,
        }, status=status.HTTP_200_OK)
# Logout API
class LogoutAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)

# Get User API
class UserAPI(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

# Refresh Token API
class RefreshTokenAPI(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            print(token.access_token," here")
            return Response({
                "access": str(token.access_token),
            })
        except Exception as e:
            return Response(
                {"error": "Invalid or expired refresh token"},
                status=status.HTTP_400_BAD_REQUEST
            )

class ForgotPasswordRequestAPI(APIView):
    """
    API endpoint for requesting password reset
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        Handle forgot password request

        Request payload:
        {
            "email": "user@example.com"
        }
        """
        email = request.data.get('email')

        if not email:
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Find the user by email
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal if email exists or not for security
            return Response(
                {"message": "If an account exists with this email, a reset link will be sent"},
                status=status.HTTP_200_OK
            )

        # Generate a password reset token
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        # Construct reset link (you'll customize this based on your frontend)
        reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

        # Send email
        try:
            send_mail(
                'Password Reset Request',
                f'Click the following link to reset your password: {reset_link}',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
        except Exception as e:
            # Log the error
            print(f"Error sending password reset email: {e}")
            return Response(
                {"error": "Failed to send reset email. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {"message": "Password reset link sent to your email"},
            status=status.HTTP_200_OK
        )

class ResetPasswordAPI(APIView):
    """
    API endpoint for resetting password
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        Handle password reset

        Request payload:
        {
            "user_token": "user_specific_token",
            "old_password": "old_password",
            "new_password": "new_password",
        }
        """
        user_token = request.data.get('user_token')
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        # Validate input
        if not all([user_token, old_password, new_password]):
            return Response(
                {"error": "All fields are required"},
                status=status.HTTP_400_BAD_REQUEST
            )


        uuu = None
        try:
            # Decode user ID
            user_token = UserToken.objects.get(token=user_token)
            print(user_token,"User Token Object")
            user_id = user_token.user.id
            user = User.objects.get(pk=user_id)
            uuu = user
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": "Invalid reset link"},
                status=status.HTTP_400_BAD_REQUEST
            )



        # Validate password strength (optional but recommended)
        if len(new_password) < 8:
            return Response(
                {"error": "Password must be at least 8 characters long"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify user and old password
        try:
            # user_token = UserToken.objects.get(token=user_token)
            # user_id = user_token.user.id
            user = User.objects.get(pk=uuu.id)
            if not user.check_password(old_password):
                return Response(
                    {"error": "Invalid user or old password"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid user or old password"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        user.set_password(new_password)
        user.save()

        return Response(
            {"message": "Password reset successful"},
            status=status.HTTP_200_OK
        )

class GenerateOTPAPI(APIView):
    """
    API endpoint for generating OTP for password reset
    """
    permission_classes = [permissions.AllowAny]

    def generate_otp(self, length=6):
        """Generate a random OTP"""
        return ''.join(random.choices(string.digits, k=length))

    def post(self, request):
        """
        Generate and send OTP

        Request payload:
        {
            "email": "user@example.com"
        }
        """
        email = request.data.get('email')

        if not email:
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Find the user by email
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal if email exists or not for security
            return Response(
                {"message": "If an account exists with this email, an OTP will be sent"},
                status=status.HTTP_200_OK
            )

        # Generate OTP
        otp = self.generate_otp()

        # Store OTP (you might want to use a more secure method like caching or a separate model)
        # For this example, we'll use the user's profile or a temporary storage
        try:
            # Assuming you have a UserProfile model or similar
            profile, created = UserProfile.objects.get_or_create(user=user)
            profile.reset_password_otp = otp
            profile.otp_created_at = timezone.now()
            profile.save()
        except Exception as e:
            return Response(
                {"error": "Failed to generate OTP"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Send OTP via email
        try:
            send_mail(
                'Password Reset OTP',
                f'Your OTP for password reset is: {otp}. This OTP will expire in 10 minutes.',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
        except Exception as e:
            return Response(
                {"error": "Failed to send OTP email"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {"message": "OTP sent to your email"},
            status=status.HTTP_200_OK
        )

class VerifyOTPAndResetPasswordAPI(APIView):
    """
    API endpoint for verifying OTP and resetting password
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        Verify OTP and reset password

        Request payload:
        {
            "email": "user@example.com",
            "otp": "123456",
            "new_password": "new_password",
            "confirm_password": "new_password"
        }
        """
        email = request.data.get('email')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        # Validate input
        if not all([email, otp, new_password, confirm_password]):
            return Response(
                {"error": "All fields are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if passwords match
        if new_password != confirm_password:
            return Response(
                {"error": "Passwords do not match"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Find the user by email
            user = User.objects.get(email=email)

            # Check if OTP exists and is valid
            profile = UserProfile.objects.get(user=user)

            # Check OTP
            if profile.reset_password_otp != otp:
                return Response(
                    {"error": "Invalid OTP"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check OTP expiration (10 minutes)
            if timezone.now() - profile.otp_created_at > timedelta(minutes=10):
                return Response(
                    {"error": "OTP has expired"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate password strength
            if len(new_password) < 8:
                return Response(
                    {"error": "Password must be at least 8 characters long"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Reset password
            user.set_password(new_password)
            user.save()

            # Clear the OTP
            profile.reset_password_otp = None
            profile.otp_created_at = None
            profile.save()

            return Response(
                {"message": "Password reset successful"},
                status=status.HTTP_200_OK
            )

        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "User profile not found"},
                status=status.HTTP_400_BAD_REQUEST
            )
