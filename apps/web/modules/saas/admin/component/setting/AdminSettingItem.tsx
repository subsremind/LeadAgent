"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const adminSettingSchema = z.object({
  value: z.string().trim().min(1, { message: "Value is required" }),
});

export function AdminSettingItem({ settingKey, value }: { settingKey: string; value: string }) {
  const [submitting, setSubmitting] = useState(false);
  const t = useTranslations();
  const queryClient = useQueryClient();

  
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      
      if (!key || !value) {
        throw new Error('Both key and value are required');
      }
      
      const response = await fetch("/api/admin/setting/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key, value }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save setting");
      }
      
      return await response.json();
    },
  });

  const form = useForm<{ value: string }>({
    resolver: zodResolver(adminSettingSchema),
    defaultValues: {
      value: value || "",
    },
  });

  const onSubmit = form.handleSubmit(async ({ value }) => {
    if (!settingKey) {
      toast.error('Missing required setting key');
      setSubmitting(false);
      return;
    }
    
    setSubmitting(true);
    try {
      await updateSettingMutation.mutateAsync({ key: settingKey, value });
      // 刷新adminSetting缓存
      await queryClient.invalidateQueries({ queryKey: ["adminSetting"] });
      toast.success(t("common.status.success"));
    } catch (error) {
      toast.error(t("common.status.failure"));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="grid grid-cols-1 gap-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Input
            type="text"
            className="w-full"
            {...form.register("value")}
          />
          {form.formState.errors.value && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.value.message}
            </p>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button
            variant="secondary"
            type="submit"
            loading={submitting || updateSettingMutation.isPending}
            disabled={!form.formState.isValid}
          >
            {t("common.actions.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}