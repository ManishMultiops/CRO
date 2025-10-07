from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate

# User Serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

# Register Serializer
class RegisterSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)
    agree = serializers.BooleanField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['full_name', 'email', 'password', 'confirm_password', 'agree']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        if not attrs.get('agree'):
            raise serializers.ValidationError({"agree": "You must agree to the terms and privacy policy."})
        return attrs

    def create(self, validated_data):
        full_name = validated_data.pop('full_name')
        email = validated_data.get('email')
        password = validated_data.pop('password')
        validated_data.pop('confirm_password')
        validated_data.pop('agree')

        user = User(
            username=email,  # or use full_name or separate username field
            email=email,
            first_name=full_name,  # or split into first and last name if you want
        )
        user.set_password(password)
        user.save()
        return user

# Login Serializer
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            # Django's default User model uses username by default, 
            # so authenticate with email requires a slight modification or custom backend.
            # Here, we try to get the user by email first:
            try:
                user_obj = User.objects.get(email=email)
                username = user_obj.username
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid email or password")

            user = authenticate(username=username, password=password)

            if not user:
                raise serializers.ValidationError("Invalid email or password")
        else:
            raise serializers.ValidationError("Must include 'email' and 'password'.")

        data['user'] = user
        return data