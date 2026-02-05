import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Music4, FolderOpen, Sparkles } from "lucide-react";

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <style>{`
        :root {
          --neon-blue: #00D9FF;
          --neon-gold: #FFB800;
          --bg-darker: #0A0A0B;
          --bg-dark: #141416;
          --bg-mid: #1C1C1F;
          --bg-light: #252529;
          --text-primary: #FFFFFF;
          --text-secondary: #A1A1AA;
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: var(--bg-light) var(--bg-dark);
        }
        
        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        *::-webkit-scrollbar-track {
          background: var(--bg-dark);
        }
        
        *::-webkit-scrollbar-thumb {
          background: var(--bg-light);
          border-radius: 4px;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background: var(--bg-mid);
        }

        .glow-blue {
          box-shadow: 0 0 20px rgba(0, 217, 255, 0.3);
        }
        
        .glow-gold {
          box-shadow: 0 0 20px rgba(255, 184, 0, 0.3);
        }
      `}</style>

      <nav className="h-14 bg-[#141416] border-b border-[#252529] flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link to={createPageUrl("Studio")} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#00D9FF] to-[#FFB800] rounded-lg flex items-center justify-center">
              <Music4 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">MuseForge Studio</span>
          </Link>
          
          <div className="flex items-center gap-1">
            <Link 
              to={createPageUrl("Studio")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === createPageUrl("Studio") 
                  ? "bg-[#1C1C1F] text-white" 
                  : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              Studio
            </Link>
            <Link 
              to={createPageUrl("Projects")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === createPageUrl("Projects") 
                  ? "bg-[#1C1C1F] text-white" 
                  : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              <FolderOpen className="w-4 h-4 inline mr-2" />
              Projects
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-[#A1A1AA]">
            AI Music Generation Platform
          </div>
        </div>
      </nav>

      {children}
    </div>
  );
}