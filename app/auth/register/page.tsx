import { RegisterForm } from "./RegisterForm";

const RegisterPage = () => {
  return (
    <div>
      <div className="text-center">
        <p className="text-xl font-semibold md:text-2xl">Join ViaProto Today</p>
        <p className="text-base-content/80 text-sm">
          Start your personalized learning journey in seconds
        </p>
      </div>
      <div className="mt-8">
        <RegisterForm />
      </div>
    </div>
  );
};

export default RegisterPage;
