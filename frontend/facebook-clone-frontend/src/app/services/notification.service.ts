import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';
import { credentials } from '../config/credentials';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly EMAILJS_SERVICE_ID = credentials.emailjs.serviceId;
  private readonly EMAILJS_TEMPLATE_ID = credentials.emailjs.templateId;
  private readonly EMAILJS_PUBLIC_KEY = credentials.emailjs.publicKey;

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
    const url = `https://api.twilio.com/2010-04-01/Accounts/${credentials.twilio.accountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: userPhone,
      From: credentials.twilio.phoneNumber,
      Body: `Salut ${userName}, contul tău a fost blocat. Motiv: ${banReason}`
    });

    const headers = new Headers();
    headers.append('Authorization', 'Basic ' + btoa(`${credentials.twilio.accountSid}:${credentials.twilio.authToken}`));
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