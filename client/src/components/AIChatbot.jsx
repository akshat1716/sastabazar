const AIChatbot = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white border border-aura-200 rounded-lg shadow-lg z-50">
      <div className="p-4 border-b border-aura-200">
        <h3 className="font-semibold">AI Assistant</h3>
        <button onClick={onClose} className="float-right">×</button>
      </div>
      <div className="p-4">
        <p className="text-aura-600">AI chatbot coming soon!</p>
      </div>
    </div>
  )
}

export default AIChatbot
