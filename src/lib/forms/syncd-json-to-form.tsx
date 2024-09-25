import { toast } from "sonner";
import { GeneratedForm } from "./generated-form";

export const syncdJsonToForm = (jsonFromSyncdApi: {
  formSchema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
  provider: {
    name: string;
    description: string;
  };
  callbackId?: string;
  isEditSubmit?: boolean;
  handleCloseDialog?: () => void;
}) => {
  return {
    providerName: jsonFromSyncdApi.provider.name,
    providerDescription: jsonFromSyncdApi.provider.description,
    form: (
      <GeneratedForm
        formSchema={jsonFromSyncdApi.formSchema}
        uiSchema={jsonFromSyncdApi.uiSchema}
        buttonText={jsonFromSyncdApi.isEditSubmit ? "Update" : "Connect"}
        _onSubmit={async (data) => {
          const promise = fetch("/api/syncd/forms/submit", {
            method: "POST",
            body: JSON.stringify({
              data,
              isEditSubmit: jsonFromSyncdApi.isEditSubmit ?? false,
              provider: jsonFromSyncdApi.provider.name.toLowerCase(),
              callbackId: jsonFromSyncdApi.callbackId,
            }),
          });

          toast.promise(promise, {
            loading: `${
              jsonFromSyncdApi.isEditSubmit ? "Updating" : "Creating"
            } ${jsonFromSyncdApi.provider.name} Webhook`,
            success: () => {
              jsonFromSyncdApi.handleCloseDialog?.();
              return `${jsonFromSyncdApi.provider.name} Webhook ${
                jsonFromSyncdApi.isEditSubmit ? "Updated" : "Created"
              }`;
            },
            error: `Error ${
              jsonFromSyncdApi.isEditSubmit ? "Updating" : "Creating"
            } ${jsonFromSyncdApi.provider.name} Webhook`,
          });
        }}
      />
    ),
  };
};
