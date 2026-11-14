import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "full";
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  icon,
  className = "",
  children,
  ...props
}) => {
  const baseStyles = "flex items-center justify-center space-x-1.5 rounded font-medium transition disabled:opacity-40";
  
  const variants = {
    primary: "bg-[#094771] hover:bg-[#0e639c] text-white",
    secondary: "bg-[#2d2d2d] hover:bg-[#37373d] border border-[#3c3c3c] text-gray-200",
    danger: "bg-rose-900/60 hover:bg-rose-800/80 text-rose-200",
    ghost: "bg-transparent hover:bg-[#2d2d2d] text-gray-400 hover:text-white"
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
    full: "w-full py-1.5 px-3 text-xs"
  };

  const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={combinedClassName.trim()} {...props}>
      {icon && <span>{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
};
