import type { ButtonHTMLAttributes } from "react";

const styles = {
  primary: "bg-primary text-primary-foreground hover:bg-[#184a37]",
  accent: "bg-accent text-accent-foreground hover:bg-[#a84b26]",
  ghost: "border border-line bg-card hover:bg-white",
  danger: "bg-[#8d2f2f] text-white hover:bg-[#732626]",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof styles }) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-base font-semibold disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

export function SubmitButton({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof styles }) {
  return <Button type="submit" variant={variant} className={className} {...props} />;
}
