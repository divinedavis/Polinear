export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    // Use free Nominatim (OpenStreetMap) for reverse geocoding
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'User-Agent': 'Polinear/1.0 (political education app)' } }
    );
    const data = await res.json();
    if (data.address) {
      const a = data.address;
      const parts = [
        a.house_number,
        a.road,
        a.city || a.town || a.village || a.hamlet,
        a.state,
        a.postcode,
      ].filter(Boolean);
      return parts.join(', ') || data.display_name || null;
    }
    return data.display_name || null;
  } catch (err) {
    console.error('Geocoding error:', err);
    return null;
  }
}
