type ButtonProps = {
  label: string;
  onClick: () => void;
};

export default function Button({ label, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="text-white bg-white border border-transparent hover:bg-success-strong shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none"
    >
      {label}
    </button>
  );
}
