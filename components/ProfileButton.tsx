export default function ProfileButton({children, onClick}) {
  return (
      <button
          className="flex flex-row gap-[12px] text-lg
                     pl-[18px] pr-[23px] py-[10px] justify-start items-center
                     border-light border-[1px] rounded-[20px]"
          onClick={onClick}>
        {children}
      </button>
  );
}