import React from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useWorkspaceMembers } from "../hooks/useWorkspaceMembers";
import { useUpdateMemberRole } from "../hooks/useUpdateMemberRole";
import { useRemoveMember } from "../hooks/useRemoveMember";
import { useWhatsappPrefs } from "../hooks/useWhatsappPrefs";
import { useSaveWhatsappPrefs } from "../hooks/useSaveWhatsappPrefs";
import { MembersPanel } from "../components/settings/MembersPanel";
import { WhatsappPrefsPanel } from "../components/settings/WhatsappPrefsPanel";

export function Settings() {
  const { workspaceId } = useParams(); // ID da URL

  const membersQ = useWorkspaceMembers(workspaceId);
  const updateRole = useUpdateMemberRole(workspaceId);
  const removeMember = useRemoveMember(workspaceId);

  const prefsQ = useWhatsappPrefs(workspaceId);
  const savePrefs = useSaveWhatsappPrefs(workspaceId);

  if (membersQ.error) toast.error(membersQ.error.message);
  if (prefsQ.error) toast.error(prefsQ.error.message);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-text">Configurações</div>
        <div className="text-sm text-muted">Gerencie membros e integrações do workspace.</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MembersPanel membersQ={membersQ} updateRole={updateRole} removeMember={removeMember} />
        <WhatsappPrefsPanel prefsQ={prefsQ} savePrefs={savePrefs} />
      </div>
    </div>
  );
}