import { cn } from "@/lib/utils";

export type KbdProps = {
  children: React.ReactNode;
  className?: string;
};

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-border bg-muted px-1.5 font-sans text-[11px] font-medium text-muted-foreground",
        className
      )}
    >
      {children}
    </kbd>
  );
}
