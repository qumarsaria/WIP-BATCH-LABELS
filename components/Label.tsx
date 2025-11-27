import React from 'react';
import { LabelConfig } from '../types';
import { formatDateDisplay } from '../utils';

interface LabelProps {
  data: LabelConfig;
}

const Label: React.FC<LabelProps> = ({ data }) => {
  return (
    <div className="w-[76.2mm] h-[50.8mm] bg-white p-2 flex flex-col justify-between text-black break-after-page box-border overflow-hidden relative border border-gray-200 print:border-none leading-tight">
      
      {/* Top Row: WIP Code & Use By Date (Critical Info) */}
      <div className="flex justify-between items-start border-b-2 border-black pb-1 mb-1">
        <div className="flex flex-col">
           <span className="text-[9px] font-bold uppercase leading-none text-gray-600">Code</span>
           <span className="text-2xl font-black font-mono leading-none tracking-tighter">{data.wipCode}</span>
        </div>
        <div className="flex flex-col items-end">
           <span className="text-[9px] font-bold uppercase leading-none text-gray-600">Use By</span>
           <span className="text-lg font-bold leading-none">{formatDateDisplay(data.useByDate)}</span>
        </div>
      </div>

      {/* Middle: Mix Name */}
      <div className="flex-1 flex items-center justify-start overflow-hidden my-1">
        <span className="text-sm font-bold leading-snug uppercase line-clamp-3 w-full">
          {data.mixName}
        </span>
      </div>

      {/* Bottom: Meta Info */}
      <div className="border-t border-black pt-1 grid grid-cols-12 gap-1 text-[9px]">
         <div className="col-span-5">
            <div className="flex flex-col">
              <span className="font-bold text-gray-600 uppercase text-[7px]">Prep Date</span>
              <span className="font-semibold">{formatDateDisplay(data.prepDate)}</span>
            </div>
         </div>
         <div className="col-span-4">
             <span className="font-bold text-gray-600 uppercase text-[7px]">Sup.</span>
             <div className="truncate font-semibold">{data.supervisor.split(' ')[0]}</div>
         </div>
         <div className="col-span-3 text-right flex flex-col justify-end">
             <div className="text-[7px] text-gray-400">ID:{Date.now().toString().slice(-4)}</div>
             <div className="font-black bg-black text-white px-1 text-center rounded-sm print:bg-transparent print:text-black print:border print:border-black">
               {data.copyNumber}/{data.totalCopies}
             </div>
         </div>
      </div>
    </div>
  );
};

export default Label;