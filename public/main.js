let currentGardenView = [];
let currentViewedGardenData = null;
let myGardenData = null;

let currentVisitedFriendId = null;
let viewMode = "mine";

let pollTimer = null;
const POLL_INTERVAL = 3000;
let isAddFriendSelectOpen = false;


let selectedFlowerId = null;
const socket = io();

socket.on("connect", () => {
    console.log("Socket connected:", socket.id);

    joinedGardenOwnerId = null;
  
    const myUserId = getCurrentUserId();
  
   
    if (myUserId) {
      socket.emit("join-user", String(myUserId));
  
      console.log(
        "Joined personal room:",
        `user:${myUserId}`
      );
    }
  
    const currentGardenOwnerId =
      viewMode === "friend"
        ? currentVisitedFriendId
        : myUserId;
  
    if (currentGardenOwnerId) {
      joinGardenRoom(currentGardenOwnerId);
    }
  });

socket.on("disconnect", () => {
  console.log("Socket disconnected");
});

socket.on("visitor-moved", (visitor) => {
  if (!visitor || !visitor.visitorId) return;

  const selectorId =
    typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape(String(visitor.visitorId))
      : String(visitor.visitorId).replace(/["\\]/g, "\\$&");

  const gardenDiv = document.getElementById("garden");
  if (!gardenDiv) return;

  let visitorEl = gardenDiv.querySelector(
    `[data-visitor-id="${selectorId}"]`
  );

  if (!visitorEl && viewMode === "mine") {
    visitorEl = document.createElement("div");
    visitorEl.className = "host-visitor";
    visitorEl.dataset.visitorId = String(visitor.visitorId);
    gardenDiv.appendChild(visitorEl);
  }

  if (!visitorEl) return;

  visitorEl.textContent = visitor.avatar || "🦋";
  visitorEl.title = visitor.name || "Visitor";
  visitorEl.style.left = `${Number(visitor.x) || 0}px`;
  visitorEl.style.top = `${Number(visitor.y) || 0}px`;
});

socket.on("flower-supported", (data) => {
    console.log("🔥 RECEIVED flower-supported", data);
  if (!data || !data.flowerId) return;
  updateFlowerInLocalState(data.flowerId, {
    supportCount: data.supportCount
  });
  updateSupportCountOnPage(data.flowerId, data.supportCount);
});

socket.on("flower-messaged", (data) => {
  if (!data || !data.flowerId || !data.message) return;

  const flower = currentGardenView.find(
    (item) => String(item.id) === String(data.flowerId)
  );
  const messages = [...(flower?.messages || [])];
  const duplicate =
    data.message.id && messages.some((item) => item.id === data.message.id);

  if (!duplicate) messages.push(data.message);
  updateFlowerInLocalState(data.flowerId, { messages });
  updateLatestMessageOnPage(data.flowerId, data.message.text);
});

socket.on("visit-record-added", (record) => {
    console.log("Received visit-record-added:", record);
  
    if (!record || !record.id) {
      return;
    }
  
    if (!myGardenData) {
      return;
    }
  
    if (!Array.isArray(myGardenData.visitRecords)) {
      myGardenData.visitRecords = [];
    }
  
    const alreadyExists = myGardenData.visitRecords.some(
      (item) => String(item.id) === String(record.id)
    );
  
    if (alreadyExists) {
      return;
    }
  
    myGardenData.visitRecords.unshift(record);
  
    if (myGardenData.visitRecords.length > 30) {
      myGardenData.visitRecords =
        myGardenData.visitRecords.slice(0, 30);
    }
  
    renderVisitRecords();
  });


  

let joinedGardenOwnerId = null;

function joinGardenRoom(gardenOwnerId) {
  if (!gardenOwnerId) {
    return;
  }

  const normalizedOwnerId = String(gardenOwnerId);

  if (joinedGardenOwnerId === normalizedOwnerId) {
    return;
  }

  joinedGardenOwnerId = normalizedOwnerId;

  socket.emit("join-garden", normalizedOwnerId);

  console.log(
    "Joined garden room:",
    normalizedOwnerId
  );
}

function updateGardenTitle(title) {
  const gardenTitle = document.getElementById("gardenTitle");
  if (gardenTitle) {
    gardenTitle.textContent = title;
  }
}

function updateCurrentProfileText() {
  const profileText = document.getElementById("currentProfileText");
  if (!profileText) {
    return;
  }

  if (!currentUserProfile) {
    profileText.textContent = "Not selected";
    return;
  }

  profileText.textContent = `${currentUserProfile.avatar} ${currentUserProfile.name} (${currentUserProfile.id})`;
}

function getMyGarden() {
  return myGardenData ? myGardenData.flowers : [];
}

function getCurrentViewedUserId() {
  return viewMode === "friend" ? currentVisitedFriendId : getCurrentUserId();
}

function applyViewedGardenData(gardenData) {
    currentViewedGardenData = gardenData;
    currentGardenView = gardenData
      ? gardenData.flowers || []
      : [];
  
 
    window.currentGardenView = currentGardenView;
    window.currentViewedGardenData = currentViewedGardenData;
  
    if (!currentGardenView.length) {
      selectedFlowerId = null;
      return;
    }
  
    if (
      selectedFlowerId !== null &&
      currentGardenView.some(
        (flower) => flower.id === selectedFlowerId
      )
    ) {
      return;
    }
  
    selectedFlowerId = null;
}

function applyMyGardenData(gardenData) {
  myGardenData = gardenData;
}

function updateFriendInfo() {
  const friendInfo = document.getElementById("friendInfo");
  const friendMood = document.getElementById("friendMood");
  const friendTodayFlower = document.getElementById("friendTodayFlower");

  if (viewMode !== "friend") {
    if (friendInfo) {
      friendInfo.style.display = "none";
    }
    return;
  }

  if (friendInfo) {
    friendInfo.style.display = "block";
  }

  if (!currentGardenView || currentGardenView.length === 0) {
    if (friendMood) {
      friendMood.textContent = "Mood: Unknown";
    }
    if (friendTodayFlower) {
      friendTodayFlower.textContent = "Today's flower: None";
    }
    return;
  }

  const latest = currentGardenView[currentGardenView.length - 1];

  if (friendMood) {
    friendMood.textContent = `Mood: ${latest.mood}`;
  }

  if (friendTodayFlower) {
    friendTodayFlower.textContent = `Today's flower: ${latest.name}`;
  }
}

function renderVisitRecords() {
    const recordsDiv = document.getElementById("visitRecords");

  if (!recordsDiv) {
    return;
  }

  const records = myGardenData
    ? myGardenData.visitRecords || []
    : [];

  recordsDiv.innerHTML = "";

  if (!records.length) {
    recordsDiv.innerHTML = `
      <p class="empty-message">
        No visitors yet 🌱
      </p>
    `;
    return;
  }

  records.forEach((record) => {
    const item = document.createElement("div");
    item.className = "visit-record-item";

    const avatar = record.visitorAvatar || "🦋";
    const name = record.visitorName || "Someone";
    const action = record.action || "";

    let actionText = action;

    if (
      action === "started visiting your garden" ||
      action === "visit"
    ) {
      actionText = "started visiting your garden";
    } else if (
      action === "left your garden" ||
      action === "leave"
    ) {
      actionText = "left your garden";
    } else if (action === "support") {
      actionText = "gave you support ×1";
    } else if (action.startsWith("message:")) {
      const messageText = action.slice("message:".length).trim();

      actionText = messageText
        ? `left a message: ${messageText}`
        : "left a message";
    }

    const text = document.createElement("p");
    text.className = "visit-record-text";

    const visitorName = document.createElement("strong");
    visitorName.textContent = `${avatar} ${name}`;

    text.appendChild(visitorName);
    text.appendChild(
      document.createTextNode(` ${actionText}`)
    );

    const time = document.createElement("p");
    time.className = "visit-record-time";

    const createdAt = new Date(record.createdAt);

    time.textContent = Number.isNaN(createdAt.getTime())
      ? ""
      : createdAt.toLocaleString();

    item.appendChild(text);
    item.appendChild(time);
    recordsDiv.appendChild(item);
  });
  }

function renderHostVisitors(activeVisitors) {
  const gardenDiv = document.getElementById("garden");
  if (!gardenDiv) {
    return;
  }

  gardenDiv.querySelectorAll(".host-visitor").forEach((node) => node.remove());

  if (viewMode !== "mine" || !Array.isArray(activeVisitors)) {
    return;
  }

  activeVisitors.forEach((visitor) => {
    const el = document.createElement("div");
    el.className = "host-visitor";
    el.dataset.visitorId = String(visitor.visitorId);
    el.textContent = visitor.avatar || "🦋";
    el.style.left = `${typeof visitor.x === "number" ? visitor.x : 0}px`;
    el.style.top = `${typeof visitor.y === "number" ? visitor.y : 0}px`;
    el.title = visitor.name || "Visitor";

    gardenDiv.appendChild(el);
  });
}

async function refreshMineOnly() {
  const gardenData = await fetchGarden(getCurrentUserId());

  applyMyGardenData(gardenData);
  applyViewedGardenData(gardenData);

  const me = getCurrentUser();
  updateGardenTitle(me ? `${me.name}'s Garden` : "Your Garden");

  updateFriendInfo();
  renderDecorations()
  renderGarden();
  renderVisitRecords();
  renderHostVisitors(gardenData.activeVisitors || []);
  renderTodayFlower();
}

async function refreshCurrentView() {
  const viewedUserId = getCurrentViewedUserId();

  if (!viewedUserId) {
    return;
  }

  const requests = [fetchGarden(viewedUserId)];

  if (viewedUserId !== getCurrentUserId()) {
    requests.push(fetchGarden(getCurrentUserId()));
  }

  const [viewedGarden, ownGarden] = await Promise.all(requests);

  applyViewedGardenData(viewedGarden);

  if (ownGarden) {
    applyMyGardenData(ownGarden);
  } else {
    applyMyGardenData(viewedGarden);
  }

  if (viewMode === "mine") {
    const me = getCurrentUser();
    updateGardenTitle(me ? `${me.name}'s Garden` : "Your Garden");
  } else if (viewedGarden && viewedGarden.owner) {
    updateGardenTitle(`${viewedGarden.owner.name}'s Garden`);
  }

  updateFriendInfo();
  renderDecorations()
  renderGarden();
  renderVisitRecords();

  if (viewMode === "friend") {
    if (typeof createVisitorAvatar === "function" && avatarEl) {
      const gardenDiv = document.getElementById("garden");
      if (gardenDiv && avatarEl.parentNode !== gardenDiv) {
        gardenDiv.appendChild(avatarEl);
      }
    }

    if (typeof checkNearbyFlower === "function") {
      checkNearbyFlower();
    }
  }

  const hostVisitorSource =
    viewMode === "mine"
      ? viewedGarden.activeVisitors || []
      : (myGardenData && myGardenData.activeVisitors) || [];

  renderHostVisitors(hostVisitorSource);
  renderTodayFlower();
}

async function refreshSocialPanels() {
  if (!getCurrentUserId()) {
    return;
  }

  await renderFriendsList();

  if (viewMode === "friend" && currentVisitedFriendId) {
    const friends = await fetchFriends(getCurrentUserId());
    const stillFriend = friends.some((friend) => friend.id === currentVisitedFriendId);

    if (!stillFriend) {
      await loadMyGarden();
    }
  }
}

function flowerDataChanged(oldFlowers, newFlowers) {
    if (!Array.isArray(oldFlowers) || !Array.isArray(newFlowers)) {
      return true;
    }
  
    if (oldFlowers.length !== newFlowers.length) {
      return true;
    }
  
    for (let i = 0; i < oldFlowers.length; i += 1) {
      const oldFlower = oldFlowers[i];
      const newFlower = newFlowers[i];
  
      if (String(oldFlower.id) !== String(newFlower.id)) {
        return true;
      }
    }
  
    return false;
  }

function startPolling() {
    stopPolling();
  
    pollTimer = setInterval(async () => {
      try {
        const userId = getCurrentUserId();
  
        if (!userId) {
          return;
        }
  
        if (viewMode === "mine") {
          const gardenData = await fetchGarden(userId);
  
          const shouldUpdateFlowers = flowerDataChanged(
            currentGardenView,
            gardenData.flowers || []
          );
  
          applyMyGardenData(gardenData);
  
          if (shouldUpdateFlowers) {
            applyViewedGardenData(gardenData);
  
            
            renderGarden();
            renderTodayFlower();
          }
  
          
          renderHostVisitors(
            Array.isArray(gardenData.activeVisitors)
              ? gardenData.activeVisitors
              : []
          );
  
          renderVisitRecords();
          return;
        }
  
        if (
          viewMode === "friend" &&
          currentVisitedFriendId
        ) {
          const viewedGarden = await fetchGarden(
            currentVisitedFriendId
          );
  
          const shouldUpdateFlowers = flowerDataChanged(
            currentGardenView,
            viewedGarden.flowers || []
          );
  
          if (shouldUpdateFlowers) {
            applyViewedGardenData(viewedGarden);
  
            renderGarden();
            renderTodayFlower();
  
           
            if (avatarEl) {
              const gardenDiv =
                document.getElementById("garden");
  
              if (
                gardenDiv &&
                avatarEl.parentNode !== gardenDiv
              ) {
                gardenDiv.appendChild(avatarEl);
              }
  
              avatarEl.style.left = `${avatarX}px`;
              avatarEl.style.top = `${avatarY}px`;
            }
          }
  
          if (typeof checkNearbyFlower === "function") {
            checkNearbyFlower();
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, POLL_INTERVAL);
  }

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function submitMood(mood, eventText) {
  await createFlowerForUser(getCurrentUserId(), mood, eventText);

  viewMode = "mine";
  currentVisitedFriendId = null;
  friendMode = false;
  document.body.classList.remove("friend-mode");

  if (avatarEl) {
    avatarEl.remove();
    avatarEl = null;
  }

  activeFlowerId = null;
  selectedFlowerId = null;

  await refreshMineOnly();

  const eventInput = document.getElementById("eventInput");
  const moodSelect = document.getElementById("moodSelect");

  if (eventInput) {
    eventInput.value = "";
  }

  if (moodSelect) {
    moodSelect.value = "";
  }
}

async function loadMyGarden() {
  viewMode = "mine";
  currentVisitedFriendId = null;
  friendMode = false;
  joinGardenRoom(getCurrentUserId());

  document.body.classList.remove("friend-mode");
  const friendSection = document.getElementById("friendSection");
  if (friendSection) {
    friendSection.style.display = "none";
  }

  if (avatarEl) {
    avatarEl.remove();
    avatarEl = null;
  }

  activeFlowerId = null;
  selectedFlowerId = null;

  await refreshMineOnly();
}

async function showMyGarden() {
  if (viewMode === "friend" && currentVisitedFriendId) {
    try {
      await leaveVisit(currentVisitedFriendId, getCurrentUserId());
    } catch (err) {
      console.error("Leave visit error:", err);
    }
  }

  await loadMyGarden();
}

async function openFriendGardenById(friendId) {
  const friends = await fetchFriends(getCurrentUserId());
  const friend = friends.find((item) => item.id === friendId);

  if (!friend) {
    return;
  }

  if (viewMode === "friend" && currentVisitedFriendId && currentVisitedFriendId !== friendId) {
    try {
      await leaveVisit(currentVisitedFriendId, getCurrentUserId());
    } catch (err) {
      console.error("Leave previous friend garden error:", err);
    }
  }

  currentVisitedFriendId = friendId;
  viewMode = "friend";
  friendMode = true;
  selectedFlowerId = null;
  joinGardenRoom(friendId);

  document.body.classList.add("friend-mode");

  const friendSection = document.getElementById("friendSection");
  if (friendSection) {
    friendSection.style.display = "block";
  }

  avatarX = 120;
  avatarY = 520;
  activeFlowerId = null;

  await startVisit(friendId, getCurrentUserId(), avatarX, avatarY);
  await refreshCurrentView();

  if (typeof createVisitorAvatar === "function") {
    createVisitorAvatar();
    checkNearbyFlower();
  }
}

async function addFriend(friendId) {
  const res = await fetch("/friends/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: getCurrentUserId(),
      friendId
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to add friend");
  }

  return data;
}

async function removeFriend(friendId) {
  const res = await fetch("/friends/remove", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: getCurrentUserId(),
      friendId
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to remove friend");
  }

  return data;
}



async function renderFriendsList() {
  const friendsListDiv = document.getElementById("friendsList");
  if (!friendsListDiv) {
    return;
  }

  friendsListDiv.innerHTML = "";

  try {
    const friends = await fetchFriends(getCurrentUserId());

    if (!friends || friends.length === 0) {
      friendsListDiv.innerHTML = `<p class="empty-message">No friends yet 🌱</p>`;
      return;
    }

    friends.forEach((friend) => {
      const item = document.createElement("div");
      item.className = "friend-item";

      const infoDiv = document.createElement("div");
      infoDiv.innerHTML = `
        <div class="friend-name">${friend.avatar} ${friend.name}</div>
      `;

      const actionGroup = document.createElement("div");
      actionGroup.style.display = "flex";
      actionGroup.style.gap = "8px";
      actionGroup.style.flexWrap = "wrap";
      actionGroup.style.justifyContent = "flex-end";

      const openBtn = document.createElement("button");
      openBtn.className = "friend-open-btn";
      openBtn.textContent = "Visit";

      openBtn.addEventListener("click", async () => {
        try {
          await openFriendGardenById(friend.id);
        } catch (err) {
          console.error("Open friend garden error:", err);
        }
      });

      const removeBtn = document.createElement("button");
      removeBtn.className = "friend-open-btn";
      removeBtn.textContent = "Remove";

      removeBtn.addEventListener("click", async () => {
        try {
          await removeFriend(friend.id);

          if (viewMode === "friend" && currentVisitedFriendId === friend.id) {
            await loadMyGarden();
          }

          //await renderAddFriendOptions();
          await renderFriendsList();
        } catch (err) {
          console.error("Remove friend error:", err);
          alert("Failed to remove friend");
        }
      });

      actionGroup.appendChild(openBtn);
      actionGroup.appendChild(removeBtn);

      item.appendChild(infoDiv);
      item.appendChild(actionGroup);
      friendsListDiv.appendChild(item);
    });
  } catch (err) {
    console.error("Friends render error:", err);
    friendsListDiv.innerHTML = `<p class="empty-message">Failed to load friends</p>`;
  }
}

function setupSubmitButton() {
  const submitBtn = document.getElementById("submitBtn");
  if (!submitBtn) {
    return;
  }

  submitBtn.addEventListener("click", async () => {
    try {
      const moodSelect = document.getElementById("moodSelect");
      const eventInput = document.getElementById("eventInput");

      const eventText = eventInput ? eventInput.value.trim() : "";
      let mood = moodSelect ? moodSelect.value : "";

      if (!mood && eventText) {
        mood = analyzeMoodFromText(eventText);
      }

      if (!mood) {
        alert("Please write what happened today or choose your mood 🌼");
        return;
      }

      await submitMood(mood, eventText);
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to bloom a flower");
    }
  });
}
function setupVisitorChoices() {
    const visitorButtons = document.querySelectorAll(".visitor-choice");
    const selectedVisitorText = document.getElementById("selectedVisitorText");
  
    visitorButtons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const avatar = btn.dataset.avatar;
  
        setVisitorAvatar(avatar);
  
        visitorButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
  
        if (selectedVisitorText) {
          selectedVisitorText.textContent = `Current form: ${avatar}`;
        }
  
        if (viewMode === "friend" && currentVisitedFriendId) {
          if (!avatarEl && typeof createVisitorAvatar === "function") {
            createVisitorAvatar();
          }
  
          if (avatarEl) {
            avatarEl.textContent = avatar;
          }
  
          try {
            await moveVisit(currentVisitedFriendId, getCurrentUserId(), avatarX, avatarY);
          } catch (err) {
            console.error("Avatar update move error:", err);
          }
  
          if (typeof checkNearbyFlower === "function") {
            checkNearbyFlower();
          }
        }
      });
    });
  
    const defaultBtn = Array.from(visitorButtons).find(
      (btn) => btn.dataset.avatar === getSelectedVisitorAvatar()
    );
  
    if (defaultBtn) {
      defaultBtn.classList.add("active");
    }
  }

function setupGardenSwitchButtons() {
  const backMyGardenBtn = document.getElementById("backMyGardenBtn");

  if (backMyGardenBtn) {
    backMyGardenBtn.addEventListener("click", async () => {
      try {
        await showMyGarden();
      } catch (err) {
        console.error("Back to my garden error:", err);
      }
    });
  }
}
function setFriendSearchMessage(message, isError = false) {
    const messageElement =
      document.getElementById("friendSearchMessage");
  
    if (!messageElement) {
      return;
    }
  
    messageElement.textContent = message;
    messageElement.style.color = isError ? "#c0392b" : "";
  }
  
  async function searchFriendsByName(name) {
    const currentUserId = getCurrentUserId();
  
    if (!currentUserId) {
      throw new Error("Please log in first");
    }
  
    const params = new URLSearchParams({
      name,
      currentUserId
    });
  
    const res = await fetch(
      `/users/search?${params.toString()}`
    );
  
    const data = await res.json();
  
    if (!res.ok) {
      throw new Error(
        data.error || "Failed to search users"
      );
    }
  
    return data;
  }
  
  function renderFriendSearchResults(users) {
    const resultsDiv =
      document.getElementById("friendSearchResults");
  
    if (!resultsDiv) {
      return;
    }
  
    resultsDiv.innerHTML = "";
  
    if (!users || users.length === 0) {
      resultsDiv.innerHTML = `
        <p class="empty-message">
          No matching users found 🌱
        </p>
      `;
      return;
    }
  
    users.forEach((user) => {
      const item = document.createElement("div");
      item.className = "friend-item";
  
      const userInfo = document.createElement("div");
      userInfo.className = "friend-name";
      userInfo.textContent =
        `${user.avatar || "🦋"} ${user.name}`;
  
      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.className = "friend-open-btn";
      addButton.textContent = "Add Friend";
  
      addButton.addEventListener("click", async () => {
        addButton.disabled = true;
        addButton.textContent = "Adding...";
  
        try {
          await addFriend(user.id);
  
          setFriendSearchMessage(
            `${user.name} added successfully!`
          );
  
          item.remove();
          await renderFriendsList();
        } catch (err) {
          console.error("Add friend error:", err);
  
          setFriendSearchMessage(
            err.message || "Failed to add friend",
            true
          );
  
          addButton.disabled = false;
          addButton.textContent = "Add Friend";
        }
      });
  
      item.appendChild(userInfo);
      item.appendChild(addButton);
      resultsDiv.appendChild(item);
    });
  }
  
  function setupFriendSearch() {
    const searchInput =
      document.getElementById("friendSearchInput");
  
    const searchButton =
      document.getElementById("friendSearchBtn");
  
    if (!searchInput || !searchButton) {
      return;
    }
  
    async function performSearch() {
      const name = searchInput.value.trim();
  
      setFriendSearchMessage("");
  
      const resultsDiv =
        document.getElementById("friendSearchResults");
  
      if (resultsDiv) {
        resultsDiv.innerHTML = "";
      }
  
      if (!name) {
        setFriendSearchMessage(
          "Please enter a friend's name.",
          true
        );
        return;
      }
  
      searchButton.disabled = true;
      searchButton.textContent = "Searching...";
  
      try {
        const users = await searchFriendsByName(name);
  
        renderFriendSearchResults(users);
  
        if (users.length > 0) {
          setFriendSearchMessage(
            `${users.length} user${
              users.length === 1 ? "" : "s"
            } found.`
          );
        }
      } catch (err) {
        console.error("Friend search error:", err);
  
        setFriendSearchMessage(
          err.message || "Failed to search users",
          true
        );
      } finally {
        searchButton.disabled = false;
        searchButton.textContent = "Search";
      }
    }
  
    searchButton.addEventListener("click", performSearch);
  
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        performSearch();
      }
    });
  }




