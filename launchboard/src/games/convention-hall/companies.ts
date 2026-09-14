// Fictional exhibitors, with original geometric emblems (no real vendor logos).
export type Company = { name: string; short: string; specialty: string; clue: string; emblem: string; color: string; shape: number };
const ROWS = [
  ['Summit Rail Systems', 'SRS', 'Mountain railway engineering', 'Find the mountain railway engineers. Look for three peaks.', 'THREE PEAKS', '#925F45'],
  ['Ironwood Tie Works', 'ITW', 'Timber railway ties', 'Find the team supplying timber ties. Their emblem is a stack of ties.', 'TIE STACK', '#AE7136'],
  ['Signal Lantern Labs', 'SLL', 'Railway signaling', 'Find the signal specialists. Look for a signal with three lamps.', 'THREE LAMPS', '#9C4D53'],
  ['Atlas Track Survey', 'ATS', 'Track surveying', 'Find the track surveyors. A survey target marks their badges.', 'SURVEY TARGET', '#536FA0'],
  ['Cedar Carbon Rail', 'CCR', 'Biocarbon recovery', 'Find the biocarbon recovery team. Look for a leaf inside a circle.', 'CIRCLED LEAF', '#526F50'],
  ['Meridian Wheel & Axle', 'MWA', 'Wheelsets and axles', 'Find the wheelset manufacturer. Two wheels share an axle on their badge.', 'WHEELSET', '#685B91'],
  ['Crossbeam Bridge Co.', 'CBC', 'Railway bridge structures', 'Find the railway bridge builders. Their emblem is a truss bridge.', 'TRUSS BRIDGE', '#916856'],
  ['Ballast Ridge Supply', 'BRS', 'Track ballast aggregate', 'Find the ballast supplier. Three stones form their emblem.', 'THREE STONES', '#74745D'],
  ['Northstar Switchgear', 'NSW', 'Turnouts and switches', 'Find the turnout specialists. Their logo shows a branching track.', 'BRANCHING TRACK', '#426E86'],
  ['Copperline Traction', 'CLT', 'Rail electrification', 'Find the electrification team. Look for a lightning bolt.', 'LIGHTNING BOLT', '#AD7532'],
  ['Keystone Rail Fasteners', 'KRF', 'Rail clips and fasteners', 'Find the rail-fastener supplier. A large bolt head marks their badges.', 'BOLT HEAD', '#7B657C'],
  ['Prairie Freight Motion', 'PFM', 'Freight logistics', 'Find the freight logistics crew. Look for a wagon with two wheels.', 'FREIGHT WAGON', '#8D5865'],
  ['Clearspan Inspection', 'CSI', 'Rail defect detection', 'Find the rail inspectors. Their emblem is a magnifying glass.', 'MAGNIFYING GLASS', '#3F7880'],
  ['Sleeper Cycle Recovery', 'SCR', 'Used tie recycling', 'Find the used-tie recycling company. Look for a circular cycle emblem.', 'CIRCULAR CYCLE', '#807745'],
  ['Granite Grade Machines', 'GGM', 'Track grading equipment', 'Find the grading-equipment maker. A stepped grade is their symbol.', 'STEPPED GRADE', '#A16A43'],
  ['Harbor Rail Couplers', 'HRC', 'Freight couplers', 'Find the coupler manufacturer. Their emblem has two linked hooks.', 'LINKED HOOKS', '#5B6891'],
  ['Echo Rail Acoustics', 'ERA', 'Rail noise control', 'Find the noise-control specialists. Look for three sound waves.', 'SOUND WAVES', '#8B5F85'],
  ['Redwood Crew Safety', 'RCS', 'Rail worker protection', 'Find the worker-safety team. Their emblem is a protective shield.', 'SAFETY SHIELD', '#A4514C'],
  ['Horizon Catenary Co.', 'HCC', 'Overhead contact systems', 'Find the overhead-contact team. Look for a wire between two masts.', 'OVERHEAD WIRE', '#467580'],
  ['Foundry Rail Steel', 'FRS', 'Rolled steel rail', 'Find the steel-rail mill. An I-shaped rail section is their emblem.', 'RAIL SECTION', '#656774'],
] as const;
export const COMPANIES: Company[] = ROWS.map(([name, short, specialty, clue, emblem, color], shape) => ({ name, short, specialty, clue, emblem, color, shape }));
export const ATTENDEE_NAMES = ['Alex', 'Jordan', 'Morgan', 'Taylor', 'Casey', 'Sam', 'Riley', 'Avery', 'Drew', 'Jamie', 'Robin', 'Quinn', 'Parker', 'Cameron', 'Blair', 'Reese', 'Skyler', 'Dakota', 'Rowan', 'Kendall'];
