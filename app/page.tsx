import { auth } from '@clerk/nextjs/server'
import LandingPage from '@/components/LandingPage'

export default async function Home() {
  const { userId } = await auth()
  return <LandingPage isLoggedIn={!!userId} />
}
