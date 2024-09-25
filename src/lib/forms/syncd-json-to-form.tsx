import { GeneratedForm } from "./generated-form";
import type { FormSchema, UISchema } from "./syncd-forms.types";

export const syncdJsonToForm = (jsonFromSyncdApi: {
  formSchema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
  provider: {
    name: string;
    description: string;
  };
  callbackId?: string;
  isEditSubmit?: boolean;
  handleSubmit: (data: Record<string, unknown>) => Promise<void>;
}) => {
  return {
    providerName: jsonFromSyncdApi.provider.name,
    providerDescription: jsonFromSyncdApi.provider.description,
    form: (
      <GeneratedForm
        formSchema={jsonFromSyncdApi.formSchema as unknown as FormSchema}
        uiSchema={jsonFromSyncdApi.uiSchema as UISchema}
        buttonText={
          jsonFromSyncdApi.isEditSubmit ? "Update Trigger" : "Create Trigger"
        }
        _onSubmit={async (data) => {
          await jsonFromSyncdApi.handleSubmit(data);
        }}
      />
    ),
  };
};
