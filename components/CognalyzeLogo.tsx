import React from "react";
import Image from "next/image";
import Link from "next/link";

export type LogoVariant = "horizontal" | "stacked" | "symbol-only";
export type LogoTheme = "auto" | "light-text" | "dark-text";
export type LogoSize = "sm" | "md" | "lg" | "xl" | number;

export interface CognalyzeLogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: LogoSize;
  href?: string;
  className?: string;
  priority?: boolean;
  roleBadge?: string;
  isDark?: boolean;
}

export default function CognalyzeLogo({
  variant = "horizontal",
  theme = "auto",
  size = "md",
  href,
  className = "",
  priority = false,
  roleBadge,
  isDark,
}: CognalyzeLogoProps) {
  // Compute dimensions
  let symbolSize = 32;
  let horizHeight = 32;
  let stackedWidth = 140;

  if (typeof size === "number") {
    symbolSize = size;
    horizHeight = size;
    stackedWidth = Math.round(size * 3.5);
  } else {
    switch (size) {
      case "sm":
        symbolSize = 24;
        horizHeight = 26;
        stackedWidth = 110;
        break;
      case "md":
        symbolSize = 30;
        horizHeight = 32;
        stackedWidth = 140;
        break;
      case "lg":
        symbolSize = 40;
        horizHeight = 42;
        stackedWidth = 180;
        break;
      case "xl":
        symbolSize = 56;
        horizHeight = 54;
        stackedWidth = 230;
        break;
    }
  }

  const renderContent = () => {
    // 1. Symbol Only Variant
    if (variant === "symbol-only") {
      return (
        <div
          className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
          style={{ width: symbolSize, height: symbolSize }}
        >
          <Image
            src="/cognalyze-symbol.png"
            alt="Cognalyze Symbol"
            width={symbolSize}
            height={symbolSize}
            priority={priority}
            className="w-full h-full object-contain select-none"
            style={{ borderRadius: symbolSize > 32 ? 8 : 6 }}
          />
        </div>
      );
    }

    // 2. Stacked Variant (Squircle on top, Wordmark below)
    if (variant === "stacked") {
      if (theme === "light-text" || isDark === true) {
        return (
          <div
            className={`relative inline-flex flex-col items-center justify-center shrink-0 ${className}`}
            style={{ width: stackedWidth }}
          >
            <Image
              src="/cognalyze-logo-white.png"
              alt="Cognalyze Logo"
              width={stackedWidth}
              height={stackedWidth}
              priority={priority}
              className="w-full h-auto object-contain select-none"
            />
          </div>
        );
      }

      if (theme === "dark-text" || isDark === false) {
        return (
          <div
            className={`relative inline-flex flex-col items-center justify-center shrink-0 ${className}`}
            style={{ width: stackedWidth }}
          >
            <Image
              src="/cognalyze-logo.png"
              alt="Cognalyze Logo"
              width={stackedWidth}
              height={stackedWidth}
              priority={priority}
              className="w-full h-auto object-contain select-none"
            />
          </div>
        );
      }

      // Auto: CSS-driven dark mode switching
      return (
        <div
          className={`relative inline-flex flex-col items-center justify-center shrink-0 ${className}`}
          style={{ width: stackedWidth }}
        >
          <Image
            src="/cognalyze-logo.png"
            alt="Cognalyze Logo"
            width={stackedWidth}
            height={stackedWidth}
            priority={priority}
            className="w-full h-auto object-contain select-none dark:hidden"
          />
          <Image
            src="/cognalyze-logo-white.png"
            alt="Cognalyze Logo"
            width={stackedWidth}
            height={stackedWidth}
            priority={priority}
            className="w-full h-auto object-contain select-none hidden dark:block"
          />
        </div>
      );
    }

    // 3. Horizontal Variant (Symbol + Wordmark inline)
    const horizWidth = Math.round(horizHeight * 4.1875);

    const badgeEl = roleBadge ? (
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          padding: "1px 6px",
          borderRadius: 4,
          backgroundColor: isDark ? "#142339" : "#F0EFEA",
          color: isDark ? "#94A3B8" : "#667085",
          border: `1px solid ${isDark ? "#1C3048" : "#E4E1DA"}`,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {roleBadge}
      </span>
    ) : null;

    if (theme === "light-text" || isDark === true) {
      return (
        <div className={`inline-flex items-center gap-2 select-none shrink-0 ${className}`}>
          <Image
            src="/cognalyze-logo-horizontal-white.png"
            alt="Cognalyze Logo"
            width={horizWidth}
            height={horizHeight}
            priority={priority}
            className="h-auto object-contain"
            style={{ height: horizHeight, width: "auto" }}
          />
          {badgeEl}
        </div>
      );
    }

    if (theme === "dark-text" || isDark === false) {
      return (
        <div className={`inline-flex items-center gap-2 select-none shrink-0 ${className}`}>
          <Image
            src="/cognalyze-logo-horizontal.png"
            alt="Cognalyze Logo"
            width={horizWidth}
            height={horizHeight}
            priority={priority}
            className="h-auto object-contain"
            style={{ height: horizHeight, width: "auto" }}
          />
          {badgeEl}
        </div>
      );
    }

    // Auto: CSS-driven dark mode switching
    return (
      <div className={`inline-flex items-center gap-2 select-none shrink-0 ${className}`}>
        <Image
          src="/cognalyze-logo-horizontal.png"
          alt="Cognalyze Logo"
          width={horizWidth}
          height={horizHeight}
          priority={priority}
          className="h-auto object-contain dark:hidden"
          style={{ height: horizHeight, width: "auto" }}
        />
        <Image
          src="/cognalyze-logo-horizontal-white.png"
          alt="Cognalyze Logo"
          width={horizWidth}
          height={horizHeight}
          priority={priority}
          className="h-auto object-contain hidden dark:block"
          style={{ height: horizHeight, width: "auto" }}
        />
        {badgeEl}
      </div>
    );
  };

  if (href) {
    return (
      <Link
        href={href}
        style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#152C4B]"
      >
        {renderContent()}
      </Link>
    );
  }

  return renderContent();
}
