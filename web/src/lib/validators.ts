import { z } from "zod";

// ========================================================
// CHECKOUT (avulso)
// ========================================================
export const checkoutSchema = z.object({
    name: z.string().min(2, "Nome obrigatório"),
    email: z.string().email("Email inválido"),
    phone: z.string().optional(),
    cpf: z.string().optional(),
    password: z.string().min(8, "Senha deve ter ao menos 8 caracteres").optional(),
    courseId: z.string().uuid("courseId inválido"),
    paymentMethod: z.enum(["pix", "credit"]),
    installments: z.number().int().min(1).max(12).optional().default(1),
    creditCard: z.object({
        holderName: z.string().min(2),
        number: z.string().min(13).max(19),
        expiryMonth: z.string().length(2),
        expiryYear: z.string().length(4),
        ccv: z.string().min(3).max(4),
        postalCode: z.string().optional(),
        addressNumber: z.string().optional(),
    }).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ========================================================
// CHECKOUT DE ASSINATURA
// ========================================================
export const subscriptionCheckoutSchema = z.object({
    name: z.string().min(2, "Nome obrigatório"),
    email: z.string().email("Email inválido"),
    phone: z.string().optional(),
    cpf: z.string().optional(),
    planId: z.string().uuid("planId inválido"),
    paymentMethod: z.enum(["pix", "credit"]),
    creditCard: z.object({
        holderName: z.string().min(2),
        number: z.string().min(13).max(19),
        expiryMonth: z.string().length(2),
        expiryYear: z.string().length(4),
        ccv: z.string().min(3).max(4),
    }).optional(),
});

export type SubscriptionCheckoutInput = z.infer<typeof subscriptionCheckoutSchema>;

// ========================================================
// SUBSCRIPTION PLAN (studio)
// ========================================================
export const subscriptionPlanSchema = z.object({
    name: z.string().min(2, "Nome do plano obrigatório"),
    price: z.number().min(19.90, "Preço mínimo: R$19,90"),
    cycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
    is_active: z.boolean().optional().default(true),
});

export type SubscriptionPlanInput = z.infer<typeof subscriptionPlanSchema>;

// ========================================================
// PARTNER (parceiro/professor)
// ========================================================
export const partnerSchema = z.object({
    email: z.string().email("Email inválido"),
    full_name: z.string().min(2, "Nome obrigatório"),
    bio: z.string().max(1000).optional(),
    tenant_id: z.string().uuid("tenant_id inválido"),
});

export type PartnerInput = z.infer<typeof partnerSchema>;

// ========================================================
// COURSE
// ========================================================
export const courseSchema = z.object({
    title: z.string().min(3, "Título obrigatório"),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    pricing_type: z.enum(["free", "paid"]).optional(),
    thumbnail_url: z.string().url().optional().or(z.literal("")),
    is_published: z.boolean().optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced", "master"]).optional(),
});

export type CourseInput = z.infer<typeof courseSchema>;

// ========================================================
// LESSON
// ========================================================
export const lessonSchema = z.object({
    title: z.string().min(2, "Título obrigatório"),
    course_id: z.string().uuid("course_id inválido"),
    description: z.string().optional(),
    order_index: z.number().int().min(0).optional(),
    bunny_video_id: z.string().optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced", "master"]).optional(),
    is_published: z.boolean().optional(),
});

export type LessonInput = z.infer<typeof lessonSchema>;

// ========================================================
// WALLET (criação de subconta Asaas)
// ========================================================
export const walletSchema = z.object({
    name: z.string().min(2, "Nome obrigatório"),
    email: z.string().email("Email inválido"),
    phone: z.string().optional(),
    documentCpfCnpj: z.string().min(11, "CPF/CNPJ obrigatório"),
    companyType: z.enum(["MEI", "LIMITED", "INDIVIDUAL", "ASSOCIATION"]).optional(),
    postalCode: z.string().min(8, "CEP obrigatório"),
    address: z.string().min(3, "Endereço obrigatório"),
    addressNumber: z.string().min(1, "Número obrigatório"),
    province: z.string().min(2, "Bairro obrigatório"),
    pixKey: z.string().optional(),
    bankCode: z.string().optional(),
    bankAgency: z.string().optional(),
    bankAccount: z.string().optional(),
});

export type WalletInput = z.infer<typeof walletSchema>;
