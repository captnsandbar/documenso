import type { TAttachmentFieldMeta as AttachmentFieldMeta } from '@documenso/lib/types/field-meta';
import { Input } from '@documenso/ui/primitives/input';
import { Label } from '@documenso/ui/primitives/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@documenso/ui/primitives/select';
import { Switch } from '@documenso/ui/primitives/switch';
import { Trans, useLingui } from '@lingui/react/macro';

type AttachmentFieldAdvancedSettingsProps = {
  fieldState: AttachmentFieldMeta;
  handleFieldChange: (key: keyof AttachmentFieldMeta, value: string | boolean) => void;
  handleErrors: (errors: string[]) => void;
};

export const AttachmentFieldAdvancedSettings = ({
  fieldState,
  handleFieldChange,
  handleErrors,
}: AttachmentFieldAdvancedSettingsProps) => {
  const { t } = useLingui();

  const handleInput = (field: keyof AttachmentFieldMeta, value: string | boolean) => {
    // There are no validation rules for file upload fields.
    handleErrors([]);
    handleFieldChange(field, value);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label>
          <Trans>Label</Trans>
        </Label>
        <Input
          id="label"
          className="mt-2 bg-background"
          placeholder={t`Field label`}
          value={fieldState.label ?? ''}
          onChange={(e) => handleInput('label', e.target.value)}
        />
      </div>

      <div>
        <Label>
          <Trans>Allowed files</Trans>
        </Label>

        <Select
          value={fieldState.fileTypes ?? 'any'}
          onValueChange={(value) => {
            if (!value) {
              return;
            }

            handleInput('fileTypes', value);
          }}
        >
          <SelectTrigger className="mt-2 bg-background">
            <SelectValue placeholder={t`Any file`} />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="any">
              <Trans>Any file</Trans>
            </SelectItem>
            <SelectItem value="images">
              <Trans>Images only</Trans>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-row items-center gap-2">
          <Switch
            className="bg-background"
            checked={fieldState.required ?? true}
            onCheckedChange={(checked) => handleInput('required', checked)}
          />
          <Label>
            <Trans>Required field</Trans>
          </Label>
        </div>
      </div>
    </div>
  );
};
