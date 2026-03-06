import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

const mockProducts = [
  { id: '1', weight: 0.5, width: 20, height: 10, length: 15, insurance_value: 100, quantity: 2 }
];

describe('Shipping API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.MELHOR_ENVIO_TOKEN;
  });

  it('should return 400 if required data is missing', async () => {
    const request = new Request('http://localhost/api/xtore/shipping', {
      method: 'POST',
      body: JSON.stringify({ from_postal_code: '12345678' }) // missing to_postal_code and products
    });
    const response = await POST(request);
    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.error).toBe('Faltam dados essenciais para cálculo do frete.');
  });

  it('should return mock shipping options if MELHOR_ENVIO_TOKEN is not set', async () => {
    const request = new Request('http://localhost/api/xtore/shipping', {
      method: 'POST',
      body: JSON.stringify({
        from_postal_code: '01000-000',
        to_postal_code: '02000-000',
        products: mockProducts
      })
    });
    const response = await POST(request);
    const json = await response.json();
    expect(json.status).toBe('success');
    expect(json.options).toBeDefined();
    expect(json.options.length).toBe(3); // PAC, SEDEX, JadLog
  });

  it('should call Melhor Envio API and return mapped options if token is set and api succeeds', async () => {
    process.env.MELHOR_ENVIO_TOKEN = 'test_token';
    const mockMelhorEnvioResponse = [
      {
        id: 1,
        name: 'PAC',
        price: '15.00',
        custom_price: '20.00',
        delivery_time: 5,
        custom_delivery_time: 7,
        company: { name: 'Correios', picture: 'logo.png' }
      },
      {
        id: 2,
        error: 'Unsupported area'
      }
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockMelhorEnvioResponse
    });

    const request = new Request('http://localhost/api/xtore/shipping', {
      method: 'POST',
      body: JSON.stringify({
        from_postal_code: '01000-000',
        to_postal_code: '02000-000',
        products: mockProducts
      })
    });
    const response = await POST(request);
    const json = await response.json();
    expect(json.status).toBe('success');
    expect(json.options.length).toBe(1); // One valid option mapped
    expect(json.options[0].name).toBe('PAC');
    expect(json.options[0].price).toBe(20.00);
    expect(json.options[0].delivery_time).toBe(7);
  });

  it('should fallback to mock if fetch fails', async () => {
      process.env.MELHOR_ENVIO_TOKEN = 'test_token';
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const request = new Request('http://localhost/api/xtore/shipping', {
        method: 'POST',
        body: JSON.stringify({
          from_postal_code: '01000-000',
          to_postal_code: '02000-000',
          products: mockProducts
        })
      });

      const response = await POST(request);
      const json = await response.json();
      expect(json.status).toBe('success');
      expect(json.options.length).toBe(3); // Fallback mock options
  });

});
