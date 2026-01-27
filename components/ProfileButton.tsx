export default function ProfileButton({children, onClick, className = "" }) {
  return (
      <button
          className={`flex flex-row gap-[12px] text-lg
            pl-[18px] pr-[23px] py-[10px] justify-start items-center
            border-light border-[1px] rounded-[20px] ${className}`}
          onClick={onClick}>
        {children}
      </button>
  );
}