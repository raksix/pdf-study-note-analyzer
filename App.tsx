import React, { useState, useCallback, useEffect, useMemo } from 'react';
import FileUpload from './components/FileUpload';
import AnalysisResultCard from './components/AnalysisResultCard';
import { AnalyzedFile, AnalysisResult, Priority } from './types';
import { fileToBase64, generateId } from './services/fileHelpers';
import { analyzePdfContent } from './services/geminiService';
import { generateHtmlReport } from './services/htmlGenerator';

const STORAGE_KEY = 'pdf_study_assistant_data';

const App: React.FC = () => {
  // Initialize state from localStorage
  const [files, setFiles] = useState<AnalyzedFile[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: AnalyzedFile[] = JSON.parse(saved);
          // If page was reloaded during analysis, we lost the file object, so mark as error
          return parsed.map(f => {
            if (f.status === 'analyzing' || f.status === 'uploading') {
              return { 
                ...f, 
                status: 'error', 
                errorMessage: 'Sayfa yenilendiği için işlem tamamlanamadı.' 
              };
            }
            return f;
          });
        }
      } catch (e) {
        console.error("Failed to load history:", e);
      }
    }
    return [];
  });

  // Save to localStorage whenever files change
  useEffect(() => {
    try {
      // Remove the 'file' object (which is not serializable) before saving
      const dataToSave = files.map(f => {
        const { file, ...rest } = f;
        return rest;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error("Failed to save history:", e);
    }
  }, [files]);

  // Calculate all unique topics from all completed files
  const allTopics = useMemo(() => {
    const uniqueTopics = new Set<string>();
    files.forEach(file => {
      if (file.status === 'completed' && file.result?.topics) {
        file.result.topics.forEach(topic => uniqueTopics.add(topic));
      }
    });
    // Sort alphabetically with Turkish locale support
    return Array.from(uniqueTopics).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [files]);

  // Calculate High Priority topics specifically from the study plans
  const highPriorityTopics = useMemo(() => {
    const uniqueHighPriority = new Set<string>();
    files.forEach(file => {
      if (file.status === 'completed' && file.result?.studyPlan) {
        file.result.studyPlan.forEach(item => {
          // Check for 'Yüksek' which corresponds to Priority.HIGH
          if (item.priority === Priority.HIGH) {
            uniqueHighPriority.add(item.topic);
          }
        });
      }
    });
    return Array.from(uniqueHighPriority).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [files]);

  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    // Create initial state entries for new files
    const newFileEntries: AnalyzedFile[] = selectedFiles.map(file => ({
      id: generateId(),
      file: file, // Store file reference for processing
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      status: 'idle',
      timestamp: Date.now()
    }));

    setFiles(prev => [...newFileEntries, ...prev]);

    // Process each file individually
    newFileEntries.forEach(fileEntry => {
      processFile(fileEntry);
    });
  }, []);

  const processFile = async (fileEntry: AnalyzedFile) => {
    updateFileStatus(fileEntry.id, 'analyzing');

    try {
      if (!fileEntry.file) {
        throw new Error("Dosya verisi bulunamadı.");
      }

      // 1. Convert to Base64
      const base64Data = await fileToBase64(fileEntry.file);

      // 2. Call Gemini API
      const result = await analyzePdfContent(base64Data, fileEntry.fileType);

      // 3. Update Status to Completed
      updateFileStatus(fileEntry.id, 'completed', result);

    } catch (error: any) {
      console.error(`Error processing file ${fileEntry.fileName}:`, error);
      updateFileStatus(fileEntry.id, 'error', undefined, error.message || "Bilinmeyen bir hata oluştu");
    }
  };

  const updateFileStatus = (id: string, status: AnalyzedFile['status'], result?: AnalysisResult, errorMessage?: string) => {
    setFiles(prevFiles => 
      prevFiles.map(f => {
        if (f.id === id) {
          return { ...f, status, result, errorMessage };
        }
        return f;
      })
    );
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => {
    if (confirm("Tüm kayıtlı analizler silinsin mi?")) {
      setFiles([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleDownloadReport = () => {
    const htmlContent = generateHtmlReport(files, allTopics, highPriorityTopics);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `calisma-raporu-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Akıllı Çalışma Asistanı</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-xs font-medium px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                Otomatik Kayıt Aktif
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Intro Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4 sm:text-4xl">
            PDF Dosyalarını Yükle, <br/>
            <span className="text-indigo-600">Çalışma Planını Oluştur</span>
          </h2>
          <p className="text-lg text-slate-600">
            Ders notlarını veya kitaplarını yükle. Yapay zeka senin için konuları çıkarsın, özetlesin ve neye çalışman gerektiğini söylesin.
          </p>
        </div>

        {/* Upload Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="