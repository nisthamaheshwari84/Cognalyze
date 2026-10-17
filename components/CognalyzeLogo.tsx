import React from "react";
import Image from "next/image";
import Link from "next/link";

export type LogoVariant = "horizontal" | "stacked" | "symbol-only";
export type LogoSize = "sm" | "md" | "lg" | "xl" | number;

export interface CognalyzeLogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  href?: string;
  className?: string;
  priority?: boolean;
  roleBadge?: string;
  isDark?: boolean;
}

export default function CognalyzeLogo({
  variant = "horizontal",
  size = "md",
  href,
  className = "",
  priority = false,
  roleBadge,
  isDark = false,
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
        symbolSize = 26;
        horizHeight = 28;
        stackedWidth = 110;
        break;
      case "md":
        symbolSize = 32;
        horizHeight = 34;
        stackedWidth = 140;
        break;
      case "lg":
        symbolSize = 42;
        horizHeight = 44;
        stackedWidth = 180;
        break;
      case "xl":
        symbolSize = 56;
        horizHeight = 56;
        stackedWidth = 230;
        break;
    }
  }

  const renderContent = () => {
    // 1. Symbol Only Variant (Exact official squircle with graduation cap, C, and gold tassel)
    if (variant === "symbol-only") {
      return (
        <div
          className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
          style={{ width: symbolSize, height: symbolSize }}
        >
          <Image
            src="/cognalyze-symbol.png"
            alt="Cognalyze"
            width={symbolSize}
            height={symbolSize}
            priority={priority}
            className="w-full h-full object-contain select-none"
            style={{ borderRadius: Math.round(symbolSize * 0.22) }}
          />
        </div>
      );
    }

    // 2. Stacked Variant (Exact official full logo with squircle and COGNALYZE underneath)
    if (variant === "stacked") {
      return (
        <div
          className={`relative inline-flex flex-col items-center justify-center shrink-0 ${className}`}
          style={{ width: stackedWidth }}
        >
          <Image
            src="/cognalyze-logo.png"
            alt="Cognalyze"
            width={stackedWidth}
            height={stackedWidth}
            priority={priority}
            className="w-full h-auto object-contain select-none"
          />
        </div>
      );
    }

    // 3. Horizontal Variant (Exact official horizontal lockup)
    // Aspect ratio: 624 / 140 = 4.457
    const horizWidth = Math.round(horizHeight * 4.457);

    return (
      <div className={`inline-flex items-center gap-2 select-none shrink-0 ${className}`}>
        <Image
          src="/cognalyze-logo-horizontal.png"
          alt="Cognalyze"
          width={horizWidth}
          height={horizHeight}
          priority={priority}
          className="h-auto object-contain"
          style={{ height: horizHeight, width: "auto" }}
        />
        {roleBadge && (
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
        )}
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
