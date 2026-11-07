export const PASSWORD_REQUIREMENTS = [
  {
    label: "At least 8 characters",
    test: (password: string) => password.length >= 8,
  },
  {
    label: "One uppercase letter",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    label: "One lowercase letter",
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    label: "One special character",
    test: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
] as const;

export function passwordMeetsRequirements(password: string): boolean {
  return PASSWORD_REQUIREMENTS.every(({ test }) => test(password));
}

export default function PasswordRequirements({
  password,
  id,
}: {
  password: string;
  id: string;
}) {
  return (
    <div id={id} className="mt-3 text-sm">
      <p className="font-medium text-zinc-600">Password requirements</p>
      <ul className="mt-2 space-y-1">
        {PASSWORD_REQUIREMENTS.map(({ label, test }) => {
          const met = test(password);
          return (
            <li
              key={label}
              className={`flex items-center gap-2 ${met ? "text-green-700" : "text-zinc-500"}`}
            >
              <span aria-hidden="true" className="w-4 text-center">
                {met ? "✓" : "○"}
              </span>
              <span>
                <span className="sr-only">{met ? "Met: " : "Not yet met: "}</span>
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
