import { NextResponse } from "next/server"
import { loadPatrons, addPatron, updatePatron, deletePatron } from "@/lib/library-data"
import { isAuthenticatedRequest, unauthorizedResponse } from "@/lib/auth"

export async function GET(request: Request) {
  if (!isAuthenticatedRequest(request)) return unauthorizedResponse()
  const patrons = await loadPatrons()
  return NextResponse.json(patrons)
}

export async function POST(request: Request) {
  if (!isAuthenticatedRequest(request)) return unauthorizedResponse()
  const body = await request.json()
  const { id, name } = body
  
  if (!Number.isInteger(Number(id)) || Number(id) < 1 || !name) {
    return NextResponse.json({ success: false, message: "A positive whole-number ID and name are required." }, { status: 400 })
  }
  
  const result = await addPatron(Number(id), name)
  return NextResponse.json(result, { status: result.success ? 201 : 409 })
}

export async function PUT(request: Request) {
  if (!isAuthenticatedRequest(request)) return unauthorizedResponse()
  const body = await request.json()
  const { id, name } = body
  
  if (!id || !name) {
    return NextResponse.json({ success: false, message: "ID and name are required." }, { status: 400 })
  }
  
  const result = await updatePatron(Number(id), name)
  return NextResponse.json(result, { status: result.success ? 200 : 404 })
}

export async function DELETE(request: Request) {
  if (!isAuthenticatedRequest(request)) return unauthorizedResponse()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  
  if (!id) {
    return NextResponse.json({ success: false, message: "Patron ID is required." }, { status: 400 })
  }
  
  const result = await deletePatron(Number(id))
  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
