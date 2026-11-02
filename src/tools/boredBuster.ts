import activities from "../../data/activities.json";

export function boredBuster(input: any = {}) {
  let pool = activities.filter((a:any) => a.instant);
  if (input.location) {
    const q = input.location.toLowerCase();
    const f = pool.filter((a:any) => a.town.toLowerCase().includes(q));
    if (f.length > 0) pool = f;
  }
  const r = pool[Math.floor(Math.random() * pool.length)];
  return {
    message: "You're not bored, you just haven't done this yet:",
    pick: {
      name: r.name,
      town: r.town,
      cost: r.cost,
      booking_url: r.booking_url,
      map: `https://www.google.com/maps/search/?api=1&query=${r.coordinates.lat},${r.coordinates.lng}`
    }
  };
}