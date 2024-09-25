"use client";

import Image from "next/image";

import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

const CARD_HEIGHT = 300;
const REDIRECT_URL = "http://localhost:3000/dashboard";
export function Connectors() {
  // Query Client
  const queryClient = api.useUtils();

  // Queries
  const { data: allProviders, isLoading: isLoadingAllProviders } =
    api.syncd.getAllAllowedProviders.useQuery({});

  // Mutations
  const { mutateAsync: generateConnectUrl } =
    api.syncd.generateConnectUrl.useMutation();
  const { mutateAsync: removeConnection, isPending: isRemovingConnection } =
    api.syncd.removeConnection.useMutation();

  // Functions
  const handleConnect = async (provider: string) => {
    try {
      const { redirectUrl } = await generateConnectUrl({
        provider,
        customRedirectUrl: REDIRECT_URL,
      });

      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (error) {
      console.error(error);
      toast.error("Error connecting to provider", {
        description: "Please refresh the page and try again.",
      });
    }
  };

  const handleDisconnect = async (provider: string) => {
    try {
      const promise = () => removeConnection({ provider });

      toast.promise(promise, {
        loading: "Disconnecting...",
        success: async () => {
          await queryClient.syncd.getAllAllowedProviders.invalidate();
          return "Disconnected";
        },
        error: "Error disconnecting",
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connectors</CardTitle>
        <CardDescription>
          You can connect and disconnect providers with a couple lines of code.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoadingAllProviders
            ? Array.from({ length: 6 }).map((_, index) => (
                <Card
                  key={index}
                  style={{ height: CARD_HEIGHT }}
                  className="flex w-full flex-col justify-between rounded-lg border border-gray-200 shadow-none"
                >
                  <CardHeader className="flex items-start gap-4">
                    <Skeleton className="h-[60px] w-[60px] rounded-md" />
                    <div className="flex-1">
                      <Skeleton className="mb-2 h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <div className="mt-4 flex items-center gap-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 border-t pt-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))
            : allProviders?.map((provider) => (
                <Card
                  key={provider.provider}
                  style={{ height: CARD_HEIGHT }}
                  className="flex w-full cursor-default flex-col justify-between rounded-lg border border-gray-200 shadow-none transition-all duration-200 hover:border-primary/20"
                >
                  <CardHeader className="flex items-start gap-4">
                    <Image
                      alt={provider.displayName}
                      src={`https://syncdpublic.dev/logos/${provider.provider.toLowerCase()}.svg`}
                      width={40}
                      height={40}
                      className="min-h-[60px] rounded-md"
                    />
                    <div className="flex-1">
                      <CardTitle className="text-md font-semibold text-gray-900">
                        {provider.displayName}
                      </CardTitle>
                      <CardDescription>
                        <span className="text-sm text-gray-500">
                          {provider.about}
                        </span>
                      </CardDescription>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500">
                          SDK Supported:
                        </span>
                        {provider.hasTriggers && (
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            Triggers
                          </span>
                        )}
                        {provider.hasActions && (
                          <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-700/10">
                            Actions
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 border-t pt-4">
                      <Button
                        variant="secondary"
                        className={
                          provider.isConnected
                            ? "w-full bg-green-600 text-white hover:bg-green-600"
                            : "w-full"
                        }
                        onClick={() => handleConnect(provider.provider)}
                        disabled={provider.isConnected}
                      >
                        {provider.isConnected ? "Connected" : "Connect"}
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full"
                        disabled={!provider.isConnected || isRemovingConnection}
                        onClick={() => handleDisconnect(provider.provider)}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </CardContent>
    </Card>
  );
}
