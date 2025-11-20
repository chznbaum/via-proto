import config from "@/config";

type ILogo = {
  className?: string;
};

export const Logo = ({ className }: ILogo) => {
  return (
    <div className={`font-bold text-xl ${className ?? ""}`}>
      {config.appName}
    </div>
  );
};
