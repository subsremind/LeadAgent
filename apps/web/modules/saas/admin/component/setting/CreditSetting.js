import { AdminSettingItem } from "./AdminSettingItem";
export function CreditSetting({ value }) {
    return (<AdminSettingItem settingKey="token_credit_mapping" value={value}/>);
}
