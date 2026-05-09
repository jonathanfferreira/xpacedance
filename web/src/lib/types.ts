/**
 * Shared TypeScript interfaces for the XPACE DANCE platform.
 *
 * These types mirror the Supabase database schema and are used
 * across API routes, server components, and client components.
 */

// === Database Row Types ===

export interface User {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: 'admin' | 'professor' | 'escola' | 'aluno';
    created_at: string;
}

export interface Tenant {
    id: string;
    owner_id: string;
    name: string;
    slug: string | null;
    brand_color: string;
    logo_url: string | null;
    banner_url: string | null;
    asaas_wallet_id: string | null;
    pix_key: string | null;
    bank_code: string | null;
    bank_agency: string | null;
    bank_account: string | null;
    split_percent: number;
    status: 'pending' | 'active' | 'rejected';
    instagram: string | null;
    video_url: string | null;
    created_at: string;
}

export interface Course {
    id: string;
    tenant_id: string;
    title: string;
    description: string | null;
    price: number;
    pricing_type: string | null;
    thumbnail_url: string | null;
    is_published: boolean;
    is_promoted: boolean;
    promotion_tier: number;
    created_at: string;
    updated_at: string;
}

export interface CourseWithTenant extends Course {
    tenants: Pick<Tenant, 'asaas_wallet_id' | 'split_percent'> | null;
}

export interface Lesson {
    id: string;
    course_id: string;
    module_name: string;
    title: string;
    description: string | null;
    video_id: string | null;
    order_index: number;
    created_at: string;
}

export interface Enrollment {
    id: string;
    user_id: string;
    course_id: string;
    status: 'active' | 'cancelled' | 'expired';
    created_at: string;
}

export interface Progress {
    id: string;
    user_id: string;
    lesson_id: string;
    completed: boolean;
    completed_at: string | null;
    xp_awarded: number;
    created_at: string;
}

export interface Transaction {
    id: string;
    user_id: string;
    course_id: string;
    amount: number;
    asaas_payment_id: string | null;
    status: 'pending' | 'confirmed' | 'failed' | 'refunded' | 'overdue' | 'mock';
    payment_method: string | null;
    confirmed_at: string | null;
    created_at: string;
}

export interface Comment {
    id: string;
    lesson_id: string;
    user_id: string;
    content: string;
    likes: number;
    parent_id: string | null;
    created_at: string;
}

export interface CommentWithUser extends Comment {
    users: Pick<User, 'id' | 'full_name' | 'avatar_url'> | null;
}

export interface LessonView {
    id: string;
    user_id: string;
    lesson_id: string;
    created_at: string;
}

export interface UserSession {
    user_id: string;
    jwt_id: string;
    ip_address: string | null;
    user_agent: string | null;
    last_active_at: string;
}

// === API Request/Response Types ===

export interface CheckoutRequest {
    name: string;
    email: string;
    phone?: string;
    cpf?: string;
    password?: string;
    courseId: string;
    paymentMethod: 'pix' | 'credit';
    creditCard?: {
        holderName: string;
        number: string;
        expiryMonth: string;
        expiryYear: string;
        ccv: string;
        postalCode?: string;
        addressNumber?: string;
    };
    installments?: number;
}

export interface CheckoutResponse {
    success: boolean;
    paymentId: string;
    status: string;
    pixQrCodeUrl?: string | null;
    pixCopiaECola?: string | null;
}

export interface AsaasWebhookPayload {
    event: string;
    payment: {
        id: string;
        value: number;
        netValue: number;
        customerEmail: string;
        invoiceUrl?: string;
    };
}

// === UI Types ===

export interface SidebarLesson {
    id: string;
    title: string;
    duration: string;
    isCompleted: boolean;
    isActive: boolean;
}

export interface SidebarModule {
    id: string;
    title: string;
    lessons: SidebarLesson[];
}
