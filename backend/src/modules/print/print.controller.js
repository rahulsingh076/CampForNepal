import asyncHandler from '../../middleware/asyncHandler.js'
import { sendSuccess } from '../../utils/response.js'
import {
  adminCustomerPrint,
  adminDepartureManifestPrint,
  adminInquiryPrint,
  publicDestinationPrint,
  publicEventPrint,
  publicPackagePrint,
} from './print.service.js'

export const packagePrint = asyncHandler(async (req, res) => {
  const data = await publicPackagePrint(req.params.slug)
  return sendSuccess(res, { message: 'Print-safe package data retrieved.', data })
})

export const packageItineraryPrint = asyncHandler(async (req, res) => {
  const data = await publicPackagePrint(req.params.slug, { itineraryOnly: true })
  return sendSuccess(res, { message: 'Print-safe itinerary data retrieved.', data })
})

export const destinationPrint = asyncHandler(async (req, res) => {
  const data = await publicDestinationPrint(req.params.slug)
  return sendSuccess(res, { message: 'Print-safe destination data retrieved.', data })
})

export const eventPrint = asyncHandler(async (req, res) => {
  const data = await publicEventPrint(req.params.slug)
  return sendSuccess(res, { message: 'Print-safe event data retrieved.', data })
})

export const customerPrint = asyncHandler(async (req, res) => {
  const data = await adminCustomerPrint(req.params.id, req.user)
  return sendSuccess(res, { message: 'Print-safe customer data retrieved.', data })
})

export const inquiryPrint = asyncHandler(async (req, res) => {
  const data = await adminInquiryPrint(req.params.id, req.user)
  return sendSuccess(res, { message: 'Print-safe inquiry data retrieved.', data })
})

export const departureManifestPrint = asyncHandler(async (req, res) => {
  const data = await adminDepartureManifestPrint(req.params.id, req.user)
  return sendSuccess(res, { message: 'Print-safe departure manifest retrieved.', data })
})

