"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type Control,
  type FieldErrors,
  type UseFormGetValues,
} from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "~/components/ui/form";

import {
  type AsyncEnums,
  type EnumOption,
  type FormSchemaProperty,
} from "./syncd-forms.types";

import { Skeleton } from "~/components/ui/skeleton";
import { generateJSX } from "./generated-form";
import axios from "axios";

const getAsyncEnums = async (
  data: AsyncEnums,
  getValues: UseFormGetValues<any>,
): Promise<EnumOption[]> => {
  try {
    const { path, dataKeys } = data;

    const params: Record<string, string> = {};
    for (const [key, _] of Object.entries(dataKeys)) {
      const valueToUse = getValues(key) as string | undefined;
      if (valueToUse) {
        params[key] = String(valueToUse);
      }
    }

    const mergedParams = {
      ...params,
      projectId: process.env.NEXT_PUBLIC_SYNCD_PROJECT_ID!,
      externalId: user.id,
      path,
    };

    const res = await axios.post<EnumOption[]>("/api/syncd/forms/helpers", {
      mergedParams,
    });

    return res.data;
  } catch (error) {
    throw new Error("Error trying to fetch async enums");
  }
};

export function AsyncComponent({
  _key,
  title,
  widget,
  value,
  control,
  getValues,
  errors,
}: {
  _key: string;
  widget: string;
  value: FormSchemaProperty;
  title: string;
  control: Control<any>;
  getValues: UseFormGetValues<any>;
  getAccessToken?: (provider: string) => Promise<string>;
  errors: FieldErrors<any>;
}) {
  const isAsync = !Array.isArray(value.enums);

  // State here for async data with loading and error states
  const [data, setData] = useState<EnumOption[] | null>(
    isAsync ? null : (value.enums as EnumOption[]),
  );

  const [isLoading, setIsLoading] = useState(isAsync ? true : false);
  const [error, setError] = useState<Error | null>(null);

  const asyncFetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAsyncEnums(value.enums as AsyncEnums, getValues);

      setData(res);
    } catch (err) {
      console.log(err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    isAsync && asyncFetch();
  }, []);

  if (isLoading && isAsync)
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-8 w-full" />
      </div>
    );

  return (
    <FormField
      key={_key}
      control={control}
      name={_key}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{title}</FormLabel>
          <FormControl>
            {generateJSX({
              widget,
              field,
              enums: data!,
              defaultValue: value.defaultValue,
            })}
          </FormControl>
        </FormItem>
      )}
    />
  );
}
