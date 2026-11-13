import type { Movie } from "../types";
// SAMPLE DATA ONLY. Replaced by real checks in Phases 3-6.
const ago = (m: number) => new Date(Date.now() - m * 60000).toISOString();
export const sampleMovies: Movie[] = [
  {
    id: "1", eventCode: "ET00506990", title: "ENE Repeat", language: "Telugu", city: "Hyderabad",
    url: "https://in.bookmyshow.com/movies/hyderabad/ene-repeat-telugu/ET00506990",
    status: "BOOKING_OPEN", lastChecked: ago(12), active: true,
    prefs: { mode: "all", theatres: [], times: [] },
    shows: [
      { theatre: "PVR Hyderabad", date: "2026-11-14", time: "07:30 PM", category: "Gold", price: 250, status: "AVAILABLE" },
      { theatre: "PVR Hyderabad", date: "2026-11-14", time: "10:15 PM", category: "Gold", price: 250, status: "FILLING_FAST" },
      { theatre: "Prasads Multiplex", date: "2026-11-14", time: "06:45 PM", category: "Premium", price: 320, status: "SOLD_OUT" },
      { theatre: "AMB Cinemas", date: "2026-11-15", time: "01:00 PM", category: "Recliner", price: 450, status: "AVAILABLE" },
    ],
  },
  {
    id: "2", eventCode: "ET00524518", title: "Godzilla Minus Zero", language: "Japanese", city: "Hyderabad",
    url: "https://in.bookmyshow.com/movies/hyderabad/godzilla-minus-zero-japanese/ET00524518",
    status: "NOT_YET_OPEN", lastChecked: ago(12), active: true,
    prefs: { mode: "opening", theatres: [], times: [] }, shows: [],
  },
];
