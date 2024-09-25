"use client";

import React, { useState } from "react";

import Image from "next/image";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { api } from "~/trpc/react";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { syncdJsonToForm } from "~/lib/forms/syncd-json-to-form";

export function Triggers() {
  const { data: allProviders, isLoading: isLoadingAllProviders } =
    api.syncd.getAllAllowedProviders.useQuery();
  const { mutateAsync: generateTrigger } =
    api.syncd.generateSingleForm.useMutation();

  const [form, setForm] = useState<JSX.Element | undefined>(undefined);

  const handleAddTrigger = async (provider: string) => {
    try {
      const trigger = await generateTrigger({ provider });
      const form = syncdJsonToForm(trigger);

      setForm(form);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Card x-chunk="dashboard-06-chunk-0">
      <CardHeader>
        <CardTitle>Triggers</CardTitle>
        <CardDescription>
          Manage your triggers and view their performance.
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
                      </DialogHeader>
                      <p>Configure your {provider.displayName} trigger here.</p>
                      {form && form}
                    </DialogContent>
                  )}
                </Dialog>
              ))}
        </div>
      </CardContent>
    </Card>
  );
}
