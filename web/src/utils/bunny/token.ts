import crypto from 'crypto';

/**
 * Gera uma URL assinada digitalmente para o Bunny Stream HLS.
 * Isso impede que scripts extraiam o .m3u8 e rodem em players de terceiros (pirataria).
 * 
 * @param videoId ID do vídeo no Bunny.net
 * @param userIp IP do usuário (Opcional, mas trava o token a 1 única conexão se informado)
 * @param expiresInSeconds Tempo de vida do token (Padrão 6h para masterclasses longas)
 */
export function generateBunnyTokenizedUrl(videoId: string, userIp: string = "", expiresInSeconds: number = 21600): string {
    // Fallback de hostname tirado do print do BunnyCDN do usuário
    const hostname = process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME || process.env.BUNNY_CDN_HOSTNAME || process.env.NEXT_PUBLIC_BUNNY_STREAM_CDN_URL || 'vz-98a0e7c0-529.b-cdn.net';
    const securityKey = process.env.BUNNY_TOKEN_AUTH_KEY || process.env.BUNNY_SECURITY_KEY || process.env.BUNNY_API_KEY; 

    const cleanHostname = hostname.replace(/^https?:\/\//, '');

    if (!securityKey) {
        console.warn("Bunny CDN security key missing, returning insecure URL. Se a proteção por token estiver ativada na Bunny, o vídeo dará erro 403.");
        return `https://${cleanHostname}/${videoId}/playlist.m3u8`;
    }

    const expirationTime = Math.round(Date.now() / 1000) + expiresInSeconds;
    
    // Para HLS, assinamos a PASTA do vídeo (token_path) para que o player acesse os fragmentos .ts
    const tokenPath = `/${videoId}/`;
    
    // A assinatura do Bunny CDN Avançada = Base64(SHA256(securityKey + path + expirationTime + userIp))
    const hashableBase = `${securityKey}${tokenPath}${expirationTime}${userIp}`;
    
    const hash = crypto.createHash('sha256').update(hashableBase).digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    // Retorna URL protegida - Importante incluir token_path para HLS funcionar
    const tokenizedUrl = `https://${cleanHostname}${tokenPath}playlist.m3u8?token=${hash}&expires=${expirationTime}&token_path=${tokenPath}`;
    return tokenizedUrl;
}
