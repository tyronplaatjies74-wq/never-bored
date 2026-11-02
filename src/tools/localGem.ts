import activities from "../../data/activities.json";

export function localGem(input: { town?: string } = {}) {
  const hidden = activities.filter((a:any) => 
    a.vibe.includes("local") || a.cost.includes("Free") || a.vibe.includes("chill")
  );
  let pool = hidden.length > 0 ? hidden : activities;
  if (input.town) {
    const q = input.town.toLowerCase();
    const f = pool.filter((a:any) => a.town.toLowerCase().includes(q));
    if (f.length > 0) pool = f;
  }
  const r = pool[Math.floor(Math.random() * pool.length)];
  return {
    message: "Local gem most tourists miss:",
    gem: {
      name: r.name,
      town: r.town,
      cost: r.cost,
      booking_url: r.booking_url,
      map: `https://www.google.com/maps/search/?api=1&query=${r.coordinates.lat},${r.coordinates.lng}`
    }
  };
}