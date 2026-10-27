export function jgoJobLaunchHtml() {
 const p=(text:string)=>`<p style="margin:0 0 17px;line-height:1.75;color:#354339;">${text}</p>`;
 const feature=(title:string,detail:string)=>`<tr><td style="padding:0 0 10px"><div style="background:#f7faf5;border:1px solid #dfe8da;border-radius:14px;padding:17px 20px"><div style="font-weight:700;font-size:15px;color:#304b34;margin-bottom:5px">${title}</div><div style="font-size:13px;line-height:1.7;color:#5b6b5e">${detail}</div></div></td></tr>`;
 return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#354339">
 ${p("Hi {{first_name}},")}
 ${p("Be honest. How many jobs have you applied to that you barely remember applying for?")}
 ${p("How many recruiters have you meant to follow up with? How many times have you stared at a blank message wondering what to say?")}
 <div style="margin:25px 0;padding:22px;background:#f1f6ee;border-left:4px solid #647d5b;border-radius:0 12px 12px 0;color:#304b34;font-size:20px;line-height:1.45;font-weight:700">Job searching is hard enough. Staying organized shouldn't be.</div>
 ${p("So I built something I wish every job seeker had.")}
 <div style="margin:28px 0 15px"><div style="font-size:11px;letter-spacing:2px;font-weight:700;color:#758a71">INTRODUCING</div><div style="font-size:32px;line-height:1.35;font-weight:800;color:#304b34">JGO Job.</div><div style="font-size:15px;line-height:1.7;color:#596b5a;margin-top:6px">Your applications, contacts, interviews, follow-ups, and next steps. Finally, all in one place.</div></div>
 <div style="font-weight:700;color:#304b34;font-size:17px;margin:28px 0 15px">Here's what you can do with it.</div>
 <table role="presentation" style="width:100%;border-collapse:collapse" cellpadding="0" cellspacing="0">
 ${feature("Track every opportunity","Save jobs, see where you stand, and stay on top of interviews and follow-ups. The core tracker is free.")}
 ${feature("150+ ready-to-use message templates","Stop starting from scratch. Get messages for recruiters, referrals, follow-ups, networking, and offer negotiations with JGO Job+.")}
 ${feature("Interview prep that actually helps","Organize your preparation and walk into your next conversation knowing what to focus on with JGO Job+.")}
 </table>
 <div style="text-align:center;margin:25px 0 30px"><a href="https://jgojob.com/?utm_source=jgo_os_email&amp;utm_medium=email&amp;utm_campaign=jgo_job_launch" style="display:inline-block;border-radius:999px;background:#526e4e;padding:16px 30px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none">Explore JGO Job →</a><div style="margin-top:12px;color:#748474;font-size:12px">Start free. Upgrade only if you want more.</div></div>
 ${p("I've spent years on the recruiting side of the table. I know how much goes into landing a job, and how easy it is for good opportunities to get lost in the chaos.")}
 ${p("You still have to put in the work. But you shouldn't have to do it all from scratch.")}
 ${p("Give it a try. I think you're going to wonder how you managed without it.")}
 </div>`;
}
