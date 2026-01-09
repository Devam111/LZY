import React, { useState } from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import AccessRestriction from '../common/AccessRestriction';
import UpgradePopup from '../common/UpgradePopup';

const RevisionTool = () => {
  const { hasAccess, isFreeTrial } = useSubscription();
  // const [activeTab, setActiveTab] = useState('video-summary');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [selectedTool, setSelectedTool] = useState('video-summary');
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);

  const [aiTools] = useState([
    {
      id: 'video-summary',
      name: 'Video Summary Generator',
      description: 'Generate concise summaries from video content',
      icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
      color: 'red'
    },
    {
      id: 'pdf-summary',
      name: 'PDF Summary Generator',
      description: 'Extract key points from PDF documents',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: 'blue'
    },
    {
      id: 'ppt-summary',
      name: 'PPT Summary Generator',
      description: 'Summarize PowerPoint presentations',
      icon: 'M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2',
      color: 'purple'
    }
  ]);

  const [recentSummaries] = useState([
    {
      id: 1,
      title: 'React Hooks Tutorial Summary',
      type: 'video',
      date: '2024-01-15',
      content: 'Key concepts covered: useState, useEffect, useContext. Main takeaways: Hooks allow functional components to use state and lifecycle methods...'
    },
    {
      id: 2,
      title: 'JavaScript ES6 Features Summary',
      type: 'pdf',
      date: '2024-01-12',
      content: 'Important features: Arrow functions, destructuring, template literals, classes. ES6 introduced modern JavaScript syntax...'
    },
    {
      id: 3,
      title: 'CSS Grid Layout Summary',
      type: 'ppt',
      date: '2024-01-10',
      content: 'Grid system overview: grid-template-columns, grid-template-rows, grid-gap. CSS Grid provides powerful layout capabilities...'
    }
  ]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      setIsProcessing(true);
      
      // Simulate AI processing
      setTimeout(() => {
        setSummary(`Generated summary for ${file.name}:\n\nThis is a simulated AI-generated summary of the uploaded content. In a real implementation, this would contain actual AI-processed content including key points, main ideas, and important concepts extracted from the uploaded file.`);
        setIsProcessing(false);
      }, 3000);
    }
  };

  const handleGenerateSummary = () => {
    if (uploadedFile) {
      setIsProcessing(true);
      setTimeout(() => {
        setSummary(`Enhanced summary for ${uploadedFile.name}:\n\nThis is an enhanced AI-generated summary that includes:\n• Key concepts and main ideas\n• Important definitions and examples\n• Practical applications and use cases\n• Common pitfalls and best practices\n• Related topics for further study`);
        setIsProcessing(false);
      }, 2000);
    }
  };

  const getColorClasses = (color) => {
    const colorMap = {
      red: 'bg-red-100 text-red-600 border-red-200',
      blue: 'bg-blue-100 text-blue-600 border-blue-200',
      purple: 'bg-purple-100 text-purple-600 border-purple-200',
      green: 'bg-green-100 text-green-600 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200',
      indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const renderToolInterface = () => {
    switch (selectedTool) {
      case 'video-summary':
      case 'pdf-summary':
      case 'ppt-summary':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {aiTools.find(tool => tool.id === selectedTool)?.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload {selectedTool === 'video-summary' ? 'Video' : selectedTool === 'pdf-summary' ? 'PDF' : 'PowerPoint'} File
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="mt-4">
                      <p className="text-lg font-medium text-gray-900">Upload your file</p>
                      <p className="text-sm text-gray-500">
                        {selectedTool === 'video-summary' ? 'MP4, AVI, MOV files supported' :
                         selectedTool === 'pdf-summary' ? 'PDF files supported' :
                         'PPT, PPTX files supported'}
                      </p>
                    </div>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      accept={
                        selectedTool === 'video-summary' ? 'video/*' :
                        selectedTool === 'pdf-summary' ? '.pdf' :
                        '.ppt,.pptx'
                      }
                    />
                  </div>
                </div>

                {uploadedFile && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-2 text-green-700">{uploadedFile.name} uploaded successfully</span>
                    </div>
                  </div>
                )}

                {isProcessing && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-blue-700">AI is processing your file...</span>
                    </div>
                  </div>
                )}

                {summary && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-md font-medium text-gray-900">Generated Summary</h4>
                      <button
                        onClick={handleGenerateSummary}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
                      >
                        Enhance Summary
                      </button>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">{summary}</pre>
                    </div>
                    <div className="flex space-x-2">
                      <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                        Save Summary
                      </button>
                      <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
                        Create Flashcards
                      </button>
                      <button className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors">
                        Generate Quiz
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      // Removed flashcards, quiz-generator, and mind-map routes

      default:
        return null;
    }
  };

  // Show access restriction for free trial users
  if (isFreeTrial() && !hasAccess('aiTools')) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Learning Tools</h2>
          <p className="text-gray-600">Enhance your learning with AI-powered tools</p>
        </div>
        <AccessRestriction 
          feature="ai-tools"
          message="AI-powered learning tools are available with a paid subscription. Upgrade to access video summaries, PDF analysis, and presentation summaries."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">AI Learning Tools</h2>
        <p className="text-gray-600">Enhance your learning with AI-powered tools</p>
      </div>

      {/* Tool Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
        {aiTools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => {
              if (isFreeTrial() && !hasAccess('aiTools')) {
                setShowUpgradePopup(true);
                return;
              }
              setSelectedTool(tool.id);
            }}
            className={`w-full p-4 border-2 rounded-lg text-center transition-colors ${
              selectedTool === tool.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <svg className={`w-8 h-8 mx-auto mb-2 ${getColorClasses(tool.color).split(' ')[1]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tool.icon} />
            </svg>
            <span className="text-sm font-medium">{tool.name}</span>
          </button>
        ))}
      </div>

      {/* Tool Interface */}
      {renderToolInterface()}

      {/* Recent Summaries */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Summaries</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentSummaries.map((summary) => (
            <div key={summary.id} className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      summary.type === 'video' ? 'bg-red-100 text-red-800' :
                      summary.type === 'pdf' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {summary.type.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">{summary.date}</span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">{summary.title}</h4>
                  <p className="text-sm text-gray-600">{summary.content}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View
                  </button>
                  <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                    Export
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Popup */}
      <UpgradePopup
        isOpen={showUpgradePopup}
        onClose={() => setShowUpgradePopup(false)}
        message="AI-powered learning tools are available with a premium subscription. Upgrade to access video summaries, PDF analysis, and presentation summaries."
      />
    </div>
  );
};

export default RevisionTool;
