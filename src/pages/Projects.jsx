import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Music4, Download, Trash2, Play } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Projects() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['midi-projects'],
    queryFn: () => base44.entities.MIDIProject.list('-created_date'),
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MIDIProject.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['midi-projects'] });
      toast.success("Project deleted");
    }
  });

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Projects</h1>
            <p className="text-[#A1A1AA]">All your music compositions</p>
          </div>
          <Button
            onClick={() => navigate(createPageUrl("Studio"))}
            className="bg-gradient-to-r from-[#00D9FF] to-[#FFB800] hover:opacity-90 text-white"
          >
            <Music4 className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <Card key={i} className="bg-[#141416] border-[#252529] animate-pulse">
                <CardHeader className="h-32 bg-[#1C1C1F]" />
                <CardContent className="p-4">
                  <div className="h-4 bg-[#1C1C1F] rounded mb-2" />
                  <div className="h-3 bg-[#1C1C1F] rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#00D9FF] to-[#FFB800] opacity-20 flex items-center justify-center">
              <Music4 className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Projects Yet</h3>
            <p className="text-[#A1A1AA] mb-6">Start creating music with AI</p>
            <Button
              onClick={() => navigate(createPageUrl("Studio"))}
              className="bg-gradient-to-r from-[#00D9FF] to-[#FFB800] hover:opacity-90 text-white"
            >
              Create Your First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <Card key={project.id} className="bg-[#141416] border-[#252529] hover:border-[#00D9FF] transition-all group">
                <CardHeader className="relative h-32 bg-gradient-to-br from-[#00D9FF]/20 to-[#FFB800]/20 border-b border-[#252529] flex items-center justify-center">
                  <Music4 className="w-12 h-12 text-white opacity-50" />
                  <div className="absolute top-2 right-2 bg-[#1C1C1F] rounded-full px-3 py-1 text-xs text-[#00D9FF] font-mono">
                    {project.tempo} BPM
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-white mb-1 truncate">{project.name}</h3>
                  <p className="text-xs text-[#A1A1AA] mb-2 line-clamp-2">{project.prompt}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-[#1C1C1F] text-[#FFB800] px-2 py-1 rounded">
                      {project.genre?.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-[#71717A]">
                      {format(new Date(project.created_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-[#1C1C1F] border-[#252529] hover:bg-[#252529] text-white"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Open
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-[#1C1C1F] border-[#252529] hover:bg-[#252529] text-white"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(project.id)}
                      className="bg-[#1C1C1F] border-[#252529] hover:bg-[#EF4444] hover:border-[#EF4444] text-white"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}