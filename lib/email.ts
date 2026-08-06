// @ts-nocheck
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.EMAIL_FROM || 'GlowNaija <hello@glownaija.co.uk>'
const APP    = process.env.NEXT_PUBLIC_APP_URL || 'https://glownaija.co.uk'

// ── Base template ─────────────────────────────────────────────────────────────
function base(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GlowNaija</title></head>
<body style="margin:0;padding:0;background:#FFF9F5;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF9F5;padding:32px 16px">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
 <tr><td style="background:linear-gradient(135deg,#1C1008,#3B1F6B);padding:24px 32px;text-align:center">
  <h1 style="margin:0;font-size:26px;font-weight:900;color:white;letter-spacing:-0.5px">
   <span style="color:#E8607A">GLOW</span>Naija
  </h1>
  <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,.4);letter-spacing:.15em;text-transform:uppercase">The UK's Afro & Caribbean Beauty Platform</p>
 </td></tr>
 <tr><td style="padding:32px">${body}</td></tr>
 <tr><td style="background:#F5EDE5;padding:20px 32px;text-align:center">
  <p style="margin:0;font-size:11px;color:#8C7B6E;line-height:1.6">
   GlowNaija · Nexova Technologies Ltd · London, UK<br>
   <a href="${APP}/privacy" style="color:#E8607A;text-decoration:none">Privacy</a> ·
   <a href="${APP}/terms"   style="color:#E8607A;text-decoration:none">Terms</a> ·
   <a href="mailto:hello@glownaija.co.uk" style="color:#E8607A;text-decoration:none">Contact</a>
  </p>
 </td></tr>
</table>
</td></tr></table>
</body></html>`
}

function btn(text: string, href: string, color = '#E8607A'): string {
  return `<a href="${href}" style="display:inline-block;margin:20px 0;padding:14px 28px;background:${color};color:white;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none">${text}</a>`
}

function h2(text: string): string {
  return `<h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1C1008">${text}</h2>`
}

function p(text: string, small = false): string {
  return `<p style="margin:0 0 14px;font-size:${small?'12':'14'}px;color:${small?'#8C7B6E':'#3D2B1A'};line-height:1.7">${text}</p>`
}

function box(content: string, bg = '#FFF5F7'): string {
  return `<div style="background:${bg};border-radius:12px;padding:18px 20px;margin:16px 0">${content}</div>`
}

function row(label: string, value: string): string {
  return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #E8E0D8;font-size:13px"><span style="color:#8C7B6E">${label}</span><strong style="color:#1C1008">${value}</strong></div>`
}

