import { useMemo, useState } from "react";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function formatDateKey(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function Calendar({
  flowers = [],
  selectedDate = "",
  onSelectDate = () => {}
}) {
  const initialDate = useMemo(() => {
    if (flowers.length > 0) {
      const newestFlowerDate =
        new Date(flowers[0].createdAt);

      if (
        !Number.isNaN(
          newestFlowerDate.getTime()
        )
      ) {
        return newestFlowerDate;
      }
    }

    return new Date();
  }, [flowers]);

  const [displayYear, setDisplayYear] =
    useState(initialDate.getFullYear());

  const [
    displayMonth,
    setDisplayMonth
  ] = useState(initialDate.getMonth());

  const flowerDates = useMemo(() => {
    const map = new Map();

    flowers.forEach((flower) => {
      const dateKey = formatDateKey(
        flower.createdAt
      );

      if (!dateKey) {
        return;
      }

      const existing =
        map.get(dateKey) || [];

      existing.push(flower);
      map.set(dateKey, existing);
    });

    return map;
  }, [flowers]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      displayYear,
      displayMonth,
      1
    ).getDay();

    const numberOfDays = new Date(
      displayYear,
      displayMonth + 1,
      0
    ).getDate();

    const cells = [];

    for (
      let emptyIndex = 0;
      emptyIndex < firstDay;
      emptyIndex += 1
    ) {
      cells.push({
        type: "empty",
        key: `empty-${emptyIndex}`
      });
    }

    for (
      let day = 1;
      day <= numberOfDays;
      day += 1
    ) {
      const date = new Date(
        displayYear,
        displayMonth,
        day
      );

      const dateKey =
        formatDateKey(date);

      cells.push({
        type: "day",
        key: dateKey,
        day,
        dateKey,
        flowers:
          flowerDates.get(dateKey) || []
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push({
        type: "empty",
        key: `ending-${cells.length}`
      });
    }

    return cells;
  }, [
    displayYear,
    displayMonth,
    flowerDates
  ]);

  function goToPreviousMonth() {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear((year) => year - 1);
      return;
    }

    setDisplayMonth(
      (month) => month - 1
    );
  }

  function goToNextMonth() {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear((year) => year + 1);
      return;
    }

    setDisplayMonth(
      (month) => month + 1
    );
  }

  function handleDateClick(cell) {
    if (cell.flowers.length === 0) {
      return;
    }

    onSelectDate(
      selectedDate === cell.dateKey
        ? ""
        : cell.dateKey
    );
  }

  return (
    <section
      id="todayFlower"
      className="below-garden-card today-flower-panel flower-calendar-panel"
    >
      <div className="flower-calendar-header">
        <button
          id="previousMonthButton"
          className="calendar-month-button"
          type="button"
          aria-label="Previous month"
          onClick={goToPreviousMonth}
        >
          ‹
        </button>

        <div className="flower-calendar-title">
          <h2 id="calendarMonthTitle">
            {MONTH_NAMES[displayMonth]}{" "}
            {displayYear}
          </h2>

          <p>
            Explore your garden through time
          </p>
        </div>

        <button
          id="nextMonthButton"
          className="calendar-month-button"
          type="button"
          aria-label="Next month"
          onClick={goToNextMonth}
        >
          ›
        </button>
      </div>

      <div
        className="calendar-weekdays"
        aria-hidden="true"
      >
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      <div
        id="flowerCalendar"
        className="flower-calendar"
      >
        {calendarDays.map((cell) => {
          if (cell.type === "empty") {
            return (
              <div
                key={cell.key}
                className="calendar-day calendar-day-empty"
              ></div>
            );
          }

          const hasFlowers =
            cell.flowers.length > 0;

          const isSelected =
            selectedDate === cell.dateKey;

          return (
            <button
              key={cell.key}
              className={[
                "calendar-day",
                hasFlowers
                  ? "calendar-day-has-flower"
                  : "",
                isSelected
                  ? "calendar-day-selected"
                  : ""
              ]
                .filter(Boolean)
                .join(" ")}
              type="button"
              disabled={!hasFlowers}
              onClick={() =>
                handleDateClick(cell)
              }
            >
              <span className="calendar-day-number">
                {cell.day}
              </span>

              {hasFlowers && (
                <span className="calendar-flower-marker">
                  🌸
                  {cell.flowers.length > 1
                    ? ` ${cell.flowers.length}`
                    : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="calendar-footer">
        <p id="calendarHint">
          {selectedDate
            ? `Showing flowers from ${selectedDate}`
            : "Select a flower date to highlight it in the garden 🌸"}
        </p>

        <button
          id="showAllFlowersButton"
          className="show-all-flowers-button"
          type="button"
          style={{
            display: selectedDate
              ? "inline-flex"
              : "none"
          }}
          onClick={() =>
            onSelectDate("")
          }
        >
          Show All Flowers
        </button>
      </div>
    </section>
  );
}

export default Calendar;