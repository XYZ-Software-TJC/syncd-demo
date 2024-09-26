"use client";

import Image from "next/image";

import { Loader2 } from "lucide-react"; // Add this import
import { useState } from "react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

export function Actions() {
  const { data: allProviders, isLoading: isLoadingAllProviders } =
    api.syncd.getAllAllowedProviders.useQuery({});

  const { mutate: executeAction, isPending: isExecutingAction } =
    api.syncd.executeAction.useMutation({
      onSuccess: (data) => {
        setApiData(data);
      },
      onError: (error) => {
        console.error(error);
        toast.error(`Error performing ${selectedAction?.action}`, {
          description: "Please try again later.",
        });
      },
    });

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{
    provider: string;
    action: string;
  } | null>(null);
  const [additionalData, setAdditionalData] = useState<Record<string, string>>(
    {},
  );
  const [apiData, setApiData] = useState<unknown>(null);

  const handleAction = async (provider: string, action: string) => {
    const { needs, fields } = needsAdditionalData(provider, action);
    setSelectedAction({ provider, action });
    setIsSheetOpen(true);
    setAdditionalData(
      fields.reduce((acc, field) => ({ ...acc, [field]: "" }), {}),
    );
    setApiData(null);

    if (!needs) {
      executeAction({
        provider,
        actionConfig: {},
      });
    }
  };

  const handleSubmit = async () => {
    if (selectedAction) {
      executeAction({
        provider: selectedAction.provider,
        actionConfig: additionalData,
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Syncd preforms lots of actions. Here are just a few.
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
                <AccordionItem
                  key={provider.provider}
                  value={provider.provider}
                >
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

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen} modal>
        <SheetContent className="max-w-[35vw]">
          <SheetHeader>
            <SheetTitle>
              {selectedAction?.action} for {selectedAction?.provider}
            </SheetTitle>
          </SheetHeader>
          {!apiData ? (
            <>
              {needsAdditionalData(
                selectedAction?.provider,
                selectedAction?.action,
              ).needs ? (
                <>
                  {Object.keys(additionalData).map((field) => (
                    <div key={field} className="mt-4">
                      <Input
                        placeholder={`Enter ${field}`}
                        value={additionalData[field]}
                        onChange={(e) =>
                          setAdditionalData((prev) => ({
                            ...prev,
                            [field]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                  <Button
                    className="mt-4"
                    onClick={handleSubmit}
                    disabled={isExecutingAction}
                  >
                    {isExecutingAction ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      "Submit"
                    )}
                  </Button>
                </>
              ) : (
                <div className="mt-4 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              )}
            </>
          ) : (
            <pre className="mt-4 max-h-[80vh] overflow-auto">
              {JSON.stringify(apiData, null, 2)}
            </pre>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function getProviderActions(provider: string): string[] {
  switch (provider) {
    case "github":
      return ["List Organizations"];
    case "jira":
      return ["List Projects"];
    case "notion":
      return ["Search Databases"];
    case "figma":
      return ["Get Team Projects"];
    case "airtable":
      return ["List Bases"];
    case "dropbox":
      return ["List Files"];
    default:
      return ["Connect"];
  }
}

function needsAdditionalData(
  provider?: string,
  action?: string,
): { needs: boolean; fields: string[] } {
  switch (provider) {
    case "github":
      return { needs: false, fields: [] };
    case "jira":
      return { needs: false, fields: [] };
    case "notion":
      return { needs: false, fields: [] };
    case "figma":
      if (action === "Get Team Projects") {
        return { needs: true, fields: ["teamId"] };
      }
      return { needs: false, fields: [] };
    case "airtable":
      return { needs: false, fields: [] };
    case "dropbox":
      return { needs: false, fields: [] };
    default:
      return { needs: false, fields: [] };
  }
}
