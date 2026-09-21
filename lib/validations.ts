import { z } from "zod";

// Define every Zod schema here as each domain is implemented.

/** Demo-only schema for the /design-system form anatomy preview. Delete at P8-11. */
export const designSystemDemoSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جداً"),
  phone: z
    .string()
    .trim()
    .regex(/^01[0125][0-9]{8}$/, "رقم هاتف مصري غير صالح"),
  password: z.string().min(8, "٨ أحرف على الأقل"),
  cashbox: z.enum(["نقدي", "فودافون كاش", "إنستاباي"]),
  active: z.boolean(),
});

export type DesignSystemDemoValues = z.infer<typeof designSystemDemoSchema>;
