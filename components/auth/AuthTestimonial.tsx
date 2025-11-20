// Testimonial component for auth pages (login/register)
// Currently commented out in auth/layout.tsx until we have real testimonials
// To re-enable: uncomment the <AuthTestimonial /> line in app/auth/layout.tsx

export const AuthTestimonial = () => {
  return (
    <div className="rounded-box border border-base-300 bg-base-100/40 p-5 backdrop-blur-md">
      <p className="text-sm">
        "ViaProto transformed how I learn. No more wasting time searching for resources - everything I need is curated and organized."
      </p>
      <div className="mt-3 flex items-end gap-3">
        <div className="avatar">
          <div className="mask mask-circle size-10 bg-gradient-to-br from-primary to-secondary p-0.5">
            <div className="bg-base-100 mask mask-circle size-full flex items-center justify-center">
              <span className="text-lg font-bold">A</span>
            </div>
          </div>
        </div>
        <div className="grow">
          <p className="text-base font-medium">Alex Chen</p>
          <p className="text-sm leading-none opacity-80">Software Developer</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="iconify lucide--star size-4 text-warning fill-warning"></span>
          <span className="iconify lucide--star size-4 text-warning fill-warning"></span>
          <span className="iconify lucide--star size-4 text-warning fill-warning"></span>
          <span className="iconify lucide--star size-4 text-warning fill-warning"></span>
          <span className="iconify lucide--star size-4 text-warning fill-warning"></span>
        </div>
      </div>
    </div>
  );
};
