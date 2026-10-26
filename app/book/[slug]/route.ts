import {NextResponse} from "next/server";
import {bookAttributionUrls} from "@/lib/book-attribution";
const AMAZON="https://www.amazon.com/dp/B0HL4GTJ5H";
export async function GET(_request:Request,{params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const destination=bookAttributionUrls[slug]??AMAZON;
 return NextResponse.redirect(destination,307);
}