const RobotIcon = ({ className = '' }) => (
    <svg
        className={`w-6 h-6 text-indigo-400 ${className}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
    >
        {/* Antenna */}
        <path d="M12 8V4M12 4L11 2h2l-1 2" />
        {/* Head/Body */}
        <rect x="5" y="8" width="14" height="12" rx="2" />
        {/* Eyes */}
        <path d="M9 13h.01M15 13h.01" />
        {/* Mouth */}
        <path d="M9 17h6" />
        {/* Ears/Side details */}
        <path d="M5 13H3M19 13h2" />
    </svg>
);

export default RobotIcon;