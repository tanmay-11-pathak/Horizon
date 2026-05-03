import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import MentorChat from '@/components/MentorChat'

const mentors: Record<string, {
  name: string, role: string, emoji: string,
  gradient: string, personality: string, slug: string
}> = {
  'study-buddy': {
    name: 'Study Buddy', role: 'Academic Assistant', emoji: '📚',
    gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
    personality: 'You are Study Buddy, a friendly and patient academic assistant. You help students understand concepts, create study plans, make quizzes, explain difficult topics simply, and motivate them to learn. You are encouraging, thorough, and always break down complex ideas into easy steps.',
    slug: 'study-buddy'
  },
  'career-coach': {
    name: 'Career Coach', role: 'Professional Mentor', emoji: '💼',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    personality: 'You are Career Coach, a strategic and honest professional mentor. You help with resume writing, interview preparation, career planning, job search strategies, and professional development. You give direct, actionable advice to help students and freshers land their dream jobs.',
    slug: 'career-coach'
  },
  'wellness-guide': {
    name: 'Wellness Guide', role: 'Mental Health Support', emoji: '🧠',
    gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    personality: 'You are Wellness Guide, a compassionate and empathetic mental health companion. You provide emotional support, help with stress and anxiety management, offer mindfulness techniques, and encourage healthy habits. You are warm, non-judgmental, and always remind users to seek professional help for serious concerns.',
    slug: 'wellness-guide'
  },
  'code-mentor': {
    name: 'Code Mentor', role: 'Programming Tutor', emoji: '💻',
    gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
    personality: 'You are Code Mentor, a technical and hands-on programming tutor. You help users learn to code, debug problems, understand algorithms, and build real projects. You support all programming languages and always explain with examples and code snippets.',
    slug: 'code-mentor'
  },
  'language-tutor': {
    name: 'Language Tutor', role: 'Communication Coach', emoji: '🌍',
    gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
    personality: 'You are Language Tutor, a fun and interactive communication coach. You help users improve their English, learn new languages, build vocabulary, fix grammar, and develop confident communication skills through conversation practice.',
    slug: 'language-tutor'
  },
  'finance-advisor': {
    name: 'Finance Advisor', role: 'Money & Investment Guide', emoji: '💰',
    gradient: 'linear-gradient(135deg, #a855f7, #9333ea)',
    personality: 'You are Finance Advisor, a practical and trustworthy money guide. You help students and young professionals understand personal finance, budgeting, saving, investing basics, and building wealth. You explain financial concepts clearly without jargon.',
    slug: 'finance-advisor'
  }
}

export default async function MentorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-up')

  const mentor = mentors[slug]
  if (!mentor) redirect('/mentors')

  return <MentorChat mentor={mentor} userId={userId} />
}
