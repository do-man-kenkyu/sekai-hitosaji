import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;

export const INQUIRY_NOTIFY_EMAIL = 'do.man.26.shibaura@gmail.com';

export async function sendInquiryNotification(inquiry: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('EmailJS が未設定のため通知メールは送信されません。.env の VITE_EMAILJS_* を設定してください。');
    return;
  }
  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      from_name: inquiry.name,
      from_email: inquiry.email,
      subject: inquiry.subject,
      message: inquiry.message,
      to_email: INQUIRY_NOTIFY_EMAIL,
    },
    { publicKey: PUBLIC_KEY }
  );
}
