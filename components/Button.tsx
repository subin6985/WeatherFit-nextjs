"use client";

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export default function Button({
                                 children,
                                 onClick,
                                 disabled = false,
                                 isForDelete = false,
                               }: ButtonProps) {
  return (
      <button
          type="button"
          onClick={onClick}
          className={`w-[250px] h-[43px] rounded-full
                 justify-center items-center
                 text-white text-[14px] font-bold
                 ${
              disabled
                  ? "bg-light cursor-default"
                  : (isForDelete
                      ? "bg-warning hover:bg-warningAccent"
                      : "bg-primary hover:bg-accent")
          }`}
          disabled={disabled}
      >
        {children}
      </button>
  );
}