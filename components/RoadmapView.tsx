import React from 'react';
import { RoadmapStep } from '../types';

interface RoadmapViewProps {
  steps: RoadmapStep[];
}

const RoadmapView: React.FC<RoadmapViewProps> = ({ steps }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </span>
          Kişiselleştirilmiş Yol Haritası
        </h3>
        <p className="text-slate-600 mt-2 ml-14">
          Yüklediğin tüm dökümanlar analiz edildi ve senin için mantıksal bir öğrenme sırası oluşturuldu.
        </p>
      </div>

      <div className="relative border-l-2 border-indigo-200 ml-5 space-y-10 py-2">
        {steps.map((step, index) => (
          <div key={index} className="relative pl-10">
            {/* Dot on timeline */}
            <div className="absolute -left-[9px] top-1 w-5 h-5 rounded-full bg-white border-4 border-indigo-600"></div>
            
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:border-indigo-300 transition-colors shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 w-fit">
                  {step.stepName}
                </span>
                <h4 className="text-lg font-bold text-slate-800">{step.title}</h4>
              </div>
              
              <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                {step.description}
              </p>

              <div>
                <h5 className="text-xs font-semibold text-slate-500 uppercase mb-2">Konular</h5>
                <div className="flex flex-wrap gap-2">
                  {step.topics.map((topic, idx) => (
                    <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-white border border-slate-300 text-slate-700">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoadmapView;