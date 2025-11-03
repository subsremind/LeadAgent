import { useState, useEffect } from 'react';
import { Button } from '@ui/components/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ui/components/card';
import { Textarea } from '@ui/components/textarea';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';

export function AISetting({ value }: { value: string }) {
  const [configContent, setConfigContent] = useState(value || '');
  
  // 监听value prop变化，当从undefined更新为实际值时更新状态
  useEffect(() => {
    if (value !== undefined) {
      setConfigContent(value || '');
    }
  }, [value]);
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations();
  const queryClient = useQueryClient();

  const saveSetting = async () => {
    setIsSaving(true);
    try {
      // 验证JSON格式
      if (configContent.trim()) {
        try {
          JSON.parse(configContent);
        } catch (parseError) {
          toast.error('Invalid JSON format');
          return;
        }
      }

      const response = await fetch('/api/admin/setting/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: 'ai_platform',
          value: configContent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save AI platform setting');
      }

      await queryClient.invalidateQueries({ queryKey: ['adminSetting'] });
      toast.success(t('common.status.success'));
    } catch (error) {
      toast.error(t('common.status.failure'));
    } finally {
      setIsSaving(false);
    }
  };

  // 示例配置的placeholder文本
  const placeholder = `// For OpenAI:
{
  "platform": "openai",
  "config": {
    "apiKey": "sk-..."
  }
}
// For Azure OpenAI 
{
  "platform": "azure",
  "config": {
    "apiKey": "your-azure-api-key",
    "endpoint": "https://your-resource.openai.azure.com/",
    "apiVersion": "2023-12-01-preview",
    "deploymentName": "your-deployment-name"
  }
}`;

  return (
    <Card>
      <CardContent>
        <div className="space-y-2">
          <Textarea
            placeholder={placeholder}
            value={configContent}
            onChange={(e) => setConfigContent(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={saveSetting} 
          disabled={isSaving}
          
        >
          {isSaving ? t('common.status.saving') : t('common.actions.save')}
        </Button>
      </CardFooter>
    </Card>
  );
}