import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import AuthLayout from './AuthLayout';
import Input from '../../components/ui/Input';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    // Имитация запроса к API
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Вход:', formData, 'Запомнить:', rememberMe);
      navigate('/notes');
    } catch (error) {
      console.error('Ошибка входа:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  return (
    <AuthLayout 
      title="Добро пожаловать!" 
      subtitle="Войдите в свой аккаунт"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="example@mail.com"
          icon={Mail}
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />

        <div className="relative">
          <Input
            label="Пароль"
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Введите пароль"
            icon={Lock}
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
              Запомнить меня
            </label>
          </div>
          
          <Link 
            to="/forgot-password" 
            className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            Забыли пароль?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`
            w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600
            text-white font-semibold rounded-xl
            hover:from-indigo-700 hover:to-purple-700
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
            transform transition-all duration-200 ease-in-out
            hover:scale-[1.02] active:scale-[0.98]
            ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
          `}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Вход...
            </div>
          ) : (
            'Войти'
          )}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
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
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
            />
          </svg>
          <span>Войти с Google</span>
        </button>

        <p className="text-center text-sm text-gray-600 mt-6">
          Еще нет аккаунта?{' '}
          <Link to="/register" className="text-indigo-600 hover:text-indigo-800 font-semibold">
            Зарегистрироваться
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;