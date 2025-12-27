export interface QRData {
  id: string;
  name: string;
  ticketType: 'solo' | 'guest' | 'group';
  guestName?: string;
}

export function generateQRCode(data: QRData): string {
  const qrData = JSON.stringify(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
}
