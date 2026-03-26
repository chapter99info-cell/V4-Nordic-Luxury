/// <reference types="vite/client" />
/**
 * Notification Service
 * Handles sending emails via EmailJS or other services.
 */

// Note: You need to sign up at https://www.emailjs.com/ and get your Service ID, Template ID, and Public Key.
// Then add them to your .env file as:
// VITE_EMAILJS_SERVICE_ID=your_service_id
// VITE_EMAILJS_TEMPLATE_ID=your_template_id
// VITE_EMAILJS_PUBLIC_KEY=your_public_key

import emailjs from '@emailjs/browser';
import { shopConfig } from '../config/shopConfig';

export const sendAdminPaymentNotification = async (bookingData: any) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn('EmailJS credentials not found. Skipping email notification.');
    return;
  }

  const templateParams = {
    to_name: 'Admin',
    from_name: bookingData.clientName,
    message: `A new payment slip has been uploaded for booking: ${bookingData.serviceName} on ${bookingData.date} at ${bookingData.startTime}.`,
    client_email: bookingData.clientEmail,
    booking_id: bookingData.id,
    slip_url: bookingData.paymentSlipUrl
  };

  try {
    await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log('Admin notification email sent successfully');
  } catch (error) {
    console.error('Error sending admin notification email:', error);
  }
};

export const sendClientConfirmationEmail = async (bookingData: any) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_CLIENT_TEMPLATE_ID; // Different template for clients
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn('EmailJS credentials for client email not found. Skipping.');
    return;
  }

  const templateParams = {
    client_name: bookingData.clientName,
    client_email: bookingData.clientEmail,
    service_name: bookingData.serviceName,
    booking_date: bookingData.date,
    booking_time: bookingData.startTime,
    therapist_name: bookingData.therapistName || 'Any Staff',
    shop_name: shopConfig.name,
    shop_address: shopConfig.address,
    shop_phone: shopConfig.phone,
    website_link: shopConfig.websiteUrl,
    instagram_link: shopConfig.instagramUrl,
    facebook_link: shopConfig.facebookUrl,
    price: bookingData.price
  };

  try {
    await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log('Client confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending client confirmation email:', error);
  }
};

export const sendLineNotification = async (message: string, to?: string) => {
  const channelAccessToken = shopConfig.lineChannelAccessToken;
  const adminUserId = to || shopConfig.lineAdminUserId;

  if (!channelAccessToken || !adminUserId || channelAccessToken.includes('YOUR_')) {
    console.warn('LINE Messaging API credentials not configured. Skipping notification.');
    return;
  }

  try {
    const response = await fetch('/api/line/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channelAccessToken,
        to: adminUserId,
        message
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send LINE notification');
    }

    console.log('LINE notification sent successfully');
  } catch (error) {
    console.error('Error sending LINE notification:', error);
  }
};
