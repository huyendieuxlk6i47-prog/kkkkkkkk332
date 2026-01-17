/**
 * Entities Model - PLACEHOLDER
 */
import mongoose, { Schema, Document } from 'mongoose';

export interface IEntities extends Document {
  createdAt: Date;
  updatedAt: Date;
}

const EntitiesSchema = new Schema<IEntities>(
  {},
  { timestamps: true }
);

export const EntitiesModel = mongoose.model<IEntities>('Entities', EntitiesSchema);
