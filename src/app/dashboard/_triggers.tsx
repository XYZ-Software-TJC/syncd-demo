"use client";

import { useState } from "react";

import Image from "next/image";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
import { syncdJsonToForm } from "~/lib/forms/syncd-json-to-form";
import { api } from "~/trpc/react";

export function Triggers() {
  // Queries
  const { data: allProviders, isLoading: isLoadingAllProviders } =
    api.syncd.getAllAllowedProviders.useQuery({
      onlyTriggers: true,
    });

  const { data: allTriggers, isLoading: isLoadingAllTriggers } =
    api.syncd.getAllTriggersForUser.useQuery();

  // Mutations
  const { mutateAsync: generateTrigger } =
    api.syncd.generateSingleForm.useMutation();
  const { mutateAsync: submitTrigger } =
    api.syncd.submitTriggerData.useMutation();

  // State
  const [form, setForm] = useState<{
    form: JSX.Element;
  } | null>(null);

  // Handlers
  const handleAddTrigger = async (provider: string) => {
    try {
      const trigger = await generateTrigger({ provider });
      const form = syncdJsonToForm({
        ...trigger,
        handleSubmit: () => {},
      });

      console.log(trigger);

      setForm(form);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitTrigger = async (data: any) => {
    try {
      await submitTrigger({
        data,
        isEditSubmit: data.isEditSubmit ?? false,
        provider: data.provider.name.toLowerCase(),
        callbackId: data.callbackId ?? "",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditTrigger = async (data: any) => {
    try {
      await submitTrigger({
        data,
        isEditSubmit: true,
        provider: data.provider.name.toLowerCase(),
        callbackId: data.callbackId ?? "",
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Triggers</CardTitle>
          <CardDescription>
            This tab only shows triggers (no actions) that Syncd supports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoadingAllProviders
              ? Array.from({ length: 6 }).map((_, index) => (
                  <Card
                    key={index}
                    className="flex h-[200px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 shadow-none transition-all duration-200 hover:border-primary/50 hover:bg-gray-100"
                  >
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="mt-4 h-6 w-32" />
                  </Card>
                ))
              : allProviders?.map((provider) => (
                  <Dialog key={provider.provider}>
                    <DialogTrigger asChild>
                      <Card
                        className={`flex h-[200px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white shadow-none transition-all duration-200 ${
                          provider.isConnected
                            ? "cursor-pointer hover:border-primary/50 hover:bg-gray-50"
                            : "cursor-not-allowed opacity-50"
                        }`}
                        onClick={() =>
                          provider.isConnected &&
                          handleAddTrigger(provider.provider)
                        }
                      >
                        <Image
                          alt={provider.displayName}
                          src={`https://syncdpublic.dev/logos/${provider.provider.toLowerCase()}.svg`}
                          width={40}
                          height={40}
                        />
                        <CardTitle className="mt-4 text-lg font-medium text-gray-900">
                          {provider.isConnected
                            ? "+ Add Trigger"
                            : "Please Connect Provider"}
                        </CardTitle>
                        <CardDescription className="mt-2 text-sm text-gray-500">
                          {provider.displayName}
                        </CardDescription>
                      </Card>
                    </DialogTrigger>
                    {provider.isConnected && (
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Add {provider.displayName} Trigger
                          </DialogTitle>
                          <DialogDescription>
                            This will register a webhook for your{" "}
                            {provider.displayName} account.
                          </DialogDescription>
                        </DialogHeader>
                        {form ? (
                          form.form
                        ) : (
                          <div className="space-y-4">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-8 w-1/2" />
                            <div className="flex justify-end">
                              <Skeleton className="h-10 w-24" />
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    )}
                  </Dialog>
                ))}
          </div>
        </CardContent>
      </Card>

      {/* All Triggers Subscribed To */}
      <Card>
        <CardHeader>
          <CardTitle>Logged In User&apos;s Triggers</CardTitle>
          <CardDescription>
            These are the triggers the logged in user has subscribed to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAllTriggers ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {allTriggers?.map((trigger, index) => (
                <AccordionItem key={trigger.id} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-4">
                      <Image
                        alt={trigger.accessor}
                        src={`https://syncdpublic.dev/logos/${trigger.accessor.toLowerCase()}.svg`}
                        width={24}
                        height={24}
                      />
                      <span>{trigger.accessor}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="mt-2 space-y-2">
                      <p>
                        <strong>Provider:</strong> {trigger.accessor}
                      </p>
                      <p>
                        <strong>Endpoint Id:</strong> {trigger.id}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
          {allTriggers?.length === 0 && (
            <div className="flex items-center justify-center">
              <span className="text-gray-500">
                No triggers found. Add a trigger above to get started.
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
