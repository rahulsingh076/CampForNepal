// Shared Mongoose schema options, so every collection serialises identically.
//
// The frontend never sees `_id`. It sees `id` as a string, which is what the
// mock dataClient already returns and what every card and detail page reads.

// Turns a stored document into public JSON.
//
// Mongoose hands `ret` to this function as a plain object, so mutating it does
// not touch the document — the caller's model instance is unaffected.
//
// `select: false` alone is not enough to keep a field out of JSON. It stops a
// query LOADING the field, but a document built in memory still materialises
// any path that has a default — and Mongoose gives every array path a default
// of []. So a freshly constructed guide would serialise `certifications: []`
// and `verificationStatus: 'pending'` even though both are private.
//
// Stripping them here makes the guarantee structural: a private field cannot
// reach public JSON regardless of how the document was obtained. A service that
// genuinely needs one reads it from the document, not from toJSON().
function toPublicJSON(doc, ret) {
  const schema = doc?.schema
  if (schema?.eachPath) {
    schema.eachPath((path, schemaType) => {
      if (schemaType?.options?.select === false) delete ret[path]
    })
  }

  if (ret._id !== undefined) {
    ret.id = String(ret._id)
    delete ret._id
  }
  delete ret.__v
  return ret
}

export const baseSchemaOptions = Object.freeze({
  timestamps: true,
  versionKey: false,
  // Reject fields that are not in the schema rather than quietly storing them.
  strict: true,
  // Keep empty objects instead of stripping them, so a nested shape the
  // frontend expects (seo, mapInfo) never disappears when it is blank.
  minimize: false,
  toJSON: { virtuals: true, transform: toPublicJSON },
  toObject: { virtuals: true, transform: toPublicJSON },
})

// Embedded documents are values, not records: they need no identifier of their
// own, and an unexpected `_id` on every itinerary day would change the shape
// the frontend already renders.
export const embeddedSchemaOptions = Object.freeze({
  _id: false,
  versionKey: false,
  minimize: false,
})

export default baseSchemaOptions
