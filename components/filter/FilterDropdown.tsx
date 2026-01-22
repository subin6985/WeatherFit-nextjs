'use client';

import { useState, ReactNode } from 'react';

interface FilterDropdownProps {
  label: string;
  children: ReactNode;
}

export default function FilterDropdown({ label, children }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
      <div className="relative w-fit">
        <button
            className="text-[12px] text-middle w-[100px] h-[27px] bg-white border-light border-[1px] rounded-full
                   justify-center items-center relative"
            onClick={() => setIsOpen(prev => !prev)}
        >
          {label}
          <img
              src="/Down.png"
              alt="드롭다운"
              width={19}
              height={19}
              className="absolute top-1/2 -translate-y-1/2 left-[73px]"
          />
        </button>
        {isOpen && (
            <div className="absolute bg-white rounded-[10px]
                        border-[1px] border-light shadow-[2px_2px_4px_rgba(0,0,0,0.25)]
                        top-full mt-[5px] left-1/2 -translate-x-1/2 z-10
                        flex flex-col w-[100px] p-[5px] gap-y-0.5">
              {children}
            </div>
        )}
      </div>
  );
}