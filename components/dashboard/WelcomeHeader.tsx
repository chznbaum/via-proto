'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/libs/supabase/client';
import { trackEvent } from '@/components/SwetrixAnalytics';

interface WelcomeHeaderProps {
  onCreatePath: () => void;
  canGenerate: boolean;
}

export function WelcomeHeader({ onCreatePath, canGenerate }: WelcomeHeaderProps) {
  const [displayName, setDisplayName] = useState<string>('Stranger');
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Fetch profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();

        if (profile?.name) {
          setDisplayName(profile.name);
        } else {
          // Fallback to email username
          setDisplayName(user.email?.split('@')[0] || 'Stranger');
        }
      }
    };

    getUser();
  }, [supabase]);

  return (
    <div className="flex flex-wrap items-end gap-3 sm:gap-6 xl:gap-12">
      <div className="from-base-content to-secondary inline-block bg-gradient-to-tr from-40% bg-clip-text text-xl font-semibold tracking-tight text-transparent sm:text-3xl">
        <p>Welcome Back, {displayName}</p>
        <p className="mt-1">Here's an overview of your learning paths</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative group">
          <button
            className="btn text-primary-content from-primary to-secondary animate-background-shift relative z-1 gap-2 border-none bg-linear-to-r bg-[200%,200%]"
            onClick={() => {
              trackEvent("cta.dashboard.create_path");
              onCreatePath();
            }}
            disabled={!canGenerate}
          >
            <span className="iconify lucide--plus size-4.5"></span>
            <span className="text-base">Create Path</span>
          </button>
          <div className="from-primary to-secondary animate-background-shift absolute inset-x-0 top-1.5 -z-1 h-full bg-linear-to-r bg-[200%,200%] opacity-60 blur-md transition-all duration-300 group-hover:top-2 group-hover:opacity-80 group-hover:blur-lg"></div>
        </div>
      </div>
    </div>
  );
}
