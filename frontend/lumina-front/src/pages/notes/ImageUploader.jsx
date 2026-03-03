import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, Link, Loader, AlertCircle } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { api } from '../../api/api';

const ImageUploader = ({ onImageUpload, onClose, noteId = null }) => {
  const { themeClasses } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `http://localhost:8000${url}`;
    return `http://localhost:8000/media/${url}`;
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!api.isFileSizeValid(file, 5)) {
      setError('Файл слишком большой. Максимальный размер 5MB');
      return;
    }

    if (!api.isImageFile(file)) {
      setError('Пожалуйста, загрузите изображение (JPEG, PNG, GIF, WEBP, SVG)');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadSuccess(false);

    let localPreviewUrl = null;

    try {
      localPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(localPreviewUrl);
      const result = await api.uploadImage(file, noteId);
      console.log('Результат от сервера:', result);
      const imageUrl = result.url || result.image?.url;
      
      if (!imageUrl) {
        throw new Error('Сервер не вернул URL изображения');
      }
      const fullImageUrl = getFullImageUrl(imageUrl);
      onImageUpload(fullImageUrl, file.name, result);
      
      setUploadSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Ошибка при загрузке изображения');
    } finally {
      setUploading(false);
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    }
  }, [noteId, onImageUpload, onClose]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024
  });

  const handleUrlSubmit = async () => {
    if (!imageUrl) return;
    
    try {
      new URL(imageUrl);
      onImageUpload(imageUrl, 'image.jpg', { url: imageUrl, is_external: true });
      setUploadSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (e) {
      setError('Пожалуйста, введите корректный URL');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className={`w-96 rounded-2xl ${themeClasses.colors.card.bg} border ${themeClasses.colors.border.primary} shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-4 border-b ${themeClasses.colors.border.primary} flex items-center justify-between`}>
          <h3 className={`font-semibold ${themeClasses.colors.text.primary}`}>
            Вставить изображение
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={uploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className={`flex border-b ${themeClasses.colors.border.primary}`}>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors
              ${activeTab === 'upload' 
                ? `text-indigo-500 border-b-2 border-indigo-500` 
                : `${themeClasses.colors.text.secondary} hover:${themeClasses.colors.bg.secondary}`
              }`}
            disabled={uploading}
          >
            Загрузить
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors
              ${activeTab === 'url' 
                ? `text-indigo-500 border-b-2 border-indigo-500` 
                : `${themeClasses.colors.text.secondary} hover:${themeClasses.colors.bg.secondary}`
              }`}
            disabled={uploading}
          >
            По ссылке
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
              <span>Изображение успешно загружено!</span>
            </div>
          )}

          {activeTab === 'upload' ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                ${isDragActive 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                  : `${themeClasses.colors.border.primary} hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10`
                } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} disabled={uploading} />
              {uploading ? (
                <div className="flex flex-col items-center">
                  <Loader className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                  <p className={`text-sm ${themeClasses.colors.text.secondary}`}>
                    Загрузка...
                  </p>
                  {previewUrl && (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="mt-4 max-h-32 rounded-lg object-contain"
                    />
                  )}
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
                  {isDragActive ? (
                    <p className={`text-sm ${themeClasses.colors.text.primary}`}>
                      Отпустите файл для загрузки
                    </p>
                  ) : (
                    <>
                      <p className={`text-sm font-medium ${themeClasses.colors.text.primary} mb-1`}>
                        Нажмите или перетащите
                      </p>
                      <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>
                        PNG, JPG, GIF, WEBP, SVG до 5MB
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.colors.text.secondary} mb-2`}>
                  URL изображения
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className={`flex-1 px-3 py-2 rounded-lg border ${themeClasses.colors.border.primary}
                      ${themeClasses.colors.bg.primary} ${themeClasses.colors.text.primary}
                      focus:outline-none focus:ring-2 focus:ring-indigo-500
                      ${uploading ? 'opacity-50' : ''}`}
                    disabled={uploading}
                  />
                  <button
                    onClick={handleUrlSubmit}
                    disabled={!imageUrl || uploading}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? <Loader className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {imageUrl && !uploading && (
                <div className="mt-4">
                  <p className={`text-xs ${themeClasses.colors.text.tertiary} mb-2`}>
                    Предпросмотр:
                  </p>
                  <div className="border rounded-lg overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt="Preview" 
                      className="max-w-full h-auto max-h-32 object-contain bg-gray-100 dark:bg-gray-800"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200?text=Invalid+URL';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              disabled={uploading}
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;