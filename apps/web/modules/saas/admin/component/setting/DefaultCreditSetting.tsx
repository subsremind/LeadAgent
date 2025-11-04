import { AdminSettingItem } from "./AdminSettingItem";


export function DefaultCreditSetting({ value }: { value: string }) {

    return (
        <AdminSettingItem settingKey="default_credit" value={value} />
    )
}