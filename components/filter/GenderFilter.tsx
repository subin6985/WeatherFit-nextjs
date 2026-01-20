'use client';

import { Gender, GENDER_LIST } from '../../types';
import FilterDropdown from './FilterDropdown';

const GENDER_LABEL: Record<Gender, string> = {
  [Gender.FEMALE]: '여성',
  [Gender.MALE]: '남성',
  [Gender.NO_SELECT]: '선택안함',
};

interface GenderFilterProps {
  value: Gender[];
  onChange: (gen: Gender) => void;
}

export default function GenderFilter({ value, onChange }: GenderFilterProps) {
  return (
      <FilterDropdown label="성별">
        {GENDER_LIST.map((gen) => {
          const selected = value.includes(gen);

          return (
              <button
                  key={gen}
                  onClick={() => onChange(gen)}
                  className={`
              text-[12px] px-[8px] py-[6px] rounded-[6px] text-left
              ${selected ? 'bg-primary text-white' : 'hover:bg-snow'}
            `}
              >
                {GENDER_LABEL[gen]}
              </button>
          );
        })}
      </FilterDropdown>
  );
}