insert into public.email_templates (name, subject, body)
select
  'Payment Received - Thank You',
  'Payment received — thank you!',
  'Hi {{first_name}},

Just confirming that your payment has been received. Thank you so much for choosing JGO Hire and trusting me to be part of your career journey.

I truly appreciate your support, and I would love to help you again anytime you need resume, LinkedIn, interview, or job-search support.

If you had a great experience, I would be so grateful if you left a quick Google review. It helps other job seekers feel confident choosing JGO Hire:
https://www.google.com/maps/place//data=!4m3!3m2!1s0x265dc22602f4a189:0xa4bb9e0dca6ee3fe!12e1?source=g.page.m.np._&laa=nmx-review-solicitation-promoted-recommendation-card

Prefer not to post publicly? Just reply to this email with any feedback or a testimonial. If you are comfortable with it, I can share it anonymously.

Thank you again!'
where not exists (
  select 1 from public.email_templates where name = 'Payment Received - Thank You'
);
