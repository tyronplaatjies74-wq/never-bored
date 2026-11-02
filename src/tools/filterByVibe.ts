import activities from "../../data/activities.json";

export function filterByVibe(input: { vibe: string }) {
  const v = input.vibe.toLowerCase();
  const results = activities.filter((a:any) => 
    a.vibe.some((t:string) => t.toLowerCase().includes(v))
  );
  return results.slice(0,5).map((a:any) => ({
    name: a.name,
    town: a.town,
    vibe: a.vibe,
    cost: a.cost,
    booking_url: a.booking_url,
    map: `https://www.google.com/maps/search/?api=1&query=${a.coordinates.lat},${a.coordinates.lng}`
  }));
}