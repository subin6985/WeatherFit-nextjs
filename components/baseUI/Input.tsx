"use client";

import { useState } from "react";

interface InputProps {
  type?: "text" | "password";
  placeholder?: string;
  error?: boolean;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function Input({
                                type = "text",
                                placeholder,
                                error = false,
                                value,
                                onChange,
                                disabled = false,
                              }: InputProps) {
  const [showPw, setShowPw] = useState(false);

  const isPassword = type === "password";

  return (
      <div className="flex relative w-[250px]">
        <input
            type={isPassword ? (showPw ? "text" : "password") : "text"}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={`${disabled ? "bg-snow" : "bg-white"}
          border-[2px] pl-[18px] text-[16px]
          focus:border-primary focus:outline-none
          rounded-full w-full h-[43px]
          ${error ? "border-warning" : "border-light"}`}
            disabled={disabled}
            maxLength={(type === "nickname") ? 15 : 30}
        />
        {isPassword && (
            <button
                type="button"
                onClick={() => setShowPw((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                tabIndex={-1}
            >
              {showPw ? (
                  <img
                      src="/EyeOff.png"
                      alt="Hide password"
                      width={27}
                      height={27}
                      className="w-[27px] h-[27px]"
                  />
              ) : (
                  <img
                      src="/Eye.png"
                      alt="Show password"
                      width={27}
                      height={27}
                      className="w-[27px] h-[27px]"
                  />
              )}
            </button>
        )}
      </div>
  );
}