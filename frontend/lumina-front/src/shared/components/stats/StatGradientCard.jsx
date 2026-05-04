import React from 'react';

export function StatGradientCard({ value, label, gradient }) {
  return (
    <div
      className={`p-3 rounded-xl bg-linear-to-br ${gradient} text-white shadow-lg transform hover:scale-105 transition-all cursor-default`}
    >
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-90">{label}</div>
    </div>
  );
}
