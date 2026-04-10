import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default function CompareLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  void children;
  // Temporarily disable /compare until we re-enable the feature.
  redirect("/chat");
}
