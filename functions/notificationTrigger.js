/**
 * Firebase Cloud Function to trigger FCM notifications when a booking is assigned.
 * 
 * This function listens for changes in the 'bookings' collection.
 * When a booking's status changes to 'confirmed' (assigned) and has a therapistId,
 * it sends a push notification to the assigned therapist.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.onBookingAssigned = functions.firestore
    .document('bookings/{bookingId}')
    .onUpdate(async (change, context) => {
        const newValue = change.after.data();
        const previousValue = change.before.data();

        // Check if status changed to 'confirmed' or therapist was just assigned
        const isNewlyAssigned = 
            (newValue.status === 'confirmed' && previousValue.status !== 'confirmed') ||
            (newValue.therapistId && !previousValue.therapistId);

        if (isNewlyAssigned && newValue.therapistId) {
            const therapistId = newValue.therapistId;
            const bookingId = context.params.bookingId;

            // 1. Fetch the therapist's FCM token from the 'staff' collection
            const staffDoc = await admin.firestore().collection('staff').doc(therapistId).get();
            
            if (!staffDoc.exists) {
                console.log(`No staff found for ID: ${therapistId}`);
                return null;
            }

            const staffData = staffDoc.data();
            const fcmToken = staffData.fcmToken;

            if (!fcmToken) {
                console.log(`No FCM token for staff: ${staffData.name}`);
                return null;
            }

            // 2. Construct the notification message
            const message = {
                notification: {
                    title: 'Your Next Golden Queue is Ready 🌊',
                    body: `Hi ${staffData.name}, you have a ${newValue.serviceName} starting in 15 minutes. See you soon!`,
                },
                data: {
                    bookingId: bookingId,
                    type: 'booking_assigned',
                    click_action: 'FLUTTER_NOTIFICATION_CLICK', // or your web URL
                },
                token: fcmToken,
            };

            // 3. Send the message via FCM
            try {
                const response = await admin.messaging().send(message);
                console.log('Successfully sent message:', response);
                
                // Optional: Log the notification in Firestore for in-app history
                await admin.firestore().collection('notifications').add({
                    userId: therapistId,
                    title: message.notification.title,
                    message: message.notification.body,
                    type: 'booking_assigned',
                    bookingId: bookingId,
                    isRead: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            } catch (error) {
                console.log('Error sending message:', error);
            }
        }
        return null;
    });
