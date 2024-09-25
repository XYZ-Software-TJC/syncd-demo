"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type Control,
  type FieldErrors,
  type FieldValues,
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

import axios from "axios";
import { Skeleton } from "~/components/ui/skeleton";
import { generateJSX } from "./generated-form";

const getAsyncEnums = async (
  data: AsyncEnums,
  getValues: UseFormGetValues<FieldValues>,
): Promise<EnumOption[]> => {
  try {
    const { path, dataKeys } = data;

    const params: Record<string, string> = {};
    for (const [key] of Object.entries(dataKeys)) {
      const valueToUse = getValues(key) as string | undefined;
      if (valueToUse) {
        params[key] = String(valueToUse);
      }
    }

    const mergedParams = {
      ...params,
      path,
    };

    const res = await axios.post<EnumOption[]>("/api/helpers", {
      mergedParams,
    });

    return res.data;
  } catch (error) {
    console.error(error);
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
}: {
  _key: string;
  widget: string;
  value: FormSchemaProperty;
  title: string;
  control: Control<FieldValues>;
  getValues: UseFormGetValues<FieldValues>;
  getAccessToken?: (provider: string) => Promise<string>;
  errors: FieldErrors<FieldValues>;
}) {
  const isAsync = !Array.isArray(value.enums);

  // State here for async data with loading and error states
  const [data, setData] = useState<EnumOption[] | null>(
    isAsync ? null : (value.enums as EnumOption[]),
  );

  const [isLoading, setIsLoading] = useState(isAsync ? true : false);
  // const [error, setError] = useState<Error | null>(null);

  const asyncFetch = useCallback(async () => {
    setIsLoading(true);
    // setError(null);
    try {
      const res = await getAsyncEnums(value.enums as AsyncEnums, getValues);

      setData(res);
    } catch (err) {
      console.log(err);
      // setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAsync) {
      void asyncFetch();
    }
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
