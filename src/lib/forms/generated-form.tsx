"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type FieldErrors, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

import { Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";

import { typeDefaultValues } from "./type-default-values";
import { AsyncComponent } from "./async-component";
import { SearchSingleSelectDropdown } from "./search-dropdown";
import {
  type EnumOption,
  type FormSchema,
  type FormSchemaProperty,
  type GenerateJSXProps,
  type GetZodSchemaByTypeProps,
  type PruneAndScrubFormProps,
  type RenderFieldProps,
  type UISchema,
} from "./syncd-forms.types";

/**
 * Generates a Zod schema based on the field type and optional parameters
 */
const getZodSchemaByType = ({
  type,
  minLength,
  maxLength,
  itemsType,
  errorMessage,
  required = true,
}: GetZodSchemaByTypeProps): z.ZodTypeAny => {
  let schema: z.ZodTypeAny;

  switch (type) {
    case "string":
      schema = z
        .string()
        .min(minLength ?? 0, { message: errorMessage })
        .max(maxLength ?? 250, { message: errorMessage });
      break;
    case "boolean":
      schema = z.boolean({ required_error: errorMessage });
      break;
    case "number":
      schema = z
        .number()
        .min(minLength ?? 0, { message: errorMessage })
        .max(maxLength ?? Infinity, { message: errorMessage });
      break;
    case "url":
      schema = z.string().url({ message: errorMessage });
      break;
    case "array":
      if (!itemsType) {
        throw new Error("Invalid array type");
      }
      const zodTypeFromInsideArrayType: z.ZodTypeAny = getZodSchemaByType({
        type: itemsType,
        minLength,
        maxLength,
        errorMessage,
      });
      schema = z
        .array(zodTypeFromInsideArrayType)
        .refine((value) => value.length > 0, {
          message: errorMessage ?? "You have to select at least one item.",
        });
      break;
    case "object":
      schema = z.object({});
      break;
    default:
      // Handle unsupported or custom types
      schema = z.any();
  }

  return required ? schema : schema.optional();
};

/**
 * Generates a Zod schema from the form schema
 */
const generateZodSchema = (formSchema: Partial<FormSchema>) => {
  const schema: Record<string, z.ZodTypeAny> = {};

  /** All keywords here are specific to our JSON data shape and not allowed keywords */
  const reservedKeywords = ["allOf"];

  /** Some forms might not have an array of required keys so we need to handle that */
  const rootRequiredKeys = formSchema?.required ?? [];

  for (const [key, value] of Object.entries(formSchema?.properties ?? {})) {
    const { type, minLength, maxLength, items, allOf, errorMessage } = value;

    /** If we have an allOf clause, then we need to handle the conditional logic
     * (right now we only support one if-then clause per allOf array item) */
    if (allOf) {
      allOf.forEach((condition) => {
        /** We only care about the THEN clause here because only the THEN clause contains the keys we want to add to the schema
         * The IF clause only contains the key we want to check the value of and the value we want to check against
         */
        const thenObject = condition.then;
        const thenProperties = condition.then.properties;

        /** The THEN clause is an BASE object (meaning this is just an object that contains properties and a non allOf property).
         * This means we need to generate a Zod schema for each property in the THEN clause and add that schema to the root schema
         */
        for (const [thenKey, thenValue] of Object.entries(thenProperties)) {
          const { type, minLength, maxLength, items } = thenValue;
          const itemsType = items?.type;

          /** Check if the THEN key is required based off the root required keys */
          const rootRequired = rootRequiredKeys.includes(thenKey.toLowerCase());
          const thenRequired = thenObject.required?.includes(
            thenKey.toLowerCase(),
          );

          /** If the required values don't exist in the THEN object, then we can assume the root required keys are correct and see if the THEN key is required */
          const required = thenRequired ?? (rootRequired || false);

          /** Generate the schema for the THEN clause */
          const thenSchema = getZodSchemaByType({
            type,
            minLength,
            maxLength,
            itemsType,
            required,
            errorMessage,
          });

          /** If there is an error we need to not add the schema to the root schema */
          if (thenSchema) {
            schema[thenKey] = thenSchema;
          }
        }
      });
    } else {
      /** Generate the base schema for the current property */
      const fieldSchema = getZodSchemaByType({
        type,
        minLength,
        maxLength,
        errorMessage,
        itemsType: items?.type,
        required: rootRequiredKeys?.includes(key.toLowerCase()),
      });

      /** Check to see if the field schema is valid and not a reserved keyword */
      if (fieldSchema && !reservedKeywords.includes(key)) {
        schema[key] = fieldSchema;
      }
    }
  }

  /** Return the schema as a Zod object so we can preform validation on the form data */
  return z.object(schema);
};

/**
 * Prunes and scrubs the form schema based on conditional logic
 */
const pruneAndScrubForm = ({
  values,
  formSchema,
  originalZodSchema,
}: PruneAndScrubFormProps) => {
  try {
    /** Get all the allOf conditions - this is where all the conditional logic lives */
    const allOfRoot = formSchema.properties.allOf;
    /** If there are no conditional values, then we can assume the original schema values are correct */
    if (!allOfRoot?.allOf) return originalZodSchema;

    /** New Schema - starts off with just the original schema */
    let prunedSchema = originalZodSchema;

    /** Based off the actual values and the if conditions create a new schema that we will validate the form against */
    allOfRoot?.allOf?.forEach((condition) => {
      /** IF CONDITION KEYS AND VALUES */
      const ifSchema = condition.if;

      /** THEN CONDITIONS */
      const thenSchema = condition.then;

      /** Check all if conditions */
      const ifConditionsMet = Object.keys(ifSchema.properties).every((key) => {
        const condition = ifSchema.properties[key];
        if (condition?.const !== undefined) {
          return values[key] === condition.const;
        } else if (condition?.not !== undefined) {
          return values[key] !== condition.not;
        }
        return false;
      });

      if (ifConditionsMet) {
        /** Generate a Zod schema based off the properties of then object */
        const tempSchema = generateZodSchema(thenSchema);

        /** The latter schema will override the former keys if the keys collide
         * We want this because a field might be required now and not optional
         */
        prunedSchema = prunedSchema.merge(tempSchema);

        /** If the condition value does not match the expected value, then we need to omit the properties defined in the thenSchema */
      } else {
        /**
         * Omit the properties defined in the thenSchema from the prunedSchema.
         * This is done when the condition value does not match the expected value.
         */
        prunedSchema = prunedSchema.omit(
          Object.fromEntries(
            Object.keys(thenSchema.properties).map((key) => [key, true]),
          ) as { [K in keyof typeof prunedSchema.shape]?: true },
        );
      }
    });

    /** Return the pruned schema
     * NOTE: if there is no allOf conditions then we just return the original schema so no "pruning" happens
     */
    return prunedSchema;
  } catch (error) {
    console.error(error);
    throw new Error(
      "Error trying to prune the schema based of users selected values.",
    );
  }
};

/**
 * Generates JSX for form fields based on the widget type
 */
export const generateJSX = ({
  field,
  widget,
  enums,
  disabled,
  defaultValue,
}: GenerateJSXProps) => {
  switch (widget) {
    case "TextInput":
      return <Input {...field} disabled={disabled ?? false} />;
    case "Select":
      return (
        <Select
          onValueChange={field.onChange}
          disabled={disabled ?? false}
          defaultValue={defaultValue ?? field.value}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {enums?.map((item) => (
                <SelectItem key={item.title} value={item.description}>
                  {item.title}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      );
    case "Checkbox":
      return (
        <Checkbox
          checked={field.value}
          onCheckedChange={field.onChange}
          defaultChecked={defaultValue}
        />
      );
    default:
      return null;
  }
};

/**
 * Renders a form field based on its schema and UI configuration
 */
const renderField = ({
  name,
  schema,
  uiSchema,
  control,
  errors,
  getValues,
}: RenderFieldProps) => {
  const {
    title,
    items,
    enums,
    allOf,
    disabled,
    defaultValue: defaultFieldValue,
  } = schema;
  const fullJSX: JSX.Element[] = [];

  // Watch the value of the condition field if it exists
  const conditionValues = allOf?.map((condition) => {
    const conditionKeys = Object.keys(condition.if.properties);
    const conditions = conditionKeys.map((key) => ({
      key,
      value: useWatch({
        control,
        name: key,
      }) as string | undefined,
      expectedValue: condition.if.properties[key]?.const,
      notExpectedValue: condition.if.properties[key]?.not,
    }));
    return {
      conditions,
      thenSchema: condition.then.properties,
    };
  });

  // Handle allOf conditions and render based on the condition
  if (conditionValues) {
    conditionValues.forEach((condition) => {
      const allConditionsMet = condition.conditions.every(
        (cond) =>
          (cond.expectedValue !== undefined &&
            cond.value === cond.expectedValue) ||
          (cond.notExpectedValue !== undefined &&
            cond.value !== cond.notExpectedValue),
      );
      if (allConditionsMet) {
        Object.entries(condition.thenSchema).forEach(([key, value]) => {
          fullJSX.push(
            <Fragment key={key}>
              <AsyncComponent
                _key={key}
                widget={uiSchema?.["ui:widget"] || "Select"}
                value={value}
                title={value.title}
                control={control}
                getValues={getValues}
                errors={errors as unknown as FieldErrors}
              />
            </Fragment>,
          );
        });
      }
    });
  }

  // Handle rendering for array fields with multi-select-checkbox widget
  if (items && uiSchema?.["ui:custom"] === "multi-select-checkbox") {
    fullJSX.push(
      <FormField
        key={name}
        control={control}
        name={name}
        render={() => (
          <FormItem>
            <FormLabel className="space-y-0">{title}</FormLabel>
            <div className="mt-2 grid w-full grid-cols-2 gap-8">
              {(items.enums as EnumOption[])?.map((item) => (
                <FormField
                  key={item.title}
                  control={control}
                  name={name}
                  render={({ field }) => {
                    return (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            defaultChecked={
                              items?.defaultValue?.includes(
                                item.title.toLowerCase(),
                              ) as boolean
                            }
                            checked={field.value?.includes(item.title)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([
                                    ...(field.value || []),
                                    item.title,
                                  ])
                                : field.onChange(
                                    (field.value || []).filter(
                                      (value: string) => value !== item.title,
                                    ),
                                  );
                            }}
                          />
                        </FormControl>
                        <div className="syncd-mt-0 flex flex-col items-start space-y-0">
                          <FormLabel
                            htmlFor="terms"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {item.title}
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </FormItem>
                    );
                  }}
                />
              ))}
            </div>
          </FormItem>
        )}
      />,
    );
  } else if (uiSchema?.["ui:custom"] === "search-single-dropdown") {
    fullJSX.push(
      <FormField
        key={name + title}
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{title}</FormLabel>
            <FormControl>
              <SearchSingleSelectDropdown
                data={items?.enums as EnumOption[]}
                defaultValue={defaultFieldValue as string}
                field={field}
              />
            </FormControl>
            <FormMessage>{errors[name]?.message}</FormMessage>
          </FormItem>
        )}
      />,
    );
  } else {
    /** Default rendering for all other fields */
    fullJSX.push(
      <FormField
        key={name + title}
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{title}</FormLabel>
            <FormControl>
              {generateJSX({
                widget: uiSchema?.["ui:widget"],
                field,
                disabled,
                enums: enums as EnumOption[],
                defaultValue: defaultFieldValue as string,
              })}
            </FormControl>
            <FormMessage>{errors[name]?.message}</FormMessage>
          </FormItem>
        )}
      />,
    );
  }

  return fullJSX;
};

