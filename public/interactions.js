let friendMode = false;
let avatarEl = null;
let avatarX = 120;
let avatarY = 520;
let activeFlowerId = null;
let gardenClickMoveBound = false;

function escapeSelectorValue(value) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(String(value));
  }
  return String(value).replace(/["\\]/g, "\\$&");
}

function updateSupportCountOnPage(flowerId, supportCount) {
  const safeId = escapeSelectorValue(flowerId);
  document
    .querySelectorAll(`.flower-support-count[data-flower-id="${safeId}"]`)
    .forEach((element) => {
      element.textContent = String(supportCount);
    });
}

function updateLatestMessageOnPage(flowerId, messageText) {
  const safeId = escapeSelectorValue(flowerId);
  document
    .querySelectorAll(`.flower-latest-message[data-flower-id="${safeId}"]`)
    .forEach((element) => {
      element.textContent = messageText || "No message yet";
    });
}

function updateFlowerInLocalState(flowerId, updates) {
  const updateFlowers = (flowers) => {
    if (!Array.isArray(flowers)) return;
    const flower = flowers.find(
      (item) => String(item.id) === String(flowerId)
    );
    if (flower) Object.assign(flower, updates);
  };

  updateFlowers(currentGardenView);
  if (currentViewedGardenData) updateFlowers(currentViewedGardenData.flowers);
  if (myGardenData) updateFlowers(myGardenData.flowers);
}

async function leaveMessage(index) {
  const msg = prompt("Leave a blessing message 🌸");
  if (!msg || !msg.trim()) return;

  const flower = currentGardenView[index];
  if (!flower) return;

  const targetUserId =
    viewMode === "friend" ? currentVisitedFriendId : getCurrentUserId();
  const me = getCurrentUser();
  const author = me ? me.name : "Friend";
  const messageText = msg.trim();

  try {
    const updatedFlower = await messageFlowerForUser(
      targetUserId,
      flower.id,
      author,
      messageText,
      getCurrentUserId(),
      getSelectedVisitorAvatar()
    );

    const messages = Array.isArray(updatedFlower?.messages)
      ? updatedFlower.messages
      : [...(flower.messages || []), { author, text: messageText }];

    updateFlowerInLocalState(flower.id, { messages });
    updateLatestMessageOnPage(flower.id, messageText);
  } catch (err) {
    console.error("Message error:", err);
    alert("Failed to leave message");
  }
}

async function supportFlower(index) {
  const flower = currentGardenView[index];
  if (!flower) return;

  const targetUserId =
    viewMode === "friend" ? currentVisitedFriendId : getCurrentUserId();
  const oldCount = Number(flower.supportCount || 0);
  const optimisticCount = oldCount + 1;

  updateFlowerInLocalState(flower.id, { supportCount: optimisticCount });
  updateSupportCountOnPage(flower.id, optimisticCount);

  try {
    const updatedFlower = await supportFlowerForUser(
        targetUserId,
        flower.id,
        getCurrentUserId(),
        getSelectedVisitorAvatar()
      );
    const realCount = Number(updatedFlower?.supportCount);
    const finalCount = Number.isFinite(realCount) ? realCount : optimisticCount;

    updateFlowerInLocalState(flower.id, { supportCount: finalCount });
    updateSupportCountOnPage(flower.id, finalCount);
  } catch (err) {
    updateFlowerInLocalState(flower.id, { supportCount: oldCount });
    updateSupportCountOnPage(flower.id, oldCount);
    console.error("Support error:", err);
    alert("Failed to support flower");
  }
}

async function deleteFlower(index) {
  const flower = currentGardenView[index];
  if (!flower) return;
  if (viewMode === "friend") {
    alert("You can only delete flowers in your own garden 🌱");
    return;
  }
  if (!confirm("Delete this flower? This cannot be undone.")) return;

  try {
    const response = await fetch(
      `/users/${getCurrentUserId()}/flowers/${flower.id}`,
      { method: "DELETE" }
    );
    if (!response.ok) throw new Error("Failed to delete flower");
    if (typeof flowerPositionCache !== "undefined") {
      flowerPositionCache.delete(flower.id);
    }
    await refreshCurrentView();
  } catch (err) {
    console.error("Delete error:", err);
    alert("Failed to delete flower");
  }
}

function createVisitorAvatar() {
  const gardenDiv = document.getElementById("garden");
  if (!gardenDiv) return;
  if (avatarEl) avatarEl.remove();

  avatarEl = document.createElement("div");
  avatarEl.id = "avatar";
  avatarEl.textContent = getSelectedVisitorAvatar();
  avatarEl.style.position = "absolute";
  avatarEl.style.left = `${avatarX}px`;
  avatarEl.style.top = `${avatarY}px`;
  avatarEl.style.zIndex = "50";
  avatarEl.style.pointerEvents = "none";
  avatarEl.style.lineHeight = "1";
  avatarEl.style.userSelect = "none";
  gardenDiv.appendChild(avatarEl);
}

async function sendVisitPosition() {
  if (viewMode !== "friend" || !currentVisitedFriendId) return;
  try {
    await fetch("/visit/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hostUserId: currentVisitedFriendId,
        visitorUserId: getCurrentUserId(),
        visitorAvatar: getSelectedVisitorAvatar(),
        x: avatarX,
        y: avatarY
      })
    });
  } catch (err) {
    console.error("Move visit error:", err);
  }
}

