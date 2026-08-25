export function jgoEmailSignature() {
  return `
    <div style="margin-top:34px;padding-top:24px;border-top:1px solid #e7e2da;font-family:Arial,Helvetica,sans-serif;">
      <p style="margin:0;color:#223028;font-size:16px;line-height:1.55;font-weight:700;">Jennifer Gordon</p>
      <p style="margin:2px 0 0;color:#637a5b;font-size:13px;line-height:1.5;">Career Coach + Recruiter | JGO Hire</p>
      <p style="margin:12px 0 0;font-size:13px;line-height:1.7;">
        <a href="https://www.jgohire.com" style="color:#4d6247;text-decoration:none;font-weight:700;">JGO Hire</a>
        <span style="color:#b5bdb6;padding:0 7px;">•</span>
        <a href="https://www.linkedin.com/in/jennifergordon23/" style="color:#4d6247;text-decoration:none;font-weight:700;">LinkedIn</a>
        <span style="color:#b5bdb6;padding:0 7px;">•</span>
        <a href="https://www.instagram.com/jgohired/" style="color:#4d6247;text-decoration:none;font-weight:700;">Instagram</a>
      </p>
      <p style="margin:9px 0 0;color:#8a968d;font-size:11px;line-height:1.5;">jgohire.com</p>
    </div>
  `;
}

export function jgoTextSignature() {
  return [
    "Jennifer Gordon",
    "Career Coach + Recruiter | JGO Hire",
    "jgohire.com",
    "LinkedIn: linkedin.com/in/jennifergordon23",
    "Instagram: @jgohired",
  ].join("\n");
}
