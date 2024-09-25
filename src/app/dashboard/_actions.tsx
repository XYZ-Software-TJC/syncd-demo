"use client";

import Image from "next/image";

import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

export function Actions() {
  const { data: allProviders, isLoading: isLoadingAllProviders } =
    api.syncd.getAllAllowedProviders.useQuery({});

  const handleAction = async (provider: string, action: string) => {
    try {
      console.log(`Performing ${action} for ${provider}`);
      toast.success(`${action} for ${provider} initiated`);
    } catch (error) {
      console.error(error);
      toast.error(`Error performing ${action}`, {
        description: "Please try again later.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
        <CardDescription>
          This tab only shows actions (no triggers) that Syncd supports.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingAllProviders ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {allProviders?.map((provider) => (
              <AccordionItem key={provider.provider} value={provider.provider}>
                <AccordionTrigger>
                  <div className="flex items-center">
                    <Image
                      alt={provider.displayName}
                      src={`https://syncdpublic.dev/logos/${provider.provider.toLowerCase()}.svg`}
                      width={24}
                      height={24}
                      className="mr-2"
                    />
                    <span>{provider.displayName}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="ml-6 border-l-2 border-dashed border-gray-300 pl-4">
                    {getProviderActions(provider.provider).map((action) => (
                      <div key={action} className="mb-2 flex items-center">
                        <span className="mr-2 h-2 w-2 rounded-full bg-gray-400"></span>
                        <button
                          className={`text-sm ${
                            provider.isConnected
                              ? "text-blue-600 hover:underline"
                              : "cursor-not-allowed text-gray-400"
                          }`}
                          onClick={() =>
                            provider.isConnected &&
                            handleAction(provider.provider, action)
                          }
                          disabled={!provider.isConnected}
                          title={
                            provider.isConnected
                              ? action
                              : "Connect to enable this action"
                          }
                        >
                          {action}
                        </button>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

function getProviderActions(provider: string): string[] {
  switch (provider) {
    case "github":
      return [
        "Create Issue",
        "List Repos",
        "Create Pull Request",
        "Merge Branch",
      ];
    case "jira":
      return [
        "Create Ticket",
        "Assign Task",
        "Update Status",
        "Generate Report",
      ];
    case "googledrive":
      return ["Upload File", "Create Folder", "Share Document", "List Files"];
    case "notion":
      return ["Create Page", "Update Page", "Delete Page", "List Pages"];
    case "figma":
      return ["Create File", "Update File", "Delete File", "List Files"];
    case "airtable":
      return [
        "Create Record",
        "Update Record",
        "Delete Record",
        "List Records",
      ];
    case "dropbox":
      return ["Download File", "Upload File", "Delete File", "List Files"];
    default:
      return ["Connect"];
  }
}
