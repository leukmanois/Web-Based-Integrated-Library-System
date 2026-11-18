import { LibraryDashboard } from "@/components/library/library-dashboard"
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function Page() {
  const cookieStore = await cookies()
  if (!verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value)) redirect("/login")

  return <LibraryDashboard />
}
