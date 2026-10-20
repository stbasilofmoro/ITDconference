// Fictional exhibitors, with original geometric emblems (no real vendor logos).
export type BoothKind = 'tower' | 'canopy' | 'curved' | 'plinth' | 'arch' | 'ring';
export type Company = { name: string; short: string; specialty: string; clue: string; emblem: string; color: string; booth: BoothKind; shape: number };
const ROWS = [
  ['Summit Rail Systems', 'SRS', 'Mountain railway engineering', 'Find the mountain railway engineers. Look for three peaks.', 'THREE PEAKS', '#D9653B', 'tower'],
  ['Ironwood Tie Works', 'ITW', 'Timber railway ties', 'Find the team supplying timber ties. Their emblem is a stack of ties.', 'TIE STACK', '#ED9833', 'canopy'],
  ['Signal Lantern Labs', 'SLL', 'Railway signaling', 'Find the signal specialists. Look for a signal with three lamps.', 'THREE LAMPS', '#E0475A', 'curved'],
  ['Atlas Track Survey', 'ATS', 'Track surveying', 'Find the track surveyors. A survey target marks their badges.', 'SURVEY TARGET', '#3D7BE0', 'plinth'],
  ['Cedar Carbon Rail', 'CCR', 'Biocarbon recovery', 'Find the biocarbon recovery team. Look for a leaf inside a circle.', 'CIRCLED LEAF', '#18BE78', 'arch'],
  ['Meridian Wheel & Axle', 'MWA', 'Wheelsets and axles', 'Find the wheelset manufacturer. Two wheels share an axle on their badge.', 'WHEELSET', '#7B5CE6', 'ring'],
  ['Crossbeam Bridge Co.', 'CBC', 'Railway bridge structures', 'Find the railway bridge builders. Their emblem is a truss bridge.', 'TRUSS BRIDGE', '#C0563A', 'canopy'],
  ['Ballast Ridge Supply', 'BRS', 'Track ballast aggregate', 'Find the ballast supplier. Three stones form their emblem.', 'THREE STONES', '#8FA33B', 'plinth'],
  ['Northstar Switchgear', 'NSW', 'Turnouts and switches', 'Find the turnout specialists. Their logo shows a branching track.', 'BRANCHING TRACK', '#2E8BC0', 'curved'],
  ['Copperline Traction', 'CLT', 'Rail electrification', 'Find the electrification team. Look for a lightning bolt.', 'LIGHTNING BOLT', '#F2B32E', 'ring'],
  ['Keystone Rail Fasteners', 'KRF', 'Rail clips and fasteners', 'Find the rail-fastener supplier. A large bolt head marks their badges.', 'BOLT HEAD', '#A15CC2', 'arch'],
  ['Prairie Freight Motion', 'PFM', 'Freight logistics', 'Find the freight logistics crew. Look for a wagon with two wheels.', 'FREIGHT WAGON', '#D94F7A', 'canopy'],
  ['Clearspan Inspection', 'CSI', 'Rail defect detection', 'Find the rail inspectors. Their emblem is a magnifying glass.', 'MAGNIFYING GLASS', '#1FA6B5', 'arch'],
  ['Sleeper Cycle Recovery', 'SCR', 'Used tie recycling', 'Find the used-tie recycling company. Look for a circular cycle emblem.', 'CIRCULAR CYCLE', '#6FAF3A', 'plinth'],
  ['Granite Grade Machines', 'GGM', 'Track grading equipment', 'Find the grading-equipment maker. A stepped grade is their symbol.', 'STEPPED GRADE', '#E4823A', 'tower'],
  ['Harbor Rail Couplers', 'HRC', 'Freight couplers', 'Find the coupler manufacturer. Their emblem has two linked hooks.', 'LINKED HOOKS', '#4F67D6', 'ring'],
  ['Echo Rail Acoustics', 'ERA', 'Rail noise control', 'Find the noise-control specialists. Look for three sound waves.', 'SOUND WAVES', '#EE6BD2', 'tower'],
  ['Redwood Crew Safety', 'RCS', 'Rail worker protection', 'Find the worker-safety team. Their emblem is a protective shield.', 'SAFETY SHIELD', '#E8463F', 'curved'],
  ['Horizon Catenary Co.', 'HCC', 'Overhead contact systems', 'Find the overhead-contact team. Look for a wire between two masts.', 'OVERHEAD WIRE', '#2FB59A', 'arch'],
  ['Foundry Rail Steel', 'FRS', 'Rolled steel rail', 'Find the steel-rail mill. An I-shaped rail section is their emblem.', 'RAIL SECTION', '#6C7A93', 'plinth'],
] as const;
export const COMPANIES: Company[] = ROWS.map(([name, short, specialty, clue, emblem, color, booth], shape) => ({ name, short, specialty, clue, emblem, color, booth, shape }));
export const ATTENDEE_NAMES = ['Alex', 'Jordan', 'Morgan', 'Taylor', 'Casey', 'Sam', 'Riley', 'Avery', 'Drew', 'Jamie', 'Robin', 'Quinn', 'Parker', 'Cameron', 'Blair', 'Reese', 'Skyler', 'Dakota', 'Rowan', 'Kendall'];
