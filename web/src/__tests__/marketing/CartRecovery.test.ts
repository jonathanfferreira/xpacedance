import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendCartRecoveryEmail } from '../../utils/marketing/CartRecovery';

// Mock the resend library
const sendMock = vi.fn();
vi.mock('resend', () => {
  return {
    Resend: class {
      emails = {
        send: sendMock
      }
    }
  };
});

describe('sendCartRecoveryEmail', () => {
  const mockUserEmail = 'test@example.com';
  const mockUserName = 'Test User';
  const mockCheckoutUrl = 'https://example.com/checkout';

  let originalEnv: NodeJS.ProcessEnv;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Save original env
    originalEnv = process.env;
    process.env = { ...originalEnv };

    // Reset mocks
    vi.clearAllMocks();

    // Spy on console methods to keep output clean and allow assertions
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore env
    process.env = originalEnv;
    // Restore console methods
    vi.restoreAllMocks();
  });

  it('should abort and warn if RESEND_API_KEY is not set', async () => {
    // Arrange
    delete process.env.RESEND_API_KEY;

    // Act
    await sendCartRecoveryEmail(mockUserEmail, mockUserName, mockCheckoutUrl);

    // Assert
    expect(consoleWarnSpy).toHaveBeenCalledWith("⚠️ Chave da Resend não configurada. E-mail abortado.");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('should send the email successfully if RESEND_API_KEY is set', async () => {
    // Arrange
    process.env.RESEND_API_KEY = 'test_api_key';

    // Act
    await sendCartRecoveryEmail(mockUserEmail, mockUserName, mockCheckoutUrl);

    // Assert
    expect(sendMock).toHaveBeenCalledTimes(1);

    // Assert payload arguments
    const sendCallArg = sendMock.mock.calls[0][0];

    // Based on the actual source code, assert the fields we know
    expect(sendCallArg.from).toBe('XTAGE <suporte@xtage.app>');
    expect(sendCallArg.to).toEqual([mockUserEmail]);
    expect(sendCallArg.subject).toBe('⚠️ Seu treino na XTAGE ficou pausado na tela de pagamento!');
    expect(sendCallArg.html).toContain(mockUserName);
    expect(sendCallArg.html).toContain(mockCheckoutUrl);

    // Assert console log on success based on actual source code
    expect(consoleLogSpy).toHaveBeenCalledWith(`[RESEND] 📨 E-mail de Recuperação de Carrinho enviado para: ${mockUserEmail}`);
  });

  it('should catch errors and log them without throwing if resend.emails.send fails', async () => {
    // Arrange
    process.env.RESEND_API_KEY = 'test_api_key';
    const mockError = new Error('Test Resend API Error');

    sendMock.mockRejectedValueOnce(mockError);

    // Act
    // The promise should resolve, not reject
    await expect(sendCartRecoveryEmail(mockUserEmail, mockUserName, mockCheckoutUrl)).resolves.toBeUndefined();

    // The user explicitly stated: "logs it as a warning using console.warn('[CartRecovery] Error sending recovery email:', error)"
    expect(consoleWarnSpy).toHaveBeenCalledWith('[CartRecovery] Error sending recovery email:', mockError);
  });
});
