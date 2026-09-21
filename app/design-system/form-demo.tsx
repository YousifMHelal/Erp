"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import {
  designSystemDemoSchema,
  type DesignSystemDemoValues,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function FormDemoSection() {
  const [showPassword, setShowPassword] = React.useState(false);
  const form = useForm<DesignSystemDemoValues>({
    resolver: zodResolver(designSystemDemoSchema),
    defaultValues: { name: "", phone: "", password: "", cashbox: "نقدي", active: true },
  });

  function onSubmit(values: DesignSystemDemoValues) {
    console.log(values);
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h2">تركيب النموذج</h2>
      <p className="text-body-sm text-muted-foreground">
        <code>react-hook-form</code> + shadcn <code>Form</code> + Zod. تسمية،
        عنصر تحكم، عنصر نائب يوضّح التنسيق، ورسالة خطأ.
      </p>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid max-w-sm gap-5 rounded-md border border-border bg-card p-6 shadow-elevation-sm"
        >
          <h3 className="text-h3">بيانات المستخدم</h3>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  الاسم <span className="text-accent">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="مثال: محمد أحمد" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  رقم الهاتف <span className="text-accent">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    inputMode="tel"
                    placeholder="٠١٠xxxxxxxx"
                    className="text-end tabular-nums"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  كلمة المرور <span className="text-accent">*</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pe-9"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                      className="absolute inset-y-0 inset-e-0 flex w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOffIcon className="size-4" />
                      ) : (
                        <EyeIcon className="size-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormDescription>٨ أحرف على الأقل، حرف ورقم</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cashbox"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الخزينة الافتراضية</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="نقدي">نقدي</SelectItem>
                    <SelectItem value="فودافون كاش">فودافون كاش</SelectItem>
                    <SelectItem value="إنستاباي">إنستاباي</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">حساب نشط</FormLabel>
              </FormItem>
            )}
          />

          <Button type="submit" variant="accent" className="mt-2">
            حفظ
          </Button>
        </form>
      </Form>
    </section>
  );
}
