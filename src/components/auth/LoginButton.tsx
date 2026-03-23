import { Code, Github, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";
import { Button } from "../ui/button";

export const LoginButton = () => {
  const { login, loading, error } = useAuthStore();

  const handleLogin = async () => {
    await login();
    if (error) {
      toast.error(error);
    }
  };

  const handleDevSkip = () => {
    useAuthStore.setState({
      session: {
        access_token: "dev-token",
        refresh_token: "dev-refresh-token",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: "bearer",
        user: {
          id: "dev-user-id",
          aud: "authenticated",
          role: "authenticated",
          email: "dev@example.com",
          app_metadata: {
            provider: "email",
            providers: ["email"],
          },
          user_metadata: {
            avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
            email: "dev@example.com",
            email_verified: true,
            full_name: "Dev User",
            iss: "https://api.github.com",
            name: "Dev User",
            phone_verified: false,
            preferred_username: "devuser",
            provider_id: "1",
            sub: "1",
            user_name: "devuser",
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      user: {
        id: "dev-user-id",
        email: "dev@example.com",
        name: "Dev User",
        avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
        user_name: "devuser",
      },
    });
    toast.success("已跳过登录 (Dev)");
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleLogin}
        disabled={loading}
        variant="secondary"
        className="w-full"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github />}
        {loading ? "正在登录..." : "使用 GitHub 登录"}
      </Button>

      {import.meta.env.DEV && (
        <Button
          onClick={handleDevSkip}
          disabled={loading}
          variant="secondary"
          className="w-full mt-2 border-dashed border-primary/50 text-primary hover:bg-primary/5"
        >
          <Code className="h-4 w-4 mr-2" />
          开发环境免登
        </Button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};
