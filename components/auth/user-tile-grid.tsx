import { useTranslations } from "next-intl";
import { UserTile } from "@/components/auth/user-tile";
import type { UserTileGridProps } from "@/types";

export function UserTileGrid({ users, onSelect }: UserTileGridProps) {
  const t = useTranslations("auth");

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div className="text-center">
        <h1 className="text-h1">{t("chooseUserTitle")}</h1>
        <p className="text-body text-muted-foreground">{t("chooseUserSubtitle")}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {users.map((user) => (
          <UserTile key={user.id} user={user} onSelect={() => onSelect(user)} />
        ))}
      </div>
    </div>
  );
}
