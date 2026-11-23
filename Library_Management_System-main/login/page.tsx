import { AdminLoginForm } from "@/components/library/admin-login-form"
import { PageTransition } from "@/components/page-transition"
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const cookieStore = await cookies()
  if (verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value)) redirect("/")

  return (
    <PageTransition key="login">
      <AdminLoginForm />
    </PageTransition>
  )
}
