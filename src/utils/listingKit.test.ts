import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampListingTitle,
  formatAllWelcomeGuides,
  formatKitAsJson,
  getTitleLengthStatus,
  normalizeAmenities,
  normalizeListingKit,
  validateGenerateInput,
} from './listingKit';

test('validateGenerateInput rejects completely empty input', () => {
  const res = validateGenerateInput([], '   ');
  assert.equal(res.valid, false);
  assert.match(res.error ?? '', /Upload at least one property photo/);
});

test('validateGenerateInput rejects short notes when no photos are attached', () => {
  const res = validateGenerateInput([], 'hi');
  assert.equal(res.valid, false);
  assert.match(res.error ?? '', /at least 10 characters/);
});

test('validateGenerateInput rejects unsupported mime types and >8 photos', () => {
  const badMime = validateGenerateInput([{ mimeType: 'image/gif' }], 'Nice apartment');
  assert.equal(badMime.valid, false);
  assert.match(badMime.error ?? '', /Unsupported image format/);

  const tooMany = Array.from({ length: 9 }, () => ({ mimeType: 'image/jpeg' }));
  const tooManyRes = validateGenerateInput(tooMany, 'Notes');
  assert.equal(tooManyRes.valid, false);
  assert.match(tooManyRes.error ?? '', /at most 8/);
});

test('validateGenerateInput accepts valid photo or sufficient notes', () => {
  assert.equal(validateGenerateInput([{ mimeType: 'image/jpeg' }], '').valid, true);
  assert.equal(
    validateGenerateInput([], 'Wi-Fi: VillaBlue24, Check-in 15:00 via lockbox').valid,
    true,
  );
});

test('clampListingTitle keeps <=50 chars cleanly on word boundaries', () => {
  const short = 'Sunlit Aegean Suite with Private Sea Balcony';
  assert.equal(clampListingTitle(short), short);
  assert.ok(clampListingTitle(short).length <= 50);

  const long =
    'Sunlit Mediterranean Cliffside Suite with Private Panorama Sea Balcony and Espresso Bar';
  const clamped = clampListingTitle(long);
  assert.ok(clamped.length <= 50);
  assert.ok(clamped.length >= 30);
  assert.equal(clamped.endsWith(' '), false);
});

test('getTitleLengthStatus computes optimal, warning, and over states accurately', () => {
  assert.deepEqual(getTitleLengthStatus('Sea-View Suite · Balcony & Espresso'), {
    count: 35,
    max: 50,
    remaining: 15,
    status: 'optimal',
  });
  assert.equal(getTitleLengthStatus('a'.repeat(47)).status, 'warning');
  assert.equal(getTitleLengthStatus('a'.repeat(51)).status, 'over');
  assert.equal(getTitleLengthStatus('a'.repeat(51)).remaining, -1);
});

test('normalizeAmenities trims whitespace and removes case-insensitive duplicates', () => {
  assert.deepEqual(
    normalizeAmenities(['  Sea View ', 'sea view', 'Espresso   Machine', '', 'Bathtub']),
    ['Sea View', 'Espresso Machine', 'Bathtub'],
  );
});

test('normalizeListingKit and formatKitAsJson preserve exact required JSON schema', () => {
  const kit = normalizeListingKit({
    listing_title:
      'Sunlit Aegean Cliffside Suite with Sea-View Balcony & Soaking Tub Extra Words',
    listing_description: '  Wake up to turquoise sea views.  ',
    detected_amenities: ['Private Balcony', 'Sea View', 'sea view', 'Espresso Machine'],
    welcome_guide: {
      EN: 'Welcome!',
      DE: 'Willkommen!',
      FR: 'Bienvenue!',
      IT: 'Benvenuti!',
      NL: 'Welkom!',
      GR: 'Καλώς ήρθατε!',
    },
    message_templates: {
      welcome: 'Warm welcome message',
      checkout: 'Checkout reminder message',
    },
    extra_field_should_be_dropped: true,
  });

  assert.ok(kit.listing_title.length <= 50);
  assert.deepEqual(kit.detected_amenities, ['Private Balcony', 'Sea View', 'Espresso Machine']);

  const parsed = JSON.parse(formatKitAsJson(kit));
  assert.deepEqual(Object.keys(parsed), [
    'listing_title',
    'listing_description',
    'detected_amenities',
    'welcome_guide',
    'message_templates',
  ]);
  assert.deepEqual(Object.keys(parsed.welcome_guide), ['EN', 'DE', 'FR', 'IT', 'NL', 'GR']);
  assert.deepEqual(Object.keys(parsed.message_templates), ['welcome', 'checkout']);
  assert.match(formatAllWelcomeGuides(kit), /GR \(Greek \/ Ελληνικά\)/);
});
