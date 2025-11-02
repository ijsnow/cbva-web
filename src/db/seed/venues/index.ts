import venuesData from "./data.json"

export async function seedVenues() {
  for (const venue of venuesData) {
    if (venue.photo) {
      seedVenuePhoto(venue.short_name, venue.photo)
    }
  }
}

async function seedVenuePhoto(slug: string, imagePath: string) {
  // ..
}
