import type { Tone } from "@/types";

export type ToneConfig = {
    value: Tone;
    label: string;
    description: string;
    example: string; // Short example phrase so users understand the tone
};

export const TONES: ToneConfig[] = [
    {
        value: "professional",
        label: "Professional",
        description: "Clear, authoritative, and trustworthy",
        example: '"Engineered for precision and reliability"',
    },
    {
        value: "casual",
        label: "Casual",
        description: "Friendly, conversational, and approachable",
        example: '"You\'re going to love how easy this is"',
    },
    {
        value: "luxury",
        label: "Luxury",
        description: "Elevated, sophisticated, and aspirational",
        example: '"Crafted for those who demand the finest"',
    },
    {
        value: "playful",
        label: "Playful",
        description: "Fun, energetic, and personality-driven",
        example: '"Say hello to your new favorite thing"',
    },
    {
        value: "technical",
        label: "Technical",
        description: "Spec-focused, precise, and detail-oriented",
        example: '"Features a 5000mAh cell with 65W fast charging"',
    },
];
