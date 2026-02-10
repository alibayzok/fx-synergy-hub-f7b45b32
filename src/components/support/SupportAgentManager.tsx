import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, UserPlus, Trash2, Shield, Search } from 'lucide-react';

interface Agent {
  id: string;
  user_id: string;
  is_active: boolean;
}

interface Profile {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface SupportAgentManagerProps {
  agents: Agent[];
  agentProfiles: Record<string, Profile>;
  onRefresh: () => void;
  getUserName: (userId: string) => string;
}

const SupportAgentManager = ({ agents, agentProfiles, onRefresh, getUserName }: SupportAgentManagerProps) => {
  const [newAgentName, setNewAgentName] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const addAgent = async () => {
    if (!newAgentName.trim()) return;
    setAdding(true);
    setError('');
    const { data } = await supabase.from('profiles')
      .select('user_id')
      .or(`username.eq.${newAgentName.trim()},display_name.eq.${newAgentName.trim()}`)
      .limit(1);
    if (data && data.length > 0) {
      const existing = agents.find(a => a.user_id === data[0].user_id);
      if (existing) {
        setError('هذا المستخدم موظف دعم بالفعل');
      } else {
        await supabase.from('support_agents').insert({ user_id: data[0].user_id } as any);
        setNewAgentName('');
        onRefresh();
      }
    } else {
      setError('لم يتم العثور على المستخدم');
    }
    setAdding(false);
  };

  const removeAgent = async (agentId: string) => {
    await supabase.from('support_agents').delete().eq('id', agentId);
    onRefresh();
  };

  const toggleActive = async (agentId: string, currentState: boolean) => {
    await supabase.from('support_agents').update({ is_active: !currentState } as any).eq('id', agentId);
    onRefresh();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">إدارة موظفي الدعم</h2>
          <Badge variant="secondary" className="text-xs">{agents.length} موظف</Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          أضف أو أزل موظفي الدعم الفني. الموظفون النشطون فقط يمكنهم الوصول للوحة التحكم.
        </p>

        {/* Add Agent */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={newAgentName}
              onChange={e => { setNewAgentName(e.target.value); setError(''); }}
              placeholder="ابحث باسم المستخدم..."
              className="ps-9"
              onKeyDown={e => e.key === 'Enter' && addAgent()}
            />
          </div>
          <Button onClick={addAgent} disabled={!newAgentName.trim() || adding} className="gap-1.5">
            <UserPlus className="w-4 h-4" /> إضافة
          </Button>
        </div>
        {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
      </div>

      {/* Agent List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {agents.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Shield className="w-10 h-10 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">لم يتم إضافة موظفين بعد</p>
            </div>
          ) : agents.map(agent => {
            const profile = agentProfiles[agent.user_id];
            return (
              <div key={agent.id} className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/30 hover:bg-card/80 transition-colors">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{getUserName(agent.user_id)}</p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.username ? `@${profile.username}` : 'موظف دعم'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={agent.is_active ? 'default' : 'secondary'}
                  onClick={() => toggleActive(agent.id, agent.is_active)}
                  className="text-xs h-7"
                >
                  {agent.is_active ? 'نشط' : 'معطّل'}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => removeAgent(agent.id)}
                  className="h-7 w-7 text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SupportAgentManager;
