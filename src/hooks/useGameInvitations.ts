import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface GameInvitation {
  id: string;
  from_user_id: string;
  from_user_name: string;
  to_user_id: string;
  to_user_name: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  updated_at: string;
}

export const useGameInvitations = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [pendingInvitations, setPendingInvitations] = useState<GameInvitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<GameInvitation[]>([]);
  const [acceptedInvitation, setAcceptedInvitation] = useState<GameInvitation | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch invitations
  const fetchInvitations = useCallback(async () => {
    if (!user) return;

    try {
      // Get pending invitations received
      const { data: received, error: receivedError } = await supabase
        .from('game_invitations')
        .select('*')
        .eq('to_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;
      setPendingInvitations((received || []) as GameInvitation[]);

      // Get sent invitations
      const { data: sent, error: sentError } = await supabase
        .from('game_invitations')
        .select('*')
        .eq('from_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;
      setSentInvitations((sent || []) as GameInvitation[]);
    } catch (err) {
      console.error('Error fetching invitations:', err);
    }
  }, [user]);

  // Send invitation to a player
  const sendInvitation = useCallback(async (toUserId: string, toUserName: string) => {
    if (!user || !profile) return false;

    setLoading(true);
    try {
      // Check if there's already a pending invitation
      const { data: existing } = await supabase
        .from('game_invitations')
        .select('id')
        .eq('from_user_id', user.id)
        .eq('to_user_id', toUserId)
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) {
        toast({
          title: "Invitation already sent",
          description: `You already have a pending invitation to ${toUserName}`,
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('game_invitations')
        .insert({
          from_user_id: user.id,
          from_user_name: profile.name,
          to_user_id: toUserId,
          to_user_name: toUserName,
        });

      if (error) throw error;

      toast({
        title: "Invitation sent!",
        description: `Waiting for ${toUserName} to respond...`,
      });

      fetchInvitations();
      return true;
    } catch (err) {
      console.error('Error sending invitation:', err);
      toast({
        title: "Failed to send invitation",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, profile, toast, fetchInvitations]);

  // Accept invitation
  const acceptInvitation = useCallback(async (invitationId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('game_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Invitation accepted!",
        description: "Starting the match...",
      });

      setAcceptedInvitation(data as GameInvitation);
      fetchInvitations();
      return data as GameInvitation;
    } catch (err) {
      console.error('Error accepting invitation:', err);
      toast({
        title: "Failed to accept invitation",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, fetchInvitations]);

  // Decline invitation
  const declineInvitation = useCallback(async (invitationId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('game_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Invitation declined",
      });

      fetchInvitations();
      return true;
    } catch (err) {
      console.error('Error declining invitation:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, fetchInvitations]);

  // Cancel sent invitation
  const cancelInvitation = useCallback(async (invitationId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('game_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Invitation cancelled",
      });

      fetchInvitations();
      return true;
    } catch (err) {
      console.error('Error cancelling invitation:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, fetchInvitations]);

  // Clear accepted invitation
  const clearAcceptedInvitation = useCallback(() => {
    setAcceptedInvitation(null);
  }, []);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    fetchInvitations();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('game-invitations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_invitations',
          filter: `to_user_id=eq.${user.id}`,
        },
        (payload) => {
          // Show toast for new invitations
          if (payload.eventType === 'INSERT') {
            const inv = payload.new as GameInvitation;
            toast({
              title: "New game invitation!",
              description: `${inv.from_user_name} wants to battle you!`,
            });
          }
          fetchInvitations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_invitations',
          filter: `from_user_id=eq.${user.id}`,
        },
        (payload) => {
          const inv = payload.new as GameInvitation;
          if (inv.status === 'accepted') {
            toast({
              title: "Invitation accepted!",
              description: `${inv.to_user_name} accepted your challenge!`,
            });
            setAcceptedInvitation(inv as GameInvitation);
          } else if (inv.status === 'declined') {
            toast({
              title: "Invitation declined",
              description: `${inv.to_user_name} declined your challenge.`,
              variant: "destructive",
            });
          }
          fetchInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchInvitations, toast]);

  return {
    pendingInvitations,
    sentInvitations,
    acceptedInvitation,
    loading,
    sendInvitation,
    acceptInvitation,
    declineInvitation,
    cancelInvitation,
    clearAcceptedInvitation,
    refresh: fetchInvitations,
  };
};
