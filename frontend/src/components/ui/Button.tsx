import React from "react";
import Loader from "./Loader";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  loading?: boolean;
};

export default function Button({
  variant = "primary",
  className = "",
  disabled,
  loading,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  const base =
    "px-4 py-2 rounded font-semibold transition focus:outline-none";

  const variants = {
    primary: "bg-yellow-400 text-black hover:bg-yellow-500",
    secondary: "border border-black/20 text-black hover:bg-yellow-100",
  };

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading ? <Loader /> : props.children}
    </button>
  );
}
