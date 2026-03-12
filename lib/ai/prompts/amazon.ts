// lib/ai/prompts/amazon.ts
// Amazon-specific prompt template.
// Amazon's A9 algorithm heavily weights:
//   - Keyword placement in title (early = higher weight)
//   - Structured bullet points with benefit headers
//   - Backend search terms (our tags field)
//   - Listing completeness score

export const AMAZON_PROMPT = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLATFORM: AMAZON — A9 ALGORITHM OPTIMIZATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SEO TITLE (Amazon):
- Maximum 200 characters — count carefully
- Format: Brand + Primary Keyword + Feature + Secondary Keyword + Benefit/Use Case
- Title Case: Capitalize Every Major Word
- Primary keyword must appear as early as possible (positions 1-3 words)
- Include: product type, key material, key feature, use case or recipient
- Prohibited: "Best", "Top rated", "#1", price, availability, seller name
- Special characters allowed: em dash (—), comma, pipe (|)
- Numbers preferred over words for specs ("8 Card Slots" not "Eight Card Slots")

BULLET POINTS (Amazon):
- Exactly 5 bullet points
- Format: ALL CAPS HEADER (2-4 words) followed by space-dash-space
  Then: detailed benefit explanation with feature evidence
  Example: "RFID BLOCKING PROTECTION — Advanced shielding keeps your cards safe
            from contactless theft and unauthorized scanning in crowded areas"
- Character range per bullet: 150–250 characters
- Order by importance: most critical benefit FIRST
- Bullet 5 should address: gift angle, guarantee, or common concern
- No periods at the end of bullets
- Include at least 2 secondary keywords distributed across the 5 bullets
- Prohibited in bullets: "Best", URLs, seller info, promotional language

DESCRIPTION (Amazon):
- 250–300 words
- HTML allowed: <b>bold text</b> and <br> line breaks only
- Paragraph 1: Compelling hook focused on buyer outcome (use primary keyword)
- Paragraph 2: Expand on the top 2-3 features with detailed benefit explanation
- Paragraph 3: Ideal for (who this product is designed for + use scenarios)
- Paragraph 4: Brand story / quality promise / guarantee statement
- Include 2-3 additional secondary keywords not already used in title/bullets
- Do NOT repeat the bullets word-for-word — expand and complement them

TAGS (Amazon backend search terms):
- Exactly 10 tags
- These are backend search terms — NOT visible to customers
- Strategy: NEVER repeat words already in the title (wasted space)
  Include: synonyms, use cases, material variants, recipient types,
  complementary products, occasion-based terms
- Mix: single keywords AND multi-word phrases
- Examples: "gift for husband", "fathers day gift", "mens accessories"

META DESCRIPTION:
- Exactly 155-160 characters — used for Google Shopping and external SEO
- Format: [Product name with primary keyword]. [Key benefit + differentiator].
- Include primary keyword near the start
`.trim();

export const AMAZON_QUALITY_EXAMPLES = `
EXAMPLE TITLE (Amazon):
"Genuine Leather Bifold Wallet for Men — RFID Blocking, Slim 8mm Profile,
8 Card Slots, Full-Grain Cowhide, Gift Box"

EXAMPLE BULLET FORMAT (Amazon):
"RFID BLOCKING PROTECTION — Certified electromagnetic shielding blocks
unauthorized contactless scanning, keeping your credit cards and IDs
safe from digital pickpockets in airports, transit, and crowded venues"

EXAMPLE BULLET FORMAT (Amazon):
"ARRIVES GIFT-READY — Presented in a premium magnetic-closure gift box
making this the perfect birthday, anniversary, Father's Day, or
groomsmen gift — no additional wrapping required"
`.trim();
