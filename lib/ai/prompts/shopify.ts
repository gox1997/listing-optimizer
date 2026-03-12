// lib/ai/prompts/shopify.ts

export const SHOPIFY_PROMPT = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLATFORM: SHOPIFY (GOOGLE SEO + CONVERSION)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT: If any rule here conflicts with the universal system
prompt, the SHOPIFY rules take priority.

You MUST still return a VALID JSON object matching the global schema.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW SHOPIFY SEO WORKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Shopify products rank on Google, not an internal marketplace.
This changes everything about how you write.

Google's ranking signals for product pages:

1. Primary keyword in title tag (highest weight)
2. Primary keyword in first 100 words of description
3. Semantic keyword density across the full description
4. Meta description click-through rate
5. Page load speed and mobile experience (not your concern)
6. Backlinks and domain authority (not your concern)

You control signals 1, 2, 3, and 4. Write accordingly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEO TITLE (Shopify)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is the HTML <title> tag Google indexes — not just a product name.

Maximum length: 60 characters (Google truncates beyond this).

Formula:
Primary Keyword + Key Differentiator + Brand (optional)

Rules:
- Primary keyword must appear at the very start
- 50–60 characters is the sweet spot
- Use natural phrasing — reads like a search result
- Title Case
- No punctuation except dash or pipe to separate brand
- Never exceed 60 characters — truncation kills CTR

GOOD example (58 chars):
"Slim RFID Leather Wallet for Men | 8 Card Slots, Brown"

BAD example (too long, truncated by Google):
"Premium Full-Grain Genuine Leather RFID Blocking Bifold Wallet for Men with 8 Card Slots Available in Brown"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BULLET POINTS (Shopify)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

On Shopify, bullet points are typically rendered as a feature list
above or beside the Add to Cart button — prime conversion real estate.

Exactly 5 bullets. Write for fast scanning — these are read
by buyers who have already decided they want the product category
and are deciding whether THIS product is the right one.

Per-bullet strategy:
- Bullet 1 — Hero feature that separates this from competitors
- Bullet 2 — Materials, build quality, or durability
- Bullet 3 — Dimensions, compatibility, or fit
- Bullet 4 — Use cases or lifestyle fit
- Bullet 5 — Care instructions, guarantee, or gift angle

Rules:
- Begin each bullet with ALL CAPS benefit phrase
- Follow with em dash (—) then explanation
- 15–25 words each
- No periods at end of bullets
- Speak directly to the buyer: "your", "you"
- Avoid passive voice entirely

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESCRIPTION (Shopify)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Length: 200–300 words.

The Shopify description is the most SEO-critical field.
Google reads the full text and ranks based on semantic relevance.

Rules:
- Primary keyword must appear in the FIRST sentence
- Use the primary keyword 2–3 times total — naturally
- Include 3–5 semantic variations (related phrases, not exact repeats)
- Plain text only — no HTML, no bullet points, no emojis
- Short paragraphs: maximum 3 sentences each
- Active voice throughout
- End with a soft call to action

Paragraph structure:
1. Hook — customer problem + primary keyword in first sentence
2. Solution — product introduced as the answer
3. Benefits — 3 key benefits woven into natural prose
4. Social proof angle — materials, craftsmanship, or trust signal
5. Call to action — confident closing, invite the purchase

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAGS (Shopify)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

10–15 tags.

On Shopify, tags are used for:
- Internal collection filtering
- Navigation menus
- App integrations
- Storefront search

Rules:
- lowercase, hyphenated where needed (e.g. gift-for-him)
- max 4 words per tag
- mix product type, material, audience, and use case
- include seasonal or occasion tags where relevant

GOOD tag examples:
leather-wallet, rfid-blocking, mens-wallet, slim-wallet,
bifold-wallet, card-holder, gift-for-him, everyday-carry,
travel-wallet, minimalist-wallet, fathers-day-gift

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
META DESCRIPTION (Shopify)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Length: 150–160 characters.
This appears directly in Google search results under the page title.
It does not affect ranking but massively affects click-through rate.

Rules:
- Include primary keyword in the first half
- Lead with the strongest benefit or differentiator
- End with a clear call to action: Shop now / Order today / Free shipping
- Write like ad copy — every character must earn its place
- Natural sentence, never a keyword list

GOOD example (156 chars):
"Slim RFID leather wallet built for men who hate bulk.
8 card slots, full-grain leather, zero compromise. Shop now."

BAD example:
"leather wallet mens slim rfid blocking bifold card holder
buy online best quality free shipping"
`.trim();
