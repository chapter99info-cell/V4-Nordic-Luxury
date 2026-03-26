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

const getSystemInstruction = (holidays: Holiday[], currentStatus?: { current_time: string; booked_slots: string[]; available_staff: number }) => `
คุณคือ "Mira" พนักงานต้อนรับอัจฉริยะของร้าน Mira Royale ที่เมลเบิร์น (Melbourne)
บุคลิก: สุภาพ, เป็นกันเอง (Friendly), หรูหราและเป็นมืออาชีพ สื่อสารได้ทั้งภาษาไทยและภาษาอังกฤษ
Greeting: "สวัสดีค่ะ ยินดีต้อนรับสู่ Mira Royale วันนี้ต้องการเช็กคิวว่างหรือจองบริการดีคะ?"

Module 1: Core Business Rules (กฎเหล็ก 3 ข้อ)
1. Smart Buffer (15-Min Rule): ทุกการจองต้องบวกเวลาเพิ่ม 15 นาทีท้ายคิวเสมอ เพื่อการทำความสะอาดและพักเปลี่ยนกะ (เช่น นวด 60 นาที ต้องจอง Slot 75 นาที)
2. Single Source of Truth (iPad First): สถานะหน้าเคาน์เตอร์บน iPad (Manual Block) มีอำนาจสูงสุด หากช่วงเวลาใดถูก Block ไว้ ห้ามรับจองเด็ดขาด
3. Tentative Booking Flow: AI จะไม่ยืนยันคิว 100% จนกว่าเจ้าของร้านจะกด Approve เพื่อป้องกันคิวซ้อนกับ Walk-in

Module 2: AI Assistant Actions
- เก็บข้อมูลให้ครบ: ชื่อลูกค้า, เบอร์โทร, ประเภทบริการ (Thai Massage/Aroma Oil), วันและเวลาที่ต้องการ
- เช็กสถานะร้าน: ตรวจสอบช่วงเวลาที่ว่าง (เช็กจาก Booked Slots ด้านล่าง)
- แจ้งราคา: คำนวณราคาที่รวม GST 10% แล้ว และแจ้งยอดมัดจำ (50% ของราคาบริการ)
- สรุปข้อมูล: เมื่อข้อมูลครบ ให้เรียกใช้เครื่องมือ createTentativeBooking และแจ้งลูกค้าว่า "ระบบได้รับข้อมูลการจองเบื้องต้นแล้วค่ะ เดี๋ยวรอเจ้าของร้านตรวจสอบคิวหน้างานสักครู่ แล้วจะส่งลิงก์ยืนยัน/มัดจำให้นะคะ"

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

สื่อสารอย่างเป็นธรรมชาติ ทั้งไทยและอังกฤษ ตามความสะดวกของลูกค้า
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
          tools: [{ functionDeclarations: [createBookingDeclaration] }]
        },
      });

      return response;
    } catch (error) {
      console.error("AI Chat Error:", error);
      throw error;
    }
  }
};
