import { type NextRequest } from "next/server";
import { env } from "~/env";
import { syncdNodeClient } from "~/lib/syncd-server";
import { getServerAuthSession } from "~/server/auth";

export async function POST(req: NextRequest) {
  const session = await getServerAuthSession();

  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const { mergedParams }: { mergedParams: Record<string, unknown> } =
    (await req.json()) as {
      mergedParams: Record<string, unknown>;
      projectId: string;
    };

  const pathToUse = mergedParams.path;
  delete mergedParams.path;

  const res = await syncdNodeClient.api.request.get(pathToUse as string, {
    params: {
      ...mergedParams,
      externalId: session.user.id,
      projectId: env.SYNCD_PROJECT_ID,
    },
  });

  return new Response(JSON.stringify(res.data), { status: 200 });
}
