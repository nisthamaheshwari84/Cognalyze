/**
 * COGNALYZE MENTOR — PROVIDER ABSTRACTION INTERFACES
 * Decouples the Mentor learning engine from specific speech, LLM, and voice providers.
 */

import { LanguageCode } from "../types";

export interface ILLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ILLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface ILLMProvider {
  name: string;
  generateTurn(
    systemPrompt: string,
    messages: ILLMMessage[],
    options?: ILLMOptions
  ): Promise<string>;
}

export interface ISpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export interface ISpeechProvider {
  name: string;
  isAvailable(): boolean;
  transcribe(audioStreamOrChunk: any): Promise<ISpeechRecognitionResult>;
}

export interface IVoiceSynthesisOptions {
  language: LanguageCode;
  pitch?: number;
  rate?: number;
  voiceName?: string;
}

export interface IVoiceProvider {
  name: string;
  speak(text: string, options: IVoiceSynthesisOptions): Promise<void>;
  cancel(): void;
}

export interface IEvaluationProvider {
  name: string;
  evaluate(
    studentInput: string,
    expectedConcept: string,
    context: any
  ): Promise<any>;
}
