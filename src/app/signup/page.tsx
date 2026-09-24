import { SignupForm } from "@/components/signup-form";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  return <SignupForm initialType={type} />;
}
