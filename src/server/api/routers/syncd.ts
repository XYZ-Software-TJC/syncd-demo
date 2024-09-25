import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "~/env";
import { syncdNodeClient } from "~/lib/syncd-server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

function generateRedirectUrl(
  shortLivedToken: string,
  provider: string,
  customRedirectUrl: string,
): string {
  return `${process.env.SYNCD_API_URL}/oauth/v1/connect-external?token=${shortLivedToken}&provider=${provider}&customerRedirectUrl=${encodeURIComponent(
    customRedirectUrl,
  )}`;
}

export const syncdRouter = createTRPCRouter({
  // Connect procedures
  generateConnectUrl: protectedProcedure
    .input(
      z.object({
        provider: z.string(),
        customRedirectUrl: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const shortLivedTokenRes = await syncdNodeClient.api.request.get<{
          token: string;
        }>("/oauth/v1/connect-short-lived", {
          params: {
            projectId: env.SYNCD_PROJECT_ID,
            externalId: ctx.session.user.id,
          },
        });

        const shortLivedToken = shortLivedTokenRes.data.token;
        const redirectUrl = generateRedirectUrl(
          shortLivedToken,
          input.provider,
          input.customRedirectUrl,
        );

        return { redirectUrl };
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error generating connect URL",
        });
      }
    }),

  removeConnection: protectedProcedure
    .input(
      z.object({
        provider: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const response = await syncdNodeClient.api.request.delete<{
          connections: {
            displayName: string;
            accessor: string;
            connectionType: string[];
          }[];
        }>("/v1/users/remove-connection", {
          params: {
            projectId: env.SYNCD_PROJECT_ID,
            externalId: ctx.session.user.id,
            provider: input.provider,
          },
        });

        return response.data;
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error removing connection",
        });
      }
    }),

  getAllAllowedProviders: protectedProcedure
    .input(
      z.object({
        onlyTriggers: z.boolean().optional(),
        onlyActions: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const [supportedProvidersRes, allUsersConnectedAccountsRes] =
          await Promise.all([
            syncdNodeClient.api.request.get<{
              supportedProviders: {
                provider: string;
                about: string;
                hasTriggers: boolean;
                hasActions: boolean;
                displayName: string;
              }[];
            }>(`/v1/projects/allowed-providers/${env.SYNCD_PROJECT_ID}`, {
              params: {
                onlyTriggers: input.onlyTriggers ?? false,
                onlyActions: input.onlyActions ?? false,
              },
            }),
            syncdNodeClient.api.request.get<{
              connections: {
                displayName: string;
                accessor: string;
                connectionType: string[];
              }[];
            }>("/v1/users/all-connections", {
              params: {
                projectId: env.SYNCD_PROJECT_ID,
                externalId: ctx.session.user.id,
              },
            }),
          ]);

        const supportedProviders: {
          supportedProviders: {
            provider: string;
            about: string;
            hasTriggers: boolean;
            hasActions: boolean;
            displayName: string;
          }[];
        } = supportedProvidersRes.data;

        const allUsersConnectedAccounts: {
          connections: {
            displayName: string;
            accessor: string;
            connectionType: string[];
          }[];
        } = allUsersConnectedAccountsRes.data;

        const formattedResponse = supportedProviders.supportedProviders.map(
          (provider) => ({
            ...provider,
            isConnected: allUsersConnectedAccounts.connections.some(
              (connection) =>
                connection?.accessor?.toLowerCase() ===
                provider?.provider?.toLowerCase(),
            ),
          }),
        );

        return formattedResponse;
      } catch (error) {
        console.error(JSON.stringify(error, null, 2));
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error fetching allowed providers",
        });
      }
    }),

  deleteTrigger: protectedProcedure
    .input(
      z.object({
        provider: z.string(),
        callbackId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { provider, callbackId } = input;

      try {
        const res = await syncdNodeClient.api.request.delete<{
          endpointId: string;
          message: string;
        }>("/v1/triggers", {
          params: {
            projectId: env.SYNCD_PROJECT_ID,
            externalId: ctx.session.user.id,
            provider,
            callbackId,
          },
        });

        return res.data;
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error deleting trigger",
        });
      }
    }),

  submitTriggerData: protectedProcedure
    .input(
      z.object({
        provider: z.string(),
        data: z.object({
          triggers: z.array(z.string()).optional(),
        }),
        isEditSubmit: z.boolean(),
        callbackId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { provider, data, isEditSubmit, callbackId } = input;

      try {
        const dataToSubmit = {
          triggers: data.triggers,
          triggerData: {
            ...data,
            callbackUrl: process.env.SYNCD_WEBHOOK_CALLBACK_URL,
          },
        };
        const triggerDataSchema = z.object({
          triggers: z.array(z.string()).optional(),
          triggerData: z.record(z.any()),
        });
        const parsedDataToSubmit = triggerDataSchema.parse(dataToSubmit);
        const formRes = await syncdNodeClient.api.request.post<{
          endpointId: string;
          message: string;
        }>("/v1/triggers", {
          provider,
          externalId: ctx.session.user.id,
          projectId: env.SYNCD_PROJECT_ID,
          triggers: parsedDataToSubmit.triggers ?? [],
          triggerData: parsedDataToSubmit.triggerData,
          isEditSubmit,
          callbackId,
        });

        return formRes.data;
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error submitting trigger data",
        });
      }
    }),

  getPreFilledForm: protectedProcedure
    .input(
      z.object({
        accessor: z.string(),
        callbackId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { accessor, callbackId } = input;

      try {
        const response = await syncdNodeClient.api.request.get<{
          formattedForm: unknown;
        }>("/v1/forms/pre-filled", {
          params: {
            projectId: env.SYNCD_PROJECT_ID,
            externalId: ctx.session.user.id,
            provider: accessor,
            callbackId: callbackId,
          },
        });

        return response.data.formattedForm;
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error fetching pre-filled form",
        });
      }
    }),

  getAllTriggersForUser: protectedProcedure.query(async ({ ctx }) => {
    try {
      const response = await syncdNodeClient.api.request.get<{
        formattedTriggers: { id: string; accessor: string }[];
      }>("/v1/forms/all-user-triggers-by-project", {
        params: {
          projectId: env.SYNCD_PROJECT_ID,
          externalId: ctx.session.user.id,
        },
      });

      return response.data.formattedTriggers;
    } catch (error) {
      console.error(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error fetching all user triggers",
      });
    }
  }),

  generateSingleForm: protectedProcedure
    .input(
      z.object({
        provider: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { provider } = input;

      try {
        const formRes = await syncdNodeClient.api.request.post<{
          formSchema: Record<string, unknown>;
          provider: {
            name: string;
            description: string;
          };
          uiSchema: Record<string, unknown>;
        }>("/v1/forms/generate-single", {
          projectId: env.SYNCD_PROJECT_ID,
          externalId: ctx.session.user.id,
          provider,
        });

        return formRes.data;
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error generating form",
        });
      }
    }),
});
