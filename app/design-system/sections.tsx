import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Money } from "@/components/shared/money";
import { StatusBadge } from "@/components/shared/status-badge";
import { Kbd } from "@/components/shared/kbd";

const COLOR_GROUPS: { label: string; tokens: string[] }[] = [
  {
    label: "أساسي",
    tokens: [
      "background",
      "foreground",
      "card",
      "popover",
      "primary",
      "secondary",
      "muted",
      "accent",
      "destructive",
      "border",
      "input",
      "ring",
    ],
  },
  {
    label: "دلالي",
    tokens: [
      "success-fg",
      "success-bg",
      "warning-fg",
      "warning-bg",
      "danger-fg",
      "danger-bg",
      "info-fg",
      "info-bg",
      "neutral-fg",
      "neutral-bg",
    ],
  },
  {
    label: "الرسوم البيانية",
    tokens: ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6"],
  },
  {
    label: "الشريط الجانبي",
    tokens: ["sidebar", "sidebar-foreground", "sidebar-accent"],
  },
];

export function ColorSection() {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-h2">الألوان</h2>
      {COLOR_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-2">
          <p className="text-label text-muted-foreground">{group.label}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {group.tokens.map((token) => (
              <div
                key={token}
                className="flex flex-col gap-2 rounded-md border border-border p-2"
              >
                <div
                  className="h-12 rounded-sm border border-border"
                  style={{ background: `var(--${token})` }}
                />
                <span className="text-caption text-muted-foreground">
                  {token}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export function TypeSection() {
  const steps: { token: string; className: string }[] = [
    { token: "display", className: "text-display" },
    { token: "h1", className: "text-h1" },
    { token: "h2", className: "text-h2" },
    { token: "h3", className: "text-h3" },
    { token: "body", className: "text-body" },
    { token: "body-sm", className: "text-body-sm" },
    { token: "label", className: "text-label" },
    { token: "caption", className: "text-caption" },
  ];

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-h2">المقياس النصي</h2>
      {steps.map((step) => (
        <div key={step.token} className="flex items-baseline gap-4">
          <span className="w-24 shrink-0 text-caption text-muted-foreground">
            {step.token}
          </span>
          <span className={step.className}>فاتورة رقم #000123 — 12,345.67</span>
        </div>
      ))}
      <div className="flex items-baseline gap-4">
        <span className="w-24 shrink-0 text-caption text-muted-foreground">
          tabular-nums
        </span>
        <span className="text-h2 tabular-nums">34,890.00 ج.م</span>
      </div>
    </section>
  );
}

export function ButtonSection() {
  const variants = [
    "primary",
    "accent",
    "secondary",
    "outline",
    "ghost",
    "destructive",
  ] as const;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h2">الأزرار</h2>
      <div className="flex flex-wrap gap-3">
        {variants.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled>
          معطل
        </Button>
        <Button variant="accent">
          حفظ الفاتورة <Kbd>F9</Kbd>
        </Button>
        <Button variant="outline" size="icon" aria-label="بحث" />
      </div>
    </section>
  );
}

export function BadgeSection() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h2">الشارات</h2>
      <div className="flex flex-wrap gap-3">
        <Badge>افتراضي</Badge>
        <Badge variant="secondary">ثانوي</Badge>
        <Badge variant="outline">مخطط</Badge>
      </div>
      <div className="flex flex-wrap gap-3">
        <StatusBadge tone="success" label="مدفوعة" />
        <StatusBadge tone="warning" label="مدفوعة جزئياً" />
        <StatusBadge tone="danger" label="غير مدفوعة" />
        <StatusBadge tone="info" label="مسودة" />
        <StatusBadge tone="neutral" label="غير نشط" />
      </div>
    </section>
  );
}

export function FormSection() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h2">حقول الإدخال</h2>
      <div className="grid max-w-sm gap-3">
        <Input placeholder="ابحث بالاسم أو الباركود…" />
        <Input placeholder="٠١٠xxxxxxxx" />
        <Input aria-invalid placeholder="مثال: ٥٠٠٫٠٠" />
      </div>
    </section>
  );
}

export function MoneySection() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h2">الأرقام والمبالغ</h2>
      <div className="flex flex-wrap gap-6">
        <Money value="34890.5" />
        <Money value="-1200" />
        <Money value="500" sign />
      </div>
    </section>
  );
}

export function DensitySection() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h2">الكثافة</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div
          data-density="compact"
          className="rounded-md border border-border p-3"
        >
          <p className="mb-2 text-label text-muted-foreground">مضغوطة</p>
          <div
            className="flex items-center border-b border-border text-body-sm"
            style={{
              height: "var(--density-row-height)",
              paddingInline: "var(--density-cell-padding-inline)",
            }}
          >
            صف بيانات
          </div>
        </div>
        <div
          data-density="comfortable"
          className="rounded-md border border-border p-3"
        >
          <p className="mb-2 text-label text-muted-foreground">مريحة</p>
          <div
            className="flex items-center border-b border-border text-body"
            style={{
              height: "var(--density-row-height)",
              paddingInline: "var(--density-cell-padding-inline)",
            }}
          >
            صف بيانات
          </div>
        </div>
      </div>
    </section>
  );
}

export function ShadowSection() {
  const levels = ["flat", "elevation-sm", "elevation-md", "elevation-lg"];

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h2">الارتفاع والظلال</h2>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {levels.map((level) => (
          <div
            key={level}
            className={`shadow-${level} flex h-20 items-center justify-center rounded-md border border-border bg-card text-caption text-muted-foreground`}
          >
            {level}
          </div>
        ))}
      </div>
    </section>
  );
}

export function CardSection() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h2">البطاقات</h2>
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>إجمالي المبيعات اليوم</CardTitle>
        </CardHeader>
        <CardContent>
          <Money value="12450.75" className="text-display" />
        </CardContent>
      </Card>
    </section>
  );
}
