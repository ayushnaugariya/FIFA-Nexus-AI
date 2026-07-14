export interface Zone {
  id: string;
  name: string;
  gates: string[];
  amenities: string[];
  accessibleRoute: string;
}

export interface Stadium {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: number;
  transitOptions: string[];
  parkingNotes: string;
  sustainabilityNotes: string;
  zones: Zone[];
}

/**
 * Reference data for a representative slice of FIFA World Cup 2026 host
 * venues across the three host countries. In production this would be
 * sourced from the tournament operations system; here it grounds the
 * concierge, wayfinding, transport and crowd modules with concrete,
 * checkable facts instead of the model inventing venue details.
 */
export const STADIUMS: Stadium[] = [
  {
    id: 'metlife-nj',
    name: 'MetLife Stadium',
    city: 'East Rutherford, New Jersey',
    country: 'USA',
    capacity: 82500,
    transitOptions: ['NJ Transit rail to Meadowlands', 'Coach USA shuttle bus', 'Designated rideshare zone Lot E'],
    parkingNotes: 'Pre-purchased parking passes required for Lots A–H; walk-up parking is not available on match days.',
    sustainabilityNotes: 'Free water refill stations at every concourse; single-stream recycling bins beside every waste bin.',
    zones: [
      { id: 'north', name: 'North Concourse', gates: ['Gate A', 'Gate B'], amenities: ['First aid', 'Family restroom', 'Prayer room'], accessibleRoute: 'Level 1 ramp from Gate A, elevators C1–C3' },
      { id: 'south', name: 'South Concourse', gates: ['Gate D', 'Gate E'], amenities: ['Team store', 'Sensory room'], accessibleRoute: 'Level 1 ramp from Gate D, elevators C4–C6' },
    ],
  },
  {
    id: 'azteca-mx',
    name: 'Estadio Azteca',
    city: 'Mexico City',
    country: 'Mexico',
    capacity: 83200,
    transitOptions: ['Tren Ligero to Estadio Azteca station', 'RTP bus routes 1 and 17', 'Metrobús feeder shuttle'],
    parkingNotes: 'Very limited on-site parking; public transit is strongly recommended for all match days.',
    sustainabilityNotes: 'Solar-assisted lighting on the east concourse; refillable cup program at all beverage stands.',
    zones: [
      { id: 'oriente', name: 'Puerta Oriente', gates: ['Puerta 1', 'Puerta 2'], amenities: ['First aid', 'Nursing room'], accessibleRoute: 'Ramp at Puerta 1, elevator bank E' },
      { id: 'poniente', name: 'Puerta Poniente', gates: ['Puerta 7', 'Puerta 8'], amenities: ['Accessible seating desk'], accessibleRoute: 'Ramp at Puerta 8, elevator bank P' },
    ],
  },
  {
    id: 'bcplace-ca',
    name: 'BC Place',
    city: 'Vancouver',
    country: 'Canada',
    capacity: 54500,
    transitOptions: ['SkyTrain Expo/Millennium Line to Stadium–Chinatown', 'TransLink shuttle buses', 'Seawall walking/cycling route'],
    parkingNotes: 'Limited downtown parkades nearby; the stadium encourages SkyTrain or cycling over driving.',
    sustainabilityNotes: 'LEED Gold facility; on-site composting and a bike valet at Gate H.',
    zones: [
      { id: 'east', name: 'East Plaza', gates: ['Gate A', 'Gate H'], amenities: ['Bike valet', 'First aid'], accessibleRoute: 'Level 100 accessible entrance at Gate A' },
      { id: 'west', name: 'West Plaza', gates: ['Gate F', 'Gate G'], amenities: ['Quiet room', 'Family restroom'], accessibleRoute: 'Level 100 accessible entrance at Gate G' },
    ],
  },
];

export function getStadiumById(stadiumId: string): Stadium | undefined {
  return STADIUMS.find((s) => s.id === stadiumId);
}

// STADIUMS is a hardcoded, non-empty literal, so this single assertion is
// safe; it exists so every page can pick a sane default without repeating
// the assertion (and tripping noUncheckedIndexedAccess) at each call site.
export const DEFAULT_STADIUM: Stadium = STADIUMS[0] as Stadium;

export function summarizeStadiumForPrompt(stadium: Stadium): string {
  return [
    `Venue: ${stadium.name} (${stadium.city}, ${stadium.country}), capacity ${stadium.capacity.toLocaleString()}.`,
    `Transit options: ${stadium.transitOptions.join('; ')}.`,
    `Parking notes: ${stadium.parkingNotes}`,
    `Sustainability notes: ${stadium.sustainabilityNotes}`,
    `Zones: ${stadium.zones
      .map((z) => `${z.name} via ${z.gates.join('/')} — amenities: ${z.amenities.join(', ')}; accessible route: ${z.accessibleRoute}`)
      .join(' | ')}`,
  ].join('\n');
}