// ── SEND helper ───────────────────────────────────────────────────────────────
async function send(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[EMAIL — no RESEND_API_KEY] To: ${to} | Subject: ${subject}`)
    return false
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) { console.error('[EMAIL ERROR]', error); return false }
    return true
  } catch (e) {
    console.error('[EMAIL EXCEPTION]', e)
    return false
  }
}

// ── 1. WELCOME EMAIL ─────────────────────────────────────────────────────────
export async function sendWelcomeEmail(opts: {
  email: string; firstName: string; isOwner?: boolean
}) {
  const { email, firstName, isOwner } = opts
  const cta     = isOwner ? `${APP}/business`  : `${APP}/salons`
  const ctaText = isOwner ? 'List My Salon →'  : 'Find a Salon →'
  const steps   = isOwner
    ? ['List your salon — takes 2 minutes','Add your services and prices','Upload photos of your work','Start receiving bookings']
    : ['Find salons near you','Book your appointment instantly','Leave reviews after your visit','Save your favourite salons']

  const html = base(`
    ${h2(`Welcome to GlowNaija, ${firstName}! 🎉`)}
    ${p(isOwner
      ? "You're now set up as a <strong>salon owner</strong>. List your business and start receiving bookings from clients across the UK."
      : "Your account is ready. Find and book the best Nigerian and Afro-Caribbean hair and beauty salons near you."
    )}
    ${box(`
      <p style="font-weight:700;font-size:13px;margin:0 0 10px;color:#1C1008">🚀 Get started:</p>
      <ul style="margin:0;padding-left:20px;font-size:13px;color:#3D2B1A;line-height:2.2">
        ${steps.map(s=>`<li>${s}</li>`).join('')}
      </ul>
    `,'#FFF5F7')}
    ${btn(ctaText, cta)}
    ${p('Questions? Email us at <a href="mailto:hello@glownaija.co.uk" style="color:#E8607A">hello@glownaija.co.uk</a>', true)}
  `)
  return send(email, '🎉 Welcome to GlowNaija!', html)
}

// ── 2. BOOKING CONFIRMATION (to customer) ────────────────────────────────────
export async function sendBookingConfirmation(opts: {
  email: string; firstName: string; reference: string
  salonName: string; salonSlug: string; serviceName: string
  date: string; timeSlot: string; depositAmount: number; depositPaid: boolean
}) {
  const { email, firstName, reference, salonName, salonSlug, serviceName, date, timeSlot, depositAmount, depositPaid } = opts
  const formattedDate = new Date(date).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const depositFmt = `£${(depositAmount/100).toFixed(2)}`

  const html = base(`
    ${h2('Booking Confirmed! 📅')}
    ${p(`Hi ${firstName}, your appointment has been booked. Here are the details:`)}
    ${box(`
      ${row('Salon',    salonName)}
      ${row('Service',  serviceName || 'Appointment')}
      ${row('Date',     formattedDate)}
      ${row('Time',     timeSlot)}
      ${row('Ref',      reference)}
      ${row('Deposit',  depositPaid ? `${depositFmt} ✓ Paid` : `${depositFmt} — pending`)}
    `,'#F0FFF4')}
    ${!depositPaid ? box(`
      <p style="font-weight:700;font-size:13px;margin:0 0 8px;color:#D4AF37">⚠ Pay your deposit to secure this slot</p>
      <p style="font-size:12px;color:#3D2B1A;margin:0">Your booking is reserved for 24 hours. Pay the deposit to confirm.</p>
    `,'#FFFBF0') : ''}
    ${btn('View My Booking', `${APP}/account?tab=bookings`)}
    ${btn('View Salon', `${APP}/salon/${salonSlug}`, '#3D2B1A')}
    ${p(`Need to cancel? You can do so from <a href="${APP}/account?tab=bookings" style="color:#E8607A">My Account</a> up to 24 hours before your appointment.`, true)}
  `)
  return send(email, `📅 Booking Confirmed — ${salonName}`, html)
}

// ── 3. NEW BOOKING ALERT (to salon owner) ────────────────────────────────────
export async function sendNewBookingAlert(opts: {
  ownerEmail: string; salonName: string; customerName: string
  serviceName: string; date: string; timeSlot: string; reference: string
  depositPaid: boolean; depositAmount: number
}) {
  const { ownerEmail, salonName, customerName, serviceName, date, timeSlot, reference, depositPaid, depositAmount } = opts
  const formattedDate = new Date(date).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const depositFmt = `£${(depositAmount/100).toFixed(2)}`

  const html = base(`
    ${h2('New Booking! 🎉')}
    ${p(`You have a new booking at <strong>${salonName}</strong>.`)}
    ${box(`
      ${row('Customer', customerName)}
      ${row('Service',  serviceName || 'Appointment')}
      ${row('Date',     formattedDate)}
      ${row('Time',     timeSlot)}
      ${row('Ref',      reference)}
      ${row('Deposit',  depositPaid ? `${depositFmt} ✓ Paid` : `${depositFmt} — pending`)}
    `,'#F0FFF4')}
    ${btn('View in Dashboard', `${APP}/dashboard?tab=bookings`)}
  `)
  return send(ownerEmail, `📅 New Booking — ${customerName} · ${formattedDate}`, html)
}

// ── 4. BOOKING REMINDER (to customer, 24h before) ────────────────────────────
export async function sendBookingReminder(opts: {
  email: string; firstName: string; salonName: string; salonAddress?: string
  salonPhone?: string; serviceName: string; date: string; timeSlot: string; reference: string
}) {
  const { email, firstName, salonName, salonAddress, salonPhone, serviceName, date, timeSlot, reference } = opts
  const formattedDate = new Date(date).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })

  const html = base(`
    ${h2(`Reminder: You have an appointment tomorrow 📅`)}
    ${p(`Hi ${firstName}, just a reminder about your appointment tomorrow at <strong>${salonName}</strong>.`)}
    ${box(`
      ${row('Service', serviceName || 'Appointment')}
      ${row('Date',    formattedDate)}
      ${row('Time',    timeSlot)}
      ${row('Ref',     reference)}
      ${salonAddress ? row('Address', salonAddress) : ''}
      ${salonPhone   ? row('Phone',   salonPhone)   : ''}
    `,'#F0FFF4')}
    ${p('Please arrive 5 minutes early. If you need to cancel or reschedule, contact the salon as soon as possible.')}
    ${btn('View Booking', `${APP}/account?tab=bookings`)}
    ${salonPhone ? btn(`Call Salon`, `tel:${salonPhone}`, '#3D2B1A') : ''}
  `)
  return send(email, `📅 Reminder: ${salonName} tomorrow at ${timeSlot}`, html)
}

// ── 5. DEPOSIT PAID CONFIRMATION (to customer) ───────────────────────────────
export async function sendDepositPaidConfirmation(opts: {
  email: string; firstName: string; salonName: string
  reference: string; date: string; timeSlot: string; depositAmount: number
}) {
  const { email, firstName, salonName, reference, date, timeSlot, depositAmount } = opts
  const formattedDate = new Date(date).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const depositFmt = `£${(depositAmount/100).toFixed(2)}`

  const html = base(`
    ${h2('Deposit Paid — You\'re Confirmed! ✅')}
    ${p(`Hi ${firstName}, your deposit of <strong>${depositFmt}</strong> has been received. Your slot at <strong>${salonName}</strong> is now fully confirmed.`)}
    ${box(`
      ${row('Salon',   salonName)}
      ${row('Date',    formattedDate)}
      ${row('Time',    timeSlot)}
      ${row('Ref',     reference)}
      ${row('Deposit', `${depositFmt} ✓ Paid`)}
    `,'#F0FFF4')}
    ${btn('View Booking', `${APP}/account?tab=bookings`)}
  `)
  return send(email, `✅ Deposit Paid — ${salonName} confirmed`, html)
}

// ── 6. BOOKING STATUS CHANGE ─────────────────────────────────────────────────
export async function sendBookingStatusUpdate(opts: {
  email: string; firstName: string; salonName: string
  reference: string; date: string; timeSlot: string
  status: 'confirmed' | 'cancelled' | 'no_show'
}) {
  const { email, firstName, salonName, reference, date, timeSlot, status } = opts
  const formattedDate = new Date(date).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  const statusConfig = {
    confirmed: { emoji:'✅', title:'Booking Confirmed!',   msg:`Your booking at <strong>${salonName}</strong> has been confirmed by the salon.`,        color:'#10B981' },
    cancelled: { emoji:'❌', title:'Booking Cancelled',    msg:`Your booking at <strong>${salonName}</strong> has been cancelled. Contact us if this is unexpected.`, color:'#E8607A' },
    no_show:   { emoji:'⚠️', title:'Missed Appointment',  msg:`You missed your appointment at <strong>${salonName}</strong>. Please contact them to rebook.`, color:'#D4AF37' },
  }
  const cfg = statusConfig[status]

  const html = base(`
    ${h2(`${cfg.emoji} ${cfg.title}`)}
    ${p(`Hi ${firstName}, ${cfg.msg}`)}
    ${box(`
      ${row('Salon',  salonName)}
      ${row('Date',   formattedDate)}
      ${row('Time',   timeSlot)}
      ${row('Ref',    reference)}
      ${row('Status', status.replace('_',' ').replace(/^\w/,c=>c.toUpperCase()))}
    `)}
    ${btn('View Booking', `${APP}/account?tab=bookings`, cfg.color)}
    ${status === 'cancelled' ? btn('Find Another Salon', `${APP}/salons`, '#3D2B1A') : ''}
  `)
  return send(email, `${cfg.emoji} Booking ${status.replace('_',' ')} — ${salonName}`, html)
}

// ── 7. ENQUIRY NOTIFICATION (to salon owner) ─────────────────────────────────
export async function sendEnquiryNotification(opts: {
  ownerEmail: string; salonName: string; senderName: string
  senderEmail: string; senderPhone?: string; subject?: string; message: string
}) {
  const { ownerEmail, salonName, senderName, senderEmail, senderPhone, subject, message } = opts

  const html = base(`
    ${h2('New Enquiry 📩')}
    ${p(`You have a new enquiry for <strong>${salonName}</strong>.`)}
    ${box(`
      ${row('From',    senderName)}
      ${row('Email',   `<a href="mailto:${senderEmail}" style="color:#E8607A">${senderEmail}</a>`)}
      ${senderPhone ? row('Phone', `<a href="tel:${senderPhone}" style="color:#E8607A">${senderPhone}</a>`) : ''}
      ${subject ? row('Subject', subject) : ''}
    `)}
    ${box(`<p style="font-size:13px;color:#3D2B1A;margin:0;line-height:1.7;white-space:pre-wrap">${message}</p>`, '#FFF9F5')}
    ${btn(`Reply to ${senderName}`, `mailto:${senderEmail}?subject=Re: ${encodeURIComponent(subject||'Your Enquiry at '+salonName)}`)}
    ${btn('View in Dashboard', `${APP}/dashboard?tab=enquiries`, '#3D2B1A')}
  `)
  return send(ownerEmail, `📩 New Enquiry — ${senderName} · ${salonName}`, html)
}

// ── 8. ORDER CONFIRMATION (to customer) ──────────────────────────────────────
export async function sendOrderConfirmation(opts: {
  email: string; firstName: string; reference: string
  items: { name: string; quantity: number; price: number }[]
  total: number; deliveryCost: number
  address: string; city: string; postcode: string
}) {
  const { email, firstName, reference, items, total, deliveryCost, address, city, postcode } = opts

  const html = base(`
    ${h2('Order Confirmed! 🛍️')}
    ${p(`Hi ${firstName}, thank you for your order. We're processing it now and will update you when it ships.`)}
    ${box(`
      <p style="font-weight:700;font-size:13px;margin:0 0 10px;color:#1C1008">Order ${reference}</p>
      ${items.map(i=>`
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #E8E0D8;font-size:13px">
          <span style="color:#3D2B1A">${i.name} ×${i.quantity}</span>
          <strong style="color:#1C1008">£${((i.price*i.quantity)/100).toFixed(2)}</strong>
        </div>
      `).join('')}
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px">
        <span style="color:#8C7B6E">Delivery</span>
        <span style="color:#3D2B1A">£${(deliveryCost/100).toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:16px;font-weight:900;border-top:2px solid #E8E0D8">
        <span>Total</span><span>£${(total/100).toFixed(2)}</span>
      </div>
    `,'#F0FFF4')}
    ${box(`
      <p style="font-weight:700;font-size:13px;margin:0 0 8px;color:#1C1008">Delivering to:</p>
      <p style="font-size:13px;color:#3D2B1A;margin:0;line-height:1.8">${address}<br>${city}, ${postcode}</p>
    `,'#FFF9F5')}
    ${btn('View Order', `${APP}/order?ref=${reference}`)}
  `)
  return send(email, `🛍️ Order Confirmed — ${reference}`, html)
}

// ── 9. PASSWORD RESET ────────────────────────────────────────────────────────
// Handled natively by Supabase Auth — no custom email needed.
// Supabase sends its own branded reset email via Authentication > Email Templates.
// Customise at: supabase.com → Project → Authentication → Email Templates → Reset Password

// ── 10. NEW REVIEW NOTIFICATION (to salon owner) ─────────────────────────────
export async function sendNewReviewNotification(opts: {
  ownerEmail: string; salonName: string; reviewerName: string
  rating: number; reviewText: string; serviceName?: string
}) {
  const { ownerEmail, salonName, reviewerName, rating, reviewText, serviceName } = opts
  const stars = '★'.repeat(rating) + '☆'.repeat(5-rating)

  const html = base(`
    ${h2('New Review Received! ⭐')}
    ${p(`<strong>${reviewerName}</strong> left a ${rating}-star review for <strong>${salonName}</strong>.`)}
    ${box(`
      <p style="font-size:22px;color:#D4AF37;margin:0 0 8px">${stars}</p>
      ${serviceName ? `<p style="font-size:11px;font-weight:700;color:#E8607A;margin:0 0 8px;text-transform:uppercase">✂️ ${serviceName}</p>` : ''}
      <p style="font-size:14px;color:#3D2B1A;margin:0;line-height:1.7;font-style:italic">"${reviewText}"</p>
      <p style="font-size:12px;color:#8C7B6E;margin:10px 0 0">— ${reviewerName}</p>
    `,'#FFFBF0')}
    ${btn('View All Reviews', `${APP}/dashboard?tab=reviews`)}
  `)
  return send(ownerEmail, `⭐ New ${rating}-Star Review — ${salonName}`, html)
}

// ── 11. SALON WENT LIVE (to owner) ───────────────────────────────────────────
export async function sendSalonLiveEmail(opts: {
  email: string; firstName: string; salonName: string; salonSlug: string; city: string
}) {
  const { email, firstName, salonName, salonSlug, city } = opts
  const listingUrl = `${APP}/salon/${salonSlug}`

  const html = base(`
    ${h2('Your Salon is Live! 🎉')}
    ${p(`Hi ${firstName}, <strong>${salonName}</strong> is now listed on GlowNaija and clients in ${city} can find and book you right now.`)}
    ${box(`
      <p style="font-weight:700;font-size:13px;margin:0 0 10px;color:#1C1008">⚡ Complete your profile to get more bookings:</p>
      <ul style="margin:0;padding-left:20px;font-size:13px;color:#3D2B1A;line-height:2.2">
        <li>📸 Add at least 3 photos of your work</li>
        <li>📋 Add all your services with accurate prices</li>
        <li>🕐 Set your opening hours</li>
        <li>📝 Write a compelling description</li>
        <li>📞 Add your phone number</li>
      </ul>
    `,'#FFF5F7')}
    ${btn('Open Dashboard', `${APP}/dashboard`)}
    ${btn('View My Listing', listingUrl, '#3D2B1A')}
  `)
  return send(email, `🎉 ${salonName} is live on GlowNaija!`, html)
}

// ── 12. EVENT REGISTRATION CONFIRMATION (to attendee) ────────────────────────
export async function sendEventRegistrationConfirmation(opts: {
  email: string; name: string; eventTitle: string; eventEmoji: string
  eventDate: string; timeStart: string; timeEnd: string
  venue: string; city: string; tickets: number; price: number; isFree: boolean
  eventId: string
}) {
  const { email, name, eventTitle, eventEmoji, eventDate, timeStart, timeEnd, venue, city, tickets, price, isFree, eventId } = opts
  const formattedDate = new Date(eventDate).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const ticketWord = tickets === 1 ? 'ticket' : 'tickets'

  const html = base(`
    ${h2(`You're registered! ${eventEmoji}`)}
    ${p(`Hi ${name}, your registration for <strong>${eventTitle}</strong> is confirmed.`)}
    ${box(`
      ${row('Event',   `${eventEmoji} ${eventTitle}`)}
      ${row('Date',    formattedDate)}
      ${row('Time',    `${timeStart.substring(0,5)} – ${timeEnd.substring(0,5)}`)}
      ${row('Venue',   `${venue}, ${city}`)}
      ${row('Tickets', `${tickets} ${ticketWord}`)}
      ${row('Price',   isFree ? '🆓 Free' : `£${(price * tickets / 100).toFixed(2)}`)}
    `,'#F0FFF4')}
    <p style="font-size:13px;color:#3D2B1A;margin:12px 0">Add this to your calendar so you don't miss it! We'll send a reminder the day before.</p>
    ${btn('View Event Details', `${APP}/events/${eventId}`)}
    ${p('Questions about the event? Reply to this email or contact the organiser.', true)}
  `)
  return send(email, `✅ You're registered — ${eventTitle}`, html)
}

