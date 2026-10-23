"use client";

import React from "react";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

interface MentorMarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Re-export wrapper delegating to canonical Cognalyze MarkdownRenderer.
 * Ensures complete compatibility for AI Mentor and legacy consumers.
 */
export default function MentorMarkdownRenderer({
  content,
  className = ""
}: MentorMarkdownRendererProps) {
  return <MarkdownRenderer content={content} className={className} />;
}
