export type BusinessType =
  | "medical"  | "dental"  | "salon"    | "barbershop"
  | "restaurant" | "hotel" | "realestate" | "contractor"
  | "moving"   | "repair"  | "legal"    | "other";

export interface Business {
  id: string;
  user_id: string;
  name: string;
  type: BusinessType;
  phone_number: string;
  vapi_assistant_id: string;
  vapi_phone_number_id: string;
  working_hours_start: string;
  working_hours_end: string;
  working_days: string[];
  ai_name: string;
  ai_greeting: string;
  calendar_provider: "google" | "outlook" | "calendly" | "builtin" | null;
  calendar_connected: boolean;
  meeting_duration: number;
  meeting_types: string[];
  is_active: boolean;
  created_at: string;
}

export interface Call {
  id: string;
  business_id: string;
  caller_number: string;
  caller_name: string | null;
  reason: string | null;
  duration_seconds: number;
  booked_appointment: boolean;
  appointment_id: string | null;
  summary: string | null;
  is_urgent: boolean;
  recording_url: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  business_id: string;
  caller_name: string;
  caller_phone: string;
  date: string;
  time: string;
  type: string;
  status: "confirmed" | "pending" | "cancelled" | "completed" | "no_show";
  notes: string | null;
  reminder_sent: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  business_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan: "growth" | "pro";
  status: "active" | "trialing" | "past_due" | "cancelled";
  current_period_end: string;
  minutes_used: number;
  minutes_limit: number;
}

export type Plan = {
  id: "growth" | "pro";
  name: string;
  price: number;
  minutes: number;
  overage_rate: number;
  features: string[];
  highlight?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "growth",
    name: "Growth",
    price: 99,
    minutes: 250,
    overage_rate: 0.08,
    features: [
      "AI receptionist (Lisa)",
      "Appointment booking",
      "SMS confirmations",
      "Call summaries",
      "Appointment reminders",
      "Missed call text-back",
      "Urgent call alerts",
      "Analytics dashboard",
      "Multi-calendar support",
      "Custom AI name",
    ],
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 199,
    minutes: 600,
    overage_rate: 0.06,
    features: [
      "Everything in Growth",
      "Custom AI voice",
      "Multi-language support",
      "Review collection",
      "No-show follow-up",
      "Call transfer",
      "White label",
      "Priority support",
    ],
  },
];