// ── 13. NEW REGISTRATION ALERT (to event organiser) ──────────────────────────
export async function sendNewRegistrationAlert(opts: {
  organiserEmail: string; eventTitle: string; attendeeName: string
  attendeeEmail: string; attendeePhone?: string; tickets: number
  totalRegistrations: number; capacity: number; eventId: string
}) {
  const { organiserEmail, eventTitle, attendeeName, attendeeEmail, attendeePhone, tickets, totalRegistrations, capacity, eventId } = opts

  const html = base(`
    ${h2('New Registration! 🎉')}
    ${p(`<strong>${attendeeName}</strong> just registered for <strong>${eventTitle}</strong>.`)}
    ${box(`
      ${row('Attendee',     attendeeName)}
      ${row('Email',        `<a href="mailto:${attendeeEmail}" style="color:#E8607A">${attendeeEmail}</a>`)}
      ${attendeePhone ? row('Phone', `<a href="tel:${attendeePhone}" style="color:#E8607A">${attendeePhone}</a>`) : ''}
      ${row('Tickets',      String(tickets))}
      ${row('Total RSVPs',  `${totalRegistrations} / ${capacity}`)}
      ${row('Spots left',   String(capacity - totalRegistrations))}
    `,'#F0FFF4')}
    ${totalRegistrations >= capacity ? box('<p style="font-weight:700;color:#E8607A;margin:0">⚠ Your event is now fully booked!</p>','#FFF5F7') : ''}
    ${btn('View Event Dashboard', `${APP}/events/${eventId}/dashboard`)}
  `)
  return send(organiserEmail, `🎉 New RSVP — ${attendeeName} · ${eventTitle}`, html)
}

