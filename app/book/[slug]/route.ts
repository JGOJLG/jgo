import {NextRequest,NextResponse} from "next/server";
const AMAZON="https://www.amazon.com/dp/B0HL4GTJ5H";
export async function GET(request:NextRequest,{params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;
 const url=new URL(AMAZON);
 url.searchParams.set("utm_source","jgo-os");
 url.searchParams.set("utm_medium","book-promotion");
 url.searchParams.set("utm_campaign","found-noticed-hired");
 url.searchParams.set("utm_content",slug);
 return NextResponse.redirect(url,307);
}