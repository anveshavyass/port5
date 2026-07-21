import Link from "next/link";

export function BackToHome() {
  return (
    <Link
      href="/"
      className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-[#ff5a1f]"
    >
      ← Back to home
    </Link>
  );
}
