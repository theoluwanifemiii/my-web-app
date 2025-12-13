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
    // Generate QR code
    const qrData = JSON.stringify({
      id: data.ticketId,
      name: data.name,
      church: data.church,
      zone: data.zone,
    });
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

    // Call Supabase Edge Function instead of Resend directly
    const SUPABASE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_FUNCTION_URL || 'https://zpaoicnlynovnbtndrqj.supabase.co/functions/v1/send-event-ticket';
    
    const response = await fetch(`${SUPABASE_FUNCTION_URL}/send-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: data.to,
        name: data.name,
        ticketId: data.ticketId,
        qrCode: qrCode,
        church: data.church,
        zone: data.zone,
        guestName: data.guestName,
        ticketType: data.ticketType,
        eventDate: 'December 31, 2024',
        eventTime: '7:00 PM'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Email send error:', error);
      return false;
    }

    const result = await response.json();
    console.log('Email sent:', result);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}