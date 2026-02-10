from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only = True, required = True, validators = [validate_password])
    password2 = serializers.CharField(write_only = True, required = True)
    class Meta:
        model = User
        fields = ('username', 'last_name', 'first_name', 'date_joined', 'email', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password" : "Пароли не совпадают."})
        attrs.pop('password2')
        return attrs
        
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
        
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'last_name', 'first_name', 'date_joined', 'email', 'last_login')
        read_only_fields = (['date_joined', 'last_login'])
        