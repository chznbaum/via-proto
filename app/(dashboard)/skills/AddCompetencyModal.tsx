'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import CompetencyTypeahead from '@/components/paths/CompetencyTypeahead';
import { toast } from 'react-hot-toast';

interface AddCompetencyModalProps {
  onClose: () => void;
  onSuccess: (competency: any) => void;
}

const proficiencyLevels = [
  { value: 'none', label: 'None', description: 'Not yet learned', icon: 'lucide--circle-dashed' },
  { value: 'beginner', label: 'Beginner', description: 'Just starting out', icon: 'lucide--sprout' },
  { value: 'intermediate', label: 'Intermediate', description: 'Comfortable with basics', icon: 'lucide--activity' },
  { value: 'advanced', label: 'Advanced', description: 'Can work independently', icon: 'lucide--trending-up' },
  { value: 'expert', label: 'Expert', description: 'Can teach others', icon: 'lucide--trophy' },
];

export function AddCompetencyModal({ onClose, onSuccess }: AddCompetencyModalProps) {
  const [selectedCompetency, setSelectedCompetency] = useState<any>(null);
  const [proficiencyLevel, setProficiencyLevel] = useState<string>('intermediate');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedCompetency) {
      toast.error('Please select a competency');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/user-competencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competency_id: selectedCompetency.id,
          proficiency_level: proficiencyLevel,
          notes: notes || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onSuccess(data.competency);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving competency:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save skill');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Add Skill</h3>
          <button
            className="btn btn-sm btn-ghost btn-circle"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <Icon icon="lucide--x" className="size-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {/* Competency Search */}
          <div className="space-y-2">
            <label className="fieldset-label">
              Search for a competency
            </label>
            <CompetencyTypeahead
              onSelect={(competency) => setSelectedCompetency(competency)}
              placeholder="Search for a skill (e.g., React, Python, SQL)"
            />
            {selectedCompetency && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-base-200 p-3">
                <Icon icon="lucide--check-circle" className="text-success size-5" />
                {selectedCompetency.icon && (
                  <Icon icon={selectedCompetency.icon} className="size-5 text-base-content/60" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{selectedCompetency.name}</p>
                  {selectedCompetency.category && (
                    <p className="text-base-content/60 text-sm">
                      {selectedCompetency.category.name}
                    </p>
                  )}
                </div>
                <button
                  className="btn btn-xs btn-ghost btn-circle"
                  onClick={() => setSelectedCompetency(null)}
                >
                  <Icon icon="lucide--x" className="size-4" />
                </button>
              </div>
            )}
          </div>

          {/* Proficiency Level */}
          <div className="space-y-2">
            <label className="fieldset-label">
              Your proficiency level
            </label>
            <div className="grid grid-cols-1 gap-2">
              {proficiencyLevels.map((level) => (
                <label
                  key={level.value}
                  className={`cursor-pointer rounded-lg border-2 p-3 transition-all ${
                    proficiencyLevel === level.value
                      ? 'border-primary bg-primary/10'
                      : 'border-base-300 hover:border-base-content/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="proficiency"
                      value={level.value}
                      checked={proficiencyLevel === level.value}
                      onChange={(e) => setProficiencyLevel(e.target.value)}
                      className="radio radio-primary"
                    />
                    <Icon icon={level.icon} className="size-5" />
                    <div className="flex-1">
                      <p className="font-medium">{level.label}</p>
                      <p className="text-base-content/60 text-sm">{level.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="fieldset-label" htmlFor="notes">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              className="textarea textarea-bordered w-full"
              placeholder="Add any notes about your experience with this skill..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="modal-action">
          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <Icon icon="lucide--x" className="size-4" />
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedCompetency}
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
              </>
            ) : (
              <>
                <Icon icon="lucide--check" className="size-4" />
                Save Skill
              </>
            )}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
