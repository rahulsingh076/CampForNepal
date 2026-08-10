import mongoose, { Schema } from 'mongoose'
import {
  DEFAULT_MEDIA_STATUS,
  MEDIA_SOURCE_TYPES,
  MEDIA_STATUSES,
  MEDIA_TYPES,
} from '../../constants/mediaStatuses.js'
import { baseSchemaOptions, embeddedSchemaOptions } from '../../database/schemaOptions.js'
import {
  isExternalHttpUrl,
  isSafeInternalPath,
  isSafeUrl,
  nonEmptyTextValidator,
  nonNegativeIntegerValidator,
  slugValidator,
} from '../../database/validators.js'

const PROVIDER_HOSTS = Object.freeze({
  youtube: ['youtube.com', 'www.youtube.com', 'youtu.be', 'www.youtu.be'],
  vimeo: ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'],
  instagram: ['instagram.com', 'www.instagram.com'],
  facebook: ['facebook.com', 'www.facebook.com', 'fb.watch'],
})

function hostMatches(value, hosts) {
  if (!isExternalHttpUrl(value)) return false
  const host = new URL(value.trim()).hostname.toLowerCase()
  return hosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))
}

function validSourceForType(sourceType, sourceUrl) {
  if (sourceType === 'local_asset') return isSafeInternalPath(sourceUrl)
  if (sourceType === 'external_url') return isExternalHttpUrl(sourceUrl)
  return hostMatches(sourceUrl, PROVIDER_HOSTS[sourceType] || [])
}

const usageLocationSchema = new Schema(
  {
    entityType: {
      type: String,
      trim: true,
      enum: ['package', 'destination', 'activity', 'guide', 'event', 'post', 'homepage'],
    },
    entityId: { type: String, trim: true, maxlength: 120 },
    entityTitle: { type: String, trim: true, maxlength: 200 },
    field: { type: String, trim: true, maxlength: 120 },
  },
  embeddedSchemaOptions
)

const mediaAssetSchema = new Schema(
  {
    sourceId: { type: String, trim: true, unique: true, sparse: true, select: false },
    title: {
      type: String,
      required: [true, 'A media asset needs a title.'],
      trim: true,
      validate: nonEmptyTextValidator,
      maxlength: 200,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      index: true,
      validate: slugValidator,
    },
    type: {
      type: String,
      enum: { values: MEDIA_TYPES, message: '"{VALUE}" is not a valid media type.' },
      required: true,
      index: true,
    },
    sourceType: {
      type: String,
      enum: { values: MEDIA_SOURCE_TYPES, message: '"{VALUE}" is not a valid media source type.' },
      required: true,
      index: true,
    },
    sourceUrl: {
      type: String,
      required: [true, 'A media asset needs a source URL or local asset path.'],
      trim: true,
      maxlength: 1000,
    },
    embedUrl: { type: String, trim: true, maxlength: 1000, validate: { validator: (value) => !value || isExternalHttpUrl(value), message: 'Embed URL must be a safe external URL.' } },
    thumbnailUrl: { type: String, trim: true, maxlength: 1000, validate: { validator: (value) => !value || isSafeUrl(value), message: 'Thumbnail URL must be safe.' } },
    thumbnailMediaId: { type: Schema.Types.ObjectId, ref: 'MediaAsset', default: null },
    alt: { type: String, trim: true, maxlength: 300 },
    caption: { type: String, trim: true, maxlength: 500 },
    width: { type: Number, validate: nonNegativeIntegerValidator },
    height: { type: Number, validate: nonNegativeIntegerValidator },
    durationSeconds: { type: Number, validate: nonNegativeIntegerValidator },
    focalPosition: { type: String, trim: true, maxlength: 60, default: '50% 50%' },
    tags: { type: [String], default: () => [], index: true },
    sourceName: { type: String, trim: true, maxlength: 200 },
    sourceReference: { type: String, trim: true, maxlength: 500 },
    photographerOrCreator: { type: String, trim: true, maxlength: 200 },
    licence: { type: String, trim: true, maxlength: 200 },
    attributionRequired: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: { values: MEDIA_STATUSES, message: '"{VALUE}" is not a valid media status.' },
      default: DEFAULT_MEDIA_STATUS,
      index: true,
    },
    usageLocations: { type: [usageLocationSchema], default: () => [] },
    createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null, select: false },
    updatedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null, select: false },
  },
  baseSchemaOptions
)

mediaAssetSchema.pre('validate', function validateSource(next) {
  if (!validSourceForType(this.sourceType, this.sourceUrl)) {
    this.invalidate('sourceUrl', 'Source URL does not match the selected source type.')
  }
  if (this.type === 'image' && this.sourceType !== 'local_asset' && !isSafeUrl(this.sourceUrl)) {
    this.invalidate('sourceUrl', 'Image source must be a safe URL or local asset path.')
  }
  next()
})

mediaAssetSchema.virtual('usageCount').get(function usageCount() {
  return Array.isArray(this.usageLocations) ? this.usageLocations.length : 0
})

mediaAssetSchema.index({ status: 1, type: 1 })
mediaAssetSchema.index({ title: 'text', tags: 'text', sourceName: 'text', sourceReference: 'text' })

const MediaAsset =
  mongoose.models.MediaAsset || mongoose.model('MediaAsset', mediaAssetSchema, 'mediaassets')

export default MediaAsset

