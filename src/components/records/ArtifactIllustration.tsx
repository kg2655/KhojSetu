import React from 'react';
import { FieldRecord } from '../../types/archaeology';

interface ArtifactIllustrationProps {
  type: FieldRecord['illustrationType'] | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'detail';
  caption?: string;
}

export const ArtifactIllustration: React.FC<ArtifactIllustrationProps> = ({
  type,
  className = '',
  size = 'md',
  caption
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-36 h-36',
    detail: 'w-full h-56'
  };

  const renderGraphic = () => {
    switch (type) {
      case 'ceramic_painted':
        return (
          <svg viewBox="0 0 160 140" className="w-full h-full text-[#6D6256]" fill="none" stroke="currentColor" strokeWidth="1.5">
            {/* Shard outline */}
            <path
              d="M30 40 Q 80 20 130 35 L 142 85 Q 115 115 80 120 Q 35 110 22 75 Z"
              fill="#EFE8D8"
              stroke="#6B6256"
              strokeWidth="2"
            />
            {/* Section line (archaeological drawing convention) */}
            <path d="M80 20 L80 120" stroke="#8B5E3C" strokeWidth="1.2" strokeDasharray="3 2" />
            {/* Painted geometric motifs */}
            <path d="M45 45 L65 75 L35 75 Z" fill="#A65E3B" opacity="0.65" stroke="#8B5E3C" strokeWidth="1.2" />
            <path d="M60 45 L80 75 L50 75 Z" fill="#A65E3B" opacity="0.65" stroke="#8B5E3C" strokeWidth="1.2" />
            <path d="M90 50 L110 80 L80 80 Z" fill="#A65E3B" opacity="0.4" stroke="#8B5E3C" strokeWidth="1.2" />
            {/* Parallel slip lines */}
            <path d="M30 85 Q 80 95 130 80" stroke="#8B5E3C" strokeWidth="1.5" />
            <path d="M32 92 Q 80 102 128 87" stroke="#8B5E3C" strokeWidth="1.2" />
            {/* Hatching / pottery texture */}
            <line x1="95" y1="95" x2="105" y2="105" stroke="#BDB29F" strokeWidth="1" />
            <line x1="102" y1="92" x2="114" y2="104" stroke="#BDB29F" strokeWidth="1" />
            <line x1="110" y1="90" x2="122" y2="102" stroke="#BDB29F" strokeWidth="1" />
            {/* Fracture edge hatching */}
            <path d="M22 75 L30 40" stroke="#3D3832" strokeWidth="1.8" strokeDasharray="2 1" />
          </svg>
        );

      case 'stone_biface':
        return (
          <svg viewBox="0 0 160 140" className="w-full h-full text-[#6D6256]" fill="none" stroke="currentColor" strokeWidth="1.5">
            {/* Flint/chert scraper outline */}
            <path
              d="M80 18 Q 115 45 125 85 Q 110 122 80 126 Q 50 122 35 85 Q 45 45 80 18 Z"
              fill="#EAE2D0"
              stroke="#504A42"
              strokeWidth="2"
            />
            {/* Bulb of percussion & negative flaking scars */}
            <path d="M80 18 C 70 40 60 70 80 90" stroke="#8A8072" strokeWidth="1.2" />
            <path d="M80 18 C 95 40 100 65 80 90" stroke="#8A8072" strokeWidth="1.2" />
            <path d="M80 90 Q 65 115 80 126" stroke="#8A8072" strokeWidth="1.2" />
            {/* Micro-retouch serrations on lateral margin */}
            <path d="M35 85 L39 88 L36 93 L41 97 L37 103 L42 108 L38 114" stroke="#3D3832" strokeWidth="1.4" />
            <path d="M125 85 L121 89 L124 94 L119 98 L123 104 L118 109 L122 115" stroke="#3D3832" strokeWidth="1.4" />
          </svg>
        );

      case 'pottery_rim':
        return (
          <svg viewBox="0 0 160 140" className="w-full h-full text-[#6D6256]" fill="none" stroke="currentColor" strokeWidth="1.5">
            {/* Vessel rim profile drawing */}
            <path
              d="M25 45 Q 80 35 135 45 L 130 65 Q 80 55 30 65 Z"
              fill="#E3D7C1"
              stroke="#6B6256"
              strokeWidth="2"
            />
            {/* Rim wall section */}
            <path
              d="M135 45 C 145 47 148 55 142 62 C 136 68 132 80 130 95 L 122 93 C 124 80 128 66 130 65 Z"
              fill="#A65E3B"
              stroke="#3D3832"
              strokeWidth="1.8"
            />
            {/* Wall curvature projection */}
            <path d="M30 65 Q 40 95 60 115" stroke="#8B5E3C" strokeWidth="1.5" strokeDasharray="4 2" />
            <path d="M122 93 Q 105 110 80 118" stroke="#8B5E3C" strokeWidth="1.5" strokeDasharray="4 2" />
            {/* Centerline axis of symmetry */}
            <line x1="80" y1="25" x2="80" y2="125" stroke="#8B5E3C" strokeWidth="1" strokeDasharray="6 3 2 3" />
          </svg>
        );

      case 'bronze_blade':
        return (
          <svg viewBox="0 0 160 140" className="w-full h-full text-[#6D6256]" fill="none" stroke="currentColor" strokeWidth="1.5">
            {/* Bronze blade / dagger fragment */}
            <path
              d="M45 115 L 75 35 Q 80 20 85 35 L 115 115 Q 80 125 45 115 Z"
              fill="#D6DDD0"
              stroke="#4E5D44"
              strokeWidth="2"
            />
            {/* Central midrib */}
            <line x1="80" y1="25" x2="80" y2="120" stroke="#374830" strokeWidth="2.2" />
            {/* Verdigris patina flecks */}
            <path d="M68 60 Q 72 70 65 80" stroke="#5C6E41" strokeWidth="1.5" />
            <path d="M92 55 Q 88 68 95 82" stroke="#5C6E41" strokeWidth="1.5" />
            <circle cx="80" cy="108" r="3" fill="#3D3832" />
          </svg>
        );

      case 'bone_awl':
        return (
          <svg viewBox="0 0 160 140" className="w-full h-full text-[#6D6256]" fill="none" stroke="currentColor" strokeWidth="1.5">
            {/* Bone awl with notched handle */}
            <path
              d="M75 18 C 78 12 82 12 85 18 L 92 80 C 96 100 102 112 95 125 C 88 128 72 128 65 125 C 58 112 64 100 68 80 Z"
              fill="#F5F1E4"
              stroke="#6B6256"
              strokeWidth="1.8"
            />
            {/* Marrow cavity groove */}
            <path d="M78 50 L 78 105" stroke="#BDB29F" strokeWidth="1.5" />
            {/* Carved notches */}
            <line x1="60" y1="98" x2="68" y2="98" stroke="#3D3832" strokeWidth="1.8" />
            <line x1="61" y1="104" x2="69" y2="104" stroke="#3D3832" strokeWidth="1.8" />
            <line x1="62" y1="110" x2="70" y2="110" stroke="#3D3832" strokeWidth="1.8" />
            <line x1="91" y1="98" x2="99" y2="98" stroke="#3D3832" strokeWidth="1.8" />
            <line x1="90" y1="104" x2="98" y2="104" stroke="#3D3832" strokeWidth="1.8" />
            <line x1="89" y1="110" x2="97" y2="110" stroke="#3D3832" strokeWidth="1.8" />
          </svg>
        );

      case 'bead_necklace':
        return (
          <svg viewBox="0 0 160 140" className="w-full h-full text-[#6D6256]" fill="none" stroke="currentColor" strokeWidth="1.5">
            {/* Biconical carnelian beads */}
            <g transform="translate(30, 45)">
              <polygon points="25,0 45,15 25,30 5,15" fill="#C45139" opacity="0.8" stroke="#8B3E2C" strokeWidth="1.8" />
              <line x1="5" y1="15" x2="45" y2="15" stroke="#50251A" strokeWidth="1.2" strokeDasharray="2 1" />
            </g>
            <g transform="translate(75, 40)">
              <polygon points="25,0 45,18 25,36 5,18" fill="#C45139" opacity="0.85" stroke="#8B3E2C" strokeWidth="1.8" />
              <line x1="5" y1="18" x2="45" y2="18" stroke="#50251A" strokeWidth="1.2" strokeDasharray="2 1" />
            </g>
            <g transform="translate(50, 75)">
              <polygon points="20,0 38,14 20,28 2,14" fill="#C45139" opacity="0.75" stroke="#8B3E2C" strokeWidth="1.8" />
              <line x1="2" y1="14" x2="38" y2="14" stroke="#50251A" strokeWidth="1.2" strokeDasharray="2 1" />
            </g>
          </svg>
        );

      case 'terracotta_figurine':
        return (
          <svg viewBox="0 0 160 140" className="w-full h-full text-[#6D6256]" fill="none" stroke="currentColor" strokeWidth="1.5">
            {/* Stylized animal figurine */}
            <path
              d="M35 85 L 35 115 L 45 115 L 48 85 L 98 85 L 102 115 L 112 115 L 115 70 Q 128 55 135 45 Q 125 40 115 50 L 108 55 Q 85 58 50 62 L 35 85 Z"
              fill="#DFCEB8"
              stroke="#8B5E3C"
              strokeWidth="2"
            />
            {/* Horns & snout */}
            <path d="M125 40 Q 132 25 138 22" stroke="#8B5E3C" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="120" cy="48" r="2" fill="#3D3832" />
            {/* Hand-pinched texture */}
            <path d="M60 70 Q 75 75 90 70" stroke="#B09F89" strokeWidth="1.5" />
          </svg>
        );

      case 'charcoal':
        return (
          <svg viewBox="0 0 160 140" className="w-full h-full text-[#6D6256]" fill="none" stroke="currentColor" strokeWidth="1.5">
            {/* Irregular burnt hearth sample */}
            <path
              d="M40 70 Q 55 35 85 40 Q 115 42 125 70 Q 120 105 85 110 Q 45 112 40 70 Z"
              fill="#423E3B"
              stroke="#262321"
              strokeWidth="2"
            />
            {/* Carbonized grain cracks */}
            <line x1="55" y1="55" x2="85" y2="75" stroke="#7A746E" strokeWidth="1.5" />
            <line x1="85" y1="75" x2="110" y2="65" stroke="#7A746E" strokeWidth="1.5" />
            <line x1="75" y1="70" x2="80" y2="98" stroke="#7A746E" strokeWidth="1.5" />
            <line x1="95" y1="85" x2="112" y2="92" stroke="#7A746E" strokeWidth="1.2" />
          </svg>
        );

      case 'inscription_stone':
        return (
          <svg viewBox="0 0 160 140" className="w-full h-full text-[#6D6256]" fill="none" stroke="currentColor" strokeWidth="1.5">
            {/* Architectural stone slab with incised marks */}
            <rect x="25" y="30" width="110" height="80" rx="3" fill="#E8E2D4" stroke="#665D52" strokeWidth="2" />
            {/* Incised grid lines */}
            <line x1="45" y1="45" x2="115" y2="45" stroke="#8B5E3C" strokeWidth="1.2" />
            <line x1="45" y1="60" x2="115" y2="60" stroke="#8B5E3C" strokeWidth="1.2" />
            <line x1="45" y1="75" x2="115" y2="75" stroke="#8B5E3C" strokeWidth="1.2" />
            <line x1="45" y1="90" x2="115" y2="90" stroke="#8B5E3C" strokeWidth="1.2" />
            {/* Vertical incisions */}
            <line x1="60" y1="40" x2="60" y2="95" stroke="#8B5E3C" strokeWidth="1.2" />
            <line x1="80" y1="40" x2="80" y2="95" stroke="#8B5E3C" strokeWidth="1.2" />
            <line x1="100" y1="40" x2="100" y2="95" stroke="#8B5E3C" strokeWidth="1.2" />
            {/* Chipped stone corners */}
            <path d="M25 40 L35 30" stroke="#3D3832" strokeWidth="1.5" />
            <path d="M125 110 L135 100" stroke="#3D3832" strokeWidth="1.5" />
          </svg>
        );

      default:
        // Soil / sediment / other
        return (
          <svg viewBox="0 0 160 140" className="w-full h-full text-[#6D6256]" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="30" y="30" width="100" height="80" fill="#E6DFC8" stroke="#7A7062" strokeWidth="2" />
            {/* Stratigraphic strata lines */}
            <path d="M30 50 Q 80 55 130 48" stroke="#8B5E3C" strokeWidth="1.8" />
            <path d="M30 75 Q 80 70 130 78" stroke="#5C6E41" strokeWidth="1.8" />
            <path d="M30 92 Q 80 95 130 90" stroke="#3D3832" strokeWidth="1.8" />
            {/* Soil texture dots */}
            <circle cx="50" cy="62" r="1.5" fill="#8B5E3C" />
            <circle cx="75" cy="65" r="1.5" fill="#8B5E3C" />
            <circle cx="105" cy="60" r="1.5" fill="#8B5E3C" />
          </svg>
        );
    }
  };

  return (
    <div className={`relative flex flex-col items-center justify-center bg-[#FAF7F0] border border-[#D8CEBD] p-2 ${className}`}>
      <div className={`${sizeClasses[size]} flex items-center justify-center relative`}>
        {renderGraphic()}
      </div>

      {/* Archival scale bar (standard in archaeological field drawings) */}
      <div className="w-full flex items-center justify-between px-2 pt-1 border-t border-[#E5DDCB] text-[10px] font-mono text-[#827768]">
        <div className="flex items-center gap-1">
          <span className="inline-block w-6 h-1 border-x border-b border-[#827768] bg-[#665D52]/20"></span>
          <span>2 cm</span>
        </div>
        <span className="uppercase tracking-wider text-[9px] text-[#A69B88]">Specimen Sketch</span>
      </div>

      {caption && (
        <span className="text-[11px] font-mono text-[#6D6256] mt-1 text-center truncate max-w-full">
          {caption}
        </span>
      )}
    </div>
  );
};
