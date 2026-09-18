import { fullName, lifespan } from '../lib/familyData.js';
import { useEditMode } from '../context/EditModeContext.jsx';

const PHOTO_SIZE = 44;

export default function PersonBox({ box, person, onToggleCollapsed, onEditPerson }) {
  const { isEditMode } = useEditMode();
  if (!person) return null;

  const deceased = !!person.deathDate;
  const clipId = `clip-${box.personId}${box.isPartner ? '-p' : ''}`;

  return (
    <g
      className="person-box"
      transform={`translate(${box.x} ${box.y})`}
      onClick={() => onToggleCollapsed(box.personId)}
    >
      <rect
        width={box.w}
        height={box.h}
        rx={10}
        className={deceased ? 'box-rect deceased' : 'box-rect'}
      />
      {person.photoUrl && (
        <>
          <clipPath id={clipId}>
            <circle cx={PHOTO_SIZE / 2 + 10} cy={box.h / 2} r={PHOTO_SIZE / 2} />
          </clipPath>
          <image
            href={person.photoUrl}
            x={10}
            y={box.h / 2 - PHOTO_SIZE / 2}
            width={PHOTO_SIZE}
            height={PHOTO_SIZE}
            clipPath={`url(#${clipId})`}
            preserveAspectRatio="xMidYMid slice"
          />
        </>
      )}
      <text
        x={person.photoUrl ? PHOTO_SIZE + 20 : 14}
        y={box.h / 2 - 4}
        className="box-name"
      >
        {truncate(fullName(person), person.photoUrl ? 16 : 20)}
      </text>
      <text x={person.photoUrl ? PHOTO_SIZE + 20 : 14} y={box.h / 2 + 16} className="box-years">
        {lifespan(person)}
      </text>

      {box.hasHiddenChildren && (
        <g className="expand-badge" transform={`translate(${box.w - 20} ${box.h - 20})`}>
          <circle r={10} />
          <text textAnchor="middle" dy="4">
            +
          </text>
        </g>
      )}

      {isEditMode && (
        <g
          className="edit-badge"
          transform={`translate(${box.w - 22} 6)`}
          onClick={(e) => {
            e.stopPropagation();
            onEditPerson(box.personId);
          }}
        >
          <circle r={10} cx={10} cy={10} />
          <text x={10} y={14} textAnchor="middle">
            ✎
          </text>
        </g>
      )}
    </g>
  );
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}
