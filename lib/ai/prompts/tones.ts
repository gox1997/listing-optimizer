// Tone modifier strings injected into every prompt.
// Stacked on top of the platform template to shape voice and style.

// ─────────────────────────────────────────────────────────────────────────────
// TONE_GLOBAL_RULES
// Applied after the platform prompt, before the tone-specific prompt.
// These rules govern HOW tone is applied — they never override platform
// structural constraints (character limits, field counts, JSON schema).
// ─────────────────────────────────────────────────────────────────────────────

export const TONE_GLOBAL_RULES = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONE APPLICATION — UNIVERSAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tone is a STYLE LAYER. It shapes word choice, sentence rhythm, and emotional
register — it NEVER overrides platform structure, character limits, or the
JSON output schema.

CONSISTENCY:
- Apply the selected tone uniformly across ALL output fields:
  seoTitle, bulletPoints, description, and metaDescription.
- Do not let tone drift between sections. A listing that opens playfully
  and closes formally feels incoherent. Commit to the voice end-to-end.

TONE VS. STRUCTURE — PRIORITY ORDER:
1. JSON schema and field constraints are ABSOLUTE (non-negotiable).
2. Platform structural rules (char limits, bullet format, tag count) are FIXED.
3. Universal copywriting principles (features → benefits, specificity) apply always.
4. Tone shapes HOW those principles are expressed — not WHETHER they apply.

SEO AND KEYWORDS ARE NON-NEGOTIABLE:
- Keyword placement requirements are never relaxed for tone.
- Primary keyword must still appear in seoTitle and first sentence of description,
  regardless of tone. Work it in naturally — but work it in.
- Secondary keywords must still be distributed. Tone affects how, not if.

ACCURACY OVER STYLE:
- Never invent specs, materials, certifications, or features to fit a tone.
- If the tone calls for sensory language but no sensory details were provided,
  use what IS available — do not fabricate.
- Claims must remain verifiable regardless of how they are styled.

READABILITY FLOOR:
- No tone justifies unreadable copy. Even luxury prose must parse clearly.
- Even technical copy must not bury the benefit under jargon alone.
`.trim();

// ─────────────────────────────────────────────────────────────────────────────
// TONE_PROMPTS
// Injected as the final layer — stylistic shaping only.
// ─────────────────────────────────────────────────────────────────────────────

export const TONE_PROMPTS: Record<string, string> = {
    professional: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONE: PROFESSIONAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Voice: Authoritative, confident, precise, and trustworthy.
The buyer wants to feel they are making an informed decision backed by evidence.

Rules:
- Use industry-appropriate vocabulary without over-jargoning
- Lead with data, specs, and specifics rather than adjectives
- Third-person product focus is acceptable ("The wallet features...")
- Avoid contractions where formality helps ("does not" not "doesn't")
- No slang, no casual phrasing, no overly enthusiastic claims
- Every claim should feel verifiable

Buyer psychology: This person values trust, reliability, and quality assurance.
They are skeptical of marketing language but respond to confident expertise.
`.trim(),

    casual: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONE: CASUAL & FRIENDLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Voice: Warm, approachable, and conversational — like a knowledgeable
friend who genuinely loves this product and wants you to love it too.

Rules:
- Write in second person ("you'll love how this feels")
- Contractions are encouraged ("you'll", "it's", "we've")
- Short, punchy sentences that feel like natural speech
- Relatable everyday scenarios over formal use cases
- Light informality, but never unprofessional
- Avoid corporate-speak or stiff formal structure

Buyer psychology: This person wants to feel connected to the brand.
They buy from people they like and trust. Relatability converts.
`.trim(),

    luxury: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONE: LUXURY & PREMIUM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Voice: Elevated, aspirational, and sensory-rich. Every word earns its place.
This copy should feel like it belongs on a premium brand's flagship product page.

Rules:
- Sensory language is paramount: texture, weight, scent, sound, feel
- Focus on: heritage, artisanship, material provenance, meticulous process
- Vocabulary: "exquisite", "masterfully crafted", "discerning", "curated",
  "exceptional", "refined", "timeless" — use these deliberately, not liberally
- Longer, more deliberate sentences that allow ideas to breathe
- NEVER mention: price sensitivity, "affordable", "budget", "deal"
- Exclusivity framing: "for those who appreciate", "reserved for", "select"
- The product should feel like a reward, a statement, or a legacy purchase

Buyer psychology: Status, exclusivity, self-reward, and the desire to own
the best version of something. They are gifting to themselves or someone special.
`.trim(),

    playful: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONE: PLAYFUL & FUN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Voice: Energetic, witty, personality-driven, and memorable.
The copy should make someone smile or think "I like these people."

Rules:
- Personality over polish — brand voice shines through every sentence
- Punchy sentences. Rhetorical questions. Playful subversions of expectation.
- Light humor where it fits naturally — NEVER forced
- Enthusiasm is genuine, not performed ("Okay, hear us out...")
- Can use: em dashes for comic timing, parentheticals for asides
- Avoid: overly formal structure, dry spec-listing, corporate seriousness

Buyer psychology: Delight, personality alignment, shareability.
This person wants to buy from a brand that makes them feel something.
`.trim(),

    technical: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONE: TECHNICAL & DETAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Voice: Precise, specification-driven, expert-to-expert communication.
The buyer is an enthusiast or professional who distrusts vague claims.

Rules:
- Exact measurements, material grades, certifications, standards, ratings
- Technical terminology is appropriate and expected by this audience
- Structure around specifications: stat → why it matters → real-world outcome
- Comparisons to industry standards or competing materials are valuable
- Avoid: fluffy adjectives without evidence, "high quality" (specify the grade),
  emotional language without a technical anchor
- Include: model numbers, test standards (MIL-SPEC, IP rating, etc.),
  material composition percentages, tolerances where relevant

Buyer psychology: Confidence through expertise. This person will fact-check claims.
They respect precision and make informed decisions based on detailed specifications.
`.trim(),
};
