"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Server render'da tema noma'lum: joyni band qilib turamiz, ikonka hydration'dan keyin chiqadi.
  if (!mounted) return <div className="h-10 w-10" aria-hidden />;

  const dark = resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Yorug' rejimga o'tish" : "Qorong'i rejimga o'tish"}
    >
      {dark ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
    </Button>
  );
}