async function moveAvatar(dx, dy) {
  if (!friendMode || !avatarEl) return;
  const gardenDiv = document.getElementById("garden");
  if (!gardenDiv) return;

  avatarX = Math.max(0, Math.min(gardenDiv.clientWidth - 40, avatarX + dx));
  avatarY = Math.max(0, Math.min(gardenDiv.clientHeight - 40, avatarY + dy));
  avatarEl.style.left = `${avatarX}px`;
  avatarEl.style.top = `${avatarY}px`;
  await sendVisitPosition();
  checkNearbyFlower();
}

function checkNearbyFlower() {
  if (!friendMode || !avatarEl) return;
  const cards = document.querySelectorAll(".flower-card");
  let nearestCard = null;
  let nearestDistance = Infinity;
  activeFlowerId = null;

  const avatarRect = avatarEl.getBoundingClientRect();
  const avatarCenterX = avatarRect.left + avatarRect.width / 2;
  const avatarCenterY = avatarRect.top + avatarRect.height / 2;

  cards.forEach((card) => {
    card.classList.remove("active");
    const rect = card.getBoundingClientRect();
    const dx = avatarCenterX - (rect.left + rect.width / 2);
    const dy = avatarCenterY - (rect.top + rect.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestCard = card;
    }
  });

  if (nearestCard && nearestDistance < 110) {
    nearestCard.classList.add("active");
    activeFlowerId = nearestCard.dataset.id;
  }
}

function setupGardenClickMove() {
  const gardenDiv = document.getElementById("garden");
  if (!gardenDiv || gardenClickMoveBound) return;
  gardenClickMoveBound = true;

  gardenDiv.addEventListener("click", async (e) => {
    if (!friendMode || !avatarEl) return;
    if (e.target.closest("button") || e.target.closest(".flower-card")) return;

    const rect = gardenDiv.getBoundingClientRect();
    avatarX = Math.max(0, Math.min(gardenDiv.clientWidth - 40, e.clientX - rect.left - 16));
    avatarY = Math.max(0, Math.min(gardenDiv.clientHeight - 40, e.clientY - rect.top - 16));
    avatarEl.style.left = `${avatarX}px`;
    avatarEl.style.top = `${avatarY}px`;
    await sendVisitPosition();
    checkNearbyFlower();
  });
}

function setupFriendFlowerActions() {
    document.addEventListener("click", (e) => {
        const deleteButton =
          e.target.closest(".tooltip-delete-btn");
    
        if (deleteButton) {
          e.preventDefault();
          e.stopPropagation();
    
          const flowerIndex = Number(
            deleteButton.dataset.index
          );
    
          if (!Number.isNaN(flowerIndex)) {
            deleteFlower(flowerIndex);
          }
    
          return;
        }
    
        const supportButton =
          e.target.closest(".support-btn");
    
        if (supportButton) {
          e.preventDefault();
          e.stopPropagation();
    
          const flowerIndex = Number(
            supportButton.dataset.index
          );
    
          if (!Number.isNaN(flowerIndex)) {
            supportFlower(flowerIndex);
          }
    
          return;
        }
    
        const messageButton =
          e.target.closest(".message-btn");
    
        if (messageButton) {
          e.preventDefault();
          e.stopPropagation();
    
          const flowerIndex = Number(
            messageButton.dataset.index
          );
    
          if (!Number.isNaN(flowerIndex)) {
            leaveMessage(flowerIndex);
          }
        }
      });
}

function handleKeydown(e) {
  const arrows = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  if (arrows.includes(e.key) && friendMode) e.preventDefault();
  if (!friendMode) return;
  if (e.key === "ArrowUp") moveAvatar(0, -20);
  if (e.key === "ArrowDown") moveAvatar(0, 20);
  if (e.key === "ArrowLeft") moveAvatar(-20, 0);
  if (e.key === "ArrowRight") moveAvatar(20, 0);
}

document.addEventListener("keydown", handleKeydown);
