import { createClient } from "@/lib/supabase-server";
import EmailHubClient from "./EmailHubClient";

type Contact = {
  id: number;
  name: string | null;
  email: string | null;
  status: string | null;
  company: string | null;
};

export default async function EmailHubPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("clients")
    .select("id, name, email, status, company")
    .not("email", "is", null)
    .order("name", { ascending: true });

  const contacts = ((data ?? []) as Contact[]).filter(
    (contact) => contact.email?.trim() && contact.name?.trim()
  );

  return <EmailHubClient contacts={contacts} />;
}
