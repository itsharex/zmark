import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../ui/button";

export const LoginButton = () => {
  const { login, loading, error } = useAuthStore();

  const handleLogin = async () => {
    await login();
    if (error) {
      toast.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleLogin}
        disabled={loading}
        className="w-full flex items-center gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <title>GitHub Icon</title>
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36.5-8 3C6.77 6.5 6.73 6.1 4 6.1c-2.25 0-4 1.75-4 4 0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
        )}
        {loading ? "正在登录..." : "使用 GitHub 登录"}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};
