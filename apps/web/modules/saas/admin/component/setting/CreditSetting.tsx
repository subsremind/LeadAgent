import { AdminSettingItem } from "./AdminSettingItem";


export function CreditSetting({ value }: { value: string }) {

    return (
        <AdminSettingItem settingKey="token_credit_mapping" value={value} />
    )
}