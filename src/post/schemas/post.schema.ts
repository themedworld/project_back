// src/post/schemas/post.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PostDocument = Post & Document;
export type ApplicantDocument = Applicant & Document;

// ============================================
// SCHEMA APPLICANT (Candidat)
// ============================================

@Schema({ timestamps: true })
export class Applicant {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  phone?: string;

  @Prop()
  cvLink?: string;

  // ========== DONNÉES EXTRAITES DU CV ==========

  @Prop({ type: String })
  experience_text?: string; // Texte brut de l'expérience

  @Prop({ type: Number, default: 0 })
  years_experience?: number; // Nombre d'années d'expérience

  @Prop({ type: String })
  education_text?: string; // Texte brut de la formation

  @Prop({ type: Number, default: 0 })
  years_education?: number; // Nombre d'années de formation

  @Prop({ type: [String], default: [] })
  skills?: string[]; // Liste des compétences extraites

  @Prop({ type: String, enum: ['Junior', 'Intermédiaire', 'Senior/Expert'], default: 'Junior' })
  level?: string; // Niveau estimé (Junior/Intermédiaire/Senior)

  // ========== SCORING ET MATCHING ==========

  @Prop({ type: Number, default: 0 })
  score?: number; // Score de matching avec le poste (0-100)

  @Prop({ type: Number, default: 0 })
  experienceScore?: number; // Score expérience (0-100)

  @Prop({ type: Number, default: 0 })
  educationScore?: number; // Score formation (0-100)

  @Prop({ type: Number, default: 0 })
  skillsScore?: number; // Score compétences (0-100)

  @Prop({ type: Number, default: 0 })
  levelScore?: number; // Score niveau demandé (0-100)

  @Prop({ type: String })
  cvParsingStatus?: string; // "pending" | "success" | "failed"

  @Prop({ default: Date.now })
  appliedAt: Date;

  @Prop()
  cvParsedAt?: Date; // Date du parsing du CV
}

export const ApplicantSchema = SchemaFactory.createForClass(Applicant);

// ============================================
// SCHEMA POST (Offre d'emploi)
// ============================================

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true })
  title: string; // Titre du poste (ex: "Développeur Full Stack")

  @Prop({ type: String, required: true })
  description: string; // Description générale du poste

  // ========== REQUIREMENTS D'EXPÉRIENCE ==========

  @Prop({ type: String })
  experienceDescription?: string; // Description du type d'expérience souhaité
  // Ex: "Expérience en développement backend avec Python et FastAPI"

  @Prop({ type: Number, default: 0 })
  minYearsExperience?: number; // Nombre minimum d'années (ex: 2)

  @Prop({ type: Number })
  maxYearsExperience?: number; // Nombre maximum d'années (ex: 5)

  // ========== REQUIREMENTS DE FORMATION ==========

  @Prop({ type: String })
  educationDescription?: string; // Description de la formation requise
  // Ex: "Master Informatique ou équivalent"

  @Prop({ type: Number, default: 0 })
  minYearsEducation?: number; // Nombre minimum d'années de formation

  // ========== REQUIREMENTS DE COMPÉTENCES ==========

  @Prop({ type: [String], default: [] })
  requiredSkills?: string[]; // Compétences obligatoires
  // Ex: ["Python", "FastAPI", "PostgreSQL", "Docker"]

  @Prop({ type: [String], default: [] })
  preferredSkills?: string[]; // Compétences appréciées
  // Ex: ["Kubernetes", "AWS", "Redis"]

  @Prop({ type: String })
  skillsDescription?: string; // Description des compétences requises
  // Ex: "Expertise en Python, FastAPI, bases de données relationnelles"

  // ========== REQUIREMENTS DE NIVEAU ==========

  @Prop({ type: String, enum: ['Junior', 'Intermédiaire', 'Senior/Expert'], required: true })
  requiredLevel: string; // Niveau requis pour le poste

  @Prop({ type: String })
  levelDescription?: string; // Description du niveau requis
  // Ex: "Professionnel expérimenté avec leadership"

  // ========== KEYWORDS ET TAGS ==========

  @Prop({ type: [String], default: [] })
  keywords: string[]; // Mots-clés du poste

  @Prop({ type: [String], default: [] })
  tags?: string[]; // Tags additionnels (ex: ["Remote", "CDI", "Urgent"])

  // ========== MÉTADONNÉES DU POSTE ==========

  @Prop({ default: true })
  isActive: boolean; // Le poste est-il actif ?

  @Prop({ type: [ApplicantSchema], default: [] })
  applicants: Applicant[]; // Liste des candidats

  @Prop({ type: Number, default: 0 })
  applicantsCount?: number; // Nombre de candidats

  @Prop({ type: Number, default: 0 })
  matchedApplicantsCount?: number; // Nombre de candidats avec score >= 70

  // ========== IDS ET RÉFÉRENCES ==========

  @Prop({ type: String, required: true })
  createdById: string; // ID du RH qui a créé le poste

  @Prop({ type: String, required: false })
  createdByRole?: string; // Rôle du créateur (ex: "recruiter", "manager")

  @Prop({ type: String, required: false })
  companyId?: string; // ID de la compagnie

  // ========== SCORING GLOBAL ==========

  @Prop({ type: Number, default: 0, index: true })
  score?: number; // Score moyen des candidats

  @Prop({ type: Date, default: Date.now })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);

// Ajouter des index pour les recherches
PostSchema.index({ createdById: 1, isActive: 1 });
PostSchema.index({ companyId: 1 });
PostSchema.index({ requiredLevel: 1 });
PostSchema.index({ keywords: 1 });