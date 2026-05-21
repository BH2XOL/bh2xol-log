export function gridToLatLon(grid: string): [number, number] | null {
  if (!grid || grid.length < 4) return null;
  const g = grid.toUpperCase().trim();
  const lon = (g.charCodeAt(0) - 65) * 20 + (g.charCodeAt(2) - 48) * 2 - 180;
  const lat = (g.charCodeAt(1) - 65) * 10 + (g.charCodeAt(3) - 48) - 90;

  let lonOut = lon + 1;
  let latOut = lat + 0.5;

  if (g.length >= 6) {
    lonOut = (g.charCodeAt(0) - 65) * 20 + (g.charCodeAt(2) - 48) * 2 + (g.charCodeAt(4) - 65) / 12 + 1 / 24 - 180;
    latOut = (g.charCodeAt(1) - 65) * 10 + (g.charCodeAt(3) - 48) + (g.charCodeAt(5) - 65) / 24 + 1 / 48 - 90;
  }
  return [latOut, lonOut];
}

export function gridDistance(grid1: string, grid2: string): number | null {
  const c1 = gridToLatLon(grid1);
  const c2 = gridToLatLon(grid2);
  if (!c1 || !c2) return null;

  const [lat1, lon1] = c1;
  const [lat2, lon2] = c2;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}