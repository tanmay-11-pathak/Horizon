import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import MentorHub from '@/components/MentorHub'

export default async function MentorsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-up')
  return <MentorHub userId={userId} />
}
