export const COLORS = ['purple', 'blue', 'orange', 'white', 'green', 'yellow', 'black', 'red'] as const;
export type Color = typeof COLORS[number];
export type Card = Color | 'wild';
export const INK: Record<Card | 'gray', string> = { purple: '#9C6B9B', blue: '#5793BD', orange: '#DE9947', white: '#F3EEE4', green: '#498764', yellow: '#DFCB68', black: '#4B4650', red: '#BD6462', wild: '#CA86B6', gray: '#99979B' };
export const REGIONS = [
  { name: 'North America', lon: -103, lat: 40 }, { name: 'South America', lon: -57, lat: -18 },
  { name: 'Europe', lon: 16, lat: 49 }, { name: 'Asia', lon: 100, lat: 37 },
  { name: 'Africa', lon: 24, lat: -9 }, { name: 'Australia', lon: 135, lat: -27 },
];
export type Station = { id: number; name: string; lon: number; lat: number; region: number; kind: 'depot' | 'bio' | 'cogen' | 'junction' };
// Fictional plant locations in real inland cities. These are game corridors, not a
// claim about existing rail services or ITD facilities in these cities.
const CITIES: [string, number, number][][] = [
  [['Denver', -104.99, 39.74], ['Boise', -116.2, 43.6], ['Omaha', -95.99, 41.26], ['Dallas', -96.8, 32.78], ['Salt Lake', -111.89, 40.76], ['Minneapolis', -93.27, 44.98], ['Oklahoma City', -97.52, 35.47], ['Kansas City', -94.58, 39.1]],
  [['Brasilia', -47.88, -15.79], ['Cuiaba', -56.1, -15.6], ['Belo Horizonte', -43.94, -19.92], ['Curitiba', -49.27, -25.43], ['Goiania', -49.26, -16.68], ['Campo Grande', -54.65, -20.44], ['Ribeirao Preto', -47.81, -21.17], ['Uberlandia', -48.28, -18.91]],
  [['Prague', 14.42, 50.08], ['Paris', 2.35, 48.86], ['Warsaw', 21.01, 52.23], ['Budapest', 19.04, 47.5], ['Frankfurt', 8.68, 50.11], ['Berlin', 13.4, 52.52], ['Vienna', 16.37, 48.21], ['Munich', 11.58, 48.14]],
  [['Lanzhou', 103.83, 36.06], ['Urumqi', 87.62, 43.83], ['Beijing', 116.4, 39.9], ['Chengdu', 104.07, 30.57], ['Xining', 101.78, 36.62], ['Hohhot', 111.75, 40.84], ['Xian', 108.94, 34.34], ['Taiyuan', 112.55, 37.87]],
  [['Lusaka', 28.28, -15.42], ['Lubumbashi', 27.48, -11.66], ['Dodoma', 35.75, -6.17], ['Gaborone', 25.92, -24.65], ['Harare', 31.05, -17.83], ['Lilongwe', 33.79, -13.96], ['Bulawayo', 28.58, -20.15], ['Livingstone', 25.86, -17.85]],
  [['Alice Springs', 133.88, -23.7], ['Kalgoorlie', 121.47, -30.75], ['Toowoomba', 151.95, -27.56], ['Dubbo', 148.6, -32.25], ['Coober Pedy', 134.76, -29.01], ['Mount Isa', 139.49, -20.73], ['Broken Hill', 141.45, -31.95], ['Bourke', 145.94, -30.09]],
];
const KINDS: Station['kind'][] = ['depot', 'bio', 'bio', 'bio', 'cogen', 'cogen', 'cogen', 'junction'];
export const STATIONS: Station[] = CITIES.flatMap((cities, region) => cities.map(([name, lon, lat], i) => ({ id: region * 8 + i, name, lon, lat, region, kind: KINDS[i] })));
export type Route = { id: number; a: number; b: number; length: number; color: Color | 'gray'; region: number };
const LINKS = [[0, 4], [4, 1], [0, 7], [7, 2], [7, 6], [6, 3], [0, 5], [5, 2], [4, 7], [1, 5], [3, 7], [5, 6]];
export const ROUTES: Route[] = REGIONS.flatMap((_, region) => LINKS.map(([a, b], i) => ({ id: region * LINKS.length + i, a: region * 8 + a, b: region * 8 + b, length: [2, 2, 1, 3, 2, 2, 3, 2, 2, 4, 3, 2][i], color: i % 3 === 0 ? 'gray' : COLORS[(i + region * 3) % COLORS.length], region })));
export function routeLabel(route: Route) { return `${STATIONS[route.a].name} / ${STATIONS[route.b].name}`; }
