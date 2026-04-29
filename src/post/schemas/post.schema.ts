// src/post/schemas/post.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Applicant {
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) email: string;
  @Prop() phone?: string;
  @Prop() cvLink?: string;
  @Prop({ type: Number, default: 0 }) score?: number;
  @Prop({ default: Date.now }) appliedAt: Date;
}
export const ApplicantSchema = SchemaFactory.createForClass(Applicant);

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true }) title: string;
  @Prop({ type: String, required: true }) description: string;
  @Prop({ type: [String], default: [] }) keywords: string[];
  @Prop({ default: true }) isActive: boolean;
  @Prop({ type: [ApplicantSchema], default: [] }) applicants: Applicant[];

  // stocker l'id du RH comme string (ex: "15")
  @Prop({ type: String, required: true })
  createdById: string;

  @Prop({ type: String, required: false })
  createdByRole?: string;

  // companyId stocké comme string (ex: "3")
  @Prop({ type: String, required: false })
  companyId?: string;

  @Prop({ type: Number, default: 0, index: true })
  score?: number;
}
export const PostSchema = SchemaFactory.createForClass(Post);
