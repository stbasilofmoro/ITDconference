export type Grade = 'grade1' | 'grade2' | 'junk';
export type StationId = 'incoming' | Grade | 'truck1' | 'truck2' | 'shredder';
export type Station = { id: StationId; label: string; x: number; z: number };
export type Tie = { id: number; grade: Grade; condition: string };
export type Run = {
  phase: 'intro' | 'playing' | 'won' | 'lost';
  paused: boolean;
  elapsed: number;
  player: { x: number; z: number; facing: number };
  target: StationId | null;
  incoming: Tie[];
  queue: Tie[];
  held: { tie: Tie; graded: Grade | null } | null;
  piles: Record<Grade, Tie[]>;
  delivered: Record<Grade, number>;
  deliveredIds: number[];
  score: number;
  mistakes: number;
  graded: number;
  handled: number;
  message: string;
  messageTime: number;
  seed: number;
  initialSeed: number;
  nextArrival: number;
  revision: number;
};

export const SHIFT_SECONDS = 180;
export const QUOTA = 12;
export const ARRIVAL_SECONDS = 8;
export const PLAYER_SPEED = 5.4;
export const REACH = 1.55;
export const GRADES: Grade[] = ['grade1', 'grade2', 'junk'];
export const GRADE_LABELS: Record<Grade, string> = { grade1: 'Grade 1', grade2: 'Grade 2', junk: 'Junk' };
export const DESTINATIONS: Record<Grade, StationId> = { grade1: 'truck1', grade2: 'truck2', junk: 'shredder' };
export const STATIONS: Station[] = [
  { id: 'incoming', label: 'Incoming ties', x: -6, z: 0 },
  { id: 'grade1', label: 'Grade 1 pile', x: -2, z: -2.5 },
  { id: 'grade2', label: 'Grade 2 pile', x: -2, z: 0.8 },
  { id: 'junk', label: 'Junk pile', x: -2, z: 4 },
  { id: 'truck1', label: 'Grade 1 truck', x: 5, z: -2.5 },
  { id: 'truck2', label: 'Grade 2 truck', x: 5, z: 0.8 },
  { id: 'shredder', label: 'Shredder', x: 5, z: 4 },
];

const CONDITIONS: Record<Grade, string[]> = {
  grade1: ['Straight, solid timber. No rot or splits.', 'Straight edges, sound wood, no cracks.', 'Solid wood with clean edges and no decay.'],
  grade2: ['Weathered surface, shallow cracks; still solid.', 'Worn edges and surface cracks; wood stays firm.', 'Weathered gray wood, light checking, no rot.'],
  junk: ['Soft rot and a crumbling end.', 'A deep split runs through the timber.', 'Broken end and missing chunks of wood.'],
};

function random(run: Run) {
  run.seed = (Math.imul(run.seed, 1664525) + 1013904223) >>> 0;
  return run.seed / 4294967296;
}

function active(run: Run) { return run.phase === 'playing' && !run.paused; }
function say(run: Run, message: string) { run.message = message; run.messageTime = 5; run.revision++; }
function stationFor(id: StationId) { return STATIONS.find((station) => station.id === id); }
function isGrade(id: StationId): id is Grade { return id === 'grade1' || id === 'grade2' || id === 'junk'; }
function distance(run: Run, station: Station) { return Math.hypot(station.x - run.player.x, station.z - run.player.z); }
function mistake(run: Run, message: string) {
  run.mistakes++;
  run.score = Math.max(0, run.score - 10);
  say(run, message);
  return false;
}

