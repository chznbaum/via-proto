export const ExamplePath = () => {
    return (
      <div
        className="group/section relative z-10 container mx-auto max-w-7xl scroll-mt-12 py-8 md:py-12 lg:py-16 2xl:py-28"
        id="features">
        <p className="group-hover/section:text-primary text-base-content/60 text-center text-[12px] font-medium tracking-[1px] uppercase transition-all duration-300 group-hover/section:tracking-[2px]">
          Personalized Curriculum
        </p>
        <h2 className="mt-2 text-center text-2xl font-semibold sm:text-3xl">Everything you need, nothing you don’t</h2>
        <div className="mt-2 flex justify-center text-center">
            <p className="text-base-content/80 max-w-lg">
              Learning paths take your starting point into consideration so they always feel tailored to meet your specific needs.
            </p>
        </div>
        <div className="mt-8">
          <div className="mockup-browser border border-base-300 bg-base-100 max-w-7xl mx-auto rounded-[9px]">
            {/* Browser toolbar */}
            <div className="mockup-browser-toolbar">
              <div className="input border-base-300 flex-1">https://viapro.to/paths/this-could-be-yours</div>
            </div>

            {/* Scrollable content area */}
            <div className="px-8 py-6 bg-base-200 h-96 overflow-y-auto">
              <p className="mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
              </p>
              <p className="mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante.
              </p>
              <p className="mb-4">
                Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra.
              </p>
              <p className="mb-4">
                Vestibulum erat wisi, condimentum sed, commodo vitae, ornare sit amet, wisi. Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui.
              </p>
              <p className="mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Integer quis auctor elit sed vulputate mi sit amet mauris.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
};
