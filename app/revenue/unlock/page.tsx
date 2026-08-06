import RevenueUnlockForm from "@/components/RevenueUnlockForm";

type RevenueUnlockPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function RevenueUnlockPage({
  searchParams,
}: RevenueUnlockPageProps) {
  const params = await searchParams;

  return <RevenueUnlockForm error={params.error} />;
}