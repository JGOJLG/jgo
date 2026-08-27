function socialIcon(label: string, href: string, iconSlug: string) {
  return `<td style="padding:0 8px 0 0;vertical-align:middle;">
    <a href="${href}" target="_blank" aria-label="${label}" style="display:inline-block;width:34px;height:34px;border-radius:50%;background:#e7eee3;text-decoration:none;text-align:center;line-height:34px;">
      <img src="https://cdn.simpleicons.org/${iconSlug}/52684b" width="18" height="18" alt="${label}" style="display:inline-block;width:18px;height:18px;margin:8px;border:0;outline:none;text-decoration:none;vertical-align:middle;" />
    </a>
  </td>`;
}

function linkedInIcon() {
  return `<td style="padding:0 8px 0 0;vertical-align:middle;">
    <a href="https://www.linkedin.com/company/jgohire/posts/?feedView=all" target="_blank" aria-label="LinkedIn" style="display:inline-block;width:34px;height:34px;border-radius:50%;background:#e7eee3;text-decoration:none;text-align:center;line-height:34px;">
      <span style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:34px;font-weight:800;color:#52684b;letter-spacing:-1px;">in</span>
    </a>
  </td>`;
}

export function jgoEmailSignature() {
  return `
    <div style="margin-top:34px;padding-top:22px;border-top:1px solid #e7ebe4;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
        <tr><td style="vertical-align:top;padding:0;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.25;font-weight:700;color:#243128;">Jennifer Gordon</div>
          <div style="margin-top:4px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#667268;">Certified Career Coach + Recruiter</div>
          <div style="margin-top:2px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#667268;">JGO Hire</div>
          <div style="margin-top:7px;"><a href="https://www.jgohire.com" target="_blank" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#52684b;text-decoration:none;">jgohire.com</a></div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;border-collapse:collapse;"><tr>
            ${socialIcon("Instagram", "https://www.instagram.com/jgohired", "instagram")}
            ${socialIcon("TikTok", "https://www.tiktok.com/@jgohired", "tiktok")}
            ${socialIcon("Facebook", "https://www.facebook.com/jgohired", "facebook")}
            ${socialIcon("YouTube", "https://www.youtube.com/@jgohired", "youtube")}
            ${socialIcon("Substack", "https://substack.com/@jgohired?utm_source=user-menu", "substack")}
            ${linkedInIcon()}
          </tr></table>
        </td></tr>
      </table>
    </div>`;
}

export function jgoTextSignature() {
  return [
    "Jennifer Gordon",
    "Certified Career Coach + Recruiter",
    "JGO Hire",
    "jgohire.com",
    "Instagram: @jgohired",
    "TikTok: @jgohired",
    "Facebook: @jgohired",
    "YouTube: @jgohired",
    "Substack: @jgohired",
    "LinkedIn: linkedin.com/company/jgohire",
  ].join("\n");
}
