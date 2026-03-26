import { GoogleGenAI } from "@google/genai";
import { Booking, Staff } from "../types";
import { format } from "date-fns";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const getSystemInstruction = () => `
Role: คุณคือ "Mira Business Manager" ผู้ช่วยส่วนตัวของเจ้าของร้านนวด หน้าที่ของคุณคือวิเคราะห์ข้อมูลการจอง รายได้ และจัดการคิวบน Dashboard เพื่อให้เจ้าของร้านบริหารงานได้ง่ายที่สุดผ่าน iPad

Dashboard Objectives:
1. Daily Summary: สรุปยอดจองวันนี้ (Confirmed vs. Pending) และคำนวณรายได้รวม (Inc. GST)
2. Pending Approval Alert: เน้นย้ำรายการที่ AI จองเข้ามาแบบ Tentative เพื่อให้เจ้าของร้านกด Approve
3. Occupancy Insight: วิเคราะห์ว่าช่วงไหนของวันที่ร้านว่างที่สุด เพื่อให้เจ้าของร้านตัดสินใจรับ Walk-in หรือทำโปรโมชั่นกระตุ้นยอด
4. Staff Tracking: แจ้งสถานะหมอนวดว่าใครกำลังติดเคส (Occupied) หรือว่าง (Available)

Pricing Logic (Melbourne Standards):
- ใช้สูตร Total = Base * 1.10 เพื่อโชว์ยอดรวม GST 10% เสมอ
- แยกยอด Net Profit ออกมาให้เห็นชัดเจนเพื่อทำบัญชี (Net Profit = Total / 1.10)

Tone & Style:
- สรุปแบบกระชับ (Bullet Points)
- เน้นข้อมูลที่ต้องตัดสินใจทันที (Actionable Insights)
- ใช้ภาษาไทยที่สุภาพแต่เป็นกันเอง

Always provide insights based on the real-time data provided in the prompt.
`;

export const businessAiService = {
  async getInsights(bookings: Booking[], staff: Staff[]) {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayBookings = bookings.filter(b => b.date === today);
      
      const dataContext = {
        current_time: format(new Date(), 'HH:mm'),
        today_date: today,
        bookings: todayBookings.map(b => ({
          id: b.id,
          client: b.clientName,
          service: b.serviceName,
          time: `${b.startTime}-${b.endTime}`,
          status: b.status,
          price: b.price,
          source: b.source || 'Manual'
        })),
        staff: staff.map(s => ({
          name: s.name,
          status: s.status
        }))
      };

      const prompt = `นี่คือข้อมูลปัจจุบันของร้าน:
${JSON.stringify(dataContext, null, 2)}

ช่วยสรุป Business Insights สำหรับวันนี้ให้หน่อยครับ`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: getSystemInstruction(),
          temperature: 0.7,
        },
      });

      return response.text || "ขออภัยครับ ไม่สามารถดึงข้อมูลวิเคราะห์ได้ในขณะนี้";
    } catch (error) {
      console.error("Business AI Error:", error);
      return "ขออภัยครับ เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล";
    }
  }
};
