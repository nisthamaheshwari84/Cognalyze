"use client";

import React, { useState, useEffect, useRef } from "react";

interface InlineEditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  as?: "span" | "h1" | "h2" | "h3" | "p" | "div";
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onClick?: (e: React.MouseEvent) => void;
  readOnly?: boolean;
}

export const InlineEditableText: React.FC<InlineEditableTextProps> = ({
  value,
  onChange,
  placeholder = "Click to edit...",
  as: Component = "span",
  className = "",
  style = {},
  multiline = false,
  onFocus,
  onBlur,
  onClick,
  readOnly = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState(value);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setCurrentVal(value);
    }
  }, [value, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (elementRef.current) {
      const text = elementRef.current.innerText.trim();
      const finalVal = text || value; // Don't allow complete erasure to empty if placeholder
      if (finalVal !== value) {
        onChange(finalVal);
      }
    }
    if (onBlur) onBlur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      elementRef.current?.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (elementRef.current) {
        elementRef.current.innerText = value;
      }
      setIsEditing(false);
      elementRef.current?.blur();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (readOnly) return;
    if (onClick) onClick(e);
  };

  const handleFocus = () => {
    if (readOnly) return;
    setIsEditing(true);
    if (onFocus) onFocus();
  };

  return (
    <Component
      ref={elementRef as any}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      className={`inline-editable-node ${isEditing ? "is-editing" : ""} ${className}`}
      style={{
        outline: isEditing ? "2px solid rgba(59, 130, 246, 0.7)" : "none",
        outlineOffset: "2px",
        borderRadius: "3px",
        backgroundColor: isEditing ? "rgba(59, 130, 246, 0.05)" : "transparent",
        transition: "background-color 0.15s ease, outline 0.15s ease",
        cursor: readOnly ? "default" : "text",
        minWidth: "12px",
        maxWidth: "100%",
        display: multiline ? "block" : "inline-block",
        overflowWrap: "break-word",
        wordBreak: "break-word",
        boxSizing: "border-box",
        ...style,
      }}
      title={readOnly ? undefined : "Click to edit text directly"}
    >
      {currentVal || (!isEditing ? placeholder : "")}
    </Component>
  );
};
