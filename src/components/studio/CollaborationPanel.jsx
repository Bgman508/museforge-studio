import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Check, X, Send } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function CollaborationPanel({ project, onClose }) {
  const [newComment, setNewComment] = useState("");
  const [commentBeat, setCommentBeat] = useState(0);
  const queryClient = useQueryClient();

  // Fetch collaboration session
  const { data: session } = useQuery({
    queryKey: ['collaboration', project?.id],
    queryFn: async () => {
      if (!project?.id) return null;
      const sessions = await base44.entities.CollaborationSession.filter({ project_id: project.id });
      return sessions[0] || null;
    },
    enabled: !!project?.id,
    refetchInterval: 3000 // Poll every 3 seconds for real-time-ish updates
  });

  // Create session if doesn't exist
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.CollaborationSession.create({
        project_id: project.id,
        active_users: [{
          email: user.email,
          full_name: user.full_name,
          last_seen: new Date().toISOString()
        }],
        comments: [],
        changes: []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', project?.id] });
    }
  });

  // Update presence
  const updatePresenceMutation = useMutation({
    mutationFn: async (cursorPos) => {
      if (!session) return;
      
      const user = await base44.auth.me();
      const activeUsers = session.active_users || [];
      
      const updatedUsers = activeUsers.filter(u => 
        u.email !== user.email && 
        new Date(u.last_seen) > new Date(Date.now() - 10000) // Remove stale users
      );
      
      updatedUsers.push({
        email: user.email,
        full_name: user.full_name,
        cursor_position: cursorPos,
        last_seen: new Date().toISOString()
      });

      await base44.entities.CollaborationSession.update(session.id, {
        active_users: updatedUsers
      });
    }
  });

  // Add comment
  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!session || !newComment.trim()) return;
      
      const user = await base44.auth.me();
      const comments = session.comments || [];
      
      comments.push({
        id: Date.now().toString(),
        user_email: user.email,
        user_name: user.full_name,
        timestamp: Date.now(),
        beat_position: commentBeat,
        text: newComment,
        resolved: false
      });

      await base44.entities.CollaborationSession.update(session.id, {
        comments
      });
      
      setNewComment("");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', project?.id] });
      toast.success("Comment added");
    }
  });

  // Resolve comment
  const resolveCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      if (!session) return;
      
      const comments = session.comments?.map(c => 
        c.id === commentId ? { ...c, resolved: true } : c
      );

      await base44.entities.CollaborationSession.update(session.id, {
        comments
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', project?.id] });
    }
  });

  // Create session on mount if needed
  useEffect(() => {
    if (project && !session) {
      createSessionMutation.mutate();
    }
  }, [project, session]);

  // Update presence periodically
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      updatePresenceMutation.mutate({ beat: 0, track: 0 });
    }, 5000);

    return () => clearInterval(interval);
  }, [session]);

  const activeUsers = session?.active_users?.filter(u => 
    new Date(u.last_seen) > new Date(Date.now() - 10000)
  ) || [];

  const comments = session?.comments?.filter(c => !c.resolved) || [];

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="w-80 bg-[#141416] border-l border-[#252529] flex flex-col"
    >
      <div className="h-14 bg-[#1C1C1F] border-b border-[#252529] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#00D9FF]" />
          <h3 className="font-semibold text-white">Collaboration</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-[#A1A1AA] hover:text-white"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Active Users */}
      <div className="p-4 border-b border-[#252529]">
        <h4 className="text-xs font-semibold text-[#A1A1AA] uppercase mb-3">
          Active Now ({activeUsers.length})
        </h4>
        <div className="space-y-2">
          <AnimatePresence>
            {activeUsers.map(user => (
              <motion.div
                key={user.email}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-[#00D9FF] animate-pulse" />
                <span className="text-sm text-white">{user.full_name}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Comments */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#252529]">
          <h4 className="text-xs font-semibold text-[#A1A1AA] uppercase mb-3">
            Comments ({comments.length})
          </h4>
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="Beat position"
              value={commentBeat}
              onChange={(e) => setCommentBeat(parseFloat(e.target.value))}
              className="bg-[#1C1C1F] border-[#252529] text-white text-sm"
            />
            <Textarea
              placeholder="Add a comment on the timeline..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="bg-[#1C1C1F] border-[#252529] text-white text-sm resize-none"
              rows={3}
            />
            <Button
              size="sm"
              onClick={() => addCommentMutation.mutate()}
              disabled={!newComment.trim()}
              className="w-full bg-[#00D9FF] hover:bg-[#00B8D4]"
            >
              <Send className="w-3 h-3 mr-2" />
              Add Comment
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {comments.map(comment => (
              <div
                key={comment.id}
                className="bg-[#1C1C1F] rounded-lg p-3 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">{comment.user_name}</div>
                    <div className="text-xs text-[#71717A]">
                      Beat {comment.beat_position} • {format(comment.timestamp, 'HH:mm')}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resolveCommentMutation.mutate(comment.id)}
                    className="text-[#00D9FF] hover:bg-[#252529]"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm text-[#A1A1AA]">{comment.text}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  );
}