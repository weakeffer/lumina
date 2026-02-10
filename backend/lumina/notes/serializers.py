from rest_framework import serializers
from .models import Notes
from users.serializers import UserProfileSerializer

class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notes
        fields = ['id', 'title', 'created_at', 'text', 'updated_at', 'user']
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']

    def validate_title(self, value):
        value = value.strip()
        if len(value) > 50:
            raise serializers.ValidationError(
                'Заголовок должен содержать менее 50 символов'
            )
        return value
    
class NoteCreateSerializer(NoteSerializer):
    class Meta:
        model = Notes
        fields = ['title', 'text']

    def create(self, validated_data):
        user = self.context['user'].data
        return Notes.objects.create(user = user, **validated_data)
    
class NoteUpdateSerializer(NoteSerializer):
    class Meta:
        fields = ['title', 'text']

    def update(self, instance, validated_data):
        instance.title = validated_data.get('title', instance.title)
        instance.text = validated_data.get('text', instance.text)
        instance.save()
        return instance
    
class NoteListSerializer(NoteSerializer):
    user = UserProfileSerializer(read_only = True)
    preview = serializers.SerializerMethodField()
    created_at_formatted = serializers.DateTimeField(
        source = 'created_at',
        format = '%d.%m.%Y %H:%M',
        read_only = True
    )

    class Meta(NoteSerializer.Meta):
        fields = ['id', 'title', 'preview', 'created_at_formatted', 'user']

    def get_preview(self, obj):
        return obj.text[:100] + '...' if len(obj.text) > 100 else obj.text
    
class NoteDetailSerializer(NoteSerializer):
    user = UserProfileSerializer(read_only=True)
    created_at_formatted = serializers.DateTimeField(
        source = 'created_at',
        format = '%d.%m.%Y %H:%M',
        read_only = True
    )
    updated_at_formatted = serializers.DateTimeField(
        source = 'updated_at',
        format = '%d.%m.%Y %H:%M',
        read_only = True
    )
    class Meta(NoteSerializer.Meta):
        fields = ['id', 'title', 'text', 'created_at_formatted', 'updated_at_formatted', 'user']

class NoteStatisticsSerializer(serializers.Serializer):
    total_notes = serializers.IntegerField()
    last_created = serializers.DateTimeField(format = '%d.%m.%Y %H:%M')
    class Meta:
        fields = ['total_notes', 'last_created']