interface EmailData {
  to: string;
  name: string;
  ticketId: string;
  church: string;
  zone: string;
  ticketType: string;
  guestName?: string;
}

export async function sendTicketEmail(data: EmailData): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Event Registration <onboarding@resend.dev>',
        to: [data.to],
        subject: '🎫 Your Event Registration Confirmation',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #9333ea 0%, #3b82f6 100%); color: white; padding: 40px 20px; text-align: center; }
              .content { padding: 30px; }
              .ticket-box { background: #f9fafb; border: 2px dashed #9333ea; border-radius: 12px; padding: 20px; margin: 20px 0; }
              .detail-row { display: flex; justify-content: space-between; padding: 12px; margin: 8px 0; background: white; border-radius: 8px; }
              .button { display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #3b82f6 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">🎉 Registration Confirmed!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Annual Gala Event 2024</p>
              </div>
              
              <div class="content">
                <p style="font-size: 16px;">Dear <strong>${data.name}</strong>,</p>
                <p>Thank you for registering! We're excited to have you join us.</p>
                
                <div class="ticket-box">
                  <h2 style="color: #9333ea; margin-top: 0; font-size: 20px;">Your Ticket Details</h2>
                  
                  <div class="detail-row">
                    <span><strong>👤 Name:</strong></span>
                    <span>${data.name}</span>
                  </div>
                  
                  <div class="detail-row">
                    <span><strong>⛪ Church:</strong></span>
                    <span>${data.church}</span>
                  </div>
                  
                  <div class="detail-row">
                    <span><strong>📍 Zone:</strong></span>
                    <span>${data.zone}</span>
                  </div>
                  
                  <div class="detail-row">
                    <span><strong>🎫 Ticket Type:</strong></span>
                    <span>${data.ticketType === 'solo' ? 'Solo Ticket' : 'Me + 1 Guest'}</span>
                  </div>
                  
                  ${data.guestName ? `
                  <div class="detail-row">
                    <span><strong>👥 Guest:</strong></span>
                    <span>${data.guestName}</span>
                  </div>
                  ` : ''}
                  
                  <div class="detail-row">
                    <span><strong>🔖 Ticket ID:</strong></span>
                    <span style="font-family: monospace; font-size: 12px;">${data.ticketId}</span>
                  </div>
                </div>

                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <strong>📅 Event Date:</strong> December 31, 2024<br>
                  <strong>⏰ Time:</strong> 7:00 PM<br>
                  <strong>📍 Location:</strong> Main Event Hall
                </div>

                <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 8px;">
                  <strong>💡 What to bring:</strong><br>
                  • This confirmation email (print or save on phone)<br>
                  • Valid ID<br>
                  • Your ticket ID: <code style="background: white; padding: 2px 6px; border-radius: 4px;">${data.ticketId}</code>
                </div>
              </div>

              <div class="footer">
                <p>See you at the event! 🎊</p>
                <p style="margin-top: 20px; color: #9ca3af;">
                  Questions? Contact us at events@example.com
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}