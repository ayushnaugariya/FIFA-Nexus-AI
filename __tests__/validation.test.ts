import { describe, expect, it } from 'vitest';
import {
  conciergeRequestSchema,
  copilotRequestSchema,
  eventRequestSchema,
  incidentSchema,
  safeParseBody,
  sustainabilityRequestSchema,
  transportRequestSchema,
  visionRequestSchema,
} from '../lib/validation';

describe('conciergeRequestSchema', () => {
  it('accepts a valid request and defaults the language to English', () => {
    const result = safeParseBody(conciergeRequestSchema, {
      message: 'Where is Gate A?',
      stadiumId: 'metlife-nj',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.languageCode).toBe('en');
  });

  it('rejects an empty message', () => {
    const result = safeParseBody(conciergeRequestSchema, { message: '', stadiumId: 'metlife-nj' });
    expect(result.success).toBe(false);
  });

  it('rejects an unsupported language code', () => {
    const result = safeParseBody(conciergeRequestSchema, {
      message: 'hi',
      stadiumId: 'metlife-nj',
      languageCode: 'xx',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an oversized message (basic abuse/cost protection)', () => {
    const result = safeParseBody(conciergeRequestSchema, {
      message: 'a'.repeat(5000),
      stadiumId: 'metlife-nj',
    });
    expect(result.success).toBe(false);
  });
});

describe('incidentSchema', () => {
  it('rejects an unknown reporter role', () => {
    const result = safeParseBody(incidentSchema, {
      stadiumId: 'metlife-nj',
      zone: 'North Concourse',
      reporterRole: 'fan',
      description: 'Someone fainted near Gate A',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a well-formed incident with a real zone name', () => {
    const result = safeParseBody(incidentSchema, {
      stadiumId: 'metlife-nj',
      zone: 'North Concourse',
      reporterRole: 'steward',
      description: 'Someone fainted near Gate A',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a zone that does not belong to the given stadium', () => {
    const result = safeParseBody(incidentSchema, {
      stadiumId: 'metlife-nj',
      zone: 'North', // real venues use "North Concourse", not "North"
      reporterRole: 'steward',
      description: 'Someone fainted near Gate A',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a zone belonging to a different stadium', () => {
    const result = safeParseBody(incidentSchema, {
      stadiumId: 'metlife-nj',
      zone: 'Puerta Oriente', // belongs to azteca-mx, not metlife-nj
      reporterRole: 'steward',
      description: 'Someone fainted near Gate A',
    });
    expect(result.success).toBe(false);
  });

  it('defers to the route-level 404 for an unknown stadium instead of failing zone matching here', () => {
    const result = safeParseBody(incidentSchema, {
      stadiumId: 'not-a-real-stadium',
      zone: 'anything',
      reporterRole: 'steward',
      description: 'Someone fainted near Gate A',
    });
    expect(result.success).toBe(true);
  });
});

describe('transportRequestSchema', () => {
  it('defaults mobilityNeeds to false', () => {
    const result = safeParseBody(transportRequestSchema, {
      stadiumId: 'bcplace-ca',
      originDescription: 'downtown hotel',
      kickoffMinutesFromNow: 60,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.mobilityNeeds).toBe(false);
  });
});

describe('sustainabilityRequestSchema', () => {
  it('rejects a negative distance', () => {
    const result = safeParseBody(sustainabilityRequestSchema, {
      travelMode: 'walk',
      distanceKm: -5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unsupported travel mode', () => {
    const result = safeParseBody(sustainabilityRequestSchema, {
      travelMode: 'teleport',
      distanceKm: 5,
    });
    expect(result.success).toBe(false);
  });
});

describe('copilotRequestSchema', () => {
  it('allows an empty operator question (general briefing request)', () => {
    const result = safeParseBody(copilotRequestSchema, { stadiumId: 'metlife-nj' });
    expect(result.success).toBe(true);
  });

  it('rejects an oversized operator question', () => {
    const result = safeParseBody(copilotRequestSchema, {
      stadiumId: 'metlife-nj',
      operatorQuestion: 'a'.repeat(1000),
    });
    expect(result.success).toBe(false);
  });
});

describe('visionRequestSchema', () => {
  it('rejects an unsupported mime type', () => {
    const result = safeParseBody(visionRequestSchema, {
      imageBase64: 'abcd',
      mimeType: 'image/gif',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty image payload', () => {
    const result = safeParseBody(visionRequestSchema, { imageBase64: '', mimeType: 'image/png' });
    expect(result.success).toBe(false);
  });

  it('accepts a well-formed payload', () => {
    const result = safeParseBody(visionRequestSchema, { imageBase64: 'abcd1234', mimeType: 'image/jpeg' });
    expect(result.success).toBe(true);
  });
});

describe('eventRequestSchema', () => {
  it('rejects an unknown event type', () => {
    const result = safeParseBody(eventRequestSchema, { stadiumId: 'metlife-nj', eventType: 'red_card' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid event type', () => {
    const result = safeParseBody(eventRequestSchema, { stadiumId: 'metlife-nj', eventType: 'halftime' });
    expect(result.success).toBe(true);
  });
});
