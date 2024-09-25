import { redirect } from "next/navigation";
import React from "react";
import { getServerAuthSession } from "~/server/auth";
import { Dashboard } from "./_dashboard-component";

export default async function DashboardPage() {
  const session = await getServerAuthSession();
  if (!session) redirect("/api/auth/signin");

  return <Dashboard session={session} />;
}
