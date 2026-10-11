import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'outline'
  icon: Icon, 
  onClick, 
  type = 'button',
  disabled = false,
  className = ''
}) => {
  return (
    <button 
      type={type} 
      className={`custom-btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {Icon && <Icon className="btn-icon" size={16} />}
      <span>{children}</span>
    </button>
  );
};

export default Button;