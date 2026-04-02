import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
      <SignIn forceRedirectUrl="/chat" />
    </div>
  )
}
