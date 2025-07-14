import { useNavigate } from "react-router-dom";

/**
 * Dropdown component
 * @param {Object} props
 * @param {string} props.title - The text shown on the dropdown toggle button
 * @param {Array<{ label: string, href?: string }>} props.items - The dropdown menu items
 * @param {boolean} props.isOpen - Whether the dropdown is open
 * @param {function} props.onToggle - Function to toggle open/close state
 */
function Dropdown({ title, iconClass, cmtks, isOpen, onToggle }) {
    const navigate = useNavigate();

    const handleItemClick = (location) => {
        navigate(`/ChartPage/${location}`);
        onToggle();
    };

    return (
        <div className={`dashboard-nav-dropdown ${isOpen ? "show" : ""}`}>
            <a
                href="#!"
                className="dashboard-nav-item dashboard-nav-dropdown-toggle"
                onClick={(e) => {
                    e.preventDefault();
                    onToggle();
                }}
            >
                {iconClass && <i className={iconClass}></i>} {title}
            </a>
            <div className="dashboard-nav-dropdown-menu">
                {Object.keys(cmtks).map((label, idx) => (
                    <a
                        key={idx}
                        href="#!"
                        className="dashboard-nav-dropdown-item"
                        onClick={(e) => {
                            e.preventDefault();
                            handleItemClick(label);
                        }}
                    >
                        {label}
                    </a>
                ))}
            </div>
        </div>
    );
}

export default Dropdown;
