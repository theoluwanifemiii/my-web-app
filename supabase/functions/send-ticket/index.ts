import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, name, ticketId, qrCode, church, zone, guestName, ticketType, eventDate, eventTime } = await req.json()

    // Using Resend API (recommended - 3,000 free emails/month)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not set')
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #9333ea 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .ticket-box { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border: 2px dashed #9333ea; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 5px; }
          .qr-container { text-align: center; margin: 30px 0; }
          .qr-container img { width: 300px; height: 300px; border: 2px solid #9333ea; border-radius: 10px; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🎉 Your Event E-Ticket</h1>
            <p style="margin: 10px 0 0 0;">Annual Gala Event 2024</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${name}</strong>,</p>
            <p>Thank you for registering! We're excited to see you at the event.</p>
            
            <div class="ticket-box">
              <h2 style="color: #9333ea; margin-top: 0;">Event Details</h2>
              <div class="detail-row">
                <span><strong>📅 Date:</strong></span>
                <span>${eventDate || 'December 31, 2024'}</span>
              </div>
              <div class="detail-row">
                <span><strong>⏰ Time:</strong></span>
                <span>${eventTime || '7:00 PM'}</span>
              </div>
              <div class="detail-row">
                <span><strong>👤 Name:</strong></span>
                <span>${name}</span>
              </div>
              <div class="detail-row">
                <span><strong>⛪ Church:</strong></span>
                <span>${church}</span>
              </div>
              <div class="detail-row">
                <span><strong>📍 Zone:</strong></span>
                <span>${zone}</span>
              </div>
              <div class="detail-row">
                <span><strong>🎫 Ticket Type:</strong></span>
                <span>${ticketType === 'solo' ? 'Solo Ticket' : 'Me + 1 Guest'}</span>
              </div>
              ${guestName ? `
              <div class="detail-row">
                <span><strong>👥 Guest:</strong></span>
                <span>${guestName}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span><strong>🔖 Ticket ID:</strong></span>
                <span style="font-family: monospace; font-size: 11px;">${ticketId}</span>
              </div>
            </div>

            <div class="qr-container">
              <h3 style="color: #9333ea;">Your QR Code</h3>
              <img src="${qrCode}" alt="QR Code" />
              <p style="color: #6b7280; margin-top: 15px;">
                📱 Please show this QR code at the entrance for quick check-in
              </p>
            </div>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <strong>⚠️ Important:</strong> Save this email or take a screenshot of your QR code. You'll need it to enter the event.
            </div>
          </div>

          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>If you have any questions, please contact the event organizers.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Event Registration <onboarding@resend.dev>', // Change this to your verified domain
        to: [to],
        subject: '🎫 Your Event E-Ticket - Annual Gala 2024',
        html: emailHtml
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        emailId: data.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
