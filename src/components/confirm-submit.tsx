"use client";

export function ConfirmSubmit({
  action,
  label,
  message,
  className,
}: {
  action: () => Promise<void>;
  label: string;
  message: string;
  className: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      <button className={className} type="submit">
        {label}
      </button>
    </form>
  );
}
