import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', size = 'md', className = '', ...props 
}) => {
  const baseStyle = "font-display font-bold uppercase transition-all duration-200 border-2 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-cyan border-cyan text-obsidian hover:shadow-neon hover:text-white hover:bg-transparent",
    secondary: "bg-transparent border-softwhite text-softwhite hover:bg-white hover:text-obsidian",
    danger: "bg-red-500 border-red-500 text-white hover:bg-transparent hover:text-red-500"
  };

  const sizes = {
    sm: "px-3 py-1 text-xs",
    md: "px-6 py-2 text-sm",
    lg: "px-8 py-3 text-lg"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
