import {
  Control,
  ControllerRenderProps,
  UseFormGetValues,
} from "react-hook-form";
import { z } from "zod";

/**
 * Represents an option in an enum field
 */
export interface EnumOption {
  title: string;
  description: string;
}

export interface AsyncEnums {
  path: string;
  provider?: string;
  dataKeys: {
    [key: string]: string | number | boolean | null;
  };
}

/**
 * Represents the structure of conditional logic in the form schema
 */
interface ConditionSchema {
  if: {
    properties: Record<string, { const?: string; not?: string }>;
  };
  then: {
    properties: Record<string, FormSchemaProperty>;
    required?: string[];
  };
}

/**
 * Represents a property in the form schema
 */
export interface FormSchemaProperty {
  type: string;
  title: string;
  errorMessage?: string;
  defaultValue?: any;
  description?: string;
  disabled?: boolean;
  minLength?: number;
  maxLength?: number;
  allOf?: ConditionSchema[];
  enums?: EnumOption[] | AsyncEnums;
  items?: FormSchemaProperty; // For array types
}

/**
 * Represents the overall structure of the form schema
 */
export interface FormSchema {
  title: string;
  description: string;
  provider?: string; // TODO: change this to the actual type
  properties: Record<string, FormSchemaProperty>;
  required?: string[];
}

/**
 * Represents the UI schema for customizing form field appearance
 */
export type UISchema = {
  [key: string]: {
    "ui:widget": string;
    "ui:placeholder"?: string;
    "ui:type"?: string;
    "ui:custom"?: string;
  };
};

/**
 * Props for generating JSX elements for form fields
 */
export type GenerateJSXProps = {
  field: ControllerRenderProps<any, string>;
  widget: string;
  disabled?: boolean;
  enums?: EnumOption[];
  defaultValue?: any;
};

/**
 * Props for rendering a form field
 */
export type RenderFieldProps = {
  name: string;
  schema: FormSchemaProperty;
  uiSchema: UISchema[keyof UISchema];
  control: Control<any>;
  errors: any;
  getValues: UseFormGetValues<{
    [x: string]: any;
  }>;
};

/**
 * Represents a conditional rule for form fields
 */
export interface ConditionalRule {
  field: string;
  condition: (getValues: any) => boolean;
}

/**
 * Props for generating a Zod schema based on field type
 */
export interface GetZodSchemaByTypeProps {
  type: string;
  minLength?: number;
  maxLength?: number;
  itemsType?: string;
  errorMessage?: string;
  required?: boolean;
}

/**
 * Props for pruning and scrubbing the form schema
 */
export interface PruneAndScrubFormProps {
  values: Record<string, unknown>;
  formSchema: FormSchema;
  originalZodSchema: z.ZodObject<
    Record<string, z.ZodTypeAny>,
    "strip",
    z.ZodTypeAny,
    {
      [x: string]: any;
    },
    {
      [x: string]: any;
    }
  >;
}
