import { FastForward, Github, Loader2, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";

export const LoginButton = () => {
  const { login, loading, error, sendLoginMagicLink } = useAuthStore();

  const [email, setEmail] = useState("");

  const normalizedEmail = useMemo(() => email.trim(), [email]);

  const handleGithubLogin = async () => {
    const err = await login();
    if (err) toast.error(err);
  };

  const handleMagicLink = async () => {
    const err = await sendLoginMagicLink(normalizedEmail);
    if (err) {
      toast.error(err);
      return;
    }
    toast.success("登录链接已发送，请在邮箱中点击完成认证");
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
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="m@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="bg-background border-border/60"
        />
        <Button
          type="button"
          onClick={handleMagicLink}
          disabled={loading || !normalizedEmail}
          size="icon"
          variant="outline"
          aria-label="发送登录链接"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send />}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Separator className="flex-1" />
        <div className="text-xs text-muted-foreground">OR</div>
        <Separator className="flex-1" />
      </div>

      <div className="flex justify-center gap-2">
        <Button
          type="button"
          onClick={handleGithubLogin}
          disabled={loading}
          size="icon"
          variant="outline"
          className="rounded-full"
          aria-label="使用 GitHub 登录"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github />}
        </Button>

        {import.meta.env.DEV && (
          <Button
            type="button"
            onClick={handleDevSkip}
            disabled={loading}
            size="icon"
            variant="outline"
            className="rounded-full border-dashed border-primary/50 text-primary hover:bg-primary/5"
            aria-label="开发环境免登"
          >
            <FastForward />
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};
