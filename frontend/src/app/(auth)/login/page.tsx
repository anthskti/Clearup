import LoginForm from "./LoginForm";

type Props = {
  searchParams: Promise<{ error?: string | string[]; error_description?: string | string[] }>;
};

function firstValue(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const oauthError = `${firstValue(params.error)} ${firstValue(params.error_description)}`;
  return <LoginForm oauthRestriction={/ban|suspend|restrict/i.test(oauthError)} />;
}
