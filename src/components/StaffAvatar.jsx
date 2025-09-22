import React from "react";

const StaffAvatar = ({
  staffPhoto,
  staffName,
  size = "medium",
  className = "",
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "w-8 h-8 text-xs";
      case "medium":
        return "w-12 h-12 text-lg";
      case "large":
        return "w-16 h-16 text-xl";
      case "xl":
        return "w-20 h-20 text-2xl";
      default:
        return "w-12 h-12 text-lg";
    }
  };

  const getInitials = (name) => {
    if (!name) return "F";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`${getSizeClasses()} bg-gray-200 rounded-full flex items-center justify-center overflow-hidden ${className}`}
    >
      {staffPhoto ? (
        <img
          src={staffPhoto}
          alt={staffName || "Funcionário"}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-medium text-gray-600">
          {getInitials(staffName)}
        </span>
      )}
    </div>
  );
};

export default StaffAvatar;
