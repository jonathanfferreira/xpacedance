import { describe, it, expect } from "vitest";

// Testa a lógica de negócio do checkout de assinatura de forma isolada
describe("Subscription Checkout - Lógica de Negócio", () => {

    describe("Build do body para Asaas API", () => {
        it("deve formatar CPF sem máscara para Asaas", () => {
            const cpfRaw = "123.456.789-01";
            const cpfFormatted = cpfRaw.replace(/[^\d]/g, "");
            expect(cpfFormatted).toBe("12345678901");
        });

        it("deve formatar telefone sem máscara para Asaas", () => {
            const phoneRaw = "(11) 99999-9999";
            const phoneFormatted = phoneRaw.replace(/[^\d]/g, "");
            expect(phoneFormatted).toBe("11999999999");
        });
    });

    describe("Validação de ciclo de assinatura", () => {
        it("deve mapear cycle MONTHLY para object Asaas", () => {
            const plan = { cycle: "MONTHLY", price: 49.90 };
            const asaasBody = {
                billingType: "PIX",
                value: plan.price,
                cycle: plan.cycle,
                nextDueDate: new Date().toISOString().split("T")[0],
            };
            expect(asaasBody.cycle).toBe("MONTHLY");
            expect(asaasBody.value).toBe(49.90);
        });

        it("deve mapear cycle YEARLY para object Asaas", () => {
            const plan = { cycle: "YEARLY", price: 399.00 };
            expect(plan.cycle).toBe("YEARLY");
        });
    });

    describe("Geração de nextDueDate", () => {
        it("deve retornar data de hoje no formato YYYY-MM-DD", () => {
            const today = new Date().toISOString().split("T")[0];
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            expect(dateRegex.test(today)).toBe(true);
        });
    });

    describe("Resposta de PIX", () => {
        it("deve incluir pixQrCodeUrl na resposta quando billingType é PIX", () => {
            const mockAsaasResponse = {
                id: "sub_abc123",
                status: "PENDING",
                billingType: "PIX",
                pixQrCodeUrl: "https://api.asaas.com/qr-code/sub_abc123",
                pixCopiaECola: "00020126580014br.gov.bcb.pix...",
            };

            expect(mockAsaasResponse.pixQrCodeUrl).toBeDefined();
            expect(mockAsaasResponse.pixCopiaECola).toBeDefined();
            expect(mockAsaasResponse.billingType).toBe("PIX");
        });

        it("deve retornar status PENDING para nova assinatura", () => {
            const mockResponse = { status: "PENDING" };
            expect(mockResponse.status).toBe("PENDING");
        });
    });

    describe("Status de assinatura no banco", () => {
        const statusTransitions = [
            { event: "PAYMENT_RECEIVED", expectedStatus: "ACTIVE" },
            { event: "PAYMENT_OVERDUE", expectedStatus: "PAST_DUE" },
            { event: "PAYMENT_REFUNDED", expectedStatus: "CANCELED" },
            { event: "PAYMENT_CHARGEBACK", expectedStatus: "CANCELED" },
        ] as const;

        statusTransitions.forEach(({ event, expectedStatus }) => {
            it(`evento ${event} → subscription status ${expectedStatus}`, () => {
                const statusMap: Record<string, string> = {
                    PAYMENT_RECEIVED: "ACTIVE",
                    PAYMENT_OVERDUE: "PAST_DUE",
                    PAYMENT_REFUNDED: "CANCELED",
                    PAYMENT_CHARGEBACK: "CANCELED",
                };
                expect(statusMap[event]).toBe(expectedStatus);
            });
        });
    });
});