function setupBeforeUnload() {
  window.addEventListener("beforeunload", () => {
    if (viewMode === "friend" && currentVisitedFriendId) {
      fetch("/leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          hostUserId: currentVisitedFriendId,
          visitorUserId: getCurrentUserId(),
          visitorAvatar: getSelectedVisitorAvatar()
        }),
        keepalive: true
      }).catch(() => {});
    }
  });
}

async function init() {
    try {
     
      setupLogin();
  
      setupFriendSearch();
      setupSubmitButton();
      setupVisitorChoices();
      setupGardenSwitchButtons();
      setupBeforeUnload();
  
      if (typeof setupGardenClickMove === "function") {
        setupGardenClickMove();
      }
  
      if (typeof setupFriendFlowerActions === "function") {
        setupFriendFlowerActions();
      }
  
     
      if (!getCurrentUserId()) {
        currentUserProfile = null;
        showAuthMode();
        return;
      }
  
     
      try {
        currentUserProfile = await fetchUser(getCurrentUserId());
      } catch (err) {
        console.error(
          "Invalid saved user, returning to auth mode:",
          err
        );
  
        clearCurrentUserId();
        currentUserProfile = null;
        showAuthMode();
        return;
      }
  
     
      showAppMode();
      updateCurrentProfileText();
  
      await renderFriendsList();
      await loadMyGarden();
  
      startPolling();
    } catch (err) {
      console.error("Init error:", err);
      alert("Failed to initialize app");
    }
  }

