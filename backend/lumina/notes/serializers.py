from rest_framework import serializers
from .models import Notes, NoteGroup
from users.serializers import UserProfileSerializer
import pytz

class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notes
        fields = ['id', 'title', 'created_at', 'text', 'updated_at', 'user', 'is_deleted', 'deleted_at', 'images', 'group']
        read_only_fields = ['id', 'created_at', 'updated_at', 'user', 'is_deleted', 'deleted_at', 'images']

    def validate_title(self, value):
        value = value.strip()
        if len(value) > 50:
            raise serializers.ValidationError(
                'Заголовок должен содержать менее 50 символов'
            )
        return value
    
class NoteCreateSerializer(NoteSerializer):
    class Meta(NoteSerializer.Meta):
        model = Notes
        fields = ['title', 'text', 'group']

    def create(self, validated_data):
        user = self.context.get('request').user
        return Notes.objects.create(user=user, **validated_data)
    
class NoteUpdateSerializer(NoteSerializer):
    class Meta(NoteSerializer.Meta):
        model = Notes
        fields = ['title', 'text', 'images', 'group']

    def update(self, instance, validated_data):
        instance.title = validated_data.get('title', instance.title)
        instance.text = validated_data.get('text', instance.text)
        instance.images = validated_data.get('images', instance.images)
        instance.group = validated_data.get('group', instance.group)
        instance.save()
        return instance
    
class NoteListSerializer(NoteSerializer):
    user = UserProfileSerializer(read_only=True)
    preview = serializers.SerializerMethodField()
    created_at_formatted = serializers.SerializerMethodField()
    updated_at_formatted = serializers.SerializerMethodField()
    images_count = serializers.SerializerMethodField()
    first_image = serializers.SerializerMethodField()
    group_name = serializers.SerializerMethodField()
    group_color = serializers.SerializerMethodField()

    class Meta(NoteSerializer.Meta):
        fields = ['id', 'title', 'preview', 'text', 'created_at_formatted', 
                 'updated_at_formatted', 'user', 'is_deleted', 'images_count', 'first_image','group', 'group_name', 'group_color']

    def get_preview(self, obj):
        return obj.text[:100] + '...' if len(obj.text) > 100 else obj.text
    
    def get_created_at_formatted(self, obj):
        moscow_tz = pytz.timezone('Europe/Moscow')
        local_time = obj.created_at.astimezone(moscow_tz)
        return local_time.isoformat()
    
    def get_updated_at_formatted(self, obj):
        moscow_tz = pytz.timezone('Europe/Moscow')
        local_time = obj.updated_at.astimezone(moscow_tz)
        return local_time.isoformat()
    
    def get_images_count(self, obj):
        return len(obj.images) if obj.images else 0
    
    def get_first_image(self, obj):
        if obj.images and len(obj.images) > 0:
            return obj.images[0].get('url')
        return None
    
    def get_group_name(self, obj):
        return obj.group.name if obj.group else None
    
    def get_group_color(self, obj):
        return obj.group.color if obj.group else None
    
class NoteDetailSerializer(NoteSerializer):
    user = UserProfileSerializer(read_only=True)
    created_at_formatted = serializers.SerializerMethodField()
    updated_at_formatted = serializers.SerializerMethodField()
    deleted_at_formatted = serializers.SerializerMethodField()
    images_with_details = serializers.SerializerMethodField()
    
    class Meta(NoteSerializer.Meta):
        fields = ['id', 'title', 'text', 'created_at_formatted', 'updated_at_formatted', 
                 'deleted_at_formatted', 'user', 'is_deleted', 'images', 'images_with_details']
    
    def get_created_at_formatted(self, obj):
        moscow_tz = pytz.timezone('Europe/Moscow')
        local_time = obj.created_at.astimezone(moscow_tz)
        return local_time.strftime('%d.%m.%Y %H:%M')
    
    def get_updated_at_formatted(self, obj):
        moscow_tz = pytz.timezone('Europe/Moscow')
        local_time = obj.updated_at.astimezone(moscow_tz)
        return local_time.strftime('%d.%m.%Y %H:%M')
    
    def get_deleted_at_formatted(self, obj):
        if obj.deleted_at:
            moscow_tz = pytz.timezone('Europe/Moscow')
            local_time = obj.deleted_at.astimezone(moscow_tz)
            return local_time.strftime('%d.%m.%Y %H:%M')
        return None
    
    def get_images_with_details(self, obj):
        if obj.images:
            request = self.context.get('request')
            images = []
            for idx, img in enumerate(obj.images):
                image_data = {
                    'url': img.get('url'),
                    'filename': img.get('filename', f'image_{idx+1}'),
                    'added_at': img.get('added_at', idx),
                    'id': img.get('id'),
                    'is_external': img.get('url', '').startswith('http') and 'localhost' not in img.get('url', '')
                }
                images.append(image_data)
            return images
        return []

class NoteStatisticsSerializer(serializers.Serializer):
    total_notes = serializers.IntegerField()
    last_created = serializers.DateTimeField(format='%d.%m.%Y %H:%M')
    deleted_count = serializers.IntegerField()
    total_images = serializers.IntegerField()
    
    class Meta:
        fields = ['total_notes', 'last_created', 'deleted_count', 'total_images']

class DeletedNoteSerializer(NoteSerializer):
    user = UserProfileSerializer(read_only=True)
    created_at_formatted = serializers.SerializerMethodField()
    deleted_at_formatted = serializers.SerializerMethodField()
    
    class Meta(NoteSerializer.Meta):
        model = Notes
        fields = ['id', 'title', 'text', 'created_at_formatted', 'deleted_at_formatted', 'user', 'images']
    
    def get_created_at_formatted(self, obj):
        moscow_tz = pytz.timezone('Europe/Moscow')
        local_time = obj.created_at.astimezone(moscow_tz)
        return local_time.strftime('%d.%m.%Y %H:%M')
    
    def get_deleted_at_formatted(self, obj):
        if obj.deleted_at:
            moscow_tz = pytz.timezone('Europe/Moscow')
            local_time = obj.deleted_at.astimezone(moscow_tz)
            return local_time.strftime('%d.%m.%Y %H:%M')
        return None

class ImageUploadSerializer(serializers.Serializer):
    image_url = serializers.URLField(required=False)
    image_data = serializers.CharField(required=False)
    filename = serializers.CharField(required=False)
    
    def validate(self, data):
        if not data.get('image_url') and not data.get('image_data'):
            raise serializers.ValidationError("Необходимо указать image_url или image_data")
        return data
    
class NoteGroupSerializer(serializers.ModelSerializer):
    notes_count = serializers.SerializerMethodField()
    
    class Meta:
        model = NoteGroup
        fields = ['id', 'name', 'description', 'color', 'icon', 'created_at', 'updated_at', 'notes_count']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_notes_count(self, obj):
        return obj.notes.filter(is_deleted=False).count()

class NoteGroupCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NoteGroup
        fields = ['name', 'description', 'color', 'icon']
    
    def validate_name(self, value):
        value = value.strip()
        if len(value) > 100:
            raise serializers.ValidationError('Название группы должно быть менее 100 символов')
        if len(value) < 1:
            raise serializers.ValidationError('Название группы не может быть пустым')
        return value
    
    def create(self, validated_data):
        user = self.context.get('request').user
        return NoteGroup.objects.create(user=user, **validated_data)

class NoteGroupUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NoteGroup
        fields = ['name', 'description', 'color', 'icon']