import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
      <SignUp forceRedirectUrl="/profile" />
    </div>
  )
}
