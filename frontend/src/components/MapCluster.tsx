import React, { useEffect, useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { Plus, Minus, RefreshCcw } from 'lucide-react';

// GeoJSON for Indonesia provinces
const geoUrl = "https://raw.githubusercontent.com/superpikar/indonesia-geojson/master/indonesia-province-simple.json";

export default function MapCluster({ data }: { data: { id: string, value: number }[] }) {
  const [geoData, setGeoData] = useState<any>(null);
  const [tooltip, setTooltip] = useState<{content: string, x: number, y: number} | null>(null);
  const [position, setPosition] = useState({ coordinates: [118, -2.5] as [number, number], zoom: 1 });

  const handleZoomIn = () => {
    if (position.zoom >= 4) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleReset = () => {
    setPosition({ coordinates: [118, -2.5], zoom: 1 });
  };
  
  useEffect(() => {
    fetch(geoUrl).then(r => r.json()).then(setGeoData).catch(console.error);
  }, []);

  const maxValue = useMemo(() => {
    if (!data || data.length === 0) return 1;
    return Math.max(...data.map(d => d.value)) || 1;
  }, [data]);

  const getColor = (value: number) => {
    if (!value) return "#f1f5f9"; // slate-100 for empty
    const intensity = 0.3 + (value / maxValue) * 0.7;
    return `rgba(227, 38, 54, ${intensity})`; // Red (#E32636) with varying opacity
  };

  if (!geoData) return <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">Memuat Peta...</div>;

  return (
    <div className="w-full h-full min-h-[300px] bg-slate-50/30 rounded-lg overflow-hidden border border-slate-100 relative">
      <ComposableMap 
        projection="geoMercator" 
        projectionConfig={{ scale: 900, center: [118, -2.5] }}
        style={{ width: "100%", height: "100%" }}
      >

        <ZoomableGroup 
          center={position.coordinates} 
          zoom={position.zoom} 
          maxZoom={4}
          translateExtent={[
            [-200, -200],
            [1000, 800]
          ]}
          onMoveEnd={(pos) => setPosition(pos as any)}
          filterZoomEvent={(e: any) => e.type !== 'wheel'}
        >
          <Geographies geography={geoData}>
            {({ geographies }) =>
              geographies.map((geo) => {
                let provinceName = geo.properties.Propinsi?.toUpperCase() || "";
                
                // GeoJSON specific string mappings to match our backend map
                if (provinceName === 'DAERAH ISTIMEWA YOGYAKARTA') provinceName = 'DIY YOGYAKARTA';
                if (provinceName === 'PROBANTEN') provinceName = 'BANTEN';
                
                const match = data?.find(s => s.id === provinceName);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={match ? getColor(match.value) : "#e2e8f0"}
                    stroke="#ffffff"
                    strokeWidth={0.7}
                    style={{
                      default: { outline: "none", transition: "all 0.2s" },
                      hover: { fill: "#334155", outline: "none", transition: "all 0.2s", cursor: "pointer" },
                      pressed: { outline: "none" }
                    }}
                    onMouseEnter={(e: any) => {
                      setTooltip({
                        content: `${provinceName}: ${match ? match.value : 0} Pengajuan`,
                        x: e.clientX,
                        y: e.clientY
                      });
                    }}
                    onMouseMove={(e: any) => {
                      setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                    }}
                    onMouseLeave={() => {
                      setTooltip(null);
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
         <button onClick={handleZoomIn} className="w-8 h-8 bg-white border border-slate-200 shadow-sm rounded flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
            <Plus size={16} />
         </button>
         <button onClick={handleZoomOut} className="w-8 h-8 bg-white border border-slate-200 shadow-sm rounded flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
            <Minus size={16} />
         </button>
         <button onClick={handleReset} className="w-8 h-8 bg-white border border-slate-200 shadow-sm rounded flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors mt-2">
            <RefreshCcw size={14} />
         </button>
      </div>

      {/* Legend Map */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-slate-200 text-xs flex flex-col gap-1.5">
         <span className="font-bold text-slate-700 mb-1">Intensitas Volume</span>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-slate-200"></div>
            <span className="text-slate-500">0 Pengajuan</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#E32636] opacity-40"></div>
            <span className="text-slate-500">Rendah</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#E32636]"></div>
            <span className="text-slate-500">Tinggi (Berpusat di DKI)</span>
         </div>
      </div>

      {/* Floating Tooltip */}
      {tooltip && (
        <div 
          className="fixed pointer-events-none bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded shadow-xl z-50 transform -translate-x-1/2 -translate-y-full mt-[-10px]"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.content}
          <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-slate-900"></div>
        </div>
      )}
    </div>
  );
}
