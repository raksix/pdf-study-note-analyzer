import React, { useState } from 'react';
import { AnalyzedFile, StudyItem, Priority } from '../types';

interface AnalysisResultCardProps {
  item: AnalyzedFile;
  onRemove: (id: string) => void;
}

const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({ item, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case Priority.HIGH: return 'bg-red-100 text-red-700 border-red-200';
      case Priority.MEDIUM: return 'bg-amber-100 text-amber-700 border-amber-200';
      case Priority.LOW: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mb-6 transition-all hover:shadow-lg">
      {/* Header */}
      <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
             </svg>
          </div>
          <div className="truncate">
            <h3 className="font-semibold text-slate-800 truncate" title={item.fileName}>{item.fileName}</h3>
            <p className="text-xs text-slate-500">
              {(item.fileSize / 1024 / 1024).toFixed(2)} MB • {item.status === 'completed' ? 'Analiz Tamamlandı' : item.status === 'error' ? 'Hata' : 'İşleniyor...'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {item.status === 'completed' && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
            >
              {isExpanded ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )}
          <button 
            onClick={() => onRemove(item.id)}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Status Bar */}
      {item.status === 'analyzing' && (
        <div className="w-full bg-indigo-50 p-4">
           <div className="flex items-center space-x-3 text-indigo-700">
             <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
             <span className="font-medium">Yapay zeka içeriği analiz ediyor...</span>
           </div>
        </div>
      )}

      {item.status === 'error' && (
        <div className="p-4 bg-red-50 text-red-700 text-sm">
          <p className="font-semibold">Hata Oluştu:</p>
          <p>{item.errorMessage || "Dosya analiz edilemedi. Lütfen tekrar deneyin."}</p>
        </div>
      )}

      {/* Result Content */}
      {item.status === 'completed' && item.result && isExpanded && (
        <div className="p-6 space-y-6">
          
          {/* Summary Section */}
          <div>
            <h4 className="text-sm uppercase tracking-wide text-slate-500 font-bold mb-2">Özet</h4>
            <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
              {item.result.summary}
            </p>
          </div>

          {/* Topics Tags */}
          <div>
            <h4 className="text-sm uppercase tracking-wide text-slate-500 font-bold mb-3">Ana Konular</h4>
            <div className="flex flex-wrap gap-2">
              {item.result.topics.map((topic, idx) => (
                <span key={idx} className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-full text-sm font-medium shadow-sm">
                  {topic}
                </span>
              ))}
            </div>
          </div>

          {/* Study Plan Table */}
          <div>
            <h4 className="text-sm uppercase tracking-wide text-slate-500 font-bold mb-3">Çalışma Planı</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600 border-collapse">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold rounded-tl-lg">Konu</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Yapılacaklar / Tavsiye</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-center rounded-tr-lg">Öncelik</th>
                  </tr>
                </thead>
                <tbody>
                  {item.result.studyPlan.map((planItem, idx) => (
                    <tr key={idx} className="bg-white border-b border-slate-100 hover:bg-slate-50 last:border-b-0">
                      <td className="px-4 py-3 font-medium text-slate-900 w-1/4">{planItem.topic}</td>
                      <td className="px-4 py-3 w-2/4">{planItem.action}</td>
                      <td className="px-4 py-3 text-center w-1/4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(planItem.priority)}`}>
                          {planItem.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default AnalysisResultCard;