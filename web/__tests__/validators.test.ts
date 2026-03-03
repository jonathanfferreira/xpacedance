import { describe, it, expect } from "vitest";
import {
    checkoutSchema,
    subscriptionCheckoutSchema,
    subscriptionPlanSchema,
    walletSchema,
} from "@/lib/validators";

describe("checkoutSchema", () => {
    it("valida payload completo de checkout PIX", () => {
        const result = checkoutSchema.safeParse({
            name: "João Silva",
            email: "joao@example.com",
            phone: "11999999999",
            cpf: "12345678901",
            password: "senha123",
            courseId: "550e8400-e29b-41d4-a716-446655440000",
            paymentMethod: "pix",
        });
        expect(result.success).toBe(true);
    });

    it("falha sem email", () => {
        const result = checkoutSchema.safeParse({
            name: "João Silva",
            courseId: "550e8400-e29b-41d4-a716-446655440000",
            paymentMethod: "pix",
        });
        expect(result.success).toBe(false);
    });

    it("falha sem courseId", () => {
        const result = checkoutSchema.safeParse({
            name: "João Silva",
            email: "joao@example.com",
            paymentMethod: "pix",
        });
        expect(result.success).toBe(false);
    });

    it("falha com método de pagamento inválido", () => {
        const result = checkoutSchema.safeParse({
            name: "João Silva",
            email: "joao@example.com",
            courseId: "uuid-123",
            paymentMethod: "boleto", // inválido
        });
        expect(result.success).toBe(false);
    });
});

describe("subscriptionCheckoutSchema", () => {
    it("valida payload de checkout de assinatura", () => {
        const result = subscriptionCheckoutSchema.safeParse({
            name: "Maria Santos",
            email: "maria@example.com",
            planId: "550e8400-e29b-41d4-a716-446655440001",
            paymentMethod: "pix",
        });
        expect(result.success).toBe(true);
    });

    it("falha sem planId", () => {
        const result = subscriptionCheckoutSchema.safeParse({
            name: "Maria Santos",
            email: "maria@example.com",
            paymentMethod: "pix",
        });
        expect(result.success).toBe(false);
    });
});

describe("subscriptionPlanSchema", () => {
    it("valida plano mensal válido", () => {
        const result = subscriptionPlanSchema.safeParse({
            name: "Plano Básico",
            price: 49.90,
            cycle: "MONTHLY",
        });
        expect(result.success).toBe(true);
    });

    it("falha com preço abaixo do mínimo", () => {
        const result = subscriptionPlanSchema.safeParse({
            name: "Plano Barato",
            price: 9.00, // abaixo de R$ 19,90
            cycle: "MONTHLY",
        });
        expect(result.success).toBe(false);
    });

    it("falha com ciclo inválido", () => {
        const result = subscriptionPlanSchema.safeParse({
            name: "Plano",
            price: 49.90,
            cycle: "WEEKLY", // inválido
        });
        expect(result.success).toBe(false);
    });

    it("valida plano anual", () => {
        const result = subscriptionPlanSchema.safeParse({
            name: "Plano Anual",
            price: 399.00,
            cycle: "YEARLY",
        });
        expect(result.success).toBe(true);
    });
});

describe("walletSchema", () => {
    const validWallet = {
        name: "João Silva ME",
        email: "joao@empresa.com",
        documentCpfCnpj: "12345678901234",
        postalCode: "01001000",
        address: "Praça da Sé",
        addressNumber: "1",
        province: "Sé",
        pixKey: "joao@empresa.com",
        bankCode: "001",
        bankAgency: "0001",
        bankAccount: "123456-7",
    };

    it("valida wallet completa", () => {
        const result = walletSchema.safeParse(validWallet);
        expect(result.success).toBe(true);
    });

    it("falha sem CPF/CNPJ", () => {
        const { documentCpfCnpj: _, ...withoutDoc } = validWallet;
        const result = walletSchema.safeParse(withoutDoc);
        expect(result.success).toBe(false);
    });

    it("falha sem endereço", () => {
        const { address: _, ...withoutAddress } = validWallet;
        const result = walletSchema.safeParse(withoutAddress);
        expect(result.success).toBe(false);
    });

    it("falha sem CEP", () => {
        const { postalCode: _, ...withoutCep } = validWallet;
        const result = walletSchema.safeParse(withoutCep);
        expect(result.success).toBe(false);
    });
});