// ── 14. EVENT REMINDER (to attendees, day before) ────────────────────────────
export async function sendEventReminder(opts: {
  email: string; name: string; eventTitle: string; eventEmoji: string
  eventDate: string; timeStart: string; venue: string; city: string
  eventId: string; tickets: number
}) {
  const { email, name, eventTitle, eventEmoji, eventDate, timeStart, venue, city, eventId, tickets } = opts
  const formattedDate = new Date(eventDate).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })

  const html = base(`
    ${h2(`See you tomorrow! ${eventEmoji}`)}
    ${p(`Hi ${name}, just a reminder that <strong>${eventTitle}</strong> is happening tomorrow.`)}
    ${box(`
      ${row('Event', `${eventEmoji} ${eventTitle}`)}
      ${row('Date',  formattedDate)}
      ${row('Time',  timeStart.substring(0,5))}
      ${row('Venue', `${venue}, ${city}`)}
      ${row('Your tickets', String(tickets))}
    `,'#F0FFF4')}
    ${p('Please arrive 10 minutes early to get settled in. We look forward to seeing you!')}
    ${btn('View Event Details', `${APP}/events/${eventId}`)}
  `)
  return send(email, `📅 Tomorrow: ${eventTitle} at ${timeStart.substring(0,5)}`, html)
}