if (typeof window !== "undefined") {
  window.onload = init;
}

function showAuthMode() {
  const authSection = document.getElementById("authSection");
  const rightPanel = document.querySelector(".right-panel");

  if (authSection) authSection.style.display = "block";
  if (rightPanel) rightPanel.style.display = "none";

  [
    "currentProfileSection",
    "friendManageSection",
    "friendsListSection",
    "friendSection",
    "visitRecordsSection",
    "visitorSection",
    "todayFlower"
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const checkin = document.querySelector(".checkin-section");
  if (checkin) checkin.style.display = "none";
  
}

function showAppMode() {
  const authSection = document.getElementById("authSection");
  const rightPanel = document.querySelector(".right-panel");

  if (authSection) authSection.style.display = "none";
  if (rightPanel) rightPanel.style.display = "block";

  [
    "currentProfileSection",
    "friendManageSection",
    "friendsListSection",
    "visitRecordsSection",
    "visitorSection",
    "todayFlower"
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "block";
  });

  const friendSection = document.getElementById("friendSection");
  if (friendSection) {
    friendSection.style.display = "none";
  }

  const checkin = document.querySelector(".checkin-section");
  if (checkin) checkin.style.display = "block";
}


function __setMainTestState(patch) {
  if ("currentGardenView" in patch) currentGardenView = patch.currentGardenView;
  if ("currentViewedGardenData" in patch) currentViewedGardenData = patch.currentViewedGardenData;
  if ("myGardenData" in patch) myGardenData = patch.myGardenData;
  if ("currentVisitedFriendId" in patch) currentVisitedFriendId = patch.currentVisitedFriendId;
  if ("viewMode" in patch) viewMode = patch.viewMode;
  if ("selectedFlowerId" in patch) selectedFlowerId = patch.selectedFlowerId;
  if ("isAddFriendSelectOpen" in patch) isAddFriendSelectOpen = patch.isAddFriendSelectOpen;

  if ("currentUserProfile" in patch) {
    currentUserProfile = patch.currentUserProfile;
  }
}

function __getMainTestState() {
  return {
    currentGardenView,
    currentViewedGardenData,
    myGardenData,
    currentVisitedFriendId,
    viewMode,
    selectedFlowerId,
    isAddFriendSelectOpen,
    currentUserProfile
  };
}

/*if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    updateGardenTitle,
    updateCurrentProfileText,
    getMyGarden,
    getCurrentViewedUserId,
    applyViewedGardenData,
    applyMyGardenData,
    updateFriendInfo,
    renderVisitRecords,
    renderHostVisitors,
    showAuthMode,
    showAppMode,
    setupAddFriendSelectLock,
    __setMainTestState,
    __getMainTestState,
    refreshSocialPanels,
    startPolling,
    stopPolling,
    loadMyGarden,
    showMyGarden,
    setupGardenSwitchButtons,
    setupSubmitButton,
    //setupCreateUserButton,
    setupAddFriendButton
  };
}
*/