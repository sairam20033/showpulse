export type Status = "BOOKING_OPEN" | "NOT_YET_OPEN" | "SOLD_OUT" | "AVAILABLE" | "CHECK_FAILED" | "PENDING";
export interface Show { theatre: string; date: string; time: string; category: string; price: number; status: "AVAILABLE" | "FILLING_FAST" | "SOLD_OUT"; }
export type NotifyMode = "all" | "opening" | "soldout_to_available";
export interface Movie {
  id: string; eventCode: string; title: string; language: string; city: string; url: string;
  status: Status; lastChecked: string | null; shows: Show[]; active: boolean;
  prefs: { mode: NotifyMode; theatres: string[]; times: string[] };
  error?: string;
}