export function newRun(seed = Date.now()): Run {
  const run: Run = {
    phase: 'intro', paused: false, elapsed: 0,
    player: { x: -5, z: 2.4, facing: Math.PI }, target: null,
    incoming: [], queue: [], held: null,
    piles: { grade1: [], grade2: [], junk: [] },
    delivered: { grade1: 0, grade2: 0, junk: 0 }, deliveredIds: [],
    score: 0, mistakes: 0, graded: 0, handled: 0,
    message: 'Pick up a tie, inspect its condition, and carry it to the right pile.', messageTime: 5,
    seed: seed >>> 0, initialSeed: seed >>> 0, nextArrival: ARRIVAL_SECONDS, revision: 0,
  };
  // Each group includes all three conditions, so every shift has four ties of each grade.
  for (let group = 0; group < QUOTA / 3; group++) {
    const grades = [...GRADES];
    for (let i = grades.length - 1; i > 0; i--) {
      const j = Math.floor(random(run) * (i + 1));
      [grades[i], grades[j]] = [grades[j], grades[i]];
    }
    for (const grade of grades) run.queue.push({
      id: run.queue.length + 1,
      grade,
      condition: CONDITIONS[grade][Math.floor(random(run) * CONDITIONS[grade].length)],
    });
  }
  run.incoming = run.queue.splice(0, 3);
  return run;
}

export function start(run: Run) {
  if (run.phase !== 'intro') return;
  run.phase = 'playing';
  say(run, 'Shift started! Pick up an incoming tie and inspect the timber.');
}

export function remaining(run: Run) { return Math.max(0, SHIFT_SECONDS - run.elapsed); }

export function nearestStation(run: Run): Station | null {
  let nearest: Station | null = null;
  let nearestDistance = REACH;
  for (const station of STATIONS) {
    const d = distance(run, station);
    if (d <= nearestDistance) { nearest = station; nearestDistance = d; }
  }
  return nearest;
}

export function togglePause(run: Run) {
  if (run.phase !== 'playing') return;
  run.paused = !run.paused;
  run.revision++;
}

export function visit(run: Run, id: StationId) {
  if (!active(run)) return false;
  const station = stationFor(id);
  if (!station) return false;
  run.target = id;
  run.revision++;
  return true;
}

export function move(run: Run, dx: number, dz: number, dt: number) {
  if (!active(run) || !Number.isFinite(dx) || !Number.isFinite(dz) || !Number.isFinite(dt) || dt <= 0) return;
  const length = Math.hypot(dx, dz);
  if (!length) return;
  run.target = null;
  const step = PLAYER_SPEED * dt / Math.max(1, length);
  run.player.x = Math.max(-8.5, Math.min(8.5, run.player.x + dx * step));
  run.player.z = Math.max(-4.5, Math.min(5.5, run.player.z + dz * step));
  run.player.facing = Math.atan2(dx, dz);
  run.revision++;
}

