'use client';

import { TEMP_RANGE_LIST, TempRange } from '../../types';
import FilterDropdown from './FilterDropdown';

const TEMP_RANGE_LABEL: Record<TempRange, string> = {
  [TempRange.BELOW_4]: '4도 이하',
  [TempRange.FROM4_TO8]: '4~8도',
  [TempRange.FROM9_TO11]: '9~11도',
  [TempRange.FROM12_TO16]: '12~16도',
  [TempRange.FROM17_TO19]: '17~19도',
  [TempRange.FROM20_TO22]: '20~22도',
  [TempRange.FROM23_TO27]: '23~27도',
  [TempRange.OVER_28]: '28도 이상',
};

interface TempFilterProps {
  value: TempRange[];
  onChange: (range: TempRange) => void;
}

export default function TempFilter({ value, onChange }: TempFilterProps) {
  return (
      <FilterDropdown label="기온">
        {TEMP_RANGE_LIST.map((range) => {
          const selected = value.includes(range);

          return (
              <button
                  key={range}
                  onClick={() => onChange(range)}
                  className={`
              text-[12px] px-[8px] py-[6px] rounded-[6px] text-left
              ${selected ? 'bg-primary text-white' : 'hover:bg-snow'}
            `}
              >
                {TEMP_RANGE_LABEL[range]}
              </button>
          );
        })}
      </FilterDropdown>
  );
}