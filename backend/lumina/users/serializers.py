from rest_framework import serializers
import pytz
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Profile

class UserProfileSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(source='profile.avatar', required=False)
    avatar_url = serializers.SerializerMethodField()
    bio = serializers.CharField(source='profile.bio', required=False, allow_blank=True)
    telegram = serializers.CharField(source='profile.telegram', required=False, allow_blank=True)
    github = serializers.CharField(source='profile.github', required=False, allow_blank=True)
    website = serializers.URLField(source='profile.website', required=False, allow_blank=True)
    theme_preference = serializers.CharField(source='profile.theme_preference', required=False)
    email_notifications = serializers.BooleanField(source='profile.email_notifications', required=False)
    auto_save_interval = serializers.IntegerField(source='profile.auto_save_interval', required=False)
    total_notes = serializers.IntegerField(source='profile.total_notes', read_only=True)
    total_words = serializers.IntegerField(source='profile.total_words', read_only=True)
    joined_date = serializers.SerializerMethodField()
    last_login_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'avatar', 'avatar_url', 'bio', 'telegram', 'github', 'website',
            'theme_preference', 'email_notifications', 'auto_save_interval',
            'total_notes', 'total_words', 'joined_date', 'last_login',
            'last_login_formatted', 'date_joined'
        )
        read_only_fields = ('id', 'date_joined', 'last_login')

    def get_avatar_url(self, obj):
        if hasattr(obj, 'profile') and obj.profile.avatar:
            return obj.profile.avatar.url
        return None

    def get_joined_date(self, obj):
        return obj.date_joined.strftime('%d.%m.%Y')

    def get_last_login_formatted(self, obj):
        if obj.last_login:
            moscow_tz = pytz.timezone('Europe/Moscow')
            local_time = obj.last_login.astimezone(moscow_tz)
            return local_time.strftime('%d.%m.%Y %H:%M')
        return 'Никогда'

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if profile_data:
            profile = instance.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        
        return instance


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Пароли не совпадают."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user