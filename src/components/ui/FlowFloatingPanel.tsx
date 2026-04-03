type PanelProps = {
    saveGraph: () => void;
    loadGraph: (json: string) => void;
    compileWGSL: () => void;
};

export default function FlowFloatingPanel({ saveGraph, loadGraph, compileWGSL }: PanelProps) {
    return (
        <div className="absolute top-4 left-4 flex flex-col gap-2 bg-zinc-800 p-2 rounded">
            <button onClick={saveGraph} className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-white text-sm font-medium transition-colors">
                Save
            </button>
            <button
                onClick={() => {
                    const json = prompt('Paste JSON here');
                    if (json) loadGraph(json);
                }}
                className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-white text-sm font-medium transition-colors"
            >
                Load
            </button>
            <button onClick={compileWGSL} className="bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded text-white text-sm font-medium transition-colors">
                Compile WGSL
            </button>
        </div>
    );
}
