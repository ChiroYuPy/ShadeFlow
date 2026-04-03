import { useEffect, useState, useCallback, useRef } from 'react';
import { nodeCategories } from '../nodes/NodeRegistry';
import NodeIcon, { getCategoryIcon } from '../nodes/NodeIcon';

export interface NodeSelectorModalProps {
  onSelectNode: (nodeType: string) => void;
  onClose: () => void;
}

export default function NodeSelectorModal({ onSelectNode, onClose }: NodeSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const nodesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Backspace' && searchQuery === '') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, searchQuery]);

  const handleSelectNode = useCallback((nodeType: string) => {
    onSelectNode(nodeType);
    onClose();
  }, [onSelectNode, onClose]);

  const scrollToCategory = useCallback((categoryName: string) => {
    const element = document.getElementById(`category-${categoryName}`);
    if (element && nodesContainerRef.current) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setSelectedCategory(categoryName);
    }
  }, []);

  const filteredCategories = nodeCategories.map(category => ({
    ...category,
    nodes: category.nodes.filter(node =>
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.nodes.length > 0);

  // Sélectionner la première catégorie par défaut
  useEffect(() => {
    if (filteredCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(filteredCategories[0].name);
    }
  }, [filteredCategories.length, selectedCategory]);

  // Détecter quelle catégorie est visible lors du scroll
  useEffect(() => {
    const nodesContainer = nodesContainerRef.current;
    if (!nodesContainer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Trouver la catégorie la plus visible
        let maxRatio = 0;
        let mostVisibleCategory = null;

        entries.forEach((entry) => {
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            mostVisibleCategory = entry.target.id.replace('category-', '');
          }
        });

        if (mostVisibleCategory) {
          setSelectedCategory(mostVisibleCategory);
        }
      },
      {
        root: nodesContainer,
        rootMargin: '-45% 0px -45% 0px', // Déclenche quand la catégorie est proche du centre
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    );

    // Observer toutes les catégories
    const categoryElements = nodesContainer.querySelectorAll('[id^="category-"]');
    categoryElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [filteredCategories]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-dark-bg border border-dark-border rounded-lg shadow-2xl w-[480px] max-h-[480px] flex flex-col overflow-hidden node-selector-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-dark-border bg-dark-bg-elevated">
          <h2 className="text-lg font-semibold text-dark-text mb-3">Add Node</h2>
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-dark-text placeholder-dark-text-muted focus:outline-none focus:border-dark-accent text-sm"
            autoFocus
          />
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar - Categories */}
          <div className="w-40 border-r p-2 border-dark-border bg-zinc-900 overflow-y-auto">
              {filteredCategories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => scrollToCategory(category.name)}
                  className={`w-full px-2 py-1.5 text-left rounded mb-1 transition-colors flex items-center ${
                    selectedCategory === category.name
                      ? 'bg-dark-accent text-white'
                      : 'text-dark-text hover:bg-dark-bg-hover'
                  }`}
                >
                  {getCategoryIcon(category.name)}
                  <div className="flex-1 min-w-0 ml-2">
                    <div className="text-sm font-medium truncate">{category.name}</div>
                    <div className="text-xs text-dark-text-muted mt-0.5">
                      {category.nodes.length} nodes
                    </div>
                  </div>
                </button>
              ))}
          </div>

          {/* Right side - Nodes list */}
          <div
            ref={nodesContainerRef}
            className="flex-1 overflow-y-auto scroll-smooth"
          >
            {filteredCategories.map((category) => (
              <div
                key={category.name}
                id={`category-${category.name}`}
                className="mb-6"
              >
                <div className="px-3 py-2 text-sm font-semibold text-dark-text-muted uppercase tracking-wide mb-2 sticky top-0 bg-dark-bg z-10">
                  {category.name}
                </div>
                <div className="space-y-1">
                  {category.nodes.map((node) => (
                    <button
                      key={node.type}
                      onClick={() => handleSelectNode(node.type)}
                      className="w-full px-3 py-2 text-left rounded hover:bg-dark-bg-hover transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <NodeIcon type={node.type} size={32} variant="ui" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-dark-text">
                              {node.label}
                            </div>
                            {node.description && (
                              <div className="text-xs text-dark-text-muted">
                                {node.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-dark-text-muted opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {filteredCategories.length === 0 && (
              <div className="text-center py-8 text-dark-text-muted">
                No nodes found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