export function interact(run: Run, id?: StationId) {
  if (!active(run)) return false;
  const station = id ? stationFor(id) : nearestStation(run);
  if (!station || distance(run, station) > REACH + 1e-8) {
    say(run, 'Walk closer to a pile, truck, or the shredder to pick up or place a tie.');
    return false;
  }
  run.target = null;

  if (station.id === 'incoming') {
    if (run.held) { say(run, 'Your paws are full. Place the tie you are carrying first.'); return false; }
    const tie = run.incoming.shift();
    if (!tie) {
      say(run, run.queue.length ? 'The next ties are on their way. Load a graded pile while you wait.' : 'All ties have arrived. Finish the piles and deliveries.');
      return false;
    }
    run.held = { tie, graded: null };
    say(run, `Inspect tie ${tie.id}: ${tie.condition}`);
    return true;
  }

  if (isGrade(station.id)) {
    const grade = station.id;
    if (!run.held) {
      const tie = run.piles[grade].shift();
      if (!tie) { say(run, `${GRADE_LABELS[grade]} pile is empty. Grade an incoming tie here first.`); return false; }
      run.held = { tie, graded: grade };
      say(run, grade === 'junk' ? 'Junk picked up. Carry it to the shredder.' : `${GRADE_LABELS[grade]} picked up. Carry it to the matching truck.`);
      return true;
    }
    const held = run.held;
    if (held.graded && held.graded !== grade) {
      return mistake(run, `This tie is already ${GRADE_LABELS[held.graded]}. Carry it to its destination or return it to its own pile.`);
    }
    if (held.tie.grade !== grade) {
      const clue = held.tie.grade === 'grade1' ? 'Sound, straight timber with no decay belongs in Grade 1.'
        : held.tie.grade === 'grade2' ? 'Weathering and shallow cracks in solid wood belong in Grade 2.'
          : 'Rot, deep splits, or broken timber belong in Junk.';
      return mistake(run, `Take another look: ${clue} Keep carrying this tie. -10 points.`);
    }
    run.piles[grade].push(held.tie);
    if (!held.graded) { run.graded++; run.score += 25; }
    run.held = null;
    say(run, held.graded ? `Tie returned to the ${GRADE_LABELS[grade]} pile.` : `${GRADE_LABELS[grade]} sorted! +25. Pick it up again to ${grade === 'junk' ? 'feed the shredder' : 'load the truck'}.`);
    return true;
  }

  if (!run.held) { say(run, 'Pick up a graded tie from a pile before unloading here.'); return false; }
  const held = run.held;
  if (!held.graded) {
    say(run, 'Grade this tie into a pile first. Then pick it up and carry it to its destination.');
    return false;
  }
  if (DESTINATIONS[held.graded] !== station.id) {
    return mistake(run, held.graded === 'junk' ? 'Junk goes into the shredder. Keep carrying this tie. -10 points.' : `${GRADE_LABELS[held.graded]} belongs on its matching truck. Keep carrying this tie. -10 points.`);
  }
  run.delivered[held.graded]++;
  run.deliveredIds.push(held.tie.id);
  run.handled++;
  run.score += 75;
  run.held = null;
  say(run, `${held.graded === 'junk' ? 'Shredder loaded' : `${GRADE_LABELS[held.graded]} truck loaded`}! +75. ${run.handled}/${QUOTA} ties handled.`);
  if (run.handled === QUOTA) {
    run.phase = 'won';
    run.target = null;
    say(run, 'Shift complete! Every reusable tie is loaded and all junk is in the shredder.');
  }
  return true;
}

export function tick(run: Run, delta: number) {
  if (!active(run) || !Number.isFinite(delta) || delta <= 0) return;
  const dt = Math.min(delta, remaining(run));
  const target = run.target ? stationFor(run.target) : undefined;
  const advance = (seconds: number) => {
    run.elapsed = Math.min(SHIFT_SECONDS, run.elapsed + seconds);
    run.messageTime = Math.max(0, run.messageTime - seconds);
    while (run.queue.length && run.elapsed >= run.nextArrival) {
      run.incoming.push(run.queue.shift()!);
      run.nextArrival += ARRIVAL_SECONDS;
    }
  };
  // Arrivals happen once, at the moment the beaver reaches the station. An oversized
  // frame cannot turn one click into both a drop and an immediate pickup.
  if (target) {
    const dx = target.x - run.player.x;
    const dz = target.z - run.player.z;
    const d = Math.hypot(dx, dz);
    const travel = Math.max(0, d - REACH * 0.7);
    const step = Math.min(PLAYER_SPEED * dt, travel);
    if (d > 0 && step > 0) {
      run.player.x += dx / d * step;
      run.player.z += dz / d * step;
      run.player.facing = Math.atan2(dx, dz);
    }
    if (step >= travel) {
      advance(travel / PLAYER_SPEED);
      run.target = null;
      interact(run, target.id);
      if (run.phase === 'playing') advance(Math.max(0, dt - travel / PLAYER_SPEED));
    } else advance(dt);
  } else advance(dt);
  if (run.phase === 'playing' && run.elapsed >= SHIFT_SECONDS) {
    run.phase = 'lost';
    run.target = null;
    say(run, `Shift over. You handled ${run.handled}/${QUOTA} ties. Try another shift!`);
  }
  run.revision++;
}
