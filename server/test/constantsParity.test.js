import { describe, expect, it } from '@jest/globals';
import { SPECIALTY_TAGS } from '../constants/specialtyTags.js';
import { TREATMENT_ORIENTATIONS } from '../constants/treatmentOrientations.js';
import { SPECIALTY_TAGS as CLIENT_SPECIALTY_TAGS } from '../../client/src/data/specialtyTags.js';
import { TREATMENT_ORIENTATIONS as CLIENT_TREATMENT_ORIENTATIONS } from '../../client/src/data/treatmentOrientations.js';

// THIS TEST REACHES ACROSS THE CLIENT/SERVER BOUNDARY ON PURPOSE.
//
// Chunk 1.1 left open how the client would get these two lists: a copy, or a
// public endpoint. Chunk 3.4 chose a copy — the lists are client-fixed and will
// never change, so an endpoint would add a round trip, a loading state and an
// error state to every render for nothing.
//
// The one real cost of a copy is DRIFT, and drift here is silent and serious:
// a therapist picking "Anxiety " with a trailing space, or "anxiety" lowercased,
// would be stored verbatim and then match no client for ever, with no error
// anywhere. Matching would simply return fewer people than it should.
//
// So the copy is only safe if something proves it is still a copy. This is it.

describe('specialty tags — client copy matches the server', () => {
  it('has the same number of tags', () => {
    expect(CLIENT_SPECIALTY_TAGS).toHaveLength(SPECIALTY_TAGS.length);
  });

  // Order included: both sides render the client's approved order, and a
  // reordered copy is a copy someone edited by hand.
  it('is identical, in the same order, byte for byte', () => {
    expect([...CLIENT_SPECIALTY_TAGS]).toEqual([...SPECIALTY_TAGS]);
  });

  it.each(SPECIALTY_TAGS)('client has "%s" exactly', (tag) => {
    expect(CLIENT_SPECIALTY_TAGS).toContain(tag);
  });

  it('has no duplicates on either side', () => {
    expect(new Set(SPECIALTY_TAGS).size).toBe(SPECIALTY_TAGS.length);
    expect(new Set(CLIENT_SPECIALTY_TAGS).size).toBe(CLIENT_SPECIALTY_TAGS.length);
  });

  it('carries no leading or trailing whitespace', () => {
    for (const tag of CLIENT_SPECIALTY_TAGS) {
      expect(tag).toBe(tag.trim());
    }
  });

  it('still holds the 27 the client approved', () => {
    expect(SPECIALTY_TAGS).toHaveLength(27);
  });
});

describe('treatment orientations — client copy matches the server', () => {
  it('has the same number of orientations', () => {
    expect(CLIENT_TREATMENT_ORIENTATIONS).toHaveLength(TREATMENT_ORIENTATIONS.length);
  });

  it('is identical, in the same order, byte for byte', () => {
    expect([...CLIENT_TREATMENT_ORIENTATIONS]).toEqual([...TREATMENT_ORIENTATIONS]);
  });

  it('has no duplicates on either side', () => {
    expect(new Set(TREATMENT_ORIENTATIONS).size).toBe(TREATMENT_ORIENTATIONS.length);
    expect(new Set(CLIENT_TREATMENT_ORIENTATIONS).size).toBe(
      CLIENT_TREATMENT_ORIENTATIONS.length,
    );
  });

  it('still holds the 33 the client approved', () => {
    expect(TREATMENT_ORIENTATIONS).toHaveLength(33);
  });
});

describe('the two lists stay distinct', () => {
  // "Career Counselling" (British, specialty) and "Career Counseling" (American,
  // orientation) are both verbatim from the spec. Somebody will eventually try
  // to "fix" one of them; this is what stops it.
  it('keeps the deliberate British/American spelling split', () => {
    expect(CLIENT_SPECIALTY_TAGS).toContain('Career Counselling');
    expect(CLIENT_TREATMENT_ORIENTATIONS).toContain('Career Counseling');
    expect(CLIENT_SPECIALTY_TAGS).not.toContain('Career Counseling');
    expect(CLIENT_TREATMENT_ORIENTATIONS).not.toContain('Career Counselling');
  });
});
