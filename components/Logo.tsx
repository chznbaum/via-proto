import config from "@/config";

type ILogo = {
  className?: string;
};

export const Logo = ({ className }: ILogo) => {
  return (
    <span className={`font-serif text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ${className ?? ""}`}>
      {config.appName}
    </span>
  );
};
