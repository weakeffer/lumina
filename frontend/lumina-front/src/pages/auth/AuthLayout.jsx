import React from 'react';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-80 animate-blob"></div>
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-60"></div>
        <div className="absolute top-40 left-60 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-60"></div>
      </div>
      
      <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Lumina
          </h1>
          <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
          <p className="text-gray-600 mt-2">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;