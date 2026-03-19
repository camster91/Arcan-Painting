/**
 * Input validation helpers using yup (already in package.json).
 * Usage:
 *   import { validateBody, schemas } from "@/app/api/utils/validate";
 *   const [data, err] = await validateBody(request, schemas.login);
 *   if (err) return err; // 400 Response
 */
import * as yup from "yup";

// ─── Reusable field types ───────────────────────────────────────────────────

const email = yup.string().email("Invalid email").max(255).required("Email is required");
const password = yup.string().min(6, "Password must be at least 6 characters").max(128).required("Password is required");
const optionalPassword = yup.string().min(6).max(128).optional();
const phone = yup.string().matches(/^[\d\s\+\-\(\)\.]{7,20}$/, "Invalid phone number").optional().nullable();
const amount = yup.number().positive("Amount must be positive").required("Amount is required");
const optionalAmount = yup.number().positive().optional().nullable();
const dateString = yup.string().matches(/^\d{4}-\d{2}-\d{2}/, "Date must be YYYY-MM-DD format").optional().nullable();
const url = yup.string().url("Invalid URL").max(2048).optional().nullable();
const id = yup.number().integer().positive().required("ID is required");

// ─── Schemas ────────────────────────────────────────────────────────────────

export const schemas = {
  login: yup.object({
    username: yup.string().max(255).optional(),
    email: yup.string().max(255).optional(),
    password: password,
  }),

  changePassword: yup.object({
    currentPassword: yup.string().required("Current password is required"),
    newPassword: password,
  }),

  passwordResetRequest: yup.object({
    emailOrUsername: yup.string().max(255).optional(),
    email: yup.string().max(255).optional(),
    username: yup.string().max(255).optional(),
  }),

  passwordResetConfirm: yup.object({
    token: yup.string().required("Token is required"),
    newPassword: password,
  }),

  payment: yup.object({
    invoice_id: yup.number().integer().positive().optional().nullable(),
    contract_id: yup.number().integer().positive().optional().nullable(),
    payment_method: yup
      .string()
      .oneOf(["cash", "check", "card", "bank_transfer", "other"], "Invalid payment method")
      .required("Payment method is required"),
    payment_reference: yup.string().max(255).optional().nullable(),
    amount: amount,
    payment_date: dateString,
    status: yup
      .string()
      .oneOf(["pending", "cleared", "failed", "refunded"])
      .optional(),
    notes: yup.string().max(5000).optional().nullable(),
    processed_by: yup.string().max(255).optional().nullable(),
  }),

  paymentUpdate: yup.object({
    id: id,
    payment_method: yup
      .string()
      .oneOf(["cash", "check", "card", "bank_transfer", "other"])
      .optional(),
    payment_reference: yup.string().max(255).optional().nullable(),
    amount: optionalAmount,
    payment_date: dateString,
    status: yup
      .string()
      .oneOf(["pending", "cleared", "failed", "refunded"])
      .optional(),
    notes: yup.string().max(5000).optional().nullable(),
    processed_by: yup.string().max(255).optional().nullable(),
  }),

  lead: yup.object({
    name: yup.string().max(255).required("Name is required"),
    email: yup.string().email().max(255).optional().nullable(),
    phone: phone,
    address: yup.string().max(500).optional().nullable(),
    city: yup.string().max(100).optional().nullable(),
    source: yup.string().max(100).optional().nullable(),
    service_type: yup.string().max(100).optional().nullable(),
    notes: yup.string().max(10000).optional().nullable(),
  }),

  leadUpdate: yup.object({
    id: id,
    name: yup.string().max(255).optional(),
    email: yup.string().email().max(255).optional().nullable(),
    phone: phone,
    address: yup.string().max(500).optional().nullable(),
    service_type: yup.string().max(100).optional().nullable(),
    project_description: yup.string().max(10000).optional().nullable(),
    notes: yup.string().max(10000).optional().nullable(),
    status: yup
      .string()
      .oneOf(["new", "contacted", "qualified", "proposal_sent", "won", "lost", "follow_up"], "Invalid status")
      .optional(),
    preferred_contact: yup
      .string()
      .oneOf(["phone", "email", "text", "any"], "Invalid contact method")
      .optional().nullable(),
    contact_method: yup
      .string()
      .oneOf(["phone", "email", "text", "any"], "Invalid contact method")
      .optional().nullable(),
    lead_source: yup.string().max(100).optional().nullable(),
    estimated_value: yup.number().min(0).optional().nullable(),
    follow_up_date: dateString,
    tags: yup.array().of(yup.string().max(50)).max(20, "Too many tags").optional().nullable(),
  }),

  contact: yup.object({
    name: yup.string().max(255).required("Name is required"),
    email: email,
    phone: phone,
    message: yup.string().max(10000).required("Message is required"),
    service: yup.string().max(100).optional().nullable(),
  }),

  project: yup.object({
    title: yup.string().max(255).required("Title is required"),
    lead_id: yup.number().integer().positive().optional().nullable(),
    status: yup.string().max(50).optional().nullable(),
    start_date: dateString,
    end_date: dateString,
    notes: yup.string().max(10000).optional().nullable(),
  }),

  invoice: yup.object({
    lead_id: yup.number().integer().positive().optional().nullable(),
    contract_id: yup.number().integer().positive().optional().nullable(),
    title: yup.string().max(255).required("Title is required"),
    total_amount: amount,
    due_date: dateString,
    notes: yup.string().max(10000).optional().nullable(),
  }),
};

// ─── Helper: validate a request body ───────────────────────────────────────

/**
 * Parse + validate request body against a yup schema.
 * Returns [validatedData, errorResponse] — if errorResponse is non-null, return it.
 *
 * @template T
 * @param {Request} request
 * @param {import("yup").ObjectSchema<T>} schema
 * @returns {Promise<[T, null] | [null, Response]>}
 */
export async function validateBody(request, schema) {
  let body;
  try {
    body = await request.json();
  } catch {
    return [null, Response.json({ error: "Invalid JSON body" }, { status: 400 })];
  }

  try {
    const data = await schema.validate(body, { abortEarly: false, stripUnknown: true });
    return [data, null];
  } catch (err) {
    if (err.name === "ValidationError") {
      return [
        null,
        Response.json(
          { error: "Validation failed", details: err.errors },
          { status: 400 }
        ),
      ];
    }
    throw err;
  }
}

/**
 * Validate a plain object (not from request body).
 * Returns [validatedData, errorMessage] — if errorMessage is non-null, input is invalid.
 */
export async function validateData(data, schema) {
  try {
    const result = await schema.validate(data, { abortEarly: false, stripUnknown: true });
    return [result, null];
  } catch (err) {
    if (err.name === "ValidationError") {
      return [null, err.errors.join("; ")];
    }
    throw err;
  }
}
