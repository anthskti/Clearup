interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
}

export function Checkbox({ checked, onChange }: CheckboxProps) {
  return (
    <>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="inline-flex size-[18px] shrink-0 rounded-[5px] border border-zinc-300 bg-white shadow-sm transition-[background-color,border-color,box-shadow] duration-150 peer-checked:border-[#0e4a84] peer-checked:bg-[#0e4a84] peer-focus-visible:ring-2 peer-focus-visible:ring-[#0e4a84]/30 peer-focus-visible:ring-offset-2 motion-reduce:transition-none"
      />
    </>
  );
}
