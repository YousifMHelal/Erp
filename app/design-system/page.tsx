import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  ColorSection,
  TypeSection,
  ButtonSection,
  BadgeSection,
  FormSection,
  MoneySection,
  DensitySection,
  ShadowSection,
  CardSection,
} from "./sections";
import {
  DatePickerSection,
  DateTimePickerSection,
  ComboboxSection,
  CheckboxSection,
} from "./pickers";
import { FormDemoSection } from "./form-demo";

export default function DesignSystemPage() {
  return (
    <main className="mx-auto flex max-w-[1600px] flex-col gap-12 px-4 py-8 md:px-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-display">نظام التصميم</h1>
          <p className="text-body text-muted-foreground">
            صفحة معاينة مؤقتة — تُحذف في المرحلة الثامنة (P8-11)
          </p>
        </div>
        <ThemeToggle />
      </header>
      <ColorSection />
      <TypeSection />
      <ButtonSection />
      <BadgeSection />
      <FormSection />
      <CheckboxSection />
      <DatePickerSection />
      <DateTimePickerSection />
      <ComboboxSection />
      <FormDemoSection />
      <MoneySection />
      <DensitySection />
      <ShadowSection />
      <CardSection />
    </main>
  );
}
