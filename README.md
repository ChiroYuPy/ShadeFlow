# ShadeFlow

A node-based shader editor built with React, ReactFlow, and WebGPU.

## Live Demo

🌐 **[ShadeFlow Live Demo](https://chiroyupy.github.io/ShadeFlow/)**

## Features

- **Visual Node Editor**: Create complex shaders by connecting nodes
- **Categorized Nodes**: Organized into Constant, Arithmetic, Math, Trigonometry, Logic, Vector, Matrix, and Input categories
- **Real-time Editing**: Edit values with keyboard shortcuts (Enter to save, Escape to cancel)
- **Type Validation**: Prevents invalid connections between different shader types
- **WGSL Code Generation**: Export your node graph to WGSL shader code
- **Dark Theme UI**: Modern and intuitive dark interface

## How to Use

### Creating Nodes
- **Right-click on canvas**: Open the node selector modal
- **Select a category**: Browse nodes by category in the left sidebar
- **Click a node**: Add it to the canvas

### Moving Nodes
- **Click and drag the header**: Move individual nodes
- **Drag on canvas**: Pan the view
- **Scroll**: Zoom in/out

### Editing Node Values
- **Click on values**: Open the value editor
- **Type new values**: Edit in real-time
- **Enter**: Save and move to next field (or close if last field)
- **Escape**: Cancel and close without saving

### Connecting Nodes
- **Drag from output port**: Start a connection
- **Drop on input port**: Complete the connection
- Connections are type-validated automatically

### Managing Nodes
- **Select node**: Click on a node
- **Select multiple**: Shift+click or drag selection box
- **Delete selected**: Delete or Backspace key
- **Duplicate**: Ctrl+D
- **Right-click on node**: Context menu with options

### Exporting
- **Save Graph**: Download your graph as JSON
- **Load Graph**: Import a previously saved graph
- **Compile WGSL**: Generate WGSL shader code from your graph (check console)

## Tech Stack

- **React 19** - UI framework
- **ReactFlow 11** - Node-based editor
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **Vite** - Build tool
- **WebGPU** - GPU compute (future implementation)

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## License

MIT
