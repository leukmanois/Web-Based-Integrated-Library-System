import { pbkdf2Sync, timingSafeEqual, createHmac } from "crypto"
import { NextResponse } from "next/server"
import adminsData from "@/data/admins.json"

const SESSION_COOKIE = "library_admin_session"
export const SESSION_MAX_AGE = 60 * 60 * 8

type AdminCredential = {
  id: string
  salt: string
  passwordHash: string
  iterations: number
}

function sessionSecret() {
  const secret = process.env.LIBRARY_SESSION_SECRET
  if (!secret) {
    throw new Error("LIBRARY_SESSION_SECRET must be configured before admin authentication can be used.")
  }
  return secret
}

export function hasSessionSecret() {
  return Boolean(process.env.LIBRARY_SESSION_SECRET)
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url")
}

export function createSessionToken(adminId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
  const payload = `${adminId}.${expiresAt}`
  return `${payload}.${sign(payload)}`
}

export function verifySessionToken(token?: string) {
  if (!token) return false

  const [adminId, expiryText, signature, ...rest] = token.split(".")
  if (
    rest.length > 0 ||
    !/^[A-Za-z0-9_-]+$/.test(adminId ?? "") ||
    !/^\d+$/.test(expiryText ?? "") ||
    !/^[A-Za-z0-9_-]+$/.test(signature ?? "")
  ) {
    return false
  }

  const expiresAt = Number(expiryText)
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false

  const expected = Buffer.from(sign(`${adminId}.${expiryText}`))
  const received = Buffer.from(signature)
  return expected.length === received.length && timingSafeEqual(expected, received)
}

export function isAuthenticatedRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? ""
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))

  return verifySessionToken(cookie?.slice(SESSION_COOKIE.length + 1))
}

export function unauthorizedResponse() {
  return NextResponse.json({ success: false, message: "Admin authentication is required." }, { status: 401 })
}

export async function verifyAdminCredentials(id: string, password: string) {
  const admins = adminsData as AdminCredential[]
  const admin = admins.find((entry) => entry.id === id)
  const salt = admin?.salt ?? "0".repeat(32)
  const expectedHash = admin?.passwordHash ?? "0".repeat(64)
  const iterations = admin?.iterations ?? 310000

  if (!Number.isSafeInteger(iterations) || iterations < 100000 || iterations > 1000000) {
    throw new Error("Admin credential file contains an invalid password hash configuration.")
  }

  const actualHash = pbkdf2Sync(password, salt, iterations, 32, "sha256")
  const expected = Buffer.from(expectedHash, "hex")
  if (expected.length !== actualHash.length) {
    throw new Error("Admin credential file contains an invalid password hash.")
  }

  return admin && timingSafeEqual(actualHash, expected) ? admin.id : null
}

export { SESSION_COOKIE }
