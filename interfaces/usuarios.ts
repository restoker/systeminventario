export interface Usuario {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    username: string;
    phone: string;
    role: "admin" | "saler";
    createdAt: Date;
    updatedAt: Date;
}