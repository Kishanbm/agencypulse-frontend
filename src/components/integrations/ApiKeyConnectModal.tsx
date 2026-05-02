import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Shield } from "lucide-react";
import { getApiClient } from "@/lib/api";
import { CREDENTIAL_SCHEMAS, type CredentialSchema } from "@/lib/platform-credentials";
import type { PlatformEntry } from "@/lib/platform-catalog";

interface ApiKeyConnectModalProps {
  platform: PlatformEntry;
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queryKey: unknown[];
}

export default function ApiKeyConnectModal({
  platform, campaignId, open, onOpenChange, queryKey,
}: ApiKeyConnectModalProps) {
  const api = getApiClient();
  const queryClient = useQueryClient();
  const schema: CredentialSchema | undefined = CREDENTIAL_SCHEMAS[platform.key];

  const fieldIds = schema?.fields.map((f) => f.id) ?? ['apiKey'];

  const zodSchema = z.object(
    Object.fromEntries(
      (schema?.fields ?? [{ id: 'apiKey', required: true }]).map((f) => [
        f.id,
        f.required !== false ? z.string().min(1, `${f.label} is required`) : z.string().optional(),
      ]),
    ),
  );

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Record<string, string>>({
    resolver: zodResolver(zodSchema) as Resolver<Record<string, string>>,
    defaultValues: Object.fromEntries(fieldIds.map((id) => [id, ''])),
  });

  const connectMutation = useMutation({
    mutationFn: async (values: Record<string, string>) => {
      const payload = schema
        ? schema.buildPayload(values)
        : { apiKey: values.apiKey ?? '' };

      const { data } = await api.post<{ message: string }>(
        `/integrations/${platform.slug}/connect`,
        { campaignId, ...payload },
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message ?? `${platform.name} connected successfully`);
      void queryClient.invalidateQueries({ queryKey });
      reset();
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? "Connection failed — check your credentials and try again";
      toast.error(msg);
    },
  });

  function onSubmit(values: Record<string, string>) {
    connectMutation.mutate(values);
  }

  const fields = schema?.fields ?? [
    { id: 'apiKey', label: 'API Key', placeholder: 'Enter your API key', type: 'password' as const, required: true },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!connectMutation.isPending) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            Connect {platform.name}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {platform.description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {fields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <Label htmlFor={field.id} className="text-sm font-medium text-foreground">
                {field.label}
                {field.required !== false && <span className="text-destructive ml-0.5">*</span>}
              </Label>

              {field.type === 'textarea' ? (
                <Textarea
                  id={field.id}
                  {...register(field.id)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="font-mono text-xs resize-none bg-muted/30 border-border"
                />
              ) : (
                <Input
                  id={field.id}
                  type={field.type === 'password' ? 'password' : field.type === 'number' ? 'text' : 'text'}
                  {...register(field.id)}
                  placeholder={field.placeholder}
                  className="bg-muted/30 border-border"
                  autoComplete={field.type === 'password' ? 'new-password' : undefined}
                />
              )}

              {field.hint && (
                <p className="text-[11px] text-muted-foreground leading-snug">{field.hint}</p>
              )}
              {errors[field.id] && (
                <p className="text-[11px] text-destructive">{String(errors[field.id]?.message ?? '')}</p>
              )}
            </div>
          ))}

          {/* Security notice */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border border-border mt-2">
            <Shield className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              Credentials are encrypted at rest using AES-256-GCM and never exposed in API responses.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="border-border"
              onClick={() => onOpenChange(false)}
              disabled={connectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={connectMutation.isPending}
              className="bg-primary text-primary-foreground gap-2"
            >
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Connecting…
                </>
              ) : (
                `Connect ${platform.name}`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
