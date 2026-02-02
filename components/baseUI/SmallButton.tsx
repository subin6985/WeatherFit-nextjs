"use client";

interface SmallButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export default function SmallButton({
                                      children,
                                      onClick,
                                      disabled = false,
                                    }: SmallButtonProps) {
  return (
      <button
          type="button"
          onClick={onClick}
          className={`w-[88px] h-[43px] rounded-full
                 justify-center items-center
                 text-white text-[14px] font-bold
                 ${
              disabled
                  ? "bg-light cursor-default"
                  : "bg-primary hover:bg-accent"
          }`}
          disabled={disabled}
      >
        {children}
      </button>
  );
}