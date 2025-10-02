import React, { useState, useMemo } from 'react';

interface CalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onDateSelect: (date: string) => void;
  minDate: string; // YYYY-MM-DD
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect, minDate }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    const initial = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date(minDate + 'T00:00:00');
    if (initial.toString() === 'Invalid Date') return new Date(minDate + 'T00:00:00');
    return initial;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid: (Date | null)[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      grid.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push(new Date(year, month, i));
    }
    return grid;
  }, [year, month]);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };
  
  const minDateTime = new Date(minDate + 'T00:00:00').getTime();

  return (
    <div className="bg-white rounded-lg shadow-2xl border border-slate-200 p-4 w-full max-w-xs mx-auto animate-fade-in-fast">
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-100 text-gray-800 font-bold">&lt;</button>
        <div className="font-bold text-slate-800">
          {currentDate.toLocaleString('default', { month: 'long' })} {year}
        </div>
        <button type="button" onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-100 text-gray-800 font-bold">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
          <div key={day} className="font-semibold text-slate-500">{day}</div>
        ))}
        {calendarGrid.map((date, index) => {
          if (!date) return <div key={index}></div>;

          const day = date.getDate();
          // Timezone-safe date string generation
          const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const isSelected = dateString === selectedDate;
          const isDisabled = date.getTime() < minDateTime;

          let classes = "h-9 w-9 flex items-center justify-center rounded-full transition-colors duration-200";
          if (isDisabled) {
            classes += " text-slate-300 cursor-not-allowed";
          } else if (isSelected) {
            classes += " bg-blue-600 text-white font-bold";
          } else {
            classes += " text-slate-700 hover:bg-blue-100 cursor-pointer";
          }
          
          return (
            <div key={index} onClick={() => !isDisabled && onDateSelect(dateString)} className={classes}>
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;