'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { CompetencyCard } from './CompetencyCard';
import { AddCompetencyModal } from './AddCompetencyModal';

interface UserCompetency {
  id: string;
  competency_id: string;
  proficiency_level: 'none' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  notes: string | null;
  self_assessed: boolean;
  assessed_at: string;
  competency: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    category: {
      name: string;
      slug: string;
      icon: string | null;
    } | null;
  };
}

interface CompetencyTrackerProps {
  userId: string;
}

export function CompetencyTracker({ userId }: CompetencyTrackerProps) {
  const [competencies, setCompetencies] = useState<UserCompetency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchCompetencies();
  }, []);

  const fetchCompetencies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user-competencies');
      if (response.ok) {
        const data = await response.json();
        setCompetencies(data.competencies);
      }
    } catch (error) {
      console.error('Error fetching competencies:', error);
      toast.error('Failed to load skills');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompetencyAdded = (newCompetency: UserCompetency) => {
    setCompetencies((prev) => {
      // Update if exists, otherwise add
      const existingIndex = prev.findIndex(
        (c) => c.competency_id === newCompetency.competency_id
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newCompetency;
        return updated;
      }
      return [newCompetency, ...prev];
    });
    setShowAddModal(false);
    toast.success('Skill updated successfully');
  };

  const handleCompetencyDeleted = async (competencyId: string) => {
    try {
      const response = await fetch(
        `/api/user-competencies?competency_id=${competencyId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setCompetencies((prev) =>
          prev.filter((c) => c.competency_id !== competencyId)
        );
        toast.success('Skill removed successfully');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting competency:', error);
      toast.error('Failed to remove skill');
    }
  };

  // Group competencies by proficiency level
  const groupedCompetencies = competencies.reduce(
    (acc, comp) => {
      acc[comp.proficiency_level].push(comp);
      return acc;
    },
    {
      expert: [] as UserCompetency[],
      advanced: [] as UserCompetency[],
      intermediate: [] as UserCompetency[],
      beginner: [] as UserCompetency[],
      none: [] as UserCompetency[],
    }
  );

  const proficiencyStats = {
    expert: groupedCompetencies.expert.length,
    advanced: groupedCompetencies.advanced.length,
    intermediate: groupedCompetencies.intermediate.length,
    beginner: groupedCompetencies.beginner.length,
    none: groupedCompetencies.none.length,
  };

  return (
    <>
      <div className="min-sm:container">
        {/* Header */}
        <div className="bg-primary/10 rounded-box relative w-full overflow-hidden p-6">
          <div className="flex justify-between">
            <div>
              <div className="flex items-center gap-1">
                <p className="text-base-content/80 text-sm">Dashboard</p>
                <span className="iconify lucide--chevron-right text-base-content/80 size-3.5"></span>
                <p className="text-sm">My Skills</p>
              </div>
              <p className="text-primary mt-4 text-xl font-medium">
                Skill Proficiency Tracker
              </p>
              <p className="text-base-content/80">
                Track your competencies and proficiency levels to get personalized learning
                recommendations
              </p>
            </div>
            <div className="flex flex-col items-end justify-between">
              <button
                className="btn btn-sm h-auto py-1 lg:py-2 btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <span className="iconify lucide--plus size-4"></span>
                <span>Add Skill</span>
              </button>
              <div className="text-base-content/60 flex items-center gap-2">
                <span className="iconify lucide--award size-4"></span>
                <p className="text-sm">
                  <span className="border-base-content/20 border-b border-dashed font-medium">
                    {competencies.length}
                  </span>{' '}
                  skills tracked
                </p>
              </div>
            </div>
          </div>
          <span className="iconify lucide--graduation-cap text-primary/5 absolute start-1/2 -bottom-12 size-44 -rotate-12"></span>
        </div>

        {/* Stats Overview */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="card bg-base-100 cursor-pointer p-4 shadow transition-all hover:shadow-md">
            <div className="flex justify-between">
              <p className="text-sm/none">Expert</p>
              <span className="iconify lucide--trophy text-yellow-500 size-4"></span>
            </div>
            <p className="mt-2 text-2xl font-medium">{proficiencyStats.expert}</p>
            <p className="text-base-content/50 text-sm/none">Mastered skills</p>
          </div>

          <div className="card bg-base-100 cursor-pointer p-4 shadow transition-all hover:shadow-md">
            <div className="flex justify-between">
              <p className="text-sm/none">Advanced</p>
              <span className="iconify lucide--trending-up text-green-500 size-4"></span>
            </div>
            <p className="mt-2 text-2xl font-medium">{proficiencyStats.advanced}</p>
            <p className="text-base-content/50 text-sm/none">Proficient skills</p>
          </div>

          <div className="card bg-base-100 cursor-pointer p-4 shadow transition-all hover:shadow-md">
            <div className="flex justify-between">
              <p className="text-sm/none">Intermediate</p>
              <span className="iconify lucide--activity text-blue-500 size-4"></span>
            </div>
            <p className="mt-2 text-2xl font-medium">
              {proficiencyStats.intermediate}
            </p>
            <p className="text-base-content/50 text-sm/none">Growing skills</p>
          </div>

          <div className="card bg-base-100 cursor-pointer p-4 shadow transition-all hover:shadow-md">
            <div className="flex justify-between">
              <p className="text-sm/none">Beginner</p>
              <span className="iconify lucide--sprout text-purple-500 size-4"></span>
            </div>
            <p className="mt-2 text-2xl font-medium">{proficiencyStats.beginner}</p>
            <p className="text-base-content/50 text-sm/none">Learning skills</p>
          </div>

          <div className="card bg-base-100 cursor-pointer p-4 shadow transition-all hover:shadow-md">
            <div className="flex justify-between">
              <p className="text-sm/none">None</p>
              <span className="iconify lucide--circle-dashed text-base-content/40 size-4"></span>
            </div>
            <p className="mt-2 text-2xl font-medium">{proficiencyStats.none}</p>
            <p className="text-base-content/50 text-sm/none">To explore</p>
          </div>
        </div>

        {/* Skills List */}
        <div className="card bg-base-100 card-border mt-6">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="iconify lucide--list size-5" />
                  <p className="text-lg font-medium">Your Skills</p>
                </div>
                <p className="text-base-content/60">
                  Manage your competency assessments and track your progress
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : competencies.length === 0 ? (
              <div className="py-12 text-center">
                <div className="inline-flex flex-col items-center gap-4 rounded-lg border border-dashed border-base-300 p-12">
                  <span className="iconify lucide--lightbulb size-12 text-base-content/40"></span>
                  <div>
                    <p className="font-medium">No skills tracked yet</p>
                    <p className="text-base-content/60 mt-1 text-sm">
                      Start by adding your first competency to track your learning journey
                    </p>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowAddModal(true)}
                  >
                    Add Your First Skill
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {competencies.map((comp) => (
                  <CompetencyCard
                    key={comp.id}
                    competency={comp}
                    onDelete={() => handleCompetencyDeleted(comp.competency_id)}
                    onEdit={() => {
                      // TODO: Implement edit
                      setShowAddModal(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddCompetencyModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleCompetencyAdded}
        />
      )}
    </>
  );
}
