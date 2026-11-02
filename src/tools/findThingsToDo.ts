import activities from "../../data/activities.json";

export function findThingsToDo(input: any) {
  let results = [...activities];
  if (input.location) {
    const q = input.location.toLowerCase();
    results = results.filter(a => a.town.toLowerCase().includes(q));
  }
  if (input.vibe) {
    const v = input.vibe.toLowerCase();
    results = results.filter(a => a.vibe.some((t: string) => t.includes(v)));
  }
  if (input.instant) {
    results = results.filter(a => a.instant);
  }
  return results.slice(0,5).map(a => ({
    name: a.name,
    town: a.town,
    cost: a.cost,
    booking_url: a.booking_url,
    map: `https://www.google.com/maps/search/?api=1&query=${a.coordinates.lat},${a.coordinates.lng}`
  }));
}