import Link from "next/link";
import { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
// import { AuthTestimonial } from "@/components/auth/AuthTestimonial";

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="grid h-screen lg:place-items-center lg:py-5">
      <div className="fixed inset-0 -z-20 bg-[url('https://cdn.viapro.to/images/pages/squares-background.png')] opacity-2 dark:invert"></div>
      <div className="fixed inset-0 -z-19 bg-[url('https://cdn.viapro.to/images/pages/mesh-background.jpg')] [background-size:110%] object-fill opacity-2"></div>
      <div className="to-base-100 fixed inset-0 top-2/5 -z-1 bg-linear-to-b from-transparent"></div>
      <div className="bg-base-100 card p-6 min-lg:shadow">
        <div className="flex gap-6 2xl:gap-8">
          <div className="relative max-lg:hidden">
            {/* Side image with testimonial */}
            <div className="rounded-box h-full w-110 bg-gradient-to-br from-primary/20 to-secondary/20 p-8 flex flex-col justify-between">
              <div>
                <div className="badge badge-primary badge-sm">ViaProto</div>
                <h3 className="text-2xl font-bold mt-4">
                  Start Learning Smarter Today
                </h3>
                <p className="text-base-content/80 mt-2">
                  Join thousands of learners who are mastering new skills with AI-powered learning paths.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div>
                  <p className="text-3xl font-bold">60s</p>
                  <p className="text-sm text-base-content/70">Avg. Path Generation</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">100%</p>
                  <p className="text-sm text-base-content/70">Real Content</p>
                </div>
              </div>

              {/* Testimonial - Uncomment when you have real testimonials */}
              {/* <div className="mt-8">
                <AuthTestimonial />
              </div> */}
            </div>
          </div>
          <div className="grow lg:w-sm">
            <div className="flex items-center justify-between">
              <Link href="/">
                <span className="font-serif text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  ViaPro.to
                </span>
              </Link>
              <ThemeToggle className="btn btn-circle btn-sm btn-ghost" />
            </div>
            <div className="mt-8 2xl:mt-12">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
