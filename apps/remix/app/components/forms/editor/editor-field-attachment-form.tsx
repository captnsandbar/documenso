import type { TAttachmentFieldMeta as AttachmentFieldMeta } from '@documenso/lib/types/field-meta';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@documenso/ui/primitives/form/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@documenso/ui/primitives/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { EditorGenericLabelField, EditorGenericRequiredField } from './editor-field-generic-field-forms';

const ZAttachmentFieldFormSchema = z.object({
  label: z.string().optional(),
  required: z.boolean().optional(),
  fileTypes: z.enum(['any', 'images']).optional(),
});

type TAttachmentFieldFormSchema = z.infer<typeof ZAttachmentFieldFormSchema>;

type EditorFieldAttachmentFormProps = {
  value: AttachmentFieldMeta | undefined;
  onValueChange: (value: AttachmentFieldMeta) => void;
};

export const EditorFieldAttachmentForm = ({
  value = {
    type: 'attachment',
    fileTypes: 'any',
  },
  onValueChange,
}: EditorFieldAttachmentFormProps) => {
  const { t } = useLingui();

  const form = useForm<TAttachmentFieldFormSchema>({
    resolver: zodResolver(ZAttachmentFieldFormSchema),
    mode: 'onChange',
    defaultValues: {
      label: value.label || '',
      required: value.required ?? true,
      fileTypes: value.fileTypes || 'any',
    },
  });

  const formValues = useWatch({
    control: form.control,
  });

  useEffect(() => {
    const validatedFormValues = ZAttachmentFieldFormSchema.safeParse(formValues);

    if (validatedFormValues.success) {
      onValueChange({
        type: 'attachment',
        ...validatedFormValues.data,
        fileTypes: validatedFormValues.data.fileTypes ?? 'any',
      });
    }
  }, [formValues]);

  return (
    <Form {...form}>
      <form>
        <fieldset className="flex flex-col gap-2">
          <EditorGenericLabelField formControl={form.control} />

          <FormField
            control={form.control}
            name="fileTypes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Trans>Allowed files</Trans>
                </FormLabel>
                <FormControl>
                  <Select {...field} value={field.value ?? 'any'} onValueChange={field.onChange}>
                    <SelectTrigger
                      data-testid="field-form-fileTypes"
                      className="w-full bg-background text-muted-foreground"
                    >
                      <SelectValue placeholder={t`Any file`} />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="any">
                        <Trans>Any file</Trans>
                      </SelectItem>
                      <SelectItem value="images">
                        <Trans>Images only</Trans>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="mt-1">
            <EditorGenericRequiredField formControl={form.control} />
          </div>
        </fieldset>
      </form>
    </Form>
  );
};
