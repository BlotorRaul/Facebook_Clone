import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly EMAILJS_SERVICE_ID = 'service_989eh74';
  private readonly EMAILJS_TEMPLATE_ID = 'template_ea01z96';
  private readonly EMAILJS_PUBLIC_KEY = 'IidnTwp8ueXolKUga';

  constructor() {
    emailjs.init(this.EMAILJS_PUBLIC_KEY);
  }

  async sendBanEmail(username: string, userEmail: string, banReason: string = 'Încălcare reguli'): Promise<void> {
    const templateParams = {
      email: userEmail,
      username: username,
      ban_reason: banReason
    };
    console.log('[EmailJS] Trimit email de ban cu:', templateParams);
    try {
      const response = await emailjs.send(
        this.EMAILJS_SERVICE_ID,
        this.EMAILJS_TEMPLATE_ID,
        templateParams
      );
      console.log('[EmailJS] Email trimis cu succes către:', userEmail, response);
    } catch (error) {
      console.error('[EmailJS] Eroare la trimiterea email-ului:', error);
      throw error;
    }
  }

  async notifyUserBlocked(userEmail: string, userName: string): Promise<void> {
    const subject = 'Contul tău a fost blocat';
    const message = `
      Bună ${userName},

      Contul tău a fost blocat din cauza încălcării termenilor și condițiilor platformei.
      
      Dacă consideri că această acțiune a fost făcută din greșeală, te rugăm să contactezi administratorul.

      Cu stimă,
      Echipa Facebook Clone
    `;

    await this.sendBanEmail(userName, userEmail, message);
  }

  async sendBanSMS(userPhone: string, userName: string, banReason: string = 'Încălcare reguli'): Promise<void> {
    // TODO: Replace these with actual credentials in production
    const twilioAccountSid = 'YOUR_TWILIO_ACCOUNT_SID';
    const twilioAuthToken = 'YOUR_TWILIO_AUTH_TOKEN';
    const twilioPhoneNumber = 'YOUR_TWILIO_PHONE_NUMBER';

    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: userPhone,
      From: twilioPhoneNumber,
      Body: `Salut ${userName}, contul tău a fost blocat. Motiv: ${banReason}`
    });

    const headers = new Headers();
    headers.append('Authorization', 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`));
    headers.append('Content-Type', 'application/x-www-form-urlencoded');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body.toString()
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`[Twilio] Eroare la trimiterea SMS-ului: ${errorText}`);
      }
      const data = await response.json();
      console.log('[Twilio] SMS trimis cu succes:', data.sid);
    } catch (error) {
      console.error('[Twilio] Eroare la trimiterea SMS-ului:', error);
      throw error;
    }
  }
} 