import {bookAttributionUrls} from "@/lib/book-attribution";

export const bookChannels:[string,string][]=[
 ["Instagram Bio","instagram-bio"],["TikTok Bio","tiktok-bio"],["Instagram Story","instagram-story"],
 ["LinkedIn Proposals","linkedin-proposals"],["LinkedIn Posts","linkedin-posts"],["Direct Messages","direct-messages"],
 ["Email Signature","email-signature"],["JGO Hire Website","jgo-hire-website"],["QR / Printed Materials","print-qr"],
 ["General Sharing","general"],["Facebook","facebook"],["Pinterest","pinterest"],
 ["Newsletter","newsletter"],["Career Coaching Clients","coaching-clients"],["Networking Events","networking-events"],
 ["JGO Job Footer","jgo-job-footer"]
];
export function bookTrackingLink(slug:string){
 return "https://jgohire.com/book/"+slug;
}
export function bookDestination(slug:string){
 return bookAttributionUrls[slug]??"https://www.amazon.com/dp/B0HL4GTJ5H";
}
