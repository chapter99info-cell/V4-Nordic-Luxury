// --- Code.gs V4.2 (ระบบพิมแยกรายบุคคล + ส่งแจ้งเตือนอีเมล) ---

function doGet(e) {
  var action = e.parameter.action;
  
  if (action === "getStatus") {
    return ContentService.createTextOutput(getStoreStatus()).setMimeType(ContentService.MimeType.TEXT);
  }
  
  if (action === "getBookings") {
    var data = getRecentBookings();
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "openStore") {
    setStoreStatus("OPEN");
    return ContentService.createTextOutput("OPEN").setMimeType(ContentService.MimeType.TEXT);
  }

  if (action === "closeStore") {
    setStoreStatus("CLOSED");
    return ContentService.createTextOutput("CLOSED").setMimeType(ContentService.MimeType.TEXT);
  }

  if (action === "showReceipt") {
    var rowNum = e.parameter.row;
    var receiptData = rowNum ? getBookingByRow(rowNum) : getLastBookingForReceipt();
    var template = HtmlService.createTemplateFromFile('Receipt');
    template.data = receiptData;
    return template.evaluate().setTitle('Print Receipt');
  }

  return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('Mira Admin');
}

// 📩 ฟังก์ชันรับจองและส่งอีเมลแจ้งเตือน
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Bookings");
  var data = JSON.parse(e.postData.contents);
  
  // 1. บันทึกลง Google Sheet
  sheet.appendRow([new Date(), data.name, data.phone, data.service, data.note, data.price]);

  // 2. ตั้งค่าการส่งอีเมล
  var adminEmail = "chapter99info@gmail.com"; // <--- อัปเดตเป็นอีเมลของพี่แสนเรียบร้อยค่ะ!
  var subject = "🔔 New Booking: " + data.name + " (" + data.service + ")";
  
  // 3. หน้าตาเนื้อหาอีเมล (HTML)
  var htmlBody = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #D4AF37; border-radius: 15px;">
      <h2 style="color: #4A5D23;">MIRA ROYALE V4 - New Booking</h2>
      <hr style="border: 0; border-top: 1px solid #eee;" />
      <p><strong>Customer:</strong> ${data.name}</p>
      <p><strong>Phone:</strong> ${data.phone}</p>
      <p><strong>Service:</strong> ${data.service}</p>
      <p><strong>Price:</strong> $${data.price}</p>
      <p><strong>Note:</strong> ${data.note || "-"}</p>
      <hr style="border: 0; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #888;">Received at: ${new Date().toLocaleString('en-AU')}</p>
      <a href="https://ais-dev-efmoqpnrtuy6htcibqg2iq-604385540311.asia-east1.run.app/admin" 
         style="display: inline-block; padding: 10px 20px; background-color: #D4AF37; color: black; text-decoration: none; border-radius: 5px; font-weight: bold;">
         Open Admin Dashboard
      </a>
    </div>
  `;

  // 4. สั่งส่งอีเมล
  try {
    MailApp.sendEmail({
      to: adminEmail,
      subject: subject,
      htmlBody: htmlBody
    });
  } catch (err) {
    console.error("Email failed: " + err);
  }

  return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
}

// --- ฟังก์ชันเสริม (เหมือนเดิม) ---
function getStoreStatus() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Config");
  return (sheet) ? sheet.getRange("B1").getValue() : "OPEN";
}

function setStoreStatus(status) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Config");
  if(sheet) sheet.getRange("B1").setValue(status);
}

function getRecentBookings() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Bookings");
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  var startRow = Math.max(2, lastRow - 19);
  var numRows = Math.min(20, lastRow - startRow + 1);
  var values = sheet.getRange(startRow, 1, numRows, 6).getValues();
  var result = values.map((row, index) => {
    row.push(startRow + index); 
    return row;
  });
  return result.reverse();
}

function getBookingByRow(rowNum) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Bookings");
  var data = sheet.getRange(rowNum, 1, 1, 6).getValues()[0];
  return formatReceiptData(data);
}

function getLastBookingForReceipt() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Bookings");
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return {time:'-', name:'-', service:'-', price:0};
  var data = sheet.getRange(lastRow, 1, 1, 6).getValues()[0];
  return formatReceiptData(data);
}

function formatReceiptData(data) {
  return { 
    time: new Date(data[0]).toLocaleString('en-AU', {timeZone:'Australia/Sydney'}), 
    name: data[1], 
    service: data[3], 
    price: parseFloat(data[5]).toFixed(2) 
  };
}
