import { NextResponse } from 'next/server';

// DOCUMENTATION: https://docs.melhorenvio.com.br/
// When User sets up token in `.env.local` as MELHOR_ENVIO_TOKEN, we can swap the mock to the real fetch.

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { from_postal_code, to_postal_code, products } = body;

        if (!from_postal_code || !to_postal_code || !products || !Array.isArray(products)) {
            return NextResponse.json({ error: 'Faltam dados essenciais para cálculo do frete.' }, { status: 400 });
        }

        // Se a chave real existir, enviamos o cURL pro Melhor Envio Sandbox:
        const MELHOR_ENVIO_TOKEN = process.env.MELHOR_ENVIO_TOKEN;

        if (MELHOR_ENVIO_TOKEN) {
            try {
                const url = 'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate';

                const melhorenvioProducts = products.map((p: any, index: number) => ({
                    id: p.id || `prod-${index}`,
                    weight: p.weight_kg || p.weight || 0.3,
                    width: p.width || 11,
                    height: p.height || 2,
                    length: p.length || 16,
                    insurance_value: p.price || p.insurance_value || 0,
                    quantity: p.quantity || 1
                }));

                const payload = {
                    from: { postal_code: from_postal_code.replace(/\D/g, '') },
                    to: { postal_code: to_postal_code.replace(/\D/g, '') },
                    products: melhorenvioProducts
                };

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${MELHOR_ENVIO_TOKEN}`,
                        'User-Agent': 'XTAGE Aplicação de E-commerce (suporte@xtage.com.br)'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const data = await response.json();

                    if (Array.isArray(data)) {
                        const validOptions = data.filter((opt: any) => !opt.error);

                        if (validOptions.length > 0) {
                            const mappedOptions = validOptions.map((opt: any) => ({
                                id: String(opt.id),
                                name: opt.name,
                                price: parseFloat(opt.custom_price || opt.price),
                                delivery_time: parseInt(opt.custom_delivery_time || opt.delivery_time, 10),
                                company: opt.company?.name || 'Desconhecida',
                                logo: opt.company?.picture || ''
                            }));

                            return NextResponse.json({
                                status: 'success',
                                origin: from_postal_code,
                                destination: to_postal_code,
                                options: mappedOptions.sort((a, b) => a.price - b.price)
                            });
                        }
                    }
                } else {
                    console.error("Melhor Envio API error response:", response.status, await response.text());
                }
            } catch (err) {
                console.error("Melhor Envio fetch error:", err);
            }
            // If it fails or returns no valid options, it will fall through to the mock calculation below
            console.log("Falling back to mock shipping calculation...");
        }

        // --- CALCULO MOCKADO PARA MVP ---
        // Aqui simulamos uma resposta válida de cotação dos Correios/Jadlog

        // Calcula peso e dimensões totais (Apenas para exibir no debug log)
        let totalWeight = 0;
        products.forEach(p => { totalWeight += (p.weight_kg || p.weight || 0.3) * (p.quantity || 1) });

        // Simulando um delay de resgate da API Logística:
        await new Promise(r => setTimeout(r, 800));

        // Tabela dummy baseada em estados do Brasil vs SP (Assumimos origem em SP como mock)
        const cleanToPostal = to_postal_code.replace(/\D/g, '');
        const isDistant = cleanToPostal.startsWith('6') || cleanToPostal.startsWith('7') || cleanToPostal.startsWith('5'); // Norte/NE

        const pacPrice = isDistant ? 45.90 : 25.50;
        const sedexPrice = isDistant ? 89.90 : 38.90;
        const jadlogPrice = isDistant ? 35.00 : 19.90;

        const options = [
            {
                id: 'correios_pac',
                name: 'PAC (Correios)',
                price: pacPrice + (totalWeight * 2),
                delivery_time: isDistant ? 12 : 6,
                company: 'Correios',
                logo: 'https://rastreamento.correios.com.br/static/rastreamento-internet/imgs/correios-logo.png'
            },
            {
                id: 'correios_sedex',
                name: 'SEDEX (Correios)',
                price: sedexPrice + (totalWeight * 3),
                delivery_time: isDistant ? 5 : 2,
                company: 'Correios',
                logo: 'https://rastreamento.correios.com.br/static/rastreamento-internet/imgs/correios-logo.png'
            },
            {
                id: 'jadlog_package',
                name: 'JadLog Package',
                price: jadlogPrice + (totalWeight * 1.5),
                delivery_time: isDistant ? 10 : 4,
                company: 'JadLog',
                logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7Fp3oO1Npq6P6C3f_lZ-9V-9OqO5O-lO8Q&s'
            }
        ];

        return NextResponse.json({
            status: 'success',
            origin: from_postal_code,
            destination: to_postal_code,
            options: options.sort((a, b) => a.price - b.price) // Order by cheapest
        });

    } catch (e: any) {
        console.error("Shipping Calc Error:", e);
        return NextResponse.json({ error: e.message || 'Erro calculando frete logístico' }, { status: 500 });
    }
}