// ── 15. EVENT CREATED — admin notification ────────────────────────────────────
export async function sendEventCreatedAlert(opts: {
  adminEmail: string; organiserName: string; organiserEmail: string
  eventTitle: string; eventDate: string; city: string; eventType: string
  price: number; isFree: boolean; capacity: number; eventId: string
}) {
  const { adminEmail, organiserName, organiserEmail, eventTitle, eventDate, city, eventType, price, isFree, capacity, eventId } = opts
  const formattedDate = new Date(eventDate).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  const html = base(`
    ${h2('New Event Listed 🎉')}
    ${p(`<strong>${organiserName}</strong> has created a new event on GlowNaija.`)}
    ${box(`
      ${row('Event',      eventTitle)}
      ${row('Organiser',  `${organiserName} · <a href="mailto:${organiserEmail}" style="color:#E8607A">${organiserEmail}</a>`)}
      ${row('Date',       formattedDate)}
      ${row('City',       city)}
      ${row('Type',       eventType)}
      ${row('Price',      isFree ? 'Free' : `£${(price/100).toFixed(2)}`)}
      ${row('Capacity',   String(capacity))}
    `)}
    ${btn('Review Event', `${APP}/admin?tab=events`)}
    ${btn('View Public Page', `${APP}/events/${eventId}`, '#3D2B1A')}
  `)
  return send(adminEmail, `🎉 New Event: ${eventTitle} — ${city}`, html)
}
