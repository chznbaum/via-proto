import { Metadata } from 'next';
import { requireAuth } from '@/libs/auth';
import { CompetencyTracker } from './CompetencyTracker';

export const metadata: Metadata = {
  title: 'My Skills - ViaProto',
  description: 'Track your competency proficiency levels',
};

export default async function SkillsPage() {
  const user = await requireAuth();

  return <CompetencyTracker userId={user.id} />;
}
