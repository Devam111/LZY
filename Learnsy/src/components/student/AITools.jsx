import React, { useState, useEffect, useRef, useMemo } from 'react';
import { aiToolsAPI } from '../../api/aiTools';
import { useSubscription } from '../../context/SimpleSubscriptionContext';
import AccessRestriction from '../common/AccessRestriction';
import UpgradePopup from '../common/UpgradePopup';

let pdfLibPromise = null;
let jsZipPromise = null;
let xmlParserPromise = null;

const loadPdfLib = async () => {
  if (!pdfLibPromise) {
    pdfLibPromise = Promise.all([
      import('pdfjs-dist/build/pdf'),
      import('pdfjs-dist/build/pdf.worker?url')
    ]).then(([pdfModule, worker]) => {
      const pdfjsLib = pdfModule;
      pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjsLib;
    });
  }
  return pdfLibPromise;
};

const loadJSZip = async () => {
  if (!jsZipPromise) {
    jsZipPromise = import('jszip').then(mod => mod.default);
  }
  return jsZipPromise;
};

const loadXMLParser = async () => {
  if (!xmlParserPromise) {
    xmlParserPromise = import('fast-xml-parser').then(mod => mod.XMLParser);
  }
  return xmlParserPromise;
};

const AITools = () => {
  const { hasAccess, isFreeTrial } = useSubscription();
  const [activeTool, setActiveTool] = useState('video');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [summaries, setSummaries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [localSummary, setLocalSummary] = useState(null);
  const [processingMessage, setProcessingMessage] = useState('');
  const fileInputRef = useRef(null);

  const summaryToolLabels = useMemo(() => ({
    video: 'Video Summary Generator',
    pdf: 'PDF Summary Generator',
    ppt: 'PPT Summary Generator'
  }), []);

  // Load summaries and stats on component mount
  useEffect(() => {
    loadSummaries();
    loadStats();
  }, []);

  const loadSummaries = async () => {
    try {
      setIsLoading(true);
      const response = await aiToolsAPI.getMySummaries();
      if (response && response.success) {
        setSummaries(response.summaries || []);
      }
    } catch (error) {
      console.error('Error loading summaries:', error);
      setError('Failed to load summaries');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await aiToolsAPI.getStats();
      if (response && response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check if user has access to AI tools
      if (isFreeTrial() && !hasAccess('aiTools')) {
        setShowUpgradePopup(true);
        return;
      }
      setSelectedFile(file);
      setError(null);
      setLocalSummary(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    if (!activeTool) {
      setError('Please select a tool type');
      return;
    }

    // Check if user has access to AI tools
    if (isFreeTrial() && !hasAccess('aiTools')) {
      setShowUpgradePopup(true);
      return;
    }

    if (activeTool === 'video') {
      await uploadThroughAPI();
    } else {
      await generateSummaryLocally();
    }
  };

  const uploadThroughAPI = async () => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      console.log('Uploading file:', {
        fileName: selectedFile.name,
        fileType: activeTool,
        fileSize: selectedFile.size
      });

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await aiToolsAPI.uploadFile(selectedFile, activeTool);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response && response.success) {
        alert('File uploaded successfully! AI processing has started. Check back in a few minutes for your summary.');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setTimeout(() => {
          loadSummaries();
          loadStats();
        }, 2000);
      } else {
        setError(response?.message || 'Upload failed. Please try again.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const summarizeText = (text, maxSentences = 6) => {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (!cleaned) {
      throw new Error('Unable to extract readable text from this file.');
    }
    const sentences = cleaned.split(/(?<=[.?!])\s+(?=[A-Z0-9])/).filter(Boolean);
    return {
      summaryText: sentences.slice(0, maxSentences).join(' '),
      highlights: sentences.slice(0, Math.min(8, sentences.length)).map(sentence => sentence.trim())
    };
  };

  const extractKeywords = (text, limit = 6) => {
    const words = (text.toLowerCase().match(/\b[a-z]{5,}\b/g) || []).filter(word => !['slides', 'chapter', 'section', 'content'].includes(word));
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  };

  const processPdfLocally = async (file) => {
    const pdfjsLib = await loadPdfLib();
    setProcessingMessage('Extracting text from PDF pages...');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      setProcessingMessage(`Reading page ${pageNumber} of ${pdf.numPages}...`);
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      text += `${pageText}\n`;
    }
    return { text, meta: { pages: pdf.numPages } };
  };

  const processPptLocally = async (file) => {
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pptx') && !fileName.endsWith('.ppsx')) {
      throw new Error('Only PPTX/PPSX files are supported for instant summaries.');
    }

    const JSZip = await loadJSZip();
    const XMLParser = await loadXMLParser();
    setProcessingMessage('Unpacking presentation slides...');
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slideFiles = Object.keys(zip.files)
      .filter(path => path.startsWith('ppt/slides/slide') && path.endsWith('.xml'))
      .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

    if (!slideFiles.length) {
      throw new Error('No slides were found in this presentation.');
    }

    const parser = new XMLParser({ ignoreAttributes: false });
    const textSegments = [];

    for (const slidePath of slideFiles) {
      setProcessingMessage(`Scanning ${slidePath.replace('ppt/slides/', '')}...`);
      const xml = await zip.files[slidePath].async('string');
      const matches = xml.match(/<a:t[^>]*>(.*?)<\/a:t>/g);
      if (matches && matches.length) {
        matches.forEach(match => {
          const cleaned = match.replace(/<\/?a:t[^>]*>/g, '');
          if (cleaned.trim()) {
            textSegments.push(cleaned.trim());
          }
        });
        continue;
      }

      const parsed = parser.parse(xml);
      const collectText = (node) => {
        if (!node || typeof node !== 'object') return;
        if (node['a:t']) {
          const raw = Array.isArray(node['a:t']) ? node['a:t'].join(' ') : node['a:t'];
          if (raw.trim()) {
            textSegments.push(raw.trim());
          }
        }
        Object.values(node).forEach(child => collectText(child));
      };
      collectText(parsed);
    }

    if (!textSegments.length) {
      throw new Error('We could not extract readable text from this PPT.');
    }

    return { text: textSegments.join(' '), meta: { slides: slideFiles.length } };
  };

  const generateSummaryLocally = async () => {
    try {
      setIsUploading(true);
      setProcessingMessage('Preparing file for instant AI summary...');
      setError(null);

      const result = activeTool === 'pdf'
        ? await processPdfLocally(selectedFile)
        : await processPptLocally(selectedFile);

      const { summaryText, highlights } = summarizeText(result.text);
      const keywords = extractKeywords(result.text);

      const fallbackKeywords = keywords.length
        ? keywords
        : summaryText.split(' ')
            .filter(Boolean)
            .slice(0, 4)
            .map(word => word.replace(/[^a-z0-9]/gi, '').toLowerCase())
            .filter(Boolean);

      setLocalSummary({
        type: activeTool,
        fileName: selectedFile.name,
        summaryText,
        highlights,
        keywords: fallbackKeywords,
        stats: {
          words: result.text.split(/\s+/).filter(Boolean).length,
          sections: activeTool === 'pdf' ? (result.meta.pages || 0) : (result.meta.slides || 0)
        }
      });

      setProcessingMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Local summary error:', err);
      setError(err.message || 'Failed to analyse this file. Please try another document.');
      setProcessingMessage('');
    } finally {
      setIsUploading(false);
    }
  };

  const copySummaryToClipboard = async () => {
    if (!localSummary) return;
    try {
      await navigator.clipboard.writeText(localSummary.summaryText);
      alert('Summary copied to clipboard!');
    } catch (err) {
      console.error('Clipboard error:', err);
      alert('Failed to copy summary. Please copy manually.');
    }
  };

  const handleDownload = async (summaryId, fileName) => {
    try {
      const blob = await aiToolsAPI.downloadFile(summaryId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const handleDelete = async (summaryId) => {
    if (window.confirm('Are you sure you want to delete this summary?')) {
      try {
        const response = await aiToolsAPI.deleteSummary(summaryId);
        if (response && response.success) {
          alert('Summary deleted successfully');
          loadSummaries();
          loadStats();
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete summary');
      }
    }
  };

  const getFileTypeIcon = (fileType) => {
    switch (fileType) {
      case 'video':
        return (
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'pdf':
        return (
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'ppt':
        return (
          <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSupportedFormats = (toolType) => {
    switch (toolType) {
      case 'video':
        return 'MP4, AVI, MOV, WMV, FLV, WEBM files supported';
      case 'pdf':
        return 'PDF files supported';
      case 'ppt':
        return 'PPT, PPTX, PPS, PPSX files supported';
      default:
        return '';
    }
  };

  // Show access restriction for free trial users
  if (isFreeTrial() && !hasAccess('aiTools')) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Learning Tools</h2>
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
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Learning Tools</h2>
        <p className="text-gray-600">Enhance your learning with AI-powered tools</p>
      </div>

      {/* AI Tools Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
           {[
             { id: 'video', name: 'Video Summary Generator', icon: 'video', color: 'red' },
             { id: 'pdf', name: 'PDF Summary Generator', icon: 'pdf', color: 'blue' },
             { id: 'ppt', name: 'PPT Summary Generator', icon: 'ppt', color: 'purple' }
           ].map((tool) => (
             <button
               key={tool.id}
               onClick={() => setActiveTool(tool.id)}
               className={`p-6 rounded-lg transition-all ${
                 activeTool === tool.id
                   ? 'bg-gray-800 shadow-lg transform scale-105'
                   : 'bg-gray-700 hover:bg-gray-600 hover:shadow-md'
               }`}
             >
               <div className="text-center">
                 <div className="mb-4 flex justify-center">
                   {tool.icon === 'video' && (
                     <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                     </svg>
                   )}
                   {tool.icon === 'pdf' && (
                     <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                     </svg>
                   )}
                   {tool.icon === 'ppt' && (
                     <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                     </svg>
                   )}
                 </div>
                 <h3 className={`font-medium text-sm ${
                   activeTool === tool.id 
                     ? 'text-blue-400' 
                     : 'text-white'
                 }`}>{tool.name}</h3>
               </div>
             </button>
           ))}
        </div>

        {/* File Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {summaryToolLabels[activeTool]}
          </h3>
          <p className="text-sm text-gray-500 mb-4">Upload {activeTool.toUpperCase()} File</p>
          
          <div className="mb-4">
            {getFileTypeIcon(activeTool)}
          </div>
          
          <div className="mb-4">
            <p className="text-gray-500">Upload your file</p>
            <p className="text-xs text-gray-400 mt-1">{getSupportedFormats(activeTool)}</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept={
              activeTool === 'video' ? '.mp4,.avi,.mov,.wmv,.flv,.webm' :
              activeTool === 'pdf' ? '.pdf' :
              '.ppt,.pptx,.pps,.ppsx'
            }
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Choose File {selectedFile ? `(${selectedFile.name})` : 'No file chosen'}
          </button>

          {selectedFile && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload & Process'}
              </button>
            </div>
          )}

          {(isUploading || processingMessage) && (
            <div className="mt-4">
              {activeTool === 'video' ? (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{uploadProgress}% uploaded</p>
                </>
              ) : (
                <p className="text-sm text-gray-600 animate-pulse">{processingMessage || 'Analysing document...'}</p>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>

        {localSummary && (
          <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-6 text-left">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-indigo-600">Instant Summary</p>
                <h4 className="text-lg font-semibold text-gray-900">{localSummary.fileName}</h4>
                <p className="text-sm text-gray-500">
                  {localSummary.type === 'pdf' ? `${localSummary.stats.sections} pages processed` : `${localSummary.stats.sections} slides processed`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copySummaryToClipboard}
                  className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-md text-sm hover:bg-indigo-100"
                >
                  Copy Summary
                </button>
                <button
                  onClick={() => setLocalSummary(null)}
                  className="px-4 py-2 bg-transparent border border-transparent text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-white">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{localSummary.summaryText}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-white">
                  <h5 className="text-sm font-semibold text-gray-800 mb-2">Key Highlights</h5>
                  {localSummary.highlights.length ? (
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {localSummary.highlights.slice(0, 5).map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600">Highlights will appear here once the summary is generated.</p>
                  )}
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-white">
                  <h5 className="text-sm font-semibold text-gray-800 mb-2">Keywords</h5>
                  {localSummary.keywords.length ? (
                    <div className="flex flex-wrap gap-2">
                      {localSummary.keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">Keywords will be suggested after analysis.</p>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="bg-indigo-100 rounded-md p-2 text-center">
                      <p className="text-lg font-semibold text-indigo-700">{localSummary.stats.words}</p>
                      <p className="text-xs uppercase tracking-wide text-indigo-600">Words Parsed</p>
                    </div>
                    <div className="bg-indigo-100 rounded-md p-2 text-center">
                      <p className="text-lg font-semibold text-indigo-700">{localSummary.stats.sections}</p>
                      <p className="text-xs uppercase tracking-wide text-indigo-600">
                        {localSummary.type === 'pdf' ? 'Pages' : 'Slides'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      {stats && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your AI Tools Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.totalSummaries}</p>
              <p className="text-sm text-gray-600">Total Files</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completedSummaries}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.completionRate}%</p>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {stats.byType?.reduce((sum, type) => sum + type.totalSize, 0) ? 
                  (stats.byType.reduce((sum, type) => sum + type.totalSize, 0) / 1024 / 1024).toFixed(1) + ' MB' : 
                  '0 MB'
                }
              </p>
              <p className="text-sm text-gray-600">Total Size</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Summaries */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Summaries</h3>
        
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading summaries...</p>
          </div>
        ) : summaries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No summaries yet. Upload a file to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {summaries.slice(0, 5).map((summary) => (
              <div key={summary._id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getFileTypeIcon(summary.fileType)}
                    <div>
                      <h4 className="font-medium text-gray-900">{summary.originalFileName}</h4>
                      <p className="text-sm text-gray-500">
                        {summary.fileType.toUpperCase()} • {summary.fileSizeFormatted} • 
                        {new Date(summary.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(summary.processingStatus)}`}>
                      {summary.processingStatus}
                    </span>
                    {summary.processingStatus === 'completed' && (
                      <button
                        onClick={() => handleDownload(summary._id, summary.originalFileName)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Download
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(summary._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {summary.processingStatus === 'completed' && summary.summary && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <h5 className="font-medium text-gray-900 mb-2">Summary:</h5>
                    <p className="text-sm text-gray-700 line-clamp-3">{summary.summary}</p>
                    {summary.keyPoints && summary.keyPoints.length > 0 && (
                      <div className="mt-2">
                        <h6 className="font-medium text-gray-900 mb-1">Key Points:</h6>
                        <ul className="text-sm text-gray-700 list-disc list-inside">
                          {summary.keyPoints.slice(0, 3).map((point, index) => (
                            <li key={index}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {summary.processingStatus === 'failed' && summary.processingError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-700">Error: {summary.processingError}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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

export default AITools;
