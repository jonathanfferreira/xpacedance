import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ STRIPE_SECRET_KEY is not defined in environment variables.');
}

export const stripe = new Stripe(secretKey || '', {
    apiVersion: '2026-02-25.clover',
    typescript: true,
});
