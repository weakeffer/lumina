import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { api } from '../../shared/api/api';
import AuthLayout from './AuthLayout';
import Input from '../../components/ui/Input';

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Имя пользователя обязательно';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    }
    
    if (formData.password !== formData.password2) {
      newErrors.password2 = 'Пароли не совпадают';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const response = await api.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password2: formData.password2
      });
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/notes');
    } catch (error) {
      setServerError(error.message || 'Ошибка при регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const passwordStrength = () => {
    const password = formData.password;
    if (!password) return null;
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return strength;
  };

  const strengthText = ['Слабый', 'Средний', 'Хороший', 'Отличный'];
  const strengthColor = ['bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];

  return (
    <AuthLayout 
      title="Создать аккаунт" 
      subtitle="Начните создавать свои заметки уже сегодня"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {serverError}
          </div>
        )}

        <Input
          label="Имя пользователя"
          type="text"
          name="username"
          placeholder="Введите имя пользователя"
          icon={User}
          value={formData.username}
          onChange={handleChange}
          error={errors.username}
          disabled={isLoading}
        />

        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="example@mail.com"
          icon={Mail}
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          disabled={isLoading}
        />

        <div className="relative">
          <Input
            label="Пароль"
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Придумайте пароль"
            icon={Lock}
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {formData.password && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    i < passwordStrength() ? strengthColor[passwordStrength() - 1] : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Надежность пароля: {passwordStrength() && strengthText[passwordStrength() - 1]}
            </p>
          </div>
        )}

        <div className="relative">
          <Input
            label="Подтверждение пароля"
            type={showConfirmPassword ? 'text' : 'password'}
            name="password2"
            placeholder="Повторите пароль"
            icon={CheckCircle}
            value={formData.password2}
            onChange={handleChange}
            error={errors.password2}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="terms"
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            required
            disabled={isLoading}
          />
          <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
            Я принимаю{' '}
            <Link to="/terms" className="text-indigo-600 hover:text-indigo-800">
              условия использования
            </Link>{' '}
            и{' '}
            <Link to="/privacy" className="text-indigo-600 hover:text-indigo-800">
              политику конфиденциальности
            </Link>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-linear-to-r from-indigo-600 to-purple-600
            text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            transform transition-all duration-200 ease-in-out
            hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Создание аккаунта...
            </div>
          ) : (
            'Создать аккаунт'
          )}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white/80 text-gray-500">или</span>
          </div>
        </div>

        <button
          type="button"
          className="w-full py-3 px-4 bg-white border border-gray-200 rounded-xl
            text-gray-700 font-semibold hover:bg-gray-50
            focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
            transform transition-all duration-200 ease-in-out
            flex items-center justify-center space-x-2"
          disabled={isLoading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
            />
          </svg>
          <span>Продолжить с Google</span>
        </button>

        <p className="text-center text-sm text-gray-600 mt-6">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-semibold">
            Войти
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;