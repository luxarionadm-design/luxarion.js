import React, { useState } from 'react';
import { Folder, FolderOpen, FileCode, Search, Copy, Check, Info, FileText } from 'lucide-react';
import { FileNode } from '../types';
import { luxarionTree } from '../data/luxarionStructure';

export const ArchitectureExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [expandedDirs, setExpandedDirs] = useState<{ [key: string]: boolean }>({
    '/': true,
    '/src': true,
    '/src/core': true,
    '/src/core/renderers': true,
    '/src/core/nodes': true,
  });

  const [searchQuery, setSearchQuery] = useState<string>('');

  const toggleDir = (path: string) => {
    setExpandedDirs((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const handleSelectFile = (node: FileNode) => {
    setSelectedFile(node);
    setCopied(false);
  };

  const handleCopy = () => {
    if (!selectedFile || !selectedFile.codeSnippet) return;
    navigator.clipboard.writeText(selectedFile.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Directory node render loop recursor
  const renderTree = (node: FileNode, level = 0) => {
    const isDir = node.type === 'directory';
    const isExpanded = expandedDirs[node.path];

    // Filter matching queries
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const nodeMatches = node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q);
      
      // If it is a directory, check if children match
      if (isDir && node.children) {
        const matchingChildren = node.children.some((c) => {
          const matchInside = c.name.toLowerCase().includes(q) || c.path.toLowerCase().includes(q);
          if (matchInside) return true;
          if (c.children) {
            // Check deeper nests
            return JSON.stringify(c.children).toLowerCase().includes(q);
          }
          return false;
        });

        if (!nodeMatches && !matchingChildren) return null;
      } else {
        if (!nodeMatches) return null;
      }
    }

    return (
      <div key={node.path} className="select-none">
        <div
          style={{ paddingLeft: `${level * 16}px` }}
          onClick={() => {
            if (isDir) {
              toggleDir(node.path);
            } else {
              handleSelectFile(node);
            }
          }}
          className={`group flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-gray-900 transition cursor-pointer text-xs ${
            selectedFile?.path === node.path ? 'bg-purple-950/20 border-l-2 border-purple-500 text-purple-300 font-semibold' : 'text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {isDir ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-purple-400 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-purple-400 shrink-0" />
              )
            ) : (
              <FileCode className="w-4 h-4 text-gray-400 shrink-0" />
            )}
            <span className="font-mono text-[11px] truncate">{node.name}</span>
          </div>
          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-500 font-mono">
            {isDir ? 'dir' : 'view'}
          </span>
        </div>

        {isDir && isExpanded && node.children && (
          <div className="mt-0.5">
            {node.children.map((child) => renderTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="architecture-explorer" className="grid grid-cols-1 lg:grid-cols-12 bg-[#09090e] border border-gray-800 rounded-xl overflow-hidden shadow-2xl h-full min-h-[450px]">
      {/* Search and tree view pane (Left) */}
      <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-gray-850 bg-[#06060a] p-4 flex flex-col overflow-hidden">
        <div className="mb-4">
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-widest font-sans flex items-center gap-1.5">
            <FolderOpen className="w-4 h-4 text-purple-400" />
            Luxarion Core Architecture
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Explore and inspect the modular directory layout layout of the Luxarion engine.
          </p>
        </div>

        {/* Search Input filter */}
        <div className="relative mb-3.5">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
            <Search className="w-3.5 h-3.5 text-gray-500" />
          </span>
          <input
            type="text"
            placeholder="Search files/folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0a0f] border border-gray-800 rounded-lg text-xs font-mono text-gray-300 pl-8 pr-3 py-2 focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        {/* Dynamic Nested Tree list */}
        <div className="flex-1 overflow-y-auto pr-1 bg-black/20 p-2.5 border border-gray-900 rounded-lg max-h-[350px] lg:max-h-[500px]">
          {renderTree(luxarionTree)}
        </div>
      </div>

      {/* Code Inspector pane (Right) */}
      <div className="lg:col-span-7 flex flex-col bg-[#07070b] overflow-hidden">
        {selectedFile ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Explorer Code Header */}
            <div className="p-4 bg-[#0d0d14] border-b border-gray-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-mono text-gray-200 font-bold">{selectedFile.name}</span>
              </div>
              {selectedFile.codeSnippet && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition bg-[#141420] border border-gray-800 text-[10px] px-2.5 py-1 rounded"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy Boilerplate
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Description section */}
            {selectedFile.description && (
              <div className="p-3.5 bg-purple-950/5 border-b border-gray-850 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400 leading-normal font-sans">
                  {selectedFile.description}
                </p>
              </div>
            )}

            {/* Code presentation output styled with beautiful mock highlight keywords */}
            <div className="flex-1 p-4 bg-[#050509] overflow-auto font-mono text-[11px] leading-relaxed text-gray-300">
              {selectedFile.codeSnippet ? (
                <pre className="select-all block pr-4">
                  {selectedFile.codeSnippet}
                </pre>
              ) : (
                <div className="text-gray-500 italic h-full flex items-center justify-center">
                  This core file is empty or is a binary asset placeholder.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none text-gray-500 bg-[#050508]">
            <FileText className="w-12 h-12 text-gray-700 mb-2.5" />
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest font-sans">
              No File Selected for Inspection
            </h4>
            <p className="text-[11px] text-gray-500 mt-1 max-w-xs font-sans">
              Click any individual file node in the core architecture tree to view descriptions, parameters, and boilerplate code templates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
