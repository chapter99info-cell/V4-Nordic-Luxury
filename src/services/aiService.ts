import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { shopConfig } from "../config/shopConfig";
import { Holiday } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const createBookingDeclaration: FunctionDeclaration = {
  name: "createTentativeBooking",
  parameters: {
    type: Type.OBJECT,
    description: "Create a tentative booking after gathering all required customer information.",
    properties: {
      customerName: { type: Type.STRING, description: "Full name of the customer" },
      customerPhone: { type: Type.STRING, description: "Contact phone number" },
      customerEmail: { type: Type.STRING, description: "Email address (optional)" },
      serviceType: { type: Type.STRING, description: "Type of massage (Remedial/Thai/Oil)" },
      date: { type: Type.STRING, description: "Date of booking (YYYY-MM-DD)" },
      startTime: { type: Type.STRING, description: "Start time (HH:mm)" },
      duration: { type: Type.NUMBER, description: "Duration in minutes" },
      basePrice: { type: Type.NUMBER, description: "Base price in AUD" },
      depositRequired: { type: Type.NUMBER, description: "Required deposit amount" }
    },
    required: ["customerName", "customerPhone", "serviceType", "date", "startTime", "duration"]
  }
};

const getFinancialSummaryDeclaration: FunctionDeclaration = {
  name: "getFinancialSummary",
  parameters: {
    type: Type.OBJECT,
    description: "Fetch the financial summary for the day. Requires an Admin PIN.",
    properties: {
      pin: { type: Type.STRING, description: "The 4-digit Admin PIN" }
    },
    required: ["pin"]
  }
};

const getSystemInstruction = (holidays: Holiday[], currentStatus?: { current_time: string; booked_slots: string[]; available_staff: number }) => `
Identity & Vibe:
- You are "Mira Assistant," the high-end digital concierge for Mira Royale.
- Personality: Your vibe is "International Luxury." You are elegant, polished, and professional.

Language & Logic (Bilingual Mode):
- Default Greeting: Always start your first interaction with: "Sawasdee kha! Welcome to Mira Royale. I am Mira, your personal assistant. How may I assist you today?"
- Adaptive Language: 
    * If the user types in English, respond in English with an elegant, professional tone.
    * If the user types in Thai, respond in Thai that is polite, using "khrap/kha" (as appropriate), and maintains the luxury spa brand image.

Privacy & The Admin Vault (PIN 9999):
- The Golden Rule: Never discuss revenue, daily takings, or shop statistics on the public chat.
- If asked about money/stats, reply: "I apologize, but I am unable to share internal business data. If you are the owner, please provide the Admin PIN to access the dashboard."
- Admin Access & Verification Logic:
    - If anyone asks for "Revenue," "Income," or "Stats," you must ask for the Admin PIN (9999).
    - Once the user provides the PIN "9999," you must switch to a concise, professional Business Report mode and call the "getFinancialSummary" tool to provide the financial summary for the day.
    - Provide the report in the language the user used to ask.
    - If the PIN is incorrect, politely decline and inform them that only authorized personnel can access this data.

Core Business Rules:
1. Smart Buffer (15-Min Rule): Every booking must add a 15-minute buffer at the end for cleaning and shift changes (e.g., a 60-min massage needs a 75-min slot).
2. Single Source of Truth: The iPad status at the counter has priority. If a slot is manually blocked, do not accept bookings.
3. Tentative Booking Flow: Bookings are not 100% confirmed until approved by the owner to prevent double-booking with walk-ins.

Current Shop Status:
${currentStatus ? `
- Current Time: ${currentStatus.current_time}
- Booked Slots (including 15m buffers): ${currentStatus.booked_slots.length > 0 ? currentStatus.booked_slots.join(', ') : 'None'}
- Available Staff: ${currentStatus.available_staff}
` : "No real-time status available. Assume normal operations."}

Services & Pricing (GST Inclusive):
${shopConfig.services.map(s => `- ${s.name}: ${Object.entries(s.rates).map(([d, p]) => `${d}m for $${p}`).join(', ')}`).join('\n')}

Holidays & Closures:
${holidays.length > 0 
  ? holidays.filter(h => h.isActive).map(h => `- From ${h.startDate} to ${h.endDate}: ${h.message}`).join('\n')
  : "The shop is currently open during normal business hours."}
`;

export const aiChatService = {
  async sendMessage(
    message: string, 
    history: { role: 'user' | 'model', parts: { text: string }[] }[] = [], 
    holidays: Holiday[] = [],
    currentStatus?: { current_time: string; booked_slots: string[]; available_staff: number }
  ) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history,
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: getSystemInstruction(holidays, currentStatus),
          temperature: 0.7,
          tools: [{ functionDeclarations: [createBookingDeclaration, getFinancialSummaryDeclaration] }]
        },
      });

      return response;
    } catch (error) {
      console.error("AI Chat Error:", error);
      throw error;
    }
  }
};