/**
 * Props for the GeneratedForm component
 */
interface IGenerateForm {
  formSchema: FormSchema;
  uiSchema: UISchema;
  buttonText: string;
  getAccessToken?: (provider: string) => Promise<string>;
  _onSubmit: (data: z.infer<ReturnType<typeof generateZodSchema>>) => void;
}

/**
 * Generates a form based on the provided schema and UI configuration
 */
export function GeneratedForm({
  formSchema,
  uiSchema,
  buttonText,
  _onSubmit,
}: IGenerateForm) {
  /** This generate Zod schema function will handle the allOf case */
  const registrationFormSchema = generateZodSchema(formSchema);
  type TCreateFormSchemaType = z.infer<typeof registrationFormSchema>;

  /** No need to worry about the allOf use case here because the FormControllers will set the form state with the users inputs.
   * The form validation has all the right logic to handle the allOf case - this means the as long as the "renderField" function
   * is called with the correct props, then the form will be validated correctly.
   */
  const defaultValues = Object.keys(formSchema.properties).reduce(
    (acc, key) => {
      const property = formSchema.properties[key];
      const type = property?.type;
      let defaultValueFromSchema = property?.defaultValue;
      let keyToUse = key;

      // Check for default values in allOf conditions
      // We need to add this because we have nested allOf properties
      if (property?.allOf) {
        property.allOf.forEach((condition) => {
          if (condition.then && condition.then.properties) {
            Object.entries(condition.then.properties).forEach(
              ([thenKey, thenValue]) => {
                if ("defaultValue" in thenValue) {
                  defaultValueFromSchema = thenValue.defaultValue;
                  keyToUse = thenKey;
                }
              },
            );
          }
        });
      }

      // Handle array type with items
      if (type === "array" && property && property?.items) {
        if (property.items.defaultValue) {
          defaultValueFromSchema = property.items.defaultValue;
        }
      }

      const defaultValue =
        defaultValueFromSchema ??
        typeDefaultValues[type as keyof typeof typeDefaultValues] ??
        typeDefaultValues.default;

      return {
        ...acc,
        [keyToUse]: defaultValue,
      };
    },
    {},
  );

  const form = useForm<TCreateFormSchemaType>({
    /** Validation mode NEEDS to be "onSubmit" for this to work.
     * This is because we are using a custom resolver that modifies the schema based on the conditional logic.
     * If we validate on "onChange" then the schema will not be modified in time and the user will always see errors.
     */
    mode: "onSubmit",
    /** Custom resolver because we have if-then logic that will remove and add fields to the schema */
    resolver: (values, ...args) => {
      try {
        /** Prune and scrub the form schema based on the conditional logic */
        const prunedSchema = pruneAndScrubForm({
          values,
          formSchema,
          originalZodSchema: registrationFormSchema,
        });

        /** Use the pruned schema to validate the form */
        return zodResolver(prunedSchema)(values, ...args);
      } catch (error) {
        throw new Error(
          "Error trying to resolve form with custom Zod resolver.",
        );
      }
    },
    defaultValues,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(_onSubmit)}
        className="flex w-full flex-col gap-2"
      >
        {Object.keys(formSchema.properties).map((name) => (
          <Fragment key={name}>
            {renderField({
              name,
              schema: formSchema.properties[name] as FormSchemaProperty,
              uiSchema: uiSchema[name],
              getValues: form.getValues,
              control: form.control,
              errors: form.formState.errors,
            })}
          </Fragment>
        ))}

        <Button type="submit" className="mt-4 self-end">
          {buttonText}
        </Button>

        {Object.keys(form.formState.errors || {}).length > 0 && (
          <Card className="text-red-7000 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">Errors</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(form.formState.errors).map((key) => (
                <ul key={key} className="list-inside list-disc text-red-500">
                  <li>
                    {form.formState?.errors[key]?.message as unknown as string}
                  </li>
                </ul>
              ))}
            </CardContent>
          </Card>
        )}
      </form>
    </Form>
  );
}
