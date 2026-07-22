import { MoneyShell } from "@/components/money/money-shell";

export default function MoneyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MoneyShell>{children}</MoneyShell>;
}
