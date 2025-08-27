export type BadgeCategory = "gold" | "silver" | "bronze";



export interface Issuer {
  name: string;
  role: string;
  imageUrl: string;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  category: BadgeCategory; // agora corresponde ao tipo
  imageUrl: string;
  issuer: Issuer | string; // se às vezes vem string
  issuerImageUrl: string;
  isActive: boolean;
  createdAt: string;
}

export interface BadgeFormData {
  name: string;
  description: string;
  category: string;
  issuer: Issuer;
  imageUrl: string;
  issuerImageUrl: string;
  isActive: boolean;
}
