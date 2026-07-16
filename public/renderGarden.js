const BASE_GARDEN_WIDTH = 700;
const BASE_GARDEN_HEIGHT = 760;
const BASE_FLOWER_WIDTH = 150;
const BASE_FLOWER_HEIGHT = 180;

const flowerPositionCache = new Map();

const flowerMap = {
  happy: "/assets/sunflower.png",
  calm: "/assets/blue.png",
  tired: "/assets/purple.png",
  sad: "/assets/tulip.png",
  stressed: "/assets/pink.png",
  default: "/assets/pink.png"
};
let displayedCalendarDate = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  
  let selectedCalendarDateKey = null;
  
  function getFlowerDateValue(flower) {
    return flower?.createdAt || flower?.date || null;
  }
  
  function getDateKey(dateValue) {
    if (!dateValue) {
      return null;
    }
  
    const date =
      dateValue instanceof Date
        ? dateValue
        : new Date(dateValue);
  
    if (Number.isNaN(date.getTime())) {
      return null;
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
  
  function formatCalendarDate(dateKey) {
    const [year, month, day] =
      dateKey.split("-").map(Number);
  
    return new Intl.DateTimeFormat(
      "en-US",
      {
        month: "long",
        day: "numeric",
        year: "numeric"
      }
    ).format(
      new Date(year, month - 1, day)
    );
  }
  
  function getFlowersGroupedByDate() {
    const groupedFlowers = {};
  
    const flowers =
      Array.isArray(currentGardenView)
        ? currentGardenView
        : [];
  
    flowers.forEach((flower) => {
      const dateKey = getDateKey(
        getFlowerDateValue(flower)
      );
  
      if (!dateKey) {
        return;
      }
  
      if (!groupedFlowers[dateKey]) {
        groupedFlowers[dateKey] = [];
      }
  
      groupedFlowers[dateKey].push(flower);
    });
  
    return groupedFlowers;
  }
  
  function applyCalendarFlowerHighlight() {
    const gardenScene =
      document.getElementById(
        "garden-scene"
      );
  
    if (!gardenScene) {
      return;
    }
  
    gardenScene
      .querySelectorAll(
        ".flower-card.calendar-flower-match"
      )
      .forEach((card) => {
        card.classList.remove(
          "calendar-flower-match"
        );
      });
  
    gardenScene.classList.remove(
      "calendar-filter-active",
      "calendar-no-match"
    );
  
    if (!selectedCalendarDateKey) {
      return;
    }
  
    const matchingFlowerIds = new Set(
      currentGardenView
        .filter((flower) => {
          return (
            getDateKey(
              getFlowerDateValue(flower)
            ) === selectedCalendarDateKey
          );
        })
        .map((flower) =>
          String(flower.id)
        )
    );
  
    if (matchingFlowerIds.size === 0) {
      gardenScene.classList.add(
        "calendar-no-match"
      );
  
      return;
    }
  
    gardenScene.classList.add(
      "calendar-filter-active"
    );
  
    gardenScene
      .querySelectorAll(".flower-card")
      .forEach((card) => {
        const flowerId =
          card.dataset.flowerId ||
          card.dataset.id;
  
        if (
          matchingFlowerIds.has(
            String(flowerId)
          )
        ) {
          card.classList.add(
            "calendar-flower-match"
          );
        }
      });
  }
  
  function clearCalendarFlowerHighlight(
    rerenderCalendar = true
  ) {
    selectedCalendarDateKey = null;
  
    const gardenScene =
      document.getElementById(
        "garden-scene"
      );
  
    if (gardenScene) {
      gardenScene.classList.remove(
        "calendar-filter-active",
        "calendar-no-match"
      );
  
      gardenScene
        .querySelectorAll(
          ".calendar-flower-match"
        )
        .forEach((card) => {
          card.classList.remove(
            "calendar-flower-match"
          );
        });
    }
  
    if (rerenderCalendar) {
      renderFlowerCalendar();
    }
  }
  
  function handleCalendarDateClick(
    dateKey,
    flowerCount
  ) {
    if (flowerCount === 0) {
      return;
    }
  
    if (
      selectedCalendarDateKey === dateKey
    ) {
      clearCalendarFlowerHighlight();
      return;
    }
  
    selectedCalendarDateKey = dateKey;
  
    applyCalendarFlowerHighlight();
    renderFlowerCalendar();
  }
  
  function renderFlowerCalendar() {
    const calendar =
      document.getElementById(
        "flowerCalendar"
      );
  
    const monthTitle =
      document.getElementById(
        "calendarMonthTitle"
      );
  
    if (!calendar || !monthTitle) {
      return;
    }
  
    const year =
      displayedCalendarDate.getFullYear();
  
    const month =
      displayedCalendarDate.getMonth();
  
    monthTitle.textContent =
      new Intl.DateTimeFormat(
        "en-US",
        {
          month: "long",
          year: "numeric"
        }
      ).format(displayedCalendarDate);
  
    const flowersByDate =
      getFlowersGroupedByDate();
  
    calendar.innerHTML = "";
  
    const firstWeekday =
      new Date(
        year,
        month,
        1
      ).getDay();
  
    const daysInMonth =
      new Date(
        year,
        month + 1,
        0
      ).getDate();
  
    for (
      let index = 0;
      index < firstWeekday;
      index += 1
    ) {
      const emptyCell =
        document.createElement("div");
  
      emptyCell.className =
        "calendar-day calendar-day-empty";
  
      calendar.appendChild(emptyCell);
    }
  
    for (
      let day = 1;
      day <= daysInMonth;
      day += 1
    ) {
      const date = new Date(
        year,
        month,
        day
      );
  
      const dateKey = getDateKey(date);
  
      const flowersForDate =
        flowersByDate[dateKey] || [];
  
      const flowerCount =
        flowersForDate.length;
  
      const dayButton =
        document.createElement("button");
  
      dayButton.type = "button";
      dayButton.className =
        "calendar-day";
  
      dayButton.dataset.date = dateKey;
  
      if (flowerCount > 0) {
        dayButton.classList.add(
          "calendar-day-has-flowers"
        );
  
        dayButton.title =
          `${flowerCount} ${
            flowerCount === 1
              ? "flower"
              : "flowers"
          } planted`;
      } else {
        dayButton.title =
          "No flowers planted";
      }
  
      if (
        selectedCalendarDateKey === dateKey
      ) {
        dayButton.classList.add(
          "calendar-day-selected"
        );
      }
  
      const dayNumber =
        document.createElement("span");
  
      dayNumber.className =
        "calendar-day-number";
  
      dayNumber.textContent =
        String(day);
  
      dayButton.appendChild(dayNumber);
  
      if (flowerCount > 0) {
        const flowerMarker =
          document.createElement("span");
  
        flowerMarker.className =
          "calendar-flower-marker";
  
        flowerMarker.textContent = "🌱";
  
        dayButton.appendChild(
          flowerMarker
        );
      }
  
      dayButton.addEventListener(
        "click",
        () => {
          handleCalendarDateClick(
            dateKey,
            flowerCount
          );
        }
      );
  
      calendar.appendChild(dayButton);
    }
  
    const previousButton =
      document.getElementById(
        "previousMonthButton"
      );
  
    if (previousButton) {
      previousButton.onclick = () => {
        displayedCalendarDate =
          new Date(
            displayedCalendarDate
              .getFullYear(),
            displayedCalendarDate
              .getMonth() - 1,
            1
          );
  
        clearCalendarFlowerHighlight(
          false
        );
  
        renderFlowerCalendar();
      };
    }
  
    const nextButton =
      document.getElementById(
        "nextMonthButton"
      );
  
    if (nextButton) {
      nextButton.onclick = () => {
        displayedCalendarDate =
          new Date(
            displayedCalendarDate
              .getFullYear(),
            displayedCalendarDate
              .getMonth() + 1,
            1
          );
  
        clearCalendarFlowerHighlight(
          false
        );
  
        renderFlowerCalendar();
      };
    }
  
    const showAllButton =
      document.getElementById(
        "showAllFlowersButton"
      );
  
    if (showAllButton) {
      showAllButton.onclick = () => {
        clearCalendarFlowerHighlight();
      };
  
      showAllButton.style.display =
        selectedCalendarDateKey
          ? "block"
          : "none";
    }
  
    const hint =
      document.getElementById(
        "calendarHint"
      );
  
    if (hint) {
      if (selectedCalendarDateKey) {
        const count =
          (
            flowersByDate[
              selectedCalendarDateKey
            ] || []
          ).length;
  
        hint.textContent =
          `${count} ${
            count === 1
              ? "flower"
              : "flowers"
          } highlighted from ${
            formatCalendarDate(
              selectedCalendarDateKey
            )
          }`;
      } else {
        hint.textContent =
          "Select a flower date to highlight it in the garden 🌸";
      }
    }
  }

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getResponsiveFlowerSize() {
  const viewportWidth = window.innerWidth;

  if (viewportWidth <= 640) {
    return {
      width: 125,
      height: 150,
      tooltipWidth: 190
    };
  }

  if (viewportWidth <= 900) {
    return {
      width: 145,
      height: 175,
      tooltipWidth: 220
    };
  }

  return {
    width: 170,
    height: 205,
    tooltipWidth: 220
  };
}

function getGardenMetrics(gardenDiv) {
  const styles = window.getComputedStyle(gardenDiv);

  const paddingLeft =
    parseFloat(styles.paddingLeft) || 0;

  const paddingRight =
    parseFloat(styles.paddingRight) || 0;

  const paddingTop =
    parseFloat(styles.paddingTop) || 0;

  const paddingBottom =
    parseFloat(styles.paddingBottom) || 0;

  const innerWidth = Math.max(
    0,
    gardenDiv.clientWidth -
      paddingLeft -
      paddingRight
  );

  const innerHeight = Math.max(
    0,
    gardenDiv.clientHeight -
      paddingTop -
      paddingBottom
  );

  const scaleX =
    innerWidth / BASE_GARDEN_WIDTH;

  const scaleY =
    innerHeight / BASE_GARDEN_HEIGHT;

  return {
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    innerWidth,
    innerHeight,
    scaleX,
    scaleY
  };
}

// 花只出现在草地区域
function getGrassBounds(metrics, flowerSize) {
  const leftPadding = 24;
  const rightPadding = 24;
  const topPadding = 18;
  const bottomPadding = 26;

  const topMin = Math.round(
    metrics.innerHeight / 3
  );

  const topMax = Math.round(
    metrics.innerHeight -
      flowerSize.height -
      bottomPadding
  );

  return {
    leftMin: leftPadding,

    leftMax: Math.max(
      leftPadding,
      metrics.innerWidth -
        flowerSize.width -
        rightPadding
    ),

    topMin: Math.max(
      topPadding,
      topMin
    ),

    topMax: Math.max(
      Math.max(topPadding, topMin),
      topMax
    )
  };
}

function boxesOverlap(a, b, flowerSize) {
  const horizontalGap =
    flowerSize.width * 0.78;

  const verticalGap =
    flowerSize.height * 0.72;

  return !(
    a.left + horizontalGap <= b.left ||
    b.left + horizontalGap <= a.left ||
    a.top + verticalGap <= b.top ||
    b.top + verticalGap <= a.top
  );
}

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getFlowerSeed(
  flower,
  fallbackIndex = 0
) {
  const raw = String(
    flower?.id ?? fallbackIndex + 1
  );

  let hash = 0;

  for (let i = 0; i < raw.length; i += 1) {
    hash =
      (hash * 31 + raw.charCodeAt(i)) >>>
      0;
  }

  return hash || fallbackIndex + 1;
}

function isPositionInsideBounds(
  position,
  bounds
) {
  return (
    typeof position.left === "number" &&
    typeof position.top === "number" &&
    position.left >= bounds.leftMin &&
    position.left <= bounds.leftMax &&
    position.top >= bounds.topMin &&
    position.top <= bounds.topMax
  );
}

function generateStableFlowerPosition(
  flower,
  existingFlowers = [],
  fallbackIndex = 0
) {
  const baseMetrics = {
    innerWidth: BASE_GARDEN_WIDTH,
    innerHeight: BASE_GARDEN_HEIGHT
  };

  const baseFlowerSize = {
    width: BASE_FLOWER_WIDTH,
    height: BASE_FLOWER_HEIGHT
  };

  const bounds = getGrassBounds(
    baseMetrics,
    baseFlowerSize
  );

  const seedBase = getFlowerSeed(
    flower,
    fallbackIndex
  );

  for (
    let attempt = 0;
    attempt < 800;
    attempt += 1
  ) {
    const randX = seededRandom(
      seedBase + attempt * 17.371
    );

    const randY = seededRandom(
      seedBase + attempt * 41.913
    );

    const candidate = {
      left: Math.round(
        bounds.leftMin +
          randX *
            (bounds.leftMax -
              bounds.leftMin)
      ),

      top: Math.round(
        bounds.topMin +
          randY *
            (bounds.topMax -
              bounds.topMin)
      )
    };

    const overlapsExisting =
      existingFlowers.some((placedFlower) =>
        boxesOverlap(
          candidate,
          placedFlower,
          baseFlowerSize
        )
      );

    if (!overlapsExisting) {
      return candidate;
    }
  }

  return {
    left: bounds.leftMin,
    top: bounds.topMin
  };
}

function prepareFlowersOnce(flowers) {
  if (!Array.isArray(flowers)) {
    return [];
  }

  const positionedFlowers = [];

  const baseBounds = getGrassBounds(
    {
      innerWidth: BASE_GARDEN_WIDTH,
      innerHeight: BASE_GARDEN_HEIGHT
    },
    {
      width: BASE_FLOWER_WIDTH,
      height: BASE_FLOWER_HEIGHT
    }
  );

  const currentIds = new Set(
    flowers.map((flower) => flower.id)
  );

  for (
    const cachedId of flowerPositionCache.keys()
  ) {
    if (!currentIds.has(cachedId)) {
      flowerPositionCache.delete(cachedId);
    }
  }

  return flowers.map((flower, index) => {
    const cachedPosition =
      flowerPositionCache.get(flower.id);

    const currentPosition =
      cachedPosition || {
        left: flower.left,
        top: flower.top
      };

    const hasValidPosition =
      isPositionInsideBounds(
        currentPosition,
        baseBounds
      ) &&
      !positionedFlowers.some(
        (placedFlower) =>
          boxesOverlap(
            currentPosition,
            placedFlower,
            {
              width: BASE_FLOWER_WIDTH,
              height: BASE_FLOWER_HEIGHT
            }
          )
      );

    if (hasValidPosition) {
      const fixedFlower = {
        ...flower,
        left: Math.round(
          currentPosition.left
        ),
        top: Math.round(
          currentPosition.top
        )
      };

      flowerPositionCache.set(
        flower.id,
        {
          left: fixedFlower.left,
          top: fixedFlower.top
        }
      );

      positionedFlowers.push(fixedFlower);

      return fixedFlower;
    }

    const stablePosition =
      generateStableFlowerPosition(
        flower,
        positionedFlowers,
        index
      );

    const updatedFlower = {
      ...flower,
      left: stablePosition.left,
      top: stablePosition.top
    };

    flowerPositionCache.set(
      flower.id,
      {
        left: updatedFlower.left,
        top: updatedFlower.top
      }
    );

    positionedFlowers.push(updatedFlower);

    return updatedFlower;
  });
}

function getScaledFlowerPosition(
  flower,
  metrics,
  flowerSize
) {
  const bounds = getGrassBounds(
    metrics,
    flowerSize
  );

  const scaledLeft = clamp(
    flower.left * metrics.scaleX,
    bounds.leftMin,
    bounds.leftMax
  );

  const scaledTop = clamp(
    flower.top * metrics.scaleY,
    bounds.topMin,
    bounds.topMax
  );

  return {
    left: scaledLeft,
    top: scaledTop
  };
}

function getScaledVisitorPosition(
  visitor,
  metrics
) {
  const x = clamp(
    (visitor.x || 0) * metrics.scaleX,
    0,
    Math.max(
      0,
      metrics.innerWidth - 36
    )
  );

  const y = clamp(
    (visitor.y || 0) * metrics.scaleY,
    0,
    Math.max(
      0,
      metrics.innerHeight - 36
    )
  );

  return { x, y };
}

function getFlowerImage(flower) {
  const mood = (
    flower.mood || ""
  ).toLowerCase();

  return (
    flowerMap[mood] ||
    flowerMap.default
  );
}

function renderDecorations() {
  const layer = document.getElementById(
    "decoration-layer"
  );

  if (!layer) {
    return;
  }

  layer.innerHTML = "";

  const items = [
    {
      left: "5%",
      bottom: "6%",
      width: 170,
      height: 120,
      img: "/assets/decoration1.JPEG"
    },
    {
      left: "22%",
      bottom: "8%",
      width: 180,
      height: 125,
      img: "/assets/decoration2.JPEG"
    },
    {
      left: "42%",
      bottom: "7%",
      width: 175,
      height: 120,
      img: "/assets/decoration3.JPEG"
    },
    {
      left: "62%",
      bottom: "8%",
      width: 170,
      height: 118,
      img: "/assets/decoration1.JPEG"
    },
    {
      left: "78%",
      bottom: "6%",
      width: 175,
      height: 120,
      img: "/assets/decoration2.JPEG"
    }
  ];

  items.forEach((item) => {
    const el =
      document.createElement("div");

    el.style.position = "absolute";
    el.style.left = item.left;
    el.style.bottom = item.bottom;
    el.style.width = `${item.width}px`;
    el.style.height = `${item.height}px`;

    el.style.backgroundImage =
      `url("${item.img}")`;

    el.style.backgroundSize =
      "contain";

    el.style.backgroundRepeat =
      "no-repeat";

    el.style.backgroundPosition =
      "bottom center";

    el.style.mixBlendMode =
      "multiply";

    el.style.opacity = "0.95";
    el.style.pointerEvents = "none";

    layer.appendChild(el);
  });
}

function renderRemoteVisitors(
  gardenDiv,
  metrics
) {
  if (viewMode !== "friend") {
    return;
  }

  if (
    !currentViewedGardenData ||
    !Array.isArray(
      currentViewedGardenData.activeVisitors
    )
  ) {
    return;
  }

  const visitors =
    currentViewedGardenData.activeVisitors;

  visitors.forEach((visitor) => {
    if (
      String(visitor.visitorId) ===
      String(getCurrentUserId())
    ) {
      return;
    }

    const visitorEl =
      document.createElement("div");

    visitorEl.className =
      "remote-visitor-avatar";

    visitorEl.dataset.visitorId =
      String(visitor.visitorId);

    visitorEl.textContent =
      visitor.avatar || "🦋";

    const position =
      getScaledVisitorPosition(
        visitor,
        metrics
      );

    visitorEl.style.left =
      `${position.x}px`;

    visitorEl.style.top =
      `${position.y}px`;

    visitorEl.title =
      `${visitor.name || "Visitor"} is visiting`;

    gardenDiv.appendChild(visitorEl);
  });
}

function renderGarden() {
  const gardenDiv =
    document.getElementById("garden");

  if (!gardenDiv) {
    return;
  }

  gardenDiv.innerHTML = "";

  const metrics =
    getGardenMetrics(gardenDiv);

  const flowerSize =
    getResponsiveFlowerSize();

  currentGardenView =
    prepareFlowersOnce(
      Array.isArray(currentGardenView)
        ? currentGardenView
        : []
    );

  currentGardenView.forEach(
    (flower, index) => {
      const card =
        document.createElement("div");

        card.className = "flower-card";

        card.dataset.id =
          String(flower.id);
        
        card.dataset.flowerId =
          String(flower.id);
        
        card.dataset.index =
          String(index);

      const messages =
        Array.isArray(flower.messages)
          ? flower.messages
          : [];

      const latestMessage =
        messages.length > 0
          ? messages[
              messages.length - 1
            ].text
          : "No message yet";

      card.innerHTML = `
        <div class="flower-shadow"></div>

        <div
          class="flower-img"
          style="
            width: ${flowerSize.width}px;
            height: ${flowerSize.height}px;
            background-image: url('${getFlowerImage(
              flower
            )}');
          "
        ></div>

        <div
          class="flower-tooltip ${
            friendMode
              ? "friend-tooltip"
              : "own-tooltip"
          }"
        >
          <p>
            <strong>
              ${flower.name || "Flower"}
            </strong>
          </p>

          <p>
            Flower meaning:
            ${flower.meaning || "Unknown"}
          </p>

          <p>
            Mood:
            ${flower.mood || "Unknown"}
          </p>

          <p>
            Date:
            ${
              flower.date ||
              flower.createdAt ||
              "Unknown"
            }
          </p>

          <p>
            Event:
            ${
              flower.event ||
              "No event recorded"
            }
          </p>

          <p>
            Support:
            <span
              class="flower-support-count"
              data-flower-id="${flower.id}"
            >
              ${Number(
                flower.supportCount || 0
              )}
            </span>
          </p>

          <p>
            Message:
            <span
              class="flower-latest-message"
              data-flower-id="${flower.id}"
            >
              ${latestMessage}
            </span>
          </p>

          ${
            friendMode
            ? `
              <div class="flower-actions-inline">
                <button
                  type="button"
                  class="support-btn"
                  data-index="${index}"
                >
                  Support ✨
                </button>
        
                <button
                  type="button"
                  class="message-btn"
                  data-index="${index}"
                >
                  Leave Message 🏷️
                </button>
              </div>
            `
            : ""
              
          }
        </div>
      `;

      const position =
        getScaledFlowerPosition(
          flower,
          metrics,
          flowerSize
        );

      card.style.position =
        "absolute";

      card.style.left =
        `${position.left}px`;

      card.style.top =
        `${position.top}px`;

      card.style.width =
        `${flowerSize.width}px`;

      card.style.height =
        `${flowerSize.height + 30}px`;

      card.style.zIndex = String(
        100 + Math.round(position.top)
      );

      const tooltip =
        card.querySelector(
          ".flower-tooltip"
        );

      if (tooltip) {
        const tooltipOffset = 18;

        const tooltipRightEdge =
          position.left +
          tooltipOffset +
          flowerSize.tooltipWidth;

        if (
          tooltipRightEdge >
          metrics.innerWidth - 20
        ) {
          tooltip.style.right =
            `${tooltipOffset}px`;

          tooltip.style.left =
            "auto";

          tooltip.classList.add(
            "tooltip-left"
          );

          tooltip.classList.remove(
            "tooltip-right"
          );
        } else {
          tooltip.style.left =
            `${tooltipOffset}px`;

          tooltip.style.right =
            "auto";

          tooltip.classList.add(
            "tooltip-right"
          );

          tooltip.classList.remove(
            "tooltip-left"
          );
        }
      }

      if (!friendMode) {
        let pressTimer = null;
        let longPressTriggered = false;
      
        const startPress = (event) => {
          if (event.target.closest("button")) {
            return;
          }
      
          longPressTriggered = false;
      
          pressTimer = setTimeout(() => {
            pressTimer = null;
            longPressTriggered = true;
      
            const confirmed = confirm(
              `Delete ${flower.name || "this flower"}? This cannot be undone.`
            );
      
            if (confirmed) {
              deleteFlower(index);
            }
          }, 700);
        };
      
        const cancelPress = () => {
          if (pressTimer !== null) {
            clearTimeout(pressTimer);
            pressTimer = null;
          }
        };
      
        card.addEventListener("mousedown", startPress);
        card.addEventListener("mouseup", cancelPress);
        card.addEventListener("mouseleave", cancelPress);
      
        card.addEventListener(
          "touchstart",
          startPress,
          { passive: true }
        );
      
        card.addEventListener("touchend", cancelPress);
        card.addEventListener("touchcancel", cancelPress);
      
        card.addEventListener("click", (event) => {
          if (longPressTriggered) {
            event.preventDefault();
            event.stopPropagation();
            longPressTriggered = false;
          }
        });

      }

      

      gardenDiv.appendChild(card);
    }
  );

  renderRemoteVisitors(
    gardenDiv,
    metrics
  );
  applyCalendarFlowerHighlight();

  if (friendMode) {
    if (
      typeof createVisitorAvatar ===
      "function"
    ) {
      createVisitorAvatar();
    } else if (avatarEl) {
      gardenDiv.appendChild(avatarEl);
    }

    if (
      typeof setupGardenClickMove ===
      "function"
    ) {
      setupGardenClickMove();
    }

    if (
      typeof checkNearbyFlower ===
      "function"
    ) {
      checkNearbyFlower();
    }
  }
}

function renderTodayFlower() {
    renderFlowerCalendar();
  }

window.addEventListener(
  "resize",
  () => {
    renderDecorations();
    renderGarden();
    renderTodayFlower();
  }
);

if (
  typeof module !== "undefined" &&
  module.exports
) {
  module.exports = {
    renderGarden,
    renderTodayFlower,
    clamp,
    getResponsiveFlowerSize,
    getGardenMetrics,
    getGrassBounds,
    boxesOverlap,
    seededRandom,
    getFlowerSeed,
    isPositionInsideBounds,
    generateStableFlowerPosition,
    prepareFlowersOnce,
    getScaledFlowerPosition,
    getScaledVisitorPosition,
    getFlowerImage,
    renderDecorations,
    renderRemoteVisitors
  };
}