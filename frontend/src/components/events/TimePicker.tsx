import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, placeholder = "--:--", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const timePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setHours(h || '00');
      setMinutes(m || '00');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTimeChange = (newHours: string, newMinutes: string) => {
    setHours(newHours);
    setMinutes(newMinutes);
    onChange(`${newHours}:${newMinutes}`);
  };

  const generateHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i.toString().padStart(2, '0'));
    }
    return hours;
  };

  const generateMinutes = () => {
    const minutes = [];
    for (let i = 0; i < 60; i += 5) {
      minutes.push(i.toString().padStart(2, '0'));
    }
    return minutes;
  };

  const displayValue = value || placeholder;

  return (
    <div className="relative" ref={timePickerRef}>
      <div
        className={`flex items-center w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 cursor-pointer ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Clock className="h-4 w-4 text-gray-400 mr-2" />
        <span className="flex-1 text-left">{displayValue}</span>
        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="flex max-h-48">
            {/* Hours Column */}
            <div className="flex-1 border-r border-gray-200">
              <div className="p-2 text-xs font-medium text-gray-500 text-center border-b border-gray-200">
                Hours
              </div>
              <div className="max-h-40 overflow-y-auto">
                {generateHours().map((hour) => (
                  <div
                    key={hour}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                      hours === hour ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'
                    }`}
                    onClick={() => handleTimeChange(hour, minutes)}
                  >
                    {hour}
                  </div>
                ))}
              </div>
            </div>

            {/* Minutes Column */}
            <div className="flex-1">
              <div className="p-2 text-xs font-medium text-gray-500 text-center border-b border-gray-200">
                Minutes
              </div>
              <div className="max-h-40 overflow-y-auto">
                {generateMinutes().map((minute) => (
                  <div
                    key={minute}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                      minutes === minute ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'
                    }`}
                    onClick={() => handleTimeChange(hours, minute)}
                  >
                    {minute}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePicker;


