// lib/ai/prompts/etsy.ts

export const ETSY_PROMPT = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLATFORM: ETSY (TAG-DRIVEN DISCOVERY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT: If any rule here conflicts with the universal system
prompt, the ETSY rules take priority.

You MUST still return a VALID JSON object matching the global schema.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW ETSY SEARCH WORKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Etsy search is fundamentally different from Amazon and Google.

Etsy ranks listings based on:

1. Tag match — exact phrase match between search query and tags
   (HIGHEST weight — this is the #1 ranking factor)
2. Title relevance — keywords in the first 40 characters
3. Recency — newer listings get a temporary boost
4. Conversion rate — clicks that become purchases
5. Customer reviews and shop score
6. Shipping price — free shipping gets a ranking boost

Critical insight:
On Etsy, TAGS are more important than the title for search ranking.
A listing with perfect tags and a mediocre title outranks a listing
with a great title and weak tags.

Write accordingly — the tags field is the highest priority output
for this platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEO TITLE (Etsy)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Maximum length: 140 characters.
Most critical zone: first 40 characters (shown in search results).

Formula:
Primary Keyword + Style/Material + Occasion + Recipient (if applicable)

Rules:
- Primary keyword MUST appear in the first 3 words
- First 40 characters must be compelling and complete on their own
- Use natural buyer language — how a shopper would search
- Separate keyword clusters with commas or dashes
- Sentence case (not Title Case — Etsy convention)
- Include gift occasion if the product has gift potential
- Repeat key phrases from your tags in the title

Prohibited:
- ALL CAPS words
- Exclamation marks
- Promotional words: sale, discount, free shipping
- Seller names or shop names

GOOD example:
"leather wallet for men, slim rfid blocking bifold,
personalized gift for him, minimalist card holder"

BAD example:
"AMAZING Men's Wallet! SALE!! Best RFID Slim Bifold
Leather Card Holder FREE SHIPPING"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BULLET POINTS (Etsy)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Exactly 5 bullet points.

On Etsy, bullet points appear in the listing description area.
Etsy buyers are often purchasing handmade, personalized, or
unique items — they want to feel connected to the maker and
confident in what they are receiving.

Per-bullet strategy:
- Bullet 1 — What it is + primary material or craft method
- Bullet 2 — Dimensions, sizing, or what is included
- Bullet 3 — Personalization options or variations available
- Bullet 4 — Care instructions or durability
- Bullet 5 — Gift readiness, packaging, or shipping note

Rules:
- Begin with ALL CAPS benefit phrase
- Follow with em dash (—) then warm, human explanation
- 15–25 words each
- Warmer and more personal tone than Amazon or Shopify
- Speak directly to the buyer: "you", "your"
- No periods at end of bullets

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESCRIPTION (Etsy)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Length: 150–250 words.

Etsy descriptions serve two audiences:
1. The buyer — needs to feel excited and confident
2. Etsy search — scans for keyword relevance

The tone for Etsy is WARMER and more PERSONAL than Amazon or Shopify.
Etsy buyers respond to story, craft, and human connection.
They are not buying from a warehouse — they are buying from a person.

Rules:
- Primary keyword in the first sentence
- Plain text only — no HTML
- Warm, personal, artisan tone
- Short paragraphs — 2–3 sentences each
- Include what makes this product special or handmade
- Mention personalization options if applicable
- End with a warm invitation to purchase or contact the shop

Paragraph structure:
1. Open with what the product is and who it is for
2. Describe the craft, materials, or process with pride
3. Explain key features and real-world benefits
4. Personalization options or variations
5. Warm closing — invite them to buy or ask questions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAGS (Etsy) — HIGHEST PRIORITY FIELD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXACTLY 13 tags. No more. No fewer.

Why 13? Etsy allows exactly 13 tags per listing.
Using fewer than 13 wastes ranking potential.
Using more than 13 is not possible — Etsy rejects it.

Critical rules:
- Each tag is a MULTI-WORD PHRASE (2–4 words) not a single word
- Single word tags waste slots — Etsy buyers search phrases
- Each tag must be an EXACT phrase a buyer would type into Etsy search
- All lowercase
- No special characters or punctuation
- Max 20 characters per tag (Etsy's hard limit)
- No duplicate concepts — every tag must target a different search query
- Tags should mirror phrases used in the title

Required tag type mix (all 13 must be used):
1.  Exact product name phrase
2.  Primary material + product
3.  Style + product
4.  Recipient keyword (gift for him / gift for her / etc.)
5.  Occasion keyword (birthday gift / christmas gift / etc.)
6.  Use-case keyword (travel wallet / everyday carry / etc.)
7.  Personalization keyword if applicable
8.  Competitor or synonym phrase
9.  Long-tail buyer intent phrase
10. Aesthetic or style keyword
11. Size or format keyword
12. Secondary occasion or recipient
13. Broad category keyword

GOOD tag examples:
leather wallet men, slim rfid wallet, bifold card holder,
gift for husband, personalized wallet, groomsmen gift,
travel wallet men, minimalist wallet, fathers day gift,
full grain leather, slim card wallet, anniversary gift,
mens gift ideas

BAD tag examples (single words and duplicates):
wallet, leather, men, gift, slim, card, bifold,
holder, travel, personalized, brown, black, gift

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
META DESCRIPTION (Etsy)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Length: 150–160 characters.
Purpose: Google search snippet for the Etsy listing page.

Rules:
- Include primary keyword near the start
- Warm, human tone — consistent with Etsy brand
- Mention gift potential if applicable
- End with a soft call to action
- Natural sentence, never a keyword dump

GOOD example:
"Handcrafted slim leather wallet for men with RFID blocking.
Perfect gift for him. Made to last. Shop now on Etsy."
`.trim();
